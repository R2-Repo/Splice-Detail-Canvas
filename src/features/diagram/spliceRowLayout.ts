import { connectionsInRowLayoutOrder } from "@/features/diagram/connectionRowOrder";
import type { CableXBounds } from "@/features/diagram/cableLayoutMetrics";
import {
  BREAKOUT,
  computeSheathSize,
} from "@/features/diagram/cableBreakoutGeometry";
import {
  CABLE_LAYOUT,
  cableXForSide,
  cableNodeLayoutHeight,
  fiberRowOffsetInCable,
  fiberRowYFromOffset,
} from "@/features/diagram/cableLayoutMetrics";
import { connectionRowOffsets } from "@/features/diagram/connectionRowOrder";
import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import {
  parentVisualGroupKey,
  visualGroupForConnection,
  type DominantCablePair,
} from "@/features/diagram/dominantCablePair";
import { orderedFiberConnections } from "@/features/diagram/buildConnectionGraph";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph } from "@/types/splice";

const HIGH_COUNT_PAIR_THRESHOLD = 4;

export type AlignedDiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cablePositions: Map<string, { x: number; y: number; height: number }>;
  layoutWidth: number;
};

export function estimatedCableNodeWidth(
  maxTubeCount = 3,
  scale = 1,
  tubeCounts?: number[],
): number {
  const counts =
    tubeCounts && tubeCounts.length > 0
      ? tubeCounts
      : [Math.max(1, maxTubeCount)];
  const maxStem = Math.max(
    ...counts.map((tubeCount) => {
      const sheath = computeSheathSize(scale, tubeCount);
      const tubeLength =
        (BREAKOUT.tubeLengthBase +
          Math.max(0, tubeCount - 1) * BREAKOUT.tubeLengthPerMultiTube) *
        scale;
      return sheath.width + tubeLength + BREAKOUT.fiberStemGap;
    }),
  );
  return maxStem + BREAKOUT.fiberLabelWidth;
}

export function computeCableXBounds(
  visualCables: VisualCable[],
  _placement: Map<string, CablePlacement>,
  layoutWidth: number = CABLE_LAYOUT.width,
): CableXBounds {
  const margin = CABLE_LAYOUT.leftX;
  const maxTubes = Math.max(1, ...visualCables.map((vc) => vc.tubes.length));
  const nodeWidth = estimatedCableNodeWidth(
    maxTubes,
    1,
    visualCables.map((vc) => vc.tubes.length),
  );
  const width = Math.max(layoutWidth, CABLE_LAYOUT.width);
  const leftX = margin;
  const rightX = Math.max(leftX + nodeWidth + 200, width - margin - nodeWidth);
  return { leftX, rightX };
}

function sideOfPlacement(
  vc: VisualCable,
  placement: Map<string, CablePlacement>,
): "left" | "right" {
  return placement.get(vc.id)?.side ?? vc.side;
}

function orderOfPlacement(
  vc: VisualCable,
  placement: Map<string, CablePlacement>,
): number {
  return placement.get(vc.id)?.order ?? vc.order;
}

/** Push same-side cable nodes apart so rendered boxes never overlap. */
export function resolveSameSideStackCollisions(
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  cablePositions: Map<string, { x: number; y: number; height: number }>,
  heightFor: (vc: VisualCable) => number = (vc) => cableNodeLayoutHeight(vc),
  minGap = CABLE_LAYOUT.cableGap,
): void {
  for (const side of ["left", "right"] as const) {
    const cables = visualCables
      .filter((vc) => sideOfPlacement(vc, placement) === side)
      .sort((a, b) => {
        const ay = cablePositions.get(a.id)?.y ?? 0;
        const by = cablePositions.get(b.id)?.y ?? 0;
        return (
          ay - by ||
          orderOfPlacement(a, placement) - orderOfPlacement(b, placement)
        );
      });

    let stackBottom = Number.NEGATIVE_INFINITY;
    for (const vc of cables) {
      const pos = cablePositions.get(vc.id);
      if (!pos) continue;
      const h = heightFor(vc);
      const nodeY = Math.max(pos.y, stackBottom);
      cablePositions.set(vc.id, { ...pos, y: nodeY, height: h });
      stackBottom = nodeY + h + minGap;
    }
  }
}

export function resolveSameSideNodeCollisions(
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  positions: Record<string, { x: number; y: number }>,
  scale = 1,
): void {
  for (const side of ["left", "right"] as const) {
    const cables = visualCables
      .filter((vc) => sideOfPlacement(vc, placement) === side)
      .sort((a, b) => {
        const ay = positions[`cable-${a.id}`]?.y ?? 0;
        const by = positions[`cable-${b.id}`]?.y ?? 0;
        return (
          ay - by ||
          orderOfPlacement(a, placement) - orderOfPlacement(b, placement)
        );
      });

    let stackBottom = Number.NEGATIVE_INFINITY;
    for (const vc of cables) {
      const nodeId = `cable-${vc.id}`;
      const pos = positions[nodeId];
      if (!pos) continue;
      const h = cableNodeLayoutHeight(vc, scale);
      const nodeY = Math.max(pos.y, stackBottom);
      positions[nodeId] = { ...pos, y: nodeY };
      stackBottom = nodeY + h + CABLE_LAYOUT.cableGap;
    }
  }
}

