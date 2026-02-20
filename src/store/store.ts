import { configureStore } from "@reduxjs/toolkit";
import dataStore from "./dataSlice";
import layoutStore from "./layoutSlice";


export const store =configureStore({
    reducer:{
        data: dataStore,
        layout:layoutStore        
    }
});
  

export type RootState = ReturnType<typeof store.getState>
