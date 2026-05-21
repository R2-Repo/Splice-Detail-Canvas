import type { Edge, Node } from "@xyflow/react";

import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import {
  computeCableBreakout,
  computeSheathSize,
  SHEATH_SIZE,
} from "@/features/diagram/cableBreakoutGeometry";
import {
  CABLE_LAYOUT,
  cableXForSide,
  FIBER_ROW_PITCH,
  fiberRowOffsetInCable,
  TUBE_GROUP_GAP,
} from "@/features/diagram/cableLayoutMetrics";
import { computeCanvasPlacement } from "@/features/diagram/canvasPlacement";
import { connectionRowIndexMap, connectionRowOffsets } from "@/features/diagram/connectionRowOrder";
import {
  connectionInDominantPair,
  findDominantCablePair,
  parentVisualGroupKey,
  type DominantCablePair,
} from "@/features/diagram/dominantCablePair";
import { computeAlignedLayout, type AlignedDiagramLayout } from "@/features/diagram/spliceRowLayout";
import {
  cableFiberTopToBottomOk,
  compactTubeFiberLayoutOk,
} from "@/features/diagram/tubeFiberLayout";
import {
  buildVisualCables,
  buildVisualCablesForLayout,
  endpointOnVisualSide,
  type VisualCable,
} from "@/features/diagram/visualCables";
import type { ConnectionGraph, FiberConnection } from "@/types/splice";
import type { CablePlacement } from "@/features/diagram/canvasPlacement";

/** Stable rule IDs — must match docs/agent/LAYOUT_RULES.md */
export const LAYOUT_RULE_IDS = [
  "FBR-001",
  "FBR-002",
  "FBR-003",
  "FBR-004",
  "TUB-001",
  "TUB-002",
  "TUB-003",
  "TUB-004",
  "TUB-005",
  "CBL-001",
  "CBL-002",
  "CBL-003",
  "CBL-004",
  "CBL-005",
  "ROW-001",
  "ROW-002",
  "ROW-003",
  "DOM-001",
  "DOM-002",
  "DOM-003",
  "EDGE-001",
] as const;

export type LayoutRuleId = (typeof LAYOUT_RULE_IDS)[number];

export type LayoutRuleMeta = {
  id: LayoutRuleId;
  title: string;
  category: "fiber" | "tube" | "cable" | "row" | "dominant" | "edge";
};

export const LAYOUT_RULES: LayoutRuleMeta[] = [
  { id: "FBR-001", title: "TIA fiber order within each buffer tube", category: "fiber" },
  { id: "FBR-002", title: "24px pitch within each buffer tube", category: "fiber" },
  { id: "FBR-003", title: "rowYOffset increases top-to-bottom per cable", category: "fiber" },
  { id: "FBR-004", title: "Distinct rowYOffset per fiber on multi-tube cables", category: "fiber" },
  { id: "TUB-001", title: "Tubes attach at cable sheath center", category: "tube" },
  { id: "TUB-002", title: "Tube tip centered on fiber group", category: "tube" },
  { id: "TUB-003", title: "Sheath preserves aspect ratio", category: "tube" },
  { id: "TUB-004", title: "Multi-tube cables have longer tube reach", category: "tube" },
  { id: "TUB-005", title: "Right-side breakout mirrors left", category: "tube" },
  { id: "CBL-001", title: "Same-side cables do not overlap", category: "cable" },
  { id: "CBL-002", title: "Same-side cables stack with at least cableGap", category: "cable" },
  { id: "CBL-003", title: "Multi-tube cables offset X from center", category: "cable" },
  { id: "CBL-004", title: "Dominant-pair splices align straight across", category: "cable" },
  { id: "CBL-005", title: "Ring-cut 144 splits into two visual instances", category: "cable" },
  { id: "ROW-001", title: "Equal pitch within buffer tube in global rows", category: "row" },
  { id: "ROW-002", title: "Extra gap at buffer-tube boundaries", category: "row" },
  { id: "ROW-003", title: "Extra gap at ring-cut split boundaries", category: "row" },
  { id: "DOM-001", title: "Dominant pair has most splice rows", category: "dominant" },
  { id: "DOM-002", title: "Dominant pair rows precede other rows", category: "dominant" },
  { id: "DOM-003", title: "Dominant pair fibers align horizontally", category: "dominant" },
  { id: "EDGE-001", title: "Distinct routing lane per splice edge on import", category: "edge" },
];

