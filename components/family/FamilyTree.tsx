"use client";

import { useMemo, useState } from "react";
import PersonDetailsDialog from "@/components/dialogs/PersonDetailsDialog";
import EditPersonDialog from "@/components/dialogs/EditPersonDialog";
import EmptyTree from "@/components/family/EmptyTree";
import { calculateAge } from "@/lib/dates";
import {
  getPersonRelationNames,
  personHasChildren,
} from "@/lib/relationships";
import TreeView from "@/components/family/TreeView";
import AddPartnerDialog from "@/components/dialogs/AddPartnerDialog";
import AddChildDialog from "@/components/dialogs/AddChildDialog";
import AddParentDialog from "@/components/dialogs/AddParentDialog";
import AddSiblingDialog from "@/components/dialogs/AddSiblingDialog";
import DeletePersonDialog from "@/components/dialogs/DeletePersonDialog";

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

type Relationship = {
  id: string;
  family_id: string;
  person1_id: string;
  person2_id: string;
  relationship_type:
    | "father"
    | "mother"
    | "partner"
    | "sibling";
};

type Props = {
  familyId: string;
  familyName: string;
  personLimitLabel?: string | null;
  persons: Person[];
  relationships: Relationship[];
  canEdit: boolean;
  canAddPerson: boolean;
};

export default function FamilyTree({
  familyId,
  familyName,
  personLimitLabel,
  persons,
  relationships,
  canEdit,
  canAddPerson,
}: Props) {
  const [selectedPerson, setSelectedPerson] =
    useState<Person | null>(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

const [partnerOpen, setPartnerOpen] =
  useState(false);

const [parentsOpen, setParentsOpen] =
  useState(false);

const [siblingOpen, setSiblingOpen] =
  useState(false);

const [childOpen, setChildOpen] =
  useState(false);

const [childParentIds, setChildParentIds] =
  useState<string[]>([]);

const [deleteOpen, setDeleteOpen] =
  useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusedPersonId, setFocusedPersonId] = useState<string>();
  const [focusRequest, setFocusRequest] = useState(0);

  const selectedRelations = useMemo(() => {
    if (!selectedPerson) {
      return {
        fatherName: null as string | null,
        motherName: null as string | null,
        partnerNames: [] as string[],
        childNames: [] as string[],
      };
    }

    return getPersonRelationNames(
      selectedPerson.id,
      persons,
      relationships
    );
  }, [selectedPerson, persons, relationships]);

  const searchResults = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    if (!query) {
      return [];
    }

    return persons
      .filter((person) =>
        normalizeSearchText(
          `${person.first_name} ${person.last_name}`
        ).includes(query)
      )
      .slice(0, 8);
  }, [persons, searchQuery]);

  function focusPerson(person: Person) {
    setSearchQuery(`${person.first_name} ${person.last_name}`);
    setSearchOpen(false);
    setFocusedPersonId(person.id);
    setFocusRequest((request) => request + 1);
  }

  if (persons.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f3f4f6] p-6">
        <EmptyTree familyId={familyId} canEdit={canEdit} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f3f4f6]">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1
            className="truncate text-2xl font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-malbat), serif" }}
          >
            {familyName}
          </h1>
          {personLimitLabel && (
            <p className="text-sm text-gray-500">{personLimitLabel}</p>
          )}
        </div>

        <div className="relative w-full max-w-sm sm:w-80">
          <label htmlFor="person-search" className="sr-only">
            Person suchen
          </label>
          <input
            id="person-search"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setFocusedPersonId(undefined);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                event.preventDefault();
                focusPerson(searchResults[0]);
              }

              if (event.key === "Escape") {
                setSearchOpen(false);
              }
            }}
            placeholder="Person suchen..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-700 focus:outline-none"
          />

          {searchOpen && searchQuery.trim() && (
            <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-white py-2 shadow-lg">
              {searchResults.length > 0 ? (
                searchResults.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => focusPerson(person)}
                    className="block w-full px-4 py-3 text-left hover:bg-gray-100"
                  >
                    {person.first_name} {person.last_name}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Keine Person gefunden.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <TreeView
          persons={persons}
          relationships={relationships}
          canEdit={canEdit}
          focusPersonId={focusedPersonId}
          focusRequest={focusRequest}
          onOpenDetails={(person) => {
            setSelectedPerson(person);
            setDetailsOpen(true);
          }}
          onOpenRelationship={(person) => {
            setSelectedPerson(person);
            setPartnerOpen(true);
          }}
          onOpenParents={(person) => {
            setSelectedPerson(person);
            setParentsOpen(true);
          }}
          onOpenSiblings={(person) => {
            setSelectedPerson(person);
            setSiblingOpen(true);
          }}
          onAddChild={(parentIds) => {
            setChildParentIds(parentIds);
            setChildOpen(true);
          }}
        />
      </div>

      {selectedPerson && (
        <>
          <PersonDetailsDialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            onEdit={() => {
              setDetailsOpen(false);
              setEditOpen(true);
            }}
            onDelete={() => {
              setDetailsOpen(false);
              setDeleteOpen(true);
            }}
            canEdit={canEdit}
            firstName={selectedPerson.first_name}
            lastName={selectedPerson.last_name}
            gender={selectedPerson.gender}
            age={calculateAge(
              selectedPerson.birth_date,
              selectedPerson.death_date
            )}
            birthDate={selectedPerson.birth_date}
            birthPlace={selectedPerson.birth_place}
            isDeceased={selectedPerson.is_deceased}
            deathDate={selectedPerson.death_date}
            deathPlace={selectedPerson.death_place}
            notes={selectedPerson.notes}
            photoUrl={selectedPerson.photo_url}
            fatherName={selectedRelations.fatherName}
            motherName={selectedRelations.motherName}
            partnerNames={selectedRelations.partnerNames}
            childNames={selectedRelations.childNames}
          />

          <EditPersonDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            familyId={familyId}
            personId={selectedPerson.id}
            person={selectedPerson}
          />

          <DeletePersonDialog
            key={selectedPerson.id}
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            familyId={familyId}
            personId={selectedPerson.id}
            hasChildren={personHasChildren(
              selectedPerson.id,
              relationships
            )}
          />

          <AddPartnerDialog
            open={partnerOpen}
            onClose={() => setPartnerOpen(false)}
            familyId={familyId}
            relatedPersonId={selectedPerson.id}
            canCreateNew={canAddPerson}
            persons={persons.map((p) => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
            }))}
          />

          <AddParentDialog
            open={parentsOpen}
            onClose={() => setParentsOpen(false)}
            familyId={familyId}
            relatedPersonId={selectedPerson.id}
            canCreateNew={canAddPerson}
            persons={persons.map((p) => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
            }))}
          />

          <AddSiblingDialog
            open={siblingOpen}
            onClose={() => setSiblingOpen(false)}
            familyId={familyId}
            relatedPersonId={selectedPerson.id}
            canCreateNew={canAddPerson}
            persons={persons.map((p) => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
            }))}
          />
        </>
      )}

      <AddChildDialog
        open={childOpen}
        onClose={() => setChildOpen(false)}
        familyId={familyId}
        parentIds={childParentIds}
        canCreateNew={canAddPerson}
        persons={persons.map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
        }))}
      />
    </div>
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("de")
    .trim();
}