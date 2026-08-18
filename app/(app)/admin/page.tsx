import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    href: "/admin/invites",
    title: "Invite codes",
    description: "Generate and revoke invite codes for new members.",
  },
  {
    href: "/admin/people",
    title: "Family tree",
    description: "Add people and manage parent/child and spouse relationships.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {s.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
