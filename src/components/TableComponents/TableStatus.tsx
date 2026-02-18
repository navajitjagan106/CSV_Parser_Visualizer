type Props = {
  filteredCount: number;
  totalCount: number;
  columnCount: number;
};

export default function TableStatus({ filteredCount, totalCount, columnCount }: Props) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border-b text-xs">
      <div className="flex items-center gap-4">
        <span className="text-gray-600">
          📊 Showing{' '}
          <span className="font-semibold text-blue-600">{filteredCount}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> rows
        </span>
        {filteredCount !== totalCount && (
          <span className="text-orange-600 font-medium">(Filtered)</span>
        )}
      </div>
      <div className="text-gray-500">{columnCount} columns selected</div>
    </div>
  );
}