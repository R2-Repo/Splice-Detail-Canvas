import { useEffect, useLayoutEffect, useReducer } from "react";

import {
  SPLICE_LANE_SEP,
  SPLICE_ROUTING_END_MARGIN,
  MIN_SPLICE_HORIZONTAL_INSET,
  fiberRowPrefixWidth,
  CABLE_LAYOUT,
  FIBER_ROW_PITCH,
  fiberRowOffsetInCable,
} from "@/features/diagram/cableLayoutMetrics";
import type { SideCircuitLabelSpan } from "@/features/diagram/cableLabels";
import { computeCableBreakout } from "@/features/diagram/cableBreakoutGeometry";
import type { VisualCable } from "@/features/diagram/visualCables";

export type SpliceEdgeRouteEntry = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  fallbackLane: number;
  /** Global row offset (px) — drives proportional center spacing with tube gaps. */
  rowOffset?: number;
  /** Same source tube + target cable — fibers share one center lane. */
  tubeBundleKey?: string;
};

/** Rank 0 = highest (smallest row offset / sourceY) on the left cable. */
export function sortSpliceRouteEntries(
  entries: SpliceEdgeRouteEntry[],
): SpliceEdgeRouteEntry[] {
  return [...entries].sort(
    (a, b) =>
      (a.rowOffset ?? a.fallbackLane) - (b.rowOffset ?? b.fallbackLane) ||
      a.fallbackLane - b.fallbackLane ||
      a.sourceY - b.sourceY ||
      a.targetY - b.targetY ||
      a.id.localeCompare(b.id),
  );
}

export const SPLICE_PATH_EPS = 0.5;

/**
 * When the diagram-right endpoint sits below diagram-left, upper fibers bend
 * farther toward the target so horizontal legs do not cross vertical legs.
 * Works when either endpoint is dragged to the opposite screen side.
 */
export function spliceMidOrderInverts(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): boolean {
  const leftY = sourceX <= targetX ? sourceY : targetY;
  const rightY = sourceX <= targetX ? targetY : sourceY;
  return rightY > leftY + SPLICE_PATH_EPS;
}

export function effectiveRoutingLane(
  rank: number,
  laneCount: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): number {
  if (laneCount <= 1) return 0;
  if (spliceMidOrderInverts(sourceX, sourceY, targetX, targetY)) {
    return laneCount - 1 - rank;
  }
  return rank;
}

export function routingLaneFromEntries(
  entries: SpliceEdgeRouteEntry[],
  edgeId: string,
): number {
  const sorted = sortSpliceRouteEntries(entries);
  const laneCount = sorted.length;
  const rank = sorted.findIndex((e) => e.id === edgeId);
  if (rank < 0) return 0;
  const entry = sorted[rank]!;
  return effectiveRoutingLane(
    rank,
    laneCount,
    entry.sourceX,
    entry.sourceY,
    entry.targetX,
    entry.targetY,
  );
}

export type SpliceRouteTemplate =
  | "straight"
  | "same_side"
  | "hv_demarcated";

/** True when handle X is shared — same-side splices need an inward center detour. */
export function isSameColumnSplice(
  sourceX: number,
  targetX: number,
): boolean {
  return Math.abs(sourceX - targetX) <= SPLICE_PATH_EPS;
}

/** +1 = route toward increasing X; -1 = toward decreasing X. */
export function inwardSignForColumn(
  columnX: number,
  diagramCenterX: number,
): 1 | -1 {
  return columnX <= diagramCenterX ? 1 : -1;
}

export function templateUsesMidXLanes(template: SpliceRouteTemplate): boolean {
  return template === "hv_demarcated" || template === "same_side";
}

export function defaultSideCircuitLabelSpan(): SideCircuitLabelSpan {
  const prefix = fiberRowPrefixWidth();
  return { left: prefix, right: prefix };
}

export function canvasSideForHandle(
  handleX: number,
  diagramCenterX: number,
): "left" | "right" {
  return handleX <= diagramCenterX ? "left" : "right";
}

export function circuitLabelSpanForSide(
  side: "left" | "right",
  sideSpans: SideCircuitLabelSpan,
): number {
  return side === "left" ? sideSpans.left : sideSpans.right;
}

/** Minimum horizontal run from handle: past OS column, then inward jog. */
export function minHorizontalRunFromHandle(
  handleX: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan,
  jog = MIN_SPLICE_HORIZONTAL_INSET,
): number {
  const side = canvasSideForHandle(handleX, diagramCenterX);
  return circuitLabelSpanForSide(side, sideSpans) + jog;
}

/** Feasible midX range: each handle gets label span + jog before the vertical leg. */
export function spliceMidXInsetBounds(
  sourceX: number,
  targetX: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan,
  jog = MIN_SPLICE_HORIZONTAL_INSET,
): { lo: number; hi: number } {
  let lo = Number.NEGATIVE_INFINITY;
  let hi = Number.POSITIVE_INFINITY;

  for (const handleX of [sourceX, targetX]) {
    const side = canvasSideForHandle(handleX, diagramCenterX);
    const run = circuitLabelSpanForSide(side, sideSpans) + jog;
    if (side === "left") {
      lo = Math.max(lo, handleX + run);
    } else {
      hi = Math.min(hi, handleX - run);
    }
  }

  return { lo, hi };
}

/** @deprecated use spliceMidXInsetBounds with side circuit spans */
export function minHorizontalInsetBounds(
  sourceX: number,
  targetX: number,
  minInset = MIN_SPLICE_HORIZONTAL_INSET,
): { lo: number; hi: number } {
  const spans = defaultSideCircuitLabelSpan();
  const centerX = (sourceX + targetX) / 2;
  return spliceMidXInsetBounds(sourceX, targetX, centerX, spans, minInset);
}

export function sourceHorizontalLeg(midX: number, sourceX: number): number {
  return Math.abs(midX - sourceX);
}

export function targetHorizontalLeg(midX: number, targetX: number): number {
  return Math.abs(targetX - midX);
}

