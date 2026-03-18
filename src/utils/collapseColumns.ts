import { getColKeys, ColNode } from './buildColTree';

export function getVisibleColumns(
    colTree: ColNode[],       
    rowKeys: string[],
    collapsedCols: Set<string>
): { visibleCols: string[]; collapsedGroupMap: Record<string, string[]> } {

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
            collapsedGroupMap[summaryKey] = getColKeys(node);
            visibleDataCols.push(summaryKey);
        } else {
            node.children.forEach(child => visitNode(child));
        }
    }

    colTree.forEach(node => visitNode(node));
    return { visibleCols: [...rowKeys, ...visibleDataCols], collapsedGroupMap };
}

export function applyColCollapse(rows: Record<string, any>[], collapsedGroupMap: Record<string, string[]>): Record<string, any>[] {
    if (!Object.keys(collapsedGroupMap).length) return rows;
    const entries = Object.entries(collapsedGroupMap); 
    if (!entries.length) return rows;

    return rows.map(row => {
        const newRow = { ...row };
        for (const [summaryKey, children] of entries) {
            const total = children.reduce((sum, col) => {
                const val = Number(row[col]);
                return sum + (isNaN(val) ? 0 : val);
            }, 0);
            newRow[summaryKey] = total || "";
        }
        return newRow;
    });
}