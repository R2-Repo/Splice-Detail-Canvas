import { describe, expect, it } from "vitest";

import { csvColumnsForCable } from "./cableLegIdentity";

describe("csvColumnsForCable", () => {
  it("splits through-cable: To in Left, From in Right mirror (Example #2 dist)", () => {
    const columns = csvColumnsForCable({
      left: { from: 0, to: 4 },
      right: { from: 4, to: 0 },
    });
    expect(columns).toEqual(["from", "to"]);
  });

  it("single drop leg: From in Left, To in Right mirror only", () => {
    const columns = csvColumnsForCable({
      left: { from: 4, to: 0 },
      right: { from: 0, to: 4 },
    });
    expect(columns).toEqual(["from"]);
  });
});
