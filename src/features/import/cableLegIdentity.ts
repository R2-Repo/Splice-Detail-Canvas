import type { CsvColumnRole, FiberEndpoint } from "@/types/splice";

export type SectionColumnCounts = { from: number; to: number };

/** From/To appearance counts per cable in Left --- vs Right --- sections. */
export type CableAppearanceSummary = {
  device: string;
  cable: string;
  left: SectionColumnCounts;
  right: SectionColumnCounts;
};

export function cableNameKey(device: string, cable: string): string {
  return `${device}::${cable}`;
}

const emptyCounts = (): SectionColumnCounts => ({ from: 0, to: 0 });

export function recordCableAppearance(
  map: Map<string, CableAppearanceSummary>,
  ep: FiberEndpoint,
  column: CsvColumnRole,
  section: "left" | "right",
): void {
  const key = cableNameKey(ep.device, ep.cable);
  const entry = map.get(key) ?? {
    device: ep.device,
    cable: ep.cable,
    left: emptyCounts(),
    right: emptyCounts(),
  };
  entry[section][column] += 1;
  map.set(key, entry);
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
