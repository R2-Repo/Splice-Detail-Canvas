import { tubeEndpointKey } from "@/features/diagram/tubeId";
import {
  cableNameKey,
  csvColumnsForCable,
  diagramSideForCsvColumn,
} from "@/features/import/cableLegIdentity";
import type {
  CableAppearanceSummary,
  CableLeg,
  CableLegId,
  ConnectionGraph,
  CsvColumnRole,
  DiagramConnection,
  FiberConnection,
  FiberEndpoint,
  SplicePair,
  SpliceReport,
  TubeConnection,
  TubeEndpoint,
} from "@/types/splice";

export function cableLegId(
  device: string,
  cable: string,
  csvColumn: CsvColumnRole,
): CableLegId {
  return `${device}::${cable}::${csvColumn}`;
}

export function cableLegIdForEndpoint(ep: FiberEndpoint): CableLegId {
  return cableLegId(ep.device, ep.cable, ep.csvColumn);
}

function toTubeEndpoint(
  legId: CableLegId,
  ep: FiberEndpoint,
): TubeEndpoint {
  return {
    key: tubeEndpointKey(legId, ep.tubeColor),
    legId,
    tubeColor: ep.tubeColor,
  };
}

function detectFullTubeCollapse(
  pairs: SplicePair[],
  legA: CableLegId,
  legB: CableLegId,
): TubeConnection | null {
  const byTube = new Map<
    string,
    { a: FiberEndpoint; b: FiberEndpoint; pair: SplicePair }[]
  >();

  for (const pair of pairs) {
    const aLeg = cableLegIdForEndpoint(pair.endpointA);
    const bLeg = cableLegIdForEndpoint(pair.endpointB);
    if (aLeg !== legA || bLeg !== legB) continue;

    const key = `${pair.endpointA.tubeColor}::${pair.endpointB.tubeColor}`;
    const list = byTube.get(key) ?? [];
    list.push({ a: pair.endpointA, b: pair.endpointB, pair });
    byTube.set(key, list);
  }

  for (const [, fibers] of byTube) {
    if (fibers.length !== 12) continue;
    const tubeA = fibers[0]!.a;
    const tubeB = fibers[0]!.b;
    if (tubeA.tubeColor !== tubeB.tubeColor) continue;

    const matched = new Set<string>();
    let ok = true;
    for (const { a, b } of fibers) {
      if (a.fiberColor !== b.fiberColor) {
        ok = false;
        break;
      }
      matched.add(a.fiberColor);
    }
    if (!ok || matched.size !== 12) continue;

    const endpointA = toTubeEndpoint(legA, tubeA);
    const endpointB = toTubeEndpoint(legB, tubeB);
    const id = `tube-${endpointA.key}::${endpointB.key}`;
    return {
      kind: "tube",
      id,
      endpointA,
      endpointB,
      pairIds: fibers.map((f) => f.pair.id),
    };
  }

  return null;
}

function buildLegsFromAppearances(
  appearances: CableAppearanceSummary[],
): CableLeg[] {
  const legs: CableLeg[] = [];

  for (const app of appearances) {
    const columns = csvColumnsForCable(app);
    for (const csvColumn of columns) {
      legs.push({
        id: cableLegId(app.device, app.cable, csvColumn),
        device: app.device,
        cable: app.cable,
        csvColumn,
        side: diagramSideForCsvColumn(csvColumn),
      });
    }
  }

  return legs.sort((a, b) => {
    if (a.side !== b.side) return a.side === "left" ? -1 : 1;
    return a.cable.localeCompare(b.cable);
  });
}

function ensurePairEndpointLegs(
  legs: CableLeg[],
  pairs: SplicePair[],
): CableLeg[] {
  const byId = new Map(legs.map((l) => [l.id, l]));

  for (const pair of pairs) {
    for (const ep of [pair.endpointA, pair.endpointB]) {
      const id = cableLegIdForEndpoint(ep);
      if (!byId.has(id)) {
        const leg: CableLeg = {
          id,
          device: ep.device,
          cable: ep.cable,
          csvColumn: ep.csvColumn,
          side: diagramSideForCsvColumn(ep.csvColumn),
        };
        byId.set(id, leg);
      }
    }
  }

  return [...byId.values()].sort((a, b) => {
    if (a.side !== b.side) return a.side === "left" ? -1 : 1;
    return a.cable.localeCompare(b.cable);
  });
}

export function buildConnectionGraph(report: SpliceReport): ConnectionGraph {
  const legs = ensurePairEndpointLegs(
    buildLegsFromAppearances(report.cableAppearances),
    report.pairs,
  );
  const leftLegs = legs.filter((l) => l.side === "left");
  const rightLegs = legs.filter((l) => l.side === "right");

  const collapsedPairIds = new Set<string>();
  const connections: DiagramConnection[] = [];

  if (leftLegs.length === 1 && rightLegs.length === 1) {
    const collapsed = detectFullTubeCollapse(
      report.pairs,
      leftLegs[0]!.id,
      rightLegs[0]!.id,
    );
    if (collapsed) {
      collapsed.pairIds.forEach((id) => collapsedPairIds.add(id));
      connections.push(collapsed);
    }
  }

  for (const pair of report.pairs) {
    if (collapsedPairIds.has(pair.id)) continue;
    connections.push({ kind: "fiber", id: pair.id, pair });
  }

  return { report, legs, connections };
}

export function orderedFiberConnections(
  graph: ConnectionGraph,
): FiberConnection[] {
  return graph.connections.filter(
    (c): c is FiberConnection => c.kind === "fiber",
  );
}

export function getEndpointSide(
  graph: ConnectionGraph,
  ep: FiberEndpoint,
): "left" | "right" {
  const leg = graph.legs.find((l) => l.id === cableLegIdForEndpoint(ep));
  return leg?.side ?? diagramSideForCsvColumn(ep.csvColumn);
}

export function pairEndpointsForSide(
  pair: SplicePair,
  graph: ConnectionGraph,
): { left: FiberEndpoint; right: FiberEndpoint } {
  const sideA = getEndpointSide(graph, pair.endpointA);
  if (sideA === "left") {
    return { left: pair.endpointA, right: pair.endpointB };
  }
  return { left: pair.endpointB, right: pair.endpointA };
}

/** Resolve appearance summary for one cable name (testing / debug). */
export function resolveLegColumnsForCable(
  app: CableAppearanceSummary,
): CsvColumnRole[] {
  return csvColumnsForCable(app);
}

export { cableNameKey };
