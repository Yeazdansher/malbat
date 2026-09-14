"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import PersonNode from "./nodes/PersonNode";
import PartnershipNode from "./nodes/PartnershipNode";
import FamilyEdge from "./edges/FamilyEdge";

import {
  buildTreeGraph,
  buildTreeLayout,
  buildReactFlowGraph,
  type Relationship,
} from "@/lib/tree-engine";
import { collectSearchBranch } from "@/lib/search-branch";

type Person = {
  id: string;
  family_id: string;

  first_name: string;
  last_name: string;

  gender: "male" | "female" | "unknown";

  birth_date: string | null;
  birth_place: string | null;

  is_deceased: boolean;

  death_date: string | null;
  death_place: string | null;

  notes: string | null;
};

type Props = {
  persons: Person[];
  relationships: Relationship[];
  canEdit: boolean;
  focusPersonId?: string;
  focusRequest: number;

  onOpenDetails: (person: Person) => void;
  onOpenRelationship: (person: Person) => void;
  onOpenParents: (person: Person) => void;
  onOpenSiblings: (person: Person) => void;
  onAddChild: (parentIds: string[]) => void;
};

export default function TreeView({
  persons,
  relationships,
  canEdit,
  focusPersonId,
  focusRequest,
  onOpenDetails,
  onOpenRelationship,
  onOpenParents,
  onOpenSiblings,
  onAddChild,
}: Props) {
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const nodeTypes = useMemo(
    () => ({
      person: PersonNode,
      family: PartnershipNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      family: FamilyEdge,
    }),
    []
  );

  /**
   * 1. Domänengraph erzeugen
   */
  const graph = useMemo(
    () => buildTreeGraph(persons, relationships),
    [persons, relationships]
  );

  /**
   * 2. Layout berechnen
   */
  const layoutResult = useMemo(() => {
    try {
      return { layout: buildTreeLayout(graph), error: null as string | null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Layout-Fehler";
      return { layout: null, error: message };
    }
  }, [graph]);

  /**
   * 3. React-Flow-Struktur erzeugen
   */
  const { nodes, edges } = useMemo(() => {
    if (!layoutResult.layout) {
      return { nodes: [], edges: [] };
    }

    return buildReactFlowGraph(
      graph,
      layoutResult.layout,
      onOpenDetails,
      onOpenRelationship,
      onOpenParents,
      onOpenSiblings,
      canEdit
    );
  }, [
    graph,
    layoutResult.layout,
    onOpenDetails,
    onOpenRelationship,
    onOpenParents,
    onOpenSiblings,
    canEdit,
  ]);

  const branchPersonIds = useMemo(() => {
    if (!focusPersonId) {
      return new Set<string>();
    }

    return collectSearchBranch(focusPersonId, relationships);
  }, [focusPersonId, relationships]);

  const displayedNodes = useMemo(
    () =>
      nodes.map((node) => {
        if (node.type === "person") {
          return {
            ...node,
            data: {
              ...node.data,
              searchHighlighted: node.id === focusPersonId,
              branchHighlighted:
                node.id !== focusPersonId && branchPersonIds.has(node.id),
            },
          };
        }

        if (node.type === "family") {
          const parentIds =
            node.data &&
            typeof node.data === "object" &&
            "parentIds" in node.data &&
            Array.isArray(node.data.parentIds)
              ? (node.data.parentIds as string[])
              : [];
          const onBranch =
            focusPersonId !== undefined &&
            parentIds.some((id) => branchPersonIds.has(id));

          return {
            ...node,
            style: {
              ...node.style,
              outline: onBranch ? "2px solid #4ade80" : undefined,
              outlineOffset: onBranch ? "2px" : undefined,
              borderRadius: onBranch ? "9999px" : undefined,
            },
          };
        }

        return node;
      }),
    [nodes, focusPersonId, branchPersonIds]
  );

  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => {
        if (!focusPersonId || branchPersonIds.size === 0) {
          return edge;
        }

        const sourceOnBranch = branchPersonIds.has(edge.source);
        const targetOnBranch = branchPersonIds.has(edge.target);
        const sourceIsFamily = edge.source.startsWith("family-node:");
        const targetIsFamily = edge.target.startsWith("family-node:");

        const highlighted =
          (sourceOnBranch && targetOnBranch) ||
          (sourceIsFamily && targetOnBranch) ||
          (targetIsFamily && sourceOnBranch);

        if (!highlighted) {
          return edge;
        }

        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: "#16a34a",
            strokeWidth: 3.5,
          },
        };
      }),
    [edges, branchPersonIds, focusPersonId]
  );

  useEffect(() => {
    if (!flowInstance || !focusPersonId) {
      return;
    }

    const personNode = nodes.find(
      (node) => node.id === focusPersonId
    );

    if (!personNode) {
      return;
    }

    void flowInstance.setCenter(
      personNode.position.x + 135,
      personNode.position.y + 88,
      {
        zoom: 1.15,
        duration: 500,
      }
    );
  }, [flowInstance, focusPersonId, focusRequest, nodes]);

  if (layoutResult.error) {
    return (
      <div className="flex h-[650px] items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold text-red-800">
            Stammbaum-Layout fehlgeschlagen
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {persons.length} Personen geladen, aber die Darstellung ist
            abgestürzt: {layoutResult.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
      }}
    >
      <ReactFlow
        nodes={displayedNodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={true}
        panOnDrag
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        onInit={setFlowInstance}
        onNodeClick={(_event, node) => {
          if (!canEdit || node.type !== "family") {
            return;
          }

          const data = node.data as {
            parentIds?: string[];
            kind?: "union" | "sibling-group";
          };

          if (data.kind === "sibling-group") {
            return;
          }

          const parentIds = data.parentIds ?? [];
          onAddChild(parentIds);
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}