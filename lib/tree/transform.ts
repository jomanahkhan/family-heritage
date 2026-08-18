import "server-only";
import type { Node } from "relatives-tree/lib/types";
import { prisma } from "@/lib/prisma";

export type TreePerson = {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  dob: Date | null;
  dateOfDeath: Date | null;
  city: string | null;
};

type PartnershipRow = {
  personAId: string;
  personBId: string;
  status: "MARRIED" | "PARTNERED" | "DIVORCED";
};

export type FamilyTreeData = {
  nodes: Node[];
  people: Record<string, TreePerson>;
  rootId: string | null;
};

// relatives-tree's Gender type has no neutral/unknown option (only
// "male" | "female"), so UNKNOWN people fall back to "male" for layout
// purposes only — this doesn't affect the gender shown on their profile.
function toGender(gender: TreePerson["gender"]): "male" | "female" {
  return gender === "FEMALE" ? "female" : "male";
}

export function buildFamilyTree(
  people: TreePerson[],
  parentChildEdges: { parentId: string; childId: string }[],
  partnerships: PartnershipRow[]
): FamilyTreeData {
  const parentsOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, Set<string>>();
  for (const p of people) {
    parentsOf.set(p.id, new Set());
    childrenOf.set(p.id, new Set());
  }
  for (const edge of parentChildEdges) {
    parentsOf.get(edge.childId)?.add(edge.parentId);
    childrenOf.get(edge.parentId)?.add(edge.childId);
  }

  const spousesOf = new Map<string, Map<string, PartnershipRow["status"]>>();
  for (const p of people) spousesOf.set(p.id, new Map());
  for (const partnership of partnerships) {
    spousesOf.get(partnership.personAId)?.set(partnership.personBId, partnership.status);
    spousesOf.get(partnership.personBId)?.set(partnership.personAId, partnership.status);
  }

  // relatives-tree requires siblings to be supplied explicitly rather than
  // deriving them itself, so we derive them here from shared parents.
  const nodes = people.map((person) => {
    const ownParents = parentsOf.get(person.id) ?? new Set<string>();

    const siblingIds = new Set<string>();
    for (const parentId of ownParents) {
      for (const childId of childrenOf.get(parentId) ?? []) {
        if (childId !== person.id) siblingIds.add(childId);
      }
    }

    return {
      id: person.id,
      gender: toGender(person.gender),
      parents: [...ownParents].map((id) => ({ id, type: "blood" })),
      children: [...(childrenOf.get(person.id) ?? [])].map((id) => ({ id, type: "blood" })),
      siblings: [...siblingIds].map((id) => {
        const otherParents = parentsOf.get(id) ?? new Set<string>();
        const fullSiblings =
          otherParents.size === ownParents.size &&
          [...ownParents].every((pid) => otherParents.has(pid));
        return { id, type: fullSiblings ? "blood" : "half" };
      }),
      spouses: [...(spousesOf.get(person.id) ?? new Map())].map(([id, status]) => ({
        id,
        type: status === "DIVORCED" ? "divorced" : "married",
      })),
    };
  });

  return {
    // relatives-tree's Gender/RelType fields are TS const enums with no
    // runtime export we can import under isolatedModules, so we build plain
    // string-literal objects matching their shape and cast at the boundary.
    nodes: nodes as unknown as Node[],
    people: Object.fromEntries(people.map((p) => [p.id, p])),
    rootId: pickDefaultRootId(people, parentsOf, childrenOf),
  };
}

function pickDefaultRootId(
  people: TreePerson[],
  parentsOf: Map<string, Set<string>>,
  childrenOf: Map<string, Set<string>>
): string | null {
  if (people.length === 0) return null;

  const countDescendants = (id: string, seen: Set<string>): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    let count = 0;
    for (const childId of childrenOf.get(id) ?? []) {
      count += 1 + countDescendants(childId, seen);
    }
    return count;
  };

  const roots = people.filter((p) => (parentsOf.get(p.id)?.size ?? 0) === 0);
  const candidates = roots.length > 0 ? roots : people;

  let best = candidates[0];
  let bestCount = -1;
  for (const person of candidates) {
    const count = countDescendants(person.id, new Set());
    if (count > bestCount) {
      best = person;
      bestCount = count;
    }
  }
  return best.id;
}

export async function loadFamilyTree(rootId?: string): Promise<FamilyTreeData> {
  const [people, parentChildEdges, partnerships] = await Promise.all([
    prisma.person.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        dob: true,
        dateOfDeath: true,
        city: true,
      },
    }),
    prisma.parentChild.findMany({ select: { parentId: true, childId: true } }),
    prisma.partnership.findMany({ select: { personAId: true, personBId: true, status: true } }),
  ]);

  const data = buildFamilyTree(people, parentChildEdges, partnerships);
  if (rootId && data.people[rootId]) {
    return { ...data, rootId };
  }
  return data;
}
