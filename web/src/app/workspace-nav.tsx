"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceNavProps = {
  role: "gm" | "player";
};

export default function WorkspaceNav({ role }: WorkspaceNavProps) {
  const pathname = usePathname();
  const locationsHref = role === "gm" ? "/gm/locations" : "/player/locations";
  const mapsHref = role === "gm" ? "/gm/maps" : "/player/maps";
  const atlasHref = role === "gm" ? "/gm/atlas" : "/player/atlas";
  const npcsHref = role === "gm" ? "/gm/npcs" : "/player/npcs";
  const housesHref = role === "gm" ? "/gm/houses" : "/player/houses";
  const factionsHref = role === "gm" ? "/gm/factions" : "/player/factions";
  const questsHref = role === "gm" ? "/gm/quests" : "/player/quests";
  const sessionsHref = role === "gm" ? "/gm/sessions" : "/player/sessions";
  const charactersHref = role === "gm" ? "/gm/characters" : "/player/characters";
  const dashboardHref = role === "gm" ? "/gm" : "/player";
  const notesHref = "/player/notes";

  const navItems = [
    { href: dashboardHref, label: role === "gm" ? "Overview" : "My campaign" },
    { href: locationsHref, label: role === "gm" ? "Locations" : "Discoveries" },
    { href: npcsHref, label: role === "gm" ? "NPCs" : "Known people" },
    { href: housesHref, label: role === "gm" ? "Noble houses" : "Known houses" },
    { href: factionsHref, label: role === "gm" ? "Factions" : "Known factions" },
    { href: questsHref, label: role === "gm" ? "Quests" : "Campaign quests" },
    { href: sessionsHref, label: role === "gm" ? "Session logs" : "Session history" },
    { href: charactersHref, label: role === "gm" ? "Player characters" : "My characters" },
    ...(role === "gm" ? [{ href: "/gm/import", label: "AI data import" }] : []),
    { href: atlasHref, label: role === "gm" ? "Atlas" : "Explore atlas" },
    { href: mapsHref, label: role === "gm" ? "Map library" : "Shared maps" },
    ...(role === "player" ? [{ href: notesHref, label: "My notes" }] : []),
  ];

  return (
    <nav aria-label="Campaign navigation" className="workspace-nav">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`nav-link${pathname === href ? " is-active" : ""}`}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
