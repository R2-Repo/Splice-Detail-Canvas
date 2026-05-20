import { isFiberColorAbbrev, parseTubeColorCode } from "@/features/diagram/colorCode";
import {
  cableNameKey,
  recordCableAppearance,
  type CableAppearanceSummary,
} from "@/features/import/cableLegIdentity";
import { failRow, toParseRowResult, tokenizeBentleyRow } from "@/features/import/bentleyRow";
import type {
  ParseRowFailureReason,
  ParseRowResult,
} from "@/features/import/parseReasons";
import type {
  CsvColumnRole,
  FiberColorAbbrev,
  FiberEndpoint,
  SplicePair,
  SpliceReport,
  SpliceReportHeader,
} from "@/types/splice";

export type { ParseRowResult, ParseRowFailureReason } from "@/features/import/parseReasons";

function parseHeader(lines: string[]): SpliceReportHeader {
  const header: SpliceReportHeader = {};
  const text = lines.join("\n");

  const deviceType = /Device Type:\s*(.+?)\s+Model:/.exec(text);
  if (deviceType) header.deviceType = deviceType[1]!.trim();

  const model = /Model:\s*(.+?)\s+Name:/.exec(text);
  if (model) header.model = model[1]!.trim();

  const name = /Name:\s*(.+?)\s+ID:/.exec(text);
  if (name) header.name = name[1]!.trim();

  const id = /ID:\s*(\d+)/.exec(text);
  if (id) header.id = id[1];

  const reportDate = /Report Date:\s*(.+)/.exec(text);
  if (reportDate) header.reportDate = reportDate[1]!.trim();

  const location = /Location:\s*(.+)/.exec(text);
  if (location) header.location = location[1]!.trim();

  const spliceNumber = /Splice#:\s*(.+)/.exec(text);
  if (spliceNumber) header.spliceNumber = spliceNumber[1]!.trim();

  return header;
}

function parseFiberNumber(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : Number.NaN;
}

