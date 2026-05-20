import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { buildVisualCables } from "./visualCables";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

describe("buildVisualCables", () => {
  it("splits 144 leg into two visual cables for Example #1", () => {
    const csv = readFileSync(
      join(
        process.cwd(),
        "docs/reference/examples/CSV Splice Detail Example #1.csv",
      ),
      "utf8",
    );
    const graph = buildConnectionGraph(parseBentleyCsv(csv));
    const visual = buildVisualCables(graph);
    const dist = visual.filter((v) => v.cable.includes("144-SMF"));
    expect(dist).toHaveLength(2);
    expect(dist.every((v) => v.tubes[0]!.fibers.length === 2)).toBe(true);
  });
});
