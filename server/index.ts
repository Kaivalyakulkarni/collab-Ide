import { createServer } from "http"
import { WebSocketServer } from "ws"
// @ts-ignore
import { setupWSConnection } from "y-websocket/bin/utils"

const port = process.env.PORT || 1234
const server = createServer()
const wss = new WebSocketServer({ server })

wss.on("connection", (ws, req) => {
    setupWSConnection(ws, req)
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})