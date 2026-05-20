import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

type SpliceEdgeData = {
  color?: string;
  existing?: boolean;
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
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
    offset: 8,
  });

  const stroke = d.color ?? "#e2e8f0";
  const dash = d.existing ? "6 4" : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke,
          strokeWidth: 2,
          strokeDasharray: dash,
        }}
      />
      <circle
        cx={labelX}
        cy={labelY}
        r={4}
        fill="#000"
        className="splice-edge__dot"
      />
    </>
  );
}
