import type { Edge, Node } from "@xyflow/react";

import {
  cableLegIdForEndpoint,
  pairEndpointsForSide,
} from "@/features/diagram/buildConnectionGraph";
import { tubeNodeId } from "@/features/diagram/tubeId";
import { colorHex, colorName, isStripedTube } from "@/features/diagram/colorCode";
import {
  computeDiagramLayout,
  nodePositionsForGraph,
  type DiagramLayout,
} from "@/features/diagram/layoutSpliceDiagram";
import type { ConnectionGraph, LayoutOverrides } from "@/types/splice";

import type {
  BufferTubeNodeData,
  CableNodeData,
  FiberStrandNodeData,
} from "@/features/canvas/nodes/types";

export function buildReactFlowGraph(
  graph: ConnectionGraph,
  overrides?: LayoutOverrides,
): { nodes: Node[]; edges: Edge[]; layout: DiagramLayout } {
  const layout = computeDiagramLayout(graph);
  const positions = nodePositionsForGraph(graph, layout, overrides);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const leg of graph.legs) {
    const nodeId = `cable-${leg.id}`;
    const pos = positions[nodeId] ?? { x: 0, y: 0 };
    nodes.push({
      id: nodeId,
      type: "cable",
      position: pos,
      data: {
        label: leg.cable,
        side: leg.side,
      } satisfies CableNodeData,
      draggable: true,
    });
  }

  const tubeNodesAdded = new Set<string>();

  for (const conn of graph.connections) {
    if (conn.kind === "tube") {
      const leftTubeId = tubeNodeId(conn.endpointA.legId, conn.endpointA.tubeColor);
      const rightTubeId = tubeNodeId(conn.endpointB.legId, conn.endpointB.tubeColor);
      const base = conn.endpointA.tubeColor.split("-")[0] as import("@/types/splice").FiberColorAbbrev;
      addTubeNode(
        nodes,
        tubeNodesAdded,
        leftTubeId,
        positions,
        conn.endpointA.tubeColor,
        "left",
      );
      addTubeNode(
        nodes,
        tubeNodesAdded,
        rightTubeId,
        positions,
        conn.endpointB.tubeColor,
        "right",
      );
      edges.push({
        id: `splice-${conn.id}`,
        source: leftTubeId,
        target: rightTubeId,
        type: "splice",
        style: { strokeWidth: 8 },
        data: { color: colorHex(base) },
      });
      continue;
    }

    const ends = pairEndpointsForSide(conn.pair, graph);
    const leftLeg = cableLegIdForEndpoint(ends.left);
    const rightLeg = cableLegIdForEndpoint(ends.right);
    const leftTubeId = tubeNodeId(leftLeg, ends.left.tubeColor);
    const rightTubeId = tubeNodeId(rightLeg, ends.right.tubeColor);
    const leftFiberId = `fiber-${conn.id}-L`;
    const rightFiberId = `fiber-${conn.id}-R`;

    addTubeNode(
      nodes,
      tubeNodesAdded,
      leftTubeId,
      positions,
      ends.left.tubeColor,
      "left",
    );
    linkCableToTube(edges, nodes, leftLeg, leftTubeId);
    addTubeNode(
      nodes,
      tubeNodesAdded,
      rightTubeId,
      positions,
      ends.right.tubeColor,
      "right",
    );
    linkCableToTube(edges, nodes, rightLeg, rightTubeId);

    nodes.push({
      id: leftFiberId,
      type: "fiberStrand",
      position: positions[leftFiberId] ?? { x: 0, y: 0 },
      data: {
        color: colorHex(ends.left.fiberColor),
        label: colorName(ends.left.fiberColor),
        side: "left",
      } satisfies FiberStrandNodeData,
      draggable: true,
    });
    nodes.push({
      id: rightFiberId,
      type: "fiberStrand",
      position: positions[rightFiberId] ?? { x: 0, y: 0 },
      data: {
        color: colorHex(ends.right.fiberColor),
        label: colorName(ends.right.fiberColor),
        side: "right",
      } satisfies FiberStrandNodeData,
      draggable: true,
    });

    edges.push({
      id: `contain-${leftTubeId}-${leftFiberId}`,
      source: leftTubeId,
      target: leftFiberId,
      type: "default",
      selectable: false,
      style: { stroke: "transparent", strokeWidth: 0 },
    });
    edges.push({
      id: `contain-${rightTubeId}-${rightFiberId}`,
      source: rightTubeId,
      target: rightFiberId,
      type: "default",
      selectable: false,
      style: { stroke: "transparent", strokeWidth: 0 },
    });
    edges.push({
      id: `splice-${conn.id}`,
      source: leftFiberId,
      target: rightFiberId,
      type: "splice",
      data: {
        color: colorHex(ends.left.fiberColor),
        existing: overrides?.existingEdgeIds?.includes(`splice-${conn.id}`),
      },
    });
  }

  return { nodes, edges, layout };
}

function linkCableToTube(
  edges: Edge[],
  nodes: Node[],
  legId: string,
  tubeId: string,
) {
  const cableId = `cable-${legId}`;
  if (!nodes.some((n) => n.id === cableId)) return;
  const edgeId = `cable-tube-${cableId}-${tubeId}`;
  if (edges.some((e) => e.id === edgeId)) return;
  edges.push({
    id: edgeId,
    source: cableId,
    target: tubeId,
    sourceHandle: "out",
    targetHandle: "in",
    selectable: false,
    style: { stroke: "#64748b", strokeWidth: 2 },
  });
}

function addTubeNode(
  nodes: Node[],
  added: Set<string>,
  id: string,
  positions: Record<string, { x: number; y: number }>,
  tubeColor: import("@/types/splice").TubeColorCode,
  side: "left" | "right",
) {
  if (added.has(id)) return;
  added.add(id);
  nodes.push({
    id,
    type: "bufferTube",
    position: positions[id] ?? { x: 0, y: 0 },
    data: {
      tubeColor,
      color: colorHex(tubeColor.split("-")[0] as import("@/types/splice").FiberColorAbbrev),
      striped: isStripedTube(tubeColor),
      label: tubeColor,
      side,
    } satisfies BufferTubeNodeData,
    draggable: true,
  });
}
