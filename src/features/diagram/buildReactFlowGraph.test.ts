import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { buildReactFlowGraph } from "./buildReactFlowGraph";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const examples = join(process.cwd(), "docs/reference/examples");

describe("buildReactFlowGraph", () => {
  it("Example #1 (ring cut): 1 drop left, two 144 cables right", () => {
    const csv = readFileSync(
      join(examples, "CSV Splice Detail Example #1.csv"),
      "utf8",
    );
    const graph = buildConnectionGraph(parseBentleyCsv(csv));
    const { nodes, edges } = buildReactFlowGraph(graph);

    const cables = nodes.filter((n) => n.type === "cable");
    expect(cables).toHaveLength(3);

    const left = cables.filter(
      (n) => (n.data as { side: string }).side === "left",
    );
    const right = cables.filter(
      (n) => (n.data as { side: string }).side === "right",
    );
    expect(left).toHaveLength(1);
    expect(right).toHaveLength(2);
    expect(edges.filter((e) => e.type === "splice")).toHaveLength(4);

    const drop = left[0]!.data as { tubes: { fibers: unknown[] }[] };
    expect(drop.tubes[0]!.fibers).toHaveLength(4);

    const laneData = edges.map((e) => e.data as { laneIndex: number });
    expect(new Set(laneData.map((d) => d.laneIndex)).size).toBe(4);
  });

  it("Example #2: four cable nodes, six splice edges", () => {
    const csv = readFileSync(
      join(examples, "CSV Splice Detail Example #2.csv"),
      "utf8",
    );
    const graph = buildConnectionGraph(parseBentleyCsv(csv));
    const { nodes, edges } = buildReactFlowGraph(graph);

    expect(nodes.filter((n) => n.type === "cable")).toHaveLength(4);
    expect(edges.filter((e) => e.type === "splice")).toHaveLength(6);
  });

  it("Example #3: composite cables only, 28 splices", () => {
    const csv = readFileSync(
      join(examples, "CSV Splice Detail Example #3.csv"),
      "utf8",
    );
    const graph = buildConnectionGraph(parseBentleyCsv(csv));
    const { nodes, edges } = buildReactFlowGraph(graph);

    expect(nodes.every((n) => n.type === "cable")).toBe(true);
    expect(edges.filter((e) => e.type === "splice")).toHaveLength(28);
  });
});
