import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";

const layoutSlice = createSlice({
  name: "layout",
  initialState: {
    columns: [] as string[],
    version: 0,
    chart: {
      enabled: false,
      type: "",
      x: "",
      y: "",
    },
  },
  reducers: {
    selectColumn(state, action: PayloadAction<string>) {
      const col = action.payload
      if (state.columns.includes(col)) state.columns = state.columns.filter(c => c !== col)
      else state.columns.push(col)
    },
    clearColumn(state) {
      state.columns = []
      state.version++;
    },
    setChart(state, action) {
      state.chart = {
        ...state.chart,
        ...action.payload,
        enabled: true,
      };
    },

    clearChart(state) {
      state.chart.enabled = false;
    },
  }
});

export const { selectColumn, clearColumn,setChart,clearChart } = layoutSlice.actions;
export default layoutSlice.reducer;