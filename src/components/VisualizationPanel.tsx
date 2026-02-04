import React from 'react'
import { RootState } from '../store/store'
import { selectColumn} from '../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';

export default function VisualizationPanel ()  {
      const columns = useSelector((s: RootState) => s.data.columns);
      const selected= useSelector((s:RootState)=>s.layout.columns);

        const dispatch = useDispatch();

  return (

        <div
      style={{
        marginTop: 15,
        padding: 10,
        border: " dashed #aaa",
        borderRadius: 6,
        minHeight: 200,
        background: "#fdfdfd"
      }}

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
        <p style={{ fontSize: 16, color: "#666" }}>
            Drag Fields to Display 
        </p>

        <div style={{ marginTop: 10 }}>
        {columns.map(col=>(
            <label key={col}   
              style={{
              display: "flex",
              alignItems: "center", 
              marginBottom: 6,
              cursor: "pointer"
              }}>
            <input
            type="checkbox"
            checked={selected.includes(col)}
            onChange={()=>dispatch(selectColumn(col))}
            />
            {col}
            </label>
        ))}
        </div>
    </div>
  )
}

