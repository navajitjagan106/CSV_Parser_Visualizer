import React from 'react'
import { RootState } from '../store/store'
import {  useSelector } from 'react-redux';

export default function DataPanel() {
    const columns = useSelector((s: RootState) => s.data.columns);

    return (

        <div>
            <input placeholder="Search field..." className="w-full mb-3 px-2 py-1 border rounded text-sm"/>
                {columns.map((col) => (
                    <div key={col} draggable 
                    onDragStart={(e) => {e.dataTransfer.setData("text/plain", col);}}
                    className='flex items-center gap-2 px-2  py-1 mb-1 text-sm cursor-pointer hover:bg-gray-200 rounded'
                    >
                     📄 {col}
                    </div>
                ))}

            </div>
        
    )
}