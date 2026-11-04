import Link from "next/link";
import { signIn } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
    next?: string | string[];
  }>;
}) {
  const { error, message, next } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;
  const statusMessage = typeof message === "string" ? message : null;

  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">The World Atlas</p>
        <h1>Sign in</h1>
        <p className="muted">
          Accounts are created and assigned to this campaign by the GM.
        </p>
        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="notice" role="status">
            {statusMessage}
          </p>
        ) : null}
        <form action={signIn} className="form-stack">
          {typeof next === "string" ? (
            <input name="next" type="hidden" value={next} />
          ) : null}
          <label>
            Email
            <input
              autoComplete="email"
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <p className="muted">
          Need help? Ask the campaign GM to set up your account.
        </p>
        <p>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <Link href="/setup">Setup instructions</Link>
      </section>
    </main>
  );
}
