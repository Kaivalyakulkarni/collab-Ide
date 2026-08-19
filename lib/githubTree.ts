type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  checked: "checked" | "unchecked" | "partial";
  sha: string;
};

const JUNK_FOLDERS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "venv",
  "__pycache__",
  ".vscode",
  ".idea",
  "vendor",
  "target",
]);
 
export function buildTree(
  entries: { path: string; type: "file" | "folder"; sha: string }[],
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  const sorted = [...entries].sort(
    (a, b) => a.path.split("/").length - b.path.split("/").length,
  );

  for (const entry of sorted) {
    const segments = entry.path.split("/");
    const name = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join("/");

    const node: TreeNode = {
      name,
      path: entry.path,
      type: entry.type,
      checked: isJunkPath(entry.path) ? "unchecked" : "checked",
      sha: entry.sha,
      children: entry.type === "folder" ? [] : undefined,
    };
    nodeMap.set(entry.path, node);

    if (parentPath) {
      const parentNode = nodeMap.get(parentPath);
      parentNode?.children?.push(node);
    }else{
        roots.push(node);
    }
  }
  return roots;
}

function isJunkPath(path: string): boolean {
    return path.split("/").some((segment) => JUNK_FOLDERS.has(segment));
}
