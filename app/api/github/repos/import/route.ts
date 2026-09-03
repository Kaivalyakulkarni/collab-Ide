import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const POST = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const connection = await prisma.githubConnection.findUnique({
    where: { userId: session.user.id },
  });
  if (!connection) {
    return NextResponse.json(
      { error: "No GitHub connection found" },
      { status: 404 },
    );
  }

  const body = await req.json();
  const { owner, repo, branch, paths, projectName, githubRepoId } = body;

  if (!owner || !repo || !branch || !paths || !projectName || !githubRepoId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  const fetchedFiles: {
    name: string;
    path: string;
    content: string;
    githubBlobSha: string;
    type: string;
  }[] = [];

  for (const { path, sha } of paths) {
    // fetch blob content here
    const blobRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!blobRes.ok) {
      const errBody = await blobRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody?.message || `Failed to fetch blob for ${path}` },
        { status: 502 },
      );
    }

    const blobData = await blobRes.json();
    blobData.content = Buffer.from(blobData.content, "base64").toString(
      "utf-8",
    );

    fetchedFiles.push({
      name: path.split("/").pop() || "",
      path,
      content: blobData.content,
      githubBlobSha: sha,
      type: "file",
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: projectName,
        githubRepoId: githubRepoId,
        githubFullName: `${owner}/${repo}`,
        githubBranch: branch,
      },
    });

    await tx.projectMember.create({
      data: {
        userId,
        projectId: project.id,
        role: "OWNER",
      },
    });

    await tx.file.createMany({
      data: fetchedFiles.map((file) => ({
        name: file.name,
        path: file.path,
        content: file.content,
        githubBlobSha: file.githubBlobSha,
        type: file.type,
        projectId: project.id,
      })),
    });
    return project;
  });

  return NextResponse.json({ projectId: result.id });
});
