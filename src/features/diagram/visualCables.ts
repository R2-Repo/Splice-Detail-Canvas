import {
  cableLegIdForEndpoint,
  orderedFiberConnections,
  pairEndpointsForSide,
} from "@/features/diagram/buildConnectionGraph";
import {
  FIBER_ROW_PITCH,
  TUBE_GROUP_GAP,
} from "@/features/diagram/cableLayoutMetrics";
import {
  connectionRowIndexMap,
  connectionRowOffsets,
  type RowLayoutVisualCableRef,
} from "@/features/diagram/connectionRowOrder";
import type { DominantCablePair } from "@/features/diagram/dominantCablePair";
import { findDominantCablePair } from "@/features/diagram/dominantCablePair";
import { isThroughCableName } from "@/features/diagram/throughCable";
import type {
  CableLeg,
  CableLegId,
  ConnectionGraph,
  FiberColorAbbrev,
  FiberConnection,
  FiberEndpoint,
  TubeColorCode,
} from "@/types/splice";

export type VisualFiber = {
  connectionId: string;
  fiberNumber: number;
  fiberColor: FiberColorAbbrev;
  tubeColor: TubeColorCode;
  circuitName?: string;
  handleId: string;
  /** Global splice row (0-based) — ordering only. */
  rowIndex: number;
  /**
   * Compact offset within this cable (even 24px pitch, TIA fiber # order top→bottom).
   * Never stretched to match global splice-row gaps — spacing within a tube is fixed.
   */
  rowYOffset: number;
};

export type VisualTube = {
  tubeColor: TubeColorCode;
  fibers: VisualFiber[];
};

export type VisualCable = {
  id: string;
  legId: CableLegId;
  device: string;
  cable: string;
  side: "left" | "right";
  order: number;
  tubes: VisualTube[];
};

type LegFiberRef = {
  connectionId: string;
  endpoint: FiberEndpoint;
  circuitName?: string;
  legId: CableLegId;
  rowIndex: number;
  rowYOffset: number;
};

function fibersOnLeg(
  graph: ConnectionGraph,
  legId: CableLegId,
  rowIndex: Map<string, number>,
  rowOffsets: Map<string, number>,
): LegFiberRef[] {
  const refs: LegFiberRef[] = [];
  for (const conn of orderedFiberConnections(graph)) {
    for (const ep of [conn.pair.endpointA, conn.pair.endpointB]) {
      if (cableLegIdForEndpoint(ep) !== legId) continue;
      refs.push({
        connectionId: conn.id,
        endpoint: ep,
        circuitName: conn.pair.circuitName,
        legId,
        rowIndex: rowIndex.get(conn.id) ?? 0,
        rowYOffset: rowOffsets.get(conn.id) ?? 0,
      });
    }
  }
  return refs.sort((a, b) => a.rowIndex - b.rowIndex);
}

function opposingLegIdsForFibers(
  graph: ConnectionGraph,
  fibers: LegFiberRef[],
): Set<CableLegId> {
  const set = new Set<CableLegId>();
  for (const f of fibers) {
    const conn = orderedFiberConnections(graph).find((c) => c.id === f.connectionId);
    if (!conn) continue;
    for (const ep of [conn.pair.endpointA, conn.pair.endpointB]) {
      const id = cableLegIdForEndpoint(ep);
      if (id !== f.legId) set.add(id);
    }
  }
  return set;
}

/** Ring-cut 144: two cylinders on one side — split into two visual cables (pairs 0–1 and 2–3). */
function instanceCountForGroup(
  cable: string,
  fibers: LegFiberRef[],
  graph: ConnectionGraph,
): number {
  if (!isThroughCableName(cable)) return 1;
  if (fibers.length <= 2) return 1;
  const opposing = opposingLegIdsForFibers(graph, fibers);
  if (opposing.size === 1 && fibers.length === 4) return 2;
  return 1;
}

