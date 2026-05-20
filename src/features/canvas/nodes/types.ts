import type { TubeColorCode } from "@/types/splice";

export type CableNodeData = {
  label: string;
  side: "left" | "right";
};

export type BufferTubeNodeData = {
  tubeColor: TubeColorCode;
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
