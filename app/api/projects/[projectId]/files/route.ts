import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server"; 

const buildTree = (flatFiles: any[]): any[] => {
  const root: any[] = [];
  const map: { [path: string]: any } = {};

  const sorted = [...flatFiles].sort(
    (a, b) => a.path.split("/").length - b.path.split("/").length,
  );

  for (const file of sorted) {
    const parts = file.path.split("/").filter(Boolean);
    let currentPath = "";
    let parentChildren = root;

    // walk/create every ancestor folder along this file's path
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      if (!map[currentPath]) {
        const folderNode = {
          id: currentPath,
          name: parts[i],
          type: "folder",
          path: currentPath,
          children: [],
        };
        map[currentPath] = folderNode;
        parentChildren.push(folderNode);
      }
      parentChildren = map[currentPath].children;
    }

    // now place the file (or a real folder row) itself under its parent
    const node = { ...file, children: file.type === "folder" ? [] : undefined };
    map[file.path] = node;
    parentChildren.push(node);
  }

  return root;
};

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