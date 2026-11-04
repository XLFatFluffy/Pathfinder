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

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Unable to sign out: ${error.message}`);
  }
  redirect("/login");
}
