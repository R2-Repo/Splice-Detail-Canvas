import type { Edge, Node } from "@xyflow/react";

export const initialNodes: Node[] = [
  {
    id: "start",
    position: { x: 80, y: 120 },
    data: { label: "Start" },
  },
  {
    id: "detail",
    position: { x: 320, y: 120 },
    data: { label: "Detail node" },
  },
];

export const initialEdges: Edge[] = [
  { id: "e-start-detail", source: "start", target: "detail" },
];
