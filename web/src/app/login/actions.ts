"use server";

import { redirect } from "next/navigation";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LOGIN_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const INVALID_LOGIN_MESSAGE =
  "Login failed. Check your ID and, for the GM, password.";

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
  const loginId = formData.get("loginId");
  const password = formData.get("password");
  const nextPath = getSafeNextPath(formData.get("next"));

  if (
    typeof loginId !== "string" ||
    !LOGIN_ID_PATTERN.test(loginId.trim().toLowerCase()) ||
    (password !== null && typeof password !== "string")
  ) {
    redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
  }

  const normalizedLoginId = loginId.trim().toLowerCase();
  const admin = createSupabaseAdminClient();
  const { data: member, error: memberError } = await admin
    .from("campaign_members")
    .select("campaign_id, user_id, role")
    .eq("login_id", normalizedLoginId)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Unable to look up campaign login ID: ${memberError.message}`);
  }
  if (!member) {
    redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
  }

  const {
    data: { user },
    error: userError,
  } = await admin.auth.admin.getUserById(member.user_id);
  if (userError) {
    throw new Error(`Unable to load campaign login account: ${userError.message}`);
  }
  if (!user?.email) {
    throw new Error("Campaign login accounts must have an email address.");
  }

  const supabase = await createSupabaseServerClient();
  let signedInUserId: string | undefined;

  if (member.role === "gm") {
    if (typeof password !== "string" || !password) {
      redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (error || !data.user) {
      redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
    }
    signedInUserId = data.user.id;
  } else {
    if (typeof password === "string" && password) {
      redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
    }

    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
      });
    if (linkError) {
      throw new Error(`Unable to create player login session: ${linkError.message}`);
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: "magiclink",
    });
    if (error || !data.user) {
      throw new Error(
        `Unable to establish player login session: ${error?.message ?? "No user returned."}`,
      );
    }
    signedInUserId = data.user.id;
  }

  if (signedInUserId !== member.user_id) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Unable to clear mismatched login session: ${error.message}`);
    }
    redirect(`/login?error=${encodeURIComponent(INVALID_LOGIN_MESSAGE)}`);
  }

  const currentMember = await getCurrentCampaignMember();
  if (!currentMember) {
    redirect("/access-pending");
  }

  const homePath = currentMember.role === "gm" ? "/gm" : "/player";
  const rolePrefix = currentMember.role === "gm" ? "/gm/" : "/player/";
  redirect(
    nextPath === homePath || nextPath?.startsWith(rolePrefix)
      ? nextPath
      : homePath,
  );
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
