export function groupData(
  rows: any[],
  xKey: string,
  yKey: string
) {
  const map = new Map<string, number>();

  rows.forEach((row) => {
    // Get X value safely
    const rawX = row[xKey];
    const x = rawX !== undefined && rawX !== null
      ? String(rawX).trim()
      : "Unknown";

    // Get Y value safely
    let rawY = row[yKey];

    if (rawY === undefined || rawY === null || rawY === "") {
      rawY = 0;
    }

    // Remove commas & spaces ( "1,200" → "1200" )
    const y = Number(String(rawY).replace(/,/g, "").trim());

    // If still NaN → make it 0
    const safeY = isNaN(y) ? 0 : y;

    // Aggregate
    if (!map.has(x)) {
      map.set(x, 0);
    }

    map.set(x, map.get(x)! + safeY);
  });

  // Convert to chart format
  return Array.from(map.entries()).map(([key, value]) => ({
    [xKey]: key,
    [yKey]: value,
  }));
}
