type PivotRow = Record<string, any>;

export function pivotData(
    rows: PivotRow[],
    rowKey: string,
    colKey: string,
    valueKey: string,
    agg: "sum" | "avg" | "min" | "max" | "count"
) {
    const map: Record<string, Record<string, number[]>> = {};

    rows.forEach((r: PivotRow) => {
        const row = String(r[rowKey] ?? "Unknown");
        const col = String(r[colKey] ?? "Unknown");
        const val = Number(String(r[valueKey]).replace(/,/g, "")) || 0;

        if (!map[row]) map[row] = {};
        if (!map[row][col]) map[row][col] = [];

        map[row][col].push(val);
    });

    const result:PivotRow[] = [];

    Object.entries(map).forEach(([row, cols]) => {
        const obj: PivotRow = { [rowKey]: row };

        Object.entries(cols).forEach(([col, values]) => {
            let v = 0;

            switch (agg) {
                case "avg":
                    v = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    break;
                case "min":
                    v = Math.min(...values);
                    break;
                case "max":
                    v = Math.max(...values);
                    break;
                case "count":
                    v = values.length;
                    break;
                default:
                    v = values.reduce((a, b) => a + b, 0);
            }

            obj[col] = v;
        });

        result.push(obj);
    });

    return result;
}
