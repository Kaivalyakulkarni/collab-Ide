"use client";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket"
import { MonacoBinding } from "y-monaco";
import { useRef } from "react"

import Editor from "@monaco-editor/react";

import type { editor, languages, Position } from "monaco-editor"


interface EditorProps {
    language: string;
    value: string;
    projectId: string;
    fileId?: string;
    onContentChange?: (content: string) => void;
    userName?: string;
    onAwarenessChange?: (users: { name: string, color: string }[]) => void
    aiStrength?: "off" | "normal" | "aggressive"
}

const EditorComponent: React.FC<EditorProps> = ({ language, value, projectId, onContentChange, fileId, userName, onAwarenessChange, aiStrength = "normal" }) => {
    const languageRef = useRef(language)      // create the ref
    languageRef.current = language

    const aiStrengthRef = useRef(aiStrength)
    aiStrengthRef.current = aiStrength



    return (
        <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            defaultValue={value}
            value={value}
            onMount={(editor, monaco) => {

                const doc = new Y.Doc();
                const provider = new WebsocketProvider(
                    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234", // our server
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

                const decorationsCollection = editor.createDecorationsCollection([])

                provider.awareness.setLocalStateField("user", {
                    name: userName || "Unknown User",
                    color: "#" + Math.floor(Math.random() * 16777215).toString(16) // random color
                })


                editor.onDidChangeCursorPosition((e) => {
                    const position = editor.getPosition();
                    provider.awareness.setLocalStateField("cursor", {
                        line: position?.lineNumber,
                        column: position?.column
                    })
                })

                const styleE1 = document.createElement("style")
                document.head.appendChild(styleE1)

                provider.awareness.on('change', () => {
                    const states = provider.awareness.getStates()

                    // generate CSS for each remote user's color
                    const css = Array.from(states.values())
                        .filter(state => state.user)
                        .map(state => {
                            const color = state.user.color
                            const cls = color.replace('#', '')
                            return `
                              .cursor-${cls} { 
                                  border-left: 2px solid ${color} !important; 
                              }
                              .cursor-label-${cls}::before { 
                                  content: '${state.user.name}';
                                  background: ${color};
                                  color: #000;
                                  font-size: 10px;
                                  padding: 1px 4px;
                                  border-radius: 2px;
                                  position: absolute;
                                  top: -16px;
                                  white-space: nowrap;
                              }
                          `
                        }).join('')
                    styleE1.innerHTML = css

                    const users = Array.from(states.values())
                        .filter(state => state.user)
                        .map(state => state.user)
                    onAwarenessChange?.(users)

                    const decorations = Array.from(states.entries())
                        .filter(([clientId, state]) => clientId !== provider.awareness.clientID && state.cursor && state.user) // exclude local user
                        .map(([_, state]) => ({
                            range: new monaco.Range(
                                state.cursor.line,
                                state.cursor.column,
                                state.cursor.line,
                                state.cursor.column + 1
                            ),
                            options: {
                                className: `cursor-${state.user.color.replace('#', '')}`,
                                beforeContentClassName: `cursor-label-${state.user.color.replace('#', '')}`,
                                stickiness: 1
                            }
                        }))
                    decorationsCollection.set(decorations)
                })

                const completionTimer = { current: null as ReturnType<typeof setTimeout> | null }

                monaco.languages.registerInlineCompletionsProvider(
                    { pattern: "**" },
                    {
                        provideInlineCompletions: (model: editor.ITextModel, position: Position) => {
                            const code = model.getValueInRange({
                                startLineNumber: 1,
                                startColumn: 1,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            })


                            return new Promise((resolve) => {
                                if (completionTimer.current) {
                                    clearTimeout(completionTimer.current)
                                }

                                completionTimer.current = setTimeout(async () => {
                                    if (aiStrengthRef.current === "off") {
                                        resolve({ items: [] })
                                        return
                                    }
                                    try {
                                        const response = await fetch("/api/ai/complete", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify({ code, language: languageRef.current })
                                        })
                                        const { completion } = await response.json()

                                        resolve({
                                            items: [{
                                                insertText: completion,
                                                range: {
                                                    startLineNumber: position.lineNumber,
                                                    startColumn: position.column,
                                                    endLineNumber: position.lineNumber,
                                                    endColumn: position.column
                                                }
                                            }]
                                        })

                                    } catch (error) {
                                        resolve({ items: [] }) // Return empty completions on error
                                    }
                                }, aiStrengthRef.current === "aggressive" ? 200 : 60) // Adjust the delay as needed
                            })
                        },
                        freeInlineCompletions: () => { }
                    }
                )
            }}
        />
    );
};

export default EditorComponent;