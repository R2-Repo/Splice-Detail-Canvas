import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useRef, useState } from "react";

import { spliceEdgeTypes } from "@/features/canvas/edgeTypes";
import {
  loadLayoutOverrides,
  positionsFromNodes,
  saveLayoutOverrides,
} from "@/features/canvas/layoutStorage";
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
  const [nodes, setNodes, onNodesChange] = useNodesState(emptyNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(emptyEdges);
  const reportKeyRef = useRef<string | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [inspectText, setInspectText] = useState<string | null>(null);
  const [showInspect, setShowInspect] = useState(false);

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
      const title =
        report.header.spliceNumber ?? report.header.name ?? fileName;
      setMeta(
        `${title} — ${report.pairs.length} pair(s), ${graph.connections.length} connection(s)`,
      );
    },
    [setNodes, setEdges],
  );

  const onNodeDragStop = useCallback(() => {
    const key = reportKeyRef.current;
    if (!key) return;
    setNodes((current) => {
      saveLayoutOverrides({
        reportKey: key,
        positions: positionsFromNodes(current),
      });
      return current;
    });
  }, [setNodes]);

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
        nodeTypes={spliceNodeTypes}
        edgeTypes={spliceEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2}
        nodesDraggable
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
