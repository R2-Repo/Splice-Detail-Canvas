import type { SplicePair } from "@/types/splice";

import { cableNameKey } from "@/features/import/cableLegIdentity";

export type LayoutScoreWeights = {
  crossings: number;
  bends: number;
  sideChanges: number;
  verticalSpread: number;
};

export const DEFAULT_LAYOUT_SCORE_WEIGHTS: LayoutScoreWeights = {
  crossings: 1000,
  bends: 100,
  sideChanges: 5,
  verticalSpread: 1,
};

export type ScoredSideAssignment = {
  sides: Map<string, "left" | "right">;
  score: number;
  crossings: number;
  /** Same-side fiber pairs (not geometric splice elbows). */
  bends: number;
  sameSidePairs: number;
  sideChanges: number;
};

function fiberSortKey(ep: SplicePair["endpointA"]): number {
  return ep.fiberNumber * 100 + ep.tubeColor.length;
}

function preferredSide(
  cable: string,
  counts: Map<string, { from: number; to: number }>,
): "left" | "right" {
  const tally = counts.get(cableNameKey(cable)) ?? { from: 0, to: 0 };
  return tally.from >= tally.to ? "left" : "right";
}

/** Count inversions — proxy for fiber-line crossings. */
function countInversions(values: number[]): number {
  let inversions = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i]! > values[j]!) inversions += 1;
    }
  }
  return inversions;
}

export function scoreCableSideAssignment(
  pairs: SplicePair[],
  sides: Map<string, "left" | "right">,
  weights: LayoutScoreWeights = DEFAULT_LAYOUT_SCORE_WEIGHTS,
): ScoredSideAssignment {
  const counts = new Map<string, { from: number; to: number }>();
  for (const pair of pairs) {
    for (const ep of [pair.endpointA, pair.endpointB]) {
      const key = cableNameKey(ep.cable);
      const tally = counts.get(key) ?? { from: 0, to: 0 };
      tally[ep.csvColumn] += 1;
      counts.set(key, tally);
    }
  }

  let sameSidePairs = 0;
  let sideChanges = 0;
  const crossPairs: { leftKey: number; rightKey: number }[] = [];

  for (const pair of pairs) {
    const sideA = sides.get(cableNameKey(pair.endpointA.cable)) ?? "left";
    const sideB = sides.get(cableNameKey(pair.endpointB.cable)) ?? "left";

    if (sideA === sideB) {
      sameSidePairs += 1;
      continue;
    }

    const leftEp = sideA === "left" ? pair.endpointA : pair.endpointB;
    const rightEp = sideA === "left" ? pair.endpointB : pair.endpointA;
    crossPairs.push({
      leftKey: fiberSortKey(leftEp),
      rightKey: fiberSortKey(rightEp),
    });
  }

  for (const cable of counts.keys()) {
    if (sides.get(cable) !== preferredSide(cable, counts)) {
      sideChanges += 1;
    }
  }

  crossPairs.sort((a, b) => a.leftKey - b.leftKey);
  const crossings = countInversions(crossPairs.map((p) => p.rightKey));
  const verticalSpread = crossPairs.length;

  const score =
    crossings * weights.crossings +
    sameSidePairs * weights.bends +
    sideChanges * weights.sideChanges +
    verticalSpread * weights.verticalSpread;

  return {
    sides,
    score,
    crossings,
    bends: sameSidePairs,
    sameSidePairs,
    sideChanges,
  };
}

export function mirrorSideAssignment(
  sides: Map<string, "left" | "right">,
): Map<string, "left" | "right"> {
  const mirrored = new Map<string, "left" | "right">();
  for (const [cable, side] of sides) {
    mirrored.set(cable, side === "left" ? "right" : "left");
  }
  return mirrored;
}

export function compareSideAssignments(
  a: ScoredSideAssignment,
  b: ScoredSideAssignment,
): number {
  if (a.sameSidePairs === 0 && b.sameSidePairs > 0) return -1;
  if (b.sameSidePairs === 0 && a.sameSidePairs > 0) return 1;
  if (a.sameSidePairs !== b.sameSidePairs) {
    return a.sameSidePairs - b.sameSidePairs;
  }
  if (a.crossings !== b.crossings) return a.crossings - b.crossings;
  return a.score - b.score;
}

export function pickBestSideAssignment(
  candidates: Map<string, "left" | "right">[],
  pairs: SplicePair[],
): Map<string, "left" | "right"> {
  let best = candidates[0] ?? new Map<string, "left" | "right">();
  let bestScored = scoreCableSideAssignment(pairs, best);

  for (const sides of candidates.slice(1)) {
    const scored = scoreCableSideAssignment(pairs, sides);
    if (compareSideAssignments(scored, bestScored) < 0) {
      bestScored = scored;
      best = sides;
    }
  }
  return best;
}

/** Candidate side maps for tie-breaking equal opposite-weight assignments. */
export function generateSideAssignmentCandidates(
  base: Map<string, "left" | "right">,
): Map<string, "left" | "right">[] {
  const candidates = [base, mirrorSideAssignment(base)];
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = [...c.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
