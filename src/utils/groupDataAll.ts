type GroupedData = Record<string, string | number>;

interface GroupDataResult {
  sum: GroupedData[];
  avg: GroupedData[];
  min: GroupedData[];
  max: GroupedData[];
  count: GroupedData[];  // Add this!
}

export function groupDataAll(
  rows:  Record<string, any>[],
  xKey: string,
  yKey: string
): GroupDataResult {
  if (!rows.length) {
    return { sum: [] as any, avg: [] as any, min: [] as any , max: [] as any,count:[] as any  };
  } 
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

    if (isNaN(y)){
        console.warn(`Invalid number for ${yKey}: ${row[yKey]} (row: ${JSON.stringify(row)})`);
        return;
    } 

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

  const result :GroupDataResult= {
    sum: [] ,
    avg: [] ,
    min: [] ,
    max: [] ,
    count:[]
  };

  map.forEach((b, key) => {
    result.sum.push({ [xKey]: key, [yKey]: b.sum });

    result.avg.push({
      [xKey]: key,
      [yKey]: b.count ? b.sum / b.count : 0,
    });

    result.min.push({ [xKey]: key, [yKey]: b.count>0?b.min:0 });

    result.max.push({ [xKey]: key, [yKey]: b.count>0?b.max:0 });
      result.count.push({ [xKey]: key, [yKey]: b.count });
  });

  return result;
}
