import React, { useEffect, useMemo, useState } from 'react'
import { RootState } from '../store/store'
import { selectColumn } from '../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import { groupData } from "../utils/groupData";
import { setChart, clearChart } from "../store/layoutSlice";
import type { Aggregation } from "../store/layoutSlice";

export default function VisualizationPanel() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.layout.columns);
  const version = useSelector((s: RootState) => s.layout.version)
  const data = useSelector((s: RootState) => s.data.rows);
  const chart = useSelector((s: RootState) => s.layout.chart);

const chartData = useMemo(() => {
  if (!chart.x || !chart.y) return [];

  return groupData(
    data,
    chart.x,
    chart.y,
    chart.agg ?? "sum"
  );
}, [data, chart.x, chart.y, chart.agg]);





  return (
    <div className='space-y-3'>
      <div className="grid grid-cols-5 gap-2 text-center text-xs">

        {[
          { icon: "📊", type: "bar" },
          { icon: "📈", type: "line" },
          { icon: "🥧", type: "pie" },
        ].map((i) => (
          <div
            key={i.type}
            className={`flex items-center justify-center gap-1 border rounded-md px-3 py-2 cursor-pointer text-sm
            ${chart.type === i.type
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white hover:bg-gray-100"}
`}
            onClick={() => dispatch(setChart({ type: i.type, }))}
          >
            {i.icon}
          </div>
        ))}

      </div>
      <select
  className="w-full border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
 value={chart.agg }
  onChange={(e) =>{
    const value = e.target.value as Aggregation;
dispatch(
  setChart({
    agg: value,
    enabled: Boolean(chart.x && chart.y),
  })
    )  }}
>
  <option value="sum">Sum</option>
  <option value="avg">Average</option>
  <option value="min">Minimum</option>
  <option value="max">Maximum</option>
</select>


      {/* Axis Selection */}
      {chart.type && (
        <div className="space-y-2 text-sm">

          <select
            className="w-full border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={chart.x}
            onChange={(e) => dispatch(setChart({ x: e.target.value, enabled: Boolean(e.target.value && chart.y), }))
            }
          >
            <option value="">Select X Axis</option>

            {selected.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="w-full border rounded p-1"
            value={chart.y}
            onChange={(e) => dispatch(setChart({ y: e.target.value, enabled: Boolean(chart.x && e.target.value), }))
            }
          >
            <option value="">Select Y Axis</option>

            {selected.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => dispatch(clearChart())}
            className="w-full rounded-md bg-red-500 text-white text-sm py-1.5 hover:bg-red-600"
          >
            Remove Chart
          </button>

        </div>)}



      <div className="border border-dashed border-gray-300 rounded-md p-2 min-h-[120px] bg-white"
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
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
          Fields
        </p>


        <div style={{ marginTop: 10 }}>
          {selected.map(col => (
            <label key={`${version}-${col}`}
              className="flex items-center gap-2 text-xs text-gray-700 mb-1 hover:bg-gray-100 px-1 py-0.5 rounded">
              <input
                type="checkbox"
                checked={true}
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

