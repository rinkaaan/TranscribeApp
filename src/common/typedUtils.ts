import { format, isToday, isYesterday, parseISO } from "date-fns"
import { v4 } from "uuid"
import { ApiError } from "../../openapi-client"

export function formatDate(inputDate?: string) {
  if (!inputDate) return null
  const parsedDate = parseISO(inputDate)

  if (isToday(parsedDate)) {
    return format(parsedDate, "'Today at' h:mm a")
  } else if (isYesterday(parsedDate)) {
    return format(parsedDate, "'Yesterday at' h:mm a")
  } else {
    return format(parsedDate, "MMM d, yyyy 'at' h:mm a")
  }
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function uuid() {
  return v4()
}

export function getApiErrorMessage(error: any) {
  const e = error as ApiError
  return e.body?.message || "An unexpected error occurred"
}

export type AsyncStatus = "pending" | "fulfilled" | "rejected"

export function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  // Format the time string
  let formattedTime = ""
  if (hours > 0) {
    formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  } else {
    formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return formattedTime
}

export async function translate(text: string, sourceLang: string = "auto", targetLang: string = "en"): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

  try {
    const res = await fetch(url)
    const json = await res.json()

    const pieces = json[0]
    let translatedText = ""

    for (let i = 0; i < pieces.length; i++) {
      translatedText += pieces[i][0]
    }

    return translatedText
  } catch (error) {
    throw new Error("Translation failed")
  }
}

export function scrollToBottom() {
  window.scroll({
    top: document.body.scrollHeight,
    behavior: "smooth",
  })
}
