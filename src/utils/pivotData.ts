type PivotRow = Record<string, any>;
type Agg = "sum" | "avg" | "min" | "max" | "count";

function aggregate(values: number[], agg: Agg): number {
    if (!values.length) return 0;
    switch (agg) {
        case "avg": return values.reduce((a, b) => a + b, 0) / values.length;
        case "min": return Math.min(...values);
        case "max": return Math.max(...values);
        case "count": return values.length;
        default: return values.reduce((a, b) => a + b, 0);
    }
}
export function pivotData(
    rows: PivotRow[],
    rowKey: string,
    colKey: string,
    valueKey: string[],
    agg: "sum" | "avg" | "min" | "max" | "count"
) {
    const map: Record<string, Record<string, Record<string, number[]>>> = {};

    //const map: Record<string, Record<string, Record<string, number[]>>> = {};

    rows.forEach((r) => {
        const rowVal = String(r[rowKey] ?? "Unknown");
        const colVal = String(r[colKey] ?? "Unknown");

        if (!map[rowVal]) map[rowVal] = {};
        if (!map[rowVal][colVal]) map[rowVal][colVal] = {};

        valueKey.forEach(vk => {
            const num = Number(String(r[vk]).replace(/,/g, "")) || 0;
            if (!map[rowVal][colVal][vk]) map[rowVal][colVal][vk] = [];
            map[rowVal][colVal][vk].push(num);
        });
    });


    const result: PivotRow[] = [];

    Object.entries(map).forEach(([row, cols]) => {
        const obj: PivotRow = { [rowKey]: row };

        Object.entries(cols).forEach(([col, values]) => {
           valueKey.forEach(vk=>{
            const colName=valueKey.length>1?`${col}_${vk}`:col;
            obj[colName]=aggregate(values[vk]||[],agg)
           })
        });

        result.push(obj);
    });

    return result;
}
