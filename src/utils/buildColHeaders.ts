import { buildColTree, ColNode, collectColLeaves } from './buildColTree';

export type ColGroupHeader = {
    label: string;
    children: string[];
    span: number;
    depth: number;
    groupKey: string;
    path: string;
    isCollapsed: boolean;
};

export type ColHeaderLevel = ColGroupHeader[];

export function buildColHeaders(
    allColumns: string[],
    rowKeys: string[],
    collapsedCols?: Set<string>
): ColHeaderLevel[] {
    const collapsed = collapsedCols ?? new Set<string>();

    const dataCols = allColumns.filter(c =>
        !rowKeys.includes(c) &&
        !c.startsWith('__collapsed__') &&
        c !== 'Total'
    );

    if (!dataCols.length) return [];

    const hasGroups = dataCols.some(col => col.includes(" | "));
    if (!hasGroups) return [];

    const colTree = buildColTree(dataCols);
    const numLevels = getTreeDepth(colTree);
    if (numLevels === 0) return [];

    const levels: ColHeaderLevel[] = [];

    for (let level = 0; level < numLevels; level++) {
        const levelHeaders: ColGroupHeader[] = [];

        collectAtDepth(colTree, level, collapsed, (node, topLevelPath) => {
            const isCollapsedGroup = collapsed.has(topLevelPath) && level === 0;
            const leaves = collectColLeaves(node);
            const colKeys = leaves
                .map(l => l.colKey)
                .filter((k): k is string => k !== null);

            levelHeaders.push({
                label: node.label,
                children: colKeys,
                span: isCollapsedGroup ? 1 : colKeys.length,
                depth: level,
                groupKey: topLevelPath,
                path: node.path,
                isCollapsed: isCollapsedGroup,
            });
        });

        if (levelHeaders.length > 0) levels.push(levelHeaders);
    }

    return levels;
}

function getTreeDepth(nodes: ColNode[]): number {
    if (!nodes.length) return 0;
    return 1 + Math.max(...nodes.map(n =>
        n.children.length ? getTreeDepth(n.children) : 0
    ));
}

function collectAtDepth(
    nodes: ColNode[],
    targetDepth: number,
    collapsed: Set<string>,
    callback: (node: ColNode, topLevelPath: string) => void,
    topLevelPath: string = "",
    currentDepth: number = 0
): void {
    for (const node of nodes) {
        const thisTopLevel = currentDepth === 0 ? node.path : topLevelPath;

        if (currentDepth > 0 && collapsed.has(topLevelPath)) continue;

        if (currentDepth === targetDepth) {
            callback(node, thisTopLevel);
        } else {
            collectAtDepth(
                node.children,
                targetDepth,
                collapsed,
                callback,
                thisTopLevel,
                currentDepth + 1
            );
        }
    }
}