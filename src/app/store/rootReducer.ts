import { combineReducers } from "@reduxjs/toolkit";

import { authReducer } from "src/entities/auth";
import { loopsUiReducer } from "src/pages/LoopsPage/model/loopsUiSlice";
import { baseApi } from "src/shared/api";
import { uiReducer } from "src/shared/model/uiSlice";

export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  loopsUi: loopsUiReducer,

  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
