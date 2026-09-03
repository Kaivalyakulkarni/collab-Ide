export type TreeNode = {
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
): { roots: TreeNode[]; nodeMap: Map<string, TreeNode> } {
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
    } else {
      roots.push(node);
    }
  }
  return { roots, nodeMap };
}

function isJunkPath(path: string): boolean {
  return path.split("/").some((segment) => JUNK_FOLDERS.has(segment));
}


function recomputeFolderState(
  folder: TreeNode,
): "checked" | "unchecked" | "partial" {
  if (!folder.children || folder.children.length === 0) {
    return folder.checked; // shouldn't normally happen for a folder, but guard anyway
  }

  const allChecked = folder.children.every((c) => c.checked === "checked");
  const allUnchecked = folder.children.every((c) => c.checked === "unchecked");

  if (allChecked) return "checked";
  if (allUnchecked) return "unchecked";
  return "partial";
}


function setAllDescendants(
  node: TreeNode,
  checked: "checked" | "unchecked",
): void {
  node.checked = checked;
  node.children?.forEach((child) => setAllDescendants(child, checked));
}

export function toggleNode(
  nodeMap: Map<string, TreeNode>,
  targetPath: string,
  newChecked: "checked" | "unchecked",
): void {
  const target = nodeMap.get(targetPath);
  if (!target) return;

  // Step 1: cascade down (no-op for files, since they have no children)
  setAllDescendants(target, newChecked);

  // Step 2: walk up ancestors, nearest first, recomputing each
  let currentPath = targetPath;
  while (currentPath.includes("/")) {
    currentPath = currentPath.split("/").slice(0, -1).join("/");
    const ancestor = nodeMap.get(currentPath);
    if (!ancestor) break;
    ancestor.checked = recomputeFolderState(ancestor);
  }
}