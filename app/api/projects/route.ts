import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { projects, usageLimits } from "../../db/schema";

import { authOptions } from "../../lib/auth";
import { db } from "../../db";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, session.user.id))
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const provider = body.provider ? String(body.provider) : null;
    const repoUrl = body.repoUrl ? String(body.repoUrl) : null;
    const branch = body.branch ? String(body.branch) : null;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Check usage limit
    const [usage] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.userId, userId));

    if (usage && usage.projectsCount >= usage.maxProjects) {
      return NextResponse.json(
        {
          error: `Você atingiu o limite de ${usage.maxProjects} projetos para seu plano`,
        },
        { status: 403 },
      );
    }

    // Extract repo name from URL
    const repoName = repoUrl?.split("/").pop()?.replace(".git", "") || null;

    const inserted = await db
      .insert(projects)
      .values({
        userId,
        name,
        provider,
        repoUrl,
        repoName,
        branch,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update usage count
    if (usage) {
      await db
        .update(usageLimits)
        .set({
          projectsCount: (usage.projectsCount || 0) + 1,
        })
        .where(eq(usageLimits.userId, userId));
    }

    return NextResponse.json({ project: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}