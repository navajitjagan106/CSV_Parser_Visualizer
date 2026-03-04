export type TreeNode = {
  path: string;        
  depth: number;       
  label: string;       
  rowData: Record<string, any>;
  children: TreeNode[];
};


export function buildRowTree(rows: Record<string, any>[],rowKeys: string[]): TreeNode[] {
  if (!rowKeys.length || !rows.length) return [];

  const root: TreeNode[] = [];

  
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
        nodeMap.get(pathSoFar)!.rowData = row;
      }

      parentList = nodeMap.get(pathSoFar)!.children;
    });
  });

  return root;
}
