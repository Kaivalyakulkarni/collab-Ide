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
        // console.log("[PTY] Spawning docker...")
        // console.log("[PTY] PATH:", process.env.PATH)
        const dockerPath = process.platform === "win32"
            ? "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"
            : "docker"

        const ptyProcess = pty.spawn(dockerPath, [
            "run", "--rm", "-it",
            "--memory", "256m",
            "--cpus", "0.5",
            "node:18-alpine",
            "/bin/sh"
        ], {
            name: "xterm-color",
            cols: 80,
            rows: 24,
            cwd: process.cwd(),
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
                else if(data.type === "init") {
                    ptyProcess.write(`cat > /tmp/${data.fileName} << 'EOF'\n${data.content}\nEOF\n`)
                    setTimeout(() => {
                        ptyProcess.write(`clear\n`)
                    },500)
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