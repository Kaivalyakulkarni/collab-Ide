"use client"; 

import dynamic from "next/dynamic";

const EditorComponent = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorPage() {
    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <EditorComponent language="javascript" value="// Start coding..." />
        </div>
    );
}