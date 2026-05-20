import {
  cableLegIdForEndpoint,
  orderedFiberConnections,
  pairEndpointsForSide,
} from "@/features/diagram/buildConnectionGraph";
import { tubeNodeId } from "@/features/diagram/tubeId";
import type { ConnectionGraph, LayoutOverrides } from "@/types/splice";

export const LAYOUT = {
  width: 1100,
  centerX: 550,
  leftCableX: 48,
  rightCableX: 1052,
  startY: 120,
  rowGap: 72,
  tubeOffsetX: 120,
  fiberInsetX: 280,
  spliceGap: 24,
} as const;

export type DiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cableYs: Map<string, number>;
};

export const LAYOUT_STORAGE_PREFIX = "splice-detail-layout:";

export function reportStorageKey(graph: ConnectionGraph): string {
  const name =
    graph.report.header.spliceNumber ??
    graph.report.header.name ??
    "splice";
  return `${LAYOUT_STORAGE_PREFIX}${name}`;
}

export function computeDiagramLayout(graph: ConnectionGraph): DiagramLayout {
  const fibers = orderedFiberConnections(graph);
  const sorted = [...fibers].sort((a, b) => {
    const aEnds = pairEndpointsForSide(a.pair, graph);
    const bEnds = pairEndpointsForSide(b.pair, graph);
    const aKey = `${aEnds.left.fiberNumber}-${aEnds.left.fiberColor}`;
    const bKey = `${bEnds.left.fiberNumber}-${bEnds.left.fiberColor}`;
    return aKey.localeCompare(bKey);
  });

  const rowYs = new Map<string, number>();
  sorted.forEach((conn, index) => {
    rowYs.set(conn.id, LAYOUT.startY + index * LAYOUT.rowGap);
  });

  const cableYs = new Map<string, number>();
  const leftLegs = graph.legs.filter((l) => l.side === "left");
  const rightLegs = graph.legs.filter((l) => l.side === "right");
  const midY =
    LAYOUT.startY + ((Math.max(sorted.length, 1) - 1) * LAYOUT.rowGap) / 2;

  for (const leg of leftLegs) cableYs.set(leg.id, midY);
  for (const leg of rightLegs) cableYs.set(leg.id, midY);

  return {
    reportKey: reportStorageKey(graph),
    rowYs,
    cableYs,
  };
}

export function applyLayoutOverrides(
  positions: Record<string, { x: number; y: number }>,
  overrides?: LayoutOverrides,
): Record<string, { x: number; y: number }> {
  if (!overrides?.positions) return positions;
  return { ...positions, ...overrides.positions };
}

export function nodePositionsForGraph(
  graph: ConnectionGraph,
  layout: DiagramLayout,
  overrides?: LayoutOverrides,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  for (const leg of graph.legs) {
    const id = `cable-${leg.id}`;
    const x = leg.side === "left" ? LAYOUT.leftCableX : LAYOUT.rightCableX;
    const y = layout.cableYs.get(leg.id) ?? LAYOUT.startY;
    positions[id] = { x, y };
  }

  const tubeRowYs = new Map<string, number[]>();

  for (const conn of graph.connections) {
    if (conn.kind === "tube") {
      const y = LAYOUT.startY;
      const leftTubeId = tubeNodeId(conn.endpointA.legId, conn.endpointA.tubeColor);
      const rightTubeId = tubeNodeId(conn.endpointB.legId, conn.endpointB.tubeColor);
      positions[leftTubeId] = {
        x: LAYOUT.leftCableX + LAYOUT.tubeOffsetX,
        y,
      };
      positions[rightTubeId] = {
        x: LAYOUT.rightCableX - LAYOUT.tubeOffsetX,
        y,
      };
      positions[`splice-${conn.id}`] = { x: LAYOUT.centerX, y };
      continue;
    }

    const rowY = layout.rowYs.get(conn.id) ?? LAYOUT.startY;
    const ends = pairEndpointsForSide(conn.pair, graph);
    const leftLeg = cableLegIdForEndpoint(ends.left);
    const rightLeg = cableLegIdForEndpoint(ends.right);

    const leftTubeId = tubeNodeId(leftLeg, ends.left.tubeColor);
    const rightTubeId = tubeNodeId(rightLeg, ends.right.tubeColor);
    const leftFiberId = `fiber-${conn.id}-L`;
    const rightFiberId = `fiber-${conn.id}-R`;

    recordTubeRow(tubeRowYs, leftTubeId, rowY);
    recordTubeRow(tubeRowYs, rightTubeId, rowY);

    positions[leftFiberId] = {
      x: LAYOUT.centerX - LAYOUT.fiberInsetX,
      y: rowY,
    };
    positions[rightFiberId] = {
      x: LAYOUT.centerX + LAYOUT.fiberInsetX,
      y: rowY,
    };
  }

  for (const [tubeId, ys] of tubeRowYs) {
    const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
    const side = tubeSideFromNodeId(graph, tubeId);
    positions[tubeId] = {
      x:
        side === "left"
          ? LAYOUT.leftCableX + LAYOUT.tubeOffsetX
          : LAYOUT.rightCableX - LAYOUT.tubeOffsetX,
      y: avgY - 20,
    };
  }

  return applyLayoutOverrides(positions, overrides);
}

function recordTubeRow(map: Map<string, number[]>, tubeId: string, rowY: number) {
  const list = map.get(tubeId) ?? [];
  list.push(rowY);
  map.set(tubeId, list);
}

function tubeSideFromNodeId(
  graph: ConnectionGraph,
  tubeId: string,
): "left" | "right" {
  const inner = tubeId.startsWith("tube-") ? tubeId.slice(5) : tubeId;
  const sep = inner.lastIndexOf("|");
  if (sep < 0) return "left";
  const legId = inner.slice(0, sep);
  return graph.legs.find((l) => l.id === legId)?.side ?? "left";
}
