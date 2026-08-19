import { readdirSync, existsSync } from "fs";
import { NextResponse } from "next/server";

function safeList(dir: string) {
  try {
    return existsSync(dir) ? readdirSync(dir) : "MISSING";
  } catch (e) {
    return `ERROR: ${(e as Error).message}`;
  }
}

export async function GET() {
  const candidates = [
    "/var/task/app/generated/prisma",
    "/var/task/app/generated",
    process.cwd() + "/app/generated/prisma",
    process.cwd(),
  ];
  const result: Record<string, unknown> = {};
  for (const c of candidates) {
    result[c] = safeList(c);
  }
  return NextResponse.json(result);
}
