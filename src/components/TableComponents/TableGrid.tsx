import { useRef, useCallback } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';

type Props = {
    finalColumns: string[];
    filteredRows: Record<string, any>[];
    dimensions: { width: number; height: number };
    columnWidths: Record<string, number>;
    onColumnResize: (col: string, delta: number) => void;
};

const ROW_HEIGHT = 35;

export default function TableGrid({
    finalColumns, filteredRows, dimensions, columnWidths, onColumnResize,
}: Props) {
    const gridRef = useRef<Grid>(null);
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);

    //gets columnwidth based on the index, when grid requests the columnwidth
    const getColumnWidth = (index: number) => {
        if (index === 0) return 48;
        const col = finalColumns[index - 1];
        return columnWidths[col] || 180;
    };

    //Row height based on the index ,0 represts the first column 
    const getRowHeight = (index: number) => (index === 0 ? 40 : ROW_HEIGHT);

    // calculates the amount of change (i.e) scoll distance and updated with the columnwidth before 
    const onResize = useCallback((e: MouseEvent) => {
        if (!resizingCol.current) return;
        const dx = e.clientX - startX.current;
        onColumnResize(resizingCol.current, dx);
        gridRef.current?.resetAfterColumnIndex(0);
        startX.current = e.clientX;
    }, [onColumnResize]);

    const stopResize = useCallback(() => {
        resizingCol.current = null;
        document.removeEventListener('mousemove', onResize);
        document.removeEventListener('mouseup', stopResize);
    }, [onResize]);

    //Column resizing function ,with the help mousevents
    const startResize = (e: React.MouseEvent, col: string) => {
        resizingCol.current = col;
        startX.current = e.clientX;
        document.addEventListener("mousemove", onResize);
        document.addEventListener("mouseup", stopResize);
    };

    return (
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
                // Header row
                if (rowIndex === 0) {
                    if (columnIndex === 0) {
                        return (
                            <div style={style} className="border-b border-r bg-gray-100 font-semibold flex items-center justify-center">
                                #
                            </div>
                        );
                    }
                    return (
                        <div style={style} className="border-b border-r bg-gray-100 font-semibold px-2 truncate relative">
                            {finalColumns[columnIndex - 1]}
                            <div
                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                                onMouseDown={(e) => { e.preventDefault(); startResize(e, finalColumns[columnIndex - 1]); }}
                            />
                        </div>
                    );
                }

                // Index column
                if (columnIndex === 0) {
                    return <div style={style} className="border-r border-b text-center">{rowIndex}</div>;
                }

                // Data cell
                const row = filteredRows[rowIndex - 1];
                const col = finalColumns[columnIndex - 1];
                const cellValue = row[col];
                const isNegative = !isNaN(Number(cellValue)) && Number(cellValue) < 0;

                return (
                    <div
                        style={style}
                        className={`border-r border-b px-2 truncate ${isNegative ? 'text-red-600 font-medium' : ''}`}
                        title={String(cellValue ?? '')}
                    >
                        {cellValue}
                    </div>
                );
            }}
        </Grid>
    );
}