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
}
export type PivotRawMap = {
    cells: Map<string, { nums: number[]; texts: string[] }>;
    allRowVals: string[];
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
    const cells = new Map<string, { nums: number[]; texts: string[] }>();
    const allRowVals: string[] = [];
    const seenRows = new Set<string>();
    const allColNames = new Set<string>();
    const multiVal = valueKey.length > 1;

    rows.forEach(r => {
        const rowVal = rowKey.map(rk => String(r[rk] ?? '')).join(' | ');
        const colVal = colKey.map(ck => String(r[ck] ?? '').trim()).join(' | ');

        if (!seenRows.has(rowVal)) {
            seenRows.add(rowVal);
            allRowVals.push(rowVal);
        }

        valueKey.forEach(vk => {
            const colName = multiVal ? `${colVal}_${vk}` : colVal;
            allColNames.add(colName);

            const key = `${rowVal}||${colVal}||${vk}`;
            let cell = cells.get(key);
            if (!cell) {
                cell = { nums: [], texts: [] };
                cells.set(key, cell);
            }

            const raw = r[vk];
            const str = String(raw ?? '').trim();
            const num = Number(str.replace(/,/g, ''));

            if (!isNaN(num) && str !== '') cell.nums.push(num);
            else if (str !== '') cell.texts.push(str);
        });
    });
    console.log(cells)

    return { cells, allRowVals, allColNames, rowKey, valueKey };
}

export function applyAgg(raw: PivotRawMap, agg: Agg): PivotRow[] {
    const { cells, allRowVals, allColNames, rowKey, valueKey } = raw;
    const multiVal = valueKey.length > 1;
    const isPct = agg === 'percentage';

    const result: PivotRow[] = allRowVals.map(rowVal => {
        const obj: PivotRow = {};

        rowVal.split(' | ').forEach((v, i) => { obj[rowKey[i]] = v; });

        allColNames.forEach(c => { obj[c] = ''; });

        valueKey.forEach(vk => {
            allColNames.forEach(colName => {
                const colVal = multiVal ? colName.replace(`_${vk}`, '') : colName;
                const key = `${rowVal}||${colVal}||${vk}`;
                const cell = cells.get(key);
                if (!cell) return;

                if (agg === 'countDistinct') {
                    obj[colName] = new Set([...cell.nums, ...cell.texts]).size;
                } else {
                    obj[colName] = cell.nums.length ? aggregate(cell.nums, agg)
                        : cell.texts.length ? Array.from(new Set(cell.texts)).join(', ')
                            : '';
                }
            });
        });

        return obj;
    });

    if (!isPct) return result;

    const dataCols = Object.keys(result[0] ?? {}).filter(k => !rowKey.includes(k));
    const totals: Record<string, number> = {};
    dataCols.forEach(col => {
        totals[col] = result.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
    });

    return result.map(row => {
        const newRow = { ...row };
        dataCols.forEach(col => {
            const val = Number(row[col]) || 0;
            newRow[col] = totals[col] ? +((val / totals[col]) * 100).toFixed(2) : 0;
        });
        return newRow;
    });
}
