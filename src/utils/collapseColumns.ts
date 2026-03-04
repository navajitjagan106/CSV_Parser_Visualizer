export function getVisibleColumns(finalColumns: string[],rowKeys: string[],collapsedCols: Set<string>): {visibleCols: string[];collapsedGroupMap: Record<string, string[]>;
} {
    const rowKeyCols = finalColumns.filter(c => rowKeys.includes(c));
    const dataCols = finalColumns.filter(c =>
        !rowKeys.includes(c) &&
        c !== 'Total'
    );

    const groupMap = new Map<string, string[]>();
    dataCols.forEach(col => {
        const topLevel = col.includes(" | ") ? col.split(" | ")[0] : col;
        if (!groupMap.has(topLevel)) groupMap.set(topLevel, []);
        groupMap.get(topLevel)!.push(col);
    });

    const collapsedGroupMap: Record<string, string[]> = {};
    const visibleDataCols: string[] = [];

    groupMap.forEach((children, groupLabel) => {
        if (collapsedCols.has(groupLabel) && children.length > 1) {
            const summaryKey = `__collapsed__${groupLabel}`;
            visibleDataCols.push(summaryKey);
            collapsedGroupMap[summaryKey] = children;
        } else {
            visibleDataCols.push(...children);
        }
    });

    return {
        visibleCols: [...rowKeyCols, ...visibleDataCols],
        collapsedGroupMap,
    };
}


export function applyColCollapse(
    rows: Record<string, any>[],
    collapsedGroupMap: Record<string, string[]>
): Record<string, any>[] {
    if (!Object.keys(collapsedGroupMap).length) return rows;

    return rows.map(row => {
        const newRow = { ...row };
        Object.entries(collapsedGroupMap).forEach(([summaryKey, children]) => {
            // Sum all children values into the summary column
            const total = children.reduce((sum, col) => {
                const val = Number(row[col]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            newRow[summaryKey] = total || "";
        });
        return newRow;
    });
}