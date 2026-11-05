import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import WorkspaceNav from "@/app/workspace-nav";

export const dynamic = "force-dynamic";

export default async function GmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await getCurrentCampaignMember();
  if (!member) {
    redirect("/access-pending");
  }
  if (member.role !== "gm") {
    redirect("/player");
  }

  return (
    <main className="campaign-shell">
      <aside className="campaign-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-mark">P</span>
          <div>
            <p className="eyebrow">Campaign ledger</p>
            <strong>Pathfinder</strong>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Workspace</p>
          <WorkspaceNav role="gm" />
        </div>

        <div className="sidebar-footer">
          <div className="user-pill">
            <span className="user-badge">GM</span>
            <span>Game Master</span>
          </div>
          <form action={signOut} className="sign-out">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="campaign-main">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">Game master workspace</p>
            <h1>The World Atlas</h1>
          </div>
          <div className="campaign-header-meta">
            <span className="header-pill">17th Day of Autumn, 4726 AR</span>
            <span className="header-pill">Current location: Tallowmere</span>
            <span className="header-pill">Role: Game Master</span>
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </div>
    </main>
  );
}
