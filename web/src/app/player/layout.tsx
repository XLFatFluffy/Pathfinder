import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { getCurrentCampaignMember } from "@/lib/campaign-member";

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
    <main>
      <header className="card">
        <p className="eyebrow">Player workspace</p>
        <h1>The World Atlas</h1>
        {children}
        <form action={signOut} className="sign-out">
          <button type="submit">Sign out</button>
        </form>
      </header>
    </main>
  );
}
