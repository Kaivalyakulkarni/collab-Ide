import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"

export const GET = auth(async (req) => {
    const session = req.auth
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const connection = await prisma.githubConnection.findUnique({
        where: { userId: session.user.id },
        select: { githubLogin: true },
    })

    return NextResponse.json({
        connected: !!connection,
        githubLogin: connection?.githubLogin ?? null,
    })
})