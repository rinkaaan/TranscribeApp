import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../../common/reducers"
import "regenerator-runtime/runtime"
import SpeechRecognition from "react-speech-recognition"
import { scrollToBottom, shortUuid, translate } from "../../common/typedUtils.ts"
import store from "../../common/store.ts"
import languages from "../../common/languages.json"
import Cookies from "js-cookie"
import { socketManager } from "../../common/clients.ts"

export interface Result {
  username: string,
  text: string,
  translation?: string,
}

function validateLang(type: "source" | "destination"): string | null {
  const lang = Cookies.get(`${type}Lang`)
  if (lang && Object.keys(languages).includes(lang)) {
    return lang
  } else {
    Cookies.remove(`${type}Lang`)
    return null
  }
}

function getMeetingCode() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get("code")
  return code || shortUuid()
}

export interface TranscribeState {
  results: Array<Result>,
  interimResult?: Result,
  transcribing: boolean,
  previousEndSeconds?: number,
  sourceLang: string,
  destinationLang: string,
  meetingCode: string,
}

const initialState: TranscribeState = {
  results: [],
  interimResult: undefined,
  transcribing: false,
  previousEndSeconds: undefined,
  sourceLang: validateLang("source") || "Japanese",
  destinationLang: validateLang("destination") || "English",
  meetingCode: getMeetingCode(),
}

export const transcribeSlice = createSlice({
  name: "transcribe",
  initialState,
  reducers: {
    updateSlice: (state, action: PayloadAction<Partial<TranscribeState>>) => {
      return { ...state, ...action.payload }
    },
    resetSlice: () => {
      return initialState
    },
    addInterimResult: (state, action: PayloadAction<{ text: string, username: string }>) => {
      const { username, text } = action.payload
      state.interimResult = {
        username,
        text,
        translation: "",
      }
    },
    updateInterimResult: (state, action: PayloadAction<string>) => {
      if (!state.interimResult) return
      state.interimResult.text = action.payload
      scrollToBottom()
    },
    startTranscribing: (state) => {
      state.transcribing = true
      const language = languages[state.sourceLang]["web_speech_api_code"]
      SpeechRecognition.startListening({ continuous: true, language })
    },
    stopTranscribing: (state) => {
      state.transcribing = false
      SpeechRecognition.stopListening()
    },
    resetTranscribing: (state) => {
      const keys = ["results", "interimResult", "transcribing", "lastResultTimestamp", "previousEndSeconds"]
      keys.forEach((key) => {
        state[key] = initialState[key]
      })
    },
    addFinalResult: (state, action: PayloadAction<{ text: string, username: string, translation?: string }>) => {
      const { username, text, translation } = action.payload
      state.results.push({ username, text, translation })
      scrollToBottom()
    }
  },
})

export const addFinalResult = createAsyncThunk(
  "transcribe/addFinalResult",
  async ({ text }: { text: string }, { dispatch }) => {
    const { username } = store.getState().main
    const { interimResult, sourceLang, destinationLang, meetingCode } = store.getState().transcribe
    const srcLangCode = languages[sourceLang]["google_translate_code"]
    const destLangCode = languages[destinationLang]["google_translate_code"]
    const translation = await translate(text, srcLangCode, destLangCode)
    if (!interimResult) return
    dispatch(transcribeActions.updateSlice({ interimResult: undefined }))
    // dispatch(transcribeActions.updateSlice({ results: [...results, { username, text, translation }] }))
    socketManager.sendTranscription({ room: meetingCode, text, username, translation })
    scrollToBottom()
  }
)

export const transcribeReducer = transcribeSlice.reducer
export const transcribeActions = transcribeSlice.actions
export const transcribeSelector = (state: RootState) => state.transcribe
