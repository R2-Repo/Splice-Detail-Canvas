import { BaseEdge, type EdgeProps } from "@xyflow/react";

import {
  buildDemarcatedSplicePaths,
  spliceMidX,
  useRoutingLaneIndex,
} from "@/features/canvas/edges/spliceEdgeRouting";

type SpliceEdgeData = {
  /** @deprecated use sourceColor */
  color?: string;
  sourceColor?: string;
  targetColor?: string;
  existing?: boolean;
  fullButtSplice?: boolean;
  laneIndex?: number;
  laneCount?: number;
};

export function SpliceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const d = (data ?? {}) as SpliceEdgeData;
  const fallbackLane = d.laneIndex ?? 0;
  const laneCount = Math.max(1, d.laneCount ?? 1);
  const useDynamicLanes = laneCount > 1;

  const { routingLane, activeLaneCount } = useRoutingLaneIndex(
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    fallbackLane,
    useDynamicLanes,
    laneCount,
  );

  const midX = spliceMidX(
    sourceX,
    targetX,
    routingLane,
    useDynamicLanes ? activeLaneCount : laneCount,
  );

  const { leftPath, rightPath, spliceX, spliceY } = buildDemarcatedSplicePaths(
    sourceX,
    sourceY,
    targetX,
    targetY,
    midX,
  );

  const fallback = d.color ?? "#e2e8f0";
  const sourceStroke = d.existing ? "#94a3b8" : (d.sourceColor ?? fallback);
  const targetStroke = d.existing ? "#94a3b8" : (d.targetColor ?? fallback);
  const dash = d.existing ? "8 5" : undefined;
  const tubeStroke = d.fullButtSplice ? 8 : d.existing ? 1.5 : 2.5;
  const edgeStyle = {
    strokeWidth: tubeStroke,
    strokeDasharray: dash,
    opacity: d.existing ? 0.85 : 1,
  };

  return (
    <>
      <BaseEdge
        id={`${id}-left`}
        path={leftPath}
        style={{ ...edgeStyle, stroke: sourceStroke }}
      />
      <BaseEdge
        id={`${id}-right`}
        path={rightPath}
        style={{ ...edgeStyle, stroke: targetStroke }}
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
