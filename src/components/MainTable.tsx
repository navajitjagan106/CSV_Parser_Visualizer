import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { RootState } from '../store/store';
import { VariableSizeGrid as Grid } from "react-window";
import ChartPanel from "./ChartPanel";
import { groupDataAll } from "../utils/groupDataAll";
import { useSelector } from "react-redux";
import { pivotData } from "../utils/pivotData";
import {
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiX
} from "react-icons/fi";


const ROW_HEIGHT = 35;

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);
    const data = useSelector((s: RootState) => s.data.rows);
    const selected = useSelector((s: RootState) => s.layout.columns);
    const allcol = useSelector((s: RootState) => s.data.columns);
    const layout = useSelector((s: RootState) => s.layout);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const gridRef = useRef<Grid>(null);
    const chart = useSelector((s: RootState) => s.layout.chart);
    const [sortConfig, setSortConfig] = useState<{
        column: string | null;
        direction: 'asc' | 'desc' | null;
    }>({ column: null, direction: null });

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [showFilterInput, setShowFilterInput] = useState(false);



    //if pivot selected memo will get pivot data from redux and store as pivot result or stores null
    const pivotResult = useMemo(() => {
        if (chart.type !== "pivot") return null;
        return pivotData(
            data,
            layout.pivot.row,
            layout.pivot.column,
            layout.pivot.value,
            layout.pivot.agg
        );
    }, [data, layout.pivot, chart.type]);


    // memo function to calculate data for charts
    const allChartData = useMemo(() => {
        if (!chart.x || !chart.y) return null;

        return groupDataAll(data, chart.x, chart.y);
    }, [data, chart.x, chart.y]);

    //data for chartss
    const chartData = allChartData
        ? allChartData[chart.agg]
        : [];

    //Sorting Column name for Table based on selected column names
    const columns = useMemo(() => {
        if (!data.length) return [];
        if (!selected.length) return [];
        return selected.filter(c => allcol.includes(c));
    }, [data, selected, allcol]);



    //another memo function which checks whether pivot is selected , storees pivot columns or the original selected columns
    const finalColumns = useMemo(() => {
        if (chart.type === "pivot" && pivotResult?.length) {
            return Object.keys(pivotResult[0]);
        }
        return columns;
    }, [chart.type, pivotResult, columns]);

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
    }, [finalColumns]);


    //window resizer for table
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
    }, [layout.columns]);


    //Similar to final columns , the finalrows stores the data based on pivot or normal table
    const finalRows = useMemo(() => {
        if (chart.type === "pivot" && pivotResult) {
            return pivotResult;
        }
        return data;
    }, [chart.type, pivotResult, data]);



    //gets columnwidth based on the index, when grid requests the columnwidth
    const getColumnWidth = (index: number) => {
        if (index === 0) return 48;

        const col = finalColumns[index - 1];

        return columnWidths[col] || 180;
    };

    const handleSort = (direction: 'asc' | 'desc') => {
        if (finalColumns.length === 0) return;

        // Use first numeric column for sorting
        const numericCol = finalColumns.find(col => {
            const firstVal = finalRows[0]?.[col];
            return !isNaN(Number(firstVal));
        });

        if (numericCol) {
            setSortConfig({ column: numericCol, direction });
        }
    };

    // 2. EXPORT FUNCTIONALITY
    const handleExportCSV = () => {
        // Create CSV content
        const headers = finalColumns.join(',');
        const rows = finalRows.map(row =>
            finalColumns.map(col => {
                const val = row[col];
                // Escape values with commas or quotes
                return typeof val === 'string' && (val.includes(',') || val.includes('"'))
                    ? `"${val.replace(/"/g, '""')}"`
                    : val;
            }).join(',')
        ).join('\n');

        const csv = `${headers}\n${rows}`;

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const handleExportJSON = () => {
        const json = JSON.stringify(finalRows, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    // 3. APPLY SORTING TO FINAL ROWS
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

    // 4. APPLY FILTERING
    const filteredRows = useMemo(() => {
        if (!filterText.trim()) return sortedRows;

        const lowerFilter = filterText.toLowerCase();
        return sortedRows.filter(row =>
            finalColumns.some(col =>
                String(row[col]).toLowerCase().includes(lowerFilter)
            )
        );
    }, [sortedRows, filterText, finalColumns]);



    //Row height based on the index ,0 represts the first column 
    const getRowHeight = (index: number) => {
        return index === 0 ? 40 : ROW_HEIGHT;
    };

    //Column resizing function ,with the help mousevents
    const startResize = (e: React.MouseEvent, col: string) => {
        resizingCol.current = col;
        startX.current = e.clientX;
        document.addEventListener("mousemove", onResize);
        document.addEventListener("mouseup", stopResize);
    };

    // calculates the amount of change (i.e) scoll distance and updated with the columnwidth before 
    const onResize = useCallback((e: MouseEvent) => {
        if (!resizingCol.current) return;

        const dx = e.clientX - startX.current;

        setColumnWidths(prev => {
            const next = {
                ...prev,
                [resizingCol.current!]: Math.max(120, prev[resizingCol.current!] + dx),
            };

            gridRef.current?.resetAfterColumnIndex(0);
            return next;
        });

        startX.current = e.clientX;
    }, []);

    const stopResize = useCallback(() => {
        resizingCol.current = null;

        document.removeEventListener("mousemove", onResize);
        document.removeEventListener("mouseup", stopResize);
    }, [onResize]);


    const isPivotMode = chart.type === "pivot" && pivotResult && pivotResult.length > 0;

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

                {!isPivotMode && chart.enabled && chartData.length > 0 && (

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


                    {/* TOOLBAR */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50 sticky top-0 z-10">
                        <button title="Sort Ascending" className="p-1.5 hover:bg-gray-200 rounded text-sm"
                            onClick={() => handleSort("asc")}>
                            ⬆️

                        </button>
                        <button title="Sort Descending" className="p-1.5 hover:bg-gray-200 rounded text-sm"
                            onClick={() => handleSort("desc")}>
                            ⬇️
                        </button>
                        <div className="border-l h-5 mx-1"></div>
                        <button title="Refresh" className="p-1.5 hover:bg-gray-200 rounded text-sm" onClick={() => window.location.reload()}>
                            🔄
                        </button>
                        <button title="Export" className="p-1.5 hover:bg-gray-200 rounded text-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                            📥
                        </button>
                        {showExportMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-white border shadow-lg rounded z-20">
                                <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={handleExportCSV}
                                >
                                    Export as CSV
                                </button>
                                <button
                                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={handleExportJSON}
                                >
                                    Export as JSON
                                </button>
                            </div>
                        )}
                        <button title="Filter" className="p-1.5 hover:bg-gray-200 rounded text-sm" onClick={() => setShowFilterInput(!showFilterInput)}>
                            🔍
                        </button>
                        {showFilterInput && (
                            <input
                                type="text"
                                placeholder="Filter rows..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        )}

                        {/* Show active filters */}
                        {(sortConfig.column || filterText) && (
                            <button
                                className="ml-auto text-xs text-red-600 hover:text-red-700"
                                onClick={() => {
                                    setSortConfig({ column: null, direction: null });
                                    setFilterText('');
                                    setShowFilterInput(false);
                                }}
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <Grid
                        ref={gridRef}
                        columnCount={finalColumns.length + 1}
                        rowCount={filteredRows.length + 1}
                        columnWidth={getColumnWidth}
                        rowHeight={getRowHeight}
                        width={dimensions.width}
                        height={Math.max(200, dimensions.height)}
                    >
                        {({ columnIndex, rowIndex, style }) => {
                            /* HEADER */
                            if (rowIndex === 0) {
                                if (columnIndex === 0) {
                                    return (
                                        <div
                                            style={style}
                                            className="border-b border-r bg-gray-100 font-semibold flex items-center justify-center"
                                        >
                                            #
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        style={style}
                                        className="border-b border-r bg-gray-100 font-semibold px-2 truncate relative"
                                    >
                                        {finalColumns[columnIndex - 1]}

                                        {/* Resize */}
                                        <div
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                startResize(e, finalColumns[columnIndex - 1]);
                                            }}
                                        />
                                    </div>
                                );
                            }

                            /* INDEX */
                            if (columnIndex === 0) {
                                return (
                                    <div
                                        style={style}
                                        className="border-r border-b text-center"
                                    >
                                        {rowIndex}
                                    </div>
                                );
                            }

                            /* DATA */
                            const row = filteredRows[rowIndex - 1];
                            const col = finalColumns[columnIndex - 1];
                            const cellValue = row[col]
                            const isNegative = !isNaN(Number(cellValue)) && Number(cellValue) < 0;


                            return (
                                <div
                                    style={style}
                                    className={`border-r border-b px-2 truncate ${isNegative ? 'text-red-600 font-medium' : ''
                                        }`}
                                    title={String(cellValue ?? "")}
                                >
                                    {cellValue}
                                </div>
                            );
                        }}
                    </Grid>


                </div>
            </div>

        </div>
    );

}