export type LayoutRuleContext = {
  graph: ConnectionGraph;
  visualCables: VisualCable[];
  dominant: DominantCablePair | null;
  placement: Map<string, CablePlacement>;
  layout: AlignedDiagramLayout;
  reactFlow: { nodes: Node[]; edges: Edge[] };
};

export type LayoutRuleResult = {
  id: LayoutRuleId;
  ok: boolean;
  detail?: string;
};

const Y_TOLERANCE = 2;
const SHEATH_ASPECT = SHEATH_SIZE.baseWidth / SHEATH_SIZE.baseHeight;

function sideOf(
  vc: VisualCable,
  placement: Map<string, CablePlacement>,
): "left" | "right" {
  return placement.get(vc.id)?.side ?? vc.side;
}

function orderOf(vc: VisualCable, placement: Map<string, CablePlacement>): number {
  return placement.get(vc.id)?.order ?? vc.order;
}

function cableBoxesOverlap(
  a: { y: number; height: number },
  b: { y: number; height: number },
): boolean {
  return a.y < b.y + b.height && b.y < a.y + a.height;
}

function fibersInTiaOrder(visualCables: VisualCable[]): boolean {
  for (const vc of visualCables) {
    for (const tube of vc.tubes) {
      const fibers = tube.fibers;
      for (let i = 1; i < fibers.length; i++) {
        if (fibers[i]!.fiberNumber <= fibers[i - 1]!.fiberNumber) return false;
      }
    }
  }
  return true;
}

function multiTubeDistinctOffsets(visualCables: VisualCable[]): boolean {
  for (const vc of visualCables.filter((v) => v.tubes.length > 1)) {
    const offsets = vc.tubes.flatMap((t) => t.fibers.map((f) => f.rowYOffset));
    if (new Set(offsets).size !== offsets.length) return false;
  }
  return true;
}

function tubeGeometryOk(
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
): { ok: boolean; detail?: string } {
  for (const vc of visualCables) {
    const side = sideOf(vc, placement);
    const geo = computeCableBreakout(
      vc.tubes,
      side,
      FIBER_ROW_PITCH,
      CABLE_LAYOUT.headerH,
      CABLE_LAYOUT.tubeLabelH,
    );

    for (const tube of geo.tubes) {
      if (Math.abs(tube.origin.y - geo.cableCenterY) > Y_TOLERANCE) {
        return {
          ok: false,
          detail: `Cable ${vc.id}: tube ${tube.tubeColor} origin not at center`,
        };
      }
      const rowYs = tube.fibers.map((f) => f.rowY);
      const fiberCenterY = (Math.min(...rowYs) + Math.max(...rowYs)) / 2;
      if (Math.abs(tube.end.y - fiberCenterY) > Y_TOLERANCE) {
        return {
          ok: false,
          detail: `Cable ${vc.id}: tube ${tube.tubeColor} tip not centered on fibers`,
        };
      }
    }

    const aspect = geo.sheath.width / geo.sheath.height;
    if (Math.abs(aspect - SHEATH_ASPECT) > 0.01) {
      return { ok: false, detail: `Cable ${vc.id}: sheath aspect ratio drift` };
    }
  }
  return { ok: true };
}

function tubeReachIncreases(visualCables: VisualCable[]): boolean {
  const single = visualCables.find((v) => v.tubes.length === 1);
  const multi = visualCables.find((v) => v.tubes.length > 1);
  if (!single || !multi) return true;

  const one = computeCableBreakout(
    single.tubes,
    single.side,
    FIBER_ROW_PITCH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
  );
  const two = computeCableBreakout(
    multi.tubes,
    multi.side,
    FIBER_ROW_PITCH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
  );
  return two.stemX - two.sheath.width > one.stemX - one.sheath.width;
}

