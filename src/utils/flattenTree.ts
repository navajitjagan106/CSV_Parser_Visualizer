import { TreeNode } from "./buildRowTree";

export type FlatRow = Record<string, any> & {
  _path: string;
  _depth: number;
  _isSubtotal: boolean;
  _hasChildren: boolean;
  _label: string;
};

export function flattenTree(
  nodes: TreeNode[],
  collapsed: Set<string>,
  rowKeys: string[],
  dataCols: string[],
  agg: string = "sum"
): FlatRow[] {
  const result: FlatRow[] = [];

  function visit(node: TreeNode) {
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed.has(node.path);
    const pathParts = node.path.split("|");

    if (!hasChildren) {
      const flat: FlatRow = {
        ...node.rowData,
        _path: node.path,
        _depth: node.depth,
        _isSubtotal: false,
        _hasChildren: false,
        _label: node.label,
      };
      rowKeys.forEach((rk, i) => {
        
        flat[rk] = i === node.depth ? pathParts[i] ?? "" : "";
      });
      result.push(flat);
      return;
    }

    // Parent row — show only this level's value, blank deeper levels
    const parentFlat: FlatRow = {
      ...node.rowData,
      _path: node.path,
      _depth: node.depth,
      _isSubtotal: false,
      _hasChildren: true,
      _label: node.label,
    };
    rowKeys.forEach((rk, i) => {
      parentFlat[rk] = i === node.depth ? pathParts[i] ?? "" : "";
    });
    result.push(parentFlat);

    if (isCollapsed) {
      const leaves = collectLeaves(node);
      const subtotalRow: FlatRow = {
        _path: `${node.path}|__subtotal__`,
        _depth: node.depth + 1,
        _isSubtotal: true,
        _hasChildren: false,
        _label: `${node.label} (subtotal)`,
      } as FlatRow;

      rowKeys.forEach((rk, i) => {
        subtotalRow[rk] = i === node.depth
          ? `↳ ${node.label} Subtotal`
          : "";
      });

      dataCols.forEach(col => {
        const nums = leaves
          .map(l => Number(l.rowData[col]))
          .filter(n => !isNaN(n));
        subtotalRow[col] = nums.length ? nums.reduce((a, b) => a + b, 0) : "";
      });

      result.push(subtotalRow);
    } else {
      node.children.forEach(child => visit(child));
    }
  }

  nodes.forEach(node => visit(node));
  return result;
}

function collectLeaves(node: TreeNode): TreeNode[] {
  if (!node.children.length) return [node];
  return node.children.flatMap(collectLeaves);
}