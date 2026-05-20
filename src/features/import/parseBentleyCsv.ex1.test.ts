import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parseBentleyCsv, parseDataRow } from "./parseBentleyCsv";

const example1Path = join(
  process.cwd(),
  "docs/reference/examples/Bentley OpenComms Output Example #1.csv",
);

function countDataRows(csv: string, section: "left" | "right"): number {
  let inSection = false;
  let count = 0;
  for (const raw of csv.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "Left ---") {
      inSection = section === "left";
      continue;
    }
    if (line === "Right ---") {
      inSection = section === "right";
      continue;
    }
    if (inSection && line.includes("<->")) count += 1;
  }
  return count;
}

describe("parseBentleyCsv Example #1 (diagnostic)", () => {
  it("reports how many rows parse vs raw Left section count", () => {
    const csv = readFileSync(example1Path, "utf8");
    const rawLeft = countDataRows(csv, "left");
    const report = parseBentleyCsv(csv);

    expect(report.pairs.length).toBe(574);
    expect(rawLeft - report.pairs.length).toBe(0);
    expect(report.leftRowResults?.filter((r) => !r.ok)).toHaveLength(0);
  });

  it("parses row when To-side fiber # is empty (inherits From)", () => {
    const line =
      "HUB2-12(I-15&BANGERTER),288 DIS I-15: 1200W - FRONTAGE RD,   1,BL,BL,<->,288 DIST I-15: MP282 - 1200W, ,BL,BL, ,CH 2001";
    const pair = parseDataRow(line, "left");
    expect(pair).not.toBeNull();
    expect(pair!.endpointA).toMatchObject({
      fiberNumber: 1,
      tubeColor: "BL",
      fiberColor: "BL",
    });
    expect(pair!.endpointB).toMatchObject({
      fiberNumber: 1,
      tubeColor: "BL",
      fiberColor: "BL",
    });
  });
});
