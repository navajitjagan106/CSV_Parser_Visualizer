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
    collapsedCols: Set<string>;
    onToggleColCollapse: (groupKey: string) => void;
    collapsedGroupMap: Record<string, string[]>;
    page: number;
    pageSize: number;
};

const ROW_HEIGHT = 32;
const SINGLE_HEADER_HEIGHT = 38;
const LEVEL_HEADER_HEIGHT = 24;

export default function TableGrid({
    finalColumns, filteredRows, dimensions, columnWidths, onColumnResize,
    pivotRowKeys, hasHierarchy, onToggleCollapse, collapsed, colHeaders,
    collapsedCols, onToggleColCollapse, collapsedGroupMap, page, pageSize,
}: Props) {
    const gridRef = useRef<Grid>(null);
    const resizingCol = useRef<string | null>(null);
    const startX = useRef(0);

    const numHeaderLevels = colHeaders.length;
    const hasGroupedHeaders = numHeaderLevels > 0;

    const getColumnWidth = (index: number) => {
        if (index === 0) return 48;
        const col = finalColumns[index - 1];
        if (col.startsWith('__collapsed__')) return columnWidths[col] || 120;
        return columnWidths[col] || 140;
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
        const colIndex = finalColumns.indexOf(resizingCol.current) + 1;
        gridRef.current?.resetAfterColumnIndex(colIndex, false);
        startX.current = e.clientX;
    }, [onColumnResize, finalColumns]);

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

    const ResizeHandle = ({ col, stopProp = false }: { col: string; stopProp?: boolean }) => (
        <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 z-10"
            onMouseDown={(e) => {
                e.preventDefault();
                if (stopProp) e.stopPropagation();
                startResize(e, col);
            }}
        />
    );

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
        const isCollapsedSummary = col.startsWith('__collapsed__');
        const isTotal = col === 'Total';

        if (isCollapsedSummary) {
            const groupKey = col.replace('__collapsed__', '');
            return (
                <div
                    style={style}
                    className="border-b border-r bg-gray-200 relative flex flex-col overflow-hidden cursor-pointer hover:bg-gray-300"
                    onClick={() => onToggleColCollapse(groupKey)}
                >
                    {Array.from({ length: Math.max(numHeaderLevels, 1) }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-2 border-b text-[11px] font-semibold text-gray-700 bg-gray-200"
                            style={{ height: numHeaderLevels ? LEVEL_HEADER_HEIGHT : SINGLE_HEADER_HEIGHT }}
                        >
                            {i === 0 ? (
                                <>
                                    <span className="truncate">{groupKey}</span>
                                    <span className="ml-1 text-blue-600 shrink-0">▶</span>
                                </>
                            ) : (
                                <span className="text-gray-400 italic text-[10px]">sum</span>
                            )}
                        </div>
                    ))}
                    <ResizeHandle col={col} stopProp />
                </div>
            );
        }

        if (isTotal) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 relative flex flex-col overflow-hidden">
                    {Array.from({ length: Math.max(numHeaderLevels, 1) }).map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-center px-2 border-b text-[11px] font-bold text-gray-700 bg-gray-100"
                            style={{ height: numHeaderLevels ? LEVEL_HEADER_HEIGHT : SINGLE_HEADER_HEIGHT }}
                        >
                            {numHeaderLevels === 0 || i === numHeaderLevels - 1 ? 'Total' : ''}
                        </div>
                    ))}
                    <ResizeHandle col={col} />
                </div>
            );
        }

        if (!hasGroupedHeaders) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 hover:bg-gray-200 font-semibold px-2 truncate relative flex items-center text-[12px] text-gray-700 transition-colors">
                    <span className="truncate">{col}</span>
                    <ResizeHandle col={col} />
                </div>
            );
        }

        if (isRowKey) {
            return (
                <div style={style} className="border-b border-r relative flex flex-col overflow-hidden">
                    <div className="flex items-center px-2 font-semibold text-[12px] bg-gray-100 text-gray-700 h-full truncate">
                        {col}dd
                    </div>
                    <ResizeHandle col={col} />
                </div>
            );
        }

        // Multi-level grouped header — look up group from colHeaders, no string splitting
        return (
            <div style={style} className="border-b border-r relative flex flex-col overflow-hidden">
                {colHeaders.map((levelHeaders, levelIndex) => {
                    const isTopLevel = levelIndex === 0;
                    const isLastLevel = levelIndex === numHeaderLevels - 1;

                    const group = levelHeaders.find(g => g.children.includes(col));
                    if (!group) {
                        return (
                            <div
                                key={levelIndex}
                                className="border-b bg-gray-100"
                                style={{ height: LEVEL_HEADER_HEIGHT }}
                            />
                        );
                    }

                    const isCollapsibleGroup = isTopLevel && numHeaderLevels > 1;
                    const isFirstInGroup = group.children[0] === col;

                    if (isTopLevel) {
                        return (
                            <div
                                key={levelIndex}
                                className={`flex items-center text-[11px] font-semibold text-gray-700 border-b bg-gray-200
                                    ${isCollapsibleGroup ? 'hover:bg-gray-300 cursor-pointer' : ''}
                                `}
                                style={{ height: LEVEL_HEADER_HEIGHT }}
                                onClick={isCollapsibleGroup
                                    ? () => onToggleColCollapse(group.groupKey)
                                    : undefined
                                }
                            >
                                {isFirstInGroup ? (
                                    <div className="flex items-center justify-between w-full px-2">
                                        <span className="truncate text-gray-800">{group.label}</span>
                                        {isCollapsibleGroup && (
                                            <span className="ml-1 text-gray-500 hover:text-blue-600 shrink-0 text-[10px]">◀</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full h-full" />
                                )}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={levelIndex}
                            className={`flex items-center px-2 text-[11px] truncate border-b bg-gray-100 text-gray-700
                                ${isLastLevel ? "font-normal text-gray-600" : "font-semibold"}
                            `}
                            style={{ height: LEVEL_HEADER_HEIGHT }}
                            title={group.label}
                        >
                            {group.label}
                        </div>
                    );
                })}
                <ResizeHandle col={col} />
            </div>
        );
    };

    const renderCell = (columnIndex: number, rowIndex: number, style: React.CSSProperties) => {
        if (columnIndex === 0) {
            const row = filteredRows[rowIndex - 1];
            const isGrandTotal = Boolean(row?._isGrandTotal);

            if (isGrandTotal) {
                return (
                    <div style={style} className="border-r border-b text-center text-[12px] text-gray-700 font-bold flex items-center justify-center select-none bg-gray-100">
                        ∑
                    </div>
                );
            }

            const grandTotalOffset = filteredRows
                .slice(0, rowIndex - 1)
                .filter(r => r?._isGrandTotal)
                .length;

            const isEvenRow = rowIndex % 2 === 0;
            return (
                <div style={style} className={`border-r border-b text-center text-[12px] text-gray-500 flex items-center justify-center select-none ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                    {(page - 1) * pageSize + rowIndex - grandTotalOffset}
                </div>
            );
        }

        const row = filteredRows[rowIndex - 1];
        if (!row) return <div style={style} />;

        const col = finalColumns[columnIndex - 1];
        const cellValue = row[col];
        const isRowKey = pivotRowKeys.includes(col);
        const isSubtotal = Boolean(row._isSubtotal);
        const isCollapsedSummary = col.startsWith('__collapsed__');
        const depth: number = row._depth ?? 0;
        const hasChildren: boolean = Boolean(row._hasChildren);
        const path: string = row._path ?? "";
        const isCollapsed = collapsed.has(path);
        const isNegative = !isNaN(Number(cellValue)) && Number(cellValue) < 0;
        const isEvenRow = rowIndex % 2 === 0;

        if (isCollapsedSummary) {
            return (
                <div
                    style={style}
                    className={`border-r border-b px-2 flex items-center text-[12px] text-gray-700 font-medium bg-gray-100 truncate
                        ${isNegative ? 'text-red-600' : ''}`}
                    title={String(cellValue ?? '')}
                >
                    {cellValue !== undefined && cellValue !== '' ? String(cellValue) : ''}
                </div>
            );
        }

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
            overscanRowCount={3}
            overscanColumnCount={2}
        >
            {({ columnIndex, rowIndex, style }) => {
                if (rowIndex === 0) return renderHeader(columnIndex, style);
                return renderCell(columnIndex, rowIndex, style);
            }}
        </Grid>
    );
}