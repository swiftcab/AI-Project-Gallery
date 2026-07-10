import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** Healthcheck Docker/Uptime Kuma : DB + Redis, timeout court. */
export async function GET() {
  const timeout = <T>(p: Promise<T>, ms: number) =>
    Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

  const checks: Record<string, "ok" | "ko"> = { db: "ko", redis: "ko" };
  try {
    await timeout(prisma.$queryRaw`SELECT 1`, 2000);
    checks.db = "ok";
  } catch {
    /* ko */
  }
  try {
    await timeout(getRedis().ping(), 2000);
    checks.redis = "ok";
  } catch {
    /* ko */
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status: healthy ? 200 : 503 });
}
