import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { clampPage } from "src/shared/lib";


export type LoopsUiState = {
  listPage: number;
  detailsPageByLoopId: Record<string, number | undefined>;
  lastLoopsUrl: string | null;
};

const initialState: LoopsUiState = {
  listPage: 1,
  detailsPageByLoopId: {},
  lastLoopsUrl: null,
};


const loopsUiSlice = createSlice({
  name: "loopsUi",
  initialState,
  reducers: {
    setLoopsListPage(state, action: PayloadAction<number>) {
      state.listPage = clampPage(action.payload);
    },
    setLoopDetailsPage(
      state,
      action: PayloadAction<{ loopId: string; page: number }>
    ) {
      const { loopId, page } = action.payload;
      state.detailsPageByLoopId[loopId] = clampPage(page);
    },


    setLastLoopsUrl(state, action: PayloadAction<string>) {
      state.lastLoopsUrl = action.payload;
    },
  },
});

export const {
  setLoopsListPage,
  setLoopDetailsPage,
  setLastLoopsUrl,
} = loopsUiSlice.actions;

export const loopsUiReducer = loopsUiSlice.reducer;
