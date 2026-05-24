import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
import { buildReactFlowGraph } from "./buildReactFlowGraph";
import {
  buildLayoutRuleContext,
  checkAllLayoutRules,
  checkLayoutRule,
  LAYOUT_RULE_IDS,
  LAYOUT_RULES,
  type LayoutRuleId,
} from "./layoutRules";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const examples = join(process.cwd(), "docs/reference/examples");
const EXAMPLE_NUMBERS = [1, 2, 3] as const;

function graphFromExample(n: (typeof EXAMPLE_NUMBERS)[number]) {
  const csv = readFileSync(
    join(examples, `CSV Splice Detail Example #${n}.csv`),
    "utf8",
  );
  return buildConnectionGraph(parseBentleyCsv(csv));
}

/** Rules that only apply when the diagram has the relevant structure. */
function ruleApplies(id: LayoutRuleId, exampleNum: number): boolean {
  switch (id) {
    case "FBR-004":
    case "ROW-002":
      return exampleNum === 3;
    case "CBL-005":
    case "ROW-003":
      return exampleNum === 1;
    case "DOM-001":
    case "DOM-002":
    case "DOM-003":
      return exampleNum === 2;
    case "DOM-004":
      return exampleNum === 2;
    case "CBL-004":
      return exampleNum !== 1;
    case "TUB-004":
      return true;
    default:
      return true;
  }
}

describe("layout rules contract (docs/agent/LAYOUT_RULES.md)", () => {
  it("documents every enforced rule ID", () => {
    expect(LAYOUT_RULES.map((r) => r.id).sort()).toEqual(
      [...LAYOUT_RULE_IDS].sort(),
    );
  });

  for (const n of EXAMPLE_NUMBERS) {
    describe(`Example #${n}`, () => {
      const ctx = buildLayoutRuleContext(graphFromExample(n));

      for (const ruleId of LAYOUT_RULE_IDS) {
        if (!ruleApplies(ruleId, n)) continue;

        it(`${ruleId}: ${LAYOUT_RULES.find((r) => r.id === ruleId)!.title}`, () => {
          const result = checkLayoutRule(ruleId, ctx);
          expect(result.ok, result.detail).toBe(true);
        });
      }

      it("passes all applicable rules in one pass", () => {
        const results = checkAllLayoutRules(ctx).filter((r) =>
          ruleApplies(r.id, n),
        );
        const failed = results.filter((r) => !r.ok);
        expect(failed, failed.map((f) => `${f.id}: ${f.detail}`).join("; ")).toEqual(
          [],
        );
      });
    });
  }
});

describe("reference production CSV layout sanity", () => {
  const productionCsvs = [
    { file: "300N_MAIN.csv", cableNodes: 4 },
    { file: "SP-I-15_11400S.csv", cableNodes: 6 },
    { file: "I-215_4700S.csv", cableNodes: 7 },
    { file: "SPI-215_I-80.csv", cableNodes: 7 },
  ] as const;

  for (const { file, cableNodes } of productionCsvs) {
    it(`${file} builds ${cableNodes} cable nodes and passes STR-001`, () => {
      const csv = readFileSync(join(examples, file), "utf8");
      const graph = buildConnectionGraph(parseBentleyCsv(csv));
      const ctx = buildLayoutRuleContext(graph);
      expect(ctx.visualCables.length).toBe(cableNodes);
      const { nodes } = buildReactFlowGraph(
        graph,
        undefined,
        ctx.layoutWidth,
      );
      expect(nodes.filter((n) => n.type === "cable")).toHaveLength(cableNodes);
      const str001 = checkLayoutRule("STR-001", ctx);
      expect(str001.ok, str001.detail).toBe(true);
    });
  }

  it("SPI-215_I-80.csv passes fiber spacing rules FBR-001 and FBR-002", () => {
    const csv = readFileSync(join(examples, "SPI-215_I-80.csv"), "utf8");
    const ctx = buildLayoutRuleContext(buildConnectionGraph(parseBentleyCsv(csv)));
    for (const id of ["FBR-001", "FBR-002"] as const) {
      const result = checkLayoutRule(id, ctx);
      expect(result.ok, result.detail).toBe(true);
    }
  });
});
