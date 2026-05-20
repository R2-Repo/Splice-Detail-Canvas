import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { computeCanvasPlacement } from "./canvasPlacement";
import { fiberRowOffsetInCable } from "./cableLayoutMetrics";
import { computeAlignedLayout } from "./spliceRowLayout";
import { buildVisualCables } from "./visualCables";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const examples = join(process.cwd(), "docs/reference/examples");

describe("computeAlignedLayout", () => {
  it("Example #2: left/right fiber rows share same Y per splice", () => {
    const graph = buildConnectionGraph(
      parseBentleyCsv(
        readFileSync(join(examples, "CSV Splice Detail Example #2.csv"), "utf8"),
      ),
    );
    const visual = buildVisualCables(graph);
    const placement = computeCanvasPlacement(graph, visual);
    const layout = computeAlignedLayout(graph, visual, placement);

    const conn = graph.connections.find((c) => c.kind === "fiber")!;
    const rowY = layout.rowYs.get(conn.id)!;

    for (const vc of visual) {
      for (const tube of vc.tubes) {
        for (const fiber of tube.fibers) {
          if (fiber.connectionId !== conn.id) continue;
          const pos = layout.cablePositions.get(vc.id)!;
          const absY = pos.y + fiberRowOffsetInCable(vc, fiber.connectionId);
          expect(Math.abs(absY - rowY)).toBeLessThan(2);
        }
      }
    }
  });
});
