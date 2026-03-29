"use client";

import dynamic from "next/dynamic";
import FileTree from "@/components/FileTree";

import { use, useEffect, useState, useRef } from "react";
import { FileNode } from "@/components/FileTree";

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


    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
                <FileTree files={files} onFileSelect={handleFileSelect} selectedFile={selectedFile?.name} />            </div>
            <div style={{ flex: 1 }}>
                <EditorComponent
                    language="javascript"
                    value={selectedFile ? selectedFile.content || "" : "// Select a file to start coding"}
                    projectId={projectId}
                    fileId={selectedFile?.id}
                    onContentChange={handleContentChange}
                />
            </div>

        </div>
    );
}