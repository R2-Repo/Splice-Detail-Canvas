import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import { CABLE_LAYOUT } from "@/features/diagram/cableLayoutMetrics";
import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import { computeAlignedLayout } from "@/features/diagram/spliceRowLayout";
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
  dominant?: DominantCablePair | null,
  layoutWidth?: number,
): DiagramLayout {
  const aligned = computeAlignedLayout(
    graph,
    visualCables,
    placement,
    dominant,
    layoutWidth,
  );
  return {
    reportKey: reportStorageKey(graph),
    rowYs: aligned.rowYs,
    cablePositions: aligned.cablePositions,
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
