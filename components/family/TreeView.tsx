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
  const layout = useMemo(
    () => buildTreeLayout(graph),
    [graph]
  );

  /**
   * 3. React-Flow-Struktur erzeugen
   */
  const { nodes, edges } = useMemo(
    () =>
      buildReactFlowGraph(
        graph,
        layout,
        onOpenDetails,
        onOpenRelationship,
        onOpenParents,
        onOpenSiblings,
        canEdit
      ),
    [
      graph,
      layout,
      onOpenDetails,
      onOpenRelationship,
      onOpenParents,
      onOpenSiblings,
      canEdit,
    ]
  );

  const displayedNodes = useMemo(
    () =>
      nodes.map((node) =>
        node.type === "person"
          ? {
              ...node,
              data: {
                ...node.data,
                searchHighlighted: node.id === focusPersonId,
              },
            }
          : node
      ),
    [nodes, focusPersonId]
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

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
      }}
    >
      <ReactFlow
        nodes={displayedNodes}
        edges={edges}
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