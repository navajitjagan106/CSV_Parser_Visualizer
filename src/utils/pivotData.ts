import { Aggregation } from "../store/layoutSlice";
type PivotRow = Record<string, any>;
type Agg = Aggregation;

function aggregate(values: number[], agg: Agg): number {
    if (!values.length) return 0;
    switch (agg) {
        case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
        case "min": return Math.min(...values);
        case "max": return Math.max(...values);
        case "count": return values.length;
        //case "countDistinct": return new Set(values).size
        case "median": {
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
        }
        case "stddev": {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
            return Math.sqrt(variance)

        }
        case "sum":
        case "percentage":
        default: return values.reduce((a, b) => a + b, 0);
    }
} export type PivotRawMap = {
    map: Record<string, Record<string, Record<string, { nums: number[]; texts: string[] }>>>;
    rawMap: Record<string, Record<string, Record<string, any[]>>>;
    allColNames: Set<string>;
    rowKey: string[];
    valueKey: string[];
};

export function buildPivotRaw(
    rows: PivotRow[],
    rowKey: string[],
    colKey: string[],
    valueKey: string[],
): PivotRawMap {
    const map: Record<string, Record<string, Record<string, { nums: number[]; texts: string[] }>>> = {};
    const rawMap: Record<string, Record<string, Record<string, any[]>>> = {};

    rows.forEach((r) => {
        const rowVal = rowKey.map(rk => String(r[rk] ?? '')).join(' | ');
        const colVal = colKey.map(ck => String(r[ck] ?? '').trim()).join(' | ');

        if (!map[rowVal]) map[rowVal] = {};
        if (!map[rowVal][colVal]) map[rowVal][colVal] = {};
        if (!rawMap[rowVal]) rawMap[rowVal] = {};
        if (!rawMap[rowVal][colVal]) rawMap[rowVal][colVal] = {};

        valueKey.forEach(vk => {
            if (!map[rowVal][colVal][vk]) map[rowVal][colVal][vk] = { nums: [], texts: [] };
            if (!rawMap[rowVal][colVal][vk]) rawMap[rowVal][colVal][vk] = [];

            const raw = r[vk];
            const str = String(raw ?? '').trim();
            const num = Number(str.replace(/,/g, ''));

            if (!isNaN(num) && str !== '') map[rowVal][colVal][vk].nums.push(num);
            else if (str !== '') map[rowVal][colVal][vk].texts.push(str);

            rawMap[rowVal][colVal][vk].push(raw);
        });
    });

    const allColNames = new Set<string>();
    Object.values(map).forEach(cols => {
        Object.keys(cols).forEach(col => {
            valueKey.forEach(vk => {
                allColNames.add(valueKey.length > 1 ? `${col}_${vk}` : col);
            });
        });
    });

    return { map, rawMap, allColNames, rowKey, valueKey };
}

export function applyAgg(raw: PivotRawMap, agg: Agg): PivotRow[] {
    const { map, rawMap, allColNames, rowKey, valueKey } = raw;
    const isPct = agg === 'percentage';

    const rawResult: PivotRow[] = [];
    Object.entries(map).forEach(([row, cols]) => {
        const obj: PivotRow = {};
        const rowParts = row.split(' | ');
        rowKey.forEach((rk, i) => { obj[rk] = rowParts[i] ?? ''; });
        allColNames.forEach(colName => { obj[colName] = ''; });

        Object.entries(cols).forEach(([col, values]) => {
            valueKey.forEach(vk => {
                const colName = valueKey.length > 1 ? `${col}_${vk}` : col;
                if (agg === 'countDistinct') {
                    const rawVals = rawMap[row]?.[col]?.[vk] || [];
                    obj[colName] = new Set(rawVals.filter(v => v !== null && v !== undefined && v !== '')).size;
                } else {
                    const cell = values[vk];
                    if (!cell) { obj[colName] = ''; }
                    else if (cell.nums.length) { obj[colName] = aggregate(cell.nums, agg); }
                    else if (cell.texts.length) { obj[colName] = Array.from(new Set(cell.texts)).join(', '); }
                    else { obj[colName] = ''; }
                }
            });
        });
        rawResult.push(obj);
    });

    if (!isPct) return rawResult;

    const allCols = rawResult.length ? Object.keys(rawResult[0]).filter(k => !rowKey.includes(k)) : [];
    const grandTotals: Record<string, number> = {};
    allCols.forEach(col => {
        grandTotals[col] = rawResult.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
    });

    return rawResult.map(row => {
        const newRow = { ...row };
        allCols.forEach(col => {
            const val = Number(row[col]) || 0;
            newRow[col] = grandTotals[col] ? +((val / grandTotals[col]) * 100).toFixed(2) : 0;
        });
        return newRow;
    });
}