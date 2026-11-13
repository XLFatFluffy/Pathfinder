# Living World Engine — Actor Model

**Status:** Phase 1 core model
**Campaign start:** 1 Harvestfall, 243 AC

## Purpose

This document defines the canonical data model for an independent world actor. It turns the existing Actor Register into a structured record standard without inventing new actors, motives, resources, borders, or numerical capabilities.

The Actor Register remains the index of established actors. This document defines how those records are represented for world-state work.

## Actor identity

Every actor record should contain:

- Actor ID
- Name
- Type
- Canon status
- Source records
- Last reviewed

Supported actor types include Great House, Crown, minor house, faction, settlement, civic institution, religious institution, guild/company, community, individual NPC, and environmental/systemic actor where appropriate.

A Great House is not required to behave as a single mind. Its ruler, heirs, officers, vassals, household members, and institutional interests may diverge.

## Decision model

Represent each actor through:

- **Position:** current situation relative to interests, obligations, projects, conflicts, and relationships.
- **Objectives:** established goals or pressures.
- **Interests and red lines:** what the actor values, protects, avoids, or will not concede.
- **Resources:** qualitative unless the campaign establishes numerical values.
- **Constraints:** law, geography, distance, season, weather, supply, money, manpower, authority, competing obligations, relationships, and information limits.
- **Relationships:** specific and directional where useful.
- **Information state:** known facts, beliefs, suspicions, misinformation, rumors, and unknowns.
- **Projects:** sustained efforts with objective, state, dependencies, resources, blockers, and time scale.
- **Likely actions:** plausible actions tied to conditions, never predetermined outcomes.

## Evaluation

The World Engine evaluates:

**Objective → position → resources → information → relationships → constraints → opportunity → available action**

Resolution follows:

**Intent → capability → information → opportunity → opposition → constraint → outcome**

Possible outcomes are succeeds, partially succeeds, fails, delayed, redirected, creates an issue, resolves an issue, or remains unresolved.

## Canon boundary

Actor records must distinguish:

- ESTABLISHED
- APPROVED FRAMEWORK
- PROVISIONAL
- UNRESOLVED
- RUMOR
- GM-ONLY
- PLAYER-SHARED

A proposed motive is not an established motive. A possible action is not an event.

## Existing source records

This model operates over the existing Actor Register, Great House Actor Dossiers, Tallowmere Political Actor Dossiers, Regional Factions and Minor Houses, Continental Minor Houses and Regional Powers, Continental Project Register, and established civic, religious, guild, and settlement records.

Unknown values remain explicitly unknown rather than being filled with estimates.

## Minimum structured fields

A future machine-readable actor record should support:

id, name, type, status, leader, decision_process, objectives, interests, red_lines, resources, constraints, territory, jurisdiction, obligations, relationships, issues, projects, knowledge, beliefs, suspicions, likely_actions, visibility, sources, last_reviewed.
