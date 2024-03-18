import { io } from "socket.io-client"

export const socket = io(import.meta.env.VITE_API_URL)

socket.on("connect", () => {
  console.info("connected")
})
