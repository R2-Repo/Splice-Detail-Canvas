import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  assignSpliceMidXLanes,
  assignSpliceRoutingLanes,
  buildDemarcatedSplicePaths,
  buildOrthogonalSplicePath,
  buildSplicePath,
  clampMidXForMinHorizontalInset,
  defaultSideCircuitLabelSpan,
  effectiveRoutingLane,
  effectiveSpliceLaneSep,
  horizontalInsetOkFromHandle,
  hvDemarcatedPathsCross,
  packMidXLanes,
  pickSpliceRouteTemplate,
  resetSpliceRouteRegistryForTests,
  routingLaneFromEntries,
  sortSpliceRouteEntries,
  spliceMidX,
  spliceMidXFromRowOffset,
  spliceMidXInsetBounds,
  useRoutingLaneIndex,
} from "./spliceEdgeRouting";
import {
  MIN_SPLICE_HORIZONTAL_INSET,
  SPLICE_LANE_SEP,
} from "@/features/diagram/cableLayoutMetrics";

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

  it("buildSplicePath uses straight template when Y matches (0 bends)", () => {
    const result = buildSplicePath(100, 50, 500, 50, 300);
    expect(result.template).toBe("straight");
    expect(result.bendCount).toBe(0);
    expect(result.spliceY).toBe(50);
  });

  it("buildSplicePath uses same_side template for same column (2 bends)", () => {
    const sideSpans = defaultSideCircuitLabelSpan();
    const midX =
      200 + sideSpans.left + MIN_SPLICE_HORIZONTAL_INSET;
    const result = buildSplicePath(200, 100, 200, 400, midX);
    expect(result.template).toBe("same_side");
    expect(result.bendCount).toBe(2);
    expect(result.leftPath).toContain(`L ${midX},100`);
    expect(
      horizontalInsetOkFromHandle(midX, 200, 350, sideSpans),
    ).toBe(true);
  });

  it("buildSplicePath uses hv_demarcated with 2 bends cross-side", () => {
    const result = buildSplicePath(100, 50, 500, 200, 300);
    expect(result.template).toBe("hv_demarcated");
    expect(result.bendCount).toBe(2);
  });

  it("same-column paths detour toward center after OS column", () => {
    const sideSpans = defaultSideCircuitLabelSpan();
    const midX = 200 + sideSpans.left + MIN_SPLICE_HORIZONTAL_INSET;
    const result = buildSplicePath(200, 100, 200, 400, midX);
    expect(result.template).toBe("same_side");
    expect(result.bendCount).toBe(2);
    expect(result.leftPath).toMatch(new RegExp(`^M 200,100 L ${midX},100 L ${midX},`));
  });

  it("clampMidXForMinHorizontalInset enforces OS span + jog on cross-side paths", () => {
    const sourceX = 100;
    const targetX = 500;
    const sideSpans = { left: 120, right: 140 };
    const centerX = 300;
    const clamped = clampMidXForMinHorizontalInset(
      116,
      sourceX,
      targetX,
      centerX,
      sideSpans,
    );
    expect(
      horizontalInsetOkFromHandle(clamped, sourceX, centerX, sideSpans),
    ).toBe(true);
    expect(
      horizontalInsetOkFromHandle(clamped, targetX, centerX, sideSpans),
    ).toBe(true);
    const bounds = spliceMidXInsetBounds(
      sourceX,
      targetX,
      centerX,
      sideSpans,
    );
    expect(clamped).toBeGreaterThanOrEqual(bounds.lo);
    expect(clamped).toBeLessThanOrEqual(bounds.hi);
  });

  it("pickSpliceRouteTemplate identifies route shapes", () => {
    expect(pickSpliceRouteTemplate(100, 50, 500, 50)).toBe("straight");
    expect(pickSpliceRouteTemplate(200, 100, 200, 400)).toBe("same_side");
    expect(pickSpliceRouteTemplate(100, 50, 500, 200)).toBe("hv_demarcated");
  });

  it("staggers midX by routing lane toward target", () => {
    expect(spliceMidX(100, 500, 0, 2)).toBeLessThan(spliceMidX(100, 500, 1, 2));
    expect(spliceMidX(900, 200, 0, 2)).toBeGreaterThan(spliceMidX(900, 200, 1, 2));
  });

  it("inverts row-offset midX when target is below source", () => {
    const sourceX = 100;
    const targetX = 500;
    const maxRowOffset = 48;
    const top = spliceMidXFromRowOffset(
      sourceX,
      targetX,
      0,
      maxRowOffset,
      100,
      400,
    );
    const bottom = spliceMidXFromRowOffset(
      sourceX,
      targetX,
      maxRowOffset,
      maxRowOffset,
      140,
      420,
    );
    expect(top).toBeGreaterThan(bottom);
    expect(
      hvDemarcatedPathsCross(
        sourceX,
        100,
        targetX,
        400,
        top,
        sourceX,
        140,
        targetX,
        420,
        bottom,
      ),
    ).toBe(false);
  });

  it("keeps ascending row-offset midX when target is above source", () => {
    const sourceX = 100;
    const targetX = 500;
    const maxRowOffset = 48;
    const top = spliceMidXFromRowOffset(
      sourceX,
      targetX,
      0,
      maxRowOffset,
      200,
      100,
    );
    const bottom = spliceMidXFromRowOffset(
      sourceX,
      targetX,
      maxRowOffset,
      maxRowOffset,
      240,
      120,
    );
    expect(top).toBeLessThan(bottom);
    expect(
      hvDemarcatedPathsCross(
        sourceX,
        200,
        targetX,
        100,
        top,
        sourceX,
        240,
        targetX,
        120,
        bottom,
      ),
    ).toBe(false);
  });

  it("detects nested-bend violations when top fiber bends first", () => {
    const sourceX = 100;
    const targetX = 500;
    const topMidX = 200;
    const bottomMidX = 350;
    expect(
      hvDemarcatedPathsCross(
        sourceX,
        100,
        targetX,
        400,
        topMidX,
        sourceX,
        140,
        targetX,
        420,
        bottomMidX,
      ),
    ).toBe(true);
  });

  it("effectiveRoutingLane inverts only for downward splices", () => {
    expect(effectiveRoutingLane(0, 2, 100, 100, 500, 400)).toBe(1);
    expect(effectiveRoutingLane(1, 2, 100, 140, 500, 420)).toBe(0);
    expect(effectiveRoutingLane(0, 2, 100, 200, 500, 100)).toBe(0);
    expect(effectiveRoutingLane(0, 2, 900, 100, 200, 400)).toBe(0);
  });

  it("fills center with proportional row-offset lanes (no overlap)", () => {
    const laneCount = 60;
    const sourceX = 300;
    const targetX = 300 + (laneCount - 1) * SPLICE_LANE_SEP + 32;
    const maxRowOffset = (laneCount - 1) * SPLICE_LANE_SEP;
    const mids = Array.from({ length: laneCount }, (_, lane) =>
      spliceMidXFromRowOffset(
        sourceX,
        targetX,
        lane * SPLICE_LANE_SEP,
        maxRowOffset,
      ),
    );
    expect(new Set(mids.map((x) => Math.round(x))).size).toBe(laneCount);
    expect(Math.min(...mids)).toBeGreaterThan(sourceX);
    expect(Math.max(...mids)).toBeLessThan(targetX);
  });

  it("effectiveSpliceLaneSep distributes evenly when gap allows", () => {
    const laneCount = 4;
    const sourceX = 100;
    const targetX = 500;
    const sep = effectiveSpliceLaneSep(sourceX, targetX, laneCount);
    expect(sep).toBeGreaterThanOrEqual(SPLICE_LANE_SEP);
  });

  it("packMidXLanes separates crossover pairs that share ideal midX", () => {
    const sourceX = 100;
    const targetX = 500;
    const maxRowOffset = 72;
    const candidates = [
      {
        id: "bl",
        sourceX,
        sourceY: 100,
        targetX,
        targetY: 400,
        rowOffset: 0,
      },
      {
        id: "or",
        sourceX,
        sourceY: 124,
        targetX,
        targetY: 376,
        rowOffset: 24,
      },
      {
        id: "gr",
        sourceX,
        sourceY: 148,
        targetX,
        targetY: 160,
        rowOffset: 48,
      },
      {
        id: "br",
        sourceX,
        sourceY: 172,
        targetX,
        targetY: 136,
        rowOffset: maxRowOffset,
      },
    ];

    const ideals = candidates.map((candidate) =>
      spliceMidXFromRowOffset(
        sourceX,
        targetX,
        candidate.rowOffset,
        maxRowOffset,
        candidate.sourceY,
        candidate.targetY,
      ),
    );
    expect(new Set(ideals.map((x) => Math.round(x))).size).toBeLessThan(
      candidates.length,
    );

    const packed = packMidXLanes(candidates);
    const mids = candidates.map((candidate) => packed.get(candidate.id)!);
    expect(new Set(mids.map((x) => Math.round(x))).size).toBe(
      candidates.length,
    );
    const sorted = [...mids].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(
        SPLICE_LANE_SEP - 0.01,
      );
    }
  });

  it("assignSpliceRoutingLanes spaces tube bundle lanes and shares jogX trunk", () => {
    const sourceX = 500;
    const targetX = 100;
    const bundleKey = "vc-right|BL|vc-left";
    const candidates = [
      {
        id: "bl",
        sourceX,
        sourceY: 100,
        targetX,
        targetY: 400,
        rowOffset: 0,
        tubeBundleKey: bundleKey,
      },
      {
        id: "or",
        sourceX,
        sourceY: 124,
        targetX,
        targetY: 376,
        rowOffset: 24,
        tubeBundleKey: bundleKey,
      },
    ];
    const packed = assignSpliceRoutingLanes(candidates);
    const bl = packed.get("bl")!;
    const or = packed.get("or")!;
    expect(Math.abs(or.midX - bl.midX)).toBeGreaterThanOrEqual(SPLICE_LANE_SEP - 0.01);
    const outerLane = or.jogX !== undefined ? or : bl;
    const outerMeta = or.jogX !== undefined ? candidates[1]! : candidates[0]!;
    expect(outerLane.jogX).toBeDefined();
    expect(bl.jogX ?? outerLane.jogX).toBe(or.jogX ?? outerLane.jogX);
    const { leftPath: outerPath } = buildDemarcatedSplicePaths(
      sourceX,
      outerMeta.sourceY,
      targetX,
      outerMeta.targetY,
      outerLane.midX,
      outerLane.jogX,
    );
    expect(outerPath).toContain(`${outerLane.jogX},${outerMeta.sourceY}`);
    expect(outerPath).toContain(`${outerLane.midX},${outerMeta.sourceY}`);
  });

  it("packMidXLanes separates same-side vertical lanes toward center", () => {
    const columnX = 200;
    const candidates = [
      {
        id: "a",
        sourceX: columnX,
        sourceY: 100,
        targetX: columnX,
        targetY: 400,
        rowOffset: 0,
      },
      {
        id: "b",
        sourceX: columnX,
        sourceY: 124,
        targetX: columnX,
        targetY: 420,
        rowOffset: 24,
      },
    ];
    const packed = packMidXLanes(candidates, SPLICE_LANE_SEP, 700, {
      left: 66,
      right: 120,
    });
    const top = packed.get("a")!;
    const bottom = packed.get("b")!;
    expect(top).toBeGreaterThan(columnX);
    expect(bottom).toBeGreaterThan(columnX);
    expect(top - bottom).toBeGreaterThanOrEqual(SPLICE_LANE_SEP - 0.01);
    expect(
      horizontalInsetOkFromHandle(top, columnX, 700, {
        left: 66,
        right: 120,
      }),
    ).toBe(true);
  });

  it("assignSpliceMidXLanes keeps zones independent", () => {
    const lanes = assignSpliceMidXLanes([
      {
        id: "a",
        sourceX: 100,
        sourceY: 100,
        targetX: 500,
        targetY: 400,
        rowOffset: 0,
      },
      {
        id: "b",
        sourceX: 100,
        sourceY: 124,
        targetX: 500,
        targetY: 136,
        rowOffset: 24,
      },
      {
        id: "c",
        sourceX: 900,
        sourceY: 100,
        targetX: 500,
        targetY: 400,
        rowOffset: 0,
      },
    ]);
    expect(lanes.get("a")).toBeDefined();
    expect(lanes.get("b")).toBeDefined();
    expect(lanes.get("c")).toBeDefined();
    expect(Math.abs(lanes.get("a")! - lanes.get("c")!)).toBeGreaterThan(0);
  });
});
