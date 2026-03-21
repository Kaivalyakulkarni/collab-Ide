"use client"; 

import dynamic from "next/dynamic";
import FileTree, { mockFiles } from "@/components/FileTree";

const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage() {
    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div style={{ width: "250px", borderRight: "1px solid #ccc", padding: "10px" }}>
                <FileTree files={mockFiles} />
            </div>
            <div style={{ flex: 1 }}>
                <EditorComponent language="javascript" value="// Start coding..." />
            </div>
        </div>
    );
}