import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type Aggregation = "sum" | "avg" | "min" | "max" | "count";

interface ChartState {
  //enabled: boolean;
  type: "bar" | "line" | "pie" | "area" | "scatter" | "";
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

interface TopNState {
  enabled: boolean;
  column: string;
  count: number;
  order: "top" | "bottom";
}

interface LayoutState {
  columns: string[];
  version: number;
  chart: ChartState;
  pivot: PivotState
  filters: Record<string, string[]>;
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
  version: 0,
  chart: {
    //enabled: false,
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
  topN: {
    enabled: false,
    column: "",
    count: 10,
    order: "top",
  },
  filters: {},
  filtersRange: {},
  rangeCol: "",
  multiSelectFilters: {},
  nullFilters:{},
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    selectColumn(state, action: PayloadAction<string>) {
      const col = action.payload;

      if (state.columns.includes(col)) {
        state.columns = state.columns.filter(c => c !== col);
        state.chart.x = ""
      } else {
        state.columns.push(col);
      }
    },

    clearColumn(state) {
      state.columns = [];
      state.version++;
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
      state.pivot = {
        enabled: false,
        row: "",
        column: "",
        value: "",
        agg: "sum",
      };
    },

    reorderColumns: (state, action) => {
      const { from, to } = action.payload;

      const updated = [...state.columns];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);

      state.columns = updated;
      state.version++;
    },

    selectAllColumns(state, action) {
      state.columns = action.payload;
      state.version++;
    },


    resetColumnsFromAll: (state, action: PayloadAction<string[]>) => {
      const allcol = action.payload;
      state.columns = allcol.filter(c =>
        state.columns.includes(c)
      );
      state.version++;
    },

    clearChart(state) {
      state.chart = {
        // enabled: false,
        type: "",
        x: "",
        y: "",
        agg: "sum"
      };
    },

    setFilter(state, action) {
      const { column, values } = action.payload;
      state.filters[column] = values;
    },

    setTopN(state, action) {
      state.topN = {
        ...state.topN,
        ...action.payload,
        enabled: true,
      };
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
  clearTopN, setFilter, setRangeFilter, clearRangeFilter, setMultiSelectFilter, clearAllMultiSelectFilter, clearMultiSelectFilter,setNullFilter,clearNullFilter,
} = layoutSlice.actions;

export default layoutSlice.reducer;
