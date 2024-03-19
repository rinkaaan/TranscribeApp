import { Box, Button, ContentLayout, CopyToClipboard, Header, HelpPanel, SpaceBetween, Table, Toggle } from "@cloudscape-design/components"
import "./style.css"
import { useSelector } from "react-redux"
import { addFinalResult, joinMeeting, transcribeActions, transcribeSelector } from "./transcribeSlice.ts"
import { appDispatch } from "../../common/store.ts"
import { ReactNode, useEffect, useState } from "react"
import { useSpeechRecognition } from "react-speech-recognition"
import { scrollToBottom, shortUuid } from "../../common/typedUtils.ts"
import { mainActions, mainSelector } from "../mainSlice.ts"
import { useLocation } from "react-router-dom"
import { socketManager } from "../../common/clients.ts"
import { SocketInterimTranscriptionPayload, SocketMessagePayload, SocketTranscriptionPayload } from "../../../openapi-client"
import { Breakpoints } from "../../common/constants.ts"
import languages from "../../common/languages.json"
import _ from "lodash"

export function Component() {
  const location = useLocation()
  const { toolsOpen } = useSelector(mainSelector)
  const { results, transcribing, otherInterimResults, meetingCode, autoScroll, sourceLang, destinationLang } = useSelector(transcribeSelector)
  const { interimTranscript, finalTranscript, resetTranscript } = useSpeechRecognition()

  useEffect(() => {
    if (interimTranscript.trim() === "") return
    appDispatch(transcribeActions.updateOtherInterimResult({ text: interimTranscript, username: "You", id: "self" }))
    appDispatch(scrollToBottom())
  }, [interimTranscript])

  useEffect(() => {
    if (finalTranscript.trim() === "") return
    appDispatch(addFinalResult({ text: finalTranscript }))
    appDispatch(scrollToBottom())
    resetTranscript()
  }, [finalTranscript, resetTranscript])

  const [transcribeButton, setTranscribeButton] = useState<ReactNode>(null)
  const [autoScrollToggle, setAutoScrollToggle] = useState<ReactNode>(null)
  const copyMeetingUrlButton = (
    <CopyToClipboard
      copyButtonText="Copy meeting URL"
      copyErrorText="Failed to copy meeting URL"
      copySuccessText="Meeting URL copied"
      textToCopy={window.location.href}
    />
  )
  const newMeetingButton = (
    <Button
      iconName="add-plus"
      onClick={newMeeting}
    >
      New meeting
    </Button>
  )
  const joinMeetingButton = (
    <Button
      iconName="angle-right"
      onClick={() => appDispatch(transcribeActions.updateSlice({ joinMeetingModalOpen: true }))}
    >
      Join meeting
    </Button>
  )

  useEffect(() => {
    if (transcribing) {
      setTranscribeButton(
        (
          <Button
            iconName="microphone-off"
            onClick={() => appDispatch(transcribeActions.stopTranscribing())}
          >
            Stop {_.upperCase(languages[sourceLang]["google_translate_code"])} to {_.upperCase(languages[destinationLang]["google_translate_code"])}
          </Button>
        )
      )
    } else {
      setTranscribeButton(
        <Button
          iconName="microphone"
          onClick={() => appDispatch(transcribeActions.startTranscribing())}
        >
          {/*Start transcribing {sourceLang} to {destinationLang}*/}
          Transcribe {_.upperCase(languages[sourceLang]["google_translate_code"])} to {_.upperCase(languages[destinationLang]["google_translate_code"])}
        </Button>
      )
    }
  }, [transcribing])

  useEffect(() => {
    setAutoScrollToggle(
      <Toggle
        onChange={({ detail }) =>
          appDispatch(transcribeActions.updateSlice({ autoScroll: detail.checked }))
        }
        checked={autoScroll}
      >
        Auto scroll
      </Toggle>
    )
  }, [autoScroll])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("code", meetingCode)
    window.history.replaceState({}, "", url)
  }, [location])

  function newMeeting() {
    const newCode = shortUuid()
    appDispatch(joinMeeting(newCode))
    if (window.innerWidth <= Breakpoints.xSmall) {
      appDispatch(mainActions.updateSlice({ toolsOpen: false }))
    }
  }

  useEffect(() => {
    socketManager.receiveTranscription((message: SocketTranscriptionPayload) => {
      appDispatch(
        transcribeActions.addFinalResult({
          text: message.text!,
          username: message.username!,
          translation: message.translation,
        })
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

  useEffect(() => {
    const tools = (
      <HelpPanel header={<h2>Actions</h2>}>
        <SpaceBetween size="s" direction="horizontal" alignItems="center">
          {transcribeButton}
          {copyMeetingUrlButton}
          {newMeetingButton}
          {joinMeetingButton}
          {autoScrollToggle}
        </SpaceBetween>
      </HelpPanel>
    )

    appDispatch(mainActions.updateSlice({ tools, toolsHidden: false }))

    return () => {
      appDispatch(mainActions.updateSlice({ toolsHidden: true }))
    }
  }, [transcribeButton, autoScrollToggle])

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={!toolsOpen && (
            <SpaceBetween size="s" direction="horizontal" alignItems="center">
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
              cell: item => item.username,
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
          items={[
            ...results,
            ...Object.values(otherInterimResults),
          ]}
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
                {copyMeetingUrlButton}
                {newMeetingButton}
                {joinMeetingButton}
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>
    </ContentLayout>
  )
}
