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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
import { CABLE_LAYOUT } from "@/features/diagram/cableLayoutMetrics";
import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import { reportStorageKey } from "@/features/diagram/layoutSpliceDiagram";
import { CsvImportButton } from "@/features/import/CsvImportButton";
import { formatInspectReport, inspectBentleyCsv } from "@/features/import/inspectBentleyCsv";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";
import type { ConnectionGraph } from "@/types/splice";

const emptyNodes: Node[] = [];
const emptyEdges: Edge[] = [];

function WorkflowCanvasInner() {
  const { fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes, onNodesChange] = useNodesState(emptyNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(emptyEdges);
  const reportKeyRef = useRef<string | null>(null);
  const graphRef = useRef<ConnectionGraph | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [inspectText, setInspectText] = useState<string | null>(null);
  const [showInspect, setShowInspect] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [collapseFullButtSplices, setCollapseFullButtSplices] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [layoutWidth, setLayoutWidth] = useState<number>(CABLE_LAYOUT.width);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const measure = () => {
      const next = Math.max(CABLE_LAYOUT.width, stage.clientWidth || 0);
      setLayoutWidth(next);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const layoutWidthRef = useRef<number>(CABLE_LAYOUT.width);

  type ApplyGraphOptions = {
    fitView?: boolean;
    cableSidesPatch?: Record<string, "left" | "right">;
    layoutWidth?: number;
  };

  const applyGraph = useCallback(
    (
      graph: ConnectionGraph,
      reportKey: string,
      collapse: boolean,
      options?: ApplyGraphOptions,
    ) => {
      const existing = loadLayoutOverrides(reportKey);
      const overrides = mergeLayoutOverrides(reportKey, {
        collapseFullButtSplices: collapse,
        cableSides: options?.cableSidesPatch,
      });
      const layoutWidthArg = options?.layoutWidth ?? layoutWidth;
      const { nodes: nextNodes, edges: nextEdges } = buildReactFlowGraph(
        graph,
        {
          ...overrides,
          reportKey,
          collapseFullButtSplices: collapse,
          positions: existing?.positions ?? {},
          existingEdgeIds: existing?.existingEdgeIds,
        },
        layoutWidthArg,
      );
      setNodes(nextNodes);
      setEdges(nextEdges);
      setSelectedEdgeId(null);
      requestAnimationFrame(() => {
        for (const node of nextNodes) {
          if (node.type === "cable") {
            updateNodeInternals(node.id);
          }
        }
        if (options?.fitView) {
          fitView({ padding: 0.25, duration: 200 });
        }
      });
    },
    [setNodes, setEdges, fitView, layoutWidth, updateNodeInternals],
  );

  useEffect(() => {
    if (!graphRef.current || !reportKeyRef.current) return;
    if (layoutWidthRef.current === layoutWidth) return;

    layoutWidthRef.current = layoutWidth;
    applyGraph(
      graphRef.current,
      reportKeyRef.current,
      collapseFullButtSplices,
      { layoutWidth, fitView: false },
    );
  }, [applyGraph, collapseFullButtSplices, layoutWidth]);

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
          collapseFullButtSplices,
        }),
      );
    },
    [collapseFullButtSplices],
  );

  const loadFromCsv = useCallback(
    (text: string, fileName: string) => {
      setInspectText(formatInspectReport(inspectBentleyCsv(text)));
      const report = parseBentleyCsv(text);
      const graph = buildConnectionGraph(report);
      const reportKey = reportStorageKey(graph);
      reportKeyRef.current = reportKey;
      graphRef.current = graph;
      const overrides = loadLayoutOverrides(reportKey);
      const collapsed = overrides?.collapseFullButtSplices ?? false;
      setCollapseFullButtSplices(collapsed);
      applyGraph(graph, reportKey, collapsed, { fitView: true });
      const title =
        report.header.spliceNumber ?? report.header.name ?? fileName;
      setMeta(
        `${title} — ${report.pairs.length} pair(s), ${graph.connections.length} connection(s)`,
      );
    },
    [applyGraph],
  );

  const toggleFullButtCollapse = useCallback(() => {
    const graph = graphRef.current;
    const reportKey = reportKeyRef.current;
    if (!graph || !reportKey) return;
    setCollapseFullButtSplices((prev) => {
      const next = !prev;
      applyGraph(graph, reportKey, next);
      saveLayoutOverrides(
        mergeLayoutOverrides(reportKey, { collapseFullButtSplices: next }),
      );
      return next;
    });
  }, [applyGraph]);

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

  const onNodeDrag: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type !== "cable") return;
      const nextSide = displaySideFromCanvasX(node.position.x);
      setNodes((current) => {
        let changed = false;
        const nextNodes = current.map((n) => {
          if (n.id !== node.id) return n;
          const prevSide = (n.data as CableNodeData).side;
          if (prevSide === nextSide) return n;
          changed = true;
          return {
            ...n,
            data: { ...(n.data as CableNodeData), side: nextSide },
          };
        });
        return changed ? nextNodes : current;
      });
    },
    [setNodes],
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
        {meta ? (
          <button
            type="button"
            className="csv-import__button csv-import__button--secondary"
            onClick={toggleFullButtCollapse}
          >
            {collapseFullButtSplices
              ? "Expand full butt splices"
              : "Collapse full butt splices"}
          </button>
        ) : null}
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
      <div className="workflow-canvas__stage" ref={stageRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onEdgesChange={onEdgesChange}
          onEdgeClick={onEdgeClick}
          nodeTypes={spliceNodeTypes}
          edgeTypes={spliceEdgeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.05}
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
