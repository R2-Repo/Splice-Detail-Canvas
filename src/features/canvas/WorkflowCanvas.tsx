import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Node,
  type OnNodeDrag,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useRef, useState } from "react";

import { spliceEdgeTypes } from "@/features/canvas/edgeTypes";
import {
  existingIdsFromEdges,
  loadLayoutOverrides,
  mergeLayoutOverrides,
  positionsFromNodes,
  saveLayoutOverrides,
} from "@/features/canvas/layoutStorage";
import type { CableNodeData } from "@/features/canvas/nodes/types";
import {
  displaySideFromCanvasX,
  visualCableIdFromNodeId,
} from "@/features/diagram/cableDisplaySide";
import { spliceNodeTypes } from "@/features/canvas/nodeTypes";
import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import { reportStorageKey } from "@/features/diagram/layoutSpliceDiagram";
import { CsvImportButton } from "@/features/import/CsvImportButton";
import { formatInspectReport, inspectBentleyCsv } from "@/features/import/inspectBentleyCsv";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";

const emptyNodes: Node[] = [];
const emptyEdges: Edge[] = [];

function WorkflowCanvasInner() {
  const { fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes, onNodesChange] = useNodesState(emptyNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(emptyEdges);
  const reportKeyRef = useRef<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [inspectText, setInspectText] = useState<string | null>(null);
  const [showInspect, setShowInspect] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const persistLayout = useCallback(
    (
      nextNodes: Node[],
      nextEdges: Edge[],
      cableSidesPatch?: Record<string, "left" | "right">,
    ) => {
      const key = reportKeyRef.current;
      if (!key) return;
      saveLayoutOverrides(
        mergeLayoutOverrides(key, {
          positions: positionsFromNodes(nextNodes),
          existingEdgeIds: existingIdsFromEdges(nextEdges),
          cableSides: cableSidesPatch,
        }),
      );
    },
    [],
  );

  const loadFromCsv = useCallback(
    (text: string, fileName: string) => {
      setInspectText(formatInspectReport(inspectBentleyCsv(text)));
      const report = parseBentleyCsv(text);
      const graph = buildConnectionGraph(report);
      const reportKey = reportStorageKey(graph);
      reportKeyRef.current = reportKey;
      const overrides = loadLayoutOverrides(reportKey);
      const { nodes: nextNodes, edges: nextEdges } = buildReactFlowGraph(
        graph,
        overrides ? { ...overrides, reportKey } : undefined,
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedEdgeId(null);
      requestAnimationFrame(() => {
        fitView({ padding: 0.25, duration: 200 });
      });
      const title =
        report.header.spliceNumber ?? report.header.name ?? fileName;
      setMeta(
        `${title} — ${report.pairs.length} pair(s), ${graph.connections.length} connection(s)`,
      );
    },
    [setNodes, setEdges, fitView],
  );

  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type !== "cable") {
        setNodes((current) => {
          setEdges((currentEdges) => {
            persistLayout(current, currentEdges);
            return currentEdges;
          });
          return current;
        });
        return;
      }

      const visualId = visualCableIdFromNodeId(node.id);
      if (!visualId) return;

      const newSide = displaySideFromCanvasX(node.position.x);
      const prevSide = (node.data as CableNodeData).side;
      const sideChanged = newSide !== prevSide;

      setNodes((current) => {
        const nextNodes = sideChanged
          ? current.map((n) =>
              n.id === node.id
                ? {
                    ...n,
                    data: { ...(n.data as CableNodeData), side: newSide },
                  }
                : n,
            )
          : current;
        setEdges((currentEdges) => {
          persistLayout(
            nextNodes,
            currentEdges,
            sideChanged ? { [visualId]: newSide } : undefined,
          );
          return currentEdges;
        });
        if (sideChanged) {
          requestAnimationFrame(() => {
            updateNodeInternals(node.id);
          });
        }
        return nextNodes;
      });
    },
    [setNodes, setEdges, persistLayout, updateNodeInternals],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdgeId(edge.id);
      setEdges((current) => {
        const next = current.map((e) => {
          if (e.id !== edge.id) return e;
          const existing = Boolean(
            (e.data as { existing?: boolean } | undefined)?.existing,
          );
          return {
            ...e,
            data: { ...e.data, existing: !existing },
          };
        });
        setNodes((nodes) => {
          persistLayout(nodes, next);
          return nodes;
        });
        return next;
      });
    },
    [setEdges, setNodes, persistLayout],
  );

  return (
    <div className="workflow-canvas">
      <div className="workflow-canvas__toolbar">
        <CsvImportButton onImport={loadFromCsv} />
        {inspectText ? (
          <button
            type="button"
            className="csv-import__button csv-import__button--secondary"
            onClick={() => setShowInspect((v) => !v)}
          >
            {showInspect ? "Hide" : "Show"} CSV parse report
          </button>
        ) : null}
        <span className="workflow-canvas__hint">
          Drag a cable past center to mirror it; click a splice line to toggle
          protect-in-place
        </span>
        {selectedEdgeId ? (
          <span className="workflow-canvas__meta">Selected: {selectedEdgeId}</span>
        ) : null}
        {meta ? <span className="workflow-canvas__meta">{meta}</span> : null}
      </div>
      {showInspect && inspectText ? (
        <pre className="workflow-canvas__inspect">{inspectText}</pre>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        nodeTypes={spliceNodeTypes}
        edgeTypes={spliceEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
