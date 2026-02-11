import { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { RootState } from '../store/store';
import { VariableSizeGrid as Grid } from "react-window";
import ChartPanel from "./ChartPanel";
import { groupDataAll } from "../utils/groupDataAll";
import { useDispatch, useSelector } from "react-redux";
import { setChart } from "../store/layoutSlice";
//import KpiBar from "./KpiBar";



const ROW_HEIGHT = 35;

export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);
    const data = useSelector((s: RootState) => s.data.rows);
    const selected = useSelector((s: RootState) => s.layout.columns);
    const allcol = useSelector((s: RootState) => s.data.columns);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);
    const gridRef = useRef<Grid>(null);
    const chart = useSelector((s: RootState) => s.layout.chart);

    const dispatch = useDispatch();



    const allChartData = useMemo(() => {
        if (!chart.x || !chart.y) return null;

        return groupDataAll(data, chart.x, chart.y);
    }, [data, chart.x, chart.y]);

    const chartData = allChartData
        ? allChartData[chart.agg]
        : [];
    const columns = useMemo(() => {
        if (!data.length) return [];
        if (!selected.length) return [];
        return allcol.filter(c => selected.includes(c));
    }, [data, selected, allcol]);

    useEffect(() => {
        if (!columns.length) return;
        const init: Record<string, number> = {};
        columns.forEach(col => {
            init[col] = Math.max(col.length * 12, 180);
        });
        setColumnWidths(init);
    }, [columns]);

    const getColumnWidth = (index: number) => {
        if (index === 0) return 48; // index column
        return columnWidths[columns[index - 1]] || 180;
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

    const columnCount = columns.length + 1;
    const rowCount = data.length + 1;

    const getRowHeight = (index: number) => {
        return index === 0 ? 40 : ROW_HEIGHT;
    };

    const startResize = (e: React.MouseEvent, col: string) => {
        resizingCol.current = col;
        startX.current = e.clientX;
        document.addEventListener("mousemove", onResize);
        document.addEventListener("mouseup", stopResize);
    };

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


    const stopResize = () => {
        resizingCol.current = null;
        document.removeEventListener("mousemove", onResize);
        document.removeEventListener("mouseup", stopResize);
    };





    const Cell = ({ columnIndex, rowIndex, style }: any) => {
        if (rowIndex === 0) {
            if (columnIndex === 0) {
                return (
                    <div
                        style={{
                            ...style,
                            position: "relative",
                        }}
                        className="border-b border-r bg-gray-100 font-semibold flex items-center justify-center"
                    >
                        #
                    </div>
                );
            }

            return (
                <div
                    style={style}
                    className="border-b border-r bg-gray-100 font-semibold px-2 truncate"
                >
                    {columns[columnIndex - 1]}
                    {/* Resize Handle */}
                    <div
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            startResize(e, columns[columnIndex - 1])
                        }}
                    />
                </div>

            );
        }

        // DATA ROW
        const row = data[rowIndex - 1];

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

        const col = columns[columnIndex - 1];

        return (
            <div
                style={style}
                className="border-r border-b px-2 truncate"
                title={String(row[col] ?? "")}
            >
                {row[col]}
            </div>
        );
    };

    return (

        <div
            ref={containerRef}
            className="flex flex-col h-full border border-gray-400 "
        >
            {chart.enabled && chartData.length > 0 && (

                <div className="h-[420px] border-b bg-white p-3 flex flex-col">

                    {/* KPI BAR */}
                   

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

                    columnCount={columnCount}
                    rowCount={rowCount}
                    columnWidth={getColumnWidth}
                    rowHeight={getRowHeight}
                    width={containerRef.current?.clientWidth || 800}
                    height={containerRef.current?.clientHeight || 600}
                    overscanRowCount={5}
                    overscanColumnCount={2}
                >
                    {Cell}
                </Grid>
            </div>



        </div>


    );

}

