import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

const dataSlice=createSlice({
    name:"data",
    initialState:{
        rows:[] as Record<string,any>[],
        columns:[] as string[]
    },
    reducers:{
        setData(state,action:PayloadAction<Record<string,any>[]>){
            state.rows=action.payload;
            state.columns=Object.keys(action.payload[0]||{});

        }
    }
});
 
export const {setData} = dataSlice.actions;
export default dataSlice.reducer;