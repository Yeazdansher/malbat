"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFamilyEditor } from "@/lib/family-permissions";
import {
  isPersonLimitError,
  personLimitMessage,
} from "@/lib/plans";
import { normalizeRelationshipType, personHasChildren } from "@/lib/relationships";

async function requirePersonsInFamily(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  personIds: string[]
) {
  const uniqueIds = [...new Set(personIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("persons")
    .select("id")
    .eq("family_id", familyId)
    .in("id", uniqueIds);

  if (error || data?.length !== uniqueIds.length) {
    throw new Error("Mindestens eine Person gehört nicht zum Stammbaum.");
  }
}

export async function createPerson(
  familyId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const gender = formData.get("gender") as string;
  const birthDate = formData.get("birth_date") as string;
  const birthPlace = formData.get("birth_place") as string;
  const isDeceased = formData.get("is_deceased") === "on";
  const deathDate = formData.get("death_date") as string;
  const deathPlace = formData.get("death_place") as string;
  const notes = formData.get("notes") as string;

  const relatedPersonId = formData.get("related_person_id") as string;
  const relationshipType = formData.get("relationship_type") as string;
  const secondRelatedPersonId = formData.get(
    "second_related_person_id"
  ) as string;

  await requirePersonsInFamily(supabase, familyId, [
    relatedPersonId,
    secondRelatedPersonId,
  ]);

  let normalizedRelationshipType = relationshipType;

if (relatedPersonId) {
  const { data: relatedPerson } = await supabase
    .from("persons")
    .select("gender")
    .eq("id", relatedPersonId)
    .single();

  normalizedRelationshipType =
    normalizeRelationshipType(
      relationshipType,
      relatedPerson?.gender ?? "unknown"
    );
}

  const { data: newPerson, error } = await supabase
    .from("persons")
    .insert({
      family_id: familyId,
      first_name: firstName,
      last_name: lastName,
      gender,
      birth_date: birthDate || null,
      birth_place: birthPlace || null,
      is_deceased: isDeceased,
      death_date: deathDate || null,
      death_place: deathPlace || null,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error) {
    if (isPersonLimitError(error)) {
      redirect(`/family/${familyId}?error=person-limit`);
    }

    throw new Error(error.message);
  }

  // Nur wenn die Person über "Beziehung hinzufügen"
  // erstellt wurde, wird auch eine Beziehung angelegt.
  if (relatedPersonId && relationshipType) {
    let from = relatedPersonId;
    let to = newPerson.id;

    if (
      relationshipType === "father" ||
      relationshipType === "mother"
    ) {
      from = newPerson.id;
      to = relatedPersonId;
    }

    const { error: relationshipError } = await supabase
      .from("relationships")
      .insert({
        family_id: familyId,
        person1_id: from,
        person2_id: to,
        relationship_type: normalizedRelationshipType,
      });

    if (relationshipError) {
      throw new Error(relationshipError.message);
    }

    if (
      relationshipType === "sibling" ||
      relationshipType === "brother" ||
      relationshipType === "sister"
    ) {
      await copyParentRelationships(
        supabase,
        familyId,
        relatedPersonId,
        newPerson.id
      );
    }
  }

  if (secondRelatedPersonId) {
    const { data: secondParent } = await supabase
      .from("persons")
      .select("gender")
      .eq("id", secondRelatedPersonId)
      .single();

    const secondRelationshipType = normalizeRelationshipType(
      "son",
      secondParent?.gender ?? "unknown"
    );

    const { error: secondRelationshipError } = await supabase
      .from("relationships")
      .insert({
        family_id: familyId,
        person1_id: secondRelatedPersonId,
        person2_id: newPerson.id,
        relationship_type: secondRelationshipType,
      });

    if (secondRelationshipError) {
      throw new Error(secondRelationshipError.message);
    }
  }

  revalidatePath(`/family/${familyId}`);

  redirect(`/family/${familyId}`);
}

export async function updatePerson(
  familyId: string,
  personId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [personId]);

  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const gender = formData.get("gender") as string;
  const birthDate = formData.get("birth_date") as string;
  const birthPlace = formData.get("birth_place") as string;
  const isDeceased = formData.get("is_deceased") === "on";
  const deathDate = formData.get("death_date") as string;
  const deathPlace = formData.get("death_place") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase
    .from("persons")
    .update({
      first_name: firstName,
      last_name: lastName,
      gender,
      birth_date: birthDate || null,
      birth_place: birthPlace || null,
      is_deceased: isDeceased,
      death_date: deathDate || null,
      death_place: deathPlace || null,
      notes: notes || null,
    })
    .eq("id", personId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/family/${familyId}`);

  redirect(`/family/${familyId}`);
}
export async function createRelationship(
  familyId: string,
  person1Id: string,
  person2Id: string,
  relationshipType: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [
    person1Id,
    person2Id,
  ]);

  const { data: person1 } = await supabase
    .from("persons")
    .select("gender")
    .eq("id", person1Id)
    .single();

  const normalizedRelationshipType =
    normalizeRelationshipType(
      relationshipType,
      person1?.gender ?? "unknown"
    );

  let from = person1Id;
  let to = person2Id;

  if (
    normalizedRelationshipType === "father" ||
    normalizedRelationshipType === "mother"
  ) {
    from = person2Id;
    to = person1Id;
  }

  const { error } = await supabase
    .from("relationships")
    .insert({
      family_id: familyId,
      person1_id: from,
      person2_id: to,
      relationship_type: normalizedRelationshipType,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/family/${familyId}`);
}

type ParentDraft = {
  mode: "new" | "existing";
  personId: string;
  firstName: string;
  lastName: string;
};

export async function createParentsForChild(
  familyId: string,
  childId: string,
  father: ParentDraft,
  mother: ParentDraft
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  const role = await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [
    childId,
    father.mode === "existing" ? father.personId : "",
    mother.mode === "existing" ? mother.personId : "",
  ]);

  if (
    (father.mode === "existing" &&
      (!father.personId || father.personId === childId)) ||
    (mother.mode === "existing" &&
      (!mother.personId || mother.personId === childId))
  ) {
    throw new Error("Bitte beide Elternteile auswählen.");
  }

  if (
    (father.mode === "new" &&
      (!father.firstName.trim() || !father.lastName.trim())) ||
    (mother.mode === "new" &&
      (!mother.firstName.trim() || !mother.lastName.trim()))
  ) {
    throw new Error(
      "Bitte Vor- und Nachname für Vater und Mutter angeben."
    );
  }

  if (
    father.mode === "existing" &&
    mother.mode === "existing" &&
    father.personId === mother.personId
  ) {
    throw new Error(
      "Vater und Mutter müssen zwei verschiedene Personen sein."
    );
  }

  const { error } = await supabase.rpc(
    "create_parents_for_child_atomic",
    {
      p_family_id: familyId,
      p_child_id: childId,
      p_father_id:
        father.mode === "existing" ? father.personId : null,
      p_father_first_name:
        father.mode === "new" ? father.firstName.trim() : "",
      p_father_last_name:
        father.mode === "new" ? father.lastName.trim() : "",
      p_mother_id:
        mother.mode === "existing" ? mother.personId : null,
      p_mother_first_name:
        mother.mode === "new" ? mother.firstName.trim() : "",
      p_mother_last_name:
        mother.mode === "new" ? mother.lastName.trim() : "",
    }
  );

  if (error) {
    if (isPersonLimitError(error)) {
      throw new Error(personLimitMessage(role));
    }

    if (error.message.includes("PARENTS_MUST_DIFFER")) {
      throw new Error(
        "Vater und Mutter müssen zwei verschiedene Personen sein."
      );
    }

    console.error("createParentsForChild:", error);
    throw new Error("Die Eltern konnten nicht gespeichert werden.");
  }

  revalidatePath(`/family/${familyId}`);
}

export async function addChildToParents(
  familyId: string,
  childId: string,
  parentIds: string[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [
    childId,
    ...parentIds,
  ]);

  for (const parentId of parentIds) {
    if (!parentId || parentId === childId) {
      continue;
    }

    const { data: parent } = await supabase
      .from("persons")
      .select("gender")
      .eq("id", parentId)
      .single();

    const relationshipType = normalizeRelationshipType(
      "son",
      parent?.gender ?? "unknown"
    );

    const { error } = await supabase.from("relationships").insert({
      family_id: familyId,
      person1_id: parentId,
      person2_id: childId,
      relationship_type: relationshipType,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/family/${familyId}`);
}

async function copyParentRelationships(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  fromChildId: string,
  toChildId: string
) {
  const { data: parentRelations, error } = await supabase
    .from("relationships")
    .select("person1_id, relationship_type")
    .eq("family_id", familyId)
    .eq("person2_id", fromChildId)
    .in("relationship_type", ["father", "mother"]);

  if (error) {
    throw new Error(error.message);
  }

  for (const relation of parentRelations ?? []) {
    const { error: insertError } = await supabase
      .from("relationships")
      .insert({
        family_id: familyId,
        person1_id: relation.person1_id,
        person2_id: toChildId,
        relationship_type: relation.relationship_type,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function addSiblingToPerson(
  familyId: string,
  personId: string,
  siblingId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [
    personId,
    siblingId,
  ]);

  const { error } = await supabase.from("relationships").insert({
    family_id: familyId,
    person1_id: personId,
    person2_id: siblingId,
    relationship_type: "sibling",
  });

  if (error) {
    throw new Error(error.message);
  }

  await copyParentRelationships(
    supabase,
    familyId,
    personId,
    siblingId
  );

  revalidatePath(`/family/${familyId}`);
}

export async function deletePerson(
  familyId: string,
  personId: string
): Promise<{ ok: true } | { ok: false; reason: "has_children" }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet.");
  }

  await requireFamilyEditor(supabase, familyId);
  await requirePersonsInFamily(supabase, familyId, [personId]);

  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("id")
    .eq("id", personId)
    .eq("family_id", familyId)
    .single();

  if (personError || !person) {
    throw new Error("Person nicht gefunden.");
  }

  const { data: familyRelationships, error: childrenError } =
    await supabase
      .from("relationships")
      .select("person1_id, person2_id, relationship_type")
      .eq("family_id", familyId);

  if (childrenError || familyRelationships === null) {
    throw new Error(
      childrenError?.message ?? "Kinder konnten nicht geprüft werden."
    );
  }

  if (personHasChildren(personId, familyRelationships)) {
    return { ok: false, reason: "has_children" };
  }

  const { error: asPerson1Error } = await supabase
    .from("relationships")
    .delete()
    .eq("family_id", familyId)
    .eq("person1_id", personId);

  if (asPerson1Error) {
    throw new Error(asPerson1Error.message);
  }

  const { error: asPerson2Error } = await supabase
    .from("relationships")
    .delete()
    .eq("family_id", familyId)
    .eq("person2_id", personId);

  if (asPerson2Error) {
    throw new Error(asPerson2Error.message);
  }

  const { error: deleteError } = await supabase
    .from("persons")
    .delete()
    .eq("id", personId)
    .eq("family_id", familyId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath(`/family/${familyId}`);
  return { ok: true };
}

const UNEXPECTED_DELETE_ERROR =
  "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";

function unexpectedDeleteError(
  context: string,
  error: { message?: string } | unknown
): { ok: false; error: string } {
  console.error(`deleteFamilyTree (${context}):`, error);
  return { ok: false, error: UNEXPECTED_DELETE_ERROR };
}

async function deleteFamilyStorageFiles(
  client: Awaited<ReturnType<typeof createClient>>,
  familyId: string
) {
  const buckets = [
    "family-files",
    "family-documents",
    "family-images",
    "documents",
    "images",
    "families",
  ];

  for (const bucket of buckets) {
    const { data: files, error } = await client.storage
      .from(bucket)
      .list(familyId);

    if (error || !files || files.length === 0) {
      continue;
    }

    const paths = files.map((file) => `${familyId}/${file.name}`);
    await client.storage.from(bucket).remove(paths);
  }
}

export async function deleteFamilyTree(
  familyId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nicht angemeldet." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return unexpectedDeleteError("membership", membershipError);
  }

  if (!membership || membership.role !== "owner") {
    return {
      ok: false,
      error: "Nur der Besitzer darf diesen Stammbaum löschen.",
    };
  }

  if (!password.trim()) {
    return {
      ok: false,
      error: "Das eingegebene Passwort ist nicht korrekt.",
    };
  }

  if (!user.email) {
    return {
      ok: false,
      error: "Das eingegebene Passwort ist nicht korrekt.",
    };
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (passwordError) {
    return {
      ok: false,
      error: "Das eingegebene Passwort ist nicht korrekt.",
    };
  }

  try {
    const { error: rpcError } = await supabase.rpc("delete_complete_family", {
      p_family_id: familyId,
    });

    if (rpcError) {
      return unexpectedDeleteError("rpc", rpcError);
    }

    await deleteFamilyStorageFiles(supabase, familyId);
  } catch (error) {
    return unexpectedDeleteError("unexpected", error);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/family/${familyId}`);
  return { ok: true };
}