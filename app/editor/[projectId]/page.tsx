"use client";

import dynamic from "next/dynamic";
import FileTree from "@/components/FileTree";

import { useEffect, useState } from "react";
import { FileNode } from "@/components/FileTree";


const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage({ params }: { params: { projectId: string } }) {
    const projectId = params.projectId;
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
    const [files, setFiles] = useState<FileNode[]>([])

    useEffect(() => {
        // Fetch files from the API
        fetch(`/api/projects/${projectId}/files`)
            .then((response) => response.json())
            .then((data) => {setFiles(data.files)}) // Assuming the API returns { files: [...] }
            .catch((error) => console.error("Error fetching files:", error));
    }, [projectId])
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
                <FileTree files={files} onFileSelect={setSelectedFile} selectedFile={selectedFile?.name} />
            </div>
            <div style={{ flex: 1 }}>
                <EditorComponent
                    language="javascript"
                    value={selectedFile ? `// Content of ${selectedFile.name}` : "// Select a file to view its content"}
                    projectId={projectId}
                />
            </div>

        </div>
    );
}