import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ChartPanel from "./Panels/ChartPanel";
import TableToolbar from './TableComponents/TableToolbar';
import TableGrid from './TableComponents/TableGrid';
import TableStatus from './TableComponents/TableStatus';
import { useTableData } from '../utils/useTableData';
import { buildColHeaders } from '../utils/buildColHeaders';
import { getVisibleColumns, applyColCollapse } from '../utils/collapseColumns';
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

    const { data, columns, finalColumns, finalRows, allChartData, chart, pivot, flatPivotRows, pivotDataCols } = useTableData();

    const chartData = allChartData ? allChartData[chart.agg] : [];
    const gridWrapperRef = useRef<HTMLDivElement>(null);

    const isPivotReady = pivot.enabled && pivot.row.length > 0 && pivot.column.length > 0 && pivot.value.length > 0;
    const hasHierarchy = isPivotReady && pivot.row.length > 1 && !!flatPivotRows;

    const canonicalDataCols = useMemo(() => {
        if (!isPivotReady) return [];
        const raw = pivotDataCols.filter(c => !pivot.row.includes(c) && c !== 'Total');
        return sortDataCols(raw);
    }, [pivotDataCols, pivot.row, isPivotReady]);

    useEffect(() => { setCollapsedCols(new Set()); }, [pivot.row, pivot.column, pivot.value]);
    const colTree = useMemo(() => {
        if (!isPivotReady) return [];
        return buildColTree(canonicalDataCols);
    }, [canonicalDataCols, isPivotReady]);

    const { visibleCols, collapsedGroupMap } = useMemo((): {
        visibleCols: string[];
        collapsedGroupMap: Record<string, string[]>
    } => {
        if (!isPivotReady) return { visibleCols: finalColumns as string[], collapsedGroupMap: {} };
        if (!collapsedCols.size) return { visibleCols: [...pivot.row as string[], ...canonicalDataCols], collapsedGroupMap: {} };
        return getVisibleColumns(colTree, pivot.row as string[], collapsedCols);
    }, [colTree, pivot.row, collapsedCols, isPivotReady, finalColumns, canonicalDataCols]);

    const colHeaders = useMemo(() => {
        if (!isPivotReady) return [];
        return buildColHeaders(
            colTree,
            pivot.row as string[],
            collapsedCols
        );
    }, [colTree, pivot.row, isPivotReady, collapsedCols]);

    const hierarchyRows = useMemo(() => {
        if (!flatPivotRows) return null;
        return flatPivotRows(collapsedRows);
    }, [flatPivotRows, collapsedRows]);

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
    const PAGE_SIZES = [25, 50, 100, 250, 500, 1000];

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
        if (!hasHierarchy || !hierarchyRows) return pivot.row;
        const anyExpanded = hierarchyRows.some(
            row => row._hasChildren && !collapsedRows.has(row._path)
        );
        return anyExpanded ? pivot.row : [pivot.row[0]];
    }, [hasHierarchy, hierarchyRows, collapsedRows, pivot.row]);

    const displayColumns = useMemo((): string[] => {
        if (!isPivotReady) return finalColumns as string[];
        const nonRowKeyCols = visibleCols.filter(c => !pivot.row.includes(c));
        const cols = [...visibleRowKeys, ...nonRowKeyCols];
        if (cols.includes("Total")) return cols;
        return [...cols, "Total"];
    }, [visibleCols, finalColumns, pivot.row, visibleRowKeys, isPivotReady]);

    const rowsWithTotals = useMemo(() => {
        if (!isPivotReady) return finalRows;
        const baseRows = hierarchyRows ?? finalRows;
        if (!baseRows.length) return baseRows;
        const collapsedBase = applyColCollapse(baseRows, collapsedGroupMap);

        if (!hasHierarchy) {
            const totalRow: Record<string, any> = {
                _isSubtotal: true, _isGrandTotal: true, _depth: 0,
                [pivot.row[0]]: "Grand Total",
            }

            const rowsWithRowTotals = collapsedBase.map((row: Record<string, any>) => {
                let rowTotal = 0;
                const newRow = { ...row }

                Object.keys(row).forEach(col => {
                    if (pivot.row.includes(col)) return;
                    if (col.startsWith('_')) return;
                    if (col === 'Total') return;
                    const val = Number(row[col]);
                    if (!isNaN(val) && val !== 0) {
                        rowTotal += val;
                        totalRow[col] = (totalRow[col] || 0) + val;
                    }
                });
                newRow["Total"] = rowTotal || "";
                return newRow;
            });

            totalRow["Total"] = Object.keys(totalRow).reduce((sum, col) => {
                if (pivot.row.includes(col)) return sum;
                if (col.startsWith('_') || col === 'Total') return sum;
                return sum + (Number(totalRow[col]) || 0);
            }, 0);

            return [totalRow, ...rowsWithRowTotals];

        }

        return collapsedBase;

    }, [finalRows, hierarchyRows, collapsedGroupMap, isPivotReady, hasHierarchy, pivot.row]);

    const displayRows = isPivotReady ? rowsWithTotals : finalRows;

    const sortedRows = useMemo(() => {
        if (!sortConfig.column || !sortConfig.direction) return displayRows;
        const col = sortConfig.column;
        return [...displayRows].sort((a, b) => {
            const aVal = Number((a as Record<string, any>)[col]);
            const bVal = Number((b as Record<string, any>)[col]);
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
        return displayColumns.filter(c =>
            !c.startsWith('__collapsed__') &&
            c !== 'Total'
        );
    }, [isPivotReady, columns, displayColumns]);

    const visibleColumnCount = useMemo(() => {
        if (!isPivotReady) return columns.length;

        return visibleCols.filter(c => !pivot.row.includes(c)).length;
    }, [isPivotReady, columns.length, visibleCols, pivot.row]);

    if (!data.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">Upload a CSV file to begin</p>

    if (!columns.length)
        return <p className="text-center text-gray-500 mt-6 text-sm">No data to display. Select fields from the panel.</p>

    const PivotBadge = ({ label, color, value }: { label: string; color: string; value: string }) => (
        <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${color}`}>{label}</span>
            <span className="text-gray-700 font-mono text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5">{value}</span>
        </div>
    );

    const PivotBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className="text-xs px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
            {children}
        </button>
    );

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
                        columnCount={isPivotReady ? visibleColumnCount : columns.length}
                    />

                    {isPivotReady && (
                        <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-white border-t border-b border-gray-200">
                            <PivotBadge label="Rows" color="text-blue-600" value={pivot.row.join(" → ")} />
                            <PivotBadge label="Columns" color="text-emerald-600" value={pivot.column.join(" → ")} />
                            <PivotBadge label="Values" color="text-violet-600" value={`${pivot.agg.toUpperCase()}(${pivot.value.join(", ")})`} />

                            <div className="ml-auto flex items-center gap-1.5">
                                {hasHierarchy && <>
                                    <PivotBtn onClick={() => setCollapsedRows(new Set())}>↕ Expand rows</PivotBtn>
                                    <PivotBtn onClick={() => setCollapsedRows(new Set((hierarchyRows ?? []).filter(r => r._hasChildren).map(r => r._path)))}>
                                        ↔ Collapse rows
                                    </PivotBtn>
                                </>}
                                {pivot.column.length > 1 && canonicalDataCols.some(c => c.includes(' | ')) && <>
                                    <PivotBtn onClick={() => setCollapsedCols(new Set())}>↕ Expand cols</PivotBtn>
                                    <PivotBtn onClick={() => setCollapsedCols(new Set(buildColTree(canonicalDataCols).map(n => n.path)))}>
                                        ↔ Collapse cols
                                    </PivotBtn>
                                </>}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-sm">
                        <div className="flex items-center gap-2">
                            <span>Page</span>
                            <input
                                type="number"
                                min={1}
                                max={totalPages}
                                value={page}
                                onChange={e => {
                                    const val = Number(e.target.value);
                                    if (val >= 1 && val <= totalPages) setPage(val);
                                }}
                                className="w-12 border rounded px-1 py-0.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                            <span>of {totalPages} ({filteredRows.length} rows)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">◀ Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next ▶</button>
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                                {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
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