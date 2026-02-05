import React from 'react'
import { RootState } from '../store/store'
import { selectColumn } from '../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import { Root } from 'react-dom/client';

export default function VisualizationPanel() {
  const columns = useSelector((s: RootState) => s.data.columns);
  const selected = useSelector((s: RootState) => s.layout.columns);
  const version=useSelector((s:RootState)=> s.layout.version)

  const dispatch = useDispatch();

  return (
    <div className='space-y-3'>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">

        {["📊", "📈", "🥧", "📉", "📋"].map((i, idx) => (
          <div
            key={idx}
            className="border rounded p-2 cursor-pointer hover:bg-gray-200"
          >
            {i}
          </div>
        ))}

      </div>
      <div className="border-2 border-dashed border-gray-400 rounded p-2 min-h-[120px] bg-white"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const col = e.dataTransfer.getData("text/plain");
          if (col) {
            dispatch(selectColumn(col));
          }
        }}
      >
        <p className='text-sm font-medium mb-1'>
          Fields
        </p>

        <div style={{ marginTop: 10 }}>
          {columns.map(col => (
            <label key={'${version}-${col}'}
              className='flex items-center gap-2 text-sm mb-1'>
              <input
                type="checkbox"
                checked={selected.includes(col)}
                onChange={() => dispatch(selectColumn(col))}
              />
              {col}
            </label>
          ))}
        </div>
      </div>
    </div>

  )
}

