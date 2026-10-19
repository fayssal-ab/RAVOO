import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminSession, verifyAdminSession } from "./adminSession";
import { logAudit } from "./audit";
import { AppError } from "./tx";

// Signed, expiring admin sessions. Rotating ADMIN_PASSWORD invalidates them.
export const ADMIN_COOKIE_NAME = "ravo_admin";
const ONE_WEEK = 60 * 60 * 24 * 7;

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Validate a /login submission against the env credentials (timing-safe). */
export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedPass) return false;
  // Evaluate both so timing doesn't reveal which half was wrong.
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

export function adminCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  return {
    name: ADMIN_COOKIE_NAME,
    value: createAdminSession(password),
    options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: ONE_WEEK },
  };
}

export async function isAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    return verifyAdminSession(token, process.env.ADMIN_PASSWORD ?? "");
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSession())) redirect("/login");
}

// Wrapper for admin Server Actions. Every action is its own POST entry point,
// so the session is checked here, not only by the /admin layout. Business
// errors come back as ?error=<code>&detail=…, shown by <Flash>.
export async function adminAction(
  opts: { path: string; audit: string; target?: string | number; revalidate?: string[]; ok?: string },
  fn: () => Promise<unknown>
): Promise<never> {
  await requireAdmin();
  let query: string;
  try {
    const result = await fn();
    await logAudit("admin", opts.audit, opts.target != null ? String(opts.target) : "", result ?? undefined);
    query = `ok=${encodeURIComponent(opts.ok ?? opts.audit)}`;
  } catch (err) {
    if (err instanceof AppError) {
      query = `error=${encodeURIComponent(err.code)}${err.detail ? `&detail=${encodeURIComponent(err.detail.slice(0, 300))}` : ""}`;
    } else {
      console.error(`admin action ${opts.audit} failed`, err instanceof Error ? err.message : "unknown");
      query = "error=unexpected";
    }
  }
  for (const p of [opts.path, ...(opts.revalidate ?? [])]) revalidatePath(p);
  const sep = opts.path.includes("?") ? "&" : "?";
  redirect(`${opts.path}${sep}${query}`);
}
