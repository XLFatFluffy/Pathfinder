"use server";

import { redirect } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: FormDataEntryValue | null): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  const url = new URL(value, "https://pathfinder.invalid");
  if (url.origin !== "https://pathfinder.invalid") {
    return null;
  }

  return `${url.pathname}${url.search}`;
}

export async function signIn(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const nextPath = getSafeNextPath(formData.get("next"));

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    redirect("/login?error=Enter%20your%20email%20and%20password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const member = await getCurrentCampaignMember();
  if (!member) {
    redirect("/access-pending");
  }

  const homePath = member.role === "gm" ? "/gm" : "/player";
  const rolePrefix = member.role === "gm" ? "/gm/" : "/player/";
  redirect(
    nextPath === homePath || nextPath?.startsWith(rolePrefix)
      ? nextPath
      : homePath,
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string" || !email.trim()) {
    redirect("/forgot-password?error=Enter%20your%20email%20address.");
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : undefined);
  if (!siteUrl) {
    redirect(
      "/forgot-password?error=Password%20recovery%20is%20not%20configured%20for%20this%20app.",
    );
  }

  let appUrl: URL;
  try {
    appUrl = new URL(siteUrl);
  } catch {
    redirect(
      "/forgot-password?error=Password%20recovery%20is%20not%20configured%20for%20this%20app.",
    );
  }
  if (
    !["http:", "https:"].includes(appUrl.protocol) ||
    appUrl.username ||
    appUrl.password ||
    appUrl.pathname !== "/" ||
    appUrl.search ||
    appUrl.hash
  ) {
    redirect(
      "/forgot-password?error=Password%20recovery%20is%20not%20configured%20for%20this%20app.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: new URL(
      "/auth/callback?next=/reset-password",
      appUrl.origin,
    ).toString(),
  });
  if (error) {
    redirect(
      "/forgot-password?error=Unable%20to%20send%20a%20password%20reset%20email.%20Try%20again%20later.",
    );
  }

  redirect("/login?message=If%20that%20account%20exists%2C%20a%20reset%20link%20has%20been%20sent.");
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const confirmation = formData.get("confirmation");

  if (typeof password !== "string" || password.length < 8) {
    redirect("/reset-password?error=Password%20must%20be%20at%20least%208%20characters.");
  }
  if (password !== confirmation) {
    redirect("/reset-password?error=Passwords%20do%20not%20match.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(
      "/reset-password?error=Unable%20to%20update%20the%20password.%20The%20reset%20link%20may%20have%20expired.",
    );
  }

  const member = await getCurrentCampaignMember();
  if (!member) {
    redirect("/access-pending");
  }

  redirect(member.role === "gm" ? "/gm" : "/player");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Unable to sign out: ${error.message}`);
  }
  redirect("/login");
}
