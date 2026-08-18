"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function PostForm({
  action,
}: {
  action: (formData: FormData) => Promise<{ error: string | null } | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"ANNOUNCEMENT" | "EVENT_INVITE" | "ACHIEVEMENT">(
    "ANNOUNCEMENT"
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) setError(result.error);
        });
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className={selectClassName}
        >
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="EVENT_INVITE">Event invite</option>
          <option value="ACHIEVEMENT">Achievement</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>

      {type === "EVENT_INVITE" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="eventDate">Event date</Label>
            <Input id="eventDate" name="eventDate" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="eventLocation">Location</Label>
            <Input id="eventLocation" name="eventLocation" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Details</Label>
        <Textarea id="body" name="body" rows={5} required />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
