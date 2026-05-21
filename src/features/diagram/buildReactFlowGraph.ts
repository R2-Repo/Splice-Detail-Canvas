import type { Edge, Node } from "@xyflow/react";

import { smfoLabelForCable } from "@/features/diagram/cableLabels";
import { computeDiagramScale } from "@/features/diagram/cableBreakoutGeometry";
import { computeCanvasPlacement } from "@/features/diagram/canvasPlacement";
import { applyCableSideOverrides } from "@/features/diagram/cableDisplaySide";
import {
  CABLE_LAYOUT,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { colorHex } from "@/features/diagram/colorCode";
import { connectionRowIndexMap } from "@/features/diagram/connectionRowOrder";
import {
  computeDiagramLayout,
  nodePositionsForGraph,
  type DiagramLayout,
} from "@/features/diagram/layoutSpliceDiagram";
import {
  buildVisualCablesForLayout,
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

export function buildReactFlowGraph(
  graph: ConnectionGraph,
  overrides?: LayoutOverrides,
): { nodes: Node[]; edges: Edge[]; layout: DiagramLayout } {
  const { visualCables, dominant } = buildVisualCablesForLayout(graph);
  const rowIndex = connectionRowIndexMap(graph, visualCables, dominant);
  const placement = computeCanvasPlacement(
    graph,
    visualCables,
    dominant,
    rowIndex,
  );
  applyCableSideOverrides(placement, visualCables, overrides?.cableSides);
  applyPlacementToLegs(graph, visualCables, placement);

  for (const vc of visualCables) {
    const p = placement.get(vc.id);
    if (p) vc.side = p.side;
  }

  const layout = computeDiagramLayout(
    graph,
    visualCables,
    placement,
    dominant,
  );
  const positions = nodePositionsForGraph(graph, layout, overrides);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const rowCount = orderedFiberConnections(graph).length;
  const diagramScale = computeDiagramScale(rowCount);

  for (const vc of visualCables) {
    const nodeId = `cable-${vc.id}`;
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    nodes.push({
      id: nodeId,
      type: "cable",
      position: pos,
      data: {
        smfoLabel: smfoLabelForCable(vc.cable),
        label: vc.cable,
        side: vc.side,
        tubes: vc.tubes,
        nodeHeight: visualCableHeight(vc),
        fiberPitch: CABLE_LAYOUT.fiberRowH,
        diagramScale,
        spliceNumber: graph.report.header.spliceNumber,
      } satisfies CableNodeData,
      draggable: true,
    });
  }

  const laneCount = orderedFiberConnections(graph).length;

  for (const conn of orderedFiberConnections(graph)) {
    const left = endpointOnVisualSide(conn, graph, visualCables, "left");
    const right = endpointOnVisualSide(conn, graph, visualCables, "right");
    if (!left || !right) continue;

    const laneIndex = rowIndex.get(conn.id) ?? 0;
    edges.push({
      id: `splice-${conn.id}`,
      source: `cable-${left.visualCableId}`,
      target: `cable-${right.visualCableId}`,
      sourceHandle: `${left.handleId}-out`,
      targetHandle: `${right.handleId}-in`,
      type: "splice",
      data: {
        sourceColor: colorHex(left.endpoint.fiberColor),
        targetColor: colorHex(right.endpoint.fiberColor),
        existing: overrides?.existingEdgeIds?.includes(`splice-${conn.id}`),
        circuitName: conn.pair.circuitName,
        laneIndex,
        laneCount,
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