export function horizontalInsetOkFromHandle(
  midX: number,
  handleX: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan,
  jog = MIN_SPLICE_HORIZONTAL_INSET,
): boolean {
  const side = canvasSideForHandle(handleX, diagramCenterX);
  const run = circuitLabelSpanForSide(side, sideSpans) + jog;
  if (side === "left") return midX >= handleX + run - SPLICE_PATH_EPS;
  return midX <= handleX - run + SPLICE_PATH_EPS;
}

/** Push midX toward center until both legs clear OS labels + inward jog. */
export function clampMidXForMinHorizontalInset(
  midX: number,
  sourceX: number,
  targetX: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan = defaultSideCircuitLabelSpan(),
  jog = MIN_SPLICE_HORIZONTAL_INSET,
): number {
  const { lo, hi } = spliceMidXInsetBounds(
    sourceX,
    targetX,
    diagramCenterX,
    sideSpans,
    jog,
  );
  if (lo > hi + SPLICE_PATH_EPS) {
    return (sourceX + targetX) / 2;
  }
  return Math.max(lo, Math.min(hi, midX));
}

/** Pick route shape from handle coordinates (handle → handle span). */
export function pickSpliceRouteTemplate(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): SpliceRouteTemplate {
  if (Math.abs(sourceY - targetY) <= SPLICE_PATH_EPS) return "straight";
  if (isSameColumnSplice(sourceX, targetX)) return "same_side";
  return "hv_demarcated";
}

export function parseOrthogonalPathPoints(
  path: string,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const re = /[ML]\s*([-\d.]+),([-\d.]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(path)) !== null) {
    points.push({ x: Number(match[1]), y: Number(match[2]) });
  }
  return points;
}

/** Count 90° direction changes across one or more orthogonal path strings. */
export function countOrthogonalBends(...paths: string[]): number {
  const points: Array<{ x: number; y: number }> = [];
  for (const path of paths) {
    points.push(...parseOrthogonalPathPoints(path));
  }
  if (points.length < 3) return 0;

  let bends = 0;
  for (let i = 2; i < points.length; i++) {
    const prev = points[i - 2]!;
    const mid = points[i - 1]!;
    const curr = points[i]!;
    const dx1 = mid.x - prev.x;
    const dy1 = mid.y - prev.y;
    const dx2 = curr.x - mid.x;
    const dy2 = curr.y - mid.y;
    if (Math.abs(dx1) <= SPLICE_PATH_EPS && Math.abs(dy1) <= SPLICE_PATH_EPS) {
      continue;
    }
    if (Math.abs(dx2) <= SPLICE_PATH_EPS && Math.abs(dy2) <= SPLICE_PATH_EPS) {
      continue;
    }
    const horiz1 = Math.abs(dy1) <= SPLICE_PATH_EPS;
    const horiz2 = Math.abs(dy2) <= SPLICE_PATH_EPS;
    const vert1 = Math.abs(dx1) <= SPLICE_PATH_EPS;
    const vert2 = Math.abs(dx2) <= SPLICE_PATH_EPS;
    if ((horiz1 && vert2) || (vert1 && horiz2)) bends += 1;
  }
  return bends;
}

function inwardAnchorFromColumn(
  columnX: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan,
  laneOffsetPx = 0,
): number {
  const inward = inwardSignForColumn(columnX, diagramCenterX);
  const side = canvasSideForHandle(columnX, diagramCenterX);
  const run =
    circuitLabelSpanForSide(side, sideSpans) +
    MIN_SPLICE_HORIZONTAL_INSET +
    laneOffsetPx;
  return columnX + inward * run;
}

export function resolveSpliceMidX(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  options: {
    rowOffset?: number;
    maxRowOffset?: number;
    routingLane?: number;
    laneCount?: number;
    diagramCenterX?: number;
    sideCircuitSpan?: SideCircuitLabelSpan;
  } = {},
): number {
  const sideSpans = options.sideCircuitSpan ?? defaultSideCircuitLabelSpan();
  const centerX = options.diagramCenterX ?? (sourceX + targetX) / 2;
  const template = pickSpliceRouteTemplate(sourceX, sourceY, targetX, targetY);
  if (template === "straight") {
    return (sourceX + targetX) / 2;
  }
  if (template === "same_side") {
    const columnX = (sourceX + targetX) / 2;
    const { routingLane = 0 } = options;
    const raw = inwardAnchorFromColumn(
      columnX,
      centerX,
      sideSpans,
      routingLane * SPLICE_LANE_SEP,
    );
    return clampMidXForMinHorizontalInset(
      raw,
      sourceX,
      targetX,
      centerX,
      sideSpans,
    );
  }
  const { rowOffset, maxRowOffset, routingLane = 0, laneCount = 1 } = options;
  let midX: number;
  if (
    rowOffset !== undefined &&
    maxRowOffset !== undefined &&
    maxRowOffset > 0
  ) {
    midX = spliceMidXFromRowOffset(
      sourceX,
      targetX,
      rowOffset,
      maxRowOffset,
      sourceY,
      targetY,
    );
  } else {
    midX = spliceMidX(sourceX, targetX, routingLane, laneCount);
  }
  return clampMidXForMinHorizontalInset(
    midX,
    sourceX,
    targetX,
    centerX,
    sideSpans,
  );
}

export type SplicePathResult = {
  leftPath: string;
  rightPath: string;
  spliceX: number;
  spliceY: number;
  bendCount: number;
  template: SpliceRouteTemplate;
};

export type SpliceRoutingLane = {
  midX: number;
  /** Shared inward trunk X for tube bundles — optional H stub before vertical lane. */
  jogX?: number;
  /** Distinct Y for source-side horizontal legs when same-row paths would stack. */
  sourceHorizY?: number;
  /** Distinct Y for target-side horizontal legs when same-row paths would stack. */
  targetHorizY?: number;
};

export const MAX_SPLICE_BENDS = 2;

/** Max bends when a tube bundle uses a shared horizontal trunk before lane spread. */
export const MAX_SPLICE_BENDS_WITH_BUNDLE_JOG = 3;

