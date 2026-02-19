import { useMemo, useState, useRef, useEffect } from 'react';
import { RootState } from '../store/store';
import ChartPanel from "./Panels/ChartPanel";
import { groupDataAll } from "../utils/groupDataAll";
import { useSelector } from "react-redux";
import { pivotData } from "../utils/pivotData";
import TableToolbar from './TableComponents/TableToolbar';
import TableGrid from './TableComponents/TableGrid';
import TableStatus from './TableComponents/TableStatus';

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);//ref to the entire container for height & width size refactoring
    const data = useSelector((s: RootState) => s.data.rows);//selecting the actual data from redux
    const selected = useSelector((s: RootState) => s.layout.columns);// selected the selected column fields from the redux
    const allcol = useSelector((s: RootState) => s.data.columns);//selecting the entirity of the columns from the redux
     const topN = useSelector((s: RootState) => s.layout.topN);
    const filtersRange = useSelector((s: RootState) => s.layout.filtersRange);
    const rangeCol = useSelector((s: RootState) => s.layout.rangeCol);
    const multiSelectFilters = useSelector((s: RootState) => s.layout.multiSelectFilters);
    const nullFilters = useSelector((s: RootState) => s.layout.nullFilters);
    const pivot=useSelector((s:RootState)=>s.layout.pivot);
    const chart = useSelector((s: RootState) => s.layout.chart);//selecting the chart object for accesing its data

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });//to set dimensions for the grid acc to window size
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});//varibale colimn width like excel
    const [sortCol, setSortCol] = useState('');//selecting a column using which we can ssort stuff
    const [sortConfig, setSortConfig] = useState<{   //asc or desc
        column: string | null;
        direction: 'asc' | 'desc' | null;
    }>({ column: null, direction: null });
    const [filterText, setFilterText] = useState(''); // for text filtering


    //find the data after filters are applied and use them
    const filteredBaseData = useMemo(() => {
        let result = [...data];
        /*  RANGE FILTER  */
        if (rangeCol && selected.includes(rangeCol) && filtersRange?.[rangeCol]) {
            const { min, max } = filtersRange[rangeCol];
            result = result.filter(row => {
                const val = Number(row[rangeCol]);
                if (isNaN(val)) return false;
                return val >= min && val <= max;
            });
        }
        /*  TOP N FILTER  */
        if (topN.enabled && topN.column && selected.includes(topN.column)) {
            const col = topN.column;
            result = result
                .filter(r => !isNaN(Number(r[col])))
                .sort((a, b) => {
                    const av = Number(a[col]);
                    const bv = Number(b[col]);
                    return topN.order === "top"
                        ? bv - av
                        : av - bv;
                })
                .slice(0, topN.count);
        }
        const multiFilters = multiSelectFilters || {};
        Object.entries(multiFilters).forEach(([col, vals]) => {
            if (vals.length > 0 && selected.includes(col)) {
                result = result.filter(row => vals.includes(String(row[col] ?? '')));
            }
        });

        // NULL FILTER
        const nullFilter= nullFilters || {};
        Object.entries(nullFilter).forEach(([col, mode]) => {
            if (!selected.includes(col)) return;
            if (mode === 'show') {
                // show only empty rows
                result = result.filter(row => {
                    const val = row[col];
                    return val === null || val === undefined || String(val).trim() === '';
                });
            } else if (mode === 'hide') {
                // hide empty rows
                result = result.filter(row => {
                    const val = row[col];
                    return val !== null && val !== undefined && String(val).trim() !== '';
                });
            }
        });
        return result;
    }, [data, rangeCol, filtersRange, topN, multiSelectFilters, nullFilters, selected,]);

    //if pivot selected memo will get pivot data from redux and store as pivot result or stores null
    const pivotResult = useMemo(() => {
        if (!pivot.enabled) return null;
        const { row, column, value } = pivot;

        if (!row || !column || !value) return null;
        if (!selected.includes(row) || !selected.includes(column) || (!value.every(v => selected.includes(v))) ) return null;
        return pivotData(filteredBaseData, row, column, value, pivot.agg);
    }, [filteredBaseData, pivot, selected]);

    // memo function to calculate data for charts 
    const allChartData = useMemo(() => {
        if (!chart.x || !chart.y) return null;
        return groupDataAll(filteredBaseData, chart.x, chart.y);
    }, [filteredBaseData, chart.x, chart.y]);

    //data for chartss
    const chartData = allChartData ? allChartData[chart.agg] : [];

    //Sorting Column name for Table based on selected column names
    const columns = useMemo(() => {
        if (!data.length) return [];
        if (!selected.length) return [];
        return selected.filter(c => allcol.includes(c));
    }, [data, selected, allcol]);

    //another memo function which checks whether pivot is selected , storees pivot columns or the original selected columns
    const finalColumns = useMemo(() => {
        if (pivotResult?.length) {
            return Object.keys(pivotResult[0]);
        }
        return columns;
    }, [pivotResult, columns]);

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
    }, [selected]);

    const chartEnabled = Boolean(chart.type && chart.x && chart.y);//boolean varable to chk chart is on or not

    //Similar to final columns , the finalrows stores the data based on pivot or normal table
    const finalRows = useMemo(() => {
        if (pivotResult?.length) {
            return pivotResult;
        }
        return filteredBaseData;
    }, [pivotResult, filteredBaseData]);

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
            className="flex flex-col gap-2 h-screen border border-gray-400"
        >
            <div className="flex-1 overflow-auto scrollbar-hide">

                {chartEnabled && chartData.length > 0 && (

                    <div className="h-[420px] border-b bg-white p-3  ">
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

                <div className="flex-1 border-t min-h-0">
                    <div className="flex-1 border-t min-h-0">
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

                        <TableGrid
                            finalColumns={finalColumns}
                            filteredRows={filteredRows}
                            dimensions={dimensions}
                            columnWidths={columnWidths}
                            onColumnResize={handleColumnResize}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

}