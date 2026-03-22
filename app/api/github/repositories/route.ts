import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get the GitHub account linked to this user
    const { db } = await import("@/app/db");
    const { accounts } = await import("@/app/db/schema");
    const { eq } = await import("drizzle-orm");

    const [githubAccount] = await db
      .select()
      .from(accounts)
      .where(
        eq(accounts.provider, "github")
      )
      .limit(1);

    if (!githubAccount?.access_token) {
      return new Response(
        JSON.stringify({ repositories: [], message: "No GitHub token found" }),
        { status: 200 }
      );
    }

    // Fetch repositories from GitHub API
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${githubAccount.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error("GitHub API error:", response.statusText);
      return new Response(
        JSON.stringify({ repositories: [], error: "Failed to fetch repositories" }),
        { status: 200 }
      );
    }

    const repos = await response.json();

    interface GitHubRepo {
      id: number;
      name: string;
      fork: boolean;
      html_url: string;
      owner: { login: string };
    }

    const repositories = (repos as GitHubRepo[])
      .filter((repo) => !repo.fork) // Exclude forks
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        url: repo.html_url,
        owner: repo.owner.login,
      }));

    return new Response(
      JSON.stringify({ repositories }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return new Response(
      JSON.stringify({ repositories: [], error: "Failed to fetch repositories" }),
      { status: 200 }
    );
  }
}