function trimTrailingEmpty(parts: string[]): string[] {
  const out = parts.map((s) => s.trim());
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

/** Bentley often repeats CH/OS in the last two columns — keep one. */
function stripDuplicateTrailingFields(parts: string[]): string[] {
  const p = parts.map((s) => s.trim());
  while (p.length > 6 && p[p.length - 1] === p[p.length - 2]) {
    p.pop();
  }
  return p;
}

/** Last To-side column is OS when non-empty and not a fiber/device field. */
function isOsField(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (/^CH\s+\d+/i.test(t)) return true;
  if (/^EL-\d+/i.test(t)) return true;
  if (t.startsWith("[")) return true;
  return false;
}

/** Fixed tail after cable: fiber#, tube, fiber color, device [, OS]. */
function toSideTailLength(parts: string[]): number {
  const last = parts[parts.length - 1] ?? "";
  return isOsField(last) ? 5 : 4;
}

/** Bentley rows often end with `, ,` or `,device,` — drop stray trailing empty fields. */
function trimExtraTrailingEmpties(parts: string[]): string[] {
  const p = parts.map((s) => s.trim());
  while (p.length > 0 && p[p.length - 1] === "") {
    const withoutLast = p.slice(0, -1);
    const tailLen = toSideTailLength(withoutLast.length > 0 ? withoutLast : p);
    if (p.length <= tailLen + 1) break;
    p.pop();
  }
  return p;
}

type EndpointParseResult =
  | { ok: true; endpoint: FiberEndpoint }
  | { ok: false; reason: ParseRowFailureReason; detail: string };

function parseFromSide(
  parts: string[],
  csvColumn: CsvColumnRole,
): EndpointParseResult {
  const p = trimTrailingEmpty(parts);
  if (p.length < 5) {
    return {
      ok: false,
      reason: "FROM_TOO_FEW_FIELDS",
      detail: `From side has ${p.length} field(s), need at least 5`,
    };
  }

  const fiberColor = p[p.length - 1]!;
  const tubeRaw = p[p.length - 2]!;
  const fiberNumRaw = p[p.length - 3]!;
  const tubeColor = parseTubeColorCode(tubeRaw);
  if (!tubeColor) {
    return {
      ok: false,
      reason: "FROM_INVALID_TUBE",
      detail: `Invalid tube color "${tubeRaw}"`,
    };
  }
  if (!isFiberColorAbbrev(fiberColor)) {
    return {
      ok: false,
      reason: "FROM_INVALID_FIBER",
      detail: `Invalid fiber color "${fiberColor}"`,
    };
  }

  const device = p[0]!.trim();
  const cable = p.slice(1, p.length - 3).join(", ").trim();
  if (!cable) {
    return { ok: false, reason: "EMPTY_CABLE", detail: "From cable name is empty" };
  }

  return {
    ok: true,
    endpoint: {
      device,
      cable,
      fiberNumber: parseFiberNumber(fiberNumRaw),
      tubeColor,
      fiberColor: fiberColor as FiberColorAbbrev,
      csvColumn,
    },
  };
}

/**
 * To side: Cable, Fiber#, Tube, Fiber, Device [, OS] — fixed suffix from row end.
 * Do not trim trailing empties (they hold column positions).
 */
function parseToSide(
  parts: string[],
  csvColumn: CsvColumnRole,
): EndpointParseResult {
  const p = trimExtraTrailingEmpties(stripDuplicateTrailingFields(parts));
  const tailLen = toSideTailLength(p);
  const minLen = tailLen + 1;

  if (p.length < minLen) {
    return {
      ok: false,
      reason: "TO_TOO_FEW_FIELDS",
      detail: `To side has ${p.length} field(s), need cable + ${tailLen} tail field(s)`,
    };
  }

  const cableEnd = p.length - tailLen;
  if (cableEnd < 1) {
    return {
      ok: false,
      reason: "TO_TOO_FEW_FIELDS",
      detail: "No cable name fields before fiber#/tube/fiber",
    };
  }

  const fiberNumRaw = p[p.length - tailLen]!;
  const tubeRaw = p[p.length - tailLen + 1]!;
  const fiberColor = p[p.length - tailLen + 2]!;
  const device = (p[p.length - tailLen + 3] ?? "").trim();

  const tubeColor = parseTubeColorCode(tubeRaw);
  if (!tubeColor) {
    return {
      ok: false,
      reason: "TO_INVALID_TUBE",
      detail: `Invalid tube color "${tubeRaw}"`,
    };
  }
  if (!isFiberColorAbbrev(fiberColor)) {
    return {
      ok: false,
      reason: "TO_INVALID_FIBER",
      detail: `Invalid fiber color "${fiberColor}"`,
    };
  }

  const cable = p.slice(0, cableEnd).join(", ").trim();
  if (!cable) {
    return { ok: false, reason: "EMPTY_CABLE", detail: "To cable name is empty" };
  }

  return {
    ok: true,
    endpoint: {
      device,
      cable,
      fiberNumber: parseFiberNumber(fiberNumRaw),
      tubeColor,
      fiberColor: fiberColor as FiberColorAbbrev,
      csvColumn,
    },
  };
}

function normalizePairEndpoints(
  a: FiberEndpoint,
  b: FiberEndpoint,
): { endpointA: FiberEndpoint; endpointB: FiberEndpoint } | null {
  let endpointA = { ...a };
  let endpointB = { ...b };

  if (!Number.isFinite(endpointA.fiberNumber) && Number.isFinite(endpointB.fiberNumber)) {
    endpointA = { ...endpointA, fiberNumber: endpointB.fiberNumber };
  }
  if (!Number.isFinite(endpointB.fiberNumber) && Number.isFinite(endpointA.fiberNumber)) {
    endpointB = { ...endpointB, fiberNumber: endpointA.fiberNumber };
  }
  if (!Number.isFinite(endpointA.fiberNumber) || !Number.isFinite(endpointB.fiberNumber)) {
    return null;
  }

  if (!endpointA.device && endpointB.device) {
    endpointA = { ...endpointA, device: endpointB.device };
  }
  if (!endpointB.device && endpointA.device) {
    endpointB = { ...endpointB, device: endpointA.device };
  }

  return { endpointA, endpointB };
}

export function parseDataRowWithResult(
  line: string,
  lineNumber: number,
  csvSideHint: "left" | "right",
): ParseRowResult {
  const row = tokenizeBentleyRow(line, lineNumber, csvSideHint);
  if (!row) {
    return failRow(line, lineNumber, "NO_ARROW", "Missing <-> marker");
  }

  const { leftParts, rightParts } = row;

  const fromResult = parseFromSide(leftParts, "from");
  if (!fromResult.ok) {
    return failRow(line, lineNumber, fromResult.reason, fromResult.detail);
  }

  const toResult = parseToSide(rightParts, "to");
  if (!toResult.ok) {
    return failRow(line, lineNumber, toResult.reason, toResult.detail);
  }

  const normalized = normalizePairEndpoints(
    fromResult.endpoint,
    toResult.endpoint,
  );
  if (!normalized) {
    return failRow(
      line,
      lineNumber,
      "MISSING_FIBER_NUMBER",
      "Fiber number missing on both sides",
    );
  }

  const { endpointA, endpointB } = normalized;
  const id = pairKey(endpointA, endpointB);
  const circuitName = extractCircuitName(rightParts);
  return toParseRowResult(
    { line, lineNumber, endpointA, endpointB },
    csvSideHint,
    id,
    circuitName,
  );
}

/** OS / circuit name from To-side tail (if present). */
export function extractCircuitName(rightParts: string[]): string | undefined {
  const p = trimExtraTrailingEmpties(
    stripDuplicateTrailingFields(rightParts.map((s) => s.trim())),
  );
  const last = p[p.length - 1] ?? "";
  return isOsField(last) ? last.trim() : undefined;
}

/** @deprecated Use parseDataRowWithResult — returns pair only for backward compatibility */
export function parseDataRow(
  line: string,
  csvSideHint: "left" | "right",
): SplicePair | null {
  const result = parseDataRowWithResult(line, 0, csvSideHint);
  return result.ok ? result.pair : null;
}

export function endpointKey(ep: FiberEndpoint): string {
  return [
    ep.device,
    ep.cable,
    ep.csvColumn,
    String(ep.fiberNumber),
    ep.tubeColor,
    ep.fiberColor,
  ].join("|");
}

export function pairKey(a: FiberEndpoint, b: FiberEndpoint): string {
  const keys = [endpointKey(a), endpointKey(b)].sort();
  return keys.join("::");
}

function dedupePairs(pairs: SplicePair[]): SplicePair[] {
  const seen = new Map<string, SplicePair>();
  for (const pair of pairs) {
    if (!seen.has(pair.id)) seen.set(pair.id, pair);
  }
  return [...seen.values()];
}

export function parseLeftSectionRows(csvText: string): ParseRowResult[] {
  const results: ParseRowResult[] = [];
  let section: "left" | "right" | null = null;
  let lineNumber = 0;

  for (const rawLine of csvText.split(/\r?\n/)) {
    lineNumber += 1;
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "Left ---") {
      section = "left";
      continue;
    }
    if (line === "Right ---") break;
    if (section !== "left" || !line.includes("<->")) continue;

    results.push(parseDataRowWithResult(line, lineNumber, "left"));
  }

  return results;
}

function scanCableAppearances(
  lines: string[],
): Map<string, CableAppearanceSummary> {
  const map = new Map<string, CableAppearanceSummary>();
  let section: "left" | "right" | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "Left ---") {
      section = "left";
      continue;
    }
    if (line === "Right ---") {
      section = "right";
      continue;
    }
    if (!line.includes("<->") || section === null) continue;

    const pair = parseDataRow(line, section);
    if (!pair) continue;
    recordCableAppearance(map, pair.endpointA, "from", section);
    recordCableAppearance(map, pair.endpointB, "to", section);
  }

  return map;
}

export function parseBentleyCsv(csvText: string): SpliceReport {
  const lines = csvText.split(/\r?\n/);
  const header = parseHeader(lines.slice(0, 12));
  const leftResults = parseLeftSectionRows(csvText);

  const pairs = dedupePairs(
    leftResults.filter((r): r is Extract<ParseRowResult, { ok: true }> => r.ok).map((r) => r.pair),
  );

  const cableAppearances = scanCableAppearances(lines);

  return {
    header,
    pairs,
    cableAppearances: [...cableAppearances.values()],
    leftRowResults: leftResults,
  };
}

export { cableNameKey };