export function maxSpliceBendsForLane(
  sourceY: number,
  targetY: number,
  lane: SpliceRoutingLane,
): number {
  let max = MAX_SPLICE_BENDS;
  const trunkX = lane.jogX ?? lane.midX;
  if (
    lane.jogX !== undefined &&
    Math.abs(trunkX - lane.midX) > SPLICE_PATH_EPS
  ) {
    max = MAX_SPLICE_BENDS_WITH_BUNDLE_JOG;
  }
  if (
    lane.sourceHorizY !== undefined &&
    Math.abs(lane.sourceHorizY - sourceY) > SPLICE_PATH_EPS
  ) {
    max += 1;
  }
  if (
    lane.targetHorizY !== undefined &&
    Math.abs(lane.targetHorizY - targetY) > SPLICE_PATH_EPS
  ) {
    max += 1;
  }
  return max;
}

/**
 * Build handle→handle splice paths with ≤2 orthogonal bends.
 * Prefers straight (0) before same-side or cross-side H–V–H (2 each).
 */
export function buildSplicePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
  jogX?: number,
  sideHoriz?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
): SplicePathResult {
  const template = pickSpliceRouteTemplate(sourceX, sourceY, targetX, targetY);

  if (template === "straight") {
    const spliceX = (sourceX + targetX) / 2;
    const spliceY = sourceY;
    const leftPath = `M ${sourceX},${sourceY} L ${spliceX},${spliceY}`;
    const rightPath = `M ${spliceX},${spliceY} L ${targetX},${targetY}`;
    return {
      leftPath,
      rightPath,
      spliceX,
      spliceY,
      bendCount: countOrthogonalBends(leftPath, rightPath),
      template,
    };
  }

  const demarcated = buildDemarcatedSplicePaths(
    sourceX,
    sourceY,
    targetX,
    targetY,
    midX,
    jogX,
    sideHoriz,
  );
  return {
    ...demarcated,
    bendCount: countOrthogonalBends(demarcated.leftPath, demarcated.rightPath),
    template,
  };
}

/** Explicit H–V–H splice path; each edge owns its vertical at `midX`. */
export function buildOrthogonalSplicePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
): { path: string; labelX: number; labelY: number } {
  return {
    path: `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`,
    labelX: midX,
    labelY: (sourceY + targetY) / 2,
  };
}

/**
 * Left leg stops at the fusion dot; right leg starts there (different strand colors).
 */
export function buildDemarcatedSplicePaths(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
  jogX?: number,
  sideHoriz?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
): {
  leftPath: string;
  rightPath: string;
  spliceX: number;
  spliceY: number;
} {
  const spliceY = (sourceY + targetY) / 2;
  const srcHY = sideHoriz?.sourceHorizY ?? sourceY;
  const tgtHY = sideHoriz?.targetHorizY ?? targetY;
  const trunkX = jogX ?? midX;
  const usesBundleJog =
    jogX !== undefined && Math.abs(trunkX - midX) > SPLICE_PATH_EPS;
  const leftParts = [`M ${sourceX},${sourceY}`];
  if (Math.abs(srcHY - sourceY) > SPLICE_PATH_EPS) {
    leftParts.push(`L ${sourceX},${srcHY}`);
  }
  if (usesBundleJog) {
    leftParts.push(
      `L ${trunkX},${srcHY}`,
      `L ${midX},${srcHY}`,
      `L ${midX},${spliceY}`,
    );
  } else {
    leftParts.push(`L ${midX},${srcHY}`, `L ${midX},${spliceY}`);
  }
  const rightParts = [
    `M ${midX},${spliceY}`,
    `L ${midX},${tgtHY}`,
    `L ${targetX},${tgtHY}`,
  ];
  if (Math.abs(tgtHY - targetY) > SPLICE_PATH_EPS) {
    rightParts.push(`L ${targetX},${targetY}`);
  }
  return {
    leftPath: leftParts.join(" "),
    rightPath: rightParts.join(" "),
    spliceX: midX,
    spliceY,
  };
}

export function effectiveSpliceLaneSep(
  sourceX: number,
  targetX: number,
  laneCount: number,
): number {
  const availableGap = spliceRoutingSpan(sourceX, targetX);
  if (laneCount <= 1 || availableGap <= 0) return SPLICE_LANE_SEP;
  const minSpan = (laneCount - 1) * SPLICE_LANE_SEP;
  if (availableGap < minSpan) return SPLICE_LANE_SEP;
  return availableGap / (laneCount - 1);
}

export function spliceRoutingSpan(sourceX: number, targetX: number): number {
  return (
    Math.abs(targetX - sourceX) - 2 * SPLICE_ROUTING_END_MARGIN
  );
}

export function spliceRoutingBounds(
  sourceX: number,
  targetX: number,
): { lo: number; hi: number; span: number } {
  const lo = Math.min(sourceX, targetX) + SPLICE_ROUTING_END_MARGIN;
  const hi = Math.max(sourceX, targetX) - SPLICE_ROUTING_END_MARGIN;
  return { lo, hi, span: Math.max(0, hi - lo) };
}

/**
 * Map global row offset to midX so center lanes mirror vertical tube-group spacing.
 * Fills the full center gap when import width is computed from row-offset span.
 */
export function spliceMidXFromRowOffset(
  sourceX: number,
  targetX: number,
  rowOffset: number,
  maxRowOffset: number,
  sourceY?: number,
  targetY?: number,
): number {
  const { lo, span } = spliceRoutingBounds(sourceX, targetX);
  if (span <= 0 || maxRowOffset <= 0) return (sourceX + targetX) / 2;
  let clampedOffset = Math.max(0, Math.min(rowOffset, maxRowOffset));
  if (
    sourceY !== undefined &&
    targetY !== undefined &&
    spliceMidOrderInverts(sourceX, sourceY, targetX, targetY)
  ) {
    clampedOffset = maxRowOffset - clampedOffset;
  }
  return lo + (clampedOffset / maxRowOffset) * span;
}

