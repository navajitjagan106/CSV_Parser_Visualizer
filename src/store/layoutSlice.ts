import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type Aggregation = "sum" | "avg" | "min" | "max";

interface ChartState {
  enabled: boolean;
  type: string;
  x: string;
  y: string;
  agg:Aggregation
}

interface LayoutState {
  columns: string[];
  version: number;
  chart: ChartState;
}

const initialState: LayoutState = {
  columns: [],
  version: 0,
  chart: {
    enabled: false,
    type: "",
    x: "",
    y: "",
    agg:"sum"
  },
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    selectColumn(state, action: PayloadAction<string>) {
      const col = action.payload;

      if (state.columns.includes(col)) {
        state.columns = state.columns.filter(c => c !== col);
      } else {
        state.columns.push(col);
      }
    },

    clearColumn(state) {
      state.columns = [];
      state.version++;
    },

    // ✅ Partial update, DOES NOT force enable
    setChart(state, action: PayloadAction<Partial<ChartState>>) {
      state.chart = {
        ...state.chart,
        ...action.payload,
      };
    },

  
    clearChart(state) {
      state.chart = {
        enabled: false,
        type: "",
        x: "",
        y: "",
        agg:"sum"
      };
    },
  },
});

export const {
  selectColumn,
  clearColumn,
  setChart,
  clearChart,
} = layoutSlice.actions;

export default layoutSlice.reducer;
