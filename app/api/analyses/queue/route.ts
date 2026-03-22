import { NextRequest, NextResponse } from 'next/server';
import { analysisJobs, projects } from '@/app/db/schema';

import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { processAnalysisJob } from '@/app/lib/analysis-worker';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq(projects.id, projectId as any));

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create job
    const [job] = await db
      .insert(analysisJobs)
      .values({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projectId: projectId as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userId: session.user.id as any,
        status: 'pending',
        progress: 0,
        message: 'Aguardando processamento...',
      })
      .returning();

    // Process job asynchronously (fire and forget)
    // In production, use a proper job queue (Bull, RabbitMQ, etc)
    void processAnalysisJob(job.id as string).catch((err) => {
      console.error(`Job ${job.id} failed:`, err);
    });

    return NextResponse.json(
      { jobId: job.id, message: 'Analysis queued successfully' },
      { status: 202 }
    );
  } catch (error) {
    console.error('[/api/analyses/queue] Error:', error);
    return NextResponse.json(
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
