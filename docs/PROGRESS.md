# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** `b688c5a` (Runde 9).
**Validate-Status:** grün (12 Katalogdateien: `demo.json` 6, `altbestand.json` 256, `runde-1.json`
22 Updates, `runde-2.json` 12, `runde-3.json` 14, `runde-4.json` 12, `runde-5.json` 11,
`runde-6.json` 6, `runde-7.json` 8, `runde-8.json` 8, `runde-9.json` 7 · 262 Plugins gesamt ·
13 harmlose „nur ein Mitglied"-Warnungen)
**Katalogstand:** 262 gesamt · 54 verifiziert · 42 teilgeprüft · ~166 ungeprüft
**Aktuelle Runde:** Runde 9 — Kategorie „Fahrzeuge & Mechanik" abgeschlossen, letzte 7 Einträge
nachgeprüft (Teil 3/3). **Kategorie „Fahrzeuge" (23 Einträge) damit komplett durchgeprüft.**
Weiterhin kein Neufund (Nutzerwunsch: erst kompletten Altbestand kategorieweise durchprüfen).

**Sonnet-5/low-Test abgeschlossen (Runden 7–9, Nutzerwunsch statt der in CLAUDE.md §1
vorgegebenen medium-Einstellung für Datenrunden):** Ergebnisqualität bei erfolgreichem
Rundenabschluss wirkte über alle drei Runden unverändert zu medium — jede Runde lieferte
mindestens einen konkreten, gut belegten Sach-/Link-Fehlerfund (Runde 7: `jim_mechanic`
kostenpflichtig geworden; Runde 8: `ox_fuel`-Fork tot + Original fälschlich als archiviert
geführt, `ps_fuel` tatsächlich archiviert, `qb_customs` komplett verschwunden; Runde 9:
`renewed_vehicleshops` verschwunden, `wasabi_carlock` Link-Schreibfehler + Org-Umzug). Der einzige
klare Unterschied zu medium: in Runde 8 brach der erste Recherche-Subagent nach nur 2
Tool-Aufrufen mit einer ungültigen „ich melde mich später"-Antwort ab (Kategoriefehler — Subagents
laufen synchron). Mit einer expliziten Klarstellung im Prompt neu gestartet, danach fehlerfrei;
das Muster trat in Runde 7 und 9 nicht auf. Einschätzung: low ist für reine Nachprüfungs-Recherche
offenbar brauchbar, aber weniger robust gegen dieses eine Abbruch-Verhalten — bei neuen,
komplexeren Aufgaben (Neusuche, viele Kompatibilitätsurteile) würde ich vorsichtshalber wieder auf
medium wechseln, wie in CLAUDE.md §1 vorgesehen.

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

Runde 10 — Start der nächsten Kategorie
„4. Immobilien & Wohnen" (9 Einträge laut `data/kategorien.json`-Reihenfolge, kleinste
verbleibende Kategorie, passt vermutlich in eine Runde). `npm run newround 10` legt das Gerüst
an. Vorgehen (Batchgröße 8–12, nach Kategorie, reine Nachprüfung vor Neusuche) gilt unverändert
bis der Nutzer etwas anderes sagt. Modell/Effort für Runde 10 mit dem Nutzer klären — Sonnet
5/low-Test war explizit auf Runden 7–9 begrenzt.

**Runde 9 — wichtigster Fund:** `renewed_vehicleshops` ist komplett verschwunden — Katalog-Link
404, die Org hat kein passendes Repo mehr, kein Ersatz auffindbar, bewusst auf `ungeprueft`
herabgestuft statt eines geratenen Links. `wasabi_carlock` hatte denselben Fehlertyp wie
`wasabi_backpack` in Runde 6 (falsche Schreibweise) plus einen Org-Umzug zu `wasabi-versions`.

**Runde 8 — wichtigster Fund:** `ox_fuel` (essenziell!) verlinkte auf einen toten Fork
(`TheOrderFivem/ox_fuel`, 404) — das Original `overextended/ox_fuel` ist entgegen der bisherigen
Katalog-Annahme NICHT archiviert, sondern aktiv gepflegt. Link zurückkorrigiert. `ps_fuel` ist
dagegen tatsächlich archiviert (dritter Project-Sloth-Fund nach ps-inventory/ps-hud). `qb_customs`
existiert nicht mehr (404, aus der qbcore-framework-Org entfernt), kein offizieller Nachfolger.

**Runde 7 — wichtigster Fund:** `jim_mechanic` ist inzwischen kostenpflichtig (v3.6, primär über
Tebex), nicht mehr das im Katalog beschriebene kostenlose Open-Source-System — `lizenz` auf
`escrow` korrigiert. `legacyfuel` hatte einen Link-Bug (`legacy_fuel` Kleinschreibung → 404,
korrekt `LegacyFuel`).

**Runde 6 — wichtigster Fund:** `wasabi_backpack` — der Katalog-Link war schlicht falsch
geschrieben (`Wasabi-Backpack` statt `wasabi_backpack`), führte zu 404 und wurde deshalb bisher
nie wirklich geöffnet („bot-geschützt, manuell prüfen"-Vermerk war eine Fehldiagnose). Jetzt
korrigiert; Repo lange inaktiv (Commit 02/2023) aber nicht archiviert. `qs_hud`/`qs_inventory`:
konkrete Quasar-Store-Produktseiten statt nur der Startseite gefunden, Qbox-Support jetzt
bestätigt statt vermutet — Preise bleiben unverifiziert (JS-Rendering im Shop).

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
| 5 | Nachprüfung Kategorie „UI" Teil 2/3, 11 von 17 verbleibenden (kein Neufund) | 0 | 11 | 0 | 0 (3 verifiziert, 8 teilgeprüft) | `data/catalog/runde-5.json` | `266eeec` |
| 6 | Nachprüfung Kategorie „UI" Teil 3/3, letzte 6 — Kategorie komplett (kein Neufund) | 0 | 6 | 0 | 0 (2 verifiziert, 4 teilgeprüft) | `data/catalog/runde-6.json` | `7745445` |
| 7 | Nachprüfung Kategorie „Fahrzeuge" Teil 1/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 0 (3 verifiziert, 5 teilgeprüft) | `data/catalog/runde-7.json` | `c92f18f` |
| 8 | Nachprüfung Kategorie „Fahrzeuge" Teil 2/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 1 (4 verifiziert, 3 teilgeprüft, 1 ungeprueft) | `data/catalog/runde-8.json` | `5851328` |
| 9 | Nachprüfung Kategorie „Fahrzeuge" Teil 3/3, letzte 7 — Kategorie komplett (kein Neufund) | 0 | 7 | 0 | 1 (3 verifiziert, 3 teilgeprüft, 1 auf ungeprueft herabgestuft) | `data/catalog/runde-9.json` | `b688c5a` |
