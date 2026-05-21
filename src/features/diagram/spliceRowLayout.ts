import { connectionsInRowLayoutOrder } from "@/features/diagram/connectionRowOrder";
import {
  CABLE_LAYOUT,
  cableXForSide,
  fiberRowOffsetInCable,
  fiberRowYFromOffset,
  visualCableHeight,
} from "@/features/diagram/cableLayoutMetrics";
import { connectionRowOffsets } from "@/features/diagram/connectionRowOrder";
import type { CablePlacement } from "@/features/diagram/canvasPlacement";
import type { VisualCable } from "@/features/diagram/visualCables";
import type { ConnectionGraph } from "@/types/splice";

export type AlignedDiagramLayout = {
  reportKey: string;
  rowYs: Map<string, number>;
  cablePositions: Map<string, { x: number; y: number; height: number }>;
};

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

  const sorted = connectionsInRowLayoutOrder(graph);
  const rowOffsets = connectionRowOffsets(graph);

  for (const conn of sorted) {
    rowYs.set(
      conn.id,
      fiberRowYFromOffset(rowOffsets.get(conn.id) ?? 0),
    );
  }

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

  const placeSide = (cables: VisualCable[], side: "left" | "right") => {
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
      const x = cableXForSide(side, vc.tubes.length);
      cablePositions.set(vc.id, { x, y: nodeY, height: h });
    }
  };

  placeSide(leftCables, "left");
  placeSide(rightCables, "right");

  return {
    reportKey: "",
    rowYs,
    cablePositions,
  };
}