function rightSideMirrors(visualCables: VisualCable[]): boolean {
  const sample = visualCables.find((v) => v.tubes.length >= 1);
  if (!sample) return true;

  const left = computeCableBreakout(
    sample.tubes,
    "left",
    FIBER_ROW_PITCH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
  );
  const right = computeCableBreakout(
    sample.tubes,
    "right",
    FIBER_ROW_PITCH,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
  );
  return right.sheath.x > left.sheath.x && right.tubes[0]!.origin.x > left.tubes[0]!.origin.x;
}

function sameSideNoOverlap(ctx: LayoutRuleContext): boolean {
  for (const side of ["left", "right"] as const) {
    const boxes = ctx.visualCables
      .filter((vc) => sideOf(vc, ctx.placement) === side)
      .map((vc) => ctx.layout.cablePositions.get(vc.id)!)
      .filter(Boolean);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (cableBoxesOverlap(boxes[i]!, boxes[j]!)) return false;
      }
    }
  }
  return true;
}

function sameSideStackGap(ctx: LayoutRuleContext): boolean {
  for (const side of ["left", "right"] as const) {
    const cables = ctx.visualCables
      .filter((vc) => sideOf(vc, ctx.placement) === side)
      .sort((a, b) => orderOf(a, ctx.placement) - orderOf(b, ctx.placement));
    for (let i = 1; i < cables.length; i++) {
      const prev = ctx.layout.cablePositions.get(cables[i - 1]!.id)!;
      const curr = ctx.layout.cablePositions.get(cables[i]!.id)!;
      const gap = curr.y - (prev.y + prev.height);
      if (gap < CABLE_LAYOUT.cableGap - Y_TOLERANCE) return false;
    }
  }
  return true;
}

function spliceEndpointsAligned(
  ctx: LayoutRuleContext,
  connectionFilter: (conn: FiberConnection) => boolean,
): boolean {
  for (const conn of ctx.graph.connections) {
    if (conn.kind !== "fiber" || !connectionFilter(conn)) continue;

    const sides: number[] = [];
    for (const side of ["left", "right"] as const) {
      const ep = endpointOnVisualSide(
        conn,
        ctx.graph,
        ctx.visualCables,
        side,
      );
      if (!ep) continue;
      const pos = ctx.layout.cablePositions.get(ep.visualCableId);
      if (!pos) continue;
      const vc = ctx.visualCables.find((v) => v.id === ep.visualCableId);
      if (!vc) continue;
      sides.push(pos.y + fiberRowOffsetInCable(vc, conn.id));
    }

    if (sides.length === 2 && Math.abs(sides[0]! - sides[1]!) > Y_TOLERANCE) {
      return false;
    }
  }
  return true;
}

function fiberHandleRowAlignment(ctx: LayoutRuleContext): boolean {
  if (!ctx.dominant) return true;
  return spliceEndpointsAligned(ctx, (conn) =>
    connectionInDominantPair(conn, ctx.graph, ctx.visualCables, ctx.dominant!),
  );
}

function globalRowStepsOk(ctx: LayoutRuleContext): {
  withinTube: boolean;
  tubeBoundary: boolean;
  splitGap: boolean;
} {
  const offsets = connectionRowOffsets(ctx.graph, ctx.visualCables, ctx.dominant);
  const values = [...offsets.values()].sort((a, b) => a - b);
  const steps = values.slice(1).map((y, i) => y - values[i]!);

  const withinTube = steps.some((s) => s === FIBER_ROW_PITCH) || values.length <= 1;
  const tubeBoundary =
    steps.some((s) => s === FIBER_ROW_PITCH + TUBE_GROUP_GAP) || values.length <= 1;
  const splitGap =
    steps.some((s) => s > FIBER_ROW_PITCH + TUBE_GROUP_GAP) || values.length <= 1;

  return { withinTube, tubeBoundary, splitGap };
}

