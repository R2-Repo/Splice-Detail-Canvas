/** Fiber / splice domain types (model-first, independent of React Flow). */

import type { ParseRowResult } from "@/features/import/parseReasons";

export type { ParseRowResult };

export type FiberColorAbbrev =
  | "BL"
  | "OR"
  | "GR"
  | "BR"
  | "SL"
  | "WH"
  | "RD"
  | "BK"
  | "YL"
  | "VI"
  | "RO"
  | "AQ";

export type TubeColorCode = FiberColorAbbrev | `${FiberColorAbbrev}-BK`;

/** Which side of `<->` the endpoint was parsed from (Bentley From / To columns). */
export type CsvColumnRole = "from" | "to";

export type FiberEndpoint = {
  device: string;
  cable: string;
  /** CSV fiber number (Bentley "Number/Buffer" column) — not the tube color. */
  fiberNumber: number;
  /** CSV buffer tube color (first Color column, e.g. BL). */
  tubeColor: TubeColorCode;
  /** CSV second color — fiber color within the tube. */
  fiberColor: FiberColorAbbrev;
  /** From or To column — disambiguates duplicate cable names (in/out legs). */
  csvColumn: CsvColumnRole;
};

export type SplicePair = {
  id: string;
  endpointA: FiberEndpoint;
  endpointB: FiberEndpoint;
  /** Bentley OS column — circuit name (fiber-level). */
  circuitName?: string;
  /** Soft hint from CSV Left / Right section. */
  csvSideHint?: "left" | "right";
};

export type SpliceReportHeader = {
  deviceType?: string;
  model?: string;
  name?: string;
  id?: string;
  reportDate?: string;
  location?: string;
  spliceNumber?: string;
};

export type CableAppearanceSummary = {
  device: string;
  cable: string;
  left: { from: number; to: number };
  right: { from: number; to: number };
};

export type SpliceReport = {
  header: SpliceReportHeader;
  pairs: SplicePair[];
  /** Per-cable From/To counts in Left and Right sections (mirror disambiguation). */
  cableAppearances: CableAppearanceSummary[];
  /** Per-row outcomes for Left --- section (diagnostics). */
  leftRowResults?: ParseRowResult[];
};

/**
 * Unique cable leg in this diagram — not the same as Bentley cable name.
 * Same name may map to two legs (`from` / `to`) at a mid-span case.
 */
export type CableLegId = string;

export type CableLeg = {
  id: CableLegId;
  device: string;
  cable: string;
  /** Disambiguates duplicate names (in/out through-cable legs). */
  csvColumn: CsvColumnRole;
  /** Visual side after layout. */
  side: "left" | "right";
};

export type TubeEndpointKey = string;

export type TubeEndpoint = {
  key: TubeEndpointKey;
  legId: CableLegId;
  tubeColor: TubeColorCode;
};

export type FiberConnection = {
  kind: "fiber";
  id: string;
  pair: SplicePair;
};

export type TubeConnection = {
  kind: "tube";
  id: string;
  endpointA: TubeEndpoint;
  endpointB: TubeEndpoint;
  pairIds: string[];
};

export type DiagramConnection = FiberConnection | TubeConnection;

export type ConnectionGraph = {
  report: SpliceReport;
  legs: CableLeg[];
  connections: DiagramConnection[];
};

export type LayoutNodePosition = {
  id: string;
  x: number;
  y: number;
};

export type LayoutOverrides = {
  reportKey: string;
  positions: Record<string, { x: number; y: number }>;
  existingEdgeIds?: string[];
};
