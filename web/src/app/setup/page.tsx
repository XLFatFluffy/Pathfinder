export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">One-time setup</p>
        <h1>Connect a Supabase project</h1>
        <p className="muted">
          The cloud workspace is not configured yet. Copy{" "}
          <code>web/.env.example</code> to <code>web/.env.local</code>, add the
          local Supabase URL and publishable key, then start the app again.
        </p>
        <p className="muted">
          No campaign data is stored in this cloud workspace until a Supabase
          project is configured.
        </p>
      </section>
    </main>
  );
}
