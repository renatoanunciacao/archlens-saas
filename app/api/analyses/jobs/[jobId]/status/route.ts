import { NextResponse } from 'next/server';
import { analysisJobs } from '@/app/db/schema';
import { authOptions } from '@/app/lib/auth';
import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { getJobStatus } from '@/app/lib/analysis-worker';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    // Verify job ownership
    const [job] = await db
      .select()
      .from(analysisJobs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq(analysisJobs.id, jobId as any));

    if (!job || job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get full job status including progress history
    const jobStatus = await getJobStatus(jobId);

    return NextResponse.json({ job: jobStatus });
  } catch (error) {
    console.error('[/api/analyses/jobs/[jobId]/status] Error:', error);
    return NextResponse.json(
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error as any)?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
