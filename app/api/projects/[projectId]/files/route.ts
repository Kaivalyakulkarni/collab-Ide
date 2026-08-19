import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server"; 

const buildTree = (flatFiles: any[]): any[] => {
    const root: any[] = []
    const map: { [path: string]: any } = {}

    // first pass — build a map of path -> node
    const sorted = [...flatFiles].sort((a, b) => a.path.length - b.path.length)
    
    for (const file of sorted) {
        map[file.path] = { ...file, children: file.type === "folder" ? [] : undefined }
    }

    // second pass — attach children to parents
    for (const file of sorted) {
        const parts = file.path.split("/").filter(Boolean)
        if (parts.length === 1) {
            root.push(map[file.path])
        } else {
            const parentPath = "/" + parts.slice(0, -1).join("/")
            if (map[parentPath]) {
                map[parentPath].children = map[parentPath].children || []
                map[parentPath].children.push(map[file.path])
            }
        }
    }

    return root
}

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
      type: file.type as "file" | "folder",
    }));

    const tree = buildTree(filesWithType)
    console.log("tree:", JSON.stringify(tree, null, 2))
    return Response.json({ files: tree })
  } catch (error) {
    console.error("[Files API Error]", error)
    return Response.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const { name, type, path } = await request.json();
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }




  try {
    const newFile = await prisma.file.create({
      data: {
        name,
        type,
        path,
        projectId,
        content: type === "file" ? "" : undefined
      }
    })
    return Response.json({ file: newFile });
  } catch (error) {
    console.error("[Files API Error]", error);
    return Response.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}