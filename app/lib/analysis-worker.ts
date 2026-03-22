import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { analyses, analysisJobProgress, analysisJobs, projects } from '@/app/db/schema';
import { desc, eq } from 'drizzle-orm';

import { db } from '@/app/db';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

interface JobProgressUpdate {
  step: number;
  stepName: string;
  progress: number;
  message: string;
}

async function updateJobProgress(jobId: string, update: JobProgressUpdate) {
  const newProgressId = crypto.randomUUID();
  await db.insert(analysisJobProgress).values({
    id: newProgressId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jobId: jobId as any,
    step: update.step,
    stepName: update.stepName,
    progress: update.progress,
    message: update.message,
  });

  // Update job status
  await db
    .update(analysisJobs)
    .set({
      progress: update.progress,
      message: update.message,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .where(eq(analysisJobs.id, jobId as any));
}

async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  data?: { analysisId?: string; error?: string }
) {
  const updates: Record<string, unknown> = { status };
  if (data?.analysisId) updates.analysisId = data.analysisId;
  if (data?.error) updates.error = data.error;
  if (status === 'processing') updates.startedAt = new Date();
  if (status === 'completed' || status === 'failed') updates.completedAt = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(analysisJobs).set(updates).where(eq(analysisJobs.id, jobId as any));
}

export async function processAnalysisJob(jobId: string) {
  try {
    // Get job details
    const [job] = await db
      .select()
      .from(analysisJobs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq(analysisJobs.id, jobId as any));

    if (!job) {
      throw new Error('Job not found');
    }

    // Get project details
    const [project] = await db
      .select()
      .from(projects)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq(projects.id, job.projectId as any));

    if (!project) {
      throw new Error('Project not found');
    }

    // Mark as processing
    await updateJobStatus(jobId, 'processing');

    // Step 1: Clone repo
    await updateJobProgress(jobId, {
      step: 1,
      stepName: 'cloning',
      progress: 10,
      message: '📥 Clonando repositório...',
    });

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archlens-'));
    const tempRepoPath = path.join(tempDir, 'repo');

    try {
      execSync(`git clone --depth 1 "${project.repoUrl}" "${tempRepoPath}"`, {
        timeout: 120000, // 2 minutes
        stdio: 'pipe',
      });
    } catch (cloneErr) {
      await updateJobProgress(jobId, {
        step: 1,
        stepName: 'cloning',
        progress: 10,
        message: '❌ Erro ao clonar repositório',
      });
      throw cloneErr;
    }

    // Step 2: Analyze with ArchLens
    await updateJobProgress(jobId, {
      step: 2,
      stepName: 'analyzing',
      progress: 30,
      message: '🔍 Analisando arquitetura...',
    });

    let reportJson: Record<string, unknown> = {};

    try {
      const output = execSync(
        'archlens analyze . --format json 2>&1',
        {
          cwd: tempRepoPath,
          timeout: 600000, // 10 minutes
          encoding: 'utf-8',
        }
      );

      // Try to parse JSON from output
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportJson = JSON.parse(jsonMatch[0]);
      }
    } catch (analysisErr) {
      // ArchLens might fail but still output JSON, try to parse from stdout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((analysisErr as any)?.stdout) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonMatch = (analysisErr as any).stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          reportJson = JSON.parse(jsonMatch[0]);
        } else {
          throw analysisErr;
        }
      } else {
        throw analysisErr;
      }
    }

    // Step 3: Parse and validate results
    await updateJobProgress(jobId, {
      step: 3,
      stepName: 'parsing',
      progress: 60,
      message: '📊 Processando resultados...',
    });

    const structuralHealthScore = reportJson.arch_health_score ?? 50;
    const structuralHealthGrade = reportJson.arch_health_status ?? 'C';

    // Step 4: Save to database
    await updateJobProgress(jobId, {
      step: 4,
      stepName: 'saving',
      progress: 80,
      message: '💾 Salvando análise...',
    });

    const analysisId = randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analysisRow: any = {
      projectId: String(project.id),
      structuralHealthScore: structuralHealthScore,
      structuralHealthGrade: structuralHealthGrade,
      architectureFitScore: reportJson.architecture_fit_score as number | undefined,
      architectureFitStatus: reportJson.architecture_fit_status as string | undefined,
      reportJson: reportJson,
    };
    await db
      .insert(analyses)
      .values(analysisRow);

    // Step 5: Complete
    await updateJobProgress(jobId, {
      step: 5,
      stepName: 'completed',
      progress: 100,
      message: '✅ Análise concluída com sucesso!',
    });

    // Mark job as completed
    await updateJobStatus(jobId, 'completed', { analysisId });

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    return { success: true, analysisId };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error(`[Job ${jobId}] Error:`, (error as any)?.message);

    // Update job with error
    await updateJobStatus(jobId, 'failed', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error as any)?.message || 'Unknown error occurred',
    });

    throw error;
  }
}

export async function getQueuedJobs(userId: string) {
  return db
    .select()
    .from(analysisJobs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .where(eq(analysisJobs.userId, userId as any))
    .orderBy(desc(analysisJobs.createdAt));
}

export async function getJobStatus(jobId: string) {
  const [job] = await db
    .select()
    .from(analysisJobs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .where(eq(analysisJobs.id, jobId as any));

  if (!job) return null;

  // Get progress history
  const progressHistory = await db
    .select()
    .from(analysisJobProgress)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .where(eq(analysisJobProgress.jobId, jobId as any))
    .orderBy(analysisJobProgress.createdAt);

  return {
    ...job,
    progressHistory,
  };
}
