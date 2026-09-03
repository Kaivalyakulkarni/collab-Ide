"use client";

import React, { useEffect, useRef } from "react";
import type { TreeNode } from "@/lib/githubTree";

type GithubRepoPickerProps = {
  roots: TreeNode[];
  onToggle: (path: string, newChecked: "checked" | "unchecked") => void;
};

export default function GithubRepoPicker({
  roots,
  onToggle,
}: GithubRepoPickerProps) {
  return (
    <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }}>
      {roots.map((root) => (
        <TreeNodeRow key={root.path} node={root} onToggle={onToggle} />
      ))}
    </div>
  );
}

function TreeNodeRow({
  node,
  onToggle,
}: {
  node: TreeNode;
  onToggle: (path: string, newChecked: "checked" | "unchecked") => void;
}) {
  const depth = node.path.split("/").length - 1;

  return (
    <div>
      <div
        style={{
          marginLeft: depth * 18,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "3px 6px",
          borderRadius: "4px",
          color: node.type === "folder" ? "#ECF0F1" : "#7F8C8D",
        }}
      >
        <NodeCheckbox node={node} onToggle={onToggle} />
        <span>{node.name}</span>
      </div>
      {node.children?.map((child) => (
        <TreeNodeRow key={child.path} node={child} onToggle={onToggle} />
      ))}
    </div>
  );
}

function NodeCheckbox({
  node,
  onToggle,
}: {
  node: TreeNode;
  onToggle: (path: string, newChecked: "checked" | "unchecked") => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = node.checked === "partial";
    }
  }, [node.checked]);

  return (
    <input
      type="checkbox"
      ref={checkboxRef}
      checked={node.checked === "checked"}
      onChange={(e) =>
        onToggle(node.path, e.target.checked ? "checked" : "unchecked")
      }
      style={{ accentColor: "#BDC3C7", cursor: "pointer" }}
    />
  );
}