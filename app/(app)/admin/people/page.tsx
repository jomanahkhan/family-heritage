import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPeoplePage() {
  const people = await prisma.person.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Family tree</h1>
          <p className="text-muted-foreground">
            Add people and manage parent/child and spouse relationships.
          </p>
        </div>
        <Button render={<Link href="/admin/people/new">Add person</Link>} />
      </div>

      <div className="flex flex-col gap-3">
        {people.length === 0 && (
          <p className="text-sm text-muted-foreground">No people added yet.</p>
        )}
        {people.map((person) => (
          <Link key={person.id} href={`/admin/people/${person.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {person.firstName} {person.lastName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {[
                      person.dob && `b. ${person.dob.toLocaleDateString()}`,
                      person.city,
                      person.user?.email && `linked to ${person.user.email}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No details yet"}
                  </span>
                </div>
                {person.dateOfDeath && <Badge variant="secondary">Deceased</Badge>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
