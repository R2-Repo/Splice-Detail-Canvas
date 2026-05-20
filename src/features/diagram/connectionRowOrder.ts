import { orderedFiberConnections } from "@/features/diagram/buildConnectionGraph";
import type { ConnectionGraph } from "@/types/splice";

/** Stable row index per splice — drives vertical spacing and fiber order in cable nodes. */
export function connectionRowIndexMap(
  graph: ConnectionGraph,
): Map<string, number> {
  const map = new Map<string, number>();
  orderedFiberConnections(graph).forEach((conn, index) => {
    map.set(conn.id, index);
  });
  return map;
}
