export type ColNode = {
    path: string;
    label: string;
    depth: number;
    children: ColNode[];
    colKey: string | null;
};

export function buildColTree(dataCols: string[]): ColNode[] {
    const root: ColNode[] = [];
    const nodeMap = new Map<string, ColNode>();

    dataCols.forEach(col => {
        const parts = col.includes(" | ") ? col.split(" | ") : [col];
        let parentList = root;
        let pathSoFar = "";

        parts.forEach((part, depth) => {
            pathSoFar = depth === 0 ? part : `${pathSoFar}|${part}`;
            const isLeaf = depth === parts.length - 1;

            if (!nodeMap.has(pathSoFar)) {
                const node: ColNode = {
                    path: pathSoFar,
                    label: part,
                    depth,
                    children: [],
                    colKey: isLeaf ? col : null,
                };
                nodeMap.set(pathSoFar, node);
                parentList.push(node);
            }

            parentList = nodeMap.get(pathSoFar)!.children;
        });
    });

    return root;
}

export function collectColLeaves(node: ColNode): ColNode[] {
    if (!node.children.length) return [node];
    return node.children.flatMap(collectColLeaves);
}

export function getColKeys(node: ColNode): string[] {
    return collectColLeaves(node)
        .map(n => n.colKey)
        .filter((k): k is string => k !== null);
}

export function findColNode(root: ColNode[], path: string): ColNode | null {
    for (const node of root) {
        if (node.path === path) return node;
        const found = findColNode(node.children, path);
        if (found) return found;
    }
    return null;
}