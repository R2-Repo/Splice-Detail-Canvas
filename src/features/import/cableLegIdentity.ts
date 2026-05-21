import type { CsvColumnRole, FiberEndpoint, SplicePair } from "@/types/splice";

export type SectionColumnCounts = { from: number; to: number };

/** From/To appearance counts per cable in Left --- vs Right --- sections. */
export type CableAppearanceSummary = {
  /** Remote Bentley device — diagnostic only; not used for leg identity. */
  device: string;
  cable: string;
  left: SectionColumnCounts;
  right: SectionColumnCounts;
};

/** Physical cable at this splice — Bentley name only (device ignored). */
export function cableNameKey(cable: string): string {
  return cable.trim();
}

const emptyCounts = (): SectionColumnCounts => ({ from: 0, to: 0 });

export function recordCableAppearance(
  map: Map<string, CableAppearanceSummary>,
  ep: FiberEndpoint,
  column: CsvColumnRole,
  section: "left" | "right",
): void {
  const key = cableNameKey(ep.cable);
  const entry = map.get(key) ?? {
    device: "",
    cable: ep.cable,
    left: emptyCounts(),
    right: emptyCounts(),
  };
  entry[section][column] += 1;
  map.set(key, entry);
}

const MAX_EXHAUSTIVE_CABLES = 14;

/**
 * One canvas side per physical cable for node placement.
 * Maximizes opposite-side pair weight; tie-breaks with From→left preference.
 */
export function computeCableCanvasSides(
  pairs: SplicePair[],
): Map<string, "left" | "right"> {
  const counts = new Map<string, { from: number; to: number }>();
  const pairWeight = new Map<string, number>();

  for (const pair of pairs) {
    for (const ep of [pair.endpointA, pair.endpointB]) {
      const key = cableNameKey(ep.cable);
      const tally = counts.get(key) ?? { from: 0, to: 0 };
      tally[ep.csvColumn] += 1;
      counts.set(key, tally);
    }

    const a = pair.endpointA.cable;
    const b = pair.endpointB.cable;
    if (a === b) continue;
    const edgeKey = [a, b].sort().join("\0");
    pairWeight.set(edgeKey, (pairWeight.get(edgeKey) ?? 0) + 1);
  }

  const cables = [...counts.keys()].sort((a, b) => a.localeCompare(b));

  function preferredSide(cable: string): "left" | "right" {
    const tally = counts.get(cableNameKey(cable)) ?? { from: 0, to: 0 };
    return tally.from >= tally.to ? "left" : "right";
  }

  function oppositeWeight(sides: Map<string, "left" | "right">): number {
    let score = 0;
    for (const [edgeKey, weight] of pairWeight) {
      const [a, b] = edgeKey.split("\0");
      if (sides.get(a) !== sides.get(b)) score += weight;
    }
    return score;
  }

  function preferenceScore(sides: Map<string, "left" | "right">): number {
    let score = 0;
    for (const cable of cables) {
      if (sides.get(cable) === preferredSide(cable)) score += 1;
    }
    return score;
  }

  if (cables.length === 0) return new Map();

  if (cables.length <= MAX_EXHAUSTIVE_CABLES) {
    let best = new Map<string, "left" | "right">();
    let bestWeight = -1;
    let bestPref = -1;

    for (let mask = 0; mask < 1 << cables.length; mask++) {
      const sides = new Map<string, "left" | "right">();
      cables.forEach((cable, index) => {
        sides.set(cable, (mask >> index) & 1 ? "right" : "left");
      });
      const weight = oppositeWeight(sides);
      const pref = preferenceScore(sides);
      if (weight > bestWeight || (weight === bestWeight && pref > bestPref)) {
        bestWeight = weight;
        bestPref = pref;
        best = sides;
      }
    }
    return best;
  }

  const sides = new Map<string, "left" | "right">();
  for (const cable of cables) {
    sides.set(cable, preferredSide(cable));
  }
  return sides;
}

/**
 * Bentley often reuses the same cable name for in/out legs at a mid-span case.
 * Mirror pattern: appears as To in Left --- and From in Right --- only → two legs.
 * Drop pattern: From in Left --- and To in Right --- only → one leg on the left.
 */
export function csvColumnsForCable(counts: {
  left: { from: number; to: number };
  right: { from: number; to: number };
}): CsvColumnRole[] {
  const leftFrom = counts.left.from > 0;
  const leftTo = counts.left.to > 0;
  const rightFrom = counts.right.from > 0;
  const rightTo = counts.right.to > 0;

  if (leftTo && !leftFrom && rightFrom && !rightTo) {
    return ["from", "to"];
  }
  if (leftFrom && !leftTo && rightTo && !rightFrom) {
    return ["from"];
  }
  if (leftFrom && leftTo) {
    return ["from", "to"];
  }
  if (leftFrom) return ["from"];
  if (leftTo) return ["to"];
  if (rightFrom) return ["from"];
  if (rightTo) return ["to"];
  return [];
}

export function diagramSideForCsvColumn(
  column: CsvColumnRole,
): "left" | "right" {
  return column === "from" ? "left" : "right";
}
