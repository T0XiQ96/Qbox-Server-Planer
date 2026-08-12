# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** `3f0345a` (Runde 4). Runde 5 ist fertig, aber noch **nicht** committet — das
ist der nächste Schritt.
**Validate-Status:** grün (8 Katalogdateien: `demo.json` 6, `altbestand.json` 256, `runde-1.json`
22 Updates, `runde-2.json` 12, `runde-3.json` 14, `runde-4.json` 12, `runde-5.json` 11 · 262
Plugins gesamt · 13 harmlose „nur ein Mitglied"-Warnungen)
**Katalogstand:** 262 gesamt · 43 verifiziert · 28 teilgeprüft · ~191 ungeprüft
**Aktuelle Runde:** Runde 5 — Nachprüfung von weiteren 11/17 verbleibenden Einträgen der
Kategorie „Charakter, Inventar & UI" (Teil 2/3). Weiterhin kein Neufund (Nutzerwunsch: erst
kompletten Altbestand kategorieweise durchprüfen)

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

**Runden 2–3 — Kategorie „Basis & Abhängigkeiten" komplett durchgeprüft (31/31):**

Nutzer bestätigte nach Runde 1 ausdrücklich: erst **den kompletten Altbestand durchprüfen**
(„möglichst alles geprüft"), erst danach neue Plugins suchen. Vorgehen abgestimmt (AskUserQuestion):
**größere Batches (10–12 Plugins/Runde)**, Reihenfolge **nach Kategorie** (`data/kategorien.json`,
Anzeigereihenfolge). Runde 2 (12) + Runde 3 (14) = restliche 26 Einträge der Kategorie
„1. Basis & Abhängigkeiten" abgeschlossen (die essenziellen deckte schon Runde 1 ab). Recherche
über je 3 parallele Subagents, `updates[]` in `data/catalog/runde-2.json`/`runde-3.json`.

**Wiederkehrendes Muster (jetzt in 2 von 3 Runden bestätigt):** Mehrere overextended-Repos
(`awesome_ox`, `ox_core`, `oxmysql` in Runde 2; dasselbe schon bei `ox_lib`/`ox_inventory`/etc. in
Runde 1) waren im Katalog fälschlich als archiviert markiert — tatsächlich aktiv, `archiviert` auf
`null` korrigiert. `oxmysql` hatte zusätzlich einen toten `TheOrderFivem`-Fork-Link (404), wie
schon `ox_fuel` in Runde 1. **Neuer Fund in Runde 3:** vier Katalogeinträge
(`peak_bridge`, `qbox_snippets`, `starterpack`, `vue_tailwind_boilerplate`) hatten als „Link" nur
die generische GitHub-Topic-Suchseite `github.com/topics/qbox` — kein echtes Repo. Für drei davon
wurde ein plausibles Repo gefunden und der Link korrigiert (teils mit Vorbehalt, z.B. `starterpack`
hat mehrere konkurrierende Kandidaten); für `vue_tailwind_boilerplate` gab es keinen passenden
Treffer — bleibt bewusst `ungeprueft` statt eines geratenen Links.

**Für spätere Runden vorgemerkt:** Die 8 v2.1/kimi-Feldkollisionen in
`docs/altbestand-konflikte.md` sind weiterhin nur protokolliert, nicht durchgesehen — das
Falsch-Archiviert-Muster ist ein Hinweis, dass die kimi-Übernahmen zum `ox`-Ökosystem generell mit
Vorsicht zu lesen sind. `qbx_vehicles` und `qbx_npwd` (aus Runde 1) sind weiterhin Kandidaten für
die erste Neusuche-Runde. Die Topic-Seiten-Links (`github.com/topics/qbox`) könnten in weiteren
Kategorien öfter auftauchen — beim Recherchieren künftiger Runden aktiv drauf achten.

## Nächster Schritt

**Committen.** Runde 5 ist fertig, aber `data/catalog/runde-5.json` und diese Doku-Updates liegen
noch uncommittet im Working Tree. Danach: Runde 6 — restliche 6/17 Einträge der Kategorie
„Charakter, Inventar & UI" (`qs_hud`, `qs_inventory`, `t-notify`, `wasabi_backpack`,
`wasabi_loading`, `wasabi_multichar`), damit ist die Kategorie „UI" komplett. `npm run newround 6`
legt das Gerüst an. Vorgehen (Batchgröße 10–12, nach Kategorie, reine Nachprüfung vor Neusuche)
gilt unverändert bis der Nutzer etwas anderes sagt.

