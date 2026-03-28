"use client";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket"
import { MonacoBinding } from "y-monaco";


import Editor from "@monaco-editor/react";


interface EditorProps {
    language: string;
    value: string;
}

const EditorComponent: React.FC<EditorProps> = ({ language, value }) => {
    return (
        <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage={language}
            defaultValue={value}
            value={value}
            onMount={(editor) => {
                const doc = new Y.Doc();
                const provider = new WebsocketProvider("ws://localhost:1234", // our server
                    "monaco-demo-room", // room name
                    doc);
                const type = doc.getText("monaco");  // Yjs text type
                const monacoBinding = new MonacoBinding(
                    type,
                    editor.getModel()!,
                    new Set([editor]),
                    provider.awareness
                )
            }}
        />
    );
};

export default EditorComponent;