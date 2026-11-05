import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { getCurrentCampaignMember } from "@/lib/campaign-member";
import WorkspaceNav from "@/app/workspace-nav";

export const dynamic = "force-dynamic";

export default async function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await getCurrentCampaignMember();
  if (!member) {
    redirect("/access-pending");
  }
  if (member.role !== "player") {
    redirect("/gm");
  }

  return (
    <main className="campaign-shell">
      <aside className="campaign-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-mark">P</span>
          <div>
            <p className="eyebrow">Field guide</p>
            <strong>Pathfinder</strong>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Campaign</p>
          <WorkspaceNav role="player" />
        </div>

        <div className="sidebar-footer">
          <div className="user-pill">
            <span className="user-badge">PC</span>
            <span>Player</span>
          </div>
          <form action={signOut} className="sign-out">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>

      <div className="campaign-main">
        <header className="campaign-header">
          <div>
            <p className="eyebrow">Player workspace</p>
            <h1>Your Campaign</h1>
          </div>
          <div className="campaign-header-meta">
            <span className="header-pill">17th Day of Autumn, 4726 AR</span>
            <span className="header-pill">Current location: Tallowmere</span>
            <span className="header-pill">Role: Player</span>
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </div>
    </main>
  );
}
