import { pairEndpointsForSide } from "@/features/diagram/buildConnectionGraph";
import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import {
  minRowIndexForVisualCable,
  parentVisualGroupKey,
} from "@/features/diagram/dominantCablePair";
import type { VisualCable } from "@/features/diagram/visualCables";
import { cableNameKey } from "@/features/import/cableLegIdentity";
import type { ConnectionGraph } from "@/types/splice";

export type CablePlacement = {
  side: "left" | "right";
  order: number;
};

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

function partnerBarycenter(
  vc: VisualCable,
  graph: ConnectionGraph,
  rowIndex: Map<string, number>,
  visualCables: VisualCable[],
): number {
  const rows: number[] = [];
  const myKey = cableNameKey(vc.cable);

  for (const conn of graph.connections) {
    if (conn.kind !== "fiber") continue;
    const onVc = vc.tubes.some((t) =>
      t.fibers.some((f) => f.connectionId === conn.id),
    );
    if (!onVc) continue;

    const { left, right } = pairEndpointsForSide(conn.pair, graph);
    const leftKey = cableNameKey(left.cable);
    const rightKey = cableNameKey(right.cable);
    const partnerKey = leftKey === myKey ? rightKey : rightKey === myKey ? leftKey : null;
    if (!partnerKey) continue;

    const partnerVc = visualCables.find(
      (v) => cableNameKey(v.cable) === partnerKey && v.side !== vc.side,
    );
    if (partnerVc) {
      rows.push(minRowIndexForVisualCable(partnerVc, rowIndex));
    } else {
      rows.push(rowIndex.get(conn.id) ?? 0);
    }
  }

  if (rows.length === 0) return Number.MAX_SAFE_INTEGER;
  return rows.reduce((sum, row) => sum + row, 0) / rows.length;
}

function sortSideByBarycenter(
  cables: VisualCable[],
  graph: ConnectionGraph,
  rowIndex: Map<string, number>,
  visualCables: VisualCable[],
  dominant?: DominantCablePair | null,
): VisualCable[] {
  const ranks = new Map<string, number>();
  for (const vc of cables) {
    ranks.set(vc.id, partnerBarycenter(vc, graph, rowIndex, visualCables));
  }

  return [...cables].sort(
    (a, b) =>
      dominantGroupRank(a, a.side, dominant) -
        dominantGroupRank(b, b.side, dominant) ||
      (ranks.get(a.id) ?? 0) - (ranks.get(b.id) ?? 0) ||
      cableSortTieBreak(a, b, graph) ||
      a.cable.localeCompare(b.cable) ||
      a.order - b.order,
  );
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

  if (!rowIndex) {
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
            cableSortTieBreak(a, b, graph) ||
            a.cable.localeCompare(b.cable) ||
            a.order - b.order,
        )
        .forEach((vc, order) => {
          placement.set(vc.id, { side, order });
        });
    }
    return placement;
  }

  let leftOrder = visualCables.filter((vc) => vc.side === "left");
  let rightOrder = visualCables.filter((vc) => vc.side === "right");

  for (let pass = 0; pass < 2; pass++) {
    leftOrder = sortSideByBarycenter(
      leftOrder,
      graph,
      rowIndex,
      visualCables,
      dominant,
    );
    rightOrder = sortSideByBarycenter(
      rightOrder,
      graph,
      rowIndex,
      visualCables,
      dominant,
    );
  }

  leftOrder.forEach((vc, order) => {
    placement.set(vc.id, { side: "left", order });
  });
  rightOrder.forEach((vc, order) => {
    placement.set(vc.id, { side: "right", order });
  });

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
