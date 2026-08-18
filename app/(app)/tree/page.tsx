import calcTree from "relatives-tree";
import Link from "next/link";
import { loadFamilyTree } from "@/lib/tree/transform";
import { FamilyTreeChart, type ChartPerson } from "@/components/family-tree-chart";

export default async function TreePage({
  searchParams,
}: {
  searchParams: Promise<{ root?: string }>;
}) {
  const { root } = await searchParams;
  const { nodes, people, rootId } = await loadFamilyTree(root);

  if (!rootId) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Family tree</h1>
        <p className="text-muted-foreground">
          No one has been added to the tree yet.{" "}
          <Link href="/admin/people" className="underline">
            Add people
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  const relData = calcTree(nodes, { rootId });
  const chartPeople: Record<string, ChartPerson> = Object.fromEntries(
    Object.entries(people).map(([id, p]) => [
      id,
      {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        dob: p.dob ? p.dob.toISOString() : null,
        dateOfDeath: p.dateOfDeath ? p.dateOfDeath.toISOString() : null,
        city: p.city,
      },
    ])
  );

  const sortedPeople = Object.values(people).sort((a, b) =>
    `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Family tree</h1>
          <p className="text-muted-foreground">Click on a person to see their profile.</p>
        </div>
        <form className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="root" className="text-sm font-medium">
              Center on
            </label>
            <select
              id="root"
              name="root"
              defaultValue={rootId}
              className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none dark:bg-input/30"
            >
              {sortedPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="flex h-8 items-center rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted"
          >
            Go
          </button>
        </form>
      </div>

      <FamilyTreeChart
        nodes={[...relData.nodes]}
        connectors={[...relData.connectors]}
        canvas={relData.canvas}
        people={chartPeople}
        focusedId={rootId}
      />
    </div>
  );
}
