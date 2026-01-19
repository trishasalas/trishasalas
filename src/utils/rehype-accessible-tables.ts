import { visit } from "unist-util-visit";
import type { Element } from "hast";

export function rehypeAccessibleTables() {
  return (tree: any) => {
    visit(tree, "element", (node: Element) => {
      // Add scope="col" to header cells
      if (node.tagName === "th") {
        node.properties = node.properties || {};
        node.properties.scope = "col";
      }

      // Add scope="row" to first td in each row
      if (node.tagName === "tr") {
        const cells = node.children.filter(
          (child: any) => child.type === "element" && child.tagName === "td"
        );
        
        if (cells.length > 0) {
          const firstCell = cells[0] as Element;
          firstCell.properties = firstCell.properties || {};
          firstCell.properties.scope = "row";
        }
      }
    });
  };
}
