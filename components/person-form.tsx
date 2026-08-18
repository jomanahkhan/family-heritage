"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PersonFormDefaults = {
  firstName?: string;
  lastName?: string;
  gender?: "MALE" | "FEMALE" | "UNKNOWN";
  dob?: string | null;
  dateOfDeath?: string | null;
  city?: string;
  bio?: string;
};

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function toDateInputValue(date: string | null | undefined) {
  return date ? date.slice(0, 10) : "";
}

export function PersonForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error: string | null } | void>;
  defaultValues?: PersonFormDefaults;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={defaultValues?.firstName}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required defaultValue={defaultValues?.lastName} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={defaultValues?.gender ?? "UNKNOWN"}
            className={selectClassName}
          >
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            name="dob"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.dob)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateOfDeath">Date of death</Label>
          <Input
            id="dateOfDeath"
            name="dateOfDeath"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.dateOfDeath)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={defaultValues?.city} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={3} defaultValue={defaultValues?.bio} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
