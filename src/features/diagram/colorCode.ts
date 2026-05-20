import type { FiberColorAbbrev, TubeColorCode } from "@/types/splice";

export type FiberColorDef = {
  index: number;
  name: string;
  abbrev: FiberColorAbbrev;
  hex: string;
};

/** TIA-598 12-color sequence (tube and fiber). */
export const TIA_12_COLORS: readonly FiberColorDef[] = [
  { index: 1, name: "Blue", abbrev: "BL", hex: "#2563eb" },
  { index: 2, name: "Orange", abbrev: "OR", hex: "#ea580c" },
  { index: 3, name: "Green", abbrev: "GR", hex: "#16a34a" },
  { index: 4, name: "Brown", abbrev: "BR", hex: "#92400e" },
  { index: 5, name: "Slate", abbrev: "SL", hex: "#64748b" },
  { index: 6, name: "White", abbrev: "WH", hex: "#f8fafc" },
  { index: 7, name: "Red", abbrev: "RD", hex: "#dc2626" },
  { index: 8, name: "Black", abbrev: "BK", hex: "#171717" },
  { index: 9, name: "Yellow", abbrev: "YL", hex: "#eab308" },
  { index: 10, name: "Violet", abbrev: "VI", hex: "#7c3aed" },
  { index: 11, name: "Rose", abbrev: "RO", hex: "#f472b6" },
  { index: 12, name: "Aqua", abbrev: "AQ", hex: "#06b6d4" },
] as const;

const ABBREV_SET = new Set(TIA_12_COLORS.map((c) => c.abbrev));

export function isFiberColorAbbrev(value: string): value is FiberColorAbbrev {
  return ABBREV_SET.has(value as FiberColorAbbrev);
}

export function fiberColorFromIndex(index1to12: number): FiberColorDef {
  const idx = ((index1to12 - 1) % 12) + 1;
  return TIA_12_COLORS[idx - 1]!;
}

/** 144-count: fiber N → tube ceil(N/12), fiber color (N-1)%12+1. */
export function fiberNumberToTube(fiberNumber: number): number {
  return Math.ceil(fiberNumber / 12);
}

export function fiberNumberToColorIndex(fiberNumber: number): number {
  return ((fiberNumber - 1) % 12) + 1;
}

export function fiberNumberToAbbrev(fiberNumber: number): FiberColorAbbrev {
  return fiberColorFromIndex(fiberNumberToColorIndex(fiberNumber)).abbrev;
}

export function parseTubeColorCode(raw: string): TubeColorCode | null {
  const code = raw.trim().toUpperCase();
  if (isFiberColorAbbrev(code)) return code;
  const striped = /^([A-Z]{2})-BK$/.exec(code);
  if (striped && isFiberColorAbbrev(striped[1]!)) {
    return `${striped[1]}-BK` as TubeColorCode;
  }
  return null;
}

export function isStripedTube(code: TubeColorCode): boolean {
  return code.endsWith("-BK");
}

export function tubeColorHex(code: TubeColorCode): string {
  const base = code.split("-")[0] as FiberColorAbbrev;
  return colorHex(base);
}

export function colorHex(abbrev: FiberColorAbbrev): string {
  const def = TIA_12_COLORS.find((c) => c.abbrev === abbrev);
  return def?.hex ?? "#94a3b8";
}

export function colorName(abbrev: FiberColorAbbrev): string {
  const def = TIA_12_COLORS.find((c) => c.abbrev === abbrev);
  return def?.name ?? abbrev;
}
