import Link from "next/link";

type WorkspaceNavProps = {
  role: "gm" | "player";
};

export default function WorkspaceNav({ role }: WorkspaceNavProps) {
  const locationsHref = role === "gm" ? "/gm/locations" : "/player/locations";
  const mapsHref = role === "gm" ? "/gm/maps" : "/player/maps";
  const atlasHref = role === "gm" ? "/gm/atlas" : "/player/atlas";
  const npcsHref = role === "gm" ? "/gm/npcs" : "/player/npcs";
  const housesHref = role === "gm" ? "/gm/houses" : "/player/houses";
  const factionsHref = role === "gm" ? "/gm/factions" : "/player/factions";
  const questsHref = role === "gm" ? "/gm/quests" : "/player/quests";
  const sessionsHref = role === "gm" ? "/gm/sessions" : "/player/sessions";

  return (
    <nav aria-label="Campaign navigation" className="workspace-nav">
      <Link href={role === "gm" ? "/gm" : "/player"}>
        {role === "gm" ? "Overview" : "My campaign"}
      </Link>
      <Link href={locationsHref}>{role === "gm" ? "Locations" : "Discoveries"}</Link>
      <Link href={npcsHref}>{role === "gm" ? "NPCs" : "Known people"}</Link>
      <Link href={housesHref}>{role === "gm" ? "Noble houses" : "Known houses"}</Link>
      <Link href={factionsHref}>{role === "gm" ? "Factions" : "Known factions"}</Link>
      <Link href={questsHref}>{role === "gm" ? "Quests" : "Campaign quests"}</Link>
      <Link href={sessionsHref}>{role === "gm" ? "Session logs" : "Session history"}</Link>
      <Link href={atlasHref}>{role === "gm" ? "Atlas" : "Explore atlas"}</Link>
      <Link href={mapsHref}>{role === "gm" ? "Map library" : "Shared maps"}</Link>
      {role === "player" ? <Link href="/player/notes">My notes</Link> : null}
    </nav>
  );
}
