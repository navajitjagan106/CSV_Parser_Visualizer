export type FlatRow = Record<string, any> & {
    _path: string;
    _depth: number;
    _isSubtotal: boolean;
    _hasChildren: boolean;
    _isMerged?: boolean;
    _label: string;
};

export function buildFlatPivot(rows: Record<string, any>[], rowKeys: string[], dataCols: string[], collapsed: Set<string>, showSubtotals = false): FlatRow[] {
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


            const ancestorCollapsed = pathParts.slice(0, -1).some((_, i) => collapsed.has(pathParts.slice(0, i + 1).join("|")));

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
            for (let i = depth + 1; i < rowKeys.length; i++) {
                flat[rowKeys[i]] = "";
            }

            // Fill data columns
            if (isLeaf) {
                let rowTotal = 0;
                dataCols.forEach(col => {
                    const v = row[col];
                    flat[col] = v;
                    const n = Number(v);
                    if (!isNaN(n)) rowTotal += n;
                });
                flat["Total"] = rowTotal || "";
            } else {
                const agg = aggCache.get(path) ?? {};
                let rowTotal = 0;
                dataCols.forEach(col => {
                    const v = agg[col] !== undefined ? agg[col] : "";
                    flat[col] = v;
                    const n = Number(v);
                    if (!isNaN(n)) rowTotal += n;
                });
                flat["Total"] = rowTotal || "";
            }


            result.push(flat);

            if (isCollapsed) break;
        }
    });
    const grandTotal: FlatRow = {
        _path: "__grandtotal__",
        _depth: 0,
        _isSubtotal: true,
        _hasChildren: false,
        _isGrandTotal: true,
        _label: "Grand Total",
    };

    rowKeys.forEach((rk, i) => {
        grandTotal[rk] = i === 0 ? "Grand Total" : "";
    });

    // sum all depth-0 paths from aggCache
    const topLevelPaths = Array.from(emittedPaths).filter(p => !p.includes("|"));
    dataCols.forEach(col => {
        const total = topLevelPaths.reduce((sum, path) => {
            return sum + (aggCache.get(path)?.[col] ?? 0);
        }, 0);
        grandTotal[col] = total || "";
    });

    grandTotal["Total"] = dataCols.reduce((sum, col) => {
        const v = Number(grandTotal[col]);
        return sum + (isNaN(v) ? 0 : v);
    }, 0) || "";

    return [grandTotal, ...result];

}