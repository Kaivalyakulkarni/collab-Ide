"use client"

import { useEffect, useState } from "react"
import React from "react"

export interface FileNode {
    id: string
    name: string
    type: "file" | "folder"
    children?: FileNode[]
    content?: string
    path?: string
}

interface FileTreeProps {
    files: FileNode[]
    onFileSelect: (file: FileNode) => void
    selectedFile?: string
    onCreateFile?: (parentPath: string, name: string) => void
    onCreateFolder?: (parentPath: string, name: string) => void
}

const FileTree: React.FC<FileTreeProps> = ({ files, onFileSelect, selectedFile, onCreateFile, onCreateFolder }) => {

    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [creatingIn, setCreatingIn] = useState<string | null>(null)
    const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null)
    const [newName, setNewName] = useState("")
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const toggleFolder = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    const getAllFolderIds = (nodes: FileNode[]): string[] => {
        return nodes.flatMap(n => {
            if (n.type === "folder") {
                return [n.id, ...getAllFolderIds(n.children || [])]
            }
            return []
        })
    }

    useEffect(() => {
        setExpandedIds(new Set(getAllFolderIds(files)))
    }, [files])

    const renderTree = (nodes: FileNode[]) => {
        return nodes.map((node) => (
            <div key={node.id} style={{ marginLeft: "20px" }}>
                <div

                    onClick={() => {
                        if (node.type === "file") onFileSelect(node)
                        else toggleFolder(node.id)
                    }}
                    style={{
                        cursor: "pointer",
                        background: selectedFile === node.name ? "#1e1e1e" : "transparent",
                        borderLeft: selectedFile === node.name ? "2px solid #BDC3C7" : "2px solid transparent",
                        padding: "3px 8px",
                        borderRadius: "2px",
                        color: node.type === "folder" ? "#ECF0F1" : "#BDC3C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                    }}
                    onMouseEnter={e => {
                        setHoveredId(node.id)
                        if (selectedFile !== node.name) e.currentTarget.style.background = "#1a1a1a"
                    }}
                    onMouseLeave={e => {
                        setHoveredId(null)
                        if (selectedFile !== node.name) e.currentTarget.style.background = "transparent"
                    }}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {node.type === "folder" ? (
                            <span style={{ fontSize: "9px", color: "#7F8C8D" }}>
                                {expandedIds.has(node.id) ?
                                    <svg
                                        xmlns="http://w3.org"
                                        width={16}
                                        height={16}
                                        viewBox="0 0 16 16"
                                        fill="#797979"
                                    >
                                        <path d="M4 6l4 5 4-5H4z" />
                                    </svg>
                                    :
                                    <svg
                                        xmlns="http://w3.org"
                                        width={16}
                                        height={16}
                                        viewBox="0 0 16 16"
                                        fill="#797979"

                                    >
                                        <path d="M6 4l5 4-5 4V4z" />
                                    </svg>}
                            </span>
                        ) : (
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#60a5fa", flexShrink: 0, display: "inline-block" }} />
                        )}
                        {node.name}
                    </span>

                    {node.type === "folder" && hoveredId === node.id && (
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: "4px" }}>
                            <button
                                onClick={() => { setCreatingIn(node.path!); setCreatingType("file"); setNewName("") }}
                                title="New File"
                                style={{ background: "transparent", border: "none", color: "#BDC3C7", cursor: "pointer", padding: "0 2px" }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                            </button>
                            <button
                                onClick={() => { setCreatingIn(node.path!); setCreatingType("folder"); setNewName("") }}
                                title="New Folder"
                                style={{ background: "transparent", border: "none", color: "#BDC3C7", cursor: "pointer", padding: "0 2px" }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    <line x1="12" y1="11" x2="12" y2="17" />
                                    <line x1="9" y1="14" x2="15" y2="14" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {node.type === "folder" && creatingIn === node.path && (
                    <div style={{ marginLeft: "20px", padding: "2px 8px" }}>
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && newName.trim()) {
                                    if (creatingType === "file") onCreateFile?.(node.path!, newName.trim())
                                    if (creatingType === "folder") onCreateFolder?.(node.path!, newName.trim())
                                    setCreatingIn(null)
                                    setNewName("")
                                }
                                if (e.key === "Escape") {
                                    setCreatingIn(null)
                                    setNewName("")
                                }
                            }}
                            placeholder={creatingType === "file" ? "filename.ts" : "folder_name"}
                            style={{
                                background: "#1e1e1e",
                                border: "1px solid #BDC3C7",
                                borderRadius: "3px",
                                color: "#ECF0F1",
                                fontSize: "11px",
                                padding: "2px 6px",
                                outline: "none",
                                width: "140px",
                                fontFamily: "var(--font-jetbrains-mono), monospace"
                            }}
                        />
                    </div>
                )}

                {node.type === "folder" && expandedIds.has(node.id) && node.children && renderTree(node.children)}
            </div>
        ))
    }

    return (
        <div style={{ padding: "4px 0", color: "#BDC3C7", fontSize: "12px" }}>
            {renderTree(files)}
        </div>
    )
}

export default FileTree