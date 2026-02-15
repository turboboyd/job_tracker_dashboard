import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "./types";

// NOTE: Kept in shared so pages/features/entities can use it without importing app.
// App layer can still export stronger, store-bound hooks if it wants.
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
