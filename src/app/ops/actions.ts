"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createPilotAccount } from "@/lib/ops/createAccount";

/**
 * Server Action derrière /ops (Basic Auth via middleware) — même logique
 * que POST /api/ops/accounts, sans exposer OPS_API_TOKEN au navigateur.
 */
export async function createAccountAction(formData: FormData): Promise<{ error?: string; activationCode?: string }> {
  const departments = String(formData.get("departments") ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  try {
    const account = await createPilotAccount(prisma, {
      companyName: formData.get("companyName"),
      trade: formData.get("trade"),
      ownerFirstName: formData.get("ownerFirstName"),
      ownerMobile: formData.get("ownerMobile"),
      voiceNumber: formData.get("voiceNumber"),
      smsNumber: formData.get("smsNumber"),
      email: formData.get("email"),
      departments,
    });
    revalidatePath("/ops");
    return { activationCode: `*61*${account.phoneLine?.voiceNumber}#` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
