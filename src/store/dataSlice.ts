import { createSlice, PayloadAction } from "@reduxjs/toolkit";
type ColumnType = 'numeric' | 'text' | 'date'

function detectColumnTypes(rows: Record<string, any>[], columns: string[]): Record<string, ColumnType> {
    const types: Record<string, ColumnType> = {}

    columns.forEach(col => {
        const samples = rows.map(r => r[col]).filter(v => v != null && v !== '').slice(0, 20)

        const allNumeric = samples.every(v => !isNaN(Number(String(v).replace(/,/g, ''))));
        const allDate= samples.every(v=>!isNaN(Date.parse(String(v))))

        if(allNumeric) types[col]='numeric'
        else if(allDate) types[col]='date'
        else types[col]='text'
    })
    return types
}

const dataSlice = createSlice({
    name: "data",
    initialState: {
        rows: [] as Record<string, any>[],
        columns: [] as string[],
        columnTypes: {} as Record<string, ColumnType>
    },
    reducers: {
        setData(state, action: PayloadAction<Record<string, any>[]>) {
            state.rows = action.payload;
            state.columns = Object.keys(action.payload[0] || {});
            state.columnTypes = detectColumnTypes(action.payload, state.columns);
        },
        clearData(state) {
            state.rows = [];
            state.columns = [];
            state.columnTypes = {}
        }
    }
});

export const { setData, clearData } = dataSlice.actions;
export type {ColumnType}
export default dataSlice.reducer;