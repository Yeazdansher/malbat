"use client";

import { useMemo } from "react";
import {
  BaseEdge,
  Position,
  useEdges,
  useNodes,
  type EdgeProps,
  type Node,
} from "@xyflow/react";

import {
  buildHopPath,
  getSmoothStepPoints,
  type EdgeGeometry,
} from "@/lib/tree-engine/edge-hops";

function handlePosition(handleId?: string | null): Position {
  switch (handleId) {
    case "partner-left":
    case "left":
      return Position.Left;
    case "partner-right":
    case "right":
      return Position.Right;
    case "parent":
    case "parents":
      return Position.Top;
    case "child":
    case "children":
      return Position.Bottom;
    default:
      return Position.Bottom;
  }
}

function handleAnchor(
  node: Node,
  handleId?: string | null
): { x: number; y: number; position: Position } {
  const width =
    node.measured?.width ??
    node.width ??
    (node.type === "family" ? 32 : 270);
  const height =
    node.measured?.height ??
    node.height ??
    (node.type === "family" ? 32 : 176);

  const left = node.position.x;
  const top = node.position.y;
  const cx = left + width / 2;
  const cy = top + height / 2;
  const position = handlePosition(handleId);

  switch (position) {
    case Position.Left:
      return { x: left, y: cy, position };
    case Position.Right:
      return { x: left + width, y: cy, position };
    case Position.Top:
      return { x: cx, y: top, position };
    case Position.Bottom:
    default:
      return { x: cx, y: top + height, position };
  }
}

export default function FamilyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  markerStart,
  interactionWidth,
}: EdgeProps) {
  const nodes = useNodes();
  const edges = useEdges();

  const otherGeometries = useMemo(() => {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const geometries: EdgeGeometry[] = [];

    for (const edge of edges) {
      if (edge.id === id) {
        continue;
      }

      const sourceNode = byId.get(edge.source);
      const targetNode = byId.get(edge.target);

      if (!sourceNode || !targetNode) {
        continue;
      }

      const sourceAnchor = handleAnchor(sourceNode, edge.sourceHandle);
      const targetAnchor = handleAnchor(targetNode, edge.targetHandle);

      geometries.push({
        id: edge.id,
        points: getSmoothStepPoints({
          sourceX: sourceAnchor.x,
          sourceY: sourceAnchor.y,
          targetX: targetAnchor.x,
          targetY: targetAnchor.y,
          sourcePosition: sourceAnchor.position,
          targetPosition: targetAnchor.position,
        }),
      });
    }

    return geometries;
  }, [edges, id, nodes]);

  const [path, labelX, labelY] = useMemo(() => {
    const points = getSmoothStepPoints({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });

    const hopPath = buildHopPath(points, otherGeometries, id);
    const mid = points[Math.floor(points.length / 2)] ?? {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2,
    };

    return [hopPath, mid.x, mid.y] as const;
  }, [
    id,
    otherGeometries,
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  ]);

  return (
    <BaseEdge
      id={id}
      path={path}
      labelX={labelX}
      labelY={labelY}
      style={{
        stroke: "#1f2937",
        strokeWidth: 2.5,
        ...style,
      }}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth}
    />
  );
}
