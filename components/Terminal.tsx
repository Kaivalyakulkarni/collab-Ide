"use client";

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

interface TerminalProps {
    onReady?: (fit: () => void) => void
}

const TerminalComponent = ({ onReady }: TerminalProps) => {
    const terminalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const term = new Terminal()
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)

        if (terminalRef.current) {
            term.open(terminalRef.current)
            fitAddon.fit()
        }

        onReady?.(() => fitAddon.fit())

        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234"}/terminal`)

        ws.onerror = () => {
            term.write("\r\n\x1b[33mTerminal unavailable in production.\x1b[0m\r\n")
        }

        ws.onclose = (event) => {
            if (event.code !== 1000) {
                term.write("\r\n\x1b[33mTerminal unavailable in production.\x1b[0m\r\n")
            }
        }

        const handleResize = () => {
            fitAddon.fit()
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }))
            }
        }

        window.addEventListener("resize", handleResize)

        ws.onmessage = (event) => { term.write(event.data) }
        term.onData((data) => { ws.send(data) })

        return () => {
            window.removeEventListener("resize", handleResize)
            ws.close()
            term.dispose()
        }
    }, [])

    return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />
}

export default TerminalComponent