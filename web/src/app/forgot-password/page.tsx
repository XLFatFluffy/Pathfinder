import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main>
      <section className="card narrow">
        <p className="eyebrow">Account recovery</p>
        <h1>Email recovery is disabled</h1>
        <p className="muted">
          Campaign accounts use non-deliverable placeholder addresses. Ask
          your campaign administrator to set a new GM password in Supabase
          Authentication → Users.
        </p>
        <Link href="/login">Back to sign in</Link>
      </section>
    </main>
  );
}
