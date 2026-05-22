import { connectionsInRowLayoutOrder } from "@/features/diagram/connectionRowOrder";
import type { CableXBounds } from "@/features/diagram/cableLayoutMetrics";
import {
  CABLE_LAYOUT,
  cableXForSide,
  fiberRowOffsetInCable,
  fiberRowYFromOffset,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { connectionRowOffsets } from "@/features/diagram/connectionRowOrder";
import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph } from "@/types/splice";

export type AlignedDiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cablePositions: Map<string, { x: number; y: number; height: number }>;
};

const EXTRA_SPACING_PER_CABLE = 32;
const MAX_EXTRA_SPACING = 640;

function extraSpacingForCount(count: number): number {
  const over = Math.max(0, count - 3);
  return Math.min(MAX_EXTRA_SPACING, over * EXTRA_SPACING_PER_CABLE);
}

export function computeCableXBounds(
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  layoutWidth: number = CABLE_LAYOUT.width,
): CableXBounds {
  const widthBias = Math.max(0, visualCables.length - 2) * 120;
  const width = Math.max(
    layoutWidth,
    CABLE_LAYOUT.width + widthBias,
  );
  const centerX = width / 2;
  const baseCenter = CABLE_LAYOUT.width / 2;
  const baseLeftSpacing = baseCenter - CABLE_LAYOUT.leftX;
  const baseRightSpacing = CABLE_LAYOUT.rightX - baseCenter;
  const widthDelta = width - CABLE_LAYOUT.width;
  const extraWidth = widthDelta / 2;
  const sideOf = (vc: VisualCable) =>
    placement.get(vc.id)?.side ?? vc.side;
  const leftCount = visualCables.filter((vc) => sideOf(vc) === "left").length;
  const rightCount = visualCables.filter((vc) => sideOf(vc) === "right")
    .length;
  const leftSpacing =
    baseLeftSpacing + extraSpacingForCount(leftCount) + extraWidth;
  const rightSpacing =
    baseRightSpacing + extraSpacingForCount(rightCount) + extraWidth;
  const leftX = Math.max(4, centerX - leftSpacing);
  const rightX = Math.min(width - 4, centerX + rightSpacing);
  return { leftX, rightX };
}

export function computeAlignedLayout(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  dominant?: DominantCablePair | null,
  layoutWidth?: number,
): AlignedDiagramLayout {
  const rowYs = new Map<string, number>();
  const cablePositions = new Map<
    string,
    { x: number; y: number; height: number }
  >();

  const sorted = connectionsInRowLayoutOrder(graph, visualCables, dominant);
  const rowOffsets = connectionRowOffsets(graph, visualCables, dominant);

  for (const conn of sorted) {
    rowYs.set(
      conn.id,
      fiberRowYFromOffset(rowOffsets.get(conn.id) ?? 0),
    );
  }

  const sideOf = (vc: VisualCable) =>
    placement.get(vc.id)?.side ?? vc.side;
  const orderOf = (vc: VisualCable) =>
    placement.get(vc.id)?.order ?? vc.order;

  const leftCables = visualCables
    .filter((vc) => sideOf(vc) === "left")
    .sort((a, b) => orderOf(a) - orderOf(b));
  const rightCables = visualCables
    .filter((vc) => sideOf(vc) === "right")
    .sort((a, b) => orderOf(a) - orderOf(b));

  const xBounds = computeCableXBounds(visualCables, placement, layoutWidth);

  const alignedNodeY = (vc: VisualCable): number => {
    let nodeY: number | undefined;
    for (const tube of vc.tubes) {
      for (const fiber of tube.fibers) {
        const targetY = rowYs.get(fiber.connectionId);
        if (targetY === undefined) continue;
        const offset = fiberRowOffsetInCable(vc, fiber.connectionId);
        const candidate = targetY - offset;
        nodeY =
          nodeY === undefined ? candidate : Math.min(nodeY, candidate);
      }
    }
    return nodeY ?? CABLE_LAYOUT.topY;
  };

  /** Stack same-side cables by placement order so wide nodes do not overlap. */
  const placeSide = (cables: VisualCable[], side: "left" | "right") => {
    let stackBottom = Number.NEGATIVE_INFINITY;
    for (const vc of cables) {
      const nodeY = Math.max(alignedNodeY(vc), stackBottom);
      const h = visualCableHeight(vc);
      const x = cableXForSide(side, vc.tubes.length, xBounds);
      cablePositions.set(vc.id, { x, y: nodeY, height: h });
      stackBottom = nodeY + h + CABLE_LAYOUT.cableGap;
    }
  };

  placeSide(leftCables, "left");
  placeSide(rightCables, "right");

  return {
    reportKey: "",
    rowYs,
    cablePositions,
  };
}
