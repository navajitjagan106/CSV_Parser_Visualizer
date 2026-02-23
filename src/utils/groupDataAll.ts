type GroupedData = Record<string, string | number>;

interface GroupDataResult {
  sum: GroupedData[];
  avg: GroupedData[];
  min: GroupedData[];
  max: GroupedData[];
  count: GroupedData[];
  countDistinct: GroupedData[];
  median: GroupedData[];
  stddev: GroupedData[];
  percent: GroupedData[];
}

export function groupDataAll(
  rows: Record<string, any>[],
  xKey: string,
  yKey: string
): GroupDataResult {
  if (!rows.length) {
    return { sum: [] as any, avg: [] as any, min: [] as any, max: [] as any, count: [] as any, countDistinct: [] as any, median: [] as any, stddev: [] as any, percent: [] as any };
  }
  type Bucket = {
    sum: number;
    count: number;
    min: number;
    max: number;
    values: number[];
    distinct: Set<any>;
  };

  const map = new Map<string, Bucket>();

  rows.forEach((row) => {
    const x = String(row[xKey] ?? "Unknown");
    const y = Number(String(row[yKey] ?? 0).replace(/,/g, ""));

    if (isNaN(y)) {
      console.warn(`Invalid number for ${yKey}: ${row[yKey]} (row: ${JSON.stringify(row)})`);
      return;
    }

    if (!map.has(x)) {
      map.set(x, {
        sum: 0,
        count: 0,
        min: y,
        max: y,
        values: [],
        distinct: new Set(),
      });
    }

    const b = map.get(x)!;

    b.sum += y;
    b.count++;
    b.min = Math.min(b.min, y);
    b.max = Math.max(b.max, y);
    b.values.push(y);
    b.distinct.add(row[yKey]);
  });

  const result: GroupDataResult = {
    sum: [],
    avg: [],
    min: [],
    max: [],
    count: [],
    countDistinct: [],
    median: [],
    stddev: [],
    percent: [],

  };
  let totalSum = 0;

  map.forEach(b => {
    totalSum += b.sum;
  });

  map.forEach((b, key) => {

    // Median
    const sorted = [...b.values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

    // Percent of total
    const percent = totalSum ? (b.sum / totalSum) * 100 : 0;

    result.sum.push({ [xKey]: key, [yKey]: b.sum });

    result.avg.push({
      [xKey]: key,
      [yKey]: b.count ? b.sum / b.count : 0,
    });

    result.min.push({ [xKey]: key, [yKey]: b.count ? b.min : 0 });

    result.max.push({ [xKey]: key, [yKey]: b.count ? b.max : 0 });

    result.count.push({ [xKey]: key, [yKey]: b.count });

    result.countDistinct.push({
      [xKey]: key,
      [yKey]: b.distinct.size,
    });

    result.median.push({
      [xKey]: key,
      [yKey]: median,
    });

    result.percent.push({
      [xKey]: key,
      [yKey]: Number(percent.toFixed(2)),
    });

    const mean = b.sum / b.count;
    const stddev = Math.sqrt(b.values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / b.count);
    result.stddev.push({ [xKey]: key, [yKey]: +stddev.toFixed(2) });
  });


  return result;
}