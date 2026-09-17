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
  photo_url?: string | null;
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

  const {
    ancestors: ancestorPersonIds,
    descendants: descendantPersonIds,
    ancestorFamilyIds,
    descendantFamilyIds,
  } = useMemo(() => {
    if (!focusPersonId) {
      return {
        ancestors: new Set<string>(),
        descendants: new Set<string>(),
        ancestorFamilyIds: new Set<string>(),
        descendantFamilyIds: new Set<string>(),
      };
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
                node.id !== focusPersonId &&
                ancestorPersonIds.has(node.id),
              descendantHighlighted:
                node.id !== focusPersonId &&
                descendantPersonIds.has(node.id),
            },
          };
        }

        if (node.type === "family") {
          const onDescendantBranch = descendantFamilyIds.has(node.id);
          const onAncestorBranch =
            !onDescendantBranch && ancestorFamilyIds.has(node.id);

          return {
            ...node,
            style: {
              ...node.style,
              outline: onDescendantBranch
                ? "2px solid #22c55e"
                : onAncestorBranch
                  ? "2px solid #f87171"
                  : undefined,
              outlineOffset:
                onDescendantBranch || onAncestorBranch
                  ? "2px"
                  : undefined,
              borderRadius:
                onDescendantBranch || onAncestorBranch
                  ? "9999px"
                  : undefined,
            },
          };
        }

        return node;
      }),
    [
      nodes,
      focusPersonId,
      ancestorPersonIds,
      descendantPersonIds,
      ancestorFamilyIds,
      descendantFamilyIds,
    ]
  );

  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => {
        if (!focusPersonId) {
          return edge;
        }

        const touchesDescendantFamily =
          descendantFamilyIds.has(edge.source) ||
          descendantFamilyIds.has(edge.target);
        const touchesAncestorFamily =
          ancestorFamilyIds.has(edge.source) ||
          ancestorFamilyIds.has(edge.target);

        const sourceDesc = descendantPersonIds.has(edge.source);
        const targetDesc = descendantPersonIds.has(edge.target);
        const sourceAnc = ancestorPersonIds.has(edge.source);
        const targetAnc = ancestorPersonIds.has(edge.target);

        // Grün: Nachkommen-Familien und Nachkommen-Personen
        const isDown =
          touchesDescendantFamily || sourceDesc || targetDesc;

        // Rot: nur Vorfahren-Familien / Vorfahren-Personen
        const isUp =
          !isDown &&
          (touchesAncestorFamily || sourceAnc || targetAnc);

        if (!isDown && !isUp) {
          return edge;
        }

        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isDown ? "#16a34a" : "#dc2626",
            strokeWidth: 3.5,
          },
        };
      }),
    [
      edges,
      focusPersonId,
      ancestorPersonIds,
      descendantPersonIds,
      ancestorFamilyIds,
      descendantFamilyIds,
    ]
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
    <div className="relative z-0 h-full w-full">
      <ReactFlow
        nodes={displayedNodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={true}
        panOnDrag
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        onInit={(instance) => {
          setFlowInstance(instance);
          void instance.fitView({
            padding: 0.2,
            minZoom: 0.1,
            maxZoom: 1.5,
          });
        }}
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