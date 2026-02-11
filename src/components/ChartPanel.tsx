import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Tooltip,
    XAxis,
    YAxis,
    ResponsiveContainer,
} from "recharts";

interface Props {
    data: any[];
    xKey: string;
    yKey: string;
    type: string;
    agg: "sum" | "avg" | "min" | "max";

}

export default function ChartPanel({ data, xKey, yKey, type, agg }: Props) {

    /* ---------- Helpers ---------- */

    const chartName = useMemo(() => {
        if (type === "bar") return "Bar Chart";
        if (type === "line") return "Line Chart";
        if (type === "pie") return "Pie Chart";
        return "Chart";
    }, [type]);
    const summaryValue = useMemo(() => {
        if (!data.length) return 0;

        const values = data.map((d) => Number(d[yKey]) || 0);

        switch (agg) {
            case "avg":
                return values.reduce((a, b) => a + b, 0) / values.length;

            case "min":
                return Math.min(...values);

            case "max":
                return Math.max(...values);

            case "sum":
            default:
                return values.reduce((a, b) => a + b, 0);
        }
    }, [data, yKey, agg]);


    const formatNumber = (n: number) => {
        return new Intl.NumberFormat().format(n);
    };

    if (!xKey || !yKey) {
        return (
            <p className="text-sm text-gray-500 text-center">
                Select X and Y fields
            </p>
        );
    }


    /* ---------- UI ---------- */

    //  console.log("Rendered data:", data, "Agg:", agg);


    return (
<div className="w-full flex flex-col bg-white rounded-lg shadow-sm border p-2 h-[520px]">


            {/* ===== HEADER ===== */}
            <div className="mb-2 pb-1 border-b flex flex-col gap-0.5">

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-800">
                    {chartName}: {yKey} by {xKey}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500">
                    Showing {agg.toUpperCase()}({yKey}) grouped by {xKey}

                </p>

                {/* Summary */}
                <p className="text-xs text-gray-400 mt-0.5">
                    Categories: {data.length} | Total: {formatNumber(summaryValue)}
                </p>
            </div>

            {/* ===== CHART ===== */}
            <div className="w-full flex-1 overfflow-hidden">


                <ResponsiveContainer
                    width="100%"
                    height="100%">

                    {type === "bar" && (
                        <BarChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 80 }}
>
                            <XAxis
                                dataKey={xKey}
                                angle={-25}
                                textAnchor="end"
                                interval={0}
                                height={90}
                                tickFormatter={(v) =>
                                    String(v).length > 18
                                        ? String(v).slice(0, 18) + "…"
                                        : v
                                }
                            />

                            <YAxis
                                domain={["auto", "auto"]}
                                tickFormatter={(v) =>
                                    new Intl.NumberFormat("en", {
                                        notation: "compact",
                                        compactDisplay: "short",
                                    }).format(v)
                                }
                            />

                            <Tooltip formatter={(v) => formatNumber(Number(v))} />
                            <Bar dataKey={yKey} fill="#3b82f6" />
                        </BarChart>
                    )}

                    {type === "line" && (
                        <LineChart data={data} margin={{ top: 20, right: 20, left: 50, bottom: 80 }}>
                            <XAxis
                                dataKey={xKey}
                                angle={-25}
                                textAnchor="end"
                                interval={0}
                                height={70}
                                tickFormatter={(v) =>
                                    String(v).length > 18
                                        ? String(v).slice(0, 18) + "…"
                                        : v
                                }
                            />

                            <YAxis
                                domain={["auto", "auto"]}
                                tickFormatter={(v) =>
                                    new Intl.NumberFormat("en", {
                                        notation: "compact",
                                        compactDisplay: "short",
                                    }).format(v)
                                }
                            />

                            <Tooltip formatter={(v) => formatNumber(Number(v))} />
                            <Line dataKey={yKey} stroke="#2563eb" />
                        </LineChart>
                    )}

                    {type === "pie" && (
                        <PieChart margin={{ top: 20, right: 20, left: 50, bottom: 80 }}>

                            <Pie
                                data={data}

                                dataKey={yKey}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                outerRadius="65%"
                                fill="#3b82f6"
                                label={false}
                            />
                            <Tooltip formatter={(v) => formatNumber(Number(v))} />
                        </PieChart>
                    )}

                </ResponsiveContainer>
            </div>
        </div>
    );
}
