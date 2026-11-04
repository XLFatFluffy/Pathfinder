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
          The GM assigns each account a login ID. Players sign in with their ID;
          the GM also enters a password.
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
            Login ID
            <input
              autoComplete="username"
              name="loginId"
              required
              type="text"
            />
          </label>
          <label>
            GM password (players leave this blank)
            <input
              autoComplete="current-password"
              name="password"
              type="password"
            />
          </label>
          <button type="submit">Sign in</button>
        </form>
        <p className="muted">
          Login IDs are not passwords. Anyone who knows a player ID can sign in
          as that player and access that player&apos;s sheets and notes.
        </p>
        <p className="muted">
          GM password reset requires an administrator in Supabase; accounts do
          not use email.
        </p>
        <Link href="/setup">Setup instructions</Link>
      </section>
    </main>
  );
}
