import { prisma } from "@/lib/db";
import type { File } from "@prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params
    try { 
        const files = await prisma.file.findMany({
            where: { projectId }
        });
        const filesWithType = files.map((file: File) => ({
            ...file,
            type: "file" as const
        }))
        return Response.json({ files: filesWithType })
    } catch (error) {
        return Response.json({ error: "Failed to fetch files" }, { status: 500 })
    }
}