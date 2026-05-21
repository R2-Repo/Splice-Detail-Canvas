import { cableLegIdForEndpoint } from "@/features/diagram/buildConnectionGraph";
import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import {
  minRowIndexForVisualCable,
  parentVisualGroupKey,
} from "@/features/diagram/dominantCablePair";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { CableLegId, ConnectionGraph } from "@/types/splice";

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

  rebalanceCrossingSides(graph, visualCables, placement);

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

function rebalanceCrossingSides(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
): void {
  const legSideVotes = new Map<CableLegId, { left: number; right: number }>();

  for (const conn of graph.connections) {
    if (conn.kind !== "fiber") continue;
    const a = cableLegIdForEndpoint(conn.pair.endpointA);
    const b = cableLegIdForEndpoint(conn.pair.endpointB);
    const legA = graph.legs.find((l) => l.id === a);
    const legB = graph.legs.find((l) => l.id === b);
    if (!legA || !legB) continue;

    if (legA.csvColumn === "from" && legB.csvColumn === "to") {
      bumpVote(legSideVotes, a, "left");
      bumpVote(legSideVotes, b, "right");
    } else if (legA.csvColumn === "to" && legB.csvColumn === "from") {
      bumpVote(legSideVotes, a, "right");
      bumpVote(legSideVotes, b, "left");
    }
  }

  for (const vc of visualCables) {
    const votes = legSideVotes.get(vc.legId);
    if (!votes) continue;
    const side: "left" | "right" =
      votes.left > votes.right
        ? "left"
        : votes.right > votes.left
          ? "right"
          : vc.side;
    const current = placement.get(vc.id)!;
    placement.set(vc.id, { ...current, side });
  }
}

function bumpVote(
  map: Map<CableLegId, { left: number; right: number }>,
  legId: CableLegId,
  side: "left" | "right",
): void {
  const v = map.get(legId) ?? { left: 0, right: 0 };
  v[side] += 1;
  map.set(legId, v);
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
