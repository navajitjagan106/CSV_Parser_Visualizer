import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { clearColumn } from '../../store/layoutSlice';
type Props = {
    onSortAsc: () => void;
    onSortDesc: () => void;
    onExportCSV: () => void;
    onExportJSON: () => void;
    filterText: string;
    onFilterChange: (val: string) => void;
    hasActiveFilters: boolean;
    onClearAll: () => void;
    columns: string[];
    sortCol: string;
    onSortColChange: (col: string) => void;
};
export default function TableToolbar({
    onSortAsc, onSortDesc,
    onExportCSV, onExportJSON,
    filterText, onFilterChange,
    hasActiveFilters, onClearAll,
    columns,sortCol,onSortColChange
}: Props) {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showFilterInput, setShowFilterInput] = useState(false);
    const dispatch=useDispatch()
    return (
        <div className='relative'>
            {/* TOOLBAR */}
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50 sticky top-0 z-10">
                <select
                    value={sortCol}
                    onChange={(e) => onSortColChange(e.target.value)}
                    className="border w-20 rounded text-xs px-2 py-1 focus:ring-2 focus:ring-blue-400 "
                >
                    <option value="">Sort by...</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button title="Sort Ascending" className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    onClick={ onSortAsc}>
                    ⬆️
                </button>
                <button title="Sort Descending" className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    onClick={onSortDesc}>
                    ⬇️
                </button>
                <div className="border-l h-5 mx-1"></div>
                <button title="Refresh" className="p-1.5 hover:bg-gray-200 rounded text-sm" onClick={() => dispatch(clearColumn())}>
                    🔄
                </button>
                <button title="Export" className="p-1.5 hover:bg-gray-200 rounded text-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                    📥
                </button>
                {showExportMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border shadow-lg rounded z-20">
                        <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                        >
                            Export as CSV
                        </button>
                        <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => { onExportJSON(); setShowExportMenu(false); }}
                        >
                            Export as JSON
                        </button>
                    </div>
                )}
                <button title="Filter" className="p-1.5 hover:bg-gray-200 rounded text-sm"
                    onClick={() => {
                        if (showFilterInput) onFilterChange('');
                        setShowFilterInput(!showFilterInput);
                    }}>
                    🔍
                </button>
                {showFilterInput && (
                    <input
                        type="text"
                        placeholder="Filter rows..."
                        value={filterText}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                )}


                {hasActiveFilters && (
                    <button className="ml-auto text-xs text-red-600 hover:text-red-700" onClick={onClearAll}>
                        Clear All
                    </button>
                )}
            </div>
        </div>
    )
}