import { prisma } from "@/lib/db"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { createGithubRepoForUser } from "@/lib/githubServer"

export const GET = auth(async (req) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const memberships = await prisma.projectMember.findMany({
        where: { userId: session.user.id },
        include: { project: { include: { members: true, files: true } } },
    })

    return NextResponse.json(memberships.map(m => m.project))
})

export const POST = auth(async (req) => {
    const session = req.auth
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { name, description, createGithubRepo } = await req.json()
    if (!name) return new NextResponse("Name required", { status: 400 })

    let githubRepoData: {
        githubRepoId: number
        githubFullName: string
        githubBranch: string
    } | null = null

    if (createGithubRepo) {
        const connection = await prisma.githubConnection.findUnique({
            where: { userId: session.user.id },
        })
        if (!connection) {
            return NextResponse.json(
                { error: "GitHub not connected. Connect your account first." },
                { status: 400 }
            )
        }

        const repoResult = await createGithubRepoForUser({
            accessToken: connection.accessToken,
            name,
            description,
        })

        if ("error" in repoResult) {
            return NextResponse.json(
                { error: "Failed to create GitHub repository", details: repoResult.error },
                { status: 502 }
            )
        }

        githubRepoData = repoResult
    }

    try {
        const project = await prisma.project.create({
            data: {
                name,
                description,
                ...(githubRepoData ?? {}),
                members: { create: { userId: session.user.id, role: "OWNER" } },
                files: { create: { name, path: `/${name}`, type: "folder", content: "" } },
            },
            include: { members: true, files: true },
        })

        return NextResponse.json(project)
    } catch (dbError) {
        if (githubRepoData) {
            const connection = await prisma.githubConnection.findUnique({
                where: { userId: session.user.id },
            })
            if (connection) {
                await fetch(`https://api.github.com/repos/${githubRepoData.githubFullName}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${connection.accessToken}`,
                        Accept: "application/vnd.github+json",
                    },
                }).catch(() => {})
            }
        }
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }
})