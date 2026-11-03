import Link from "next/link";

type WorkspaceNavProps = {
  role: "gm" | "player";
};

export default function WorkspaceNav({ role }: WorkspaceNavProps) {
  const locationsHref = role === "gm" ? "/gm/locations" : "/player/locations";

  return (
    <nav aria-label="Campaign navigation" className="workspace-nav">
      <Link href={role === "gm" ? "/gm" : "/player"}>Overview</Link>
      <Link href={locationsHref}>Locations</Link>
    </nav>
  );
}
