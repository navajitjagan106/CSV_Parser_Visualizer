import { useRef, useCallback } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import { ColHeaderLevel } from '../../utils/buildColHeaders';

type Props = {
    finalColumns: string[];
    filteredRows: Record<string, any>[];
    dimensions: { width: number; height: number };
    columnWidths: Record<string, number>;
    onColumnResize: (col: string, delta: number) => void;
    pivotRowKeys: string[];
    hasHierarchy: boolean;
    onToggleCollapse: (path: string) => void;
    collapsed: Set<string>;
    colHeaders: ColHeaderLevel[];
    page: number;
    pageSize: number;
};

const ROW_HEIGHT = 32;
const SINGLE_HEADER_HEIGHT = 38;
const LEVEL_HEADER_HEIGHT = 24;

export default function TableGrid({
    finalColumns, filteredRows, dimensions, columnWidths, onColumnResize,
    pivotRowKeys, hasHierarchy, onToggleCollapse, collapsed, colHeaders, page, pageSize,
}: Props) {
    const gridRef = useRef<Grid>(null);
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);

    const numHeaderLevels = colHeaders.length;
    const hasGroupedHeaders = numHeaderLevels > 0;

    const getColumnWidth = (index: number) => {
        if (index === 0) return 48;
        const col = finalColumns[index - 1];
        return columnWidths[col] || 180;
    };

    const getRowHeight = (index: number) => {
        if (index === 0) return hasGroupedHeaders
            ? LEVEL_HEADER_HEIGHT * numHeaderLevels
            : SINGLE_HEADER_HEIGHT;
        return ROW_HEIGHT;
    };

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

    const startResize = (e: React.MouseEvent, col: string) => {
        resizingCol.current = col;
        startX.current = e.clientX;
        document.addEventListener("mousemove", onResize);
        document.addEventListener("mouseup", stopResize);
    };

    const renderHeader = (columnIndex: number, style: React.CSSProperties) => {
        if (columnIndex === 0) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 font-semibold flex items-center justify-center text-xs text-gray-600 select-none">
                    #
                </div>
            );
        }

        const col = finalColumns[columnIndex - 1];
        const isRowKey = pivotRowKeys.includes(col);

        if (!hasGroupedHeaders) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 hover:bg-blue-50 font-semibold px-2 truncate relative flex items-center text-[12px] text-gray-700 transition-colors">
                    <span className="truncate">{col}</span>
                    <div
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400"
                        onMouseDown={(e) => { e.preventDefault(); startResize(e, col); }}
                    />
                </div>
            );
        }

        const colParts = col.includes(" | ") ? col.split(" | ") : [col];

        return (
            <div style={style} className="border-b border-r bg-gray-100 relative flex flex-col overflow-hidden">
                {isRowKey ? (
                    <div className="flex items-center px-2 font-semibold text-[12px] bg-gray-100 text-gray-700 h-full truncate">
                        {col}
                    </div>
                ) : (
                    colHeaders.map((_, levelIndex) => {
                        const label = colParts[levelIndex] ?? colParts[colParts.length - 1];
                        const isLastLevel = levelIndex === numHeaderLevels - 1;
                        return (
                            <div
                                key={levelIndex}
                                className={`flex items-center px-2 text-[12px] truncate border-b bg-gray-100 text-gray-700
                                    ${isLastLevel ? "font-normal text-gray-600" : "font-semibold"}
                                `}
                                style={{ height: LEVEL_HEADER_HEIGHT }}
                                title={label}
                            >
                                {label}
                            </div>
                        );
                    })
                )}
                <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 z-10"
                    onMouseDown={(e) => { e.preventDefault(); startResize(e, col); }}
                />
            </div>
        );
    };

    const renderCell = (columnIndex: number, rowIndex: number, style: React.CSSProperties) => {
        if (columnIndex === 0) {
            const isEvenRow = rowIndex % 2 === 0;
            return (
                <div style={style} className={`border-r border-b text-center text-[12px] text-gray-500 flex items-center justify-center select-none ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                    {(page - 1) * pageSize + rowIndex}
                </div>
            );
        }

        const row = filteredRows[rowIndex - 1];
        if (!row) return <div style={style} />;

        const col = finalColumns[columnIndex - 1];
        const cellValue = row[col];
        const isRowKey = pivotRowKeys.includes(col);
        const isSubtotal = Boolean(row._isSubtotal);
        const depth: number = row._depth ?? 0;
        const hasChildren: boolean = Boolean(row._hasChildren);
        const path: string = row._path ?? "";
        const isCollapsed = collapsed.has(path);
        const isNegative = !isNaN(Number(cellValue)) && Number(cellValue) < 0;
        const isEvenRow = rowIndex % 2 === 0;

        if (isSubtotal) {
            return (
                <div
                    style={style}
                    className="border-r border-b px-2 flex items-center bg-gray-100 font-semibold text-[12px] text-gray-800 truncate"
                    title={String(cellValue ?? '')}
                >
                    {cellValue !== '' && cellValue !== undefined ? String(cellValue) : ''}
                </div>
            );
        }

        if (isRowKey && hasHierarchy) {
            const rowKeyIndex = pivotRowKeys.indexOf(col);
            const isFirstKey = rowKeyIndex === 0;
            const indentPx = depth * 16;
            const showToggle = isFirstKey && hasChildren;

            return (
                <div
                    style={style}
                    className={`border-r border-b px-1 flex items-center truncate text-[12px] text-gray-800 hover:bg-gray-100
                        ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}
                    title={String(cellValue ?? '')}
                >
                    <span style={{ paddingLeft: indentPx }} className="flex items-center gap-1">
                        {showToggle ? (
                            <button
                                onClick={() => onToggleCollapse(path)}
                                className="text-gray-500 hover:text-blue-600 w-4 text-center shrink-0 text-[10px]"
                            >
                                {isCollapsed ? '▶' : '▼'}
                            </button>
                        ) : isFirstKey ? (
                            <span className="w-4 shrink-0 inline-block" />
                        ) : null}
                        <span className={hasChildren ? "font-semibold text-gray-900" : "text-gray-700"}>
                            {cellValue}
                        </span>
                    </span>
                </div>
            );
        }

        return (
            <div
                style={style}
                className={`border-r border-b px-2 truncate flex items-center text-[12px] hover:bg-gray-100
                    ${isEvenRow ? 'bg-white' : 'bg-gray-50'}
                    ${isNegative ? 'text-red-600 font-medium' : 'text-gray-800'}`}
                title={String(cellValue ?? '')}
            >
                {cellValue !== undefined && cellValue !== '' ? String(cellValue) : ''}
            </div>
        );
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
                if (rowIndex === 0) return renderHeader(columnIndex, style);
                return renderCell(columnIndex, rowIndex, style);
            }}
        </Grid>
    );
}