import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default function AccessPendingPage() {
  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">Campaign access</p>
        <h1>Waiting for GM approval</h1>
        <p className="muted">
          Your account is signed in, but it has not been assigned a campaign
          role. Ask the GM to grant access.
        </p>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </section>
    </main>
  );
}
