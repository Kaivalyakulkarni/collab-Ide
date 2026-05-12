import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
 
  try {
    const files = await prisma.file.findMany({
      where: { projectId },
    });

    const filesWithType = files.map((file) => ({
      ...file,
      type: "file" as const,
    }));

    return Response.json({ files: filesWithType });
  } catch (error) {
     console.error("[Files API Error]", error)
    return Response.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}