import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const connection = await prisma.githubConnection.findUnique({
    where: { userId: session.user.id },
  });
  if (!connection) {
    return NextResponse.json(
      { error: "No GitHub connection found" },
      { status: 404 },
    );
  }

  const res = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner",
    {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errBody?.message || "Failed to fetch repos from GitHub" },
      { status: 502 },
    );
  }

  const repos = await res.json();

  const reShapedRepos = repos.map((r: any) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    private: r.private,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ repos: reShapedRepos });
});
