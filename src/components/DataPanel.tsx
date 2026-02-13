import React from 'react'
import { RootState } from '../store/store'
import {  useSelector,useDispatch } from 'react-redux';
import { selectColumn } from '../store/layoutSlice'

export default function DataPanel() {
    const columns = useSelector((s: RootState) => s.data.columns);
    const selected=useSelector((s:RootState)=>s.layout.columns)
    const dispatch=useDispatch();

    return (

        <div className='overflow-auto scrollbar-hidden'>
            <input placeholder="Search field..." className="w-full mb-3 px-2 py-1 border rounded text-sm"/>
                {columns.map((col) => (
                    <div key={col} draggable 
                    onDragStart={(e) => {e.dataTransfer.setData("text/plain", col);}}
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