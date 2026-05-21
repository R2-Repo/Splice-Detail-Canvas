import { describe, expect, it } from "vitest";

import {
  buildDemarcatedSplicePaths,
  buildOrthogonalSplicePath,
  effectiveRoutingLane,
  routingLaneFromEntries,
  sortSpliceRouteEntries,
  spliceMidX,
} from "./spliceEdgeRouting";

describe("spliceEdgeRouting", () => {
  it("inverts lanes when target is below source (right cable lower)", () => {
    const entries = [
      { id: "top", sourceY: 100, targetY: 400, fallbackLane: 0 },
      { id: "bottom", sourceY: 140, targetY: 420, fallbackLane: 1 },
    ];
    expect(routingLaneFromEntries(entries, "top")).toBe(1);
    expect(routingLaneFromEntries(entries, "bottom")).toBe(0);
  });

  it("keeps ascending lanes when target is above source", () => {
    const entries = [
      { id: "low", sourceY: 200, targetY: 100, fallbackLane: 0 },
      { id: "high", sourceY: 240, targetY: 120, fallbackLane: 1 },
    ];
    expect(routingLaneFromEntries(entries, "low")).toBe(0);
    expect(routingLaneFromEntries(entries, "high")).toBe(1);
  });

  it("sorts by sourceY then targetY", () => {
    const entries = [
      { id: "a", sourceY: 120, targetY: 300, fallbackLane: 1 },
      { id: "b", sourceY: 120, targetY: 180, fallbackLane: 0 },
    ];
    expect(sortSpliceRouteEntries(entries).map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("builds explicit orthogonal path", () => {
    const { path, labelX, labelY } = buildOrthogonalSplicePath(
      100,
      50,
      500,
      200,
      300,
    );
    expect(path).toBe("M 100,50 L 300,50 L 300,200 L 500,200");
    expect(labelX).toBe(300);
    expect(labelY).toBe(125);
  });

  it("demarcates left and right legs at the fusion dot", () => {
    const { leftPath, rightPath, spliceX, spliceY } = buildDemarcatedSplicePaths(
      100,
      50,
      500,
      200,
      300,
    );
    expect(leftPath).toBe("M 100,50 L 300,50 L 300,125");
    expect(rightPath).toBe("M 300,125 L 300,200 L 500,200");
    expect(spliceX).toBe(300);
    expect(spliceY).toBe(125);
  });

  it("staggers midX by routing lane", () => {
    expect(spliceMidX(100, 500, 0, 2)).toBeLessThan(spliceMidX(100, 500, 1, 2));
  });

  it("effectiveRoutingLane inverts only for downward splices", () => {
    expect(effectiveRoutingLane(0, 2, 100, 400)).toBe(1);
    expect(effectiveRoutingLane(1, 2, 140, 420)).toBe(0);
    expect(effectiveRoutingLane(0, 2, 200, 100)).toBe(0);
  });
});
