import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store'
import { setChart, clearChart } from '../../store/layoutSlice';
import type { Aggregation } from '../../store/layoutSlice';
import { FiBarChart2, FiTrendingUp, FiPieChart, FiActivity } from 'react-icons/fi';
import { LuChartScatter } from 'react-icons/lu';
import { useMemo } from 'react';

type ChartItem = {
  icon: any,
  type: string;
  label: string;
};
export default function ChartControls  () {
   const dispatch=useDispatch();
      const chart = useSelector((s: RootState) => s.layout.chart) //selecting the chart object from the redux
      const selected = useSelector((s: RootState) => s.layout.columns)//selecting the selected columns
    const allcol = useSelector((s: RootState) => s.data.columns)//selecting the original columns from the data redux


    const chartItems: ChartItem[] = [
        { icon: FiBarChart2, type: "bar", label: "Bar" },
        { icon: FiTrendingUp, type: "line", label: "Line" },
        { icon: FiPieChart, type: "pie", label: "Pie" },
        { icon: FiActivity, type: "area", label: "Area" },
        { icon: LuChartScatter, type: "scatter", label: "Scatter" },
      ];
    
      const chartEnabled = Boolean(chart.type || chart.x || chart.y); //boolean varible to chk whether chart enabled or not

  //preserve original order while selecting fields
  const columns = useMemo(() => {
    if (!selected.length) return [];
    return allcol.filter(c => selected.includes(c));
  }, [selected, allcol]);//


  return (
    <div className='space-y-2'>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Charts
              </p>
        
        
              {/*displaying diff charts and on selecting them we eable chartmode and set its type this allows opeing a subwindow wheere we can select fields */}
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
        
              {/*Other sub fields such xvalue yvalue and agg */}
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
        
    </div>
  )
}
