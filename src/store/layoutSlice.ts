import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type Aggregation = "sum" | "avg" | "min" | "max" | "count" | "countDistinct" | "median" | "stddev";
export type ChartAggregation = "sum" | "avg" | "min" | "max" | "count" | "countDistinct" | "median" | "stddev" | "percent";

interface ChartState {
  type: "bar" | "line" | "pie" | "area" | "scatter" | "";
  x: string;
  y: string;
  agg: ChartAggregation
}
interface PivotState {
  enabled: boolean,
  row: string[],
  column: string[],
  value: string[],
  agg: Aggregation
  percentMode:'row' | 'col' | 'grand' | ''
}

interface TopNState {
  enabled: boolean;
  column: string;
  count: number;
  order: "top" | "bottom";
}

interface LayoutState {
  columns: string[];
  chart: ChartState;
  pivot: PivotState
  filtersRange: Record<
    string,
    { min: number; max: number }
  >;
  rangeCol: string;
  topN: TopNState;
  multiSelectFilters: Record<string, string[]>;
  nullFilters: Record<string, 'show' | 'hide'>;
}

const initialState: LayoutState = {
  columns: [],
  chart: {
    type: "",
    x: "",
    y: "",
    agg: "sum"
  },
  pivot: {
    enabled: false,
    row: [],
    column:[],
    value: [],
    agg: "sum",
    percentMode:''
  },
  topN: {
    enabled: false,
    column: "",
    count: 10,
    order: "top",
  },

  filtersRange: {},
  rangeCol: "",
  multiSelectFilters: {},
  nullFilters: {},
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    selectColumn(state, action: PayloadAction<string>) {
      const col = action.payload;

      if (state.columns.includes(col)) {
        state.columns = state.columns.filter(c => c !== col);
        if (state.chart.x === col) state.chart.x = "";
        if (state.chart.y === col) state.chart.y = "";
      } else {
        state.columns.push(col);
      }
    },

    clearColumn(state) {
      state.columns = [];
    },


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
      state.pivot = initialState.pivot;
    },

    reorderColumns: (state, action) => {
      const { from, to } = action.payload;

      const updated = [...state.columns];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);

      state.columns = updated;
    },

    selectAllColumns(state, action) {
      state.columns = action.payload;
    },


    resetColumnsFromAll: (state, action: PayloadAction<string[]>) => {
      const allcol = action.payload;
      state.columns = allcol.filter(c =>
        state.columns.includes(c)
      );
    },

    clearChart(state) {
      state.chart = initialState.chart;
    },



    setTopN(state, action) {
      state.topN = {
        ...state.topN,
        ...action.payload,
      };
      state.topN.enabled = Boolean(state.topN.column);

    },

    clearTopN(state) {
      state.topN.enabled = false;
    },
    setRangeColumn(state, action: PayloadAction<string>) {
      const col = action.payload;

      state.rangeCol = col;

      if (col && !state.filtersRange[col]) {
        state.filtersRange[col] = {
          min: 0,
          max: 100000,
        };
      }
    },


    setRangeFilter(state, action) {
      const { column, min, max } = action.payload;

      state.filtersRange[column] = { min, max };
    },

    clearRangeFilter(state, action) {
      delete state.filtersRange[action.payload];
    },
    setMultiSelectFilter(state, action: PayloadAction<{ column: string; values: string[] }>) {
      state.multiSelectFilters[action.payload.column] = action.payload.values
    },
    clearMultiSelectFilter(state, action: PayloadAction<string>) {
      delete state.multiSelectFilters[action.payload]
    },
    clearAllMultiSelectFilter(state) {
      state.multiSelectFilters = {}
    },
    setNullFilter: (state, action: PayloadAction<{ column: string; mode: 'show' | 'hide' }>) => {
      state.nullFilters[action.payload.column] = action.payload.mode;
    },
    clearNullFilter: (state, action: PayloadAction<string>) => {
      delete state.nullFilters[action.payload];
    },


  },
});

export const {
  selectColumn, clearColumn, setChart, clearChart, setPivot, togglePivot, clearPivot, reorderColumns, resetColumnsFromAll, selectAllColumns, setTopN, setRangeColumn,
  clearTopN, setRangeFilter, clearRangeFilter, setMultiSelectFilter, clearAllMultiSelectFilter, clearMultiSelectFilter, setNullFilter, clearNullFilter,
} = layoutSlice.actions;

export default layoutSlice.reducer;