export type MidXLaneCandidate = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  rowOffset: number;
  /** Same source buffer tube + target cable — lanes stay contiguous. */
  tubeBundleKey?: string;
};

/** Route bundle = one source buffer tube → one target cable. */
export function spliceTubeBundleKey(
  sourceVisualCableId: string,
  sourceTubeColor: string,
  targetVisualCableId: string,
): string {
  return `${sourceVisualCableId}|${sourceTubeColor}|${targetVisualCableId}`;
}

function bundleKeyForCandidate(candidate: MidXLaneCandidate): string {
  return candidate.tubeBundleKey ?? candidate.id;
}

function groupCandidatesByTubeBundle(
  candidates: MidXLaneCandidate[],
): MidXLaneCandidate[][] {
  const byBundle = new Map<string, MidXLaneCandidate[]>();
  for (const candidate of candidates) {
    const key = bundleKeyForCandidate(candidate);
    const list = byBundle.get(key) ?? [];
    list.push(candidate);
    byBundle.set(key, list);
  }

  const bundles = [...byBundle.values()];
  bundles.sort((a, b) => {
    const minA = Math.min(...a.map((member) => member.rowOffset));
    const minB = Math.min(...b.map((member) => member.rowOffset));
    return (
      minA - minB ||
      a[0]!.sourceY - b[0]!.sourceY ||
      bundleKeyForCandidate(a[0]!).localeCompare(bundleKeyForCandidate(b[0]!))
    );
  });
  for (const bundle of bundles) {
    bundle.sort(
      (a, b) =>
        a.rowOffset - b.rowOffset ||
        a.sourceY - b.sourceY ||
        a.id.localeCompare(b.id),
    );
  }
  return bundles;
}

function flattenTubeBundleOrder(
  candidates: MidXLaneCandidate[],
): MidXLaneCandidate[] {
  return groupCandidatesByTubeBundle(candidates).flat();
}

function bundleJogXForMembers(
  members: Array<{ midX: number; sourceX: number }>,
  diagramCenterX: number,
): number | undefined {
  if (members.length <= 1) return undefined;
  const sourceX = members[0]!.sourceX;
  const inwardIsIncreasingX =
    inwardSignForColumn(sourceX, diagramCenterX) > 0;
  const midXs = members.map((member) => member.midX);
  return inwardIsIncreasingX ? Math.max(...midXs) : Math.min(...midXs);
}

/** Group edges that share the same cable-column routing span. */
export function spliceRoutingZoneKey(
  sourceX: number,
  targetX: number,
): string {
  return `${Math.round(sourceX)}::${Math.round(targetX)}`;
}

export function idealSpliceMidXFromRowOffset(
  candidate: MidXLaneCandidate,
  maxRowOffset: number,
): number {
  return spliceMidXFromRowOffset(
    candidate.sourceX,
    candidate.targetX,
    candidate.rowOffset,
    maxRowOffset,
    candidate.sourceY,
    candidate.targetY,
  );
}

/**
 * Assign distinct midX lanes with at least `minSep` center-to-center spacing.
 * Preserves buffer-tube row-offset order within each splice direction group,
 * then spreads mixed-direction crossover bundles across the full center span.
 */
function globalDiagramCenterX(candidates: MidXLaneCandidate[]): number {
  if (candidates.length === 0) return 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    minX = Math.min(minX, candidate.sourceX, candidate.targetX);
    maxX = Math.max(maxX, candidate.sourceX, candidate.targetX);
  }
  return (minX + maxX) / 2;
}

function packSameSideMidXLanes(
  candidates: MidXLaneCandidate[],
  minSep: number,
  diagramCenterX: number,
  sideSpans: SideCircuitLabelSpan,
): Map<string, number> {
  const result = new Map<string, number>();
  if (candidates.length === 0) return result;

  const sourceX = candidates[0]!.sourceX;
  const targetX = candidates[0]!.targetX;
  const columnX = (sourceX + targetX) / 2;
  const inward = inwardSignForColumn(columnX, diagramCenterX);
  const sep = minSep;

  if (candidates.length === 1) {
    const only = candidates[0]!;
    const raw = inwardAnchorFromColumn(columnX, diagramCenterX, sideSpans);
    result.set(
      only.id,
      clampMidXForMinHorizontalInset(
        raw,
        only.sourceX,
        only.targetX,
        diagramCenterX,
        sideSpans,
      ),
    );
    return result;
  }

  const downward: MidXLaneCandidate[] = [];
  const upward: MidXLaneCandidate[] = [];

  for (const candidate of candidates) {
    if (
      spliceMidOrderInverts(
        candidate.sourceX,
        candidate.sourceY,
        candidate.targetX,
        candidate.targetY,
      )
    ) {
      downward.push(candidate);
    } else {
      upward.push(candidate);
    }
  }

  downward.sort((a, b) => a.rowOffset - b.rowOffset);
  upward.sort((a, b) => a.rowOffset - b.rowOffset);
  const downwardOrdered = flattenTubeBundleOrder(downward);
  const upwardOrdered = flattenTubeBundleOrder(upward);

  const baseRun =
    circuitLabelSpanForSide(
      canvasSideForHandle(columnX, diagramCenterX),
      sideSpans,
    ) + MIN_SPLICE_HORIZONTAL_INSET;
  const base = columnX + inward * baseRun;

  for (let i = 0; i < upwardOrdered.length; i++) {
    const raw = base + inward * i * sep;
    result.set(
      upwardOrdered[i]!.id,
      clampMidXForMinHorizontalInset(
        raw,
        upwardOrdered[i]!.sourceX,
        upwardOrdered[i]!.targetX,
        diagramCenterX,
        sideSpans,
      ),
    );
  }
  for (let i = 0; i < downwardOrdered.length; i++) {
    const slot = upwardOrdered.length + downwardOrdered.length - 1 - i;
    const raw = base + inward * slot * sep;
    result.set(
      downwardOrdered[i]!.id,
      clampMidXForMinHorizontalInset(
        raw,
        downwardOrdered[i]!.sourceX,
        downwardOrdered[i]!.targetX,
        diagramCenterX,
        sideSpans,
      ),
    );
  }

  return result;
}

