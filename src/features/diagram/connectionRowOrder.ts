import {
  orderedFiberConnections,
  pairEndpointsForSide,
} from "@/features/diagram/buildConnectionGraph";
import {
  FIBER_ROW_PITCH,
  TUBE_GROUP_GAP,
} from "@/features/diagram/cableLayoutMetrics";
import {
  canonicalLayoutEndpoint,
  isThroughCableName,
} from "@/features/diagram/throughCable";
import type {
  ConnectionGraph,
  FiberConnection,
  FiberEndpoint,
} from "@/types/splice";

function layoutSortKey(
  left: FiberEndpoint,
  right: FiberEndpoint,
): [number, number, string] {
  const ep = canonicalLayoutEndpoint(left, right);
  const throughRank = isThroughCableName(ep.cable) ? 0 : 1;
  return [throughRank, ep.fiberNumber, ep.tubeColor];
}

/** Row order: through-cable fiber #, then tube, then CSV order — not raw parse order. */
export function connectionsInRowLayoutOrder(
  graph: ConnectionGraph,
): FiberConnection[] {
  const list = orderedFiberConnections(graph);
  const index = new Map(list.map((c, i) => [c.id, i]));
  return [...list].sort((a, b) => {
    const aEnds = pairEndpointsForSide(a.pair, graph);
    const bEnds = pairEndpointsForSide(b.pair, graph);
    const aKey = layoutSortKey(aEnds.left, aEnds.right);
    const bKey = layoutSortKey(bEnds.left, bEnds.right);
    return (
      aKey[0] - bKey[0] ||
      aKey[1] - bKey[1] ||
      aKey[2].localeCompare(bKey[2]) ||
      (index.get(a.id) ?? 0) - (index.get(b.id) ?? 0)
    );
  });
}

function layoutTubeKey(
  conn: FiberConnection,
  graph: ConnectionGraph,
): string {
  const { left, right } = pairEndpointsForSide(conn.pair, graph);
  const ep = canonicalLayoutEndpoint(left, right);
  return `${ep.device}::${ep.cable}::${ep.tubeColor}`;
}

function rowStepAfter(
  current: FiberConnection,
  next: FiberConnection,
  graph: ConnectionGraph,
): number {
  const sameTube =
    layoutTubeKey(current, graph) === layoutTubeKey(next, graph);
  return FIBER_ROW_PITCH + (sameTube ? 0 : TUBE_GROUP_GAP);
}

/** Stable row index per splice — drives vertical spacing and fiber order in cable nodes. */
export function connectionRowIndexMap(
  graph: ConnectionGraph,
): Map<string, number> {
  const map = new Map<string, number>();
  connectionsInRowLayoutOrder(graph).forEach((conn, index) => {
    map.set(conn.id, index);
  });
  return map;
}

/**
 * Cumulative vertical offset per splice row (px from first row).
 * Within a buffer tube rows are evenly spaced; tube boundaries add extra gap.
 */
export function connectionRowOffsets(
  graph: ConnectionGraph,
): Map<string, number> {
  const map = new Map<string, number>();
  const connections = connectionsInRowLayoutOrder(graph);
  let y = 0;

  for (let i = 0; i < connections.length; i++) {
    map.set(connections[i]!.id, y);
    if (i < connections.length - 1) {
      y += rowStepAfter(connections[i]!, connections[i + 1]!, graph);
    }
  }

  return map;
}
