import {
  pairEndpointsForSide,
  orderedFiberConnections,
} from "@/features/diagram/buildConnectionGraph";
import {
  CABLE_LAYOUT,
  fiberRowOffsetInCable,
  fiberRowY,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph } from "@/types/splice";

export type AlignedDiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cablePositions: Map<string, { x: number; y: number; height: number }>;
};

function sortConnections(graph: ConnectionGraph) {
  return [...orderedFiberConnections(graph)].sort((a, b) => {
    const aEnds = pairEndpointsForSide(a.pair, graph);
    const bEnds = pairEndpointsForSide(b.pair, graph);
    return (
      aEnds.left.fiberNumber - bEnds.left.fiberNumber ||
      aEnds.left.fiberColor.localeCompare(bEnds.left.fiberColor)
    );
  });
}

export function computeAlignedLayout(
  graph: ConnectionGraph,
  visualCables: VisualCable[],
  placement: Map<string, CablePlacement>,
): AlignedDiagramLayout {
  const rowYs = new Map<string, number>();
  const cablePositions = new Map<
    string,
    { x: number; y: number; height: number }
  >();

  const sorted = sortConnections(graph);

  sorted.forEach((conn, index) => {
    rowYs.set(conn.id, fiberRowY(index));
  });

  const sideOf = (vc: VisualCable) =>
    placement.get(vc.id)?.side ?? vc.side;
  const orderOf = (vc: VisualCable) =>
    placement.get(vc.id)?.order ?? vc.order;

  const leftCables = visualCables
    .filter((vc) => sideOf(vc) === "left")
    .sort((a, b) => orderOf(a) - orderOf(b));
  const rightCables = visualCables
    .filter((vc) => sideOf(vc) === "right")
    .sort((a, b) => orderOf(a) - orderOf(b));

  const placeSide = (cables: VisualCable[], x: number) => {
    for (const vc of cables) {
      let nodeY: number = CABLE_LAYOUT.topY;
      for (const tube of vc.tubes) {
        for (const fiber of tube.fibers) {
          const targetY = rowYs.get(fiber.connectionId);
          if (targetY === undefined) continue;
          const offset = fiberRowOffsetInCable(vc, fiber.connectionId);
          nodeY = Math.min(nodeY, targetY - offset);
        }
      }
      const h = visualCableHeight(vc);
      cablePositions.set(vc.id, { x, y: nodeY, height: h });
    }
  };

  placeSide(leftCables, CABLE_LAYOUT.leftX);
  placeSide(rightCables, CABLE_LAYOUT.rightX);

  return {
    reportKey: "",
    rowYs,
    cablePositions,
  };
}
