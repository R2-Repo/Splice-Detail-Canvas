import { BaseEdge, type EdgeProps } from "@xyflow/react";

import {
  buildSplicePath,
  defaultSideCircuitLabelSpan,
  useRoutingLaneIndex,
} from "@/features/canvas/edges/spliceEdgeRouting";
import type { SideCircuitLabelSpan } from "@/features/diagram/cableLabels";
import {
  FIBER_CONTRAST_OUTLINE,
  needsFiberContrastOutlineHex,
} from "@/features/diagram/colorCode";

type SpliceEdgeData = {
  /** @deprecated use sourceColor */
  color?: string;
  sourceColor?: string;
  targetColor?: string;
  existing?: boolean;
  fullButtSplice?: boolean;
  laneIndex?: number;
  laneCount?: number;
  laneOverride?: number;
  /** Global row offset (px) for proportional center lane spacing. */
  rowOffset?: number;
  /** Longest OS label span per side — splice jog starts after this. */
  sideCircuitSpan?: SideCircuitLabelSpan;
  /** Same source tube + target cable — fibers share one center lane. */
  tubeBundleKey?: string;
  circuitName?: string;
};

function SpliceLeg({
  id,
  path,
  stroke,
  strokeWidth,
  strokeDasharray,
  opacity,
}: {
  id: string;
  path: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
}) {
  const edgeStyle = {
    strokeWidth,
    strokeDasharray,
    opacity,
  };
  const contrast = needsFiberContrastOutlineHex(stroke);

  return (
    <>
      {contrast ? (
        <BaseEdge
          id={`${id}-outline`}
          path={path}
          style={{
            ...edgeStyle,
            stroke: FIBER_CONTRAST_OUTLINE,
            strokeWidth: strokeWidth + 2,
          }}
        />
      ) : null}
      <BaseEdge id={id} path={path} style={{ ...edgeStyle, stroke }} />
    </>
  );
}

export function SpliceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const d = (data ?? {}) as SpliceEdgeData;
  const fallbackLane = d.laneOverride ?? d.laneIndex ?? 0;
  const laneCount = Math.max(1, d.laneCount ?? 1);
  const useDynamicLanes = laneCount > 1;

  const { midX, jogX, sourceHorizY, targetHorizY } = useRoutingLaneIndex(
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    fallbackLane,
    useDynamicLanes,
    laneCount,
    d.rowOffset,
    d.sideCircuitSpan ?? defaultSideCircuitLabelSpan(),
    d.tubeBundleKey,
  );

  const { leftPath, rightPath, spliceX, spliceY } = buildSplicePath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    midX,
    jogX,
    { sourceHorizY, targetHorizY },
  );

  const fallback = d.color ?? "#e2e8f0";
  const sourceStroke = d.existing ? "#94a3b8" : (d.sourceColor ?? fallback);
  const targetStroke = d.existing ? "#94a3b8" : (d.targetColor ?? fallback);
  const dash = d.existing ? "8 5" : undefined;
  const tubeStroke = d.fullButtSplice ? 8 : d.existing ? 1.5 : 2.5;
  const edgeOpacity = d.existing ? 0.85 : 1;

  return (
    <>
      <SpliceLeg
        id={`${id}-left`}
        path={leftPath}
        stroke={sourceStroke}
        strokeWidth={tubeStroke}
        strokeDasharray={dash}
        opacity={edgeOpacity}
      />
      <SpliceLeg
        id={`${id}-right`}
        path={rightPath}
        stroke={targetStroke}
        strokeWidth={tubeStroke}
        strokeDasharray={dash}
        opacity={edgeOpacity}
      />
      {!d.existing ? (
        d.fullButtSplice ? (
          <rect
            x={spliceX - 8}
            y={spliceY - 8}
            width={16}
            height={16}
            fill="#000"
            className="splice-edge__square"
          />
        ) : (
          <circle
            cx={spliceX}
            cy={spliceY}
            r={4}
            fill="#000"
            className="splice-edge__dot"
          />
        )
      ) : null}
    </>
  );
}
