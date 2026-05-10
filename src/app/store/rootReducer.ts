import { combineReducers } from "@reduxjs/toolkit";

import { authReducer } from "src/entities/auth/model";
import { loopsUiReducer } from "src/entities/loop/model";
import { baseApi } from "src/shared/api/rtk";
import { uiReducer } from "src/shared/model";

export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  loopsUi: loopsUiReducer,

  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