export function packMidXLanes(
  candidates: MidXLaneCandidate[],
  minSep = SPLICE_LANE_SEP,
  diagramCenterX?: number,
  sideSpans: SideCircuitLabelSpan = defaultSideCircuitLabelSpan(),
): Map<string, number> {
  const result = new Map<string, number>();
  if (candidates.length === 0) return result;

  const sourceX = candidates[0]!.sourceX;
  const targetX = candidates[0]!.targetX;
  const { lo, hi } = spliceRoutingBounds(sourceX, targetX);
  const sameSide = isSameColumnSplice(sourceX, targetX);
  const centerX = diagramCenterX ?? globalDiagramCenterX(candidates);

  if (sameSide) {
    return packSameSideMidXLanes(candidates, minSep, centerX, sideSpans);
  }

  if (candidates.length === 1) {
    const only = candidates[0]!;
    const maxRowOffset = Math.max(0, only.rowOffset);
    const raw = idealSpliceMidXFromRowOffset(only, maxRowOffset);
    result.set(
      only.id,
      clampMidXForMinHorizontalInset(
        raw,
        only.sourceX,
        only.targetX,
        centerX,
        sideSpans,
      ),
    );
    return result;
  }

  const insetBounds = spliceMidXInsetBounds(
    sourceX,
    targetX,
    centerX,
    sideSpans,
  );
  const downward: MidXLaneCandidate[] = [];
  const upward: MidXLaneCandidate[] = [];

  for (const candidate of candidates) {
    if (
      spliceMidOrderInverts(
        candidate.sourceX,
        candidate.sourceY,
        candidate.targetX,
        candidate.targetY,
      )
    ) {
      downward.push(candidate);
    } else {
      upward.push(candidate);
    }
  }

  downward.sort((a, b) => a.rowOffset - b.rowOffset);
  upward.sort((a, b) => a.rowOffset - b.rowOffset);
  const downwardOrdered = flattenTubeBundleOrder(downward);
  const upwardOrdered = flattenTubeBundleOrder(upward);

  const laneCount = downwardOrdered.length + upwardOrdered.length;
  const insetLo = Math.max(lo, insetBounds.lo);
  const insetHi = Math.min(hi, insetBounds.hi);
  const packLo = insetLo <= insetHi ? insetLo : lo;
  const packHi = insetLo <= insetHi ? insetHi : hi;
  const packSpan = Math.max(0, packHi - packLo);
  const sep = Math.max(minSep, packSpan / (laneCount - 1));
  const totalSpan = (laneCount - 1) * sep;
  const start = packLo + Math.max(0, (packSpan - totalSpan) / 2);

  for (let i = 0; i < upwardOrdered.length; i++) {
    const raw = start + i * sep;
    result.set(
      upwardOrdered[i]!.id,
      clampMidXForMinHorizontalInset(
        raw,
        upwardOrdered[i]!.sourceX,
        upwardOrdered[i]!.targetX,
        centerX,
        sideSpans,
      ),
    );
  }
  for (let i = 0; i < downwardOrdered.length; i++) {
    const slot = upwardOrdered.length + downwardOrdered.length - 1 - i;
    const raw = start + slot * sep;
    result.set(
      downwardOrdered[i]!.id,
      clampMidXForMinHorizontalInset(
        raw,
        downwardOrdered[i]!.sourceX,
        downwardOrdered[i]!.targetX,
        centerX,
        sideSpans,
      ),
    );
  }

  return result;
}

/** Packed midX per cable-column zone — enforces MIN_FIBER_LINE_GAP in center lanes. */
export function assignSpliceMidXLanes(
  candidates: MidXLaneCandidate[],
  sideSpans: SideCircuitLabelSpan = defaultSideCircuitLabelSpan(),
): Map<string, number> {
  const diagramCenterX = globalDiagramCenterX(candidates);
  const byZone = new Map<string, MidXLaneCandidate[]>();
  for (const candidate of candidates) {
    const key = spliceRoutingZoneKey(candidate.sourceX, candidate.targetX);
    const list = byZone.get(key) ?? [];
    list.push(candidate);
    byZone.set(key, list);
  }

  const result = new Map<string, number>();
  for (const group of byZone.values()) {
    for (const [id, midX] of packMidXLanes(
      group,
      SPLICE_LANE_SEP,
      diagramCenterX,
      sideSpans,
    )) {
      result.set(id, midX);
    }
  }
  return result;
}

/** Packed midX plus optional shared bundle jog trunk per tube bundle. */
export function assignSpliceRoutingLanes(
  candidates: MidXLaneCandidate[],
  sideSpans: SideCircuitLabelSpan = defaultSideCircuitLabelSpan(),
): Map<string, SpliceRoutingLane> {
  const diagramCenterX = globalDiagramCenterX(candidates);
  const midXMap = assignSpliceMidXLanes(candidates, sideSpans);
  const result = new Map<string, SpliceRoutingLane>();
  const byBundle = new Map<
    string,
    Array<{ id: string; midX: number; sourceX: number }>
  >();

  for (const candidate of candidates) {
    const midX = midXMap.get(candidate.id);
    if (midX === undefined) continue;
    const zoneKey = spliceRoutingZoneKey(candidate.sourceX, candidate.targetX);
    const key = `${zoneKey}::${bundleKeyForCandidate(candidate)}`;
    const list = byBundle.get(key) ?? [];
    list.push({ id: candidate.id, midX, sourceX: candidate.sourceX });
    byBundle.set(key, list);
  }

  for (const members of byBundle.values()) {
    const jogX = bundleJogXForMembers(members, diagramCenterX);
    for (const member of members) {
      if (!Number.isFinite(member.midX)) continue;
      const laneJogX =
        jogX !== undefined &&
        Number.isFinite(jogX) &&
        Math.abs(member.midX - jogX) > SPLICE_PATH_EPS
          ? jogX
          : undefined;
      result.set(member.id, { midX: member.midX, jogX: laneJogX });
    }
  }

  const sideHoriz = assignSideHorizLaneYs(candidates, result);
  for (const [id, offsets] of sideHoriz) {
    const lane = result.get(id);
    if (!lane) continue;
    result.set(id, { ...lane, ...offsets });
  }

  return result;
}