function dominantPairOk(ctx: LayoutRuleContext): boolean {
  if (!ctx.dominant) return true;

  const pass1 = buildVisualCables(ctx.graph);
  const recomputed = findDominantCablePair(ctx.graph, pass1);
  if (!recomputed || recomputed.connectionCount !== ctx.dominant.connectionCount) {
    return false;
  }

  const rowIdx = connectionRowIndexMap(ctx.graph, ctx.visualCables, ctx.dominant);
  const dominantRows = ctx.graph.connections
    .filter(
      (c) =>
        c.kind === "fiber" &&
        connectionInDominantPair(c, ctx.graph, ctx.visualCables, ctx.dominant!),
    )
    .map((c) => rowIdx.get(c.id)!);
  const otherRows = ctx.graph.connections
    .filter(
      (c) =>
        c.kind === "fiber" &&
        !connectionInDominantPair(c, ctx.graph, ctx.visualCables, ctx.dominant!),
    )
    .map((c) => rowIdx.get(c.id)!);

  if (dominantRows.length === 0 || otherRows.length === 0) return true;
  if (Math.max(...dominantRows) >= Math.min(...otherRows)) return false;

  const left = ctx.visualCables.find(
    (v) => parentVisualGroupKey(v.id) === ctx.dominant!.leftGroupKey,
  );
  const right = ctx.visualCables.find(
    (v) => parentVisualGroupKey(v.id) === ctx.dominant!.rightGroupKey,
  );
  if (!left || !right) return true;

  for (const conn of ctx.graph.connections.filter((c) => c.kind === "fiber")) {
    const lf = left.tubes.flatMap((t) => t.fibers).find((f) => f.connectionId === conn.id);
    const rf = right.tubes.flatMap((t) => t.fibers).find((f) => f.connectionId === conn.id);
    if (!lf || !rf) continue;
    const leftY =
      ctx.layout.cablePositions.get(left.id)!.y +
      fiberRowOffsetInCable(left, lf.connectionId);
    const rightY =
      ctx.layout.cablePositions.get(right.id)!.y +
      fiberRowOffsetInCable(right, rf.connectionId);
    if (Math.abs(leftY - rightY) > Y_TOLERANCE) return false;
  }

  return true;
}

function distinctEdgeLanes(edges: Edge[]): boolean {
  const spliceEdges = edges.filter((e) => e.type === "splice");
  if (spliceEdges.length === 0) return true;
  const lanes = spliceEdges.map((e) => (e.data as { laneIndex?: number }).laneIndex);
  return new Set(lanes).size === spliceEdges.length;
}

export function buildLayoutRuleContext(graph: ConnectionGraph): LayoutRuleContext {
  const { visualCables, dominant } = buildVisualCablesForLayout(graph);
  const rowIndex = connectionRowIndexMap(graph, visualCables, dominant);
  const placement = computeCanvasPlacement(graph, visualCables, dominant, rowIndex);
  const layout = computeAlignedLayout(graph, visualCables, placement, dominant);
  const reactFlow = buildReactFlowGraph(graph);
  return { graph, visualCables, dominant, placement, layout, reactFlow };
}

