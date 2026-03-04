import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ChartPanel from "./Panels/ChartPanel";
import TableToolbar from './TableComponents/TableToolbar';
import TableGrid from './TableComponents/TableGrid';
import TableStatus from './TableComponents/TableStatus';
import { useTableData } from '../utils/useTableData';
import { flattenTree } from '../utils/flattenTree';
import { buildColHeaders } from '../utils/buildColHeaders';

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

    // ── Hierarchy collapse state ──────────────────────────────────────────────
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const toggleCollapsed = useCallback((path: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    }, []);

    const { data, columns, finalColumns, finalRows, allChartData, chart, pivot, pivotTree, pivotDataCols } = useTableData();

    const chartData = allChartData ? allChartData[chart.agg] : [];
    const gridWrapperRef = useRef<HTMLDivElement>(null);

    const isPivotReady = pivot.enabled && pivot.row.length > 0 && pivot.column.length > 0 && pivot.value.length > 0;
    const hasHierarchy = isPivotReady && pivot.row.length > 1 && pivotTree.length > 0;

    // ── Column header groups ──────────────────────────────────────────────────
    const colHeaders = useMemo(() => {
        if (!isPivotReady) return [];
        return buildColHeaders(finalColumns, pivot.row);
    }, [finalColumns, pivot.row, isPivotReady]);

    // ── Flatten tree into visible rows ────────────────────────────────────────
    const hierarchyRows = useMemo(() => {
        if (!hasHierarchy) return null;
        return flattenTree(pivotTree, collapsed, pivot.row, pivotDataCols, pivot.agg);
    }, [pivotTree, collapsed, pivot.row, pivotDataCols, pivot.agg, hasHierarchy]);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions(prev => ({ ...prev, height: entry.contentRect.height }));
            }
        });
        if (gridWrapperRef.current) observer.observe(gridWrapperRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!columns.length) return;
        setColumnWidths(prev => {
            const init = { ...prev };
            finalColumns.forEach(col => {
                if (!(col in init)) init[col] = Math.max(col.length * 12, 180);
            });
            return init;
        });
    }, [finalColumns, columns]);

    useEffect(() => { setPage(1); }, [filterText, sortConfig, pivot, pageSize]);

    // Reset collapse when pivot config changes
    useEffect(() => { setCollapsed(new Set()); }, [pivot.row, pivot.column, pivot.value]);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
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
        const headers = finalColumns.join(',');
        const rows = displayRows.map(row =>
            finalColumns.map(col => {
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

    // ── Total column + grand total row ────────────────────────────────────────
    const displayColumns = useMemo(() => {
        if (!isPivotReady) return finalColumns;
        if (finalColumns.includes("Total")) return finalColumns;
        return [...finalColumns, "Total"];
    }, [finalColumns, isPivotReady]);

    const rowsWithTotals = useMemo(() => {
        if (!isPivotReady) return finalRows;
        const baseRows = hierarchyRows ?? finalRows;
        if (!baseRows.length) return baseRows;

        const totalRow: Record<string, any> = {};
        finalColumns.forEach(col => { totalRow[col] = 0; });
        totalRow[finalColumns[0]] = "Grand Total";
        totalRow._isSubtotal = true;
        totalRow._depth = 0;

        const newRows = baseRows.map(row => {
            let rowTotal = 0;
            const newRow = { ...row };
            finalColumns.forEach(col => {
                if (pivot.row.includes(col)) return;
                const val = Number(row[col]);
                if (!isNaN(val) && val !== 0) {
                    rowTotal += val;
                    totalRow[col] = (totalRow[col] || 0) + val;
                }
            });
            newRow["Total"] = rowTotal || "";
            return newRow;
        });

        let grand = 0;
        finalColumns.forEach(col => {
            if (pivot.row.includes(col)) return;
            if (typeof totalRow[col] === "number") grand += totalRow[col];
        });
        totalRow["Total"] = grand;

        return [...newRows, totalRow];
    }, [finalRows, hierarchyRows, finalColumns, isPivotReady, pivot.row]);

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
        return sortedRows.filter(row =>
            finalColumns.some(col => String(row[col]).toLowerCase().includes(lowerFilter))
        );
    }, [sortedRows, filterText, finalColumns]);

    const totalPages = Math.ceil(filteredRows.length / pageSize);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    if (!data.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">Upload a CSV file to begin</p>;

    if (!columns.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">No data to display. Select fields from the panel.</p>;

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
                        columns={finalColumns}
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
                        columnCount={finalColumns.length}
                    />

                    {isPivotReady && (
                        <div className="flex flex-wrap items-center gap-6 px-3 py-2 bg-blue-50 border-t border-b border-blue-200 text-sm">
                            <div><span className="font-semibold text-blue-700">Rows:</span> {pivot.row.join(" → ")}</div>
                            <div><span className="font-semibold text-green-700">Columns:</span> {pivot.column.join(" → ")}</div>
                            <div><span className="font-semibold text-purple-700">Values:</span> {`${pivot.agg.toUpperCase()}(${pivot.value.join(", ")})`}</div>
                            {pivot.percentMode && (
                                <div><span className="font-semibold text-orange-700">% Mode:</span> {pivot.percentMode}</div>
                            )}
                            {hasHierarchy && (
                                <div className="ml-auto flex gap-2">
                                    <button
                                        onClick={() => setCollapsed(new Set())}
                                        className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100"
                                    >
                                        ↕ Expand All
                                    </button>
                                    <button
                                        onClick={() => {
                                            const paths = new Set<string>();
                                            function collectParents(nodes: typeof pivotTree) {
                                                nodes.forEach(n => {
                                                    if (n.children.length) {
                                                        paths.add(n.path);
                                                        collectParents(n.children);
                                                    }
                                                });
                                            }
                                            collectParents(pivotTree);
                                            setCollapsed(paths);
                                        }}
                                        className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100"
                                    >
                                        ↔ Collapse All
                                    </button>
                                </div>
                            )}
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
                            pivotRowKeys={isPivotReady ? pivot.row : []}
                            hasHierarchy={hasHierarchy}
                            onToggleCollapse={toggleCollapsed}
                            collapsed={collapsed}
                            colHeaders={colHeaders}
                            page={page}
                            pageSize={pageSize}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}