import { useEffect, useMemo, useState } from 'react'
import { setTopN, clearTopN, clearRangeFilter, setRangeFilter, setRangeColumn, clearMultiSelectFilter, setMultiSelectFilter, clearAllMultiSelectFilter, setNullFilter, clearNullFilter } from '../../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function FilterControls() {
    const [showFilters, setShowFilters] = useState(false);//filter enable and disable
    const [activeMultiCol, setActiveMultiCol] = useState('');
    const [activeNullCol, setActiveNullCol] = useState('');
    const [multiSearch, setMultiSearch] = useState('');
    const selected = useSelector((s: RootState) => s.layout.columns)//selecting the selected columns
    const allcol = useSelector((s: RootState) => s.data.columns)//selecting the original columns from the data redux
    const topN = useSelector((s: RootState) => s.layout.topN);
    const filtersRange = useSelector((s: RootState) => s.layout.filtersRange);
    const rangeCol = useSelector((s: RootState) => s.layout.rangeCol);
    const multiSelectFilters = useSelector((s: RootState) => s.layout.multiSelectFilters);
    const nullFilters = useSelector((s: RootState) => s.layout.nullFilters);
    const rows = useSelector((s: RootState) => s.data.rows);

    const dispatch = useDispatch()


    //preserve original order while selecting fields
    const columns = useMemo(() => {
        if (!selected.length) return [];
        return allcol.filter(c => selected.includes(c));
    }, [selected, allcol]);


    const uniqueValues = useMemo(() => {
        if (!activeMultiCol) return [];
        const vals = rows.map(r => String(r[activeMultiCol] ?? ''));
        return Array.from(new Set(vals)).sort();
    }, [activeMultiCol, rows]);

    const filteredValues = useMemo(() =>
        uniqueValues.filter(v =>
            v.toLowerCase().includes(multiSearch.toLowerCase())
        ),
        [uniqueValues, multiSearch]);

    const currentSelected = multiSelectFilters?.[activeMultiCol] || [];

    const toggleValue = (val: string) => {
        const next = currentSelected.includes(val)
            ? currentSelected.filter(v => v !== val)
            : [...currentSelected, val];

        if (next.length === 0) dispatch(clearMultiSelectFilter(activeMultiCol));
        else dispatch(setMultiSelectFilter({ column: activeMultiCol, values: next }));
    };

    const toggleAll = () => {
        if (currentSelected.length === uniqueValues.length)
            dispatch(clearMultiSelectFilter(activeMultiCol));
        else
            dispatch(setMultiSelectFilter({ column: activeMultiCol, values: uniqueValues }));
    };
    useEffect(() => {
        if (activeMultiCol && !selected.includes(activeMultiCol)) {
            setActiveMultiCol('');
            setMultiSearch('');
        }
    }, [selected, activeMultiCol]);

    useEffect(() => {
        if (activeNullCol && !selected.includes(activeNullCol)) {
            setActiveNullCol('');
        }
    }, [selected, activeNullCol]);

    return (
        <div className='space-y-2'>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
                Filters
            </p>
            <button
                onClick={() => {
                    if (showFilters) {
                        if (rangeCol) {
                            dispatch(clearRangeFilter(rangeCol));
                            dispatch(setRangeColumn(''));
                        }
                        if (topN.enabled) {
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
                            value={columns.includes(rangeCol) ? rangeCol : ''}
                            onChange={(e) => {
                                const col = e.target.value;

                                dispatch(setRangeColumn(col));


                            }}>
                            <option value="">Select Numeric Field</option>
                            {columns.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        {filtersRange?.[rangeCol] && (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="w-1/2 border rounded px-2 py-1 text-xs"
                                        value={filtersRange?.[rangeCol]?.min || 0}
                                        onChange={(e) =>
                                            dispatch(
                                                setRangeFilter({
                                                    column: rangeCol,
                                                    min: Number(e.target.value),
                                                    max: filtersRange?.[rangeCol]?.max || 0,
                                                })
                                            )
                                        }
                                    />

                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="w-1/2 border rounded px-2 py-1 text-xs"
                                        value={filtersRange?.[rangeCol]?.max || 0}
                                        onChange={(e) =>
                                            dispatch(
                                                setRangeFilter({
                                                    column: rangeCol,
                                                    min: filtersRange?.[rangeCol]?.min || 0,
                                                    max: Number(e.target.value),
                                                })
                                            )
                                        }
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        if (rangeCol) {
                                            dispatch(clearRangeFilter(rangeCol));
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

                            {topN.enabled && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    Active
                                </span>
                            )}
                        </div>

                        {/* Row 1: Top / Bottom + Metric */}
                        <div className="flex gap-2">
                            <select
                                value={columns.includes(topN.column) ? topN.column : ''}
                                onChange={(e) =>
                                    dispatch(setTopN({ order: e.target.value }))
                                }
                                className="flex-1 border rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                            </select>

                            <select
                                value={topN.column}
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
                                value={topN.count}
                                onChange={(e) =>
                                    dispatch(setTopN({ count: Number(e.target.value) }))
                                }
                                className="w-20 border rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="text-xs text-gray-500">rows</span>
                        </div>

                        {/* Clear */}
                        {topN.enabled && (
                            <button
                                onClick={() => dispatch(clearTopN())}
                                className="w-full text-xs bg-red-50 text-red-600 py-1.5 rounded-md hover:bg-red-100 transition"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>


                    {/* ── Multi-Select Filter ── */}
                    <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase">Multi-Select</p>
                        {/* Column tabs instead of dropdown */}
                        <div className="flex flex-wrap gap-1">
                            {columns.map(c => (
                                <button key={c}
                                    onClick={() => {
                                        if (activeMultiCol === c) {
                                            setActiveMultiCol('');
                                        } else {
                                            setActiveMultiCol(c);
                                            setMultiSearch('');
                                        }
                                    }}
                                    className={`text-[10px] px-2 py-1 rounded border transition
                                            ${activeMultiCol === c
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : multiSelectFilters?.[c]?.length
                                                ? 'bg-blue-50 text-blue-600 border-blue-200'  // has active filter
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {c}
                                    {multiSelectFilters?.[c]?.length
                                        ? ` (${multiSelectFilters[c].length})`
                                        : ''
                                    }
                                </button>
                            ))}
                        </div>

                        {activeMultiCol && (
                            <div className="border rounded-lg bg-white">
                                {/* Search */}
                                <div className="p-2 border-b">
                                    <input type="text" placeholder="Search values..."
                                        value={multiSearch}
                                        onChange={e => setMultiSearch(e.target.value)}
                                        className="w-full border rounded text-xs px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                    />
                                </div>

                                {/* Select all */}
                                <div className="px-2 py-1.5 border-b flex items-center gap-2">
                                    <input type="checkbox"
                                        checked={currentSelected.length === uniqueValues.length && uniqueValues.length > 0}
                                        onChange={toggleAll}
                                        className="cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-500">Select All ({uniqueValues.length})</span>
                                </div>

                                {/* Values list */}
                                <div className="max-h-40 overflow-y-auto">
                                    {filteredValues.map(val => (
                                        <label key={val} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer">
                                            <input type="checkbox"
                                                checked={currentSelected.includes(val)}
                                                onChange={() => toggleValue(val)}
                                                className="cursor-pointer"
                                            />
                                            <span className="text-xs truncate">{val || '(empty)'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Active selections shown as tags grouped by column ── */}
                        {Object.entries(multiSelectFilters || {}).filter(([col]) => selected.includes(col)).map(([col, vals]) =>
                            vals.length > 0 && (
                                <div key={col} className="space-y-1">
                                    {/* Column label with clear-all for that column */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-gray-500 uppercase">{col}</span>
                                        <button onClick={() => dispatch(clearMultiSelectFilter(col))}
                                            className="text-[10px] text-red-400 hover:text-red-600">
                                            Clear all
                                        </button>
                                    </div>

                                    {/* Individual value tags */}
                                    <div className="flex flex-wrap gap-1">
                                        {vals.map(val => (
                                            <span key={val}
                                                className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">
                                                {val}
                                                <button
                                                    onClick={() => {
                                                        const next = vals.filter(v => v !== val);
                                                        if (next.length === 0) dispatch(clearMultiSelectFilter(col));
                                                        else dispatch(setMultiSelectFilter({ column: col, values: next }));
                                                    }}
                                                    className="hover:text-red-500 font-bold"
                                                >✕</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}

                        {/* Clear everything */}
                        {Object.keys(multiSelectFilters || {}).length > 0 && (
                            <button onClick={() => dispatch(clearAllMultiSelectFilter())}
                                className="w-full text-xs bg-red-50 text-red-600 py-1.5 rounded-md hover:bg-red-100">
                                Clear All Filters
                            </button>
                        )}
                    </div>


                    {/* Null Filter */}
                    <div className='border rounded-lg p-3 bg-gray-50 space-y-3'>
                        <div className='flex items-center justify-between '>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Null / Empty Filter</p>
                            {Object.keys(nullFilters || {}).length > 0 && (
                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {Object.keys(nullFilters).length} active
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {columns.map(c => (
                                <button key={c}
                                    onClick={() => setActiveNullCol(activeNullCol === c ? '' : c)}
                                    className={`text-[10px] px-2 py-1 rounded border transition
                                    ${activeNullCol === c
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : nullFilters?.[c]
                                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {activeNullCol && (
                            <div className="border rounded-lg bg-white p-2 space-y-2">
                                <p className="text-xs text-gray-500">
                                    Filter empty cells in <span className="font-semibold text-gray-700">{activeNullCol}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => dispatch(setNullFilter({ column: activeNullCol, mode: 'show' }))}
                                        className={`flex-1 text-xs py-1.5 rounded border transition
            ${nullFilters?.[activeNullCol] === 'show'
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        Show only empty
                                    </button>
                                    <button
                                        onClick={() => dispatch(setNullFilter({ column: activeNullCol, mode: 'hide' }))}
                                        className={`flex-1 text-xs py-1.5 rounded border transition
            ${nullFilters?.[activeNullCol] === 'hide'
                                                ? 'bg-blue-500 text-white border-blue-500'
                                                : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        Hide empty
                                    </button>
                                </div>

                                {nullFilters?.[activeNullCol] && (
                                    <button
                                        onClick={() => dispatch(clearNullFilter(activeNullCol))}
                                        className="w-full text-xs text-red-500 hover:underline"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Active badges */}
                        {Object.entries(nullFilters || {}).filter(([col]) => selected.includes(col)).map(([col, mode]) => (
                            <div key={col} className="flex items-center justify-between bg-blue-50 rounded px-2 py-1.5 text-xs">
                                <span className="text-blue-700 font-medium">{col}:</span>
                                <span className="text-gray-600 mx-1">{mode === 'show' ? 'showing empty' : 'hiding empty'}</span>
                                <button onClick={() => dispatch(clearNullFilter(col))}
                                    className="text-red-400 hover:text-red-600 font-bold">✕</button>
                            </div>
                        ))}
                    </div>

                </>
            )}

        </div>
    )
}

