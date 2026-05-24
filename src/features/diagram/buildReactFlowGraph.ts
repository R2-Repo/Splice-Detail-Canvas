import type { Edge, Node } from "@xyflow/react";

import {
  computeSideCircuitLabelSpans,
  smfoLabelForCable,
} from "@/features/diagram/cableLabels";
import {
  computeDiagramScale,
  computeSideStemAlignment,
} from "@/features/diagram/cableBreakoutGeometry";
import { computeCanvasPlacement } from "@/features/diagram/canvasPlacement";
import {
  applyCableSideOverrides,
  displaySideFromCanvasX,
} from "@/features/diagram/cableDisplaySide";
import {
  CABLE_LAYOUT,
  compactVisualCableHeight,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { colorHex } from "@/features/diagram/colorCode";
import { connectionRowIndexMap, connectionRowOffsets } from "@/features/diagram/connectionRowOrder";
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
import {
  computeCableXBounds,
  resolveSameSideNodeCollisions,
} from "@/features/diagram/spliceRowLayout";
import type { CableXBounds } from "@/features/diagram/cableLayoutMetrics";
import { tubeHandleId } from "@/features/diagram/tubeId";
import {
  spliceTubeBundleKey,
} from "@/features/canvas/edges/spliceEdgeRouting";
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

function nodeHeightForVisualCable(
  vc: VisualCable,
  collapsedTubeColors?: string[],
): number {
  const collapsed = new Set(collapsedTubeColors ?? []);
  if (collapsed.size === 0) return visualCableHeight(vc);

  const visibleFibers = vc.tubes
    .filter((t) => !collapsed.has(t.tubeColor))
    .flatMap((t) => t.fibers);
  const collapsedTubeCount = vc.tubes.filter((t) =>
    collapsed.has(t.tubeColor),
  ).length;

  if (visibleFibers.length === 0) {
    return compactVisualCableHeight(Math.max(1, collapsedTubeCount));
  }

  const maxYOffset = Math.max(...visibleFibers.map((f) => f.rowYOffset));
  const collapsedExtra =
    collapsedTubeCount > 0
      ? collapsedTubeCount * CABLE_LAYOUT.fiberRowH
      : 0;
  return (
    CABLE_LAYOUT.headerH +
    CABLE_LAYOUT.tubeLabelH +
    maxYOffset +
    collapsedExtra +
    CABLE_LAYOUT.fiberRowH +
    CABLE_LAYOUT.tubeGap
  );
}

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
  buildOptions?: { refreshColumnX?: boolean },
): {
  nodes: Node[];
  edges: Edge[];
  layout: DiagramLayout;
  xBounds: CableXBounds;
} {
  const collapseFullButtSplices = overrides?.collapseFullButtSplices ?? false;
  const effectiveWidth =
    layoutWidth ?? CABLE_LAYOUT.width;
  const centerX = effectiveWidth / 2;

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

  const activeConnections = orderedFiberConnections(graph).filter(
    (c) => !hiddenPairIds.has(c.id),
  );
  const rowCount = activeConnections.length;
  const diagramScale = computeDiagramScale(rowCount);

  const rowOffsets = connectionRowOffsets(
    graph,
    visualCables,
    dominant,
    hiddenPairIds.size > 0 ? hiddenPairIds : undefined,
  );

  const layout = computeDiagramLayout(
    graph,
    visualCables,
    placement,
    dominant,
    layoutWidth,
    hiddenPairIds.size > 0 ? hiddenPairIds : undefined,
  );
  const positions = nodePositionsForGraph(graph, layout, overrides, {
    refreshColumnX: buildOptions?.refreshColumnX,
  });

  resolveSameSideNodeCollisions(
    visualCables,
    placement,
    positions,
    diagramScale,
  );

  for (const vc of visualCables) {
    const pos = positions[`cable-${vc.id}`];
    if (!pos) continue;
    const displaySide = displaySideFromCanvasX(pos.x, centerX);
    vc.side = displaySide;
    const p = placement.get(vc.id);
    if (p) {
      placement.set(vc.id, { ...p, side: displaySide });
    }
  }

  const sideStemAlign = computeSideStemAlignment(
    visualCables.map((vc) => ({ tubes: vc.tubes, side: vc.side })),
    CABLE_LAYOUT.fiberRowH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
    diagramScale,
  );

  const sideCircuitSpan = computeSideCircuitLabelSpans(
    visualCables,
    (vc) => vc.side,
  );

  const nodes: Node[] = [];
  const edges: Edge[] = [];

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
        nodeHeight: nodeHeightForVisualCable(vc, collapsedTubes),
        fiberPitch: CABLE_LAYOUT.fiberRowH,
        diagramScale,
        alignedStemX: sideStemAlign[vc.side],
        spliceNumber: graph.report.header.spliceNumber,
        collapsedTubes,
      } satisfies CableNodeData,
      draggable: true,
    });
  }

  const laneCount = activeConnections.length;

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
        rowOffset: rowOffsets.get(conn.id) ?? 0,
        sideCircuitSpan,
        tubeBundleKey: spliceTubeBundleKey(
          source.visualCableId,
          source.endpoint.tubeColor,
          target.visualCableId,
        ),
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
    const rowOffset = Math.min(
      ...tube.pairIds.map((id) => rowOffsets.get(id) ?? 0),
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
        rowOffset,
        sideCircuitSpan,
      },
    });
  }

  const xBounds = computeCableXBounds(
    visualCables,
    placement,
    effectiveWidth,
  );

  return { nodes, edges, layout, xBounds };
}
