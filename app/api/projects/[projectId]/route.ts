import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async (req, context: any) => {
  const session = req.auth;
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const { projectId } = await context.params; // await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      files: true,
      members: {
        include: { user: true },
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) return new NextResponse("Not found", { status: 404 });

  // check user is a member
  const isMember = project.members.some((m) => m.userId === session?.user?.id);
  if (!isMember) return new NextResponse("Forbidden", { status: 403 });

  return NextResponse.json({ ...project });
});

export const PATCH = auth(async (req: any, context: any) => {
  const { projectId } = await context.params;
  const session = req.auth;
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status } = body;

  // verify requester is OWNER
  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id, role: "OWNER" },
  });
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });
  return NextResponse.json(updated);
}) as any;

export const DELETE = auth(async (req: any, context: any) => {
  const { projectId } = await context.params;
  const session = req.auth;
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id, role: "OWNER" },
  });
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$transaction([
    prisma.inviteToken.deleteMany({ where: { projectId } }),
    prisma.file.deleteMany({ where: { projectId } }),
    prisma.projectMember.deleteMany({ where: { projectId } }),
    prisma.project.delete({ where: { id: projectId } }),
  ]);

  return NextResponse.json({ success: true });
}) as any;
