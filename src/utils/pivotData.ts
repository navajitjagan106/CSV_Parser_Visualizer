export function pivotData(
  rows: any[],
  rowKey: string,
  colKey: string,
  valueKey: string,
  agg: "sum" | "avg" | "min" | "max"
) {
  const map: Record<string, Record<string, number[]>> = {};

  rows.forEach((r) => {
    const row = String(r[rowKey]);
    const col = String(r[colKey]);
    const val = Number(r[valueKey]) || 0;

    if (!map[row]) map[row] = {};
    if (!map[row][col]) map[row][col] = [];

    map[row][col].push(val);
  });

  const result: any[] = [];

  Object.entries(map).forEach(([row, cols]) => {
    const obj: any = { [rowKey]: row };

    Object.entries(cols).forEach(([col, values]) => {
      let v = 0;

      switch (agg) {
        case "avg":
          v = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case "min":
          v = Math.min(...values);
          break;
        case "max":
          v = Math.max(...values);
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
