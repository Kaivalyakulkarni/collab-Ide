"use client";

import { useEffect, useRef } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"

const TerminalComponent = () => {
    const terminalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const term = new Terminal()
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)

         if (terminalRef.current) {
            term.open(terminalRef.current)
            fitAddon.fit()
        }

        const ws = new WebSocket("ws://localhost:1234/terminal")

        ws.onmessage = (event) => {
            term.write(event.data)
        }

        term.onData((data) => {
            ws.send(data)
        })

        return () => {
            ws.close()
            term.dispose()
        }

    }, [])

    return (
        <div ref={terminalRef} style={{ width: "100%", height: "100%" }}></div>
    )
}

export default TerminalComponent