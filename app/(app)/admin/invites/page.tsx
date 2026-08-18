import { prisma } from "@/lib/prisma";
import { createInviteCode, revokeInviteCode } from "@/app/actions/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminInvitesPage() {
  const invites = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Invite codes</h1>
        <p className="text-muted-foreground">
          Generate a code and share it with a family member so they can register.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New invite code</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInviteCode} className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="maxUses">Max uses</Label>
              <Input
                id="maxUses"
                name="maxUses"
                type="number"
                min={1}
                max={50}
                defaultValue={1}
                className="w-24"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expiresInDays">Expires in (days, optional)</Label>
              <Input
                id="expiresInDays"
                name="expiresInDays"
                type="number"
                min={0}
                max={365}
                placeholder="never"
                className="w-36"
              />
            </div>
            <Button type="submit">Generate code</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {invites.length === 0 && (
          <p className="text-sm text-muted-foreground">No invite codes yet.</p>
        )}
        {invites.map((invite) => {
          const isExpired = invite.expiresAt ? invite.expiresAt < new Date() : false;
          const isExhausted = invite.usedCount >= invite.maxUses;
          const isActive = !invite.revoked && !isExpired && !isExhausted;

          return (
            <Card key={invite.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-lg tracking-wider">{invite.code}</span>
                  <span className="text-sm text-muted-foreground">
                    {invite.usedCount}/{invite.maxUses} used
                    {invite.expiresAt &&
                      ` · expires ${invite.expiresAt.toLocaleDateString()}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {invite.revoked
                      ? "Revoked"
                      : isExpired
                        ? "Expired"
                        : isExhausted
                          ? "Used up"
                          : "Active"}
                  </Badge>
                  {isActive && (
                    <form action={revokeInviteCode.bind(null, invite.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Revoke
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
