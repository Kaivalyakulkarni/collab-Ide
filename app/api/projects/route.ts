import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const GET = auth(async (req) => {
    const session = req.auth  
    
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const memberships = await prisma.projectMember.findMany({
        where: { userId: session.user.id },
        include: {
            project: {
                include: {
                    members: true,
                    files: true
                }
            }
        }
    })

    return NextResponse.json(memberships.map(m => m.project))
})

export const POST = auth(async (req) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { name, description } = await req.json()
    if (!name) return new NextResponse("Name required", { status: 400 })

    // create project + add user as OWNER in one transaction
    const project = await prisma.project.create({
        data: {
            name,
            description,
            members: {
                create: {
                    userId: session.user.id,
                    role: "OWNER"
                }
            },
            files:{
                create: {
                    name,
                    path:`/${name}`,
                    type: "folder",
                    content: ""
                }
            }
        },
        include: { members: true, files: true }
    })


    return NextResponse.json(project)
})