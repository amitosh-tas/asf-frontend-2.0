import {
  logout,
  setAuthLoading,
  setCredentials,
} from "@/store/slices/authSlice";
import { getMe } from "./authService";
import type { AppDispatch } from "@/store/store";

export const restoreSession = async (dispatch: AppDispatch) => {
  try {
    const user = await getMe();
    dispatch(setCredentials(user));
  } catch {
    dispatch(logout());
  } finally {
    dispatch(setAuthLoading(false));
  }
};