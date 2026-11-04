import Link from "next/link";
import { requestPasswordReset } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
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
        <h1>Reset your password</h1>
        <p className="muted">
          GM account recovery: enter the GM account email and we will send a
          password reset link if the account exists.
        </p>
        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form action={requestPasswordReset} className="form-stack">
          <label>
            Email
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <button type="submit">Send reset link</button>
        </form>
        <Link href="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
