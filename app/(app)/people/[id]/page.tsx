import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(date: Date | null) {
  return date ? date.toLocaleDateString() : null;
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      childOf: { include: { parent: true } },
      parentOf: { include: { child: true } },
      partnershipsAsA: { include: { personB: true } },
      partnershipsAsB: { include: { personA: true } },
    },
  });

  if (!person) notFound();

  const partners = [
    ...person.partnershipsAsA.map((p) => ({ id: p.id, status: p.status, person: p.personB })),
    ...person.partnershipsAsB.map((p) => ({ id: p.id, status: p.status, person: p.personA })),
  ];
  const personLabel = (p: { firstName: string; lastName: string }) =>
    `${p.firstName} ${p.lastName}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            {person.firstName} {person.lastName}
          </h1>
          {person.dateOfDeath && <Badge variant="secondary">Deceased</Badge>}
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/tree?root=${person.id}`} className="underline">
            Center tree here
          </Link>
          {session.user.role === "ADMIN" && (
            <Link href={`/admin/people/${person.id}`} className="underline">
              Edit
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Born:</span>{" "}
            {formatDate(person.dob) ?? "Unknown"}
          </p>
          {person.dateOfDeath && (
            <p>
              <span className="text-muted-foreground">Died:</span>{" "}
              {formatDate(person.dateOfDeath)}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">City:</span> {person.city ?? "Unknown"}
          </p>
          {person.bio && <p className="whitespace-pre-wrap pt-2">{person.bio}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <p className="mb-1 font-medium">Parents</p>
            {person.childOf.length === 0 ? (
              <p className="text-muted-foreground">No parents linked.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {person.childOf.map((edge) => (
                  <li key={edge.id}>
                    <Link href={`/people/${edge.parent.id}`} className="underline">
                      {personLabel(edge.parent)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-1 font-medium">Children</p>
            {person.parentOf.length === 0 ? (
              <p className="text-muted-foreground">No children linked.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {person.parentOf.map((edge) => (
                  <li key={edge.id}>
                    <Link href={`/people/${edge.child.id}`} className="underline">
                      {personLabel(edge.child)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-1 font-medium">Spouses / partners</p>
            {partners.length === 0 ? (
              <p className="text-muted-foreground">No partners linked.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {partners.map((partner) => (
                  <li key={partner.id}>
                    <Link href={`/people/${partner.person.id}`} className="underline">
                      {personLabel(partner.person)}
                    </Link>{" "}
                    <Badge variant="secondary">{partner.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
