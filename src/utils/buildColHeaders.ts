export type ColGroupHeader = {
  label: string;
  children: string[];
  span: number;
  depth: number;
  groupKey: string;
};

export type ColHeaderLevel = ColGroupHeader[];

export function buildColHeaders(allColumns: string[],rowKeys: string[],collapsedCols?: Set<string>): ColHeaderLevel[] {
  const collapsed = collapsedCols ?? new Set<string>();

  const dataCols = allColumns.filter(c =>
    !rowKeys.includes(c) &&
    !c.startsWith('__collapsed__') &&
    c !== 'Total'
  );

  const hasGroups = dataCols.some(col => col.includes(" | "));
  if (!hasGroups) return [];

  const splitCols = dataCols.map(col => col.split(" | "));

  const numLevels = Math.max(...splitCols.map(parts => parts.length));

  const levels: ColHeaderLevel[] = [];

  for (let level = 0; level < numLevels; level++) {
    const groupMap = new Map<string, string[]>();

    dataCols.forEach((col, i) => {
      const parts = splitCols[i];
      const topLevel = parts[0];
      if (level > 0 && collapsed.has(topLevel)) return;
      const groupKey = parts.slice(0, level + 1).join(" | ");
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)!.push(col);
    });

    if (groupMap.size === 0) continue;

    levels.push(
      Array.from(groupMap.entries()).map(([key, children]) => {
        const topLevel = key.split(" | ")[0];
        const isCollapsed = collapsed.has(topLevel) && level === 0;
        return {
          label: isCollapsed? `▶ ${key.split(" | ").pop()}`: key.split(" | ").pop() ??
          key,
          children,
          span: isCollapsed ? 1 : children.length,
          depth: level,
          groupKey: topLevel,
        };
      })
    );
  }

  return levels;
}