import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { selectColumn, resetColumnsFromAll, reorderColumns, setChart, clearRangeFilter, setRangeColumn, clearTopN, setPivot } from '../../store/layoutSlice';

export default function FieldsPanel() {
    const dispatch = useDispatch()
    const selected = useSelector((s: RootState) => s.layout.columns)//selecting the selected columns
    const allcol = useSelector((s: RootState) => s.data.columns)//selecting the original columns from the data redux
    const chart = useSelector((s: RootState) => s.layout.chart); // add this selector
    const pivot = useSelector((s: RootState) => s.layout.pivot)
    const rangeCol = useSelector((s: RootState) => s.layout.rangeCol);
    const topN = useSelector((s: RootState) => s.layout.topN);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);// allows dragging and orderchange of columns

    return (
        <div className='space-y-2'>
            {/*Drag drop place for columns will dispatch selectcolumn where that column is added into the selected columns */}
            <div className="border border-gray-300 rounded-md p-3 min-h-[120px] bg-gray-50"
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const col = e.dataTransfer.getData("text/plain");
                    if (col) {
                        dispatch(selectColumn(col));
                    }
                }}>



                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Fields
                    </p>
                    {selected.length > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                                onClick={() => {
                                    dispatch(resetColumnsFromAll(allcol))
                                }}>
                                Reset
                            </button>
                            <button
                                onClick={() => {
                                    selected.forEach(col => dispatch(selectColumn(col)));
                                }}
                                className="text-[10px] text-red-600 hover:text-red-700 font-medium"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>


                <div className="space-y-1">
                    {selected.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                            No fields selected
                        </p>
                    ) : (
                        selected.map((col, index) => (
                            <label
                                key={col}
                                draggable
                                onDragStart={() => setDraggedIndex(index)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    if (draggedIndex == null) return;
                                    dispatch(reorderColumns({
                                        from: draggedIndex,
                                        to: index,
                                    }))
                                    setDraggedIndex(null);
                                }}
                                className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-200 px-2 py-1.5 rounded cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={true}
                                    onChange={() => {
                                        // If this col is used in chart, clear it from chart axes
                                        if (chart.x === col) dispatch(setChart({ x: '' }));
                                        if (chart.y === col) dispatch(setChart({ y: '' }));

                                        // Clear pivot fields if they used this column
                                        if (pivot.row === col) dispatch(setPivot({ row: '' }));
                                        if (pivot.column === col) dispatch(setPivot({ column: '' }));
                                        if (pivot.value.includes(col)) dispatch(setPivot({ value: pivot.value.filter(v => v !== col) }));
                                        
                                        if (rangeCol === col) {
                                            dispatch(clearRangeFilter(col));
                                            dispatch(setRangeColumn(''));
                                        }
                                        if (topN.column === col) {
                                            dispatch(clearTopN());
                                        }
                                        dispatch(selectColumn(col));
                                    }}
                                    className="cursor-pointer"
                                />
                                {/* ADD: Field type icon */}
                                <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                <span className="flex-1">{col}</span>
                            </label>
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}

