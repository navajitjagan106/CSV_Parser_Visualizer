import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/store";
import { setPivot,setChart } from "../store/layoutSlice";
import { clearPivot } from "../store/layoutSlice";

export default function PivotControls() {
  const dispatch = useDispatch();

  const columns = useSelector((s: RootState) => s.data.columns);
  const pivot = useSelector((s: RootState) => s.layout.pivot);

  const [row, setRow] = useState(pivot.row);
  const [column, setColumn] = useState(pivot.column);
  const [value, setValue] = useState(pivot.value);
  const [agg, setAgg] = useState(pivot.agg);

  const applyPivot = () => {
    if (!row || !column || !value) {
      alert("Please select Row, Column and Value");
      return;
    }

    dispatch(
      setPivot({
        enabled: true,
        row,
        column,
        value,
        agg,
      })
    );
  };

 


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
          onChange={(e) => setRow(e.target.value)}
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
          onChange={(e) => setColumn(e.target.value)}
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

      {/* VALUE */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Values
        </label>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
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

      {/* AGG */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Aggregation
        </label>
        <select
          value={agg}
          onChange={(e) => setAgg(e.target.value as any)}
          className="w-full border rounded px-2 py-1"
        >
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
        </select>
      </div>

      {/* APPLY */}
      <button
        onClick={applyPivot}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded text-sm"
      >
        Apply Pivot
      </button>
      <button
  onClick={() => dispatch(clearPivot())}
  className="w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded text-sm mt-2"
>
  Close Pivot
</button>

    </div>
  );
}
