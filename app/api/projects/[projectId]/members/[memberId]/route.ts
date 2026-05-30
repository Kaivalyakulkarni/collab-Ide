import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"


export const DELETE = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })
    const {  memberId } = await context.params  // await params

    const member = await prisma.projectMember.findUnique({
        where: { id: memberId },
        include: { project: true }
    })
    if (!member) return new NextResponse("Not found", { status: 404 })

    if (member.userId === session?.user?.id) return new NextResponse("Cannot remove yourself", { status: 400 })

    // check user is a member
    const isMember = await prisma.projectMember.findFirst({
        where: {
            projectId: member.projectId,
            userId: session?.user?.id
        }
    })
   if (!isMember || isMember.role !== "OWNER") return new NextResponse("Forbidden", { status: 403 })
    await prisma.projectMember.delete({
        where: { id: memberId }
    })  
    return new NextResponse("Member removed")
})


export const PATCH = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { memberId } = await context.params
    const { role } = await req.json()

    // find the member to get projectId
    const member = await prisma.projectMember.findUnique({
        where: { id: memberId }
    })
    if (!member) return new NextResponse("Not found", { status: 404 })

    // check requester is OWNER of this project
    const requester = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: member.projectId, userId: session.user.id } }
    })
    if (!requester || requester.role !== "OWNER") return new NextResponse("Forbidden", { status: 403 })

    // update role
    const updated = await prisma.projectMember.update({
        where: { id: memberId },
        data: { role }
    })

    return NextResponse.json(updated)
})