export function checkLayoutRule(
  id: LayoutRuleId,
  ctx: LayoutRuleContext,
): LayoutRuleResult {
  switch (id) {
    case "FBR-001":
      return {
        id,
        ok: fibersInTiaOrder(ctx.visualCables),
        detail: "Fibers not in TIA order within a buffer tube",
      };
    case "FBR-002":
      return {
        id,
        ok: compactTubeFiberLayoutOk(ctx.visualCables),
        detail: "Buffer tube fiber pitch is not 24px",
      };
    case "FBR-003":
      return {
        id,
        ok: cableFiberTopToBottomOk(ctx.visualCables),
        detail: "rowYOffset does not increase top-to-bottom",
      };
    case "FBR-004":
      return {
        id,
        ok: multiTubeDistinctOffsets(ctx.visualCables),
        detail: "Multi-tube cable has duplicate rowYOffset values",
      };
    case "TUB-001":
    case "TUB-002":
    case "TUB-003": {
      const geo = tubeGeometryOk(ctx.visualCables, ctx.placement);
      return { id, ok: geo.ok, detail: geo.detail };
    }
    case "TUB-004":
      return {
        id,
        ok: tubeReachIncreases(ctx.visualCables),
        detail: "Multi-tube cable does not extend tube reach",
      };
    case "TUB-005":
      return {
        id,
        ok: rightSideMirrors(ctx.visualCables),
        detail: "Right-side breakout is not mirrored",
      };
    case "CBL-001":
      return {
        id,
        ok: sameSideNoOverlap(ctx),
        detail: "Same-side cable nodes overlap vertically",
      };
    case "CBL-002":
      return {
        id,
        ok: sameSideStackGap(ctx),
        detail: "Stacked cables have less than cableGap spacing",
      };
    case "CBL-003": {
      const multi = ctx.visualCables.find((v) => v.tubes.length > 1);
      if (!multi) return { id, ok: true };
      const side = sideOf(multi, ctx.placement);
      const pos = ctx.layout.cablePositions.get(multi.id)!;
      const expectedX = cableXForSide(side, multi.tubes.length);
      return {
        id,
        ok: Math.abs(pos.x - expectedX) < 1,
        detail: "Multi-tube cable X does not match tubeCount offset",
      };
    }
    case "CBL-004":
      if (!ctx.dominant) return { id, ok: true };
      return {
        id,
        ok: fiberHandleRowAlignment(ctx),
        detail: "Dominant-pair splice handles are not horizontally aligned",
      };
    case "CBL-005": {
      const throughSide = ctx.visualCables.filter(
        (v) => /144|288/i.test(v.cable) && v.side === "right",
      );
      const needsSplit = ctx.graph.connections.filter((c) => c.kind === "fiber").length === 4;
      if (!needsSplit) return { id, ok: true };
      return {
        id,
        ok: throughSide.length === 2,
        detail: "Ring-cut 144 should produce two right-side visual cables",
      };
    }
    case "ROW-001": {
      const steps = globalRowStepsOk(ctx);
      return {
        id,
        ok: steps.withinTube,
        detail: "Global row layout missing FIBER_ROW_PITCH steps",
      };
    }
    case "ROW-002": {
      const multiTube = ctx.visualCables.some((v) => v.tubes.length > 1);
      if (!multiTube) return { id, ok: true };
      const steps = globalRowStepsOk(ctx);
      return {
        id,
        ok: steps.tubeBoundary,
        detail: "Global row layout missing TUBE_GROUP_GAP at tube boundaries",
      };
    }
    case "ROW-003": {
      const hasSplit = ctx.visualCables.some((vc) => /~\d+$/.test(vc.id));
      if (!hasSplit) return { id, ok: true };
      const steps = globalRowStepsOk(ctx);
      return {
        id,
        ok: steps.splitGap,
        detail: "Ring-cut split missing extra row gap",
      };
    }
    case "DOM-001":
    case "DOM-002":
    case "DOM-003":
      return {
        id,
        ok: dominantPairOk(ctx),
        detail: "Dominant cable pair layout invariant failed",
      };
    case "EDGE-001":
      return {
        id,
        ok: distinctEdgeLanes(ctx.reactFlow.edges),
        detail: "Splice edges share routing lanes on import",
      };
    default:
      return { id, ok: false, detail: "Unknown rule" };
  }
}

export function checkAllLayoutRules(ctx: LayoutRuleContext): LayoutRuleResult[] {
  return LAYOUT_RULE_IDS.map((id) => checkLayoutRule(id, ctx));
}

export function layoutRulesOk(ctx: LayoutRuleContext): boolean {
  return checkAllLayoutRules(ctx).every((r) => r.ok);
}

/** Sheath aspect ratio check exported for unit reuse. */
export function sheathAspectOk(scale: number, tubeCount: number): boolean {
  const size = computeSheathSize(scale, tubeCount);
  return Math.abs(size.width / size.height - SHEATH_ASPECT) < 0.01;
}
