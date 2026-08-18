import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  addParentChild,
  addPartnership,
  deletePerson,
  removeParentChild,
  removePartnership,
  updatePerson,
} from "@/app/actions/people";
import { PersonForm } from "@/components/person-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [person, allPeople] = await Promise.all([
    prisma.person.findUnique({
      where: { id },
      include: {
        childOf: { include: { parent: true } },
        parentOf: { include: { child: true } },
        partnershipsAsA: { include: { personB: true } },
        partnershipsAsB: { include: { personA: true } },
      },
    }),
    prisma.person.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  if (!person) notFound();

  const partners = [
    ...person.partnershipsAsA.map((p) => ({ id: p.id, status: p.status, person: p.personB })),
    ...person.partnershipsAsB.map((p) => ({ id: p.id, status: p.status, person: p.personA })),
  ];

  const otherPeople = allPeople.filter((p) => p.id !== person.id);
  const personLabel = (p: { firstName: string; lastName: string }) =>
    `${p.firstName} ${p.lastName}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {person.firstName} {person.lastName}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonForm
            action={updatePerson.bind(null, person.id)}
            defaultValues={{
              firstName: person.firstName,
              lastName: person.lastName,
              gender: person.gender,
              dob: person.dob?.toISOString() ?? null,
              dateOfDeath: person.dateOfDeath?.toISOString() ?? null,
              city: person.city ?? "",
              bio: person.bio ?? "",
            }}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parents</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {person.childOf.length === 0 && (
            <p className="text-sm text-muted-foreground">No parents linked yet.</p>
          )}
          <ul className="flex flex-col gap-2">
            {person.childOf.map((edge) => (
              <li key={edge.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{personLabel(edge.parent)}</span>
                <form action={removeParentChild.bind(null, edge.id, person.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addParentChild} className="flex items-end gap-3">
            <input type="hidden" name="childId" value={person.id} />
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="parentId" className="text-sm font-medium">
                Add parent
              </label>
              <select
                id="parentId"
                name="parentId"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a person
                </option>
                {otherPeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Children</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {person.parentOf.length === 0 && (
            <p className="text-sm text-muted-foreground">No children linked yet.</p>
          )}
          <ul className="flex flex-col gap-2">
            {person.parentOf.map((edge) => (
              <li key={edge.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{personLabel(edge.child)}</span>
                <form action={removeParentChild.bind(null, edge.id, person.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addParentChild} className="flex items-end gap-3">
            <input type="hidden" name="parentId" value={person.id} />
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="childId" className="text-sm font-medium">
                Add child
              </label>
              <select
                id="childId"
                name="childId"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a person
                </option>
                {otherPeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spouses / partners</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {partners.length === 0 && (
            <p className="text-sm text-muted-foreground">No partners linked yet.</p>
          )}
          <ul className="flex flex-col gap-2">
            {partners.map((partner) => (
              <li key={partner.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">
                  {personLabel(partner.person)} <Badge variant="secondary">{partner.status}</Badge>
                </span>
                <form action={removePartnership.bind(null, partner.id, person.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Remove
                  </Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addPartnership} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="personAId" value={person.id} />
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="personBId" className="text-sm font-medium">
                Add partner
              </label>
              <select
                id="personBId"
                name="personBId"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a person
                </option>
                {otherPeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
                defaultValue="MARRIED"
              >
                <option value="MARRIED">Married</option>
                <option value="PARTNERED">Partnered</option>
                <option value="DIVORCED">Divorced</option>
              </select>
            </div>
            <Button type="submit" variant="outline">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deletePerson.bind(null, person.id)}>
            <Button type="submit" variant="destructive">
              Delete person
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
