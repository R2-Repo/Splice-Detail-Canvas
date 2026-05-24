import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import {
  minRowIndexForVisualCable,
  parentVisualGroupKey,
} from "@/features/diagram/dominantCablePair";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph } from "@/types/splice";

export type CablePlacement = {
  side: "left" | "right";
  order: number;
};

function cableSortRank(cable: string, side: "left" | "right"): number {
  if (/DROP/i.test(cable) && !/DIST/i.test(cable)) return side === "left" ? 0 : 2;
  if (/DK-/i.test(cable)) return side === "right" ? 3 : 1;
  if (/2700|2700 E/i.test(cable)) return 1;
  if (/3175|3300 E/i.test(cable) && /DIST/i.test(cable)) return side === "right" ? 0 : 2;
  if (/144|288/i.test(cable)) return side === "right" ? 1 : 0;
  const m = cable.match(/\b(\d{1,3})\b/);
  const n = m ? Number.parseInt(m[1]!, 10) : 999;
  return 10 + n;
}

function fiberCountForVisualCable(vc: VisualCable): number {
  return vc.tubes.reduce((n, t) => n + t.fibers.length, 0);
}

function connectionCountForCable(graph: ConnectionGraph, cable: string): number {
  let count = 0;
  for (const conn of graph.connections) {
    if (conn.kind !== "fiber") continue;
    if (
      conn.pair.endpointA.cable === cable ||
      conn.pair.endpointB.cable === cable
    ) {
      count += 1;
    }
  }
  return count;
}

/** Data-driven tie-break after dominant/row ordering. */
function cableSortTieBreak(
  a: VisualCable,
  b: VisualCable,
  graph: ConnectionGraph,
): number {
  const connDiff =
    connectionCountForCable(graph, b.cable) -
    connectionCountForCable(graph, a.cable);
  if (connDiff !== 0) return connDiff;
  return fiberCountForVisualCable(b) - fiberCountForVisualCable(a);
}

export function computeCanvasPlacement(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  dominant?: DominantCablePair | null,
  rowIndex?: Map<string, number>,
): Map<string, CablePlacement> {
  const placement = new Map<string, CablePlacement>();

  for (const vc of visualCables) {
    placement.set(vc.id, { side: vc.side, order: vc.order });
  }

  const bySide = { left: [] as VisualCable[], right: [] as VisualCable[] };
  for (const vc of visualCables) {
    const p = placement.get(vc.id)!;
    bySide[p.side].push(vc);
  }

  for (const side of ["left", "right"] as const) {
    bySide[side]
      .sort(
        (a, b) =>
          dominantGroupRank(a, side, dominant) -
            dominantGroupRank(b, side, dominant) ||
          (rowIndex
            ? minRowIndexForVisualCable(a, rowIndex) -
              minRowIndexForVisualCable(b, rowIndex)
            : 0) ||
          cableSortTieBreak(a, b, graph) ||
          cableSortRank(a.cable, side) - cableSortRank(b.cable, side) ||
          a.cable.localeCompare(b.cable) ||
          a.order - b.order,
      )
      .forEach((vc, order) => {
        placement.set(vc.id, { side, order });
      });
  }

  return placement;
}

function dominantGroupRank(
  vc: VisualCable,
  side: "left" | "right",
  dominant?: DominantCablePair | null,
): number {
  if (!dominant) return 0;
  const group = parentVisualGroupKey(vc.id);
  const isPrimary =
    side === "left"
      ? group === dominant.leftGroupKey
      : group === dominant.rightGroupKey;
  return isPrimary ? 0 : 1;
}
