export function groupData(
  rows: any[],
  xKey: string,
  yKey: string,
  agg: "sum" | "avg" | "min" | "max"
) {
  type Bucket = {
    sum: number;
    count: number;
    min: number;
    max: number;
  };

  const map = new Map<string, Bucket>();

  rows.forEach((row) => {
    // X value
    const x =
      row[xKey] !== undefined && row[xKey] !== null
        ? String(row[xKey]).trim()
        : "Unknown";

    // Y value
    let rawY = row[yKey];

    const y = Number(String(rawY ?? 0).replace(/,/g, ""));

    if (isNaN(y)) return;

    // Init bucket
    if (!map.has(x)) {
      map.set(x, {
        sum: 0,
        count: 0,
        min: y,
        max: y,
      });
    }

    const bucket = map.get(x)!;

    // Update
    bucket.sum += y;
    bucket.count += 1;
    bucket.min = Math.min(bucket.min, y);
    bucket.max = Math.max(bucket.max, y);
  });

  // Build output
  return Array.from(map.entries()).map(([key, b]) => {
    let value = 0;

    switch (agg) {
      case "avg":
        value = b.count ? b.sum / b.count : 0;
        break;

      case "min":
        value = b.min;
        break;

      case "max":
        value = b.max;
        break;

      case "sum":
      default:
        value = b.sum;
    }

    return {
      [xKey]: key,
      [yKey]: Number(value.toFixed(2)),
    };
  });
}
