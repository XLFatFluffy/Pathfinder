import Link from "next/link";
import { signIn } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">The World Atlas</p>
        <h1>Sign in</h1>
        <p className="muted">
          Accounts are created and assigned to this campaign by the GM.
        </p>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <form action={signIn} className="form-stack">
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
        <Link href="/setup">Setup instructions</Link>
      </section>
    </main>
  );
}
