import { Handle, Position, type NodeProps } from "@xyflow/react";

import { colorHex, colorName, isStripedTube } from "@/features/diagram/colorCode";
import { fiberRowOffsetInTubes } from "@/features/diagram/cableLayoutMetrics";
import type { FiberColorAbbrev, TubeColorCode } from "@/types/splice";

import type { CableNodeData } from "./types";

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const handlePos = d.side === "left" ? Position.Right : Position.Left;
  const countLabel = d.countLabel ?? inferCountLabel(d.label);

  return (
    <div
      className={`splice-node cable-node cable-node--composite cable-node--${d.side}`}
      style={{ minHeight: d.nodeHeight }}
    >
      <div className="cable-node__head">
        <div className="cable-node__circle" aria-hidden />
        {countLabel ? (
          <span className="cable-node__count">{countLabel}</span>
        ) : null}
        <span className="cable-node__label">{d.label}</span>
      </div>

      <div className="cable-node__body">
        {d.tubes.map((tube) => {
          const base = tube.tubeColor.split("-")[0] as FiberColorAbbrev;
          const striped = isStripedTube(tube.tubeColor as TubeColorCode);
          return (
            <div key={tube.tubeColor} className="cable-node__tube">
              <div
                className={`cable-node__tube-bar${striped ? " cable-node__tube-bar--striped" : ""}`}
                style={{ backgroundColor: colorHex(base) }}
                title={tube.tubeColor}
              />
              <div className="cable-node__tube-label">{tube.tubeColor}</div>
              <div className="cable-node__fibers">
                {tube.fibers.map((fiber) => {
                  const top = fiberRowOffsetInTubes(d.tubes, fiber.connectionId);
                  return (
                    <div
                      key={fiber.handleId}
                      className="cable-node__fiber-row"
                      style={{ height: 24 }}
                    >
                      <Handle
                        type="source"
                        position={handlePos}
                        id={`${fiber.handleId}-out`}
                        className="cable-node__handle"
                        style={{ top }}
                      />
                      <Handle
                        type="target"
                        position={handlePos}
                        id={`${fiber.handleId}-in`}
                        className="cable-node__handle"
                        style={{ top }}
                      />
                      <span
                        className="cable-node__fiber-swatch"
                        style={{ backgroundColor: colorHex(fiber.fiberColor) }}
                        title={colorName(fiber.fiberColor)}
                      />
                      <span className="cable-node__fiber-num">
                        {fiber.fiberNumber}
                      </span>
                      <span className="cable-node__fiber-code">
                        {fiber.fiberColor}
                      </span>
                      {fiber.circuitName ? (
                        <span className="cable-node__circuit">
                          ({fiber.circuitName})
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function inferCountLabel(cable: string): string | undefined {
  const m = cable.match(/\b(\d{1,4})\s*(?:ct|SMF|SMFO|DROP|-SMF)?/i);
  if (m) return `${m[1]}ct`;
  const drop = cable.match(/\b(6)\s*[- ]?DROP/i);
  if (drop) return `${drop[1]}ct`;
  return undefined;
}
