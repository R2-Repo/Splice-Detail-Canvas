import { useEffect, useLayoutEffect, useReducer } from "react";

import { SPLICE_LANE_SEP } from "@/features/diagram/cableLayoutMetrics";

export type SpliceEdgeRouteEntry = {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  fallbackLane: number;
};

/** Rank 0 = highest (smallest sourceY) on the left cable. */
export function sortSpliceRouteEntries(
  entries: SpliceEdgeRouteEntry[],
): SpliceEdgeRouteEntry[] {
  return [...entries].sort(
    (a, b) =>
      a.sourceY - b.sourceY ||
      a.targetY - b.targetY ||
      a.fallbackLane - b.fallbackLane ||
      a.id.localeCompare(b.id),
  );
}

/**
 * When the diagram-right endpoint sits below diagram-left, upper fibers use a
 * lane farther toward the target so horizontal legs do not cross vertical legs.
 * Works when either endpoint is dragged to the opposite screen side.
 */
export function effectiveRoutingLane(
  rank: number,
  laneCount: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
): number {
  if (laneCount <= 1) return 0;
  const leftY = sourceX <= targetX ? sourceY : targetY;
  const rightY = sourceX <= targetX ? targetY : sourceY;
  if (rightY > leftY + 0.5) {
    return laneCount - 1 - rank;
  }
  return rank;
}

export function routingLaneFromEntries(
  entries: SpliceEdgeRouteEntry[],
  edgeId: string,
): number {
  const sorted = sortSpliceRouteEntries(entries);
  const laneCount = sorted.length;
  const rank = sorted.findIndex((e) => e.id === edgeId);
  if (rank < 0) return 0;
  const entry = sorted[rank]!;
  return effectiveRoutingLane(
    rank,
    laneCount,
    entry.sourceX,
    entry.sourceY,
    entry.targetX,
    entry.targetY,
  );
}

/** Explicit H–V–H splice path; each edge owns its vertical at `midX`. */
export function buildOrthogonalSplicePath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
): { path: string; labelX: number; labelY: number } {
  return {
    path: `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${targetY} L ${targetX},${targetY}`,
    labelX: midX,
    labelY: (sourceY + targetY) / 2,
  };
}

/**
 * Left leg stops at the fusion dot; right leg starts there (different strand colors).
 */
export function buildDemarcatedSplicePaths(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  midX: number,
): {
  leftPath: string;
  rightPath: string;
  spliceX: number;
  spliceY: number;
} {
  const spliceY = (sourceY + targetY) / 2;
  return {
    leftPath: `M ${sourceX},${sourceY} L ${midX},${sourceY} L ${midX},${spliceY}`,
    rightPath: `M ${midX},${spliceY} L ${midX},${targetY} L ${targetX},${targetY}`,
    spliceX: midX,
    spliceY,
  };
}

export function spliceMidX(
  sourceX: number,
  targetX: number,
  routingLane: number,
  laneCount: number,
): number {
  const towardTarget = targetX >= sourceX ? 1 : -1;
  const laneOffset =
    (routingLane - (laneCount - 1) / 2) * SPLICE_LANE_SEP * towardTarget;
  return (sourceX + targetX) / 2 + laneOffset;
}

type Registry = {
  entries: Map<string, SpliceEdgeRouteEntry>;
  signature: string;
  subscribers: Set<() => void>;
  raf: number;
};

const registry: Registry = {
  entries: new Map(),
  signature: "",
  subscribers: new Set(),
  raf: 0,
};

function entrySignature(entries: Iterable<SpliceEdgeRouteEntry>): string {
  return [...entries]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (e) =>
        `${e.id}:${Math.round(e.sourceX)}:${Math.round(e.sourceY)}:${Math.round(e.targetX)}:${Math.round(e.targetY)}:${e.fallbackLane}`,
    )
    .join("|");
}

function notifySubscribers() {
  for (const sub of registry.subscribers) sub();
}

/** Sync lane recompute when subscribers exist; skip signature commit if nobody listens yet. */
function flushNotify() {
  const next = entrySignature(registry.entries.values());
  if (registry.subscribers.size === 0) return;
  if (next === registry.signature) return;
  registry.signature = next;
  notifySubscribers();
}

function scheduleNotify() {
  if (registry.raf) return;
  registry.raf = requestAnimationFrame(() => {
    registry.raf = 0;
    flushNotify();
  });
}

function publishEntry(entry: SpliceEdgeRouteEntry) {
  registry.entries.set(entry.id, entry);
  scheduleNotify();
}

function removeEntry(id: string) {
  if (!registry.entries.delete(id)) return;
  scheduleNotify();
}

export function useRoutingLaneIndex(
  edgeId: string,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  fallbackLane: number,
  enabled: boolean,
  laneCountHint: number,
): { routingLane: number; activeLaneCount: number } {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useLayoutEffect(() => {
    if (!enabled) return;
    const sub = () => bump();
    registry.subscribers.add(sub);
    // Initial import: RAF may have fired before any edge subscribed.
    flushNotify();
    return () => {
      registry.subscribers.delete(sub);
      removeEntry(edgeId);
    };
  }, [edgeId, bump, enabled]);

  useEffect(() => {
    if (enabled) return;
    removeEntry(edgeId);
  }, [edgeId, enabled]);

  if (!enabled) {
    return {
      routingLane: fallbackLane,
      activeLaneCount: Math.max(1, laneCountHint),
    };
  }

  publishEntry({
    id: edgeId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    fallbackLane,
  });

  const entries = [...registry.entries.values()];
  const activeLaneCount = Math.max(laneCountHint, entries.length, 1);

  return {
    routingLane: routingLaneFromEntries(entries, edgeId),
    activeLaneCount,
  };
}

/** @internal test helper */
export function resetSpliceRouteRegistryForTests(): void {
  registry.entries.clear();
  registry.signature = "";
  registry.subscribers.clear();
  if (registry.raf) {
    cancelAnimationFrame(registry.raf);
    registry.raf = 0;
  }
}
