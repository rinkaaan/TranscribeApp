import { Box, Button, ContentLayout, Header, SpaceBetween, Table } from "@cloudscape-design/components"
import "./style.css"
import { useSelector } from "react-redux"
import { transcribeActions, transcribeSelector } from "./transcribeSlice.ts"
import { appDispatch } from "../../common/store.ts"
import { useEffect } from "react"
import { useSpeechRecognition } from "react-speech-recognition"
import { formatSeconds } from "../../common/typedUtils.ts"

export function Component() {
  const { results, transcribing, interimResult } = useSelector(transcribeSelector)
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
    appDispatch(transcribeActions.addFinalResult(finalTranscript))
    resetTranscript()
  }, [finalTranscript, resetTranscript])

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            transcribing ? (
              <Button
                iconName="microphone-off"
                onClick={() => appDispatch(transcribeActions.stopTranscribing())}
              >
                Stop transcribing
              </Button>
            ) : (
              <Button
                iconName="microphone"
                onClick={() => appDispatch(transcribeActions.startTranscribing())}
              >
                Start transcribing
              </Button>
            )
          }
        >
          Transcribe
        </Header>
      }
    >
      <SpaceBetween size="l">
        <Table
          columnDefinitions={[
            {
              header: "",
              cell: item => formatSeconds(item.seconds),
              width: "40px",
            },
            {
              header: "",
              cell: item => item.text,
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
                {/*<Button>Click to begin transcribing</Button>*/}
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>
    </ContentLayout>
  )
}
