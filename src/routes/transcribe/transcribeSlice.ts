import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../../common/reducers"
import "regenerator-runtime/runtime"
import SpeechRecognition from "react-speech-recognition"
import { translate } from "../../common/typedUtils.ts"
import store from "../../common/store.ts"

export interface Result {
  seconds: number,
  text: string,
  translation: string,
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
        translation: "",
      }
    },
    updateInterimResult: (state, action: PayloadAction<string>) => {
      if (!state.interimResult) return
      state.interimResult.text = action.payload
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

export const addFinalResult = createAsyncThunk(
  "transcribe/addFinalResult",
  async (text: string, { dispatch }) => {
    const translation = await translate(text, "en", "ja")
    const { interimResult, results } = store.getState().transcribe
    if (!interimResult) return
    const timestamp = interimResult.seconds
    dispatch(transcribeActions.updateSlice({ interimResult: undefined }))
    dispatch(transcribeActions.updateSlice({ results: [...results, { seconds: timestamp, text, translation }] }))
  }
)

export const transcribeReducer = transcribeSlice.reducer
export const transcribeActions = transcribeSlice.actions
export const transcribeSelector = (state: RootState) => state.transcribe
