import { Button, Container, ContentLayout, Form, FormField, Header, Select, SpaceBetween } from "@cloudscape-design/components"
import { useState } from "react"
import languages from "../../common/languages.json"
import { useSelector } from "react-redux"
import { transcribeActions, transcribeSelector } from "../transcribe/transcribeSlice.ts"
import { appDispatch } from "../../common/store.ts"
import { mainActions } from "../mainSlice.ts"
import Cookies from "js-cookie"

export function Component() {
  const { sourceLang: sourceLang0, destinationLang: destinationLang0 } = useSelector(transcribeSelector)
  const [sourceLang, setSourceLang] = useState<string>(sourceLang0)
  const [destinationLang, setDestinationLang] = useState<string>(destinationLang0)
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
    Cookies.set("sourceLang", sourceLang, { expires: 365 })
    Cookies.set("destinationLang", destinationLang, { expires: 365 })
    setChanged(false)
  }

  function switchLanguages() {
    const sourceLang0 = sourceLang
    setSourceLang(destinationLang)
    setDestinationLang(sourceLang0)
    setChanged(true)
  }

  return (
    <ContentLayout
      header={
        <Header variant="h1">Settings</Header>
      }
    >
      <Form actions={
        <Button
          disabled={!changed}
          onClick={saveChanges}
        >Save changes</Button>
      }>
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
        </SpaceBetween>
      </Form>
    </ContentLayout>
)
}
