import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

const layoutSlice=createSlice({
    name:"layout",
    initialState:{
        columns:[] as string[],      
    },
    reducers:{        
          selectColumn(state,action: PayloadAction<string>){
            const col=action.payload
            if(state.columns.includes(col)) state.columns=state.columns.filter(c=>c!=col)
            else state.columns.push(col)
          }
    }
});
 
export const {selectColumn} = layoutSlice.actions;
export default layoutSlice.reducer;