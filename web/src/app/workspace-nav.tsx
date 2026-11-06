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
  const calendarHref = role === "gm" ? "/gm/calendar" : "/player/calendar";
  const timelineHref = role === "gm" ? "/gm/timeline" : "/player/timeline";
  const notesHref = "/player/notes";

  const navItems = [
    { href: dashboardHref, label: role === "gm" ? "Overview" : "My campaign" },
    { href: calendarHref, label: "Calendar" },
    { href: timelineHref, label: "Timeline" },
    { href: locationsHref, label: role === "gm" ? "Locations" : "Discoveries" },
    { href: npcsHref, label: role === "gm" ? "NPCs" : "Known people" },
    { href: housesHref, label: role === "gm" ? "Noble houses" : "Known houses" },
    { href: factionsHref, label: role === "gm" ? "Factions" : "Known factions" },
    { href: questsHref, label: role === "gm" ? "Quests" : "Campaign quests" },
    {
      href: role === "gm" ? "/gm/encounters" : "/player/encounters",
      label: "Encounters",
    },
    ...(role === "gm" ? [{ href: "/gm/notes", label: "Notes and journal" }] : []),
    { href: sessionsHref, label: role === "gm" ? "Session logs" : "Session history" },
    { href: charactersHref, label: role === "gm" ? "Player characters" : "My characters" },
    ...(role === "gm" ? [{ href: "/gm/import", label: "AI data import" }] : []),
    ...(role === "player"
      ? [{ href: "/player/journal", label: "Campaign journal" }]
      : []),
    { href: atlasHref, label: role === "gm" ? "Atlas" : "Explore atlas" },
    { href: mapsHref, label: role === "gm" ? "Map library" : "Shared maps" },
    ...(role === "player" ? [{ href: notesHref, label: "My notes" }] : []),
  ];

  return (
    <nav aria-label="Campaign navigation" className="workspace-nav">
      {navItems.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (href !== dashboardHref && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`nav-link${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
