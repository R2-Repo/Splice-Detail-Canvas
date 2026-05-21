import type { VisualTube } from "@/features/diagram/visualCables";

export type CableNodeData = {
  /** Bentley count line, e.g. "006 SMFO (R2)". */
  smfoLabel?: string;
  label: string;
  side: "left" | "right";
  tubes: VisualTube[];
  nodeHeight: number;
  /** Center-to-center spacing between fiber rows (px). */
  fiberPitch: number;
  /** Diagram scale factor for sheath/tube sizing. */
  diagramScale?: number;
  spliceNumber?: string;
};

export type BufferTubeNodeData = {
  tubeColor: string;
  color: string;
  striped: boolean;
  label: string;
  side: "left" | "right";
};

export type FiberStrandNodeData = {
  color: string;
  label: string;
  side: "left" | "right";
};
