import React from 'react'
import { RootState } from '../store/store'
import {  useSelector } from 'react-redux';

export default function DataPanel() {
    const columns = useSelector((s: RootState) => s.data.columns);

    return (

        <div>
            <p style={{ fontSize: 16, color: "#666" }}> Available Fields</p>
            <div style={{ marginTop: 10 }}>
                {columns.map((col) => (
                    <div
                        key={col}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", col);
                        }}
                        style={{
                            padding: "6px 8px",
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            marginBottom: 6,
                            background: "white",
                            cursor: "grab",
                            fontSize: 14
                        }}
                    >
                        {col}
                    </div>
                ))}

            </div>
        </div>
    )
}

//export default DataPanel