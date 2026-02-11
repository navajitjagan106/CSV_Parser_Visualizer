import { useMemo, useState, useRef, useEffect } from 'react';
import { RootState } from '../store/store';
import { VariableSizeGrid as Grid } from "react-window";
import ChartPanel from "./ChartPanel";
import { groupDataAll } from "../utils/groupDataAll";
import { useDispatch, useSelector } from "react-redux";
import { pivotData } from "../utils/pivotData";


const ROW_HEIGHT = 35;

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);
    const data = useSelector((s: RootState) => s.data.rows);
    const selected = useSelector((s: RootState) => s.layout.columns);
    const allcol = useSelector((s: RootState) => s.data.columns);
    const layout = useSelector((s: RootState) => s.layout);
    const [dimensions, setDimensions] = useState({ width: 1000, height: 900 });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const gridRef = useRef<Grid>(null);
    const chart = useSelector((s: RootState) => s.layout.chart);

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
        return allcol.filter(c => selected.includes(c));
    }, [data, selected, allcol]);

    //saftely for dataleaks
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            document.removeEventListener("mousemove", onResize);
            document.removeEventListener("mouseup", stopResize);
        };
    }, []);

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
    }, []);


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
    const onResize = (e: MouseEvent) => {
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
    };

    //saftey for closing event listeners to prevent leaks
    const stopResize = () => {
        resizingCol.current = null;
        document.removeEventListener("mousemove", onResize);
        document.removeEventListener("mouseup", stopResize);
    };





    const isPivotMode = chart.type === "pivot" && pivotResult && pivotResult.length > 0;







    return (

        <div
            ref={containerRef}
            className="flex flex-col gap-2 h-full border border-gray-400 "
        >

            {!isPivotMode && chart.enabled && chartData.length > 0 && (

                <div className="h-[420px] border-b bg-white p-3  flex flex-col">

                    {/* MAIN CHART */}
                    <div className="flex-1 min-h-0">

                        <ChartPanel
                            data={chartData}
                            xKey={chart.x}
                            yKey={chart.y}
                            type={chart.type}
                            agg={chart.agg}
                        />

                    </div>

                </div>
            )}

            <div className="flex-1 overflow-auto border-t">

                <Grid
                    ref={gridRef}
                    columnCount={finalColumns.length + 1}
                    rowCount={finalRows.length + 1}
                    columnWidth={getColumnWidth}
                    rowHeight={getRowHeight}
                    width={dimensions.width}
                    height={dimensions.height}
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
                        const row = finalRows[rowIndex - 1];
                        const col = finalColumns[columnIndex - 1];

                        return (
                            <div
                                style={style}
                                className="border-r border-b px-2 truncate"
                                title={String(row[col] ?? "")}
                            >
                                {row[col]}
                            </div>
                        );
                    }}
                </Grid>


            </div>



        </div>


    );

}

