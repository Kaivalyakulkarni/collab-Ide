import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const GET = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { projectId } = await context.params  // await params

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            files: true,
            members: {
                include: { user: true }
            }
        }
    })

    if (!project) return new NextResponse("Not found", { status: 404 })

    // check user is a member
    const isMember = project.members.some(m => m.userId === session?.user?.id)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    return NextResponse.json(project)
})