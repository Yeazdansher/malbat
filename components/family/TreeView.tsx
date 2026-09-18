"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type OnNodeDrag,
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
import { recomputePartnerHandles } from "@/lib/partner-handles";
import type { LayoutNodePosition } from "@/app/family/[id]/actions";
import { useTranslations } from "@/lib/i18n/client";

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
  layoutOverrides: LayoutOverrideMap;
  canEdit: boolean;
  arrangeMode: boolean;
  discardGeneration: number;
  focusPersonId?: string;
  focusRequest: number;
  onArrangePositionsChange: (positions: LayoutNodePosition[]) => void;
  onArrangeDirtyChange: (dirty: boolean) => void;
  onOpenDetails: (person: Person) => void;
  onOpenRelationship: (person: Person) => void;
  onOpenParents: (person: Person) => void;
  onOpenSiblings: (person: Person) => void;
  onAddChild: (parentIds: string[]) => void;
  onFocusPerson: (personId: string | undefined) => void;
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
  discardGeneration,
  focusPersonId,
  focusRequest,
  onArrangePositionsChange,
  onArrangeDirtyChange,
  onOpenDetails,
  onOpenRelationship,
  onOpenParents,
  onOpenSiblings,
  onAddChild,
  onFocusPerson,
}: Props) {
  const t = useTranslations("tree");
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

  const draggingRef = useRef(false);
  const wasArrangeModeRef = useRef(false);
  const baselinePositionsRef = useRef<
    Record<string, { x: number; y: number }>
  >({});

  const onArrangePositionsChangeRef = useRef(onArrangePositionsChange);
  onArrangePositionsChangeRef.current = onArrangePositionsChange;
  const onArrangeDirtyChangeRef = useRef(onArrangeDirtyChange);
  onArrangeDirtyChangeRef.current = onArrangeDirtyChange;

  const dragRef = useRef<{
    nodeId: string;
    group: Set<string>;
    starts: Record<string, { x: number; y: number }>;
  } | null>(null);

  const flowNodesRef = useRef(flowNodes);
  flowNodesRef.current = flowNodes;
  const relationshipsRef = useRef(relationships);
  relationshipsRef.current = relationships;

  const handlersRef = useRef({
    onOpenDetails,
    onOpenRelationship,
    onOpenParents,
    onOpenSiblings,
  });
  handlersRef.current = {
    onOpenDetails,
    onOpenRelationship,
    onOpenParents,
    onOpenSiblings,
  };

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
        error instanceof Error ? error.message : t("layoutUnknownError");
      return { layout: null, error: message };
    }
  }, [graph, t]);

  const layoutWithOverrides = useMemo(() => {
    if (!layoutResult.layout) {
      return null;
    }

    return applyLayoutOverrides(layoutResult.layout, layoutOverrides);
  }, [layoutResult.layout, layoutOverrides]);

  const dragEnabled = canEdit && arrangeMode;
  const cardsEditable = canEdit && !arrangeMode;

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
    if (!layoutWithOverrides) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }

    return buildReactFlowGraph(
      graph,
      layoutWithOverrides,
      (person) => handlersRef.current.onOpenDetails(person),
      (person) => handlersRef.current.onOpenRelationship(person),
      (person) => handlersRef.current.onOpenParents(person),
      (person) => handlersRef.current.onOpenSiblings(person),
      cardsEditable
    );
  }, [graph, layoutWithOverrides, cardsEditable]);

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

  const decorateNodes = useCallback(
    (sourceNodes: Node[]): Node[] =>
      sourceNodes.map((node) => {
        if (node.type === "person") {
          return {
            ...node,
            draggable: dragEnabled,
            selectable: true,
            data: {
              ...node.data,
              canEdit: cardsEditable,
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
            draggable: false,
            selectable: true,
            data: {
              ...node.data,
              canEdit: cardsEditable,
            },
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

        return {
          ...node,
          draggable: false,
        };
      }),
    [
      ancestorFamilyIds,
      ancestorPersonIds,
      cardsEditable,
      descendantFamilyIds,
      descendantPersonIds,
      dragEnabled,
      focusPersonId,
    ]
  );

  // Soft-Refresh / Graph-/Override-Änderung: Positionen neu seedern.
  useEffect(() => {
    if (draggingRef.current || arrangeMode) {
      return;
    }

    const seeded = decorateNodes(baseNodes);
    setFlowNodes(seeded);
    setFlowEdges(recomputePartnerHandles(seeded, baseEdges));
    // decorateNodes bewusst ausgelassen: Highlight-Updates laufen separat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseNodes, baseEdges, arrangeMode]);

  // Suche / canEdit: Daten aktualisieren, Positionen behalten.
  useEffect(() => {
    if (draggingRef.current) {
      return;
    }

    setFlowNodes((current) => {
      if (current.length === 0) {
        return current;
      }
      return decorateNodes(current);
    });
  }, [decorateNodes]);

  // Anordnen starten: Baseline der aktuellen Positionen merken.
  useEffect(() => {
    if (arrangeMode && !wasArrangeModeRef.current) {
      const snapshot: Record<string, { x: number; y: number }> = {};
      for (const node of flowNodesRef.current) {
        snapshot[node.id] = { ...node.position };
      }
      baselinePositionsRef.current = snapshot;
      onArrangeDirtyChangeRef.current(false);
      onArrangePositionsChangeRef.current(
        nodesToPositions(flowNodesRef.current)
      );
    }
    wasArrangeModeRef.current = arrangeMode;
  }, [arrangeMode]);

  // Verwerfen: Positionen vor dem Anordnen wiederherstellen.
  useEffect(() => {
    if (discardGeneration === 0) {
      return;
    }

    const baseline = baselinePositionsRef.current;
    setFlowNodes((current) => {
      const next = current.map((node) => {
        const position = baseline[node.id];
        if (!position) {
          return node;
        }
        return {
          ...node,
          position: { ...position },
        };
      });
      setFlowEdges((edges) => recomputePartnerHandles(next, edges));
      return next;
    });
  }, [discardGeneration]);

  const displayedEdges = useMemo(
    () =>
      flowEdges.map((edge) => {
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

        const isDown =
          touchesDescendantFamily || sourceDesc || targetDesc;
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
      flowEdges,
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
  }, [flowInstance, focusPersonId, focusRequest, flowNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!dragEnabled) {
        const safeChanges = changes.filter(
          (change) => change.type !== "position"
        );
        if (safeChanges.length === 0) {
          return;
        }
        setFlowNodes((current) => applyNodeChanges(safeChanges, current));
        return;
      }

      // Controlled mode: Position-Changes müssen angewandt werden.
      setFlowNodes((current) => applyNodeChanges(changes, current));
    },
    [dragEnabled]
  );

  const handleNodeDragStart: OnNodeDrag = useCallback((_event, node) => {
    if (node.type !== "person") {
      return;
    }

    draggingRef.current = true;

    const group = collectDragGroupNodeIds(
      node.id,
      relationshipsRef.current
    );

    const starts: Record<string, { x: number; y: number }> = {};
    for (const entry of flowNodesRef.current) {
      if (group.has(entry.id)) {
        starts[entry.id] = { ...entry.position };
      }
    }

    dragRef.current = {
      nodeId: node.id,
      group,
      starts,
    };
  }, []);

  const handleNodeDrag: OnNodeDrag = useCallback((_event, node) => {
    const drag = dragRef.current;
    if (!drag || drag.nodeId !== node.id) {
      return;
    }

    const origin = drag.starts[node.id];
    if (!origin) {
      return;
    }

    const dx = node.position.x - origin.x;
    const dy = node.position.y - origin.y;

    setFlowNodes((current) => {
      const next = current.map((entry) => {
        if (entry.id === node.id || !drag.group.has(entry.id)) {
          return entry;
        }

        const start = drag.starts[entry.id];
        if (!start) {
          return entry;
        }

        return {
          ...entry,
          position: {
            x: start.x + dx,
            y: start.y + dy,
          },
        };
      });

      setFlowEdges((edges) => recomputePartnerHandles(next, edges));
      return next;
    });
  }, []);

  const handleNodeDragStop: OnNodeDrag = useCallback(() => {
    draggingRef.current = false;
    dragRef.current = null;

    const nodes = flowNodesRef.current;
    setFlowEdges((edges) => recomputePartnerHandles(nodes, edges));
    onArrangeDirtyChangeRef.current(true);
    onArrangePositionsChangeRef.current(nodesToPositions(nodes));
  }, []);

  if (layoutResult.error) {
    return (
      <div className="flex h-[650px] items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold text-red-800">
            {t("layoutFailedTitle")}
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {t("layoutFailedBody", {
              count: persons.length,
              error: layoutResult.error,
            })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={displayedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable={false}
        nodesDraggable={dragEnabled}
        nodeDragThreshold={5}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
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
        onNodesChange={handleNodesChange}
        onNodeDragStart={dragEnabled ? handleNodeDragStart : undefined}
        onNodeDrag={dragEnabled ? handleNodeDrag : undefined}
        onNodeDragStop={dragEnabled ? handleNodeDragStop : undefined}
        onNodeClick={(_event, node) => {
          if (node.type === "person") {
            onFocusPerson(node.id);
            return;
          }

          if (!cardsEditable || node.type !== "family") {
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
        onPaneClick={() => {
          onFocusPerson(undefined);
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
