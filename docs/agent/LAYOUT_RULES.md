# Layout rules — cable, tube, and fiber invariants

> **Must keep.** These rules define how fiber cables, buffer tubes, and fiber strands are formatted and oriented. Any change to diagram layout, cable nodes, or splice routing **must pass every rule** in `layoutRules.test.ts`.

**Enforcement code:** `src/features/diagram/layoutRules.ts`  
**Contract tests:** `src/features/diagram/layoutRules.test.ts`  
**Reference CSVs:** `docs/reference/examples/CSV Splice Detail Example #1–#3.csv`

---

## Maintenance protocol

When you add or change layout behavior:

1. **Add or update a rule here** with a stable ID (`FBR-`, `TUB-`, `CBL-`, `DOM-`, `EDGE-`, or `ROW-`).
2. **Implement the check** in `layoutRules.ts` (reuse existing helpers when possible).
3. **Add or extend a test** in `layoutRules.test.ts` — every rule must run against Examples #1–#3 unless marked *example-specific*.
4. Run **`npm run test:layout`** before finishing (required every session with code changes). Then `npm run test:ci`.

Do **not** weaken or delete a rule without explicit user approval.

---

## Rule catalog

### Fiber strands (`FBR`)

| ID | Requirement |
|----|-------------|
| **FBR-001** | Within each buffer tube, fibers are ordered top→bottom by TIA fiber number (ascending). |
| **FBR-002** | Within each buffer tube, consecutive fibers are spaced exactly **24px** center-to-center (`FIBER_ROW_PITCH`). Pitch is **never stretched** to match global splice-row gaps. |
| **FBR-003** | Within each cable node, `rowYOffset` increases strictly top→bottom across all fibers. |
| **FBR-004** | Multi-tube cables assign **distinct** `rowYOffset` values per fiber (no two fibers share the same offset). |

### Buffer tubes (`TUB`)

| ID | Requirement |
|----|-------------|
| **TUB-001** | Every buffer tube originates at the **cable sheath center** (shared `cableCenterY`). |
| **TUB-002** | Each tube tip (`end.y`) is vertically centered on its fiber group's row span. |
| **TUB-003** | Cable sheath preserves **aspect ratio** at all scales and tube counts. |
| **TUB-004** | Multi-tube cables have **longer tube reach** than single-tube cables (stem extends further from sheath). |
| **TUB-005** | Right-side cables **mirror** breakout geometry (sheath and tubes face inward toward splice center). |
| **TUB-006** | Buffer tubes on each cable are ordered top→bottom: **BL…AQ**, then **BL-BK…AQ-BK** (TIA solid then striped). |

### Cable placement (`CBL`)

| ID | Requirement |
|----|-------------|
| **CBL-001** | Same-side cable nodes **never overlap** vertically. |
| **CBL-002** | Same-side cables stack by **placement order** with at least `cableGap` (32px) between nodes (may be larger when row-aligning ring-cut splits). |
| **CBL-003** | Multi-tube cables are offset **farther from center** on X (`tubeCountXOffset` per extra tube). |
| **CBL-004** | When a **dominant cable pair** exists, its splice endpoints share the same row Y (±2px). Ring-cut layouts without a dominant pair: see `spliceRowLayout.test.ts`. |
| **CBL-005** | Ring-cut through cables with four opposing splices split into **two visual instances** on the through side (Example #1). |

### Row ordering (`ROW`)

| ID | Requirement |
|----|-------------|
| **ROW-001** | Global splice-row steps within one buffer tube equal `FIBER_ROW_PITCH` (24px). |
| **ROW-002** | Global splice-row steps across buffer-tube boundaries add `TUBE_GROUP_GAP` (8px) beyond pitch. |
| **ROW-003** | Ring-cut split instances add **extra vertical gap** so sibling visual cables can row-align without overlap. |
| **ROW-004** | Through-cable splices sort by through-cable fiber #; crossover stubs use `max(left, right)` fiber # (Example #3). *Example-specific assertion in `connectionRowOrder.test.ts`.* |

### Dominant cable pair (`DOM`)

| ID | Requirement |
|----|-------------|
| **DOM-001** | Dominant pair = left↔right visual-cable group with the **most splice rows** (tie-break favors straight-across pairs). |
| **DOM-002** | All dominant-pair splice rows appear **before** non-dominant rows in global row order. |
| **DOM-003** | Dominant-pair fibers on left and right share the **same row Y** (±2px) — straight-across priority. |

### Splice edges (`EDGE`)

| ID | Requirement |
|----|-------------|
| **EDGE-001** | On import, each splice edge receives a **distinct routing lane** (no overlapping mid-X paths). |
| **EDGE-002** | Splice paths use **orthogonal** H–V–H routing with a fusion dot at the elbow. |
| **EDGE-003** | Lane registry assigns **staggered lanes on initial mount** (no drag required to separate overlapping strands). *Tested in `spliceEdgeRouting.test.ts`.* |

---

## Constants (single source of truth)

Defined in `src/features/diagram/cableLayoutMetrics.ts`:

| Constant | Value | Used for |
|----------|-------|----------|
| `FIBER_ROW_PITCH` / `MIN_FIBER_LINE_GAP` | 24px | Fiber spacing within tube, row pitch, splice lane separation |
| `TUBE_GROUP_GAP` | 8px | Extra gap at buffer-tube boundaries in global row layout |
| `CABLE_LAYOUT.cableGap` | 32px | Vertical gap between stacked same-side cables |
| `CABLE_LAYOUT.tubeCountXOffset` | 64px | Horizontal push per extra buffer tube |

---

## Example-specific regression tests

These live beside the contract suite and document edge cases tied to reference CSVs:

| File | Covers |
|------|--------|
| `connectionRowOrder.test.ts` | Example #3 crossover RD/BK ordering; tube-boundary gaps |
| `spliceRowLayout.test.ts` | Example #2 drop/DK strand order; ring-cut alignment |
| `dominantCablePair.test.ts` | Example #2 DROP↔3175 dominant pair |
| `buildReactFlowGraph.test.ts` | Node/edge counts per example |
| `cableBreakoutGeometry.test.ts` | Sheath/tube geometry unit tests |
| `spliceEdgeRouting.test.ts` | Lane staggering and orthogonal paths |

When an example-specific behavior becomes universal, promote it to a rule ID above.
