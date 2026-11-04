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
              Supabase is connected. Create each account in the Supabase
              Dashboard under Authentication, then assign it a unique login ID
              and role in the SQL Editor. First apply the new checked-in
              migration to add the <code>login_id</code> column. Do not enable
              public sign-up.
            </p>
            <p className="muted">
              Supabase requires an email-shaped account identifier, but it does
              not need to be a real mailbox. Use a unique reserved placeholder
              such as <code>player-login-id@users.invalid</code> for each
              account, set a password for the GM, and mark the account as
              confirmed. These addresses cannot receive mail.
            </p>
            <p className="muted">
              Add the Supabase service-role key to Vercel as the server-only
              environment variable <code>SUPABASE_SERVICE_ROLE_KEY</code>. Never
              add it to a <code>NEXT_PUBLIC_</code> variable. Player IDs are
              identifiers, not secrets: anyone who knows one can sign in as
              that player and access their player-specific sheets and notes.
            </p>
            <h2>Grant the GM account access</h2>
            <p className="muted">
              Create the GM account using a placeholder such as
              <code> gm-login-id@users.invalid</code> and a password. Copy its
              user ID from Authentication → Users and choose a unique login ID.
              Login IDs must be 3–32 lowercase letters, numbers, dots,
              underscores, or hyphens. The GM must use both the login ID and
              password.
            </p>
            <pre>
              <code>{`insert into public.campaign_members (campaign_id, user_id, role, login_id)
values (
  '00000000-0000-4000-8000-000000000001',
  'REPLACE-WITH-GM-USER-UUID',
  'gm',
  'gm-login-id'
);`}</code>
            </pre>
            <h2>Grant each player access</h2>
            <p className="muted">
              Create each player account in Authentication → Users, then run
              this once per player with their user ID and unique login ID.
              Players do not use the account password when signing in.
            </p>
            <pre>
              <code>{`insert into public.campaign_members (campaign_id, user_id, role, login_id)
values (
  '00000000-0000-4000-8000-000000000001',
  'REPLACE-WITH-PLAYER-USER-UUID',
  'player',
  'player-login-id'
);`}</code>
            </pre>
            <p className="muted">
              Players enter only their login ID. The GM signs in with the GM
              login ID and account password. Keep the GM account limited to
              trusted administrators.
            </p>
            <p className="muted">
              If the GM forgets the password, an administrator must set a new
              one in Supabase Authentication → Users. Password recovery by
              email is not available for placeholder addresses.
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
