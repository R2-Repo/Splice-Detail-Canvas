import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

import {
  FIBER_ROW_PITCH,
  MIN_FIBER_LINE_GAP,
  SPLICE_LANE_SEP,
} from "@/features/diagram/cableLayoutMetrics";

type SpliceEdgeData = {
  color?: string;
  existing?: boolean;
  laneIndex?: number;
  laneCount?: number;
};

export function SpliceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const d = (data ?? {}) as SpliceEdgeData;
  const laneCount = Math.max(1, d.laneCount ?? 1);
  const laneIndex = d.laneIndex ?? 0;
  const laneOffset =
    (laneIndex - (laneCount - 1) / 2) * SPLICE_LANE_SEP;

  const verticalSpan = Math.abs(targetY - sourceY);
  const offset =
    verticalSpan > MIN_FIBER_LINE_GAP
      ? Math.min(verticalSpan * 0.4, 200)
      : FIBER_ROW_PITCH / 2;

  const centerX = (sourceX + targetX) / 2 + laneOffset;

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
    offset,
    centerX,
  });

  const stroke = d.existing ? "#94a3b8" : (d.color ?? "#e2e8f0");
  const dash = d.existing ? "8 5" : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke,
          strokeWidth: d.existing ? 1.5 : 2.5,
          strokeDasharray: dash,
          opacity: d.existing ? 0.85 : 1,
        }}
      />
      {!d.existing ? (
        <circle
          cx={labelX}
          cy={labelY}
          r={4}
          fill="#000"
          className="splice-edge__dot"
        />
      ) : null}
    </>
  );
}
