import Link from "next/link";

type WorkspaceNavProps = {
  role: "gm" | "player";
};

export default function WorkspaceNav({ role }: WorkspaceNavProps) {
  const locationsHref = role === "gm" ? "/gm/locations" : "/player/locations";
  const mapsHref = role === "gm" ? "/gm/maps" : "/player/maps";

  return (
    <nav aria-label="Campaign navigation" className="workspace-nav">
      <Link href={role === "gm" ? "/gm" : "/player"}>Overview</Link>
      <Link href={locationsHref}>Locations</Link>
      <Link href={mapsHref}>Map library</Link>
    </nav>
  );
}
