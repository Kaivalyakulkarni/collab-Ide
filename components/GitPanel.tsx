"use client"

import React, { useState, useEffect } from "react"

interface GitPanelProps {
    projectId: string
}

const GitPanel: React.FC<GitPanelProps> = ({ projectId }) => {
    const [linked, setLinked] = useState<boolean | null>(null)
    const [changedFiles, setChangedFiles] = useState<string[]>([])
    const [commitMessage, setCommitMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [lastCommit, setLastCommit] = useState("")
    const [error, setError] = useState<string | null>(null)

    const mono = { fontFamily: "var(--font-jetbrains-mono), monospace" }

    const fetchStatus = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/git/status`)
            const data = await res.json()
            setLinked(data.linked)
            setChangedFiles(data.changedFiles ?? [])
        } catch {
            setLinked(false)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchStatus()
    }, [projectId])

    const commitChanges = async () => {
        if (!commitMessage.trim()) return
        setIsLoading(true)
        setError(null)
        const res = await fetch(`/api/projects/${projectId}/git/commit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: commitMessage }),
        })
        const data = await res.json()
        if (res.ok) {
            setLastCommit(commitMessage)
            setCommitMessage("")
            await fetchStatus()
        } else {
            setError(data?.error || "Commit failed")
        }
        setIsLoading(false)
    }

    if (linked === null) {
        return (
            <div style={{ padding: "16px 14px", fontSize: "10px", color: "#7F8C8D", ...mono }}>
                // loading git status...
            </div>
        )
    }

    if (!linked) {
        return (
            <div style={{ padding: "16px 14px", ...mono }}>
                <div style={{ fontSize: "10px", color: "#7F8C8D", lineHeight: 1.7 }}>
                    // this project isn't linked to GitHub yet
                </div>
                <div style={{ fontSize: "11px", color: "#ECF0F1", marginTop: "8px", lineHeight: 1.6 }}>
                    Link this project to GitHub in{" "}
                    <span style={{ color: "#60a5fa" }}>project settings</span> to enable version control.
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", ...mono }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#7F8C8D" }}>
                        // changed_files ({changedFiles.length})
                    </span>
                    <button
                        onClick={fetchStatus}
                        disabled={isLoading}
                        style={{
                            background: "transparent", border: "1px solid #252525",
                            color: "#7F8C8D", fontSize: "10px", padding: "2px 8px",
                            borderRadius: "3px", cursor: "pointer", ...mono,
                        }}
                    >
                        {isLoading ? "..." : "↻ refresh()"}
                    </button>
                </div>

                {changedFiles.length === 0 ? (
                    <div style={{ fontSize: "10px", color: "#555", padding: "4px 0" }}>
                        // no changes detected
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {changedFiles.map((file, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "3px 6px", borderRadius: "3px",
                                background: "#111", fontSize: "11px",
                            }}>
                                <span style={{ color: "#f59e0b", fontSize: "9px", fontWeight: 700 }}>M</span>
                                <span style={{ color: "#BDC3C7" }}>{file}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "8px" }}>
                    // commit_changes()
                </div>
                <textarea
                    value={commitMessage}
                    onChange={e => setCommitMessage(e.target.value)}
                    placeholder="feat: describe your changes..."
                    rows={3}
                    style={{
                        width: "100%", background: "#111", border: "1px solid #1a1a1a",
                        borderRadius: "3px", color: "#ECF0F1", fontSize: "11px",
                        padding: "8px 10px", outline: "none", resize: "none",
                        marginBottom: "8px", ...mono,
                    }}
                />
                <button
                    onClick={commitChanges}
                    disabled={!commitMessage.trim() || isLoading || changedFiles.length === 0}
                    style={{
                        width: "100%", padding: "7px 0",
                        background: commitMessage.trim() && changedFiles.length > 0 ? "#BDC3C7" : "transparent",
                        color: commitMessage.trim() && changedFiles.length > 0 ? "#000" : "#555",
                        border: `1px solid ${commitMessage.trim() ? "#BDC3C7" : "#252525"}`,
                        borderRadius: "3px", fontSize: "11px", fontWeight: 700,
                        cursor: commitMessage.trim() && changedFiles.length > 0 ? "pointer" : "not-allowed",
                        transition: "all 0.15s", ...mono,
                    }}
                >
                    {isLoading ? "pushing..." : "git_commit()"}
                </button>

                {error && (
                    <div style={{ marginTop: "10px", fontSize: "10px", color: "#f87171", padding: "6px 8px", background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "3px" }}>
                        ✕ {error}
                    </div>
                )}

                {lastCommit && !error && (
                    <div style={{ marginTop: "10px", fontSize: "10px", color: "#4ade80", padding: "6px 8px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "3px" }}>
                        ✓ pushed: {lastCommit}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GitPanel