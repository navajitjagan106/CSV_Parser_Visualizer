import { useMemo, useState, useRef, useEffect } from 'react';
import ChartPanel from "./Panels/ChartPanel";
import TableToolbar from './TableComponents/TableToolbar';
import TableGrid from './TableComponents/TableGrid';
import TableStatus from './TableComponents/TableStatus';
import { useTableData } from '../utils/useTableData';

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);//ref to the entire container for height & width size refactoring
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });//to set dimensions for the grid acc to window size
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});//varibale colimn width like excel
    const [sortCol, setSortCol] = useState('');//selecting a column using which we can ssort stuff
    const [sortConfig, setSortConfig] = useState<{   //asc or desc
        column: string | null;
        direction: 'asc' | 'desc' | null;
    }>({ column: null, direction: null });
    const [filterText, setFilterText] = useState(''); // for text filtering

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50); // rows per page

    const { data, columns, finalColumns, finalRows, allChartData, chart, pivot } = useTableData();
    const chartData = allChartData ? allChartData[chart.agg] : [];
const gridWrapperRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
            setDimensions(prev => ({
                ...prev,
                height: entry.contentRect.height,
            }));
        }
    });
    if (gridWrapperRef.current) {
        observer.observe(gridWrapperRef.current);
    }
    return () => observer.disconnect();
}, []);
    //Calculates column widths for each column 
    useEffect(() => {
        if (!columns.length) return;
        setColumnWidths(prev => {
            const init = { ...prev };  // Keep existing widths
            finalColumns.forEach(col => {
                if (!(col in init)) {  // Only add new columns
                    init[col] = Math.max(col.length * 12, 180);
                }
            });
            return init;
        });
    }, [finalColumns, columns]);
    
    useEffect(() => {
        setPage(1);
    }, [filterText, sortConfig, pivot, pageSize]);

    //table resizes automatically based on the reference's width
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        // Update immediately
        updateDimensions();
        // Update on window resize
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [columns]);

    const chartEnabled = Boolean(chart.type && chart.x && chart.y);//boolean varable to chk chart is on or not



    // — Export —
    const handleSort = (direction: 'asc' | 'desc') => {
        if (!sortCol) return; // nothing selected
        setSortConfig({ column: sortCol, direction });
    };

    const handleExportCSV = () => {
        const headers = finalColumns.join(',');
        const rows = finalRows.map(row =>
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
        const blob = new Blob([JSON.stringify(finalRows, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `export_${new Date().toISOString().slice(0, 10)}.json`; a.click();
        window.URL.revokeObjectURL(url);
    };

    // — Column resize handler (passed down to TableGrid) —
    const handleColumnResize = (col: string, delta: number) => {
        setColumnWidths(prev => ({ ...prev, [col]: Math.max(120, (prev[col] || 180) + delta) }));
    };

    //  APPLY SORTING TO FINAL ROWS
    const sortedRows = useMemo(() => {
        if (!sortConfig.column || !sortConfig.direction) return finalRows;

        return [...finalRows].sort((a, b) => {
            const aVal = Number(a[sortConfig.column!]);
            const bVal = Number(b[sortConfig.column!]);
            if (isNaN(aVal) || isNaN(bVal)) return 0;
            return sortConfig.direction === 'asc'
                ? aVal - bVal
                : bVal - aVal;
        });
    }, [finalRows, sortConfig]);

    //  APPLY FILTERING on sorted rows
    const filteredRows = useMemo(() => {
        if (!filterText.trim()) return sortedRows;
        const lowerFilter = filterText.toLowerCase();
        return sortedRows.filter(row =>
            finalColumns.some(col =>
                String(row[col]).toLowerCase().includes(lowerFilter)
            )
        );
    }, [sortedRows, filterText, finalColumns]);

    const totalPages = Math.ceil(filteredRows.length / pageSize);

    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredRows.slice(start, start + pageSize);
    }, [filteredRows, page, pageSize]);

    if (!data.length)
        return (
            <p className="text-center text-gray-500 mt-6 text-sm">
                Upload a CSV file to begin
            </p>
        );

    if (!columns.length)
        return (
            <p className="text-center text-gray-500 mt-6 text-sm">
                No data to display. Select fields from the panel.
            </p>
        );


    return (
        <div
            ref={containerRef}
            className="flex flex-col gap-2 h-full min-h-0 border border-gray-400">
            <div className="flex-1 overflow-auto ">
                {chartEnabled && chartData.length > 0 && (
                    <div className="h-[420px] border-b bg-white p-3 ">
                        {/* MAIN CHART */}
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
                        totalCount={finalRows.length}
                        columnCount={finalColumns.length}
                    />
                    <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 text-sm">
                        <div>
                            Page {page} of {totalPages} ({filteredRows.length} rows)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                ◀ Prev
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                Next ▶
                            </button>
                            <select
                                value={pageSize}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="border rounded px-2 py-1"
                            >
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
                            finalColumns={finalColumns}
                            filteredRows={pagedRows}
                            dimensions={dimensions}
                            columnWidths={columnWidths}
                            onColumnResize={handleColumnResize}
                            pivotRowKey={pivot.enabled ? pivot.row.join(' | ') : undefined}
                            pivotColKey={pivot.enabled ? pivot.column.join(' | ') : undefined}
                            pivotValKey={pivot.enabled?pivot.value.join(''):undefined}
                            page={page}
                            pageSize={pageSize}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

}