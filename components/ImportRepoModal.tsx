"use client";

import type { TreeNode } from "@/lib/githubTree";
import { useEffect, useState } from "react";
import { buildTree, toggleNode } from "@/lib/githubTree";
import GithubRepoPicker from "@/components/GithubRepoPicker";

type ImportRepoModalProps = {
  onClose: () => void;
  onImport: (projectId: string) => void;
};

type Repo = {
  id: number;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  updatedAt: string;
};

export default function ImportRepoModal({
  onClose,
  onImport,
}: ImportRepoModalProps) {
  const [step, setStep] = useState<"select-repo" | "pick-files">("select-repo");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [nodeMap, setNodeMap] = useState<Map<string, TreeNode>>(new Map());
  const [treeLoading, setTreeLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("/api/github/repos");
        if (!res.ok) throw new Error("Failed to fetch repos");
        const data = await res.json();
        setRepos(data.repos);
      } catch (err) {
        console.error(err);
        setError("Could not load your GitHub repos.");
      } finally {
        setReposLoading(false);
      }
    };
    fetchRepos();
  }, []);

  function handleToggle(path: string, newChecked: "checked" | "unchecked") {
    toggleNode(nodeMap, path, newChecked);
    setNodeMap(new Map(nodeMap));
    setRoots([...roots]);
  }

  function collectSelectedPaths(
    node: TreeNode,
    acc: { path: string; sha: string }[],
  ) {
    if (node.checked === "checked" && node.type === "file") {
      acc.push({ path: node.path, sha: node.sha });
    }
    node.children?.forEach((child) => collectSelectedPaths(child, acc));
  }

  async function selectRepo(repo: Repo) {
    setError(null);
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setTreeLoading(true);
    try {
      const [owner, repoName] = repo.fullName.split("/");
      const res = await fetch(
        `/api/github/repos/${owner}/${repoName}/tree?branch=${repo.defaultBranch}`,
      );
      if (!res.ok) throw new Error("Failed to fetch repo tree");

      const treeData = await res.json();
      const built = buildTree(treeData.tree);
      setRoots(built.roots);
      setNodeMap(built.nodeMap);
      setStep("pick-files");
    } catch (err) {
      console.error(err);
      setError("Could not load that repo's file tree.");
    } finally {
      setTreeLoading(false);
    }
  }

  async function handleImport() {
    if (!selectedRepo) return;
    setError(null);
    setImporting(true);

    const paths: { path: string; sha: string }[] = [];
    roots.forEach((root) => collectSelectedPaths(root, paths));

    if (paths.length === 0) {
      setError("Select at least one file to import.");
      setImporting(false);
      return;
    }

    const [owner, repoName] = selectedRepo.fullName.split("/");

    try {
      const res = await fetch("/api/github/repos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo: repoName,
          branch: selectedRepo.defaultBranch,
          projectName,
          paths,
          githubRepoId: selectedRepo.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to import repo");
      }

      const data = await res.json();
      onImport(data.projectId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Import failed");
      setImporting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          borderRadius: "8px",
          padding: "32px",
          width: "520px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#7F8C8D",
            letterSpacing: "0.15em",
          }}
        >
          {step === "select-repo" ? "// import_repo()" : "// pick_files()"}
        </div>

        {error && (
          <div
            style={{
              fontSize: "11px",
              color: "#f87171",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "4px",
              padding: "8px 12px",
            }}
          >
            {error}
          </div>
        )}

        {step === "select-repo" && (
          <div style={{ overflowY: "auto", maxHeight: "60vh" }}>
            {reposLoading && (
              <div style={{ fontSize: "12px", color: "#7F8C8D", padding: "8px 0" }}>
                loading_repos...
              </div>
            )}
            {!reposLoading && repos.length === 0 && (
              <div style={{ fontSize: "12px", color: "#7F8C8D", padding: "8px 0" }}>
                // no repos found
              </div>
            )}
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => selectRepo(repo)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "#ECF0F1",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111111")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>{repo.fullName}</span>
                {repo.private && (
                  <span style={{ fontSize: "10px", color: "#7F8C8D" }}>private</span>
                )}
              </div>
            ))}
            {treeLoading && (
              <div style={{ fontSize: "12px", color: "#7F8C8D", padding: "8px 0" }}>
                loading_tree...
              </div>
            )}
          </div>
        )}

        {step === "pick-files" && selectedRepo && (
          <>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="project_name"
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#ECF0F1",
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "13px",
                width: "100%",
                outline: "none",
              }}
            />

            <div
              style={{
                border: "1px solid #1a1a1a",
                borderRadius: "6px",
                background: "#050505",
                overflowY: "auto",
                maxHeight: "40vh",
                padding: "8px",
              }}
            >
              <GithubRepoPicker roots={roots} onToggle={handleToggle} />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => setStep("select-repo")}
                style={{
                  background: "transparent",
                  color: "#7F8C8D",
                  border: "1px solid #252525",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  cursor: "pointer",
                }}
              >
                back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  background: importing ? "#7F8C8D" : "#BDC3C7",
                  color: "#000",
                  opacity: importing ? 0.6 : 1,
                  cursor: importing ? "not-allowed" : "pointer",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  marginLeft: "auto",
                }}
              >
                {importing ? "importing..." : "import_repo()"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}