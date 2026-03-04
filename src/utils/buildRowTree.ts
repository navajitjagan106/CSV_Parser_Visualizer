export type TreeNode = {
  path: string;        // e.g. "2013" or "2013|Agriculture"
  depth: number;       // 0 = top level
  label: string;       // the value at this level
  rowData: Record<string, any>;
  children: TreeNode[];
};

/**
 * Builds a hierarchy tree from flat pivot rows.
 * rowKeys = ["Year", "Industry"] → 2-level tree
 */
export function buildRowTree(
  rows: Record<string, any>[],
  rowKeys: string[]
): TreeNode[] {
  if (!rowKeys.length || !rows.length) return [];

  const root: TreeNode[] = [];

  // Use a map to find/create nodes efficiently
  const nodeMap = new Map<string, TreeNode>();

  rows.forEach(row => {
    let parentList = root;
    let pathSoFar = "";

    rowKeys.forEach((key, depth) => {
      const val = String(row[key] ?? "");
      pathSoFar = depth === 0 ? val : `${pathSoFar}|${val}`;

      if (!nodeMap.has(pathSoFar)) {
        const node: TreeNode = {
          path: pathSoFar,
          depth,
          label: val,
          rowData: depth === rowKeys.length - 1 ? row : {},
          children: [],
        };
        nodeMap.set(pathSoFar, node);
        parentList.push(node);
      } else if (depth === rowKeys.length - 1) {
        // Leaf node — attach full row data
        nodeMap.get(pathSoFar)!.rowData = row;
      }

      parentList = nodeMap.get(pathSoFar)!.children;
    });
  });

  return root;
}
