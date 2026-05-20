import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { inspectBentleyCsv } from "./inspectBentleyCsv";

const examples = join(process.cwd(), "docs/reference/examples");

describe("inspectBentleyCsv", () => {
  it("Example #2: no parse gap", () => {
    const csv = readFileSync(
      join(examples, "Bentley OpenComms Output Example #2.csv"),
      "utf8",
    );
    const r = inspectBentleyCsv(csv);
    expect(r.parseGap).toBe(0);
    expect(r.parsedPairCount).toBe(4);
  });

  it("Example #1: parses most Left rows after fiber# / column fix", () => {
    const csv = readFileSync(
      join(examples, "Bentley OpenComms Output Example #1.csv"),
      "utf8",
    );
    const r = inspectBentleyCsv(csv);
    expect(r.rawRowCounts.left).toBe(574);
    expect(r.parsedPairCount).toBe(574);
    expect(r.parseGap).toBe(0);
    expect(r.failureBreakdown).toHaveLength(0);
  });
});
