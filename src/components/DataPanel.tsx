import { RootState } from '../store/store'
import { useSelector, useDispatch } from 'react-redux';
import { selectColumn, selectAllColumns } from '../store/layoutSlice'

export default function DataPanel() {
    const columns = useSelector((s: RootState) => s.data.columns);
    const selected = useSelector((s: RootState) => s.layout.columns)
    const dispatch = useDispatch();

    const allSelected =
        columns.length > 0 &&
        selected.length === columns.length;


    return (

        <div className='overflow-auto scrollbar-hidden'>
            <input placeholder="Search field..." className="w-[50%] mb-3 px-2 py-1 border rounded text-sm" />
            <button
                onClick={() => {
                    dispatch(
                        selectAllColumns(allSelected ? [] : columns)
                    );
                }}
                className="ml-2 text-xs px-2 py-1 rounded border hover:bg-gray-100"
            > {allSelected ? "Clear" : "Select All"}</button>
            {columns.map((col) => (
                <div key={col} draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/plain", col); }}
                    className='flex items-center gap-2 px-2  py-1 mb-1 text-sm cursor-pointer hover:bg-gray-200 rounded'
                >
                    <input
                        type="checkbox"
                        checked={selected.includes(col)}
                        onChange={() => dispatch(selectColumn(col))}
                        className="cursor-pointer"
                    />

                    <span className="text-gray-400">📊</span>
                    <span className="flex-1">{col}</span>
                </div>
            ))}
        </div>
    )
}