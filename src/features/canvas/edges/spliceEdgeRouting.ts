import { useEffect, useReducer } from "react";

import { SPLICE_LANE_SEP } from "@/features/diagram/cableLayoutMetrics";

export type SpliceEdgeRouteEntry = {
  id: string;
  sourceY: number;
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
 * When the right cable sits below the left, upper fibers must drop on a lane
 * farther right than lower fibers so horizontal legs do not cross vertical legs.
 */
export function effectiveRoutingLane(
  rank: number,
  laneCount: number,
  sourceY: number,
  targetY: number,
): number {
  if (laneCount <= 1) return 0;
  if (targetY > sourceY + 0.5) {
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
    entry.sourceY,
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
  const laneOffset =
    (routingLane - (laneCount - 1) / 2) * SPLICE_LANE_SEP;
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
        `${e.id}:${Math.round(e.sourceY)}:${Math.round(e.targetY)}:${e.fallbackLane}`,
    )
    .join("|");
}

function scheduleNotify() {
  if (registry.raf) return;
  registry.raf = requestAnimationFrame(() => {
    registry.raf = 0;
    const next = entrySignature(registry.entries.values());
    if (next === registry.signature) return;
    registry.signature = next;
    for (const sub of registry.subscribers) sub();
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
  sourceY: number,
  targetY: number,
  fallbackLane: number,
  enabled: boolean,
  laneCountHint: number,
): { routingLane: number; activeLaneCount: number } {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (!enabled) return;
    const sub = () => bump();
    registry.subscribers.add(sub);
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

  publishEntry({ id: edgeId, sourceY, targetY, fallbackLane });

  const entries = [...registry.entries.values()];
  const activeLaneCount = Math.max(laneCountHint, entries.length, 1);

  return {
    routingLane: routingLaneFromEntries(entries, edgeId),
    activeLaneCount,
  };
}
