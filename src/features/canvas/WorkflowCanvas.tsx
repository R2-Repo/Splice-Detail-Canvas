import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useEdgesState,
  useNodesState,
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
import {
  CABLE_LAYOUT,
  resolveCableDragStopX,
  type CableXBounds,
} from "@/features/diagram/cableLayoutMetrics";
import { buildConnectionGraph } from "@/features/diagram/buildConnectionGraph";
import { buildReactFlowGraph } from "@/features/diagram/buildReactFlowGraph";
import { detectFullButtSpliceTubes } from "@/features/diagram/fullButtSplice";
import {
  importLayoutWidthForGraph,
  reportStorageKey,
} from "@/features/diagram/layoutSpliceDiagram";
import { estimatedCableNodeWidth } from "@/features/diagram/spliceRowLayout";
import { buildVisualCablesForLayout } from "@/features/diagram/visualCables";
import { CsvImportButton } from "@/features/import/CsvImportButton";
import { parseBentleyCsv } from "@/features/import/parseBentleyCsv";
import type { ConnectionGraph } from "@/types/splice";

const emptyNodes: Node[] = [];
const emptyEdges: Edge[] = [];

function boundsForOutwardDrag(
  draggedX: number,
  side: "left" | "right",
  layoutWidth: number,
  bounds: CableXBounds,
  nodeWidth: number,
): { layoutWidth: number; bounds: CableXBounds } {
  const margin = CABLE_LAYOUT.leftX;
  if (side === "right" && draggedX > bounds.rightX + 0.5) {
    const width = Math.max(layoutWidth, draggedX + margin + nodeWidth);
    return {
      layoutWidth: width,
      bounds: {
        leftX: margin,
        rightX: width - margin - nodeWidth,
      },
    };
  }
  if (side === "left" && draggedX < bounds.leftX - 0.5) {
    const width = Math.max(layoutWidth, layoutWidth + (bounds.leftX - draggedX));
    return {
      layoutWidth: width,
      bounds: {
        leftX: draggedX,
        rightX: width - margin - nodeWidth,
      },
    };
  }
  return { layoutWidth, bounds };
}

