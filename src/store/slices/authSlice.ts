import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "platform_admin" | "company_admin" | "company_viewer";
export type AccountStatus = "invited" | "active" | "inactive" | "deactivated";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: AccountStatus;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },

    setAuthLoading: (state, action )=> {
      state.isLoading = action.payload
    }
  },
});

export const { setCredentials, logout, setAuthLoading } = authSlice.actions;

export default authSlice.reducer;