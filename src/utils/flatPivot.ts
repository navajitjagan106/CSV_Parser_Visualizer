
export type FlatRow = Record<string, any> & {
    _path: string;
    _depth: number;
    _isSubtotal: boolean;
    _hasChildren: boolean;
    _isMerged?: boolean;
    _label: string;
};

export function buildFlatPivot(rows: Record<string, any>[],rowKeys: string[],dataCols: string[],collapsed: Set<string>): FlatRow[] {
    if (!rowKeys.length || !rows.length) return [];

    const emittedPaths = new Set<string>();
    const aggCache = new Map<string, Record<string, number>>();

    rows.forEach(row => {
        const pathParts: string[] = [];
        rowKeys.forEach(key => {
            pathParts.push(String(row[key] ?? ""));
            const path = pathParts.join("|");
            let agg = aggCache.get(path);
            if (!agg) { agg = {}; aggCache.set(path, agg); }
            dataCols.forEach(col => {
                const num = Number(row[col]);
                if (!isNaN(num)) agg![col] = (agg![col] ?? 0) + num;
            });
        });
    });

    const result: FlatRow[] = [];

    rows.forEach(row => {
        const pathParts: string[] = [];

        for (let depth = 0; depth < rowKeys.length; depth++) {
            const key = rowKeys[depth];
            pathParts.push(String(row[key] ?? ""));
            const path = pathParts.join("|");
            const isLeaf = depth === rowKeys.length - 1;

            // If any ancestor is collapsed, skip this entire row completely
            // Check all ancestor paths, not just the immediate parent
            const ancestorCollapsed = pathParts
                .slice(0, -1)
                .some((_, i) => collapsed.has(pathParts.slice(0, i + 1).join("|")));

            if (ancestorCollapsed) break;  

            if (emittedPaths.has(path)) continue;  
            emittedPaths.add(path);

            const isCollapsed = !isLeaf && collapsed.has(path);
            const hasChildren = !isLeaf;

            const flat: FlatRow = {
                _path: path,
                _depth: depth,
                _isSubtotal: false,
                _hasChildren: hasChildren,
                _label: String(row[key] ?? ""),
                ...(isCollapsed ? { _isMerged: true } : {}),
            };

            rowKeys.forEach((rk, i) => {
                flat[rk] = i === depth ? pathParts[i] ?? "" : "";
            });

            // Fill data columns
            if (isCollapsed) {
                const agg = aggCache.get(path) ?? {};
                dataCols.forEach(col => {
                    flat[col] = agg[col] !== undefined ? agg[col] : "";
                });
            } else if (isLeaf) {
                dataCols.forEach(col => { flat[col] = row[col]; });
            }

            result.push(flat);

            if (isCollapsed) break;  // ← collapsed node emitted, skip children depths for this row
        }
    });

    return result;
}