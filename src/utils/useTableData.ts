import { useMemo } from 'react'
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { pivotData } from './pivotData';
import { groupDataAll } from './groupDataAll';

export function useTableData() {
    const data = useSelector((s: RootState) => s.data.rows);//selecting the actual data from redux
    const selected = useSelector((s: RootState) => s.layout.columns);// selected the selected column fields from the redux
    const allcol = useSelector((s: RootState) => s.data.columns);//selecting the entirity of the columns from the redux
    const topN = useSelector((s: RootState) => s.layout.topN);
    const filtersRange = useSelector((s: RootState) => s.layout.filtersRange);
    const rangeCol = useSelector((s: RootState) => s.layout.rangeCol);
    const multiSelectFilters = useSelector((s: RootState) => s.layout.multiSelectFilters);
    const nullFilters = useSelector((s: RootState) => s.layout.nullFilters);
    const pivot = useSelector((s: RootState) => s.layout.pivot);
    const chart = useSelector((s: RootState) => s.layout.chart);//selecting the chart object for accesing its data

    const filteredBaseData = useMemo(() => {
        let result = [...data];
        /*  RANGE FILTER  */
        if (rangeCol && selected.includes(rangeCol) && filtersRange?.[rangeCol]) {
            const { min, max } = filtersRange[rangeCol];
            result = result.filter(row => {
                const val = Number(row[rangeCol]);
                if (isNaN(val)) return false;
                return val >= min && val <= max;
            });
        }
        /*  TOP N FILTER  */
        if (topN.enabled && topN.column && selected.includes(topN.column)) {
            const col = topN.column;
            result = result
                .filter(r => !isNaN(Number(r[col])))
                .sort((a, b) => {
                    const av = Number(a[col]);
                    const bv = Number(b[col]);
                    return topN.order === "top"
                        ? bv - av
                        : av - bv;
                })
                .slice(0, topN.count);
        }
        const multiFilters = multiSelectFilters || {};
        Object.entries(multiFilters).forEach(([col, vals]) => {
            if (vals.length > 0 && selected.includes(col)) {
                result = result.filter(row => vals.includes(String(row[col] ?? '')));
            }
        });

        // NULL FILTER
        const nullFilter = nullFilters || {};
        Object.entries(nullFilter).forEach(([col, mode]) => {
            if (!selected.includes(col)) return;
            if (mode === 'show') {
                // show only empty rows
                result = result.filter(row => {
                    const val = row[col];
                    return val === null || val === undefined || String(val).trim() === '';
                });
            } else if (mode === 'hide') {
                // hide empty rows
                result = result.filter(row => {
                    const val = row[col];
                    return val !== null && val !== undefined && String(val).trim() !== '';
                });
            }
        });
        return result;
    }, [data, rangeCol, filtersRange, topN, multiSelectFilters, nullFilters, selected,]);

    const columns = useMemo(() => {
        if (!data.length || !selected.length) return [];
        return selected.filter((c: string) => allcol.includes(c));
    }, [data, selected, allcol]);

    const pivotResult = useMemo(() => {
        if (!pivot.enabled) return null;
        const { row, column, value, agg, percentMode } = pivot;

        // row and column are now string[]
        if (!row.length || !column.length || !value.length) return null;
        if (!row.every((r: string) => selected.includes(r))) return null;
        if (!column.every((c: string) => selected.includes(c))) return null;
        if (!value.every((v: string) => selected.includes(v))) return null;

        return pivotData(
            filteredBaseData,
            row,
            column,
            value,
            agg,
            percentMode || undefined
        );
    }, [filteredBaseData, pivot, selected]);

    // memo function to calculate data for charts 
    const allChartData = useMemo(() => {
        if (!chart.x || !chart.y) return null;
        return groupDataAll(filteredBaseData, chart.x, chart.y);
    }, [filteredBaseData, chart.x, chart.y]);

    //another memo function which checks whether pivot is selected , storees pivot columns or the original selected columns
    const finalColumns = useMemo(() => {
        if (!pivotResult?.length) return columns;

        const rowCols = pivot.row; // dimensions
        const dataCols = Object.keys(pivotResult[0]).filter(
            k => !rowCols.includes(k)
        );

        return [...rowCols, ...dataCols];
    }, [pivotResult, columns, pivot.row]);

    const finalRows = useMemo(() => {
        if (pivotResult?.length) {
            return pivotResult;
        }
        return filteredBaseData;
    }, [pivotResult, filteredBaseData]);


    return { data, columns, finalColumns, finalRows, allChartData, chart, pivot };
}

