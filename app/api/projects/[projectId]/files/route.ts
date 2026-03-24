import { prisma } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        const files = await prisma.file.findMany({
            where: {
                projectId: params.projectId
            }
        });
        return new Response(JSON.stringify({ files }), { status: 200 });
    } catch (error) {
        console.error("Error fetching files:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch files" }), { status: 500 });
    }
}