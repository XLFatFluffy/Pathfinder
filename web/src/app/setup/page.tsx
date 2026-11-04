import { getSupabaseEnvironment } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const isConfigured = getSupabaseEnvironment() !== null;

  return (
    <main>
      <section className="card narrow">
        {isConfigured ? (
          <>
            <p className="eyebrow">Account setup</p>
            <h1>Connect your campaign accounts</h1>
            <p className="muted">
              Supabase is connected. Create accounts in the Supabase Dashboard
              under Authentication, then run the matching SQL in its SQL Editor
              to grant campaign access. Do not enable public sign-up; players
              must not be able to assign themselves a role.
            </p>
            <h2>Grant the GM account access</h2>
            <p className="muted">
              Create the GM account first, copy its user ID from Authentication
              → Users, and replace the placeholder below.
            </p>
            <pre>
              <code>{`insert into public.campaign_members (campaign_id, user_id, role)
values (
  '00000000-0000-4000-8000-000000000001',
  'REPLACE-WITH-GM-USER-UUID',
  'gm'
);`}</code>
            </pre>
            <h2>Grant each player access</h2>
            <p className="muted">
              Create each player account in Authentication → Users, then run
              this once per player with their user ID.
            </p>
            <pre>
              <code>{`insert into public.campaign_members (campaign_id, user_id, role)
values (
  '00000000-0000-4000-8000-000000000001',
  'REPLACE-WITH-PLAYER-USER-UUID',
  'player'
);`}</code>
            </pre>
            <p className="muted">
              Players can then sign in with the email and password set for
              their account. The same sign-in page opens the correct GM or
              player workspace for each role.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">One-time setup</p>
            <h1>Connect a Supabase project</h1>
            <p className="muted">
              The cloud workspace is not configured yet. Copy{" "}
              <code>web/.env.example</code> to <code>web/.env.local</code>, add
              the local Supabase URL and publishable key, then start the app
              again.
            </p>
            <p className="muted">
              No campaign data is stored in this cloud workspace until a
              Supabase project is configured.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
