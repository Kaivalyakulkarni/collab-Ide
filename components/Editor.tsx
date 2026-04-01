"use client";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket"
import { MonacoBinding } from "y-monaco";


import Editor from "@monaco-editor/react";


interface EditorProps {
    language: string;
    value: string;
    projectId: string;
    fileId?: string;
    onContentChange?: (content: string) => void;
    userName?: string;
    onAwarenessChange?: (users: { name: string, color: string }[]) => void
}

const EditorComponent: React.FC<EditorProps> = ({ language, value, projectId, onContentChange, fileId, userName, onAwarenessChange }) => {
    return (
        <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage={language}
            defaultValue={value}
            value={value}
            onMount={(editor) => {

                const doc = new Y.Doc();
                const provider = new WebsocketProvider(
                    "ws://localhost:1234", // our server
                    fileId || projectId, // room name
                    doc);
                const type = doc.getText("monaco");  // Yjs text type

                type.observe(() => {
                    console.log("Yjs changed:", type.toString())
                    onContentChange?.(type.toString())
                })

                // if Yjs doc is empty, seed it with database content
                if (type.length === 0 && value && !value.startsWith("// Select a file")) {
                    type.insert(0, value)
                }
                //then bind
                const monacoBinding = new MonacoBinding(
                    type,
                    editor.getModel()!,
                    new Set([editor]),
                    provider.awareness
                )

                provider.awareness.setLocalStateField("user", {
                    name: userName || "Unknown User",
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16) // random color
                })

                provider.awareness.on('change', () => {
                    const states = provider.awareness.getStates()
                    const users = Array.from(states.values())
                        .filter(state => state.user)
                        .map(state => state.user)
                    onAwarenessChange?.(users)
                })

            }}
        />
    );
};

export default EditorComponent;