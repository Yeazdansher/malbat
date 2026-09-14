"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  applyNodeChanges,
  type Node,
  type NodeChange,
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
import { collectDragGroupNodeIds } from "@/lib/drag-subtree";
import {
  applyLayoutOverrides,
  type LayoutOverrideMap,
} from "@/lib/layout-overrides";
import type { LayoutNodePosition } from "@/app/family/[id]/actions";

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
  layoutOverrides: LayoutOverrideMap;
  canEdit: boolean;
  arrangeMode: boolean;
  focusPersonId?: string;
  focusRequest: number;
  onArrangePositionsChange: (positions: LayoutNodePosition[]) => void;
  onOpenDetails: (person: Person) => void;
  onOpenRelationship: (person: Person) => void;
  onOpenParents: (person: Person) => void;
  onOpenSiblings: (person: Person) => void;
  onAddChild: (parentIds: string[]) => void;
};

function nodesToPositions(nodes: Node[]): LayoutNodePosition[] {
  return nodes.map((node) => ({
    nodeId: node.id,
    x: node.position.x,
    y: node.position.y,
  }));
}

export default function TreeView({
  persons,
  relationships,
  layoutOverrides,
  canEdit,
  arrangeMode,
  focusPersonId,
  focusRequest,
  onArrangePositionsChange,
  onOpenDetails,
  onOpenRelationship,
  onOpenParents,
  onOpenSiblings,
  onAddChild,
}: Props) {
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);

  const dragGroupRef = useRef<Set<string>>(new Set());
  const dragStartPositionsRef = useRef<
    Record<string, { x: number; y: number }>
  >({});
  const wasArrangeModeRef = useRef(false);
  const onArrangePositionsChangeRef = useRef(onArrangePositionsChange);
  onArrangePositionsChangeRef.current = onArrangePositionsChange;

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

  const graph = useMemo(
    () => buildTreeGraph(persons, relationships),
    [persons, relationships]
  );

  const layoutResult = useMemo(() => {
    try {
      return { layout: buildTreeLayout(graph), error: null as string | null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Layout-Fehler";
      return { layout: null, error: message };
    }
  }, [graph]);

  const layoutWithOverrides = useMemo(() => {
    if (!layoutResult.layout) {
      return null;
    }

    return applyLayoutOverrides(layoutResult.layout, layoutOverrides);
  }, [layoutResult.layout, layoutOverrides]);

  const cardCanEdit = canEdit && !arrangeMode;

  const { nodes: baseNodes, edges } = useMemo(() => {
    if (!layoutWithOverrides) {
      return { nodes: [] as Node[], edges: [] };
    }

    return buildReactFlowGraph(
      graph,
      layoutWithOverrides,
      onOpenDetails,
      onOpenRelationship,
      onOpenParents,
      onOpenSiblings,
      cardCanEdit
    );
  }, [
    graph,
    layoutWithOverrides,
    onOpenDetails,
    onOpenRelationship,
    onOpenParents,
    onOpenSiblings,
    cardCanEdit,
  ]);

  const branchPersonIds = useMemo(() => {
    if (!focusPersonId) {
      return new Set<string>();
    }

    return collectSearchBranch(focusPersonId, relationships);
  }, [focusPersonId, relationships]);

  const decorateNodes = useCallback(
    (sourceNodes: Node[]): Node[] =>
      sourceNodes.map((node) => {
        if (node.type === "person") {
          return {
            ...node,
            draggable: arrangeMode,
            selectable: true,
            dragHandle: ".person-drag-root",
            data: {
              ...node.data,
              canEdit: cardCanEdit,
              arrangeMode,
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
            draggable: false,
            selectable: !arrangeMode,
            style: {
              ...node.style,
              outline: onBranch ? "2px solid #f87171" : undefined,
              outlineOffset: onBranch ? "2px" : undefined,
              borderRadius: onBranch ? "9999px" : undefined,
            },
          };
        }

        return {
          ...node,
          draggable: false,
        };
      }),
    [arrangeMode, branchPersonIds, cardCanEdit, focusPersonId]
  );

  // Außerhalb Anordnen: immer vom Layout. Beim Einschalten: einmal übernehmen.
  useEffect(() => {
    if (!arrangeMode) {
      setFlowNodes(decorateNodes(baseNodes));
      wasArrangeModeRef.current = false;
      return;
    }

    if (!wasArrangeModeRef.current) {
      const seeded = decorateNodes(baseNodes);
      setFlowNodes(seeded);
      onArrangePositionsChangeRef.current(nodesToPositions(seeded));
      wasArrangeModeRef.current = true;
    }
  }, [arrangeMode, baseNodes, decorateNodes]);

  // Highlight-Flags aktualisieren, Positionen behalten.
  useEffect(() => {
    if (!arrangeMode) {
      return;
    }

    setFlowNodes((current) => decorateNodes(current));
  }, [arrangeMode, focusPersonId, branchPersonIds, decorateNodes]);

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
            stroke: "#dc2626",
            strokeWidth: 3.5,
          },
        };
      }),
    [edges, branchPersonIds, focusPersonId]
  );

  useEffect(() => {
    if (!flowInstance || !focusPersonId || arrangeMode) {
      return;
    }

    const personNode = flowNodes.find((node) => node.id === focusPersonId);
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
  }, [flowInstance, focusPersonId, focusRequest, flowNodes, arrangeMode]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((current) => applyNodeChanges(changes, current));
    },
    []
  );

  const handleNodeDragStart = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (!arrangeMode || node.type !== "person" || !layoutResult.layout) {
        return;
      }

      const group = collectDragGroupNodeIds(
        node.id,
        relationships,
        layoutResult.layout.edges
      );
      dragGroupRef.current = group;

      const starts: Record<string, { x: number; y: number }> = {};
      setFlowNodes((current) => {
        for (const entry of current) {
          if (group.has(entry.id)) {
            starts[entry.id] = { ...entry.position };
          }
        }
        dragStartPositionsRef.current = starts;
        return current;
      });
    },
    [arrangeMode, layoutResult.layout, relationships]
  );

  const handleNodeDrag = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (!arrangeMode) {
        return;
      }

      const group = dragGroupRef.current;
      const starts = dragStartPositionsRef.current;
      const start = starts[node.id];

      if (!start || group.size <= 1) {
        return;
      }

      const dx = node.position.x - start.x;
      const dy = node.position.y - start.y;

      setFlowNodes((current) =>
        current.map((entry) => {
          if (!group.has(entry.id) || entry.id === node.id) {
            return entry;
          }

          const origin = starts[entry.id];
          if (!origin) {
            return entry;
          }

          return {
            ...entry,
            position: {
              x: origin.x + dx,
              y: origin.y + dy,
            },
          };
        })
      );
    },
    [arrangeMode]
  );

  const handleNodeDragStop = useCallback(() => {
    if (!arrangeMode) {
      return;
    }

    dragGroupRef.current = new Set();
    dragStartPositionsRef.current = {};

    setFlowNodes((current) => {
      onArrangePositionsChangeRef.current(nodesToPositions(current));
      return current;
    });
  }, [arrangeMode]);

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
      className={
        arrangeMode
          ? "rounded-2xl ring-2 ring-amber-400 ring-offset-2"
          : undefined
      }
      style={{
        width: "100%",
        height: "700px",
      }}
    >
      <ReactFlow
        nodes={flowNodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesDraggable={arrangeMode}
        elementsSelectable={true}
        // Anordnen: kein Linksklick-Pan — sonst wandert nur die Karte/Canvas.
        panOnDrag={!arrangeMode}
        panOnScroll={arrangeMode}
        zoomOnScroll
        nodeDragThreshold={0}
        fitView={!arrangeMode}
        fitViewOptions={{ padding: 0.2, minZoom: 0.1, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        onInit={setFlowInstance}
        onNodesChange={handleNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_event, node) => {
          if (!canEdit || arrangeMode || node.type !== "family") {
            return;
          }

          const data = node.data as {
            parentIds?: string[];
            kind?: "union" | "sibling-group";
          };

          if (data.kind === "sibling-group") {
            return;
          }

          onAddChild(data.parentIds ?? []);
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
