import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ChartPanel from "./Panels/ChartPanel";
import TableToolbar from './TableComponents/TableToolbar';
import TableGrid from './TableComponents/TableGrid';
import TableStatus from './TableComponents/TableStatus';
import { useTableData } from '../utils/useTableData';
import { flattenTree } from '../utils/flattenTree';
import { buildColHeaders } from '../utils/buildColHeaders';
import { getVisibleColumns, applyColCollapse } from '../utils/collapseColumns';
import { TreeNode } from '../utils/buildRowTree';
import { buildColTree } from '../utils/buildColTree';

function sortDataCols(cols: string[]): string[] {
    return [...cols].sort((a, b) => {
        const aRoot = a.split(' | ')[0];
        const bRoot = b.split(' | ')[0];
        const aNum = Number(aRoot);
        const bNum = Number(bRoot);
        if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
        return aRoot.localeCompare(bRoot);
    });
}

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [sortCol, setSortCol] = useState('');
    const [sortConfig, setSortConfig] = useState<{
        column: string | null;
        direction: 'asc' | 'desc' | null;
    }>({ column: null, direction: null });
    const [filterText, setFilterText] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    //collapsing rows and cols for pivot
    const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());
    const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

    const toggleCollapsed = useCallback((path: string) => {
        setCollapsedRows(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }, []);

    const toggleCollapsedCol = useCallback((groupKey: string) => {
        setCollapsedCols(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) next.delete(groupKey);
            else next.add(groupKey);
            return next;
        });
    }, []);

    const { data, columns, finalColumns, finalRows, allChartData, chart, pivot, pivotTree, pivotDataCols } = useTableData();

    const chartData = allChartData ? allChartData[chart.agg] : [];
    const gridWrapperRef = useRef<HTMLDivElement>(null);

    const isPivotReady = pivot.enabled && pivot.row.length > 0 && pivot.column.length > 0 && pivot.value.length > 0;
    const hasHierarchy = isPivotReady && pivot.row.length > 1 && pivotTree.length > 0;

    const canonicalDataCols = useMemo(() => {
        if (!isPivotReady) return [];
        const raw = pivotDataCols.filter(c => !pivot.row.includes(c) && c !== 'Total');
        return sortDataCols(raw);
    }, [pivotDataCols, pivot.row, isPivotReady]);

    useEffect(() => { setCollapsedCols(new Set()); }, [pivot.row, pivot.column, pivot.value]);

    const { visibleCols, collapsedGroupMap } = useMemo((): { visibleCols: string[]; collapsedGroupMap: Record<string, string[]> } => {
        if (!isPivotReady) {
            return { visibleCols: finalColumns as string[], collapsedGroupMap: {} };
        }
        if (!collapsedCols.size) {
            return { visibleCols: [...pivot.row as string[], ...canonicalDataCols], collapsedGroupMap: {} };
        }
        return getVisibleColumns([...pivot.row as string[], ...canonicalDataCols], pivot.row as string[], collapsedCols);
    }, [canonicalDataCols, pivot.row, isPivotReady, collapsedCols, finalColumns]);

    const collapsedColsArray = useMemo(() => Array.from(collapsedCols), [collapsedCols]);

    const colHeaders = useMemo(() => {
        if (!isPivotReady) return [];
        const collapsedSet = new Set(collapsedColsArray);
        return buildColHeaders(
            [...pivot.row, ...pivotDataCols],
            pivot.row,
            collapsedSet
        );
    }, [pivotDataCols, pivot.row, isPivotReady, collapsedColsArray]);

    const hierarchyRows = useMemo(() => {
        if (!hasHierarchy) return null;
        return flattenTree(pivotTree, collapsedRows, pivot.row, canonicalDataCols, pivot.agg);
    }, [pivotTree, collapsedRows, pivot.row, canonicalDataCols, pivot.agg, hasHierarchy]);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions(prev => ({
                    ...prev,
                    height: entry.contentRect.height
                }));
            }
        });
        if (gridWrapperRef.current) observer.observe(gridWrapperRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!columns.length) return;
        setColumnWidths(prev => {
            const init = { ...prev };
            visibleCols.forEach((col: string) => {
                if (!(col in init)) init[col] = Math.max(col.length * 5, 180);
            });
            return init;
        });
    }, [visibleCols, columns]);

    useEffect(() => { setPage(1); }, [filterText, sortConfig, pivot, pageSize]);
    useEffect(() => { setCollapsedRows(new Set()); }, [pivot.row, pivot.column, pivot.value]);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [columns]);

    const chartEnabled = Boolean(chart.type && chart.x && chart.y);

    const handleSort = (direction: 'asc' | 'desc') => {
        if (!sortCol) return;
        setSortConfig({ column: sortCol, direction });
    };

    const handleExportCSV = () => {
        const headers = visibleCols.join(',');
        const rows = displayRows.map((row: Record<string, any>) =>
            visibleCols.map(col => {
                const val = row[col];
                return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                    ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(',')
        ).join('\n');
        const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(displayRows, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `export_${new Date().toISOString().slice(0, 10)}.json`; a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleColumnResize = (col: string, delta: number) => {
        setColumnWidths(prev => ({ ...prev, [col]: Math.max(120, (prev[col] || 180) + delta) }));
    };

    const visibleRowKeys = useMemo(() => {
        if (!hasHierarchy) return pivot.row;
        const anyExpanded = pivotTree.some(node => !collapsedRows.has(node.path));
        return anyExpanded ? pivot.row : [pivot.row[0]];
    }, [hasHierarchy, pivotTree, collapsedRows, pivot.row]);

    //  Total column + grand total row 
    const displayColumns = useMemo((): string[] => {
        if (!isPivotReady) return finalColumns as string[];
        const nonRowKeyCols = visibleCols.filter(c => !pivot.row.includes(c));
        const cols = [...visibleRowKeys, ...nonRowKeyCols];
        if (cols.includes("Total")) return cols;
        return [...cols, "Total"];
    }, [visibleCols, finalColumns, visibleRowKeys, isPivotReady, pivot.row]);

    const rowsWithTotals = useMemo(() => {
        if (!isPivotReady) return finalRows;

        const baseRows = hierarchyRows ?? finalRows;
        if (!baseRows.length) return baseRows;

        const collapsedRows = applyColCollapse(baseRows, collapsedGroupMap);
        const totalRow: Record<string, any> = {};
        visibleCols.forEach(col => { totalRow[col] = 0; });
        totalRow[visibleCols[0]] = "Grand Total";
        totalRow._isSubtotal = true;
        totalRow._isGrandTotal = true;
        totalRow._depth = 0;

        const newRows = collapsedRows.map((row: Record<string, any>) => {
            let rowTotal = 0;
            const newRow = { ...row };

            visibleCols.forEach(col => {
                if (pivot.row.includes(col)) return;
                const val = Number(row[col]);
                if (!isNaN(val) && val !== 0) {
                    rowTotal += val;
                    totalRow[col] = (totalRow[col] || 0) + val;
                }
            });

            newRow["Total"] = rowTotal !== 0 ? rowTotal.toFixed(4) : "";
            return newRow;
        });

        let grand = 0;
        visibleCols.forEach(col => {
            if (pivot.row.includes(col)) return;
            if (typeof totalRow[col] === "number") grand += totalRow[col];
        });
        totalRow["Total"] = grand.toFixed(4);

        return [totalRow, ...newRows,];
    }, [finalRows, hierarchyRows, visibleCols, collapsedGroupMap, isPivotReady, pivot.row]);

    const displayRows = isPivotReady ? rowsWithTotals : finalRows;

    const sortedRows = useMemo(() => {
        if (!sortConfig.column || !sortConfig.direction) return displayRows;
        return [...displayRows].sort((a, b) => {
            const aVal = Number(a[sortConfig.column!]);
            const bVal = Number(b[sortConfig.column!]);
            if (isNaN(aVal) || isNaN(bVal)) return 0;
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [displayRows, sortConfig]);

    const filteredRows = useMemo(() => {
        if (!filterText.trim()) return sortedRows;
        const lowerFilter = filterText.toLowerCase();
        return sortedRows.filter((row: Record<string, any>) =>
            visibleCols.some(col => String(row[col]).toLowerCase().includes(lowerFilter))
        );
    }, [sortedRows, filterText, visibleCols]);

    const totalPages = Math.ceil(filteredRows.length / pageSize);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    const toolbarColumns = useMemo((): string[] => {
        if (!isPivotReady) return columns;
        return visibleCols.filter(c => !c.startsWith('__collapsed__'));
    }, [isPivotReady, columns, visibleCols]);

    if (!data.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">Upload a CSV file to begin</p>

    if (!columns.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">No data to display. Select fields from the panel.</p>


    return (
        <div ref={containerRef} className="flex flex-col gap-2 h-full min-h-0 border border-gray-400">
            <div className="flex-1 overflow-auto">
                {chartEnabled && chartData.length > 0 && (
                    <div className="h-[420px] border-b bg-white p-3">
                        <ChartPanel
                            data={chartData}
                            xKey={chart.x}
                            yKey={chart.y}
                            type={chart.type}
                            agg={chart.agg}
                        />
                    </div>
                )}

                <div className="flex flex-col flex-1 min-h-0 border-t">
                    <TableToolbar
                        columns={toolbarColumns}
                        sortCol={sortCol}
                        onSortColChange={setSortCol}
                        onSortAsc={() => handleSort('asc')}
                        onSortDesc={() => handleSort('desc')}
                        onExportCSV={handleExportCSV}
                        onExportJSON={handleExportJSON}
                        filterText={filterText}
                        onFilterChange={setFilterText}
                        hasActiveFilters={Boolean(sortConfig.column || filterText)}
                        onClearAll={() => { setSortConfig({ column: null, direction: null }); setFilterText(''); }}
                    />

                    <TableStatus
                        filteredCount={filteredRows.length}
                        totalCount={displayRows.length}
                        columnCount={toolbarColumns.length}
                    />

                    {isPivotReady && (
                        <div className="flex flex-wrap items-center gap-6 px-3 py-2 bg-blue-50 border-t border-b border-blue-200 text-sm">
                            <div><span className="font-semibold text-blue-700">Rows:</span> {pivot.row.join(" → ")}</div>
                            <div><span className="font-semibold text-green-700">Columns:</span> {pivot.column.join(" → ")}</div>
                            <div><span className="font-semibold text-purple-700">Values:</span> {`${pivot.agg.toUpperCase()}(${pivot.value.join(", ")})`}</div>
                            <div className="ml-auto flex gap-2">
                                {hasHierarchy && (<>
                                    <button onClick={() => setCollapsedRows(new Set())} className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100">↕ Expand Rows</button>
                                    <button
                                        onClick={() => {
                                            const paths = new Set<string>();
                                            function collectParents(nodes: typeof pivotTree) {
                                                nodes.forEach((n: TreeNode) => {
                                                    if (n.children.length) { paths.add(n.path); collectParents(n.children); }
                                                });
                                            }
                                            collectParents(pivotTree);
                                            setCollapsedRows(paths);
                                        }}
                                        className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100"
                                    >↔ Collapse Rows</button>
                                </>)}
                                {colHeaders.length > 0 && (<>
                                    <button onClick={() => setCollapsedCols(new Set())} className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100">↕ Expand Cols</button>
                                    <button
                                        onClick={() => {
                                            const colTree = buildColTree(canonicalDataCols);
                                            const rootPaths = new Set<string>(colTree.map(n => n.path));
                                            setCollapsedCols(rootPaths);
                                        }}
                                        className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100"
                                    >↔ Collapse Cols</button>
                                </>)}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-sm">
                        <div>Page {page} of {totalPages} ({filteredRows.length} rows)</div>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">◀ Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next ▶</button>
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={250}>250</option>
                                <option value={500}>500</option>
                                <option value={1000}>1000</option>
                            </select>
                        </div>
                    </div>

                    <div ref={gridWrapperRef} className="flex-1 min-h-0 overflow-hidden">
                        <TableGrid
                            finalColumns={displayColumns}
                            filteredRows={pagedRows}
                            dimensions={dimensions}
                            columnWidths={columnWidths}
                            onColumnResize={handleColumnResize}
                            pivotRowKeys={isPivotReady ? visibleRowKeys : []}
                            hasHierarchy={hasHierarchy}
                            onToggleCollapse={toggleCollapsed}
                            collapsed={collapsedRows}
                            colHeaders={colHeaders}
                            collapsedCols={collapsedCols}
                            onToggleColCollapse={toggleCollapsedCol}
                            collapsedGroupMap={collapsedGroupMap}
                            page={page}
                            pageSize={pageSize}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}