type OrthogonalSegment =
  | { kind: "h"; y: number; x0: number; x1: number }
  | { kind: "v"; x: number; y0: number; y1: number };

function sourceHorizSegments(
  sourceX: number,
  midX: number,
  jogX: number | undefined,
  sourceHorizY: number,
): Array<{ kind: "h"; y: number; x0: number; x1: number }> {
  const trunkX = jogX ?? midX;
  const usesBundleJog =
    jogX !== undefined && Math.abs(trunkX - midX) > SPLICE_PATH_EPS;
  const segments = [
    { kind: "h" as const, y: sourceHorizY, x0: sourceX, x1: trunkX },
  ];
  if (usesBundleJog) {
    segments.push({
      kind: "h" as const,
      y: sourceHorizY,
      x0: trunkX,
      x1: midX,
    });
  }
  return segments;
}

function sideHorizLaneSign(anchorY: number, diagramCenterY: number): 1 | -1 {
  return anchorY <= diagramCenterY ? 1 : -1;
}

function horizontalSegmentsForLane(
  candidate: MidXLaneCandidate,
  lane: SpliceRoutingLane,
  sourceHorizY: number,
  targetHorizY: number,
): Array<{ kind: "h"; y: number; x0: number; x1: number }> {
  return [
    ...sourceHorizSegments(
      candidate.sourceX,
      lane.midX,
      lane.jogX,
      sourceHorizY,
    ),
    {
      kind: "h" as const,
      y: targetHorizY,
      x0: lane.midX,
      x1: candidate.targetX,
    },
  ];
}

function horizSegmentsOverlapOccupied(
  segments: Array<{ kind: "h"; y: number; x0: number; x1: number }>,
  occupied: Array<{ kind: "h"; y: number; x0: number; x1: number }>,
): boolean {
  return occupied.some((existing) =>
    segments.some((seg) => parallelSpliceSegmentsOverlap(seg, existing)),
  );
}

function assignSideHorizLaneYs(
  candidates: MidXLaneCandidate[],
  lanes: Map<string, SpliceRoutingLane>,
): Map<string, Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">> {
  const result = new Map<
    string,
    Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">
  >();
  if (candidates.length === 0) return result;

  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const candidate of candidates) {
    minY = Math.min(minY, candidate.sourceY, candidate.targetY);
    maxY = Math.max(maxY, candidate.sourceY, candidate.targetY);
  }
  const diagramCenterY = (minY + maxY) / 2;

  const byZone = new Map<string, MidXLaneCandidate[]>();
  for (const candidate of candidates) {
    const lane = lanes.get(candidate.id);
    if (!lane) continue;
    const key = spliceRoutingZoneKey(candidate.sourceX, candidate.targetX);
    const list = byZone.get(key) ?? [];
    list.push(candidate);
    byZone.set(key, list);
  }

  for (const group of byZone.values()) {
    group.sort(
      (a, b) =>
        a.rowOffset - b.rowOffset ||
        a.sourceY - b.sourceY ||
        a.targetY - b.targetY ||
        a.id.localeCompare(b.id),
    );
    const occupied: Array<{ kind: "h"; y: number; x0: number; x1: number }> =
      [];

    for (const candidate of group) {
      const lane = lanes.get(candidate.id)!;
      const sourceSign = sideHorizLaneSign(candidate.sourceY, diagramCenterY);
      const targetSign = sideHorizLaneSign(candidate.targetY, diagramCenterY);
      let sourceLane = 0;
      let targetLane = 0;

      for (;;) {
        const sourceHorizY =
          candidate.sourceY + sourceSign * sourceLane * SPLICE_LANE_SEP;
        const targetHorizY =
          candidate.targetY + targetSign * targetLane * SPLICE_LANE_SEP;
        const segments = horizontalSegmentsForLane(
          candidate,
          lane,
          sourceHorizY,
          targetHorizY,
        );
        if (!horizSegmentsOverlapOccupied(segments, occupied)) {
          occupied.push(...segments);
          const offsets: Pick<
            SpliceRoutingLane,
            "sourceHorizY" | "targetHorizY"
          > = {};
          if (Math.abs(sourceHorizY - candidate.sourceY) > SPLICE_PATH_EPS) {
            offsets.sourceHorizY = sourceHorizY;
          }
          if (Math.abs(targetHorizY - candidate.targetY) > SPLICE_PATH_EPS) {
            offsets.targetHorizY = targetHorizY;
          }
          if (offsets.sourceHorizY !== undefined || offsets.targetHorizY !== undefined) {
            result.set(candidate.id, offsets);
          }
          break;
        }

        const sourceSegs = sourceHorizSegments(
          candidate.sourceX,
          lane.midX,
          lane.jogX,
          sourceHorizY,
        );
        const targetSegs = [
          {
            kind: "h" as const,
            y: targetHorizY,
            x0: lane.midX,
            x1: candidate.targetX,
          },
        ];
        const sourceConflict = horizSegmentsOverlapOccupied(
          sourceSegs,
          occupied,
        );
        const targetConflict = horizSegmentsOverlapOccupied(
          targetSegs,
          occupied,
        );
        if (sourceConflict) sourceLane += 1;
        if (targetConflict) targetLane += 1;
        if (!sourceConflict && !targetConflict) {
          sourceLane += 1;
          targetLane += 1;
        }
      }
    }
  }

  return result;
}

