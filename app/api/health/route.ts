import { NextResponse } from "next/server";
import { db } from "../../db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        database: "disconnected",
      },
      { status: 500 },
    );
  }
}