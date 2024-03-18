import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../../common/reducers"
import "regenerator-runtime/runtime"
import SpeechRecognition from "react-speech-recognition"
import { scrollToBottom, shortUuid, translate } from "../../common/typedUtils.ts"
import store from "../../common/store.ts"
import languages from "../../common/languages.json"
import Cookies from "js-cookie"

export interface Result {
  seconds: number,
  text: string,
  translation: string,
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

export interface TranscribeState {
  results: Array<Result>,
  interimResult?: Result,
  transcribing: boolean,
  lastResultTimestamp?: Date,
  previousEndSeconds?: number,
  sourceLang: string,
  destinationLang: string,
  meetingCode: string,
}

const initialState: TranscribeState = {
  results: [],
  interimResult: undefined,
  transcribing: false,
  lastResultTimestamp: undefined,
  previousEndSeconds: undefined,
  sourceLang: validateLang("source") || "Japanese",
  destinationLang: validateLang("destination") || "English",
  meetingCode: shortUuid(),
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
    addInterimResult: (state, action: PayloadAction<string>) => {
      // If first result, set firstResultTimestamp
      const timestamp = new Date()
      // Calculate timestamp - lastResultTimestamp in seconds
      let diff = timestamp.getTime() - state.lastResultTimestamp!.getTime()
      diff = Math.round(diff / 1000)
      if (state.previousEndSeconds) {
        diff += state.previousEndSeconds
      }
      state.interimResult = {
        seconds: diff,
        text: action.payload,
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
      state.lastResultTimestamp = new Date()
    },
    stopTranscribing: (state) => {
      state.transcribing = false
      state.previousEndSeconds = state.results[state.results.length - 1]?.seconds
      SpeechRecognition.stopListening()
    },
  },
})

export const addFinalResult = createAsyncThunk(
  "transcribe/addFinalResult",
  async (text: string, { dispatch }) => {
    const { interimResult, results, sourceLang, destinationLang } = store.getState().transcribe
    const srcLangCode = languages[sourceLang]["google_translate_code"]
    const destLangCode = languages[destinationLang]["google_translate_code"]
    const translation = await translate(text, srcLangCode, destLangCode)
    if (!interimResult) return
    const timestamp = interimResult.seconds
    dispatch(transcribeActions.updateSlice({ interimResult: undefined }))
    dispatch(transcribeActions.updateSlice({ results: [...results, { seconds: timestamp, text, translation }] }))
    scrollToBottom()
  }
)

export const transcribeReducer = transcribeSlice.reducer
export const transcribeActions = transcribeSlice.actions
export const transcribeSelector = (state: RootState) => state.transcribe
