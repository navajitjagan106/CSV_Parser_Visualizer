import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { setPivot, clearPivot } from "../../store/layoutSlice";
import { Aggregation } from "../../store/layoutSlice";

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from "@hello-pangea/dnd";

type Area = "fields" | "row" | "column" | "value";

export default function PivotControls() {
  const dispatch = useDispatch();

  const selected = useSelector((s: RootState) => s.layout.columns);
  const pivot = useSelector((s: RootState) => s.layout.pivot);
  const allcol = useSelector((s: RootState) => s.data.columns);

  const columns = useMemo(() => {
    if (!selected.length) return [];
    return allcol.filter(c => selected.includes(c));
  }, [selected, allcol]);

  /* All available fields */
  const fieldItems = columns.filter(
    c =>
      !pivot.row.includes(c) &&
      !pivot.column.includes(c) &&
      !pivot.value.includes(c)
  );

  /* Handle Drag End */
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const lists: Record<Area, string[]> = {
      fields: [...fieldItems],
      row: [...pivot.row],
      column: [...pivot.column],
      value: [...pivot.value]
    };

    const src = source.droppableId as Area;
    const dest = destination.droppableId as Area;

    const [moved] = lists[src].splice(source.index, 1);
    lists[dest].splice(destination.index, 0, moved);

    dispatch(
      setPivot({
        row: lists.row,
        column: lists.column,
        value: lists.value
      })
    );
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-3 space-y-3 text-sm">

      <h3 className="font-semibold text-gray-800">
        📊 Pivot Builder
      </h3>

      <DragDropContext onDragEnd={onDragEnd}>

        <div className="grid size-11/12 grid-cols-1 gap-3">

          <DropZone
            id="fields"
            title="Fields"
            items={fieldItems}
            color="gray"
          />

          <DropZone
            id="row"
            title="Rows"
            items={pivot.row}
            color="blue"
          />

          <DropZone
            id="column"
            title="Columns"
            items={pivot.column}
            color="green"
          />

          <DropZone
            id="value"
            title="Values"
            items={pivot.value}
            color="purple"
          />

        </div>

      </DragDropContext>

      {/* Aggregation */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Aggregation
        </label>

        <select
          value={pivot.agg}
          onChange={(e) =>
            dispatch(
              setPivot({ ...pivot, agg: e.target.value as Aggregation })
            )
          }
          className="w-full border rounded px-2 py-1"
        >
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="min">Min</option>
          <option value="max">Max</option>
          <option value="count">Count</option>
          <option value="countDistinct">Count Distinct</option>
          <option value="median">Median</option>
          <option value="stddev">Std Deviation</option>
        </select>
      </div>

      {/* Percent */}
      <select
        value={pivot.percentMode || ""}
        onChange={(e) =>
          dispatch(
            setPivot({
              percentMode: e.target.value as
                | "row"
                | "col"
                | "grand"
                | undefined
            })
          )
        }
        className="w-full border rounded px-2 py-1"
      >
        <option value="">No %</option>
        <option value="row">% of Row</option>
        <option value="col">% of Column</option>
        <option value="grand">% of Grand</option>
      </select>

      <button
        onClick={() => dispatch(clearPivot())}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
      >
        Close Pivot
      </button>

    </div>
  );
}

/* =============================== */

function DropZone({
  id,
  title,
  items,
  color
}: {
  id: Area;
  title: string;
  items: string[];
  color: "gray" | "blue" | "green" | "purple";
}) {
  const colorMap = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700"
  };

  return (
    <div>

      <div className="text-xs font-semibold text-gray-600 mb-1">
        {title}
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`border rounded min-h-[80px] p-2 space-y-1
              ${snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-50"}`}
          >

            {items.map((c, i) => (
              <Draggable
                draggableId={`${id}-${c}`}
                index={i}
                key={c}
              >
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    className={`px-2 py-1 rounded cursor-move text-[10px] font-medium
                      ${colorMap[color]}`}
                  >
                    {c}
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {!items.length && (
              <div className="text-gray-400 text-xs text-center py-2">
                Drop here
              </div>
            )}

          </div>
        )}
      </Droppable>

    </div>
  );
}