export type ColGroupHeader = {
  label: string;
  children: string[];
  span: number;
  depth: number;
};

export type ColHeaderLevel = ColGroupHeader[];

export function buildColHeaders(
  allColumns: string[],
  rowKeys: string[]
): ColHeaderLevel[] {
  const dataCols = allColumns.filter(c => !rowKeys.includes(c));
  const hasGroups = dataCols.some(col => col.includes(" | "));

  if (!hasGroups) return [];

  // Split each col into its parts  
  const splitCols = dataCols.map(col => col.split(" | "));
  const numLevels = Math.max(...splitCols.map(parts => parts.length));

  const levels: ColHeaderLevel[] = [];

  for (let level = 0; level < numLevels; level++) {
    const groupMap = new Map<string, string[]>();

    dataCols.forEach((col, i) => {
      const parts = splitCols[i];
      // Group key = all parts up to and including this level
      const groupKey = parts.slice(0, level + 1).join(" | ");
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)!.push(col);
    });

    levels.push(
      Array.from(groupMap.entries()).map(([key, children]) => ({
        label: key.split(" | ").pop() ?? key, // just the last segment as display label
        children,
        span: children.length,
        depth: level,
      }))
    );
  }

  return levels;
}