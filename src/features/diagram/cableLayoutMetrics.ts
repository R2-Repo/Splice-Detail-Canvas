import type { VisualCable } from "@/features/diagram/visualCables";

export const CABLE_LAYOUT = {
  width: 1200,
  leftX: 32,
  rightX: 880,
  topY: 80,
  cableGap: 28,
  headerH: 52,
  tubeLabelH: 18,
  fiberRowH: 24,
  tubeGap: 6,
} as const;

export function visualCableHeight(vc: VisualCable): number {
  let h = CABLE_LAYOUT.headerH;
  for (const tube of vc.tubes) {
    h += CABLE_LAYOUT.tubeLabelH + tube.fibers.length * CABLE_LAYOUT.fiberRowH;
    h += CABLE_LAYOUT.tubeGap;
  }
  return h;
}

/** Pixel offset from node top to fiber row center (for handles). */
export function fiberRowOffsetInTubes(
  tubes: VisualCable["tubes"],
  connectionId: string,
): number {
  return fiberRowOffsetInCable(
    {
      id: "",
      legId: "",
      device: "",
      cable: "",
      side: "left",
      order: 0,
      tubes,
    },
    connectionId,
  );
}

export function fiberRowOffsetInCable(
  vc: VisualCable,
  connectionId: string,
): number {
  let y = CABLE_LAYOUT.headerH;
  for (const tube of vc.tubes) {
    y += CABLE_LAYOUT.tubeLabelH;
    for (const fiber of tube.fibers) {
      if (fiber.connectionId === connectionId) {
        return y + CABLE_LAYOUT.fiberRowH / 2;
      }
      y += CABLE_LAYOUT.fiberRowH;
    }
    y += CABLE_LAYOUT.tubeGap;
  }
  return CABLE_LAYOUT.headerH;
}
