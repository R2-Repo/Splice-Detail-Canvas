import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const example2Path = join(
  process.cwd(),
  "docs/reference/examples/Bentley OpenComms Output Example #2.csv",
);

describe("buildConnectionGraph", () => {
  it("Example #2: three cable legs (drop + 144 in + 144 out)", () => {
    const report = parseBentleyCsv(readFileSync(example2Path, "utf8"));
    const graph = buildConnectionGraph(report);

    expect(graph.report.pairs).toHaveLength(4);
    expect(graph.legs).toHaveLength(3);
    expect(graph.connections.filter((c) => c.kind === "fiber")).toHaveLength(4);

    const distLegs = graph.legs.filter((l) => l.cable.includes("144 DIST"));
    expect(distLegs).toHaveLength(2);
    expect(distLegs.map((l) => l.csvColumn).sort()).toEqual(["from", "to"]);

    const left = graph.legs.filter((l) => l.side === "left");
    const right = graph.legs.filter((l) => l.side === "right");
    expect(left).toHaveLength(2);
    expect(right).toHaveLength(1);
  });
});
