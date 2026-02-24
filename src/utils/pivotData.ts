type PivotRow = Record<string, any>;
type Agg = "sum" | "avg" | "min" | "max" | "count" | "countDistinct" | "median" | "stddev";

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
        case "sum": return values.reduce((a, b) => a + b, 0);

        default: return values.reduce((a, b) => a + b, 0);
    }
}
export function pivotData(
    rows: PivotRow[],
    rowKey: string[],
    colKey: string[],
    valueKey: string[],
    agg: Agg,
    percentMode?: 'row' | 'col' | 'grand'

) {
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

            if (!map[rowVal][colVal][vk]) {
                map[rowVal][colVal][vk] = { nums: [], texts: [] };
            }

            const raw = r[vk];
            const str = String(raw ?? '').trim();
            const num = Number(str.replace(/,/g, ''));

            if (!isNaN(num) && str !== '') {
                map[rowVal][colVal][vk].nums.push(num);
            } else if (str !== '') {
                map[rowVal][colVal][vk].texts.push(str);
            }

            if (!rawMap[rowVal][colVal][vk]) {
                rawMap[rowVal][colVal][vk] = [];
            }

            rawMap[rowVal][colVal][vk].push(raw);

        });

    });


    // Collect all possible colNames first 
    const allColNames = new Set<string>();
    Object.values(map).forEach(cols => {
        Object.keys(cols).forEach(col => {
            valueKey.forEach(vk => {
                const colName = valueKey.length > 1 ? `${col}_${vk}` : col;
                allColNames.add(colName);
            });
        });
    });

    // Single loop - initialize all cols then fill in values
    const rawResult: PivotRow[] = [];
    Object.entries(map).forEach(([row, cols]) => {
        const obj: PivotRow = {};
        const rowParts = row.split(' | ');
        rowKey.forEach((rk, i) => { obj[rk] = rowParts[i] ?? ''; });

        // Initialize all columns to empty
        allColNames.forEach(colName => { obj[colName] = ''; });

        // Fill in actual values
        Object.entries(cols).forEach(([col, values]) => {
            valueKey.forEach(vk => {
                const colName = valueKey.length > 1 ? `${col}_${vk}` : col;
                if (agg === 'countDistinct') {
                    const rawVals = rawMap[row]?.[col]?.[vk] || [];
                    obj[colName] = new Set(
                        rawVals.filter(v => v !== null && v !== undefined && v !== '')
                    ).size;
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

    if (!percentMode) return rawResult;

    const getRowId = (row: PivotRow) =>
        rowKey.map(k => row[k]).join(' | ');

    const allCols = rawResult.length
        ? Object.keys(rawResult[0]).filter(k => !rowKey.includes(k))
        : [];

    const grandTotals: Record<string, number> = {};

    allCols.forEach(col => {
        grandTotals[col] = rawResult.reduce(
            (sum, row) => sum + (Number(row[col]) || 0),
            0
        );
    });

    const rowTotals: Record<string, number> = {};

    rawResult.forEach(row => {
        const rowId = getRowId(row);

        rowTotals[rowId] = allCols.reduce(
            (sum, col) => sum + (Number(row[col]) || 0),
            0
        );
    });

    const colTotals: Record<string, number> = {};

    allCols.forEach(col => {
        colTotals[col] = rawResult.reduce(
            (sum, row) => sum + (Number(row[col]) || 0),
            0
        );
    });

    return rawResult.map(row => {
        const newRow: PivotRow = { ...row };

        const rowId = getRowId(row);

        allCols.forEach(col => {
            const val = Number(row[col]) || 0;

            if (percentMode === 'grand') {
                newRow[col] = grandTotals[col]
                    ? +((val / grandTotals[col]) * 100).toFixed(2)
                    : 0;

            } else if (percentMode === 'row') {
                const rt = rowTotals[rowId];

                newRow[col] = rt
                    ? +((val / rt) * 100).toFixed(2)
                    : 0;

            } else if (percentMode === 'col') {
                newRow[col] = colTotals[col]
                    ? +((val / colTotals[col]) * 100).toFixed(2)
                    : 0;
            }
        });

        return newRow;
    });
}
