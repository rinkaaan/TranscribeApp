import { useEffect } from "react"
import { socketManager } from "../../../common/clients.ts"
import { SocketInterimTranscriptionPayload, SocketMessagePayload, SocketTranscriptionPayload } from "../../../../openapi-client"
import { appDispatch } from "../../../common/store.ts"
import { transcribeActions } from "../transcribeSlice.ts"
import { scrollToBottom } from "../../../common/typedUtils.ts"

export default function useSocketEvents() {
  useEffect(() => {
    socketManager.receiveTranscription((message: SocketTranscriptionPayload) => {
      appDispatch(
        transcribeActions.addFinalResult({
          text: message.text!,
          username: message.username!,
          translation: message.translation,
        }),
      )
      appDispatch(scrollToBottom())
    })

    socketManager.receiveInterimTranscription((payload: SocketInterimTranscriptionPayload) => {
      appDispatch(transcribeActions.updateOtherInterimResult(payload))
      appDispatch(scrollToBottom())
    })

    socketManager.receiveMessage((message: SocketMessagePayload) => {
      appDispatch(transcribeActions.addFinalResult({ text: message.text!, username: message.username! }))
      appDispatch(scrollToBottom())
    })

    return () => {
      appDispatch(transcribeActions.stopTranscribing())
    }
  }, [])
}
