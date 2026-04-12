"use client";

import dynamic from "next/dynamic";
import FileTree from "@/components/FileTree";

import { use, useEffect, useState, useRef } from "react";
import { FileNode } from "@/components/FileTree";

import { useSession } from "next-auth/react";

import TerminalComponent from "@/components/Terminal"


const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
    const [files, setFiles] = useState<FileNode[]>([])

    useEffect(() => {
        // Fetch files from the API
        fetch(`/api/projects/${projectId}/files`)
            .then((response) => response.json())
            .then((data) => { setFiles(data.files) }) // Assuming the API returns { files: [...] }
            .catch((error) => console.error("Error fetching files:", error));
    }, [projectId])

    const saveTimer = useRef<NodeJS.Timeout | null>(null)

    const selectedFileRef = useRef<FileNode | null>(null)

    const handleFileSelect = (file: FileNode) => {
        selectedFileRef.current = file
        setSelectedFile(file)
    }

    const handleContentChange = (content: string) => {
        if (!selectedFileRef.current) return  // use ref instead of state

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
        }, 1000)
    }

    const { data: session } = useSession()

    const [users, setUsers] = useState<{ name: string, color: string }[]>([])


    const [showTerminal, setShowTerminal] = useState(true)

    const [terminalHeight, setTerminalHeight] = useState(300)
    const isDragging = useRef(false)

    const fitTerminal = useRef<(() => void) | null>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            const container = document.querySelector('.editor-container') as HTMLElement
            if (!container) return
            const containerRect = container.getBoundingClientRect()
            const newHeight = containerRect.bottom - e.clientY
            // clamp between 100px and 600px
           setTerminalHeight(Math.min(500, Math.max(100, newHeight)))
           fitTerminal.current?.()
        }

        const handleMouseUp = () => {
            isDragging.current = false
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [])


    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Sidebar */}
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px", flexShrink: 0 }}>
                <FileTree files={files} onFileSelect={handleFileSelect} selectedFile={selectedFile?.name} />
            </div>

            {/* Right side — column layout */}
            <div className="editor-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                {/* Presence bar */}
                <div onClick={() => setShowTerminal(!showTerminal)} style={{ height: "40px", background: "#1e1e1e", borderBottom: "1px solid #333", display: "flex", alignItems: "center", padding: "0 12px", gap: "8px" }}>
                    {[...new Map(users.map(u => [u.name, u])).values()].map((user) => (
                        <div key={user.name} title={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: user.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#000" }}>
                            {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                    ))}
                    {showTerminal ? <span style={{ marginLeft: "auto", fontSize: "12px", color: "#888" }}>Click to hide terminal</span> : <span style={{ marginLeft: "auto", fontSize: "12px", color: "#888" }}>Click to show terminal</span>}
                </div>

                {/* Editor */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                    <EditorComponent
                        language="javascript"
                        value={selectedFile ? selectedFile.content || "" : "// Select a file to start coding"}
                        projectId={projectId}
                        fileId={selectedFile?.id}
                        onContentChange={handleContentChange}
                        userName={session?.user?.name || "Unknown User"}
                        onAwarenessChange={setUsers}
                    />
                </div>
                {/* Drag handle */}
                <div
                    onMouseDown={() => { isDragging.current = true }}
                    style={{
                        height: "5px",
                        background: "#333",
                        cursor: "row-resize",
                        flexShrink: 0
                    }}
                />
                {/* Terminal */}
                {showTerminal && (
                    <div style={{
                        height: `${terminalHeight}px`,
                        borderTop: "1px solid #ccc",
                        padding: "8px",
                        background: "#111111",
                        overflow:"hidden"
                    }}>
                        <div style={{ height: "102%" }}>
                            <TerminalComponent onReady={(fit) =>{fitTerminal.current = fit}} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}