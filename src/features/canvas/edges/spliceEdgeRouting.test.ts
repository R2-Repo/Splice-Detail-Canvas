import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildDemarcatedSplicePaths,
  buildOrthogonalSplicePath,
  effectiveRoutingLane,
  resetSpliceRouteRegistryForTests,
  routingLaneFromEntries,
  sortSpliceRouteEntries,
  spliceMidX,
  useRoutingLaneIndex,
} from "./spliceEdgeRouting";

describe("spliceEdgeRouting", () => {
  afterEach(() => {
    resetSpliceRouteRegistryForTests();
  });

  it("syncs staggered lanes after initial mount (no drag required)", () => {
    function usePair() {
      const top = useRoutingLaneIndex(
        "top",
        100,
        100,
        500,
        400,
        0,
        true,
        2,
      );
      const bottom = useRoutingLaneIndex(
        "bottom",
        100,
        140,
        500,
        420,
        1,
        true,
        2,
      );
      return { top, bottom };
    }

    const { result } = renderHook(() => usePair());

    expect(result.current.top.routingLane).toBe(1);
    expect(result.current.bottom.routingLane).toBe(0);
    expect(spliceMidX(100, 500, result.current.top.routingLane, 2)).not.toBe(
      spliceMidX(100, 500, result.current.bottom.routingLane, 2),
    );
  });

  it("inverts lanes when target is below source (right cable lower)", () => {
    const entries = [
      {
        id: "top",
        sourceX: 100,
        sourceY: 100,
        targetX: 500,
        targetY: 400,
        fallbackLane: 0,
      },
      {
        id: "bottom",
        sourceX: 100,
        sourceY: 140,
        targetX: 500,
        targetY: 420,
        fallbackLane: 1,
      },
    ];
    expect(routingLaneFromEntries(entries, "top")).toBe(1);
    expect(routingLaneFromEntries(entries, "bottom")).toBe(0);
  });

  it("keeps ascending lanes when target is above source", () => {
    const entries = [
      {
        id: "low",
        sourceX: 100,
        sourceY: 200,
        targetX: 500,
        targetY: 100,
        fallbackLane: 0,
      },
      {
        id: "high",
        sourceX: 100,
        sourceY: 240,
        targetX: 500,
        targetY: 120,
        fallbackLane: 1,
      },
    ];
    expect(routingLaneFromEntries(entries, "low")).toBe(0);
    expect(routingLaneFromEntries(entries, "high")).toBe(1);
  });

  it("keeps ascending lanes when source is dragged to the right of target", () => {
    const entries = [
      {
        id: "top",
        sourceX: 900,
        sourceY: 100,
        targetX: 200,
        targetY: 400,
        fallbackLane: 0,
      },
      {
        id: "bottom",
        sourceX: 900,
        sourceY: 140,
        targetX: 200,
        targetY: 420,
        fallbackLane: 1,
      },
    ];
    expect(routingLaneFromEntries(entries, "top")).toBe(0);
    expect(routingLaneFromEntries(entries, "bottom")).toBe(1);
  });

  it("sorts by sourceY then targetY", () => {
    const entries = [
      {
        id: "a",
        sourceX: 100,
        sourceY: 120,
        targetX: 500,
        targetY: 300,
        fallbackLane: 1,
      },
      {
        id: "b",
        sourceX: 100,
        sourceY: 120,
        targetX: 500,
        targetY: 180,
        fallbackLane: 0,
      },
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

  it("staggers midX by routing lane toward target", () => {
    expect(spliceMidX(100, 500, 0, 2)).toBeLessThan(spliceMidX(100, 500, 1, 2));
    expect(spliceMidX(900, 200, 0, 2)).toBeGreaterThan(spliceMidX(900, 200, 1, 2));
  });

  it("effectiveRoutingLane inverts only for downward splices", () => {
    expect(effectiveRoutingLane(0, 2, 100, 100, 500, 400)).toBe(1);
    expect(effectiveRoutingLane(1, 2, 100, 140, 500, 420)).toBe(0);
    expect(effectiveRoutingLane(0, 2, 100, 200, 500, 100)).toBe(0);
    expect(effectiveRoutingLane(0, 2, 900, 100, 200, 400)).toBe(0);
  });
});
