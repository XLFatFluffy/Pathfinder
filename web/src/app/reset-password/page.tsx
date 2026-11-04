import Link from "next/link";
import { updatePassword } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;

  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">Account recovery</p>
        <h1>Choose a new password</h1>
        <p className="muted">
          Use at least 8 characters. Your password is updated securely through
          Supabase.
        </p>
        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form action={updatePassword} className="form-stack">
          <label>
            New password
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label>
            Confirm new password
            <input
              autoComplete="new-password"
              minLength={8}
              name="confirmation"
              required
              type="password"
            />
          </label>
          <button type="submit">Update password</button>
        </form>
        <Link href="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