function chunk<T>(items: T[], parts: number): T[][] {
  if (parts <= 1) return [items];
  const size = Math.ceil(items.length / parts);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Even strand spacing inside one buffer tube; order follows fiber # not splice row. */
function compactTubeOffsets(fibers: LegFiberRef[]): Map<string, number> {
  const sorted = [...fibers].sort(
    (a, b) =>
      a.endpoint.fiberNumber - b.endpoint.fiberNumber ||
      a.rowIndex - b.rowIndex,
  );
  const offsets = new Map<string, number>();
  sorted.forEach((f, index) => {
    offsets.set(f.connectionId, index * FIBER_ROW_PITCH);
  });
  return offsets;
}

function buildTubes(fibers: LegFiberRef[]): VisualTube[] {
  const byTube = new Map<TubeColorCode, LegFiberRef[]>();
  for (const f of fibers) {
    const list = byTube.get(f.endpoint.tubeColor) ?? [];
    list.push(f);
    byTube.set(f.endpoint.tubeColor, list);
  }

  let tubeBaseOffset = 0;
  const tubes: VisualTube[] = [];

  for (const [tubeColor, tubeFibers] of [...byTube.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const sorted = [...tubeFibers].sort(
      (a, b) =>
        a.endpoint.fiberNumber - b.endpoint.fiberNumber ||
        a.rowIndex - b.rowIndex,
    );
    const compact = compactTubeOffsets(sorted);
    const maxCompact = sorted.reduce(
      (max, f) => Math.max(max, compact.get(f.connectionId) ?? 0),
      0,
    );

    tubes.push({
      tubeColor,
      fibers: sorted.map((f) => ({
        connectionId: f.connectionId,
        fiberNumber: f.endpoint.fiberNumber,
        fiberColor: f.endpoint.fiberColor,
        tubeColor: f.endpoint.tubeColor,
        circuitName: f.circuitName,
        handleId: `fiber-${f.connectionId}`,
        rowIndex: f.rowIndex,
        rowYOffset: tubeBaseOffset + (compact.get(f.connectionId) ?? 0),
      })),
    });

    if (sorted.length > 0) {
      tubeBaseOffset += maxCompact + FIBER_ROW_PITCH + TUBE_GROUP_GAP;
    }
  }

  return tubes;
}

function groupKey(leg: CableLeg): string {
  return `${leg.side}::${leg.cable}`;
}

export function buildVisualCables(
  graph: ConnectionGraph,
  splitLayoutHint?: RowLayoutVisualCableRef[],
  dominant?: DominantCablePair | null,
): VisualCable[] {
  const rowIndex = connectionRowIndexMap(graph, splitLayoutHint, dominant);
  const rowOffsets = connectionRowOffsets(graph, splitLayoutHint, dominant);
  const groups = new Map<
    string,
    {
      side: "left" | "right";
      cable: string;
      device: string;
      legId: CableLegId;
      fibers: LegFiberRef[];
    }
  >();

  for (const leg of graph.legs) {
    const fibers = fibersOnLeg(graph, leg.id, rowIndex, rowOffsets);
    if (fibers.length === 0) continue;

    const key = groupKey(leg);
    const existing = groups.get(key);
    if (existing) {
      const seen = new Set(existing.fibers.map((f) => f.connectionId));
      for (const f of fibers) {
        if (seen.has(f.connectionId)) continue;
        seen.add(f.connectionId);
        existing.fibers.push(f);
      }
    } else {
      groups.set(key, {
        side: leg.side,
        cable: leg.cable,
        device: leg.device,
        legId: leg.id,
        fibers: [...fibers],
      });
    }
  }

  const visual: VisualCable[] = [];
  let orderLeft = 0;
  let orderRight = 0;

  for (const [key, group] of groups) {
    const sortedFibers = [...group.fibers].sort(
      (a, b) => a.rowIndex - b.rowIndex,
    );
    const instances = instanceCountForGroup(group.cable, sortedFibers, graph);
    const chunks = chunk(sortedFibers, instances);
    const baseOrder = group.side === "left" ? orderLeft++ : orderRight++;

    chunks.forEach((fiberChunk, instIdx) => {
      const id = instIdx === 0 ? key : `${key}~${instIdx}`;
      visual.push({
        id,
        legId: group.legId,
        device: group.device,
        cable: group.cable,
        side: group.side,
        order: baseOrder + instIdx * 0.01,
        tubes: buildTubes(fiberChunk),
      });
    });
  }

  return visual;
}

/** Two-pass build: detect ring-cut splits, then apply split-aware row spacing. */
export function buildVisualCablesForLayout(graph: ConnectionGraph): {
  visualCables: VisualCable[];
  dominant: DominantCablePair | null;
} {
  const pass1 = buildVisualCables(graph);
  const dominant = findDominantCablePair(graph, pass1);
  const visualCables = buildVisualCables(graph, pass1, dominant);
  return { visualCables, dominant };
}

export function findVisualCableForConnection(
  visualCables: VisualCable[],
  connectionId: string,
  side: "left" | "right",
): VisualCable | undefined {
  return visualCables.find(
    (vc) =>
      vc.side === side &&
      vc.tubes.some((t) =>
        t.fibers.some((f) => f.connectionId === connectionId),
      ),
  );
}

export function endpointOnVisualSide(
  conn: FiberConnection,
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  side: "left" | "right",
): { visualCableId: string; handleId: string; endpoint: FiberEndpoint } | null {
  const ends = pairEndpointsForSide(conn.pair, graph);
  const ep = side === "left" ? ends.left : ends.right;
  const vc = findVisualCableForConnection(visualCables, conn.id, side);
  if (!vc) return null;
  const fiber = vc.tubes
    .flatMap((t) => t.fibers)
    .find((f) => f.connectionId === conn.id);
  if (!fiber) return null;
  return {
    visualCableId: vc.id,
    handleId: fiber.handleId,
    endpoint: ep,
  };
}