**Runde 5 — wichtigster Fund:** `qbx_loading` (offizielles Qbox-Repo!) wurde am 09.07.2026
archiviert, kein Nachfolger genannt. `ps_hud` ist ebenfalls archiviert (06.02.2026, gleiches
Project-Sloth-Team wie `ps-inventory` in Runde 4) — Muster „Project-Sloth archiviert reihenweise
ps-*-Repos" jetzt zweimal bestätigt, in Runde 6/Folgerunden aktiv nach weiteren ps-*-Einträgen
Ausschau halten. `pulse_scoreboard` hatte wieder nur die Topic-Seite als Link — diesmal durch
`ac_scoreboard` ersetzt (echtes, aktives Repo mit Framework-Autoerkennung), zugleich `qbx_scoreboard`
in dieselbe Vergleichsgruppe gesetzt.

**Runde 4 — wichtigster Fund:** `lj_inventory` — auch der als „gepflegt" katalogisierte
`ps-inventory`-Fork (Project-Sloth) wurde am 06.02.2026 archiviert, kein Nachfolger genannt. Zwei
weitere Topic-Seiten-Links korrigiert (`interaction_menu_mod`, `mtc_loadingscreen` — echte Repos
gefunden). Zwei „mythic_*"-Legacy-Links waren schlicht tot (nicht nur archiviert): `mythic_notify`
komplett verschwunden (kein verlässlicher Nachfolge-Link gefunden, bleibt `teilgeprueft`),
`mythic_progbar`-Link falsch, funktionierender Fork bei `wasabirobby/mythic_progbar` gefunden.

## Offene Punkte / Rückfragen an den Nutzer

- Keine offenen Rückfragen aktuell.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- Die 8 Feldkollisionen zwischen v2.1 und kimi in `docs/altbestand-konflikte.md` — bei Gelegenheit
  querlesen, siehe „Woran ich zuletzt gearbeitet habe" oben.
- `qbx_vehicles` und `qbx_npwd` — Kandidaten für die erste Neusuche-Runde, sobald der Altbestand
  durchgeprüft ist.
- `starterpack` hat einen Best-Effort-Link ohne eindeutigen offiziellen Kandidaten,
  `vue_tailwind_boilerplate` hat gar keinen passenden Link gefunden — beide in einer künftigen
  Runde nochmal gezielt angehen oder aus dem Katalog nehmen, falls sich nichts Besseres findet.
- 214 Katalogeinträge sind weiterhin `qualitaet: "ungeprueft"`. Sie bleiben im Katalog, bis
  künftige Runden sie ersetzen oder hochstufen — geplant: kategorieweise, 10–12 pro Runde.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| 1 | Nachprüfung der 22 essenziellen Altbestand-Einträge (kein Neufund, auf Nutzerwunsch) | 0 | 22 | 0 | 0 (18 verifiziert, 4 teilgeprüft) | `data/catalog/runde-1.json` | `91d1c40` |
| 2 | Nachprüfung Kategorie „Basis" Teil 1/2, 12 von 26 (kein Neufund) | 0 | 12 | 0 | 0 (10 verifiziert, 2 teilgeprüft) | `data/catalog/runde-2.json` | `f504f7d` |
| 3 | Nachprüfung Kategorie „Basis" Teil 2/2, restliche 14 von 26 — Kategorie fertig | 0 | 14 | 0 | 2 (4 verifiziert, 8 teilgeprüft, 2 weiterhin ungeprueft) | `data/catalog/runde-3.json` | `7afa348` |
| 4 | Nachprüfung Kategorie „UI" Teil 1/3, 12 von 31 (kein Neufund) | 0 | 12 | 0 | 0 (8 verifiziert, 4 teilgeprüft) | `data/catalog/runde-4.json` | `3f0345a` |
| 5 | Nachprüfung Kategorie „UI" Teil 2/3, 11 von 17 verbleibenden (kein Neufund) | 0 | 11 | 0 | 0 (3 verifiziert, 8 teilgeprüft) | `data/catalog/runde-5.json` | folgt |
