import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseBentleyCsv } from "./parseBentleyCsv";

const example2Path = join(
  process.cwd(),
  "docs/reference/examples/Bentley OpenComms Output Example #2.csv",
);

const SAMPLE_ROW =
  "HUB3-8(BLUFFDALE_REDWOOD_RD),6-SMF DROP: MVC MP 3.1 & HARVEST MOON DR,   1,BL,BL,<->,144 DIST: 2100 N TO HARVEST HILLS,  17,OR,SL,HUB3-8(BLUFFDALE_REDWOOD_RD),CH 3022";

describe("parseBentleyCsv", () => {
  it("parses a minimal inline report", () => {
    const csv = ["Left ---", SAMPLE_ROW].join("\n");
    const report = parseBentleyCsv(csv);
    expect(report.pairs).toHaveLength(1);
  });

  it("parses Example #2 with 4 deduped pairs", () => {
    const csv = readFileSync(example2Path, "utf8");
    const report = parseBentleyCsv(csv);

    expect(report.header.spliceNumber).toBe("SP-3022.4");
    expect(report.pairs).toHaveLength(4);

    const cables = new Set(
      report.pairs.flatMap((p) => [p.endpointA.cable, p.endpointB.cable]),
    );
    expect(cables.has("6-SMF DROP: MVC MP 3.1 & HARVEST MOON DR")).toBe(true);
    expect(cables.has("144 DIST: 2100 N TO HARVEST HILLS")).toBe(true);
  });
});
