import { describe, expect, it } from "vitest";

import {
  CABLE_LAYOUT,
  fiberRowY,
  FIBER_ROW_PITCH,
  MIN_FIBER_LINE_GAP,
  SPLICE_LANE_SEP,
} from "./cableLayoutMetrics";

describe("fiber line spacing", () => {
  it("enforces minimum gap between adjacent splice rows", () => {
    expect(CABLE_LAYOUT.fiberRowH).toBeGreaterThanOrEqual(MIN_FIBER_LINE_GAP);
    const y0 = fiberRowY(0);
    const y1 = fiberRowY(1);
    expect(y1 - y0).toBe(MIN_FIBER_LINE_GAP);
  });

  it("uses equal gap for vertical rows and horizontal splice lanes", () => {
    expect(SPLICE_LANE_SEP).toBe(FIBER_ROW_PITCH);
    expect(SPLICE_LANE_SEP).toBe(MIN_FIBER_LINE_GAP);
  });
});
