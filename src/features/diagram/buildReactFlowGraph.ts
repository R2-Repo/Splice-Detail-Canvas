import type { Edge, Node } from "@xyflow/react";

import { smfoLabelForCable } from "@/features/diagram/cableLabels";
import { computeDiagramScale } from "@/features/diagram/cableBreakoutGeometry";
import { computeCanvasPlacement } from "@/features/diagram/canvasPlacement";
import {
  applyCableSideOverrides,
  displaySideFromCanvasX,
} from "@/features/diagram/cableDisplaySide";
import {
  CABLE_LAYOUT,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { colorHex } from "@/features/diagram/colorCode";
import { connectionRowIndexMap } from "@/features/diagram/connectionRowOrder";
import {
  collapsedPairIdsFromButtSplices,
  collapsedTubeColorsForVisualCable,
  detectFullButtSpliceTubes,
  resolveFullButtSpliceVisuals,
} from "@/features/diagram/fullButtSplice";
import {
  computeDiagramLayout,
  nodePositionsForGraph,
  type DiagramLayout,
} from "@/features/diagram/layoutSpliceDiagram";
import { tubeHandleId } from "@/features/diagram/tubeId";
import {
  buildVisualCablesForLayout,
  endpointOnVisualSide,
  type VisualCable,
} from "@/features/diagram/visualCables";
import { orderedFiberConnections } from "@/features/diagram/buildConnectionGraph";
import type {
  ConnectionGraph,
  FiberColorAbbrev,
  LayoutOverrides,
} from "@/types/splice";

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
  layoutWidth?: number,
): { nodes: Node[]; edges: Edge[]; layout: DiagramLayout } {
  const collapseFullButtSplices = overrides?.collapseFullButtSplices ?? false;

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

  const detectedButtSplices = collapseFullButtSplices
    ? detectFullButtSpliceTubes(graph, visualCables)
    : [];
  const resolvedButtSplices = collapseFullButtSplices
    ? resolveFullButtSpliceVisuals(visualCables, detectedButtSplices)
    : [];
  const hiddenPairIds = collapseFullButtSplices
    ? collapsedPairIdsFromButtSplices(resolvedButtSplices.map((r) => r.tube))
    : new Set<string>();

  const layout = computeDiagramLayout(
    graph,
    visualCables,
    placement,
    dominant,
    layoutWidth,
  );
  const positions = nodePositionsForGraph(graph, layout, overrides);

  for (const vc of visualCables) {
    const pos = positions[`cable-${vc.id}`];
    if (!pos) continue;
    const displaySide = displaySideFromCanvasX(pos.x);
    vc.side = displaySide;
    const p = placement.get(vc.id);
    if (p) {
      placement.set(vc.id, { ...p, side: displaySide });
    }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const rowCount = orderedFiberConnections(graph).length;
  const diagramScale = computeDiagramScale(rowCount);

  for (const vc of visualCables) {
    const nodeId = `cable-${vc.id}`;
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    const collapsedTubes = collapseFullButtSplices
      ? collapsedTubeColorsForVisualCable(vc, resolvedButtSplices)
      : undefined;
    nodes.push({
      id: nodeId,
      type: "cable",
      position: pos,
      data: {
        smfoLabel: smfoLabelForCable(vc.cable),
        label: vc.cable,
        legId: vc.legId,
        side: vc.side,
        tubes: vc.tubes,
        nodeHeight: visualCableHeight(vc),
        fiberPitch: CABLE_LAYOUT.fiberRowH,
        diagramScale,
        spliceNumber: graph.report.header.spliceNumber,
        collapsedTubes,
      } satisfies CableNodeData,
      draggable: true,
    });
  }

  const laneCount = orderedFiberConnections(graph).length;

  for (const conn of orderedFiberConnections(graph)) {
    if (hiddenPairIds.has(conn.id)) continue;

    const csvLeft = endpointOnVisualSide(conn, graph, visualCables, "left");
    const csvRight = endpointOnVisualSide(conn, graph, visualCables, "right");
    if (!csvLeft || !csvRight) continue;

    let source = csvLeft;
    let target = csvRight;
    if (
      csvLeft.canvasSide === "right" &&
      csvRight.canvasSide === "left"
    ) {
      source = csvRight;
      target = csvLeft;
    }

    const laneIndex = rowIndex.get(conn.id) ?? 0;
    edges.push({
      id: `splice-${conn.id}`,
      source: `cable-${source.visualCableId}`,
      target: `cable-${target.visualCableId}`,
      sourceHandle: `${source.handleId}-out`,
      targetHandle: `${target.handleId}-in`,
      type: "splice",
      data: {
        sourceColor: colorHex(source.endpoint.fiberColor),
        targetColor: colorHex(target.endpoint.fiberColor),
        existing: overrides?.existingEdgeIds?.includes(`splice-${conn.id}`),
        circuitName: conn.pair.circuitName,
        laneIndex,
        laneCount,
      },
    });
  }

  for (const {
    tube,
    leftVc,
    rightVc,
    leftEndpoint,
    rightEndpoint,
  } of resolvedButtSplices) {
    const leftHandle = tubeHandleId(leftEndpoint.legId, leftEndpoint.tubeColor);
    const rightHandle = tubeHandleId(
      rightEndpoint.legId,
      rightEndpoint.tubeColor,
    );
    const leftBase = leftEndpoint.tubeColor.split("-")[0] as FiberColorAbbrev;
    const rightBase = rightEndpoint.tubeColor.split("-")[0] as FiberColorAbbrev;
    const laneIndex = Math.min(
      ...tube.pairIds.map((id) => rowIndex.get(id) ?? 0),
    );

    edges.push({
      id: `butt-${tube.id}`,
      source: `cable-${leftVc.id}`,
      target: `cable-${rightVc.id}`,
      sourceHandle: `${leftHandle}-out`,
      targetHandle: `${rightHandle}-in`,
      type: "splice",
      data: {
        fullButtSplice: true,
        sourceColor: colorHex(leftBase),
        targetColor: colorHex(rightBase),
        laneIndex,
        laneCount,
      },
    });
  }

  return { nodes, edges, layout };
}
