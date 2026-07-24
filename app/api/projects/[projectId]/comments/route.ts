import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth" // or wherever your NextAuth v5 auth() helper lives
import { prisma } from "@/lib/db"; // adjust to your actual prisma client import

export async function POST(
  req: NextRequest,
  context: any // Next.js 15+ needs this pragmatic typing 
) {
  const { projectId } = await context.params


  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        userId: session.user.id,
        projectId
      }
    }
  })

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 3. Parse the body — just content
  const { content } = await req.json()

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 })
  }

  // 4. Create the comment
  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      projectId,
      userId: session.user.id,
    },
    include: {
      user: true 
    }
  })

  return NextResponse.json(comment)
}