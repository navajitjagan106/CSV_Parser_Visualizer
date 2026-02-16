import { RootState } from '../store/store'
import { selectColumn, reorderColumns, resetColumnsFromAll, togglePivot, setTopN, clearTopN, clearRangeFilter, setRangeFilter, setRangeColumn } from '../store/layoutSlice'
import { useDispatch, useSelector } from 'react-redux';
import PivotControls from "./PivotControls";
import { setChart, clearChart } from "../store/layoutSlice";
import type { Aggregation } from "../store/layoutSlice";
import { useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
} from "react-icons/fi";

import { LuChartScatter } from "react-icons/lu";

type ChartItem = {
  icon: any,
  type: string;
  label: string;
};

export default function VisualizationPanel() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.layout.columns)
  const version = useSelector((s: RootState) => s.layout.version)
  const chart = useSelector((s: RootState) => s.layout.chart)
  const pivot = useSelector((s: RootState) => s.layout.pivot);
  const allcol = useSelector((s: RootState) => s.data.columns)
  const layout = useSelector((s: RootState) => s.layout)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);


  const chartItems: ChartItem[] = [
    { icon: FiBarChart2, type: "bar", label: "Bar" },
    { icon: FiTrendingUp, type: "line", label: "Line" },
    { icon: FiPieChart, type: "pie", label: "Pie" },
    { icon: FiActivity, type: "area", label: "Area" },
    { icon: LuChartScatter, type: "scatter", label: "Scatter" },
  ];

  const chartEnabled =
    Boolean(chart.type || chart.x || chart.y);

  const columns = useMemo(() => {

    if (!selected.length) return [];
    return allcol.filter(c => selected.includes(c));
  }, [selected, allcol]);


  return (
    <div className='space-y-3 overflow-auto scrollbar-hidden'>
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-sm font-semibold">Build visual</span>
        </div>

      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Charts
      </p>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">


        {chartItems.map((i) => {
          const Icon = i.icon;

          return (
            <div
              key={i.type}
              title={i.label}
              className={`flex items-center justify-center gap-1 border rounded-md px-3 py-2 cursor-pointer text-sm
        ${chart.type === i.type
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white hover:bg-gray-100"
                }`}
              onClick={() => {
                dispatch(
                  setChart({
                    type: i.type as any,
                  })
                );
              }}
            >
              <span className="text-lg">
                <Icon />
              </span>

              <span className="text-[9px] font-medium">{i.label}</span>
            </div>
          );
        })}


      </div>

      {chartEnabled && (
        <div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Aggregation</label>
            <select
              className="w-full border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={chart.agg}
              onChange={(e) => {
                const value = e.target.value as Aggregation;
                dispatch(
                  setChart({
                    agg: value,
                  }),

                )
              }}
            >
              <option value="sum">Σ Sum</option>
              <option value="avg">μ Average</option>
              <option value="min">↓ Minimum</option>
              <option value="max">↑ Maximum</option>
              <option value="count"># Count</option>
              <option value="countDistinct">Unique Count</option>
              <option value="median">Median</option>
              <option value="percent">% of Total</option>

            </select>
          </div>



          {/* Axis Selection */}

          <div className="space-y-2 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">X-Axis (Categories)</label>
              <select
                className="w-full border rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={chart.x}
                onChange={(e) => dispatch(setChart({ x: e.target.value }))
                }
              >
                <option value="">Select X Axis</option>
                {columns.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Y-Axis (Values)</label>

              <select
                className="w-full border rounded p-1"
                value={chart.y}
                onChange={(e) => dispatch(setChart({ y: e.target.value, }))
                }>
                <option value="">Select Y Axis</option>
                {columns.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => dispatch(clearChart())}
              className="w-full rounded-md bg-red-500 text-white text-xs py-1 hover:bg-red-600">
              ✕ Remove
            </button>

          </div>
        </div>
      )}

      <div className="border-t my-4"></div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
        Filters
      </p>
      <button
        onClick={() => setShowFilters(!showFilters)}
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
              }}


            >
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


      <div className="border-t my-4"></div>


      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
        Tables
      </p>
      {/* Separate Pivot Button */}
      <div
        className={`flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm 
           ${pivot.enabled
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white hover:bg-gray-100"}
        `}
        onClick={() => {
          dispatch(togglePivot());
        }}
      >
        📑 Pivot Table
      </div>

      {/* Pivot Controls */}

      {pivot.enabled && <PivotControls />}


      <div className="border-t my-4"></div>


      <div className="border border-gray-300 rounded-md p-3 min-h-[120px] bg-gray-50"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const col = e.dataTransfer.getData("text/plain");
          if (col) {
            dispatch(selectColumn(col));
          }
        }}>



        <div className="flex items-center justify-between mb-2">




          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Fields
          </p>
          {selected.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  dispatch(resetColumnsFromAll(allcol))
                }}>
                Reset
              </button>
              <button
                onClick={() => {
                  selected.forEach(col => dispatch(selectColumn(col)));
                }}
                className="text-[10px] text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            </div>
          )}
        </div>


        <div className="space-y-1">
          {selected.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              No fields selected
            </p>
          ) : (
            selected.map((col, index) => (
              <label
                key={`${version}-${col}`}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIndex == null) return;
                  dispatch(reorderColumns({
                    from: draggedIndex,
                    to: index,
                  }))
                  setDraggedIndex(null);
                }}
                className="flex items-center gap-2 text-xs text-gray-700 hover:bg-gray-200 px-2 py-1.5 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => dispatch(selectColumn(col))}
                  className="cursor-pointer"
                />
                {/* ADD: Field type icon */}
                <span className="text-gray-400 cursor-grab">⋮⋮</span>
                <span className="flex-1">{col}</span>
              </label>
            ))
          )}
        </div>

      </div>

      <div className="border-t my-4"></div>


    </div>

  )
}

