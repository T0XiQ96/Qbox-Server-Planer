# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** `91d1c40` (Runde 1). Runde 2 ist fertig, aber noch **nicht** committet — das ist der nächste Schritt.
**Validate-Status:** grün (4 Katalogdateien: `demo.json` 6, `altbestand.json` 256, `runde-1.json`
22 Updates, `runde-2.json` 12 Updates · 262 Plugins gesamt · 13 harmlose „nur ein Mitglied"-Warnungen)
**Katalogstand:** 262 gesamt · 28 verifiziert (11 %) · 6 teilgeprüft · 228 ungeprüft
**Aktuelle Runde:** Runde 2 — Nachprüfung von 12/26 verbleibenden Einträgen der Kategorie
„Basis & Abhängigkeiten" (weiterhin kein Neufund, Nutzerwunsch: erst kompletten Altbestand
kategorieweise durchprüfen, dann erst neue Plugins suchen)

---

## Phase

- [x] Phase 0 — Repo, Schema, Validator, Build-Script
- [x] Phase 1 — App mit 10 Demo-Plugins, alle 59 Features aus FEATURES.md `getestet`
- [x] Phase 2 — Konvertierung des Altbestands aus `reference/qbox-server-planer-v2-1.html`
  (124 Einträge, nicht 88 wie ursprünglich geschätzt) und `reference/kimi-kataloge/` (140
  Einträge) → `data/catalog/altbestand.json`, 256 Plugins
- [~] Phase 3 — Recherche-Runden (Runde 1–2 fertig, weitere offen — Zielzahl 10 war eine grobe
  Planungsannahme; bei kategorieweiser Nachprüfung von 240 Altbestand-Einträgen zu 10–12/Runde
  werden es eher 20+ Runden allein für die Nachprüfung, plus Runden für echte Neusuche danach)
- [ ] Phase 4 — Finale Duplikatprüfung, Link-Check über alles, Release

## Woran ich zuletzt gearbeitet habe

**Ausführliche Historie zu Phase 0–2 und Runde 1 steht in `docs/CHANGELOG.md`** (nicht hier
wiederholt, damit diese Datei bei 40+ geplanten Runden lesbar bleibt). Kurzfassung: Phase 0–2
fertig (Fundament, App, Altbestandskonvertierung 256 Plugins), Runde 1 fertig (22 essenzielle
Einträge nachgeprüft, siehe Runde-1-Eintrag im CHANGELOG für die Einzelfunde).

**Runde 2 — Fortsetzung der reinen Nachprüfung (Nutzerwunsch, siehe unten):**

Nutzer bestätigte nach Runde 1 ausdrücklich: erst **den kompletten Altbestand durchprüfen**
(„möglichst alles geprüft"), erst danach neue Plugins suchen. Vorgehen abgestimmt (AskUserQuestion):
**größere Batches (10–12 Plugins/Runde)**, Reihenfolge **nach Kategorie** (`data/kategorien.json`,
Anzeigereihenfolge). Runde 2 = erste 12 von 26 verbleibenden `ungeprueft`-Einträgen in
„1. Basis & Abhängigkeiten" (die restlichen essenziellen aus dieser Kategorie deckte schon Runde 1
ab). Recherche über 3 parallele Subagents, `updates[]` in `data/catalog/runde-2.json`.

**Wichtigster Fund:** Dasselbe Falsch-Archiviert-Muster aus Runde 1 (overextended-Repos, die der
Katalog fälschlich als archiviert führte) trat erneut auf — `awesome_ox`, `ox_core` und `oxmysql`
waren ebenfalls zu Unrecht als archiviert markiert (alle drei per GitHub-API bestätigt aktiv,
`archiviert` auf `null` korrigiert). `oxmysql` zusätzlich mit totem `TheOrderFivem`-Fork-Link
(404) — genau wie `ox_fuel` in Runde 1. `fivem_ts_boilerplate` wurde umbenannt zu `fivem-ts`
(Link korrigiert). Echt tot (nicht nur behauptet): `mumble-voip`, offiziell archiviert seit
12.12.2024, Nachfolger `pma-voice` (Community-Konsens). `ghmattimysql`: Original-GitHub-Account
komplett verschwunden (nicht nur archiviert), Fortführung bei `FrazzIe/ghmattimysql` gefunden.

**Für spätere Runden vorgemerkt:** Die 8 v2.1/kimi-Feldkollisionen in
`docs/altbestand-konflikte.md` sind unverändert nur protokolliert, nicht durchgesehen — das
wiederkehrende Falsch-Archiviert-Muster (jetzt 2× bestätigt bei overextended-Repos) ist ein
Hinweis, dass die kimi-Übernahmen zum `ox`-Ökosystem generell mit Vorsicht zu lesen sind.
`qbx_vehicles` und `qbx_npwd` (aus Runde 1 als echte, aktive, aber unkatalogisierte Qbox-Module
aufgefallen) sind weiterhin gute Kandidaten für die erste Neusuche-Runde.

## Nächster Schritt

**Committen.** Runde 2 ist fertig, aber `data/catalog/runde-2.json` und diese Doku-Updates liegen
noch uncommittet im Working Tree. Danach: Runde 3 — restliche 14 Einträge der Kategorie
„Basis & Abhängigkeiten" (`peak_bridge`, `polyzone`, `qb_input`, `qb_menu`, `qbox_core_site`,
`qbox_snippets`, `quasar_store`, `saltychat`, `starterpack`, `stg_scripts`, `tgiann_store`,
`txadminrecipe_qbox`, `vue_tailwind_boilerplate`, `ybnlimax_list`), dann weiter mit Kategorie
„2. Charakter, Inventar & UI" (31 offene Einträge). `npm run newround 3` legt das Gerüst an.
Vorgehen (Batchgröße 10–12, nach Kategorie, reine Nachprüfung vor Neusuche) gilt unverändert bis
der Nutzer etwas anderes sagt.

## Offene Punkte / Rückfragen an den Nutzer

- Keine offenen Rückfragen aktuell.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- Die 8 Feldkollisionen zwischen v2.1 und kimi in `docs/altbestand-konflikte.md` — bei Gelegenheit
  querlesen, siehe „Woran ich zuletzt gearbeitet habe" oben.
- `qbx_vehicles` und `qbx_npwd` — Kandidaten für die erste Neusuche-Runde, sobald der Altbestand
  durchgeprüft ist.
- 228 Katalogeinträge sind weiterhin `qualitaet: "ungeprueft"`. Sie bleiben im Katalog, bis
  künftige Runden sie ersetzen oder hochstufen — geplant: kategorieweise, 10–12 pro Runde.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| 1 | Nachprüfung der 22 essenziellen Altbestand-Einträge (kein Neufund, auf Nutzerwunsch) | 0 | 22 | 0 | 0 (18 verifiziert, 4 teilgeprüft) | `data/catalog/runde-1.json` | `91d1c40` |
| 2 | Nachprüfung Kategorie „Basis" Teil 1/2, 12 von 26 (kein Neufund) | 0 | 12 | 0 | 0 (10 verifiziert, 2 teilgeprüft) | `data/catalog/runde-2.json` | folgt |