function WorkflowCanvasInner() {
  const { fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [nodes, setNodes, onNodesChange] = useNodesState(emptyNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(emptyEdges);
  const reportKeyRef = useRef<string | null>(null);
  const graphRef = useRef<ConnectionGraph | null>(null);
  const layoutWidthRef = useRef<number>(CABLE_LAYOUT.width);
  const xBoundsRef = useRef<CableXBounds>({
    leftX: CABLE_LAYOUT.leftX,
    rightX: CABLE_LAYOUT.rightX,
  });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [meta, setMeta] = useState<string | null>(null);
  const [collapseFullButtSplices, setCollapseFullButtSplices] = useState(false);

  type ApplyGraphOptions = {
    fitView?: boolean;
    cableSidesPatch?: Record<string, "left" | "right">;
    layoutWidth?: number;
    refreshLayout?: boolean;
    refreshColumnX?: boolean;
  };

  const persistLayout = useCallback(
    (
      nextNodes: Node[],
      nextEdges: Edge[],
      patch?: Partial<import("@/types/splice").LayoutOverrides>,
    ) => {
      const key = reportKeyRef.current;
      if (!key) return;
      saveLayoutOverrides(
        mergeLayoutOverrides(key, {
          positions: positionsFromNodes(nextNodes),
          existingEdgeIds: existingIdsFromEdges(nextEdges),
          collapseFullButtSplices,
          layoutWidth: layoutWidthRef.current,
          ...patch,
        }),
      );
    },
    [collapseFullButtSplices],
  );

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
      const layoutWidthArg =
        options?.layoutWidth ??
        existing?.layoutWidth ??
        layoutWidthRef.current;
      layoutWidthRef.current = layoutWidthArg;

      const savedPositions =
        options?.refreshLayout ?? false ? {} : existing?.positions ?? {};

      const { nodes: nextNodes, edges: nextEdges, layout, xBounds } =
        buildReactFlowGraph(
          graph,
          {
            ...overrides,
            reportKey,
            collapseFullButtSplices: collapse,
            positions: savedPositions,
            existingEdgeIds: existing?.existingEdgeIds,
            layoutWidth: layoutWidthArg,
          },
          layoutWidthArg,
          { refreshColumnX: options?.refreshColumnX },
        );
      xBoundsRef.current = xBounds;
      setNodes(nextNodes);
      setEdges(nextEdges);

      if (options?.refreshColumnX || options?.layoutWidth !== undefined) {
        saveLayoutOverrides(
          mergeLayoutOverrides(reportKey, {
            layoutWidth: layoutWidthArg,
            positions: positionsFromNodes(nextNodes),
            existingEdgeIds: existing?.existingEdgeIds,
            collapseFullButtSplices: collapse,
            cableSides: overrides.cableSides,
          }),
        );
      }
      requestAnimationFrame(() => {
        for (const node of nextNodes) {
          if (node.type === "cable") updateNodeInternals(node.id);
        }
        if (options?.fitView) fitView({ padding: 0.25, duration: 200 });
      });
      void layout;
    },
    [setNodes, setEdges, fitView, updateNodeInternals],
  );

  const loadFromCsv = useCallback(
    (text: string, fileName: string) => {
      const report = parseBentleyCsv(text);
      const graph = buildConnectionGraph(report);
      const reportKey = reportStorageKey(graph);
      reportKeyRef.current = reportKey;
      graphRef.current = graph;
      const saved = loadLayoutOverrides(reportKey);
      const { visualCables } = buildVisualCablesForLayout(graph);
      const detected = detectFullButtSpliceTubes(graph, visualCables);
      const collapsed =
        saved?.collapseFullButtSplices ?? detected.length > 0;
      setCollapseFullButtSplices(collapsed);
      const stageWidth = stageRef.current?.clientWidth ?? 0;
      const width = importLayoutWidthForGraph(graph, {
        collapse: collapsed,
        stageWidth,
      });
      applyGraph(graph, reportKey, collapsed, {
        fitView: true,
        layoutWidth: width,
        refreshColumnX: true,
      });
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
      const stageWidth = stageRef.current?.clientWidth ?? 0;
      const width = importLayoutWidthForGraph(graph, {
        collapse: next,
        stageWidth,
      });
      applyGraph(graph, reportKey, next, {
        layoutWidth: width,
        refreshColumnX: true,
      });
      persistLayout(nodes, edges);
      return next;
    });
  }, [applyGraph, nodes, edges, persistLayout]);

  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type !== "cable") {
        persistLayout(nodes, edges);
        return;
      }

      const visualId = visualCableIdFromNodeId(node.id);
      if (!visualId) return;

      const centerX = layoutWidthRef.current / 2;
      const newSide = displaySideFromCanvasX(node.position.x, centerX);
      const prevSide = (node.data as CableNodeData).side;
      const sideChanged = newSide !== prevSide;
      const graph = graphRef.current;
      const maxTubes =
        graph != null
          ? Math.max(
              1,
              ...buildVisualCablesForLayout(graph).visualCables.map(
                (vc) => vc.tubes.length,
              ),
            )
          : 3;
      const nodeWidth = estimatedCableNodeWidth(maxTubes);

      let layoutWidth = layoutWidthRef.current;
      let bounds = xBoundsRef.current;
      ({ layoutWidth, bounds } = boundsForOutwardDrag(
        node.position.x,
        newSide,
        layoutWidth,
        bounds,
        nodeWidth,
      ));
      layoutWidthRef.current = layoutWidth;
      xBoundsRef.current = bounds;

      const finalX = resolveCableDragStopX(node.position.x, newSide, bounds);
      const finalY = node.position.y;

      setNodes((current) => {
        const nextNodes = current.map((n) =>
          n.id === node.id
            ? {
                ...n,
                position: {
                  x: finalX,
                  y: finalY,
                },
                data: { ...(n.data as CableNodeData), side: newSide },
              }
            : n,
        );
        setEdges((currentEdges) => {
          persistLayout(
            nextNodes,
            currentEdges,
            {
              layoutWidth,
              ...(sideChanged ? { cableSides: { [visualId]: newSide } } : {}),
            },
          );
          return currentEdges;
        });
        if (sideChanged) {
          requestAnimationFrame(() => updateNodeInternals(node.id));
        }
        return nextNodes;
      });
    },
    [edges, nodes, persistLayout, setNodes, updateNodeInternals],
  );

  const onNodeDrag: OnNodeDrag<Node> = useCallback(
    (_, node) => {
      if (node.type !== "cable") return;
      const centerX = layoutWidthRef.current / 2;
      const nextSide = displaySideFromCanvasX(node.position.x, centerX);
      const prevSide = (node.data as CableNodeData).side;
      if (prevSide === nextSide) return;
      setNodes((current) =>
        current.map((n) =>
          n.id === node.id
            ? {
                ...node,
                data: { ...(node.data as CableNodeData), side: nextSide },
              }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setEdges((current) => {
        const next = current.map((e) => {
          if (e.id !== edge.id) return e;
          const existing = Boolean(
            (e.data as { existing?: boolean } | undefined)?.existing,
          );
          return { ...e, data: { ...e.data, existing: !existing } };
        });
        persistLayout(nodes, next);
        return next;
      });
    },
    [nodes, persistLayout, setEdges],
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
        <span className="workflow-canvas__hint">
          Drag to reposition; outward widens; past center mirrors; click edge for
          protect-in-place
        </span>
        {meta ? <span className="workflow-canvas__meta">{meta}</span> : null}
      </div>
      <div className="workflow-canvas__body">
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
            minZoom={0.05}
            maxZoom={2}
            nodesDraggable
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls />
          </ReactFlow>
        </div>
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
