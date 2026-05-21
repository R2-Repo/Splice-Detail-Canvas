import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildConnectionGraph } from "./buildConnectionGraph";
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
