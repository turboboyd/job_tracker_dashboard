import type { TypedUseSelectorHook} from "react-redux";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "./rootReducer";
import type { AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
