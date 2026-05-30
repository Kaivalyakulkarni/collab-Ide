import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const POST = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { projectId } = await context.params
    const { role } = await req.json()

    // check user is OWNER
    const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: session.user.id } }
    })
    if (!member || member.role !== "OWNER") return new NextResponse("Forbidden", { status: 403 })

    // create invite token with 24hr expiry
    const invite = await prisma.inviteToken.create({
        data: {
            projectId,
            role,
            createdBy: session.user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${invite.token}`
    return NextResponse.json({ url: inviteUrl })
})