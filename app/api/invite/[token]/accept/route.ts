import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const POST = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { token } = await context.params

    const invite = await prisma.inviteToken.findUnique({
        where: { token }
    })

    if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 })
    if (invite.used) return NextResponse.json({ error: "Already used" }, { status: 400 })
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Expired" }, { status: 400 })

    // check if already a member
    const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: invite.projectId, userId: session.user.id } }
    })
    if (existing) return NextResponse.json({ projectId: invite.projectId }) // already member, just redirect

    // add member + mark token as used
    await prisma.$transaction([
        prisma.projectMember.create({
            data: { projectId: invite.projectId, userId: session.user.id, role: invite.role }
        }),
        prisma.inviteToken.update({
            where: { token },
            data: { used: true }
        })
    ])

    return NextResponse.json({ projectId: invite.projectId })
})