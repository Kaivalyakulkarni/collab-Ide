import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const GET = auth(async (req, context: any) => {
    const { token } = await context.params

    const invite = await prisma.inviteToken.findUnique({
        where: { token },
        include: { project: true }
    })

    if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
    if (invite.used) return NextResponse.json({ error: "Invite link already used" }, { status: 400 })
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite link expired" }, { status: 400 })

    return NextResponse.json({
        projectId: invite.projectId,
        projectName: invite.project.name,
        role: invite.role,
        expiresAt: invite.expiresAt
    })
})