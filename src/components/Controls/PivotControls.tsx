import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setPivot } from "../../store/layoutSlice";
import { clearPivot } from "../../store/layoutSlice";
import { Aggregation } from "../../store/layoutSlice";

export default function PivotControls() {
  const dispatch = useDispatch();
  const selected = useSelector((s: RootState) => s.layout.columns);
  const pivot = useSelector((s: RootState) => s.layout.pivot);
  const allcol = useSelector((s: RootState) => s.data.columns)

  const columns = useMemo(() => {
    if (!selected.length) return [];
    return allcol.filter(c => selected.includes(c));
  }, [selected, allcol]);

  const row = columns.includes(pivot.row) ? pivot.row : '';
  const column = columns.includes(pivot.column) ? pivot.column : '';

  return (
    <div className="bg-gray-50 border rounded p-3 text-sm space-y-2">
      <h3 className="font-semibold text-gray-700">
        📊 Pivot Settings
      </h3>

      {/* ROW */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Rows
        </label>
        <select
          value={row}
          onChange={(e) => dispatch(setPivot({ ...pivot, row: e.target.value }))}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select</option>
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* COLUMN */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Columns
        </label>
        <select
          value={column}
          onChange={(e) => dispatch(setPivot({ ...pivot, column: e.target.value }))}
          className="w-full border rounded px-2 py-1">
          <option value="">Select</option>
          {columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* VALUE */}
      <div className="flex flex-wrap gap-1">
        {columns.map(c => (
          <button key={c}
            onClick={() => {
              const current = pivot.value
              const next = current.includes(c)
                ? current.filter(v => v !== c)
                : [...current, c];
              dispatch(setPivot({ value: next }));
            }}
            className={`text-[10px] px-2 py-1 rounded border
                ${(pivot.value as string[]).includes(c)
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* AGG */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Aggregation
        </label>
        <select
          value={pivot.agg}
          onChange={(e) => dispatch(setPivot({ ...pivot, agg: e.target.value as Aggregation }))}
          className="w-full border rounded px-2 py-1"
        >
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
          <option value="count">Count</option>
        </select>
      </div>

      <button
        onClick={() => dispatch(clearPivot())}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded text-sm mt-2"
      >
        Close Pivot
      </button>

    </div>
  );
}