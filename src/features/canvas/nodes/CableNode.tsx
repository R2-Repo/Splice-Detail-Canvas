import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";

import { CABLE_LAYOUT } from "@/features/diagram/cableLayoutMetrics";
import { colorHex, colorName, isStripedTube } from "@/features/diagram/colorCode";
import { formatCircuitTag } from "@/features/diagram/cableLabels";
import type { FiberColorAbbrev, TubeColorCode } from "@/types/splice";

import type { CableNodeData } from "./types";

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const handlePos = d.side === "left" ? Position.Right : Position.Left;
  const pitch = d.fiberPitch ?? CABLE_LAYOUT.fiberRowH;

  return (
    <div
      className={`splice-node cable-node cable-node--composite cable-node--${d.side}`}
      style={
        {
          minHeight: d.nodeHeight,
          "--fiber-pitch": `${pitch}px`,
          "--fiber-strand": `${CABLE_LAYOUT.fiberStrandH}px`,
        } as CSSProperties
      }
    >
      <div className="cable-node__head">
        <div className="cable-node__circle" aria-hidden />
        <div className="cable-node__titles">
          {d.smfoLabel ? (
            <span className="cable-node__smfo">{d.smfoLabel}</span>
          ) : null}
          <span className="cable-node__label">{d.label}</span>
        </div>
      </div>

      <div className="cable-node__body">
        {d.tubes.map((tube) => {
          const base = tube.tubeColor.split("-")[0] as FiberColorAbbrev;
          const striped = isStripedTube(tube.tubeColor as TubeColorCode);
          const maxRow = tube.fibers.length
            ? Math.max(...tube.fibers.map((f) => f.rowIndex))
            : 0;
          const tubeBodyH = (maxRow + 1) * pitch;
          return (
            <div key={tube.tubeColor} className="cable-node__tube">
              <div
                className={`cable-node__tube-bar${striped ? " cable-node__tube-bar--striped" : ""}`}
                style={{
                  backgroundColor: colorHex(base),
                  minHeight: tubeBodyH + 8,
                }}
                title={tube.tubeColor}
              />
              <div className="cable-node__tube-stack">
                <span className="cable-node__tube-label">{tube.tubeColor}</span>
                <div
                  className="cable-node__fibers"
                  style={{ minHeight: tubeBodyH }}
                >
                  {tube.fibers.map((fiber) => {
                    const circuit = formatCircuitTag(
                      fiber.circuitName,
                      fiber.fiberColor,
                    );
                    return (
                      <div
                        key={fiber.handleId}
                        className="cable-node__fiber-row"
                        style={{
                          position: "absolute",
                          top: fiber.rowIndex * pitch,
                          left: 0,
                          right: 0,
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
