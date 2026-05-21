import type { VisualCable } from "@/features/diagram/visualCables";

/**
 * Center-to-center spacing between adjacent fiber splice lines within one buffer tube (px).
 * Used for row layout, cable node rows, and edge routing clearance.
 */
export const MIN_FIBER_LINE_GAP = 24;

/** Row pitch matches line gap so handles and splice paths stay evenly spaced. */
export const FIBER_ROW_PITCH = MIN_FIBER_LINE_GAP;

/** Extra vertical gap when splice rows cross a buffer-tube boundary on the left leg. */
export const TUBE_GROUP_GAP = 8;

/** Center spacing between adjacent vertical splice legs — same as row pitch. */
export const SPLICE_LANE_SEP = MIN_FIBER_LINE_GAP;

export const CABLE_LAYOUT = {
  width: 1400,
  leftX: 24,
  rightX: 1000,
  topY: 100,
  cableGap: 32,
  /** Push multi-tube cables further from center — longer buffer-tube reach. */
  tubeCountXOffset: 64,
  headerH: 56,
  tubeLabelH: 18,
  fiberRowH: FIBER_ROW_PITCH,
  fiberStrandH: 3,
  tubeGap: 6,
  tubeGroupGap: TUBE_GROUP_GAP,
  minFiberLineGap: MIN_FIBER_LINE_GAP,
  spliceLaneSep: SPLICE_LANE_SEP,
} as const;

export function cableXForSide(
  side: "left" | "right",
  tubeCount: number,
): number {
  const offset = Math.max(0, tubeCount - 1) * CABLE_LAYOUT.tubeCountXOffset;
  return side === "left"
    ? CABLE_LAYOUT.leftX - offset
    : CABLE_LAYOUT.rightX + offset;
}

export function fiberRowY(rowIndex: number, baseTop = CABLE_LAYOUT.topY): number {
  const rowStart = baseTop + CABLE_LAYOUT.headerH;
  return rowStart + rowIndex * CABLE_LAYOUT.fiberRowH;
}

/** Absolute Y for a splice row top edge from its cumulative vertical offset. */
export function fiberRowYFromOffset(
  rowYOffset: number,
  baseTop = CABLE_LAYOUT.topY,
): number {
  return baseTop + CABLE_LAYOUT.headerH + rowYOffset;
}

/**
 * Offset from cable node top to handle center.
 * Uses global rowIndex so fiber rows stay on the correct pitch even if row indices skip.
 */
export function fiberRowOffsetInCable(
  vc: VisualCable,
  connectionId: string,
): number {
  const fiber = vc.tubes
    .flatMap((t) => t.fibers)
    .find((f) => f.connectionId === connectionId);
  if (!fiber) return CABLE_LAYOUT.headerH;

  const rowStart = CABLE_LAYOUT.headerH + CABLE_LAYOUT.tubeLabelH;
  return (
    rowStart + fiber.rowYOffset + CABLE_LAYOUT.fiberRowH / 2
  );
}

export function fiberRowOffsetInTubes(
  tubes: VisualCable["tubes"],
  connectionId: string,
): number {
  const fiber = tubes
    .flatMap((t) => t.fibers)
    .find((f) => f.connectionId === connectionId);
  if (!fiber) return CABLE_LAYOUT.headerH;
  const rowStart = CABLE_LAYOUT.headerH + CABLE_LAYOUT.tubeLabelH;
  return (
    rowStart + fiber.rowYOffset + CABLE_LAYOUT.fiberRowH / 2
  );
}

export function visualCableHeight(vc: VisualCable): number {
  const fibers = vc.tubes.flatMap((t) => t.fibers);
  if (fibers.length === 0) return CABLE_LAYOUT.headerH;

  const maxYOffset = Math.max(...fibers.map((f) => f.rowYOffset));

  return (
    CABLE_LAYOUT.headerH +
    CABLE_LAYOUT.tubeLabelH +
    maxYOffset +
    CABLE_LAYOUT.fiberRowH +
    CABLE_LAYOUT.tubeGap
  );
}
