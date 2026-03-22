import { analyses, projects, usageLimits } from "@/app/db/schema";

import { authOptions } from "@/app/lib/auth";
import { db } from "@/app/db";
import { eq } from "drizzle-orm";
import { exec } from "child_process";
import { getServerSession } from "next-auth";
import { join } from "path";
import { promisify } from "util";
import { randomUUID } from "crypto";
import { rm } from "fs/promises";
import { tmpdir } from "os";

const execAsync = promisify(exec);

interface ArchLensReport {
  arch_health_score?: number;
  arch_health_status?: string;
  architecture_fit_score?: number;
  architecture_fit_status?: string;
  files_analyzed?: number;
  cycles_count?: number;
  top_fan_in?: Array<{ module: string; count: number }>;
  top_fan_out?: Array<{ module: string; count: number }>;
  danger_hotspots?: Array<{ module: string; in: number; out: number }>;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  let tempRepoPath: string | null = null;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "projectId is required" }),
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project || !project.repoUrl) {
      return new Response(
        JSON.stringify({
          error: "Project not found or repository URL not configured",
        }),
        { status: 404 }
      );
    }

    // Check usage limits
    const [usage] = await db
      .select()
      .from(usageLimits)
      .where(eq(usageLimits.userId, session.user.id));

    if (usage && usage.analysesCountMonth >= usage.maxAnalysesPerMonth) {
      return new Response(
        JSON.stringify({ error: "Monthly analysis limit reached" }),
        { status: 429 }
      );
    }

    // Create temporary directory
    const tempDirPrefix = `archlens-${projectId}-`;
    tempRepoPath = join(tmpdir(), tempDirPrefix + Date.now());

    console.log(`📁 Creating temp directory: ${tempRepoPath}`);

    // Clone repository
    try {
      await execAsync(`git clone "${project.repoUrl}" "${tempRepoPath}"`, {
        timeout: 120000, // 2 minutes for clone
        maxBuffer: 10 * 1024 * 1024,
      });
      console.log(`✅ Repository cloned successfully`);
    } catch (error) {
      console.error("Git clone error:", error);
      return new Response(
        JSON.stringify({
          error:
            "Failed to clone repository. Ensure the URL is valid and accessible.",
        }),
        { status: 400 }
      );
    }

    // Install dependencies (try npm first, then yarn)
    // Note: We'll install full deps, not just --production, for ArchLens to work properly
    try {
      console.log(`📦 Installing dependencies...`);
      const packageJsonPath = join(tempRepoPath, "package.json");

      // Check if package.json exists
      try {
        const { stdout: checkFile } = await execAsync(
          `test -f "${packageJsonPath}" && echo "exists" || echo "missing"`,
          { timeout: 10000 }
        );

        if (checkFile.trim() === "exists") {
          try {
            // Try npm install (without --production to get all deps ArchLens might need)
            console.log(`  Attempting npm install...`);
            await execAsync(`cd "${tempRepoPath}" && npm install --no-save`, {
              timeout: 300000, // 5 minutes
              maxBuffer: 50 * 1024 * 1024,
            });
            console.log(`✅ Dependencies installed with npm`);
          } catch (npmError) {
            console.warn(`⚠️ npm install failed:`, npmError instanceof Error ? npmError.message : String(npmError));
            // Fallback to yarn
            try {
              console.log(`  Attempting yarn install...`);
              await execAsync(`cd "${tempRepoPath}" && yarn install`, {
                timeout: 300000,
                maxBuffer: 50 * 1024 * 1024,
              });
              console.log(`✅ Dependencies installed with yarn`);
            } catch (yarnError) {
              console.warn(`⚠️ yarn install also failed:`, yarnError instanceof Error ? yarnError.message : String(yarnError));
              console.log(`ℹ️ Continuing without full dependency install - ArchLens may still work for basic analysis`);
            }
          }
        } else {
          console.log(`ℹ️ No package.json found, skipping dependency installation`);
        }
      } catch (checkError) {
        console.warn(`⚠️ Could not check for package.json:`, checkError instanceof Error ? checkError.message : String(checkError));
      }
    } catch (error) {
      console.warn(`⚠️ Dependency installation section error:`, error);
    }

    // Run archlens analysis
    let archLensOutput: ArchLensReport = {
      arch_health_score: 0,
      arch_health_status: "UNKNOWN",
    };
    try {
      console.log(`🔍 Running ArchLens analysis...`);
      
      // First, check if archlens is available
      try {
        const { stdout: version } = await execAsync(`npx archlens --version`, { timeout: 10000 });
        const versionStr = version.trim();
        console.log(`ArchLens version: ${versionStr}`);
        
        // Warn if not 0.3.4
        if (!versionStr.includes("0.3.4")) {
          console.warn(`⚠️ WARNING: Expected ArchLens 0.3.4, but found ${versionStr}`);
          console.warn(`⚠️ Please install the correct version with: npm install archlens@0.3.4`);
        }
      } catch (versionError) {
        console.warn(`⚠️ Could not check ArchLens version:`, versionError instanceof Error ? versionError.message : String(versionError));
        console.warn(`⚠️ Please ensure ArchLens is installed with: npm install archlens@0.3.4`);
      }

      const { stdout, stderr } = await execAsync(
        `cd "${tempRepoPath}" && npx archlens analyze .`,
        { timeout: 180000, maxBuffer: 50 * 1024 * 1024, shell: "/bin/bash" }
      );
      
      // Log for debugging
      console.log(`📝 ArchLens stdout length: ${stdout.length}`);
      console.log(`📝 ArchLens stderr length: ${stderr?.length || 0}`);
      if (stdout.length < 1000) {
        console.log(`📝 ArchLens stdout:\n${stdout}`);
      }

      // Try to parse ArchLens output
      // First, check if ArchLens wrote to a JSON file
      let reportPath: string | null = null;
      const reportMatch = stdout.match(/Report written to\s+(\S+\.json)/i);
      if (reportMatch && reportMatch[1]) {
        reportPath = reportMatch[1];
        console.log(`📄 Found report file path: ${reportPath}`);
      }

      // Try to read from file if it was generated
      if (reportPath) {
        try {
          const { stdout: fileContent } = await execAsync(`cat "${reportPath}"`, {
            timeout: 10000,
            maxBuffer: 50 * 1024 * 1024,
          });
          console.log(`✅ Read report from file: ${reportPath}`);
          archLensOutput = JSON.parse(fileContent);
          console.log(`✅ Successfully parsed JSON from file`);
        } catch (fileError) {
          console.warn(
            `⚠️ Could not read report from file:`,
            fileError instanceof Error ? fileError.message : String(fileError)
          );
          // Fall through to try parsing stdout
          reportPath = null;
        }
      }

      // If we didn't get JSON from file, try parsing stdout
      if (!reportPath) {
        // Try direct JSON parse first
        try {
          archLensOutput = JSON.parse(stdout.trim());
          console.log(`✅ Parsed JSON directly from stdout`);
        } catch {
          // Try to find JSON object in stdout
          const jsonMatches = stdout.match(/\{[\s\S]*\}/g);
          let parsed = false;

          if (jsonMatches && jsonMatches.length > 0) {
            // Try parsing from the last match backwards
            for (let i = jsonMatches.length - 1; i >= 0; i--) {
              try {
                archLensOutput = JSON.parse(jsonMatches[i]);
                parsed = true;
                console.log(`✅ Parsed JSON from match ${i + 1}/${jsonMatches.length}`);
                break;
              } catch {
                continue;
              }
            }
          }

          // If JSON parsing failed, try to parse text output from ArchLens 0.2.x
          if (!parsed) {
            console.log(`📝 Attempting to parse text-format ArchLens output...`);
            try {
              // Extract score from "Architecture Health Score: 100/100 (A)"
              const scoreMatch = stdout.match(/Architecture Health Score:\s*(\d+)\/100\s*\(([A-F])\)/i);
              const scoreValue = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
              const scoreGrade = scoreMatch ? scoreMatch[2] : "Unknown";

              // Extract status from "Status: Healthy"
              const statusMatch = stdout.match(/Status:\s*(.+?)(?:\n|$)/i);
              const status = statusMatch ? statusMatch[1].trim() : "Unknown";

              // Extract cycles from "Cycles detected: 0"
              const cyclesMatch = stdout.match(/Cycles detected:\s*(\d+)/i);
              const cycles = cyclesMatch ? parseInt(cyclesMatch[1], 10) : 0;

              // Extract files from "Files analyzed: 0"
              const filesMatch = stdout.match(/Files analyzed:\s*(\d+)/i);
              const files = filesMatch ? parseInt(filesMatch[1], 10) : 0;

              // Extract violations from "Architecture Rules\nViolations: 0"
              const violationsMatch = stdout.match(/Violations:\s*(\d+)/i);
              const violations = violationsMatch ? parseInt(violationsMatch[1], 10) : 0;

              archLensOutput = {
                arch_health_score: scoreValue,
                arch_health_status: scoreGrade,
                status: status,
                cycles_count: cycles,
                files_analyzed: files,
                violations: violations,
              };

              console.log(`✅ Successfully parsed text-format ArchLens output`);
              parsed = true;
            } catch (textParseError) {
              console.error(
                `❌ Failed to parse text output:`,
                textParseError instanceof Error ? textParseError.message : String(textParseError)
              );
            }
          }

          // If all parsing failed, throw error
          if (!parsed) {
            throw new Error(
              `Could not parse ArchLens output. Output length: ${stdout.length}. Format: ${stdout.substring(0, 150)}`
            );
          }
        }
      }

      console.log(`✅ Analysis completed successfully`);
    } catch (error) {
      console.error("ArchLens execution error:", error);
      
      // Create fallback report with error info
      const errorMsg = error instanceof Error ? error.message : "Analysis failed";
      archLensOutput = {
        arch_health_score: 0,
        arch_health_status: "ERROR",
        note: "ArchLens analysis failed",
        error: errorMsg,
      };
      
      console.log(`⚠️ Using fallback error report`);
    }

    // Extract scores and data
    const healthScore = archLensOutput.arch_health_score || 0;
    const healthGrade = archLensOutput.arch_health_status || "Unknown";
    const fitScore = archLensOutput.architecture_fit_score;
    const fitStatus = archLensOutput.architecture_fit_status;

    // Save to database
    const analysisId = randomUUID();
    await db.insert(analyses).values({
      id: analysisId,
      projectId,
      structuralHealthScore: healthScore,
      structuralHealthGrade: healthGrade,
      architectureFitScore: fitScore,
      architectureFitStatus: fitStatus,
      reportJson: archLensOutput,
      createdAt: new Date(),
    });

    // Update usage limits
    if (usage) {
      await db
        .update(usageLimits)
        .set({ analysesCountMonth: (usage.analysesCountMonth || 0) + 1 })
        .where(eq(usageLimits.userId, session.user.id));
    }

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
    console.error("Error running analysis:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  } finally {
    // Clean up temporary directory
    if (tempRepoPath) {
      try {
        console.log(`🧹 Cleaning up temporary directory...`);
        await rm(tempRepoPath, { recursive: true, force: true });
        console.log(`✅ Cleanup completed`);
      } catch (cleanupError) {
        console.error("Cleanup error (non-critical):", cleanupError);
      }
    }
  }
}
