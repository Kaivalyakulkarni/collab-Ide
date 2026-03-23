"use client";

import dynamic from "next/dynamic";
import FileTree, { mockFiles } from "@/components/FileTree";

import { useState } from "react";
import { FileNode } from "@/components/FileTree";

const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage() {
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
                <FileTree files={mockFiles} onFileSelect={setSelectedFile} selectedFile={selectedFile?.name} />
            </div>
            <div style={{ flex: 1 }}>
                <EditorComponent
                    language="javascript"
                    value={selectedFile ? selectedFile.name : "// Select a file to start coding"}
                />
            </div>

        </div>
    );
}