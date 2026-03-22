import { NextRequest, NextResponse } from "next/server";

import { analyses } from "../../db/schema";
import { db } from "../../db";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const projectId = String(body.projectId ?? "").trim();
    const structuralHealthScore = Number(body.structuralHealthScore ?? 0);
    const structuralHealthGrade = String(body.structuralHealthGrade ?? "");
    const architectureFitScore =
      body.architectureFitScore == null ? null : Number(body.architectureFitScore);
    const architectureFitStatus =
      body.architectureFitStatus == null ? null : String(body.architectureFitStatus);
    const reportJson = body.reportJson;

    if (!projectId || !structuralHealthGrade || !reportJson) {
      return NextResponse.json(
        { error: "projectId, structuralHealthGrade and reportJson are required" },
        { status: 400 },
      );
    }

    const inserted = await db
      .insert(analyses)
      .values({
        id: randomUUID(),
        projectId,
        structuralHealthScore,
        structuralHealthGrade,
        architectureFitScore,
        architectureFitStatus,
        reportJson,
      })
      .returning();

    return NextResponse.json({ analysis: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 },
    );
  }
}