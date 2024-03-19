import { HelpPanel, SpaceBetween } from "@cloudscape-design/components"
import { AutoScrollToggle, CopyMeetingUrlButton, JoinMeetingButton, NewMeetingButton, TranscribeButton } from "./Buttons.tsx"

export default function Tools() {
  return (
    <HelpPanel header={<h2>Actions</h2>}>
      <SpaceBetween
        size="s"
        direction="horizontal"
        alignItems="center"
      >
        <TranscribeButton />
        <CopyMeetingUrlButton />
        <NewMeetingButton />
        <JoinMeetingButton />
        <AutoScrollToggle />
      </SpaceBetween>
    </HelpPanel>
  )
}
