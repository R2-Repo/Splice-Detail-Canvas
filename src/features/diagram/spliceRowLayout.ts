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
  layoutWidth: number;
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
  const widthBias = Math.max(0, visualCables.length - 2) * 400;
  const subjectWidth = layoutWidth ?? CABLE_LAYOUT.width;
  const width = Math.max(subjectWidth, CABLE_LAYOUT.width + widthBias);
  const sideOf = (vc: VisualCable) =>
    placement.get(vc.id)?.side ?? vc.side;
  const leftCount = visualCables.filter((vc) => sideOf(vc) === "left").length;
  const rightCount = visualCables.filter((vc) => sideOf(vc) === "right")
    .length;
  const extraLeft = extraSpacingForCount(leftCount) * 2;
  const extraRight = extraSpacingForCount(rightCount) * 2;
  const centerX = width / 2;
  const baseSideGap = Math.max(20, centerX / 6);
  const spread = baseSideGap + Math.max(extraLeft, extraRight);
  const expand = Math.max(width - CABLE_LAYOUT.width, 0);
  const leftMaxShift = Math.min(expand / 2, CABLE_LAYOUT.leftX - 2);
  const rightMaxShift = Math.min(
    expand / 2,
    width - CABLE_LAYOUT.rightX - 2,
  );
  const leftEdgeX = CABLE_LAYOUT.leftX - leftMaxShift;
  const rightEdgeX = CABLE_LAYOUT.rightX + rightMaxShift;
  const leftX = Math.max(2, Math.min(leftEdgeX, centerX - spread));
  const rightX = Math.min(width - 2, Math.max(rightEdgeX, centerX + spread));
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

  const effectiveWidth = layoutWidth ?? CABLE_LAYOUT.width;
  const xBounds = computeCableXBounds(
    visualCables,
    placement,
    effectiveWidth,
  );

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
    layoutWidth: effectiveWidth,
  };
}
