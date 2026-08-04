import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { gitBlobSha } from "@/lib/githubServer"

export const GET = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { projectId } = await context.params

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { files: true },
    })

    if (!project) return new NextResponse("Not found", { status: 404 })

    if (!project.githubFullName) {
        return NextResponse.json({ linked: false, changedFiles: [] })
    }

    const changedFiles = project.files
        .filter(f => f.type === "file")
        .filter(f => gitBlobSha(f.content ?? "") !== f.githubBlobSha)
        .map(f => f.name)

    return NextResponse.json({ linked: true, changedFiles })
})