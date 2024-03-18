import { Button, Container, ContentLayout, Form, FormField, Header, HelpPanel, Input, Select, SpaceBetween } from "@cloudscape-design/components"
import { useEffect, useState } from "react"
import languages from "../../common/languages.json"
import { useSelector } from "react-redux"
import { transcribeActions, transcribeSelector } from "../transcribe/transcribeSlice.ts"
import { appDispatch } from "../../common/store.ts"
import { mainActions, mainSelector } from "../mainSlice.ts"
import Cookies from "js-cookie"
import { ExternalLinkGroup } from "../../components/external-link-group.tsx"
import { socketManager } from "../../common/clients.ts"

export function Component() {
  const { username: username0 } = useSelector(mainSelector)
  const { sourceLang: sourceLang0, destinationLang: destinationLang0, meetingCode } = useSelector(transcribeSelector)
  const [sourceLang, setSourceLang] = useState<string>(sourceLang0)
  const [destinationLang, setDestinationLang] = useState<string>(destinationLang0)
  const [username, setUsername] = useState<string>(username0)
  const [changed, setChanged] = useState(false)
  const languageOptions = Object.keys(languages).map((key) => ({ label: key, value: key }))

  function saveChanges() {
    if (sourceLang === destinationLang) {
      appDispatch(mainActions.addNotification({
        type: "error",
        content: "Source and destination languages cannot be the same",
      }))
      return
    }
    appDispatch(transcribeActions.updateSlice({ sourceLang, destinationLang }))
    if (username !== username0) {
      appDispatch(mainActions.updateSlice({ username }))
      socketManager.sendMessage({
        room: meetingCode,
        username: "Server",
        text: `${username0} changed their username to ${username}`,
      })
    }
    Cookies.set("sourceLang", sourceLang, { expires: 365 })
    Cookies.set("destinationLang", destinationLang, { expires: 365 })
    Cookies.set("username", username, { expires: 365 })
    setChanged(false)
  }

  function switchLanguages() {
    const sourceLang0 = sourceLang
    setSourceLang(destinationLang)
    setDestinationLang(sourceLang0)
    setChanged(true)
  }

  const tools = (
    <HelpPanel
      header={<h2>Transcribing System Audio</h2>}
      footer={
        <ExternalLinkGroup
          items={[
            {
              href: "https://www.howtogeek.com/39532/how-to-enable-stereo-mix-in-windows-7-to-record-audio/",
              text: "Enabling stereo mix on Windows",
            },
            {
              href: "https://wikis.utexas.edu/display/comm/How+to+set+up+BlackHole+Audio+on+a+Mac",
              text: "Setting up BlackHole on Mac",
            },
          ]}
        />
      }
    >
      <SpaceBetween
        size="s"
        direction="horizontal"
      >
        Although Transcribe is mainly intended for use with spoken audio received through a microphone, you can also transcribe audio from your computer by enabling stereo mix for Windows computers or
        using something like BlackHole for Macs.
      </SpaceBetween>
    </HelpPanel>
  )

  useEffect(() => {
    appDispatch(mainActions.updateSlice({ tools, toolsHidden: false }))
    return () => {
      appDispatch(mainActions.updateSlice({ toolsHidden: true }))
    }
  }, [])

  return (
    <ContentLayout
      header={
        <Header variant="h1">Settings</Header>
      }
    >
      <Form
        actions={
          <Button
            disabled={!changed}
            onClick={saveChanges}
          >Save changes</Button>
        }
      >
        <SpaceBetween size="l">
          <Container header={<Header variant="h2">Language</Header>}>
            <form onSubmit={(e) => e.preventDefault()}>
              <SpaceBetween size="s">
                <FormField label="Source language">
                  <Select
                    selectedOption={{ label: sourceLang, value: sourceLang }}
                    onChange={({ detail }) => {
                      setSourceLang(detail.selectedOption.value!)
                      setChanged(true)
                    }}
                    options={languageOptions}
                  />
                </FormField>
                <FormField label="Destination language">
                  <Select
                    selectedOption={{ label: destinationLang, value: destinationLang }}
                    onChange={({ detail }) => {
                      setDestinationLang(detail.selectedOption.value!)
                      setChanged(true)
                    }}
                    options={languageOptions}
                  />
                </FormField>
                <Button onClick={switchLanguages}>Switch languages</Button>
              </SpaceBetween>
            </form>
          </Container>
          <Container header={<Header variant="h2">Profile</Header>}>

            <FormField label="Username">
              <Input
                value={username}
                onChange={({ detail }) => {
                  setUsername(detail.value)
                  setChanged(true)
                }}
              />
            </FormField>
          </Container>
        </SpaceBetween>
      </Form>
    </ContentLayout>
  )
}
