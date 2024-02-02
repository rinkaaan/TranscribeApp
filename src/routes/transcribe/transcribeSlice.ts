import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../../common/reducers"
import "regenerator-runtime/runtime"
import SpeechRecognition from "react-speech-recognition"

export interface Result {
  seconds: number,
  text: string
}

export interface TranscribeState {
  results: Array<Result>,
  interimResult?: Result,
  transcribing: boolean,
  lastResultTimestamp?: Date,
  previousEndSeconds?: number,
}

const initialState: TranscribeState = {
  results: [],
  interimResult: undefined,
  transcribing: false,
  lastResultTimestamp: undefined,
  previousEndSeconds: undefined,
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
      }
    },
    updateInterimResult: (state, action: PayloadAction<string>) => {
      if (!state.interimResult) return
      state.interimResult.text = action.payload
    },
    addFinalResult: (state, action: PayloadAction<string>) => {
      // Create a new result with same timestamp as last interim result
      if (!state.interimResult) return
      const timestamp = state.interimResult!.seconds
      state.results.push({
        seconds: timestamp,
        text: action.payload,
      })
      state.interimResult = undefined
    },
    startTranscribing: (state) => {
      state.transcribing = true
      SpeechRecognition.startListening({ continuous: true, language: "en-US" })
      state.lastResultTimestamp = new Date()
    },
    stopTranscribing: (state) => {
      state.transcribing = false
      state.previousEndSeconds = state.results[state.results.length - 1]?.seconds
      SpeechRecognition.stopListening()
    },
  },
})

export const transcribeReducer = transcribeSlice.reducer
export const transcribeActions = transcribeSlice.actions
export const transcribeSelector = (state: RootState) => state.transcribe
