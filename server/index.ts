import { createServer } from "http"
import { WebSocketServer } from "ws"
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils"

import *as pty from "node-pty"
import * as os from "os"

const port = process.env.PORT || 1234
const server = createServer()
const wss = new WebSocketServer({ server })

wss.on("connection", (ws, req) => {
    const url = req.url || ""
    if(url.startsWith("/terminal")){
        // Handle terminal connections separately if needed
        const shell = os.platform() === "win32" ? "powershell.exe" : "bash"
        const ptyProcess = pty.spawn(shell, [], {
            name:"xterm-color",
            cols: 80,
            rows: 24,
            cwd: process.env.HOME || process.cwd(),
            env: process.env as { [key: string]: string }
        })
        ptyProcess.onData(data => {
            ws.send(data)
        })
        ws.on("message", msg => {
            ptyProcess.write(msg.toString())
        })
        ws.on("close", () => {
            ptyProcess.kill()
        })


    }else{
        setupWSConnection(ws, req)
    }
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})