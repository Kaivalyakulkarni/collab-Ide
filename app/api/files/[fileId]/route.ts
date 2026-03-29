import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    const { content } = await request.json(); 
    const { fileId } = await params;
    try {
        const updatedFile = await prisma.file.update({
            where: { id: fileId },
            data: { content }

        });
        return new Response(JSON.stringify(updatedFile), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to update file" }), { status: 500 });
    }
}