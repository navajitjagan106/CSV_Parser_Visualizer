import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type Aggregation = "sum" | "avg" | "min" | "max" |"count";

interface ChartState {
  enabled: boolean;
  type: "bar" | "line" | "pie" | "pivot" | "area" | "scatter" | "";
  x: string;
  y: string;
  agg: Aggregation
}
interface PivotState {
  enabled: boolean,
  row: string,
  column: string,
  value: string,
  agg: Aggregation
}

interface LayoutState {
  columns: string[];
  version: number;
  chart: ChartState;
  pivot: PivotState
}

const initialState: LayoutState = {
  columns: [],
  version: 0,
  chart: {
    enabled: false,
    type: "",
    x: "",
    y: "",
    agg: "sum"
  },
  pivot: {
    enabled: false,
    row: "",
    column: "",
    value: "",
    agg: "sum",
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
    setPivot(state, action: PayloadAction<Partial<PivotState>>) {
      state.pivot = {
        ...state.pivot,
        ...action.payload,
      }
    },

    togglePivot(state) {
      state.pivot.enabled = !state.pivot.enabled;

    },
    clearPivot(state) {
      state.pivot = {
        enabled: false,
        row: "",
        column: "",
        value: "",
        agg: "sum",
      };

      state.chart.type = "";
      state.chart.enabled = false;
    },




    clearChart(state) {
      state.chart = {
        enabled: false,
        type: "",
        x: "",
        y: "",
        agg: "sum"
      };
    },
  },
});

export const {
  selectColumn,
  clearColumn,
  setChart,
  clearChart,
  setPivot,
  togglePivot,
    clearPivot, 
} = layoutSlice.actions;

export default layoutSlice.reducer;
