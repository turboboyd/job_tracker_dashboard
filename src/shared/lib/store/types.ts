// Intentionally light typing to keep shared layer independent from app layer.
// App layer can provide stronger typing by re-exporting its own store types.
//
// We avoid `any` here to keep ESLint rules happy while still being flexible.
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";

export type RootState = Record<string, unknown>;

// Keep shared independent from the app's concrete store.
// This is still compatible with react-redux's `useDispatch` typing.
export type AppDispatch = Dispatch<UnknownAction>;
