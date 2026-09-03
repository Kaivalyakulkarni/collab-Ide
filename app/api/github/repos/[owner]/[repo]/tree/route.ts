import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const GET = auth(async (req, context: any) => {
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

  const { owner, repo } = await context.params;
  const branch = req.nextUrl.searchParams.get("branch");

  if (!branch) {
    return NextResponse.json(
      { error: "Branch parameter is required" },
      { status: 400 },
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
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
      { error: errBody?.message || "Failed to fetch tree from GitHub" },
      { status: 502 },
    );
  }

  const tree = await res.json();

  const reShapedTree = tree.tree.map((t: any) => ({
    path: t.path,
    sha: t.sha,
    size: t.size,
    type: t.type === "blob" ? "file" : "folder",
  }));

  return NextResponse.json({
    tree: reShapedTree,
    truncated: tree.truncated ?? false,
  });
});
