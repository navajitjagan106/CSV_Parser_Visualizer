import React from "react";
import type { Aggregation } from "../store/layoutSlice";

interface Props {
  values: number[];
  active: Aggregation;
  onSelect: (agg: Aggregation) => void;
}

export default function KpiBar({ values, active, onSelect }: Props) {
  const sum = values.reduce((a, b) => a + b, 0);

  const avg = values.length ? sum / values.length : 0;

  const min = Math.min(...values);

  const max = Math.max(...values);

  const stats: Record<Aggregation, number> = {
    sum,
    avg,
    min,
    max,
  };

  return (
    <div className="grid grid-cols-4 gap-2 mb-2">
      {(Object.keys(stats) as Aggregation[]).map((k) => (
        <div
          key={k}
          onClick={() => onSelect(k)}
          className={`
            cursor-pointer rounded-md border px-3 py-2 text-center
            ${
              active === k
                ? "bg-blue-100 border-blue-400"
                : "bg-white hover:bg-gray-50"
            }
          `}
        >
          <p className="text-xs text-gray-500 uppercase">{k}</p>

          <p className="font-semibold text-sm">
            {new Intl.NumberFormat().format(stats[k])}
          </p>
        </div>
      ))}
    </div>
  );
}
