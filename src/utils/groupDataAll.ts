export function groupDataAll(
  rows: any[],
  xKey: string,
  yKey: string
) {
  type Bucket = {
    sum: number;
    count: number;
    min: number;
    max: number;
  };

  const map = new Map<string, Bucket>();

  rows.forEach((row) => {
    const x = String(row[xKey] ?? "Unknown");

    const y = Number(String(row[yKey] ?? 0).replace(/,/g, ""));

    if (isNaN(y)) return;

    if (!map.has(x)) {
      map.set(x, {
        sum: 0,
        count: 0,
        min: y,
        max: y,
      });
    }

    const b = map.get(x)!;

    b.sum += y;
    b.count++;
    b.min = Math.min(b.min, y);
    b.max = Math.max(b.max, y);
  });

  const result = {
    sum: [] as any[],
    avg: [] as any[],
    min: [] as any[],
    max: [] as any[],
  };

  map.forEach((b, key) => {
    result.sum.push({ [xKey]: key, [yKey]: b.sum });

    result.avg.push({
      [xKey]: key,
      [yKey]: b.count ? b.sum / b.count : 0,
    });

    result.min.push({ [xKey]: key, [yKey]: b.min });

    result.max.push({ [xKey]: key, [yKey]: b.max });
  });

  return result;
}
