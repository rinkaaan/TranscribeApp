import { Box, Button, ContentLayout, Header, SpaceBetween, Table } from "@cloudscape-design/components"
import "./style.css"

interface Item {
  timestamp: string
  text: string
}

const items: Item[] = [
  {
    timestamp: "0:00",
    text: "First",
  },
  {
    timestamp: "0:13",
    text: "Second",
  },
  {
    timestamp: "0:25",
    text: "Third",
  },
  {
    timestamp: "0:40",
    text: "Fourth",
  },
  {
    timestamp: "0:55",
    text: "Fifth",
  },
  {
    timestamp: "1:10",
    text: "Sixth",
  },
]

// const items: Item[] = []

export function Component() {

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <Button iconName="microphone" />
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
              cell: item => item.timestamp,
              width: "40px",
            },
            {
              header: "",
              cell: item => item.text,
            },
          ]}
          items={items}
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
                <Button>Click to begin transcribing</Button>
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>
    </ContentLayout>
  )
}
