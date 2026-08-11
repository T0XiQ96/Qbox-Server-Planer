# MODELS — welches Modell für welche Aufgabe

Wird bei jedem Session-Start gelesen (siehe CLAUDE.md, Abschnitt 0).

## Regel

| Aufgabe | Modell | Effort |
|---|---|---|
| Architektur, Schema, App-Code in `src/`, Build-/Validator-Scripts, Refactoring | `claude-opus-5` | high · bei Architekturentscheidungen xhigh |
| Recherche-Runden, Katalogdaten in `data/`, Link-Checks, Datenkorrekturen | `claude-sonnet-5` | medium · bei vielen Kompatibilitätsurteilen high |
| Umbenennen, Formatieren, Doku-Kleinkram | `claude-sonnet-5` | low |

**Faustregel: `src/` wird angefasst → Opus. Nur `data/` wächst → Sonnet.**

Umschalten in Claude Code: `/model claude-opus-5` bzw. `/model claude-sonnet-5`.
Der Kontext bleibt beim Umschalten erhalten.

## Selbstcheck zu Beginn jeder Session

Claude Code prüft, welche Art Aufgabe ansteht, und meldet sich **bevor** es losgeht:

- Aufgabe betrifft `src/`, aber aktives Modell ist Sonnet
  → „Das betrifft App-Code — bitte mit `/model claude-opus-5` neu starten." Und dann warten.
- Aufgabe ist eine reine Datenrunde, aber aktives Modell ist Opus
  → einmal darauf hinweisen, dass Sonnet reicht, dann normal weiterarbeiten.

## Warum

Die Recherche-Runden sind repetitiv und schemagebunden — das Denken steckt im Schema und im
Validator, nicht im Modell. Der App-Code entscheidet dagegen darüber, ob das Projekt langfristig
zusammenhält; dort lohnt sich das stärkere Modell.

## Arbeitsweise unabhängig vom Modell

- Neue Runde = neue Session (`/clear`). Der Stand steht in `PROGRESS.md`, nicht im Chatverlauf.
- Recherche immer über Subagents (Task-Tool), damit Rohtext von Webseiten nicht im Hauptkontext
  landet. Genau daran ist das Vorgängerprojekt gescheitert.
- Plan Mode (Shift+Tab) für alles, was mehr als eine Datei betrifft.
