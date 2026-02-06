import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { RootState } from '../store/store';
import { useSelector } from 'react-redux';
import { VariableSizeGrid as Grid } from "react-window";


const ROW_HEIGHT = 35;
const TABLE_HEIGHT = 600;


export default function MainTable() {
    const containerRef = useRef<HTMLDivElement>(null);



    const data = useSelector((s: RootState) => s.data.rows);
    const selected = useSelector((s: RootState) => s.layout.columns);
    const allcol = useSelector((s: RootState) => s.data.columns);





    // const selected = useSelector((s: RootState) => s.layout.columns);

    const columns = useMemo(() => {
        if (!data.length) return [];
        if (!selected.length) return [];
        return allcol.filter(c => selected.includes(c));
    }, [data, selected, allcol]);

    const columnWidths = useMemo(() => {
        const widths: Record<string, number> = {};

        columns.forEach(col => {
            // Base width on header length
            widths[col] = Math.max(150, col.length * 12);
        });

        return widths;
    }, [columns]);

    const totalWidth = useMemo(() => {
        let w = 48; // index column width (w-12 ≈ 48px)

        columns.forEach(c => {
            w += columnWidths[c];
        });

        return w;
    }, [columns, columnWidths]);

    const getColumnWidth = (index: number) => {
        if (index === 0) return 48; // index column
        return columnWidths[columns[index - 1]];
    };


    const parentRef = useRef<HTMLDivElement>(null);




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
        return index === 0 ? 40 : ROW_HEIGHT; // header taller
    };




    const Cell = ({ columnIndex, rowIndex, style }: any) => {

        // HEADER ROW
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
                    className="border-b border-r bg-gray-100 font-semibold px-2 truncate"
                >
                    {columns[columnIndex - 1]}
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
            className="flex flex-col h-[calc(100vh-120px)] border border-gray-400"
        >

            <Grid
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


    );

}

