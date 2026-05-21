import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseBentleyCsv } from "./parseBentleyCsv";

const example2Path = join(
  process.cwd(),
  "docs/reference/examples/CSV Splice Detail Example #2.csv",
);

const SAMPLE_ROW =
  "HUB3-8(BLUFFDALE_REDWOOD_RD),6-SMF DROP: MVC MP 3.1 & HARVEST MOON DR,   1,BL,BL,<->,144 DIST: 2100 N TO HARVEST HILLS,  17,OR,SL,HUB3-8(BLUFFDALE_REDWOOD_RD),CH 3022";

describe("parseBentleyCsv", () => {
  it("parses a minimal inline report", () => {
    const csv = ["Left ---", SAMPLE_ROW].join("\n");
    const report = parseBentleyCsv(csv);
    expect(report.pairs).toHaveLength(1);
  });

  it("parses Example #2 with 6 deduped pairs", () => {
    const csv = readFileSync(example2Path, "utf8");
    const report = parseBentleyCsv(csv);

    expect(report.header.spliceNumber).toBe("SP-2090.4.5");
    expect(report.pairs).toHaveLength(6);

    const cables = new Set(
      report.pairs.flatMap((p) => [p.endpointA.cable, p.endpointB.cable]),
    );
    expect(cables.has("6 DROP (TSC): 3300 S & 3175 E")).toBe(true);
    expect(cables.has("DIST 18. 3300 S 3175 E/3300 E")).toBe(true);
  });

  it("infers fiber # from To tube+color when blank and tubes differ", () => {
    const row =
      "HUB2-8,11400S DIST,   1,BL,BL,<->,288 DIST I-15: MP 292.3 - 11400 S, ,BK,BL, ,";
    const report = parseBentleyCsv(["Left ---", row].join("\n"));
    expect(report.pairs).toHaveLength(1);
    const to = report.pairs[0]!.endpointB;
    expect(to.tubeColor).toBe("BK");
    expect(to.fiberColor).toBe("BL");
    expect(to.fiberNumber).toBe(85);
  });
});