function hvDemarcatedSegments(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
  jogX?: number,
  sideHoriz?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
): OrthogonalSegment[] {
  const spliceY = (sourceY + targetY) / 2;
  const srcHY = sideHoriz?.sourceHorizY ?? sourceY;
  const tgtHY = sideHoriz?.targetHorizY ?? targetY;
  const trunkX = jogX ?? midX;
  const usesBundleJog =
    jogX !== undefined && Math.abs(trunkX - midX) > SPLICE_PATH_EPS;
  const segments: OrthogonalSegment[] = [];
  if (Math.abs(srcHY - sourceY) > SPLICE_PATH_EPS) {
    segments.push({ kind: "v", x: sourceX, y0: sourceY, y1: srcHY });
  }
  segments.push({ kind: "h", y: srcHY, x0: sourceX, x1: trunkX });
  if (usesBundleJog) {
    segments.push({ kind: "h", y: srcHY, x0: trunkX, x1: midX });
  }
  segments.push(
    { kind: "v", x: midX, y0: srcHY, y1: spliceY },
    { kind: "v", x: midX, y0: spliceY, y1: tgtHY },
    { kind: "h", y: tgtHY, x0: midX, x1: targetX },
  );
  if (Math.abs(tgtHY - targetY) > SPLICE_PATH_EPS) {
    segments.push({ kind: "v", x: targetX, y0: tgtHY, y1: targetY });
  }
  return segments;
}

/** Orthogonal segments for overlap checks (includes optional bundle jog trunk). */
export function spliceRouteSegments(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
  jogX?: number,
  sideHoriz?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
): OrthogonalSegment[] {
  const template = pickSpliceRouteTemplate(sourceX, sourceY, targetX, targetY);
  if (template === "straight") {
    const spliceX = (sourceX + targetX) / 2;
    return [
      { kind: "h", y: sourceY, x0: sourceX, x1: spliceX },
      { kind: "h", y: targetY, x0: spliceX, x1: targetX },
    ];
  }
  return hvDemarcatedSegments(
    sourceX,
    sourceY,
    targetX,
    targetY,
    midX,
    jogX,
    sideHoriz,
  );
}

function segmentInterval(lo: number, hi: number): { lo: number; hi: number } {
  return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
}

/** True when collinear strand segments share the same track (not merely parallel lanes). */
export function parallelSpliceSegmentsOverlap(
  a: OrthogonalSegment,
  b: OrthogonalSegment,
): boolean {
  if (a.kind === "h" && b.kind === "h") {
    if (!Number.isFinite(a.y) || !Number.isFinite(b.y)) return false;
    if (Math.abs(a.y - b.y) > SPLICE_PATH_EPS) return false;
    const xA = segmentInterval(a.x0, a.x1);
    const xB = segmentInterval(b.x0, b.x1);
    return Math.min(xA.hi, xB.hi) - Math.max(xA.lo, xB.lo) > SPLICE_PATH_EPS;
  }
  if (a.kind === "v" && b.kind === "v") {
    if (!Number.isFinite(a.x) || !Number.isFinite(b.x)) return false;
    if (Math.abs(a.x - b.x) > SPLICE_PATH_EPS) return false;
    const yA = segmentInterval(a.y0, a.y1);
    const yB = segmentInterval(b.y0, b.y1);
    return Math.min(yA.hi, yB.hi) - Math.max(yA.lo, yB.lo) > SPLICE_PATH_EPS;
  }
  return false;
}

function orthogonalSegmentsCross(
  a: OrthogonalSegment,
  b: OrthogonalSegment,
): boolean {
  if (a.kind === "h" && b.kind === "v") {
    const hLo = Math.min(a.x0, a.x1);
    const hHi = Math.max(a.x0, a.x1);
    const vLo = Math.min(b.y0, b.y1);
    const vHi = Math.max(b.y0, b.y1);
    return (
      b.x >= hLo - SPLICE_PATH_EPS &&
      b.x <= hHi + SPLICE_PATH_EPS &&
      a.y >= vLo - SPLICE_PATH_EPS &&
      a.y <= vHi + SPLICE_PATH_EPS
    );
  }
  if (a.kind === "v" && b.kind === "h") {
    return orthogonalSegmentsCross(b, a);
  }
  return false;
}

/** True when two H–V–H splice paths share a crossing segment intersection. */
export function hvDemarcatedPathsCross(
  sourceXA: number,
  sourceYA: number,
  targetXA: number,
  targetYA: number,
  midXA: number,
  sourceXB: number,
  sourceYB: number,
  targetXB: number,
  targetYB: number,
  midXB: number,
  jogXA?: number,
  jogXB?: number,
  sideHorizA?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
  sideHorizB?: Pick<SpliceRoutingLane, "sourceHorizY" | "targetHorizY">,
): boolean {
  const segsA = hvDemarcatedSegments(
    sourceXA,
    sourceYA,
    targetXA,
    targetYA,
    midXA,
    jogXA,
    sideHorizA,
  );
  const segsB = hvDemarcatedSegments(
    sourceXB,
    sourceYB,
    targetXB,
    targetYB,
    midXB,
    jogXB,
    sideHorizB,
  );
  for (const a of segsA) {
    for (const b of segsB) {
      if (orthogonalSegmentsCross(a, b)) return true;
    }
  }
  return false;
}

export function spliceMidX(
  sourceX: number,
  targetX: number,
  routingLane: number,
  laneCount: number,
): number {
  const towardTarget = targetX >= sourceX ? 1 : -1;
  const { lo, hi } = spliceRoutingBounds(sourceX, targetX);
  const sep = effectiveSpliceLaneSep(sourceX, targetX, laneCount);
  const laneOffset =
    (routingLane - (laneCount - 1) / 2) * sep * towardTarget;
  const raw = (sourceX + targetX) / 2 + laneOffset;
  return Math.max(lo, Math.min(hi, raw));
}

type Registry = {
  entries: Map<string, SpliceEdgeRouteEntry>;
  signature: string;
  subscribers: Set<() => void>;
  raf: number;
};

const registry: Registry = {
  entries: new Map(),
  signature: "",
  subscribers: new Set(),
  raf: 0,
};

function entrySignature(entries: Iterable<SpliceEdgeRouteEntry>): string {
  return [...entries]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (e) =>
        `${e.id}:${Math.round(e.sourceX)}:${Math.round(e.sourceY)}:${Math.round(e.targetX)}:${Math.round(e.targetY)}:${e.fallbackLane}:${e.rowOffset ?? ""}`,
    )
    .join("|");
}

