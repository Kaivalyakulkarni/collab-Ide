import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

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
    return Response.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}