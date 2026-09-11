"use client";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import PersonCard from "@/components/PersonCard";
import { calculateAge } from "@/lib/dates";

type PersonNodeData = {
  person: {
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

  onOpenDetails: () => void;
  onOpenRelationship: () => void;
  onOpenParents: () => void;
  onOpenSiblings: () => void;
  hasParents: boolean;
  searchHighlighted?: boolean;
  canEdit: boolean;
};

/**
 * Darstellung einer Person innerhalb der
 * neuen Malbat Tree Engine.
 *
 * Die Position wird ausschließlich durch
 * die Layout-Engine bestimmt.
 */
export default function PersonNode({
  data,
}: NodeProps) {
  const personData = data as PersonNodeData;
  const { person } = personData;

  return (
    <>
      <Handle
        id="parent"
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <Handle
        id="child"
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <Handle
        id="partner-left"
        type="source"
        position={Position.Left}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <Handle
        id="partner-right"
        type="source"
        position={Position.Right}
        isConnectable={false}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <div
        className={
          personData.searchHighlighted
            ? "rounded-2xl ring-4 ring-green-500 ring-offset-4"
            : ""
        }
      >
        <PersonCard
          firstName={person.first_name}
          lastName={person.last_name}
          gender={person.gender}
          age={
            calculateAge(
              person.birth_date,
              person.death_date
            ) ?? 0
          }
          isDeceased={person.is_deceased}
          hasParents={personData.hasParents}
          canEdit={personData.canEdit}
          onOpenDetails={personData.onOpenDetails}
          onOpenRelationship={
            personData.onOpenRelationship
          }
          onOpenParents={personData.onOpenParents}
          onOpenSiblings={personData.onOpenSiblings}
        />
      </div>
    </>
  );
}