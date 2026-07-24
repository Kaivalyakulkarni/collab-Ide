import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export const PATCH = auth(async (req, context: any) => {
  const session = req.auth
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { projectId, commentId } = await context.params

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment || comment.projectId !== projectId) {
    return new NextResponse("Not found", { status: 404 })
  }

  // edit is author-only
  if (comment.userId !== session.user.id) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { content } = await req.json()
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 })
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    include: { user: true }
  })

  return NextResponse.json(updated)
})

export const DELETE = auth(async (req, context: any) => {
  const session = req.auth
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { projectId, commentId } = await context.params

  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment || comment.projectId !== projectId) {
    return new NextResponse("Not found", { status: 404 })
  }

  const isAuthor = comment.userId === session.user.id

  let isOwner = false
  if (!isAuthor) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } }
    })
    isOwner = membership?.role === "OWNER"
  }

  if (!isAuthor && !isOwner) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })

  return NextResponse.json({ success: true })
})