/** Bentley-style cable header from name (e.g. "006 SMFO (R2)"). */
export function smfoLabelForCable(cable: string): string | undefined {
  if (/DROP/i.test(cable)) {
    const m = cable.match(/\b(\d+)\s*[- ]?DROP/i) ?? cable.match(/^(\d+)/);
    const n = m ? m[1]!.padStart(3, "0") : "006";
    return `${n} SMFO (R2)`;
  }
  if (/DK-/i.test(cable)) return "006 SMFO (R2)";
  const m =
    cable.match(/\b(144|288|96|48|24|18|12|6)\b/i) ??
    cable.match(/\b(\d{2,3})\s*[- ]?(?:SMF|DIST)/i);
  if (m) return `${m[1]!.padStart(3, "0")} SMFO (R2)`;
  return undefined;
}

export function formatCircuitTag(circuitName?: string, fiberColor?: string): string | undefined {
  if (!circuitName) return undefined;
  const base = circuitName.replace(/\s+/g, " ").trim();
  if (!fiberColor) return `(${base})`;
  return `(${base})`;
}
