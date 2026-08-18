"use client";

import { useRouter } from "next/navigation";
import type { Connector, ExtNode } from "relatives-tree/lib/types";

// relatives-tree lays nodes out on an abstract grid where one node occupies
// SIZE=2 units of width/height (confirmed by running calcTree on a sample
// tree: a root centered over two children sits at left=1, i.e. halfway
// between the children's left=0 and left=2). So 1 grid unit = half a cell.
const CELL_WIDTH = 180;
const CELL_HEIGHT = 130;
const BOX_WIDTH = 156;
const BOX_HEIGHT = 84;

function pxX(unit: number) {
  return (unit / 2) * CELL_WIDTH;
}
function pxY(unit: number) {
  return (unit / 2) * CELL_HEIGHT;
}

export type ChartPerson = {
  id: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  dob: string | null;
  dateOfDeath: string | null;
  city: string | null;
};

function yearOf(date: string | null) {
  return date ? new Date(date).getFullYear() : null;
}

export function FamilyTreeChart({
  nodes,
  connectors,
  canvas,
  people,
  focusedId,
}: {
  nodes: ExtNode[];
  connectors: Connector[];
  canvas: { width: number; height: number };
  people: Record<string, ChartPerson>;
  focusedId: string | null;
}) {
  const router = useRouter();
  const width = pxX(canvas.width);
  const height = pxY(canvas.height);

  return (
    <div className="w-full overflow-auto rounded-lg border">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-full"
      >
        <g>
          {connectors.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={pxX(x1)}
              y1={pxY(y1)}
              x2={pxX(x2)}
              y2={pxY(y2)}
              stroke="currentColor"
              strokeWidth={2}
              className="text-border"
            />
          ))}
        </g>
        <g>
          {nodes.map((node) => {
            const person = people[node.id];
            if (!person) return null;
            const x = pxX(node.left) + (CELL_WIDTH - BOX_WIDTH) / 2;
            const y = pxY(node.top) + (CELL_HEIGHT - BOX_HEIGHT) / 2;
            const isFocused = node.id === focusedId;
            const born = yearOf(person.dob);
            const died = yearOf(person.dateOfDeath);
            const years = born || died ? `${born ?? "?"}–${died ?? ""}` : null;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => router.push(`/people/${node.id}`)}
                className="cursor-pointer"
              >
                <rect
                  width={BOX_WIDTH}
                  height={BOX_HEIGHT}
                  rx={10}
                  className={
                    isFocused
                      ? "fill-primary/10 stroke-primary"
                      : "fill-card stroke-border hover:fill-muted"
                  }
                  strokeWidth={isFocused ? 2 : 1}
                />
                <text
                  x={BOX_WIDTH / 2}
                  y={BOX_HEIGHT / 2 - 6}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-medium"
                >
                  {person.firstName} {person.lastName}
                </text>
                {years && (
                  <text
                    x={BOX_WIDTH / 2}
                    y={BOX_HEIGHT / 2 + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    {years}
                  </text>
                )}
                {person.city && (
                  <text
                    x={BOX_WIDTH / 2}
                    y={BOX_HEIGHT / 2 + 30}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    {person.city}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
