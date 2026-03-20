import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setPivot, clearPivot, Aggregation } from "../../store/layoutSlice";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Area = "fields" | "row" | "column" | "value";

const COLOR_MAP = {
    fields: "bg-gray-100 text-gray-700",
    row:    "bg-blue-100 text-blue-700",
    column: "bg-green-100 text-green-700",
    value:  "bg-purple-100 text-purple-700",
} as const;

const AGG_OPTIONS: { value: Aggregation; label: string }[] = [
    { value: "sum",           label: "Sum" },
    { value: "avg",           label: "Average" },
    { value: "min",           label: "Min" },
    { value: "max",           label: "Max" },
    { value: "count",         label: "Count" },
    { value: "countDistinct", label: "Count Distinct" },
    { value: "median",        label: "Median" },
    { value: "stddev",        label: "Std Deviation" },
    { value: "percentage",    label: "Percentage" },
];

const ZONES: { id: Area; title: string }[] = [
    { id: "fields", title: "Fields" },
    { id: "row",    title: "Rows" },
    { id: "column", title: "Columns" },
    { id: "value",  title: "Values" },
];

function DropZone({ id, title, items }: { id: Area; title: string; items: string[] }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">{title}</p>
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`border rounded min-h-[80px] p-2 space-y-1 ${snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"}`}
                    >
                        {items.map((c, i) => (
                            <Draggable key={c} draggableId={`${id}-${c}`} index={i}>
                                {(prov) => (
                                    <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        {...prov.dragHandleProps}
                                        className={`px-2 py-1 rounded cursor-move text-[10px] font-medium ${COLOR_MAP[id]}`}
                                    >
                                        {c}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {!items.length && <p className="text-gray-400 text-xs text-center py-2">Drop here</p>}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

export default function PivotControls() {
    const dispatch = useDispatch();
    const selected = useSelector((s: RootState) => s.layout.columns);
    const pivot    = useSelector((s: RootState) => s.layout.pivot);
    const allcol   = useSelector((s: RootState) => s.data.columns);

    const columns = useMemo(
        () => allcol.filter(c => selected.includes(c)),
        [selected, allcol]
    );

    const fieldItems = columns.filter(
        c => !pivot.row.includes(c) && !pivot.column.includes(c) && !pivot.value.includes(c)
    );

    const zoneItems: Record<Area, string[]> = {
        fields: fieldItems,
        row:    pivot.row,
        column: pivot.column,
        value:  pivot.value,
    };

    const onDragEnd = ({ source, destination }: DropResult) => {
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const lists = Object.fromEntries(
            Object.entries(zoneItems).map(([k, v]) => [k, [...v]])
        ) as Record<Area, string[]>;

        const [moved] = lists[source.droppableId as Area].splice(source.index, 1);
        lists[destination.droppableId as Area].splice(destination.index, 0, moved);

        dispatch(setPivot({ row: lists.row, column: lists.column, value: lists.value }));
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm p-3 space-y-3 text-sm">
            <h3 className="font-semibold text-gray-800">📊 Pivot Builder</h3>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="space-y-3">
                    {ZONES.map(({ id, title }) => (
                        <DropZone key={id} id={id} title={title} items={zoneItems[id]} />
                    ))}
                </div>
            </DragDropContext>

            <div>
                <label className="block text-xs text-gray-500 mb-1">Aggregation</label>
                <select
                    value={pivot.agg}
                    onChange={e => dispatch(setPivot({ ...pivot, agg: e.target.value as Aggregation }))}
                    className="w-full border rounded px-2 py-1"
                >
                    {AGG_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={() => dispatch(clearPivot())}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
            >
                Close Pivot
            </button>
        </div>
    );
}