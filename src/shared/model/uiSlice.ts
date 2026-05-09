import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

interface UiState {
  globalError: string | null;
}

const initialState: UiState = {
  globalError: null
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setGlobalError(state, action: PayloadAction<string | null>) {
      state.globalError = action.payload;
    }
  }
});

export const { setGlobalError } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
