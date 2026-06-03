"use client"

import React, { useState ,useEffect } from "react"

interface GitPanelProps {
    projectId: string
}

const GitPanel: React.FC<GitPanelProps> = ({ projectId }) => {
    const [isInitialized, setIsInitialized] = useState(false)
    const [changedFiles, setChangedFiles] = useState<string[]>([])
    const [commitMessage, setCommitMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [lastCommit, setLastCommit] = useState("")

    const initializeGitRepository = async () => {
        setIsLoading(true)
        const response = await fetch(`/api/projects/${projectId}/git/init`, { method: "POST" })
        if (response.ok) {
            setIsInitialized(true)
            await fetchStatus()
        }
        setIsLoading(false)
    }

    const fetchStatus = async () => {
        setIsLoading(true)
        const response = await fetch(`/api/projects/${projectId}/git/status`)
        if (response.ok) {
            const data = await response.json()
            setChangedFiles(data.changedFiles)
        }
        setIsLoading(false)
    }

    const commitChanges = async () => {
        if (!commitMessage.trim()) return
        setIsLoading(true)
        const response = await fetch(`/api/projects/${projectId}/git/commit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: commitMessage })
        })
        if (response.ok) {
            setLastCommit(commitMessage)
            setCommitMessage("")
            await fetchStatus()
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetch(`/api/projects/${projectId}/git/status`)
            .then(res => {
                if (res.ok) {
                    setIsInitialized(true)
                    return res.json()
                }
            })
            .then(data => {
                if (data?.changedFiles) setChangedFiles(data.changedFiles)
            })
            .catch(() => { })
    }, [projectId])

    const mono = { fontFamily: "var(--font-jetbrains-mono), monospace" }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", ...mono }}>


            {/* Not initialized */}
            {!isInitialized && (
                <div style={{ padding: "16px 14px" }}>
                    <div style={{ fontSize: "10px", color: "#7F8C8D", marginBottom: "12px" }}>
                        // no git repository found
                    </div>
                    <button
                        onClick={initializeGitRepository}
                        disabled={isLoading}
                        style={{
                            width: "100%", padding: "7px 0", background: "#BDC3C7",
                            color: "#000", border: "none", borderRadius: "3px",
                            fontSize: "11px", fontWeight: 700, cursor: "pointer",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            opacity: isLoading ? 0.6 : 1
                        }}
                    >
                        {isLoading ? "initializing..." : "git_init()"}
                    </button>
                </div>
            )}

            {/* Initialized */}
            {isInitialized && (
                <>
                    {/* Status section */}
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
                                    borderRadius: "3px", cursor: "pointer",
                                    fontFamily: "var(--font-jetbrains-mono), monospace"
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
                                        background: "#111", fontSize: "11px"
                                    }}>
                                        <span style={{ color: "#f59e0b", fontSize: "9px", fontWeight: 700 }}>M</span>
                                        <span style={{ color: "#BDC3C7" }}>{file}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Commit section */}
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
                                fontFamily: "var(--font-jetbrains-mono), monospace",
                                marginBottom: "8px"
                            }}
                        />
                        <button
                            onClick={commitChanges}
                            disabled={!commitMessage.trim() || isLoading}
                            style={{
                                width: "100%", padding: "7px 0",
                                background: commitMessage.trim() ? "#BDC3C7" : "transparent",
                                color: commitMessage.trim() ? "#000" : "#555",
                                border: `1px solid ${commitMessage.trim() ? "#BDC3C7" : "#252525"}`,
                                borderRadius: "3px", fontSize: "11px", fontWeight: 700,
                                cursor: commitMessage.trim() ? "pointer" : "not-allowed",
                                fontFamily: "var(--font-jetbrains-mono), monospace",
                                transition: "all 0.15s"
                            }}
                        >
                            {isLoading ? "committing..." : "git_commit()"}
                        </button>

                        {lastCommit && (
                            <div style={{ marginTop: "10px", fontSize: "10px", color: "#4ade80", padding: "6px 8px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "3px" }}>
                                ✓ committed: {lastCommit}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default GitPanel