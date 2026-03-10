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
    const numHeaderRows = hasGroupedHeaders ? numHeaderLevels : 1;

    const getColumnWidth = (index: number) => {
        if (index === 0) return 48;
        const col = finalColumns[index - 1];
        if (col.startsWith('__collapsed__')) return columnWidths[col] || 120;
        return columnWidths[col] || 140;
    };

    const getRowHeight = (index: number) => {
        if (index < numHeaderRows) return hasGroupedHeaders ? LEVEL_HEADER_HEIGHT : SINGLE_HEADER_HEIGHT;
        return ROW_HEIGHT;
    };

    const onResize = useCallback((e: MouseEvent) => {
        if (!resizingCol.current) return;
        const dx = e.clientX - startX.current;
        startX.current = e.clientX;
        onColumnResize(resizingCol.current, dx);
        const colIndex = finalColumns.indexOf(resizingCol.current) + 1;
        gridRef.current?.resetAfterColumnIndex(colIndex, false);
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

    // levelIndex = which header row (0 = top level, 1 = second level, etc.)
    const renderHeader = (columnIndex: number, levelIndex: number, style: React.CSSProperties) => {
        // # column

        if (columnIndex === 0) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 font-semibold flex items-center justify-center text-xs text-gray-600 select-none">
                    {levelIndex === 0 ? '#' : ''}
                </div>
            );
        }

        const col = finalColumns[columnIndex - 1];
        const isRowKey = pivotRowKeys.includes(col);
        const isCollapsedSummary = col.startsWith('__collapsed__');
        const isTotal = col === 'Total';
        const isLastLevel = levelIndex === numHeaderRows - 1;

        // Row key column — show name only on first level row
        if (isRowKey) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 relative flex items-center px-2 font-semibold text-[12px] text-gray-700">
                    {levelIndex === 0 ? col : ''}
                    {isLastLevel && <ResizeHandle col={col} />}
                </div>
            );
        }

        // Total column — show "Total" only on last level row
        if (isTotal) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 relative flex items-center justify-center px-2 text-[11px] font-bold text-gray-700">
                    {isLastLevel ? 'Total' : ''}
                    {isLastLevel && <ResizeHandle col={col} />}
                </div>
            );
        }

        // Collapsed summary column — show label + ▶ only on first level row
        if (isCollapsedSummary) {
            const groupKey = col.replace('__collapsed__', '');
            // depth of this collapsed node = number of " | " separators in groupKey
            const collapsedNodeDepth = groupKey.split(' | ').length - 1;

            // Only render as collapsed summary at its own level and below
            // At levels ABOVE it, let it fall through to group lookup
            if (levelIndex < collapsedNodeDepth) {
                // Fall through to group lookup — this col belongs to a parent group
                // Don't return early, let it render as part of parent group
            } else {
                // At its own level or deeper — render as collapsed summary
                const displayLabel = groupKey.split(' | ').pop() ?? groupKey;
                return (
                    <div
                        style={style}
                        className={`border-b border-r relative flex items-center justify-between px-2 text-[11px] font-semibold text-gray-700
                    ${levelIndex === collapsedNodeDepth ? 'bg-gray-200 cursor-pointer hover:bg-gray-300' : 'bg-gray-100'}
                `}
                        onClick={levelIndex === collapsedNodeDepth ? () => onToggleColCollapse(groupKey) : undefined}
                    >
                        {levelIndex === collapsedNodeDepth ? (
                            <>
                                <span className="truncate">{displayLabel}</span>
                                <span className="ml-1 text-blue-600 shrink-0">▶</span>
                            </>
                        ) : (
                            <span className="text-gray-300 text-[10px]">···</span>
                        )}
                        <ResizeHandle col={col} stopProp />
                    </div>
                );
            }
        }

        // Flat (no grouped headers)
        if (!hasGroupedHeaders) {
            return (
                <div style={style} className="border-b border-r bg-gray-100 hover:bg-gray-200 font-semibold px-2 relative flex items-center text-[12px] text-gray-700">
                    <span className="truncate">{col}</span>
                    <ResizeHandle col={col} />
                </div>
            );
        }

        // Multi-level grouped header
        const levelHeaders = colHeaders[levelIndex];
        if (!levelHeaders) {
            return <div style={style} className="border-b border-r bg-gray-100" />;
        }

        const group = levelHeaders.find(g => {
            if (g.children.includes(col)) return true;
            if (col.startsWith('__collapsed__')) {
                const colPath = col.replace('__collapsed__', '');
                return g.children.some(c =>
                    c === col ||
                    c.startsWith(colPath) ||
                    c.replace('__collapsed__', '').startsWith(colPath)
                );
            }
            return false;
        });

        if (!group) {
            return <div style={style} className="border-b border-r bg-gray-50" />;
        }

        const isCollapsible = !isLastLevel;
        const isFirstInGroup =
            group.children[0] === col ||
            (col.startsWith('__collapsed__') &&
                group.children[0]?.startsWith(col.replace('__collapsed__', ''))
            );
        //const levelHeaders = colHeaders[levelIndex];
        console.log('levelIndex', levelIndex, 'levelHeaders groups:', levelHeaders?.map(g => g.groupKey));
        return (
            <div
                style={style}
                className={`border-b border-r relative flex items-center text-[11px] font-semibold text-gray-700
            ${levelIndex === 0 ? 'bg-gray-200' : 'bg-gray-100'}
        `}
            >
                {isFirstInGroup ? (
                    <div
                        className={`flex items-center justify-between w-full h-full px-2
                    ${isCollapsible ? 'cursor-pointer hover:bg-gray-300' : ''}
                `}
                        onClick={isCollapsible ? () => onToggleColCollapse(group.groupKey) : undefined}
                    >
                        <span className={`truncate ${isLastLevel ? 'font-normal text-gray-600' : 'text-gray-800'}`}>
                            {group.label}
                        </span>
                        {isCollapsible && (
                            <span className="ml-1 text-gray-500 shrink-0 text-[10px]">◀</span>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full" />  // ← no onClick here
                )}
                {isLastLevel && <ResizeHandle col={col} />}
            </div>
        );
    };

    const renderCell = (columnIndex: number, rowIndex: number, style: React.CSSProperties) => {
        // # column
        if (columnIndex === 0) {
            const row = filteredRows[rowIndex];
            const isGrandTotal = Boolean(row?._isGrandTotal);
            if (isGrandTotal) {
                return (
                    <div style={style} className="border-r border-b text-center text-[12px] font-bold flex items-center justify-center select-none bg-gray-100">
                        ∑
                    </div>
                );
            }
            const isEvenRow = rowIndex % 2 === 0;
            return (
                <div style={style} className={`border-r border-b text-center text-[12px] text-gray-500 flex items-center justify-center select-none ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                    {(page - 1) * pageSize + rowIndex + 1}
                </div>
            );
        }

        const row = filteredRows[rowIndex];
        if (!row) return <div style={style} />;

        const col = finalColumns[columnIndex - 1];
        const cellValue = row[col];
        const isRowKey = pivotRowKeys.includes(col);
        const isSubtotal = Boolean(row._isSubtotal);
        const isGrandTotal = Boolean(row._isGrandTotal);
        const isCollapsedSummary = col.startsWith('__collapsed__');
        const depth: number = row._depth ?? 0;
        const hasChildren: boolean = Boolean(row._hasChildren);
        const path: string = row._path ?? "";
        const isCollapsed = collapsed.has(path);
        const isNegative = !isNaN(Number(cellValue)) && Number(cellValue) < 0;
        const isEvenRow = rowIndex % 2 === 0;
        const subtotalBg = "bg-gray-100 font-semibold";
        const normalBg = isEvenRow ? 'bg-white' : 'bg-gray-50';
        const rowBg = (isSubtotal || isGrandTotal) ? subtotalBg : normalBg;

        // Collapsed summary data cell — just show the summed value
        if (isCollapsedSummary) {
            return (
                <div
                    style={style}
                    className={`border-r border-b px-2 flex items-center text-[12px] truncate
                        ${rowBg}
                        ${isNegative ? 'text-red-600 font-medium' : 'text-gray-800'}`}
                    title={String(cellValue ?? '')}
                >
                    {cellValue !== undefined && cellValue !== '' ? String(cellValue) : ''}
                </div>
            );
        }

        if (isSubtotal || isGrandTotal) {
            return (
                <div
                    style={style}
                    className={`border-r border-b px-2 flex items-center text-[12px] truncate ${subtotalBg}
                        ${isNegative ? 'text-red-600' : 'text-gray-800'}`}
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
                    className={`border-r border-b px-1 flex items-center truncate text-[12px] text-gray-800 hover:bg-gray-100 ${normalBg}`}
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
                    ${normalBg}
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
            rowCount={filteredRows.length + numHeaderRows}
            columnWidth={getColumnWidth}
            rowHeight={getRowHeight}
            width={dimensions.width}
            height={Math.max(200, dimensions.height)}
            overscanRowCount={5}
            overscanColumnCount={2}
        >
            {({ columnIndex, rowIndex, style }) => {
                if (rowIndex < numHeaderRows) return renderHeader(columnIndex, rowIndex, style);
                const dataRowIndex = rowIndex - numHeaderRows;
                return renderCell(columnIndex, dataRowIndex, style);
            }}
        </Grid>
    );
}