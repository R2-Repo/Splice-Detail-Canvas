import type { LayoutOverrides } from "@/types/splice";

export function loadLayoutOverrides(
  reportKey: string,
): LayoutOverrides | undefined {
  try {
    const raw = localStorage.getItem(reportKey);
    if (!raw) return undefined;
    return JSON.parse(raw) as LayoutOverrides;
  } catch {
    return undefined;
  }
}

export function saveLayoutOverrides(overrides: LayoutOverrides): void {
  try {
    localStorage.setItem(overrides.reportKey, JSON.stringify(overrides));
  } catch {
    /* quota / private mode */
  }
}

export function positionsFromNodes(
  nodes: { id: string; position: { x: number; y: number } }[],
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    positions[node.id] = { x: node.position.x, y: node.position.y };
  }
  return positions;
}
