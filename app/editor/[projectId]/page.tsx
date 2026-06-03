"use client";

import dynamic from "next/dynamic";
import FileTree from "@/components/FileTree";

import { use, useEffect, useState, useRef } from "react";
import { FileNode } from "@/components/FileTree";

import { useSession } from "next-auth/react";

import TerminalComponent from "@/components/Terminal"

import GitPanel from "@/components/GitPanel";

import React from "react";

const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [files, setFiles] = useState<FileNode[]>([])

    const fetchFiles = () => {
        fetch(`/api/projects/${projectId}/files`)
            .then(res => res.json())
            .then(data => setFiles(data.files))
            .catch(err => console.error(err))
    }

    useEffect(() => {
        fetchFiles()
    }, [projectId])

    const saveTimer = useRef<NodeJS.Timeout | null>(null)
    const selectedFileRef = useRef<FileNode | null>(null)

    const [openTabs, setOpenTabs] = useState<FileNode[]>([])
    const [activeTab, setActiveTab] = useState<FileNode | null>(null)

    const handleFileSelect = (file: FileNode) => {
        selectedFileRef.current = file
        setActiveTab(file)
        setOpenTabs(prev => {
            const alreadyOpen = prev.find(t => t.id === file.id)
            if (alreadyOpen) return prev
            return [...prev, file]
        })
    }

    const handleTabClose = (fileId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setOpenTabs(prev => {
            const remaining = prev.filter(t => t.id !== fileId)
            if (activeTab?.id === fileId) {
                const closedIndex = prev.findIndex(t => t.id === fileId)
                const next = remaining[closedIndex] ?? remaining[closedIndex - 1] ?? null
                setActiveTab(next)
                selectedFileRef.current = next
            }
            return remaining
        })
    }

    const getLanguageFromFileName = (fileName: string) => {
        const ext = fileName.split('.').pop();
        switch (ext) {
            case 'js': return 'javascript';
            case 'ts': return 'typescript';
            case 'css': return 'css';
            case 'html': return 'html';
            case 'py': return 'python';
            case 'jsx': return 'javascript';
            case 'tsx': return 'typescript';
            default: return 'plaintext';
        }
    }

    const handleContentChange = (content: string) => {
        if (!selectedFileRef.current) return
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            fetch(`/api/files/${selectedFileRef.current!.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            })
                .then(res => res.json())
                .then(data => console.log("Saved:", data))
                .catch(err => console.error("Error:", err))
            sendInitRef.current?.(content, getLanguageFromFileName(selectedFileRef.current!.name), selectedFileRef.current!.name)
        }, 1000)
    }

    const { data: session } = useSession()
    const [users, setUsers] = useState<{ name: string, color: string }[]>([])
    const [showTerminal, setShowTerminal] = useState(true)
    const [terminalHeight, setTerminalHeight] = useState(300)
    const isDragging = useRef(false)
    const fitTerminal = useRef<(() => void) | null>(null)
    const sendInitRef = useRef<((content: string, language: string, fileName: string) => void) | null>(null)
    const [activePanel, setActivePanel] = useState<"files" | "git">("files")

    const [aiStrength, setAiStrength] = useState<"off" | "normal" | "aggressive">("normal")

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            const container = document.querySelector('.editor-container') as HTMLElement
            if (!container) return
            const containerRect = container.getBoundingClientRect()
            const newHeight = containerRect.bottom - e.clientY
            setTerminalHeight(Math.min(500, Math.max(100, newHeight)))
            fitTerminal.current?.()
        }
        const handleMouseUp = () => { isDragging.current = false }
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [])

    useEffect(() => {
        if (activeTab) {
            sendInitRef.current?.(activeTab.content || "", getLanguageFromFileName(activeTab.name), activeTab.name)
        }
    }, [activeTab])

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", fontFamily: "var(--font-jetbrains-mono), monospace" }}>

            {/* Main row — icon bar + sidebar + editor */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* Icon bar */}
                <div style={{ width: "44px", background: "#0d0d0d", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: "2px", flexShrink: 0 }}>
                    <div
                        onClick={() => setActivePanel("files")}
                        title="Explorer"
                        style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: `2px solid ${activePanel === "files" ? "#BDC3C7" : "transparent"}`, color: activePanel === "files" ? "#BDC3C7" : "#555", transition: "all 0.15s" }}
                    >
                        <svg width="18px" height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 3L13.7071 2.29289C13.5196 2.10536 13.2652 2 13 2V3ZM19 9H20C20 8.73478 19.8946 8.48043 19.7071 8.29289L19 9ZM13.109 8.45399L14 8V8L13.109 8.45399ZM13.546 8.89101L14 8L13.546 8.89101ZM10 13C10 12.4477 9.55228 12 9 12C8.44772 12 8 12.4477 8 13H10ZM8 16C8 16.5523 8.44772 17 9 17C9.55228 17 10 16.5523 10 16H8ZM8.5 9C7.94772 9 7.5 9.44772 7.5 10C7.5 10.5523 7.94772 11 8.5 11V9ZM9.5 11C10.0523 11 10.5 10.5523 10.5 10C10.5 9.44772 10.0523 9 9.5 9V11ZM8.5 6C7.94772 6 7.5 6.44772 7.5 7C7.5 7.55228 7.94772 8 8.5 8V6ZM9.5 8C10.0523 8 10.5 7.55228 10.5 7C10.5 6.44772 10.0523 6 9.5 6V8ZM17.908 20.782L17.454 19.891L17.454 19.891L17.908 20.782ZM18.782 19.908L19.673 20.362L18.782 19.908ZM5.21799 19.908L4.32698 20.362H4.32698L5.21799 19.908ZM6.09202 20.782L6.54601 19.891L6.54601 19.891L6.09202 20.782ZM6.09202 3.21799L5.63803 2.32698L5.63803 2.32698L6.09202 3.21799ZM5.21799 4.09202L4.32698 3.63803L4.32698 3.63803L5.21799 4.09202ZM12 3V7.4H14V3H12ZM14.6 10H19V8H14.6V10ZM12 7.4C12 7.66353 11.9992 7.92131 12.0169 8.13823C12.0356 8.36682 12.0797 8.63656 12.218 8.90798L14 8C14.0293 8.05751 14.0189 8.08028 14.0103 7.97537C14.0008 7.85878 14 7.69653 14 7.4H12ZM14.6 8C14.3035 8 14.1412 7.99922 14.0246 7.9897C13.9197 7.98113 13.9425 7.9707 14 8L13.092 9.78201C13.3634 9.92031 13.6332 9.96438 13.8618 9.98305C14.0787 10.0008 14.3365 10 14.6 10V8ZM12.218 8.90798C12.4097 9.2843 12.7157 9.59027 13.092 9.78201L14 8V8L12.218 8.90798ZM8 13V16H10V13H8ZM8.5 11H9.5V9H8.5V11ZM8.5 8H9.5V6H8.5V8ZM13 2H8.2V4H13V2ZM4 6.2V17.8H6V6.2H4ZM8.2 22H15.8V20H8.2V22ZM20 17.8V9H18V17.8H20ZM19.7071 8.29289L13.7071 2.29289L12.2929 3.70711L18.2929 9.70711L19.7071 8.29289ZM15.8 22C16.3436 22 16.8114 22.0008 17.195 21.9694C17.5904 21.9371 17.9836 21.8658 18.362 21.673L17.454 19.891C17.4045 19.9162 17.3038 19.9539 17.0322 19.9761C16.7488 19.9992 16.3766 20 15.8 20V22ZM18 17.8C18 18.3766 17.9992 18.7488 17.9761 19.0322C17.9539 19.3038 17.9162 19.4045 17.891 19.454L19.673 20.362C19.8658 19.9836 19.9371 19.5904 19.9694 19.195C20.0008 18.8114 20 18.3436 20 17.8H18ZM18.362 21.673C18.9265 21.3854 19.3854 20.9265 19.673 20.362L17.891 19.454C17.7951 19.6422 17.6422 19.7951 17.454 19.891L18.362 21.673ZM4 17.8C4 18.3436 3.99922 18.8114 4.03057 19.195C4.06287 19.5904 4.13419 19.9836 4.32698 20.362L6.10899 19.454C6.0838 19.4045 6.04612 19.3038 6.02393 19.0322C6.00078 18.7488 6 18.3766 6 17.8H4ZM8.2 20C7.62345 20 7.25117 19.9992 6.96784 19.9761C6.69617 19.9539 6.59545 19.9162 6.54601 19.891L5.63803 21.673C6.01641 21.8658 6.40963 21.9371 6.80497 21.9694C7.18864 22.0008 7.65645 22 8.2 22V20ZM4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673L6.54601 19.891C6.35785 19.7951 6.20487 19.6422 6.10899 19.454L4.32698 20.362ZM8.2 2C7.65645 2 7.18864 1.99922 6.80497 2.03057C6.40963 2.06287 6.01641 2.13419 5.63803 2.32698L6.54601 4.10899C6.59545 4.0838 6.69617 4.04612 6.96784 4.02393C7.25117 4.00078 7.62345 4 8.2 4V2ZM6 6.2C6 5.62345 6.00078 5.25117 6.02393 4.96784C6.04612 4.69617 6.0838 4.59545 6.10899 4.54601L4.32698 3.63803C4.13419 4.01641 4.06287 4.40963 4.03057 4.80497C3.99922 5.18864 4 5.65645 4 6.2H6ZM5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803L6.10899 4.54601C6.20487 4.35785 6.35785 4.20487 6.54601 4.10899L5.63803 2.32698Z" fill="currentColor" />
                        </svg>
                    </div>
                    <div
                        onClick={() => setActivePanel("git")}
                        title="Source Control"
                        style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderLeft: `2px solid ${activePanel === "git" ? "#BDC3C7" : "transparent"}`, color: activePanel === "git" ? "#BDC3C7" : "#555", transition: "all 0.15s" }}
                    >
                        <svg width="18px" height="18px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                            <path d="M251.172 116.594L139.4 4.828c-6.433-6.437-16.873-6.437-23.314 0l-23.21 23.21 29.443 29.443c6.842-2.312 14.688-.761 20.142 4.693 5.48 5.489 7.02 13.402 4.652 20.266l28.375 28.376c6.865-2.365 14.786-.835 20.269 4.657 7.663 7.66 7.663 20.075 0 27.74-7.665 7.666-20.08 7.666-27.749 0-5.764-5.77-7.188-14.235-4.27-21.336l-26.462-26.462-.003 69.637a19.82 19.82 0 0 1 5.188 3.71c7.663 7.66 7.663 20.076 0 27.747-7.665 7.662-20.086 7.662-27.74 0-7.663-7.671-7.663-20.086 0-27.746a19.654 19.654 0 0 1 6.421-4.281V94.196a19.378 19.378 0 0 1-6.421-4.281c-5.806-5.798-7.202-14.317-4.227-21.446L81.47 39.442l-76.64 76.635c-6.44 6.443-6.44 16.884 0 23.322l111.774 111.768c6.435 6.438 16.873 6.438 23.316 0l111.251-111.249c6.438-6.44 6.438-16.887 0-23.324" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ width: "220px", background: "#111", borderRight: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
                    <div style={{ fontSize: "9px", color: "#7F8C8D", letterSpacing: "0.15em", padding: "10px 14px 6px", textTransform: "uppercase" }}>
                        {activePanel === "files" ? "explorer" : "source control"}
                    </div>
                    <div style={{ flex: 1, overflow: "auto", flexDirection: "column", fontSize: "12px" }}>
                        {activePanel === "files" ? (
                            <FileTree files={files}
                                onFileSelect={handleFileSelect}
                                selectedFile={activeTab?.name}
                                onCreateFile={async (parentPath, name) => {
                                    await fetch(`/api/projects/${projectId}/files`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ name, path: `${parentPath}/${name}`, type: "file" })
                                    })
                                        .then(res => res.json())
                                        .then(() => fetchFiles())
                                }}
                                onCreateFolder={async (parentPath, name) => {
                                    await fetch(`/api/projects/${projectId}/files`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ name, path: `${parentPath}/${name}`, type: "folder" })
                                    })
                                        .then(res => res.json())
                                        .then(() => fetchFiles())
                                }}
                            />
                        ) : (
                            <GitPanel projectId={projectId} />
                        )}
                    </div>
                </div>

                {/* Editor column */}
                <div className="editor-container" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Presence bar */}
                    <div style={{ height: "36px", background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 14px", gap: "8px", flexShrink: 0 }}>
                        {[...new Map(users.map(u => [u.name, u])).values()].map((user) => (
                            <div key={user.name} title={user.name} style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: user.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#000", flexShrink: 0 }}>
                                {user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                        ))}
                        {users.length > 0 && (
                            <span style={{ fontSize: "10px", color: "#555" }}>{users.length} online</span>
                        )}
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px", fontSize: "10px", color: "#555" }}>
                            {activeTab && <span style={{ color: "#BDC3C7" }}>{activeTab.name}</span>}
                            <span style={{ color: "#4ade80" }}>● autosaved</span>
                            <span
                                onClick={() => setShowTerminal(!showTerminal)}
                                style={{ cursor: "pointer", color: showTerminal ? "#BDC3C7" : "#555" }}
                            >
                                {showTerminal ? "⊟ terminal" : "⊞ terminal"}
                            </span>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div style={{ height: "35px", background: "#0d0d0d", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "flex-end", flexShrink: 0, overflow: "hidden" }}>
                        {openTabs.length === 0 && (
                            <div style={{ padding: "0 16px", fontSize: "11px", color: "#555", display: "flex", alignItems: "center", height: "100%" }}>
                                // no file open
                            </div>
                        )}
                        {openTabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => { setActiveTab(tab); selectedFileRef.current = tab }}
                                style={{
                                    height: "35px", display: "flex", alignItems: "center", gap: "6px",
                                    padding: "0 14px", fontSize: "11px", cursor: "pointer",
                                    borderRight: "1px solid #1a1a1a",
                                    borderTop: `1px solid ${activeTab?.id === tab.id ? "#BDC3C7" : "transparent"}`,
                                    background: activeTab?.id === tab.id ? "#1e1e1e" : "#0d0d0d",
                                    color: activeTab?.id === tab.id ? "#ECF0F1" : "#7F8C8D",
                                    whiteSpace: "nowrap", flexShrink: 0
                                }}
                            >
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
                                {tab.name}
                                <span
                                    onClick={(e) => handleTabClose(tab.id, e)}
                                    style={{ fontSize: "14px", color: "#555", marginLeft: "2px", lineHeight: 1, padding: "0 2px" }}
                                >×</span>
                            </div>
                        ))}
                    </div>

                    {/* Breadcrumb */}
                    {activeTab && (
                        <div style={{ height: "24px", background: "#1e1e1e", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 14px", gap: "6px", fontSize: "10px", color: "#555", flexShrink: 0 }}>
                            <span>collab-ide</span>
                            <span style={{ color: "#333" }}>›</span>
                            <span style={{ color: "#BDC3C7" }}>{activeTab.name}</span>
                        </div>
                    )}

                    {/* Editor */}
                    <div style={{ flex: 1, overflow: "hidden" }}>
                        <EditorComponent
                            language={getLanguageFromFileName(activeTab?.name || "")}
                            value={activeTab ? activeTab.content || "" : "// Select a file to start coding"}
                            projectId={projectId}
                            fileId={activeTab?.id}
                            onContentChange={handleContentChange}
                            userName={session?.user?.name || "Unknown User"}
                            onAwarenessChange={setUsers}
                            aiStrength={aiStrength}
                        />
                    </div>

                    {/* Drag handle */}
                    <div
                        onMouseDown={() => { isDragging.current = true }}
                        style={{ height: "4px", background: "#1a1a1a", cursor: "row-resize", flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#BDC3C7")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#1a1a1a")}
                    />

                    {/* Terminal */}
                    {showTerminal && (
                        <div style={{ height: `${terminalHeight}px`, background: "#0d0d0d", borderTop: "1px solid #1a1a1a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
                            <div style={{ height: "30px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", padding: "0 14px", gap: "16px", flexShrink: 0 }}>
                                <span style={{ fontSize: "10px", color: "#BDC3C7", borderBottom: "1px solid #BDC3C7", height: "100%", display: "flex", alignItems: "center" }}>terminal</span>
                                <span style={{ fontSize: "10px", color: "#555" }}>output</span>
                                <span style={{ fontSize: "10px", color: "#555" }}>problems</span>
                                <span onClick={() => setShowTerminal(false)} style={{ marginLeft: "auto", fontSize: "14px", color: "#555", cursor: "pointer", lineHeight: 1 }}>×</span>
                            </div>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <TerminalComponent
                                    onReady={(fit) => { fitTerminal.current = fit }}
                                    content={activeTab?.content || ""}
                                    language={getLanguageFromFileName(activeTab?.name || "")}
                                    onInitReady={(sendInit) => { sendInitRef.current = sendInit }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status bar — full width, outside the flex row */}
            <div style={{ height: "22px", background: "#1a1a1a", borderTop: "1px solid #111", display: "flex", alignItems: "center", padding: "0 10px", gap: "16px", fontSize: "10px", color: "#7F8C8D", flexShrink: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
                    connected
                </span>
                <span>main</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
                    <span>{activeTab ? getLanguageFromFileName(activeTab.name).toUpperCase() : "—"}</span>
                    <span
                        onClick={() => {
                            setAiStrength(prev =>
                                prev === "off" ? "normal" : prev === "normal" ? "aggressive" : "off"
                            )
                        }}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                        <span style={{
                            width: "6px", height: "6px", borderRadius: "50%", display: "inline-block",
                            background: aiStrength === "off" ? "#555" : aiStrength === "normal" ? "#f59e0b" : "#4ade80"
                        }}></span>
                        ai: {aiStrength}
                    </span>
                    <span>UTF-8</span>
                    <span>COLLAB_IDE v1.0</span>
                </span>
            </div>
        </div>
    );
}