function notifySubscribers() {
  for (const sub of registry.subscribers) sub();
}

/** Sync lane recompute when subscribers exist; skip signature commit if nobody listens yet. */
function flushNotify() {
  const next = entrySignature(registry.entries.values());
  if (registry.subscribers.size === 0) return;
  if (next === registry.signature) return;
  registry.signature = next;
  notifySubscribers();
}

function scheduleNotify() {
  if (registry.raf) return;
  registry.raf = requestAnimationFrame(() => {
    registry.raf = 0;
    flushNotify();
  });
}

function publishEntry(entry: SpliceEdgeRouteEntry) {
  registry.entries.set(entry.id, entry);
  scheduleNotify();
}

function removeEntry(id: string) {
  if (!registry.entries.delete(id)) return;
  scheduleNotify();
}

export function useRoutingLaneIndex(
  edgeId: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  fallbackLane: number,
  enabled: boolean,
  laneCountHint: number,
  rowOffset?: number,
  sideCircuitSpan?: SideCircuitLabelSpan,
  tubeBundleKey?: string,
): {
  routingLane: number;
  activeLaneCount: number;
  maxRowOffset: number;
  midX: number;
  jogX?: number;
  sourceHorizY?: number;
  targetHorizY?: number;
} {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    if (!enabled) return;
    const sub = () => bump();
    registry.subscribers.add(sub);
    // Initial import: RAF may have fired before any edge subscribed.
    flushNotify();
    return () => {
      registry.subscribers.delete(sub);
      removeEntry(edgeId);
    };
  }, [edgeId, bump, enabled]);

  useEffect(() => {
    if (enabled) return;
    removeEntry(edgeId);
  }, [edgeId, enabled]);

  if (!enabled) {
    const maxRowOffset = Math.max(0, rowOffset ?? 0);
    const sideSpans = sideCircuitSpan ?? defaultSideCircuitLabelSpan();
    const diagramCenterX = (sourceX + targetX) / 2;
    const midX = resolveSpliceMidX(sourceX, sourceY, targetX, targetY, {
      rowOffset,
      maxRowOffset,
      routingLane: fallbackLane,
      laneCount: Math.max(1, laneCountHint),
      diagramCenterX,
      sideCircuitSpan: sideSpans,
    });
    return {
      routingLane: fallbackLane,
      activeLaneCount: Math.max(1, laneCountHint),
      maxRowOffset,
      midX,
    };
  }

  const template = pickSpliceRouteTemplate(sourceX, sourceY, targetX, targetY);
  const laneStagger = templateUsesMidXLanes(template);

  publishEntry({
    id: edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    fallbackLane,
    rowOffset,
    tubeBundleKey,
  });

  const entries = [...registry.entries.values()];
  const activeLaneCount = Math.max(laneCountHint, entries.length, 1);
  const maxRowOffset = Math.max(
    0,
    ...entries.map((e) => e.rowOffset ?? 0),
  );
  const routingLane = laneStagger
    ? routingLaneFromEntries(entries, edgeId)
    : fallbackLane;
  const entry = entries.find((e) => e.id === edgeId);
  const sideSpans = sideCircuitSpan ?? defaultSideCircuitLabelSpan();
  const diagramCenterX =
    entries.length > 0
      ? globalDiagramCenterX(
          entries.map((entry) => ({
            id: entry.id,
            sourceX: entry.sourceX,
            sourceY: entry.sourceY,
            targetX: entry.targetX,
            targetY: entry.targetY,
            rowOffset: entry.rowOffset ?? entry.fallbackLane,
          })),
        )
      : (sourceX + targetX) / 2;

  const midXLaneCandidates: MidXLaneCandidate[] = entries
    .filter(
      (entry) =>
        templateUsesMidXLanes(
          pickSpliceRouteTemplate(
            entry.sourceX,
            entry.sourceY,
            entry.targetX,
            entry.targetY,
          ),
        ),
    )
    .map((entry) => ({
      id: entry.id,
      sourceX: entry.sourceX,
      sourceY: entry.sourceY,
      targetX: entry.targetX,
      targetY: entry.targetY,
      rowOffset: entry.rowOffset ?? entry.fallbackLane,
      tubeBundleKey: entry.tubeBundleKey,
    }));
  const packedRouting = assignSpliceRoutingLanes(midXLaneCandidates, sideSpans);
  const routing = packedRouting.get(edgeId);
  const midX =
    routing?.midX ??
    resolveSpliceMidX(sourceX, sourceY, targetX, targetY, {
      rowOffset: entry?.rowOffset ?? rowOffset,
      maxRowOffset,
      routingLane,
      laneCount: activeLaneCount,
      diagramCenterX,
      sideCircuitSpan: sideSpans,
    });

  return {
    routingLane,
    activeLaneCount,
    maxRowOffset,
    midX,
    jogX: routing?.jogX,
    sourceHorizY: routing?.sourceHorizY,
    targetHorizY: routing?.targetHorizY,
  };
}

/** React Flow handle center for layout validation (handle → handle routing). */
export function fiberHandlePosition(
  vc: VisualCable,
  connectionId: string,
  nodePosition: { x: number; y: number },
  scale = 1,
  alignedStemX?: number,
): { x: number; y: number } {
  const geo = computeCableBreakout(
    vc.tubes,
    vc.side,
    FIBER_ROW_PITCH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
    scale,
    alignedStemX,
  );
  return {
    x:
      vc.side === "left"
        ? nodePosition.x + geo.stemX
        : nodePosition.x + geo.viewWidth - geo.stemX,
    y: nodePosition.y + fiberRowOffsetInCable(vc, connectionId),
  };
}

/** @internal test helper */
export function resetSpliceRouteRegistryForTests(): void {
  registry.entries.clear();
  registry.signature = "";
  registry.subscribers.clear();
  if (registry.raf) {
    cancelAnimationFrame(registry.raf);
    registry.raf = 0;
  }
}
