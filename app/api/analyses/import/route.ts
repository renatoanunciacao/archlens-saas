import { analyses, projects } from "@/app/db/schema";

import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return new Response(
        JSON.stringify({ error: "File and projectId are required" }),
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project || project.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    // Parse JSON file
    const text = await file.text();
    const reportJson = JSON.parse(text);

    // Extract data from JSON
    const healthScore = reportJson.arch_health_score || 0;
    const healthGrade = reportJson.arch_health_status || "Unknown";
    const fitScore = reportJson.architecture_fit_score;
    const fitStatus = reportJson.architecture_fit_status;

    // Save to database
    const analysisId = randomUUID();
    await db.insert(analyses).values({
      id: analysisId,
      projectId,
      structuralHealthScore: healthScore,
      structuralHealthGrade: healthGrade,
      architectureFitScore: fitScore,
      architectureFitStatus: fitStatus,
      reportJson: reportJson,
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysisId,
        healthScore,
        healthGrade,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error importing JSON:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON format" }),
      { status: 400 }
    );
  }
}
