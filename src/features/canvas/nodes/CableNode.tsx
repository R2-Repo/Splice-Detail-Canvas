import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { useEffect, type CSSProperties } from "react";

import { CABLE_LAYOUT } from "@/features/diagram/cableLayoutMetrics";
import { computeCableBreakout } from "@/features/diagram/cableBreakoutGeometry";
import { colorHex, colorName, isStripedTube } from "@/features/diagram/colorCode";
import { formatCircuitTag } from "@/features/diagram/cableLabels";
import type { FiberColorAbbrev, TubeColorCode } from "@/types/splice";

import type { CableNodeData } from "./types";

function tubeStroke(
  tubeColor: TubeColorCode,
  striped: boolean,
): { stroke: string; strokeDasharray?: string } {
  const base = tubeColor.split("-")[0] as FiberColorAbbrev;
  return {
    stroke: colorHex(base),
    strokeDasharray: striped ? "6 4" : undefined,
  };
}

export function CableNode({ id, data }: NodeProps) {
  const d = data as CableNodeData;
  const handlePos = d.side === "left" ? Position.Right : Position.Left;
  const pitch = d.fiberPitch ?? CABLE_LAYOUT.fiberRowH;
  const scale = d.diagramScale ?? 1;
  const updateNodeInternals = useUpdateNodeInternals();

  const geo = computeCableBreakout(
    d.tubes,
    d.side,
    pitch,
    CABLE_LAYOUT.headerH,
    CABLE_LAYOUT.tubeLabelH,
    scale,
  );

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, d.side, d.tubes, geo.viewWidth, geo.viewHeight, updateNodeInternals]);

  const fiberByHandle = new Map(
    geo.tubes.flatMap((t) =>
      t.fibers.map((f) => [f.handleId, f] as const),
    ),
  );

  const allFibers = d.tubes
    .flatMap((tube) => tube.fibers.map((fiber) => ({ tube, fiber })))
    .sort(
      (a, b) =>
        a.fiber.fiberNumber - b.fiber.fiberNumber ||
        a.fiber.rowYOffset - b.fiber.rowYOffset,
    );

  return (
    <div
      className={`splice-node cable-node cable-node--composite cable-node--${d.side}`}
      style={
        {
          minHeight: d.nodeHeight,
          "--fiber-pitch": `${pitch}px`,
          "--fiber-strand": `${CABLE_LAYOUT.fiberStrandH}px`,
          width: geo.viewWidth,
          height: geo.viewHeight,
        } as CSSProperties
      }
    >
      <div
        className="cable-node__sheath"
        style={{
          left: geo.sheath.x,
          top: geo.sheath.y,
          width: geo.sheath.width,
          height: geo.sheath.height,
        }}
      >
        <div className="cable-node__titles">
          {d.smfoLabel ? (
            <span className="cable-node__smfo">{d.smfoLabel}</span>
          ) : null}
          <span className="cable-node__label">{d.label}</span>
        </div>
      </div>

      <svg
        className="cable-node__breakout-svg"
        width={geo.viewWidth}
        height={geo.viewHeight}
        aria-hidden
      >
        {geo.tubes.map((tube) => {
          const striped = isStripedTube(tube.tubeColor);
          const stroke = tubeStroke(tube.tubeColor, striped);
          return (
            <g key={tube.tubeColor}>
              <line
                x1={tube.origin.x}
                y1={tube.origin.y}
                x2={tube.end.x}
                y2={tube.end.y}
                stroke={stroke.stroke}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={stroke.strokeDasharray}
              />
              {tube.fibers.map((fiber) => (
                <line
                  key={fiber.handleId}
                  x1={fiber.fanFrom.x}
                  y1={fiber.fanFrom.y}
                  x2={fiber.fanTo.x}
                  y2={fiber.fanTo.y}
                  stroke={colorHex(fiber.fiberColor)}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}
      </svg>

      {geo.tubes.map((tube) => (
        <span
          key={`label-${tube.tubeColor}`}
          className="cable-node__tube-label"
          style={{
            top: tube.end.y - 8,
            left: d.side === "left" ? tube.end.x + 4 : undefined,
            right:
              d.side === "right" ? geo.viewWidth - tube.end.x + 4 : undefined,
          }}
        >
          {tube.tubeColor}
        </span>
      ))}

      <div className="cable-node__fiber-rows">
        {allFibers.map(({ fiber }) => {
          const fg = fiberByHandle.get(fiber.handleId);
          const rowY = fg?.rowY ?? 0;
          const circuit = formatCircuitTag(
            fiber.circuitName,
            fiber.fiberColor,
          );
          return (
            <div
              key={fiber.handleId}
              className="cable-node__fiber-row"
              style={{
                top: rowY,
                left: d.side === "left" ? geo.stemX : undefined,
                right:
                  d.side === "right" ? geo.viewWidth - geo.stemX : undefined,
              }}
            >
              <Handle
                type="source"
                position={handlePos}
                id={`${fiber.handleId}-out`}
                className="cable-node__handle"
              />
              <Handle
                type="target"
                position={handlePos}
                id={`${fiber.handleId}-in`}
                className="cable-node__handle"
              />
              <span
                className="cable-node__fiber-swatch"
                style={{
                  backgroundColor: colorHex(fiber.fiberColor),
                }}
                title={colorName(fiber.fiberColor)}
              />
              <span className="cable-node__fiber-code">
                {fiber.fiberColor}
              </span>
              {circuit ? (
                <span className="cable-node__circuit">{circuit}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
