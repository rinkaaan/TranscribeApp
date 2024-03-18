import { AppLayout, Flashbar, SideNavigation, SideNavigationProps } from "@cloudscape-design/components"
import { Navigate, Outlet, ScrollRestoration, UIMatch, useLocation, useMatches, useNavigate } from "react-router-dom"
import { Fragment, useEffect, useState } from "react"
import CloudBreadcrumbGroup from "../components/CloudBreadcrumbGroup"
import { useSelector } from "react-redux"
import { appDispatch } from "../common/store"
import { mainActions, mainSelector } from "./mainSlice"
import { CrumbHandle } from "../App"

import { prepareNotifications } from "../common/storeUtils"
import { socketManager } from "../common/clients.ts"
import { transcribeSelector } from "./transcribe/transcribeSlice.ts"

const items: SideNavigationProps.Item[] = [
  {
    type: "link",
    text: "Home",
    href: "/transcribe",
  },
  {
    type: "link",
    text: "Settings",
    href: "/settings",
  },
]

export function getCrumbs(matches: UIMatch<string, CrumbHandle>[]) {
  return matches
    .filter((match) => Boolean(match.handle?.crumbs))
    .map((match) => match.handle.crumbs())
}

export function BreadCrumbs() {
  const matches = useMatches() as UIMatch<string, CrumbHandle>[]
  const crumbs = getCrumbs(matches).map((crumb) => {
    return {
      text: crumb.crumb,
      href: crumb.path,
    }
  })
  const showCrumbs = crumbs.length > 1

  return (
    <div style={{ opacity: showCrumbs ? 1 : 0, pointerEvents: showCrumbs ? "auto" : "none" }}>
      <CloudBreadcrumbGroup items={crumbs}/>
    </div>
  )
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const matches = useMatches() as UIMatch<string, CrumbHandle>[]
  const crumbs = getCrumbs(matches)
  const [activeHref, setActiveHref] = useState<string | undefined>(undefined)
  const { navigationOpen, notifications, startingPath, toolsOpen, tools, toolsHidden, username } = useSelector(mainSelector)
  const { meetingCode } = useSelector(transcribeSelector)

  useEffect(() => {
    if (startingPath) {
      navigate(startingPath)
    }
  }, [navigate, startingPath])

  useEffect(() => {
    // Go from last to first crumb, set activeHref to the first one that matches items
    for (const crumb of crumbs.reverse()) {
      if (crumb.path == null) continue
      if (items.find(item => item["href"] === crumb.path)) {
        setActiveHref(crumb.path)
        break
      }
    }
  }, [crumbs])

  useEffect(() => {
    socketManager.joinRoom({ room: meetingCode, username })
    return () => {
      socketManager.leaveRoom({ room: meetingCode, username })
    }
  }, [])

  if (location.pathname === "/") {
    return <Navigate to="/media" replace/>
  } else {
    return (
      <Fragment>
        <ScrollRestoration />
        <AppLayout
          navigation={
            <SideNavigation
              header={{
                text: "Transcribe",
                href: "/transcribe",
              }}
              onFollow={e => {
                e.preventDefault()
                navigate(e.detail.href)
              }}
              activeHref={activeHref}
              items={items}
            />
          }
          navigationOpen={navigationOpen}
          onNavigationChange={(e) => {
            appDispatch(mainActions.updateSlice({ navigationOpen: e.detail.open }))
          }}
          content={<Outlet/>}
          breadcrumbs={<BreadCrumbs/>}
          notifications={
            <Flashbar items={prepareNotifications(notifications)}/>
          }
          tools={tools}
          toolsOpen={toolsOpen}
          toolsHide={toolsHidden}
          onToolsChange={(e) => {
            appDispatch(mainActions.updateSlice({ toolsOpen: e.detail.open }))
          }}
        />
      </Fragment>
    )
  }
}
