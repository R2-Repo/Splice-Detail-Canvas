import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { CableNodeData } from "./types";

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const handlePos = d.side === "left" ? Position.Right : Position.Left;

  return (
    <div className={`splice-node cable-node cable-node--${d.side}`}>
      <div className="cable-node__circle" aria-hidden />
      <div className="cable-node__stub" aria-hidden />
      <Handle type="source" position={handlePos} id="out" />
      <span className="cable-node__label">{d.label}</span>
    </div>
  );
}
