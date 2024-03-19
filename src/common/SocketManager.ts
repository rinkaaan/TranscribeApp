import { io, Socket } from "socket.io-client"
import { SocketJoinLeavePayload, SocketMessagePayload, SocketTranscriptionPayload } from "../../openapi-client"

export class SocketManager {
  socket: Socket

  constructor() {
    this.socket = io(import.meta.env.VITE_API_URL)
    this.socket.connect()

    this.socket.on("connect", () => {
      console.info("Connected to socket server")
    })
  }

  joinRoom(payload: SocketJoinLeavePayload) {
    this.socket.emit("join", payload)
  }

  leaveRoom(payload: SocketJoinLeavePayload) {
    this.socket.emit("leave", payload)
  }

  sendTranscription(payload: SocketTranscriptionPayload) {
    this.socket.emit("transcription", payload)
  }

  receiveTranscription(callback: (message: SocketTranscriptionPayload) => void) {
    this.socket.off("transcription")
    this.socket.on("transcription", callback)
  }

  sendMessage(payload: SocketMessagePayload) {
    this.socket.emit("message", payload)
  }

  receiveMessage(callback: (message: SocketMessagePayload) => void) {
    this.socket.off("message")
    this.socket.on("message", callback)
  }
}