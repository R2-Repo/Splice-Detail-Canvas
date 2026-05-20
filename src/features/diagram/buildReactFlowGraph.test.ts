import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { buildReactFlowGraph } from "./buildReactFlowGraph";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const example2Path = join(
  process.cwd(),
  "docs/reference/examples/Bentley OpenComms Output Example #2.csv",
);

describe("buildReactFlowGraph", () => {
  it("Example #2: two 144 legs + drop; one BL tube, one OR tube", () => {
    const report = parseBentleyCsv(readFileSync(example2Path, "utf8"));
    const graph = buildConnectionGraph(report);
    const { nodes } = buildReactFlowGraph(graph);

    const cables = nodes.filter((n) => n.type === "cable");
    expect(cables).toHaveLength(3);

    const distCables = cables.filter((n) =>
      (n.data as { label: string }).label.includes("144 DIST"),
    );
    expect(distCables).toHaveLength(2);

    const tubes = nodes.filter((n) => n.type === "bufferTube");
    expect(tubes).toHaveLength(2);
  });
});
