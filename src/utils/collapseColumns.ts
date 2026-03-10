import { buildColTree, getColKeys,ColNode } from './buildColTree';

export function getVisibleColumns(
    finalColumns: string[],
    rowKeys: string[],
    collapsedCols: Set<string>
): { visibleCols: string[]; collapsedGroupMap: Record<string, string[]> } {

    const rowKeyCols = finalColumns.filter(c => rowKeys.includes(c));
    const dataCols = finalColumns.filter(c =>
        !rowKeys.includes(c) && c !== 'Total' && !c.startsWith('__collapsed__')
    );

    const colTree = buildColTree(dataCols);
    const collapsedGroupMap: Record<string, string[]> = {};
    const visibleDataCols: string[] = [];

    function visitNode(node: ColNode) {
    const isCollapsed = collapsedCols.has(node.path);
    const hasChildren = node.children.length > 0;

    if (!hasChildren) {
        if (node.colKey) visibleDataCols.push(node.colKey);
        return;
    }

    if (isCollapsed) {
        const summaryKey = `__collapsed__${node.path}`;
        const childKeys = getColKeys(node);
        visibleDataCols.push(summaryKey);
        collapsedGroupMap[summaryKey] = childKeys;
    } else {
        node.children.forEach(child => visitNode(child));
    }
}

    colTree.forEach(node => visitNode(node));

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
    console.log('collapsedGroupMap', collapsedGroupMap);
    console.log('row keys sample', Object.keys(rows[0] || {}));
    return rows.map(row => {
        const newRow = { ...row };
        for (const [summaryKey, children] of Object.entries(collapsedGroupMap)) {
            const total = children.reduce((sum, col) => {
                const val = Number(row[col]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            newRow[summaryKey] = total || "";  // ← "" when 0, should this be 0?
        }
        return newRow;
    });
}