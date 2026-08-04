import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { performGithubCommit } from "@/lib/githubSync"

export const POST = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { projectId } = await context.params
    const { message } = await req.json()

    if (!message?.trim()) {
        return NextResponse.json({ error: "Commit message required" }, { status: 400 })
    }

    const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } },
    })
    if (!membership) return new NextResponse("Forbidden", { status: 403 })

    const result = await performGithubCommit({ projectId, message: message.trim() })

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
})