import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Tooltip, XAxis, YAxis, ResponsiveContainer, Cell, Legend, AreaChart, Area, ScatterChart, Scatter } from "recharts";
import { Treemap } from "recharts";
import { ChartAggregation } from "../../store/layoutSlice";
interface Props {
    data: any[];
    xKey: string;
    yKey: string;
    type: string;
    agg:ChartAggregation;
}

export default function ChartPanel({ data, xKey, yKey, type, agg }: Props) {

    const [limit, setLimit] = useState(10);
    const [sortMode, setSortMode] = useState<"none" | "desc" | "asc">("none");

    //to define what chart we are wroking on
    const chartName = useMemo(() => {
        if (type === "bar") return "Bar Chart";
        if (type === "line") return "Line Chart";
        if (type === "pie") return "Pie Chart";
        return "Chart";
    }, [type]);

    //finding the summaryvalue
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

    //processing data for the chart like ascending or desc based on the mode 
    const processedData = useMemo(() => {
        if (!data?.length) return [];
        let result = [...data]; // clone
        if (sortMode === "desc") {
            result.sort((a, b) => Number(b[yKey]) - Number(a[yKey]));
        }
        if (sortMode === "asc") {
            result.sort((a, b) => Number(a[yKey]) - Number(b[yKey]));
        }
        // Limit
        if (limit !== 0 && sortMode !== "none") {
            result = result.slice(0, limit);
        }
        return result;
    }, [data, limit, yKey, sortMode]);


    //tooltip used to say what column we are hovering on the chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;

        const d = payload[0].payload;

        return (
            <div className="bg-white border shadow rounded px-2 py-1 text-xs">
                <p className="font-medium">{d[xKey]}</p>
                <p>{yKey}: {formatNumber(Number(d[yKey]))}</p>
            </div>
        );
    };


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

    //to generate a colour for the each pie segments in the piechart 
    const getColor = (index: number) => {
        const hue = (index * 137.5) % 360; // golden angle
        return `hsl(${hue}, 70%, 50%)`;
    };


    //  UI  
    return (
        <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm border p-2">
            {/* HEADER */}
            <div className="mb-2 pb-1 border-b flex flex-col gap-0.5">
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Show:</span>
                    <select
                        value={limit}
                        disabled={sortMode === "none"}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="text-xs border rounded px-1 py-0.5"
                    >
                        <option value={10}>Top 10</option>
                        <option value={15}>Top 15</option>
                        <option value={20}>Top 20</option>
                        <option value={0}>All</option>
                    </select>
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as any)}
                        className="text-xs border rounded px-1 py-0.5"
                    >
                        <option value="desc">High → Low</option>
                        <option value="asc">Low → High</option>
                        <option value="none">Original</option>
                    </select>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-800">
                    {chartName}: {yKey} by {xKey}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500">
                    Showing {agg.toUpperCase()}({yKey}) grouped by {xKey}
                </p>

                {/* Summary */}
                <p className="text-xs text-gray-400 mt-0.4">
                    Categories: {data.length} | Total: {formatNumber(summaryValue)}
                </p>
            </div>

            {/*  CHART  */}
            <div className="w-full min-h-full">

                <ResponsiveContainer
                    width="100%"
                    height={type === 'treemap' ? 250 : '100%'}
                    >
                    {type === "bar" && (
                        <BarChart
                            data={processedData}
                            margin={{ top: 20, right: 20, left: 40, bottom: 80 }}
                        >
                            <XAxis
                                dataKey={xKey}
                                angle={-25}
                                textAnchor="end"
                                interval="preserveStartEnd"
                                height={60}
                                tickFormatter={(v) =>
                                    String(v).length > 18
                                        ? String(v).slice(0, 18) + "…"
                                        : v
                                }
                            />
                            <YAxis
                                tickFormatter={(v) =>
                                    new Intl.NumberFormat("en", {
                                        notation: "compact",
                                        compactDisplay: "short",
                                    }).format(v)
                                }
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey={yKey} fill="#1984c5" />
                        </BarChart>
                    )}


                    {type === "line" && (
                        <LineChart data={processedData} margin={{ top: 20, right: 20, left: 40, bottom: 80 }}>
                            <XAxis
                                dataKey={xKey}
                                angle={-25}
                                textAnchor="end"
                                interval="preserveStartEnd"
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
                            <Line dataKey={yKey} stroke="#1984c5" />
                        </LineChart>
                    )}

                    {type === "pie" && (
                        <PieChart margin={{ top: 20, right: 20, left: 50, bottom: 80 }}>
                            <Pie
                                data={processedData}
                                dataKey={yKey}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                outerRadius="65%"
                                paddingAngle={1}
                                labelLine={false}
                            >{processedData.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getColor(index)}
                                />
                            ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatNumber(Number(v))} />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                wrapperStyle={{
                                    fontSize: "11px",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    paddingLeft: "10px",
                                }}
                            />
                        </PieChart>
                    )}

                    {(type === "area") && (
                        <AreaChart data={processedData} margin={{ top: 20, right: 20, left: 50, bottom: 80 }}>
                            <XAxis dataKey={xKey}
                            />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey={yKey} />
                        </AreaChart>
                    )}

                    {(type === "scatter") && (
                        <ScatterChart margin={{ top: 20, right: 20, left: 50, bottom: 80 }}>
                            <XAxis dataKey={xKey} type="number" />
                            <YAxis dataKey={yKey} type="number" />
                            <Tooltip />
                            <Scatter data={data} />
                        </ScatterChart>)}


                    {type === "treemap" && (
                        <Treemap
                            data={processedData}
                            dataKey={yKey}
                            nameKey={xKey}
                            aspectRatio={4 / 3}
                            content={({ x, y, width, height, name, value, depth,index }) => (
                                <g>
                                    <rect x={x} y={y} width={width} height={height}
                                       fill={getColor(index)}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                    <Tooltip formatter={(v) => formatNumber(Number(v))} />
                                    
                                    {width > 50 && height > 30 && (
                                        <text x={x + width / 2} y={y + height / 2}
                                            textAnchor="middle" fill="#fff" fontSize={11}>
                                            {name}
                                        </text>
                                    )}
                                </g>
                            )}
                        />
                    )}

                </ResponsiveContainer>
            </div>
        </div>
    );
}
