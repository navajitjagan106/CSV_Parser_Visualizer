import { buildColTree, getColKeys } from './buildColTree';

export function getVisibleColumns(finalColumns: string[],rowKeys: string[],collapsedCols: Set<string>): {
    visibleCols: string[];
    collapsedGroupMap: Record<string, string[]>;
} {
    const rowKeyCols = finalColumns.filter(c => rowKeys.includes(c));
    const dataCols = finalColumns.filter(c =>
        !rowKeys.includes(c) &&
        c !== 'Total'
    );

    const colTree = buildColTree(dataCols);

    const collapsedGroupMap: Record<string, string[]> = {};
    const visibleDataCols: string[] = [];

    for (const node of colTree) {
        if (collapsedCols.has(node.path) && node.children.length > 0) {
            const summaryKey = `__collapsed__${node.label}`;
            const childColKeys = getColKeys(node);
            visibleDataCols.push(summaryKey);
            collapsedGroupMap[summaryKey] = childColKeys;
        } else {
            visibleDataCols.push(...getColKeys(node));
        }
    }

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
        for (const [summaryKey, children] of Object.entries(collapsedGroupMap)) {
            const total = children.reduce((sum, col) => {
                const val = Number(row[col]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            newRow[summaryKey] = total || "";
        }
        return newRow;
    });
}