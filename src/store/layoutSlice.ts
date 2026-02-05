import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

const layoutSlice=createSlice({
    name:"layout",
    initialState:{
        columns:[] as string[],  
        version:0     
    },
    reducers:{        
          selectColumn(state,action: PayloadAction<string>){
            const col=action.payload
            if(state.columns.includes(col)) state.columns=state.columns.filter(c=>c!==col)
            else state.columns.push(col)
          },
          clearColumn(state){
            state.columns=[]
            state.version++;
          }
    }
});
 
export const {selectColumn,clearColumn} = layoutSlice.actions;
export default layoutSlice.reducer;