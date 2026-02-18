import React, { useMemo, useState } from 'react'
import { setTopN, clearTopN, clearRangeFilter, setRangeFilter, setRangeColumn } from '../../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function FilterControls() {
    const [showFilters, setShowFilters] = useState(false);//filter enable and disable
    const selected = useSelector((s: RootState) => s.layout.columns)//selecting the selected columns
    const allcol = useSelector((s: RootState) => s.data.columns)//selecting the original columns from the data redux
    const layout = useSelector((s: RootState) => s.layout) //selecting the entire layout to access filter variables
    const dispatch = useDispatch()


    //preserve original order while selecting fields
    const columns = useMemo(() => {
        if (!selected.length) return [];
        return allcol.filter(c => selected.includes(c));
    }, [selected, allcol]);//
    return (
        <div className='space-y-2'>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
                Filters
            </p>
            <button
                onClick={() => {
                    if (showFilters) {
                        if (layout.rangeCol) {
                            dispatch(clearRangeFilter(layout.rangeCol));
                            dispatch(setRangeColumn(''));
                        }
                        if (layout.topN.enabled) {
                            dispatch(clearTopN());
                        }
                    }
                    setShowFilters(!showFilters);
                }}
                className={`w-full flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm 
                   ${showFilters
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white hover:bg-gray-100"}
                `}
            >
                <span>🔍Filter Table</span>
            </button>
            {showFilters && (
                <>
                    {/* Range Filter Block */}
                    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">

                        <p className="text-xs font-semibold text-gray-600 uppercase">
                            Range Filter
                        </p>

                        <select
                            className="w-full border rounded text-xs p-1"
                            value={layout.rangeCol || ""}
                            onChange={(e) => {
                                const col = e.target.value;

                                dispatch(setRangeColumn(col));

                                if (col && !layout.filtersRange?.[col]) {
                                    dispatch(
                                        setRangeFilter({
                                            column: col,
                                            min: 0,
                                            max: 1000,
                                        })
                                    );
                                }
                            }}>
                            <option value="">Select Numeric Field</option>
                            {columns.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {layout.filtersRange?.[layout.rangeCol] && (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-1/2 border rounded px-2 py-1 text-xs"
                                        value={layout.filtersRange?.[layout.rangeCol]?.min || 0}
                                        onChange={(e) =>
                                            dispatch(
                                                setRangeFilter({
                                                    column: layout.rangeCol,
                                                    min: Number(e.target.value),
                                                    max: layout.filtersRange?.[layout.rangeCol]?.max || 0,
                                                })
                                            )
                                        }
                                    />

                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-1/2 border rounded px-2 py-1 text-xs"
                                        value={layout.filtersRange?.[layout.rangeCol]?.max || 0}
                                        onChange={(e) =>
                                            dispatch(
                                                setRangeFilter({
                                                    column: layout.rangeCol,
                                                    min: layout.filtersRange?.[layout.rangeCol]?.min || 0,
                                                    max: Number(e.target.value),
                                                })
                                            )
                                        }
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        if (layout.rangeCol) {
                                            dispatch(clearRangeFilter(layout.rangeCol));
                                            dispatch(setRangeColumn(""));
                                        }
                                    }}

                                    className="w-full text-xs text-red-500 hover:underline"
                                >
                                    Clear Range
                                </button>
                            </>
                        )}
                    </div>

                    {/* Top / Bottom Block */}
                    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Top / Bottom N
                            </p>

                            {layout.topN.enabled && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>

                        {/* Row 1: Top / Bottom + Metric */}
                        <div className="flex gap-2">
                            <select
                                value={layout.topN.order}
                                onChange={(e) =>
                                    dispatch(setTopN({ order: e.target.value }))
                                }
                                className="flex-1 border rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </select>

                            <select
                                value={layout.topN.column}
                                onChange={(e) =>
                                    dispatch(setTopN({ column: e.target.value }))
                                }
                                className="flex-1 border rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">Select Metric</option>
                                {columns.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2: Count */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                value={layout.topN.count}
                                onChange={(e) =>
                                    dispatch(setTopN({ count: Number(e.target.value) }))
                                }
                                className="w-20 border rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="text-xs text-gray-500">rows</span>
                        </div>

                        {/* Clear */}
                        {layout.topN.enabled && (
                            <button
                                onClick={() => dispatch(clearTopN())}
                                className="w-full text-xs bg-red-50 text-red-600 py-1.5 rounded-md hover:bg-red-100 transition"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>

                </>
            )}

        </div>
    )
}

