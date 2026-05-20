import { cableLegIdForEndpoint } from "@/features/diagram/buildConnectionGraph";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { CableLegId, ConnectionGraph } from "@/types/splice";

export type CablePlacement = {
  side: "left" | "right";
  order: number;
};

/** Drop / small cables sort above distribution mains on each side. */
function cableSortRank(cable: string): number {
  if (/DROP|DK-/i.test(cable)) return 0;
  const m = cable.match(/\b(\d{1,3})\b/);
  const n = m ? Number.parseInt(m[1]!, 10) : 999;
  if (n <= 12) return 1;
  if (n <= 48) return 2;
  return 3;
}

export function computeCanvasPlacement(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
): Map<string, CablePlacement> {
  const placement = new Map<string, CablePlacement>();

  for (const vc of visualCables) {
    placement.set(vc.id, { side: vc.side, order: vc.order });
  }

  const bySide = { left: [] as VisualCable[], right: [] as VisualCable[] };
  for (const vc of visualCables) {
    bySide[vc.side].push(vc);
  }

  for (const side of ["left", "right"] as const) {
    const list = bySide[side].sort(
      (a, b) =>
        cableSortRank(a.cable) - cableSortRank(b.cable) ||
        a.cable.localeCompare(b.cable) ||
        a.order - b.order,
    );
    list.forEach((vc, order) => {
      placement.set(vc.id, { side, order });
    });
  }

  rebalanceCrossingSides(graph, visualCables, placement);
  return placement;
}

/** Prefer drop legs left, dist split left/right per reference Example #2. */
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
    const side =
      votes.left >= votes.right
        ? votes.left > votes.right
          ? "left"
          : vc.side
        : "right";
    const current = placement.get(vc.id)!;
    placement.set(vc.id, { ...current, side });
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
          cableSortRank(a.cable) - cableSortRank(b.cable) ||
          a.cable.localeCompare(b.cable),
      )
      .forEach((vc, order) => {
        placement.set(vc.id, { side, order });
      });
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
