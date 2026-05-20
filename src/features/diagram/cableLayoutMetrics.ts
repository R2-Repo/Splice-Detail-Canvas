import type { VisualCable } from "@/features/diagram/visualCables";

/**
 * Minimum center-to-center spacing between adjacent fiber splice lines (px).
 * Used for row layout, cable node rows, and edge routing clearance.
 */
export const MIN_FIBER_LINE_GAP = 40;

/** Row pitch matches line gap so handles and splice paths stay evenly spaced. */
export const FIBER_ROW_PITCH = MIN_FIBER_LINE_GAP;

/** Center spacing between adjacent vertical splice legs — same as row pitch. */
export const SPLICE_LANE_SEP = MIN_FIBER_LINE_GAP;

export const CABLE_LAYOUT = {
  width: 1400,
  leftX: 24,
  rightX: 1000,
  topY: 100,
  cableGap: 32,
  headerH: 56,
  tubeLabelH: 18,
  fiberRowH: FIBER_ROW_PITCH,
  fiberStrandH: 3,
  tubeGap: 8,
  minFiberLineGap: MIN_FIBER_LINE_GAP,
  spliceLaneSep: SPLICE_LANE_SEP,
} as const;

export function fiberRowY(rowIndex: number, baseTop = CABLE_LAYOUT.topY): number {
  const rowStart = baseTop + CABLE_LAYOUT.headerH;
  return rowStart + rowIndex * CABLE_LAYOUT.fiberRowH;
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
  return rowStart + fiber.rowIndex * CABLE_LAYOUT.fiberRowH + CABLE_LAYOUT.fiberRowH / 2;
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
  return rowStart + fiber.rowIndex * CABLE_LAYOUT.fiberRowH + CABLE_LAYOUT.fiberRowH / 2;
}

export function visualCableHeight(vc: VisualCable): number {
  const fibers = vc.tubes.flatMap((t) => t.fibers);
  if (fibers.length === 0) return CABLE_LAYOUT.headerH;

  const maxRow = Math.max(...fibers.map((f) => f.rowIndex));
  const rowCount = maxRow + 1;

  return (
    CABLE_LAYOUT.headerH +
    CABLE_LAYOUT.tubeLabelH +
    rowCount * CABLE_LAYOUT.fiberRowH +
    CABLE_LAYOUT.tubeGap
  );
}
