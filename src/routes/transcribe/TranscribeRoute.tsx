import { Box, Button, ContentLayout, CopyToClipboard, Header, HelpPanel, SpaceBetween, Table } from "@cloudscape-design/components"
import "./style.css"
import { useSelector } from "react-redux"
import { addFinalResult, transcribeActions, transcribeSelector } from "./transcribeSlice.ts"
import { appDispatch } from "../../common/store.ts"
import { ReactNode, useEffect, useState } from "react"
import { useSpeechRecognition } from "react-speech-recognition"
import { formatSeconds } from "../../common/typedUtils.ts"
import { mainActions, mainSelector } from "../mainSlice.ts"

export function Component() {
  const { toolsOpen } = useSelector(mainSelector)
  const { results, transcribing, interimResult, meetingCode } = useSelector(transcribeSelector)
  const { interimTranscript, finalTranscript, resetTranscript } = useSpeechRecognition()

  useEffect(() => {
    if (interimTranscript.trim() === "") return
    if (!interimResult) {
      appDispatch(transcribeActions.addInterimResult(interimTranscript))
    } else {
      appDispatch(transcribeActions.updateInterimResult(interimTranscript))
    }
  }, [interimResult, interimTranscript])

  useEffect(() => {
    if (finalTranscript.trim() === "") return
    appDispatch(addFinalResult(finalTranscript))
    resetTranscript()
  }, [finalTranscript, resetTranscript])

  const [transcribeButton, setTranscribeButton] = useState<ReactNode>(null)
  const copyMeetingUrlButton = (
    <CopyToClipboard
      copyButtonText="Copy meeting URL"
      copyErrorText="Failed to copy meeting URL"
      copySuccessText="Meeting URL copied"
      textToCopy={window.location.href}
    />
  )

  useEffect(() => {

    if (transcribing) {
      setTranscribeButton(
        (
          <Button
            iconName="microphone-off"
            onClick={() => appDispatch(transcribeActions.stopTranscribing())}
          >
            Stop transcribing
          </Button>
        )
      )
    } else {
      setTranscribeButton(
        <Button
          iconName="microphone"
          onClick={() => appDispatch(transcribeActions.startTranscribing())}
        >
          Start transcribing
        </Button>
      )
    }
  }, [transcribing])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("code", meetingCode)
    window.history.replaceState({}, "", url)

    return () => {
      appDispatch(transcribeActions.stopTranscribing())
    }
  }, [])

  useEffect(() => {
    const tools = (
      <HelpPanel header={<h2>Actions</h2>}>
        <SpaceBetween size="s" direction="horizontal">
          {copyMeetingUrlButton}
          {transcribeButton}
        </SpaceBetween>
      </HelpPanel>
    )

    appDispatch(mainActions.updateSlice({ tools, toolsHidden: false }))

    return () => {
      appDispatch(mainActions.updateSlice({ toolsHidden: true }))
    }
  }, [transcribeButton])

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={!toolsOpen && (
            <SpaceBetween size="s" direction="horizontal">
              {transcribeButton}
            </SpaceBetween>
          )}
        >
          Transcribe | {meetingCode}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Table
          columnDefinitions={[
            {
              header: "",
              cell: item => formatSeconds(item.seconds),
            },
            {
              header: "",
              cell: item => (
                <div className="result">
                  <div>{item.text}</div>
                  <div className="translation">{item.translation}</div>
                </div>
              ),
              width: "100%",
            },
          ]}
          items={interimResult ? [...results, interimResult] : results}
          loadingText="Loading resources"
          sortingDisabled
          empty={
            <Box
              margin={{ vertical: "xs" }}
              textAlign="center"
              color="inherit"
            >
              <SpaceBetween size="m">
                <b>No words spoken yet</b>
                Share the meeting URL with others to let them join the transcription session.
                {/*<Button>Click to begin transcribing</Button>*/}
                {copyMeetingUrlButton}
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>
    </ContentLayout>
  )
}