type CablePairGroup = {
  leftGroupKey: string;
  rightGroupKey: string;
  connectionCount: number;
};

function findHighCountCablePairs(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  dominant?: DominantCablePair | null,
  minCount = HIGH_COUNT_PAIR_THRESHOLD,
): CablePairGroup[] {
  const counts = new Map<string, CablePairGroup>();
  for (const conn of orderedFiberConnections(graph)) {
    const leftGroup = visualGroupForConnection(visualCables, conn.id, "left");
    const rightGroup = visualGroupForConnection(visualCables, conn.id, "right");
    if (!leftGroup || !rightGroup) continue;
    if (
      dominant &&
      leftGroup === dominant.leftGroupKey &&
      rightGroup === dominant.rightGroupKey
    ) {
      continue;
    }
    const key = `${leftGroup}\0${rightGroup}`;
    const entry = counts.get(key) ?? {
      leftGroupKey: leftGroup,
      rightGroupKey: rightGroup,
      connectionCount: 0,
    };
    entry.connectionCount += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].filter((g) => g.connectionCount >= minCount);
}

function applyHighCountPairAlignment(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  rowYs: Map<string, number>,
  cablePositions: Map<string, { x: number; y: number; height: number }>,
  groups: CablePairGroup[],
): void {
  for (const group of groups) {
    const leftVc = visualCables.find(
      (v) =>
        parentVisualGroupKey(v.id) === group.leftGroupKey &&
        (placement.get(v.id)?.side ?? v.side) === "left",
    );
    const rightVc = visualCables.find(
      (v) =>
        parentVisualGroupKey(v.id) === group.rightGroupKey &&
        (placement.get(v.id)?.side ?? v.side) === "right",
    );
    if (!leftVc || !rightVc) continue;

    const anchorConn = orderedFiberConnections(graph).find((conn) => {
      const lg = visualGroupForConnection(visualCables, conn.id, "left");
      const rg = visualGroupForConnection(visualCables, conn.id, "right");
      return lg === group.leftGroupKey && rg === group.rightGroupKey;
    });
    if (!anchorConn) continue;

    const rowY = rowYs.get(anchorConn.id);
    if (rowY === undefined) continue;

    const leftPos = cablePositions.get(leftVc.id);
    const rightPos = cablePositions.get(rightVc.id);
    if (!leftPos || !rightPos) continue;

    const leftOffset = fiberRowOffsetInCable(leftVc, anchorConn.id);
    const rightOffset = fiberRowOffsetInCable(rightVc, anchorConn.id);
    const targetLeftY = rowY - leftOffset;
    const targetRightY = rowY - rightOffset;

    cablePositions.set(leftVc.id, { ...leftPos, y: targetLeftY });
    cablePositions.set(rightVc.id, { ...rightPos, y: targetRightY });
  }
}

export function computeAlignedLayout(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
  dominant?: DominantCablePair | null,
  layoutWidth?: number,
  excludeConnectionIds?: ReadonlySet<string>,
): AlignedDiagramLayout {
  const rowYs = new Map<string, number>();
  const cablePositions = new Map<
    string,
    { x: number; y: number; height: number }
  >();

  const sorted = connectionsInRowLayoutOrder(
    graph,
    visualCables,
    dominant,
    excludeConnectionIds,
  );
  const rowOffsets = connectionRowOffsets(
    graph,
    visualCables,
    dominant,
    excludeConnectionIds,
  );

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
      const h = cableNodeLayoutHeight(vc);
      const x = cableXForSide(side, vc.tubes.length, xBounds);
      cablePositions.set(vc.id, { x, y: nodeY, height: h });
      stackBottom = nodeY + h + CABLE_LAYOUT.cableGap;
    }
  };

  placeSide(leftCables, "left");
  placeSide(rightCables, "right");

  resolveSameSideStackCollisions(
    visualCables,
    placement,
    cablePositions,
  );

  const highCountPairs = findHighCountCablePairs(
    graph,
    visualCables,
    dominant,
  );
  if (highCountPairs.length > 0) {
    applyHighCountPairAlignment(
      graph,
      visualCables,
      placement,
      rowYs,
      cablePositions,
      highCountPairs,
    );
    placeSide(leftCables, "left");
    placeSide(rightCables, "right");
    resolveSameSideStackCollisions(
      visualCables,
      placement,
      cablePositions,
    );
  }

  return {
    reportKey: "",
    rowYs,
    cablePositions,
    layoutWidth: effectiveWidth,
  };
}
