import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { analyzeLeftSectionFailures } from "./analyzeParseFailures";

describe("analyzeParseFailures", () => {
  it("Example #1 failure rate", () => {
    const csv = readFileSync(
      join(
        process.cwd(),
        "docs/reference/examples/Bentley OpenComms Output Example #1.csv",
      ),
      "utf8",
    );
    const r = analyzeLeftSectionFailures(csv);
    expect(r.total).toBe(574);
    expect(r.parsed).toBe(574);
    expect(r.failed).toBe(0);
  });
});
