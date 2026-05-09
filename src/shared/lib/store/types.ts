// Intentionally light typing to keep shared layer independent from app layer.
// App layer can provide stronger typing by re-exporting its own store types.

import type { Dispatch, ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";

export type RootState = Record<string, unknown>;

// Keep shared independent from the app's concrete store while still allowing
// async thunk dispatching in lower layers that must not import app/store hooks.
export type AppDispatch =
  & Dispatch<UnknownAction>
  & ThunkDispatch<RootState, unknown, UnknownAction>;
