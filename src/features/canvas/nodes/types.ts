import type { VisualTube } from "@/features/diagram/visualCables";

export type CableNodeData = {
  label: string;
  countLabel?: string;
  side: "left" | "right";
  tubes: VisualTube[];
  nodeHeight: number;
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
