import { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react';
import { RootState } from '../store/store';
import { useSelector } from 'react-redux';
import { VariableSizeGrid as Grid } from "react-window";
import ChartPanel from "./ChartPanel";
import { groupData } from "../utils/groupData";


const ROW_HEIGHT = 35;
const TABLE_HEIGHT = 600;


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






    // const parentRef = useRef<HTMLDivElement>(null);


    // const selected = useSelector((s: RootState) => s.layout.columns);
    const chartData = useMemo(() => {
        if (!chart.enabled || !chart.x || !chart.y) return [];

        return groupData(data, chart.x, chart.y);

    }, [chart.x, chart.y, chart.enabled, data]);


    const columns = useMemo(() => {
        if (!data.length) return [];
        if (!selected.length) return [];
        return allcol.filter(c => selected.includes(c));
    }, [data, selected, allcol]);

    //const DEFAULT_COL_WIDTH = 180;


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
    const rowCount = data.length + 1; // +1 for header

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

            // ✅ Force grid to recompute
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

        // HEADER ROW
        if (rowIndex === 0) {
            if (columnIndex === 0) {
                return (
                    <div
                        style={{
                            ...style,
                            position: "relative", // ✅ REQUIRED
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
            {/* CHART AREA */}
            {chart.enabled && (
                <div className="h-[380px] border-b bg-white  overflow-hidden">

                    <ChartPanel
                        data={chartData}
                        xKey={chart.x}
                        yKey={chart.y}
                        type={chart.type}
                    />

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

