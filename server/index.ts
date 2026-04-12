import { createServer } from "http"
import { WebSocketServer } from "ws"
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils"

import *as pty from "node-pty"

const port = process.env.PORT || 1234
const server = createServer()
const wss = new WebSocketServer({ server })

wss.on("connection", (ws, req) => {
    const url = req.url || ""
    if (url.startsWith("/terminal")) {
        // Handle terminal connections separately if needed
        const ptyProcess = pty.spawn("docker", [
            "run", "--rm", "-it",
            "--memory", "256m",      // limit RAM
            "--cpus", "0.5",         // limit CPU
            "node:18-alpine",
            "/bin/sh"
        ], {
            name: "xterm-color",
            cols: 80,
            rows: 24,
            cwd: process.env.HOME || process.cwd(),
            env: process.env as { [key: string]: string }
        })
        ptyProcess.onData(data => {
            ws.send(data)
        })
        ws.on("message", msg => {
            try {
                const data = JSON.parse(msg.toString())
                if (data.type === "resize") {
                    ptyProcess.resize(data.cols, data.rows)
                }
            } catch {
                ptyProcess.write(msg.toString())
            }
        })
        ws.on("close", () => {
            ptyProcess.kill()
        })


    } else {
        setupWSConnection(ws, req)
    }
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})