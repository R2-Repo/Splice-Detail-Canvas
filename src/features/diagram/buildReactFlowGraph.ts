import type { Edge, Node } from "@xyflow/react";

import { computeCanvasPlacement } from "@/features/diagram/canvasPlacement";
import { visualCableHeight } from "@/features/diagram/cableLayoutMetrics";
import { colorHex } from "@/features/diagram/colorCode";
import {
  computeDiagramLayout,
  nodePositionsForGraph,
  type DiagramLayout,
} from "@/features/diagram/layoutSpliceDiagram";
import {
  buildVisualCables,
  endpointOnVisualSide,
  type VisualCable,
} from "@/features/diagram/visualCables";
import { orderedFiberConnections } from "@/features/diagram/buildConnectionGraph";
import type { ConnectionGraph, LayoutOverrides } from "@/types/splice";

import type { CableNodeData } from "@/features/canvas/nodes/types";

function applyPlacementToLegs(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: ReturnType<typeof computeCanvasPlacement>,
): void {
  for (const leg of graph.legs) {
    const instances = visualCables.filter((v) => v.legId === leg.id);
    const p = instances.map((v) => placement.get(v.id)?.side).filter(Boolean);
    if (p.length > 0) {
      leg.side = p[0]!;
    }
  }
}

function inferCountLabel(cable: string): string | undefined {
  if (/144/i.test(cable)) return "144ct";
  if (/288/i.test(cable)) return "288ct";
  if (/24\s*DIST|24\s*SMF/i.test(cable)) return "24ct";
  if (/6\s*DROP|DK-?6/i.test(cable)) return "6ct";
  return undefined;
}

export function buildReactFlowGraph(
  graph: ConnectionGraph,
  overrides?: LayoutOverrides,
): { nodes: Node[]; edges: Edge[]; layout: DiagramLayout } {
  const visualCables = buildVisualCables(graph);
  const placement = computeCanvasPlacement(graph, visualCables);
  applyPlacementToLegs(graph, visualCables, placement);

  for (const vc of visualCables) {
    const p = placement.get(vc.id);
    if (p) vc.side = p.side;
  }

  const layout = computeDiagramLayout(graph, visualCables, placement);
  const positions = nodePositionsForGraph(graph, layout, overrides);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const vc of visualCables) {
    const nodeId = `cable-${vc.id}`;
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    nodes.push({
      id: nodeId,
      type: "cable",
      position: pos,
      data: {
        label: vc.cable,
        countLabel: inferCountLabel(vc.cable),
        side: vc.side,
        tubes: vc.tubes,
        nodeHeight: visualCableHeight(vc),
      } satisfies CableNodeData,
      draggable: true,
      style: { width: 200 },
    });
  }

  for (const conn of orderedFiberConnections(graph)) {
    const left = endpointOnVisualSide(conn, graph, visualCables, "left");
    const right = endpointOnVisualSide(conn, graph, visualCables, "right");
    if (!left || !right) continue;

    const color = colorHex(left.endpoint.fiberColor);
    edges.push({
      id: `splice-${conn.id}`,
      source: `cable-${left.visualCableId}`,
      target: `cable-${right.visualCableId}`,
      sourceHandle: `${left.handleId}-out`,
      targetHandle: `${right.handleId}-in`,
      type: "splice",
      data: {
        color,
        existing: overrides?.existingEdgeIds?.includes(`splice-${conn.id}`),
        circuitName: conn.pair.circuitName,
      },
    });
  }

  for (const conn of graph.connections) {
    if (conn.kind !== "tube") continue;
    const leftVc = visualCables.find(
      (v) => v.legId === conn.endpointA.legId && v.side === "left",
    );
    const rightVc = visualCables.find(
      (v) => v.legId === conn.endpointB.legId && v.side === "right",
    );
    if (!leftVc || !rightVc) continue;
    const base = conn.endpointA.tubeColor.split("-")[0] as import("@/types/splice").FiberColorAbbrev;
    edges.push({
      id: `splice-${conn.id}`,
      source: `cable-${leftVc.id}`,
      target: `cable-${rightVc.id}`,
      sourceHandle: `${leftVc.tubes[0]?.fibers[0]?.handleId ?? "tube"}-out`,
      targetHandle: `${rightVc.tubes[0]?.fibers[0]?.handleId ?? "tube"}-in`,
      type: "splice",
      style: { strokeWidth: 8 },
      data: { color: colorHex(base) },
    });
  }

  return { nodes, edges, layout };
}
