import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { createGithubRepoForUser } from "@/lib/githubServer"
import { performGithubCommit } from "@/lib/githubSync"

export const POST = auth(async (req, context: any) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { projectId } = await context.params

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true },
    })
    if (!project) return new NextResponse("Not found", { status: 404 })

    const membership = project.members.find(m => m.userId === session.user?.id!)
    if (!membership || membership.role !== "OWNER") {
        return new NextResponse("Only the project owner can link GitHub", { status: 403 })
    }

    if (project.githubFullName) {
        return NextResponse.json({ error: "Project is already linked to GitHub" }, { status: 400 })
    }

    const connection = await prisma.githubConnection.findUnique({
        where: { userId: session.user.id },
    })
    if (!connection) {
        return NextResponse.json({ error: "Connect your GitHub account first" }, { status: 400 })
    }

    const repoResult = await createGithubRepoForUser({
        accessToken: connection.accessToken,
        name: project.name,
        description: project.description ?? undefined,
    })

    if ("error" in repoResult) {
        return NextResponse.json({ error: repoResult.error }, { status: 502 })
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            githubRepoId: repoResult.githubRepoId,
            githubFullName: repoResult.githubFullName,
            githubBranch: repoResult.githubBranch,
        },
    })

    const syncResult = await performGithubCommit({
        projectId,
        message: "Initial sync from Collab IDE",
    })

    return NextResponse.json({
        linked: true,
        githubFullName: repoResult.githubFullName,
        initialSync: syncResult,
    })
})