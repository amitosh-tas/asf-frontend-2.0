import { createSlice } from "@reduxjs/toolkit";


const initialState = {
  name: null,
}

const companySlice = createSlice({
  name: "company",
  initialState,

  reducers: {

  }
})


export const { } = companySlice.actions;
export default companySlice.reducer;