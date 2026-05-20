import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import {
  CABLE_LAYOUT,
  fiberRowOffsetInCable,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { orderedFiberConnections } from "@/features/diagram/buildConnectionGraph";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph, LayoutOverrides } from "@/types/splice";

export const LAYOUT = {
  width: CABLE_LAYOUT.width,
  centerX: CABLE_LAYOUT.width / 2,
  leftCableX: CABLE_LAYOUT.leftX,
  rightCableX: CABLE_LAYOUT.rightX,
  startY: CABLE_LAYOUT.topY,
} as const;

export type DiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cablePositions: Map<string, { x: number; y: number; height: number }>;
};

export const LAYOUT_STORAGE_PREFIX = "splice-detail-layout:";

export function reportStorageKey(graph: ConnectionGraph): string {
  const name =
    graph.report.header.spliceNumber ??
    graph.report.header.name ??
    "splice";
  return `${LAYOUT_STORAGE_PREFIX}${name}`;
}

export function computeDiagramLayout(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
): DiagramLayout {
  const rowYs = new Map<string, number>();
  const cablePositions = new Map<
    string,
    { x: number; y: number; height: number }
  >();

  const leftCables = visualCables
    .filter((vc) => (placement.get(vc.id)?.side ?? vc.side) === "left")
    .sort(
      (a, b) =>
        (placement.get(a.id)?.order ?? 0) - (placement.get(b.id)?.order ?? 0),
    );
  const rightCables = visualCables
    .filter((vc) => (placement.get(vc.id)?.side ?? vc.side) === "right")
    .sort(
      (a, b) =>
        (placement.get(a.id)?.order ?? 0) - (placement.get(b.id)?.order ?? 0),
    );

  let leftY = CABLE_LAYOUT.topY;
  for (const vc of leftCables) {
    const h = visualCableHeight(vc);
    cablePositions.set(vc.id, { x: CABLE_LAYOUT.leftX, y: leftY, height: h });
    for (const tube of vc.tubes) {
      for (const fiber of tube.fibers) {
        rowYs.set(fiber.connectionId, leftY + fiberRowOffsetInCable(vc, fiber.connectionId));
      }
    }
    leftY += h + CABLE_LAYOUT.cableGap;
  }

  let rightY = CABLE_LAYOUT.topY;
  for (const vc of rightCables) {
    const h = visualCableHeight(vc);
    cablePositions.set(vc.id, {
      x: CABLE_LAYOUT.rightX,
      y: rightY,
      height: h,
    });
    for (const tube of vc.tubes) {
      for (const fiber of tube.fibers) {
        const absY = rightY + fiberRowOffsetInCable(vc, fiber.connectionId);
        const prev = rowYs.get(fiber.connectionId);
        rowYs.set(
          fiber.connectionId,
          prev !== undefined ? (prev + absY) / 2 : absY,
        );
      }
    }
    rightY += h + CABLE_LAYOUT.cableGap;
  }

  const fibers = orderedFiberConnections(graph);
  fibers.forEach((conn, index) => {
    if (!rowYs.has(conn.id)) {
      rowYs.set(conn.id, CABLE_LAYOUT.topY + index * CABLE_LAYOUT.fiberRowH);
    }
  });

  return {
    reportKey: reportStorageKey(graph),
    rowYs,
    cablePositions,
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
  _graph: ConnectionGraph,
  layout: DiagramLayout,
  overrides?: LayoutOverrides,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [id, pos] of layout.cablePositions) {
    positions[`cable-${id}`] = { x: pos.x, y: pos.y };
  }
  return applyLayoutOverrides(positions, overrides);
}
