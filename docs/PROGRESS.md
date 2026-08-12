# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 13.08.2026
**Letzter Commit:** `22c46cd` (Runde 19). Runden 20–24 sind fertig und werden mit diesem Schritt
committet.
**Validate-Status:** grün (27 Katalogdateien inkl. `runde-20.json`–`runde-24.json` · 262 Plugins
gesamt · 13 harmlose „nur ein Mitglied"-Warnungen) · `npm run selftest` 37/37.
**Katalogstand:** 262 gesamt, 109 verifiziert/teilgeprüft (42 %), 36 archiviert, nur noch **13
ohne `geprueft_am`** (8 in Kategorie „assets", je 1–2 Streuverluste in „ui"/„staat"/„wohnen").
**Aktuelle Runden 20–24:** fünf komplette Kategorien in einer Sitzung durchgeprüft (auf
Nutzerwunsch: ganze Kategorien statt 10–12er-Batches) — „Kommunikation & Telefon" (14/16),
„Realismus & Welt" (17/17), „Waffen & Kampf" (2/2 Rest), „Wirtschaft & Banking" (13/13),
„Admin & Sicherheit" (14/14). Weiterhin kein Neufund (Nutzerwunsch: erst kompletten Altbestand
kategorieweise durchprüfen).

**Vorgehensweise „weniger Subagent-Arbeit" (Nutzerwunsch, ab Runde 17 eingeführt und in Runde 18
bestätigt):** `docs/RECHERCHE.md` wurde um Abschnitte 1a–1c ergänzt (exakte URL-Muster
`api.github.com/repos/<owner>/<repo>`, `raw.githubusercontent.com/.../fxmanifest.lua` bzw.
`README.md`, systematisches Vorgehen bei 404/Repo-Umzug nach Autoren-Namensmuster, Umgang mit
bot-geschützten Tebex-Seiten). Zusätzlich löst die Hauptsession vor dem Rundenstart bei bereits
bekannten GitHub-Links den Owner/Repo-Pfad selbst per `npm run find`/Katalog-Auszug auf und gibt
ihn den Subagents direkt mit — nur bei echten Platzhalter-Links (`github.com/topics/qbox`) oder
reinen Profil-Links müssen Subagents noch selbst suchen. Bewährt sich über zwei Runden: weiterhin
akkurate, gut belegte Funde bei spürbar weniger Tool-Aufrufen pro Subagent für bekannte Repos.
**Für künftige Runden beibehalten.**

**Sonnet-5/low-Test abgeschlossen (Runden 7–15, Nutzerwunsch statt der in CLAUDE.md §1
vorgegebenen medium-Einstellung für Datenrunden).** Zwischenfazit: Über 9 Runden hinweg keine vom
Effort-Level ausgelöste Qualitätsverschlechterung bei erfolgreichem Rundenabschluss — im
Gegenteil, die Runden lieferten durchgehend belastbare, gut belegte Funde (u. a. `ox_fuel`-Fork
tot, `qbx_houses`/`qbx_apartments` archiviert, `qbx_policejob`→`qbx_police` umbenannt, und in
Runde 14/15 ein systematischer Datenfehler bei 11 `jim_*`-Einträgen, die fälschlich als
Open-Source geführt waren obwohl sie kostenpflichtige Tebex-Produkte sind — ein Fund, der eher für
gründliche Recherche als gegen sie spricht). Einziger echter Abbruch-Zwischenfall war das
„ich melde mich später"-Verhalten eines Subagents in Runde 8 (Subagents laufen synchron; mit einer
expliziten Klarstellung im Prompt reproduzierbar behoben, seither nicht wieder aufgetreten).
Einschätzung: Für reine Nachprüfungs-Recherche (Link-/Status-Checks, Repo-Metadaten lesen,
Beleggrad einordnen) ist low eine brauchbare, günstigere Alternative zu medium. Für Aufgaben mit
vielen gleichzeitigen Kompatibilitätsurteilen oder Neufund-Suche würde ich vorsichtshalber wieder
auf medium wechseln, wie in CLAUDE.md §1 vorgesehen — das wurde in diesen 9 Runden aber nicht
getestet, da es sich durchgehend um reine Nachprüfung handelte.

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

**Session beendet (Nutzerwunsch: `/clear` nach dieser Runde).** Alles committet, sicher zum
Neustart. Nur noch **13 Katalogeinträge ohne `geprueft_am`** übrig, davon 8 in einer einzigen
Kategorie:

**Nächster Rundenstart — Kategorie „13. MLOs, Kleidung & Assets"** (8 offene Einträge, komplett
ungeprüft — bisher keine einzige Runde dazu). `npm run prefetch -- --kategorie assets --offen
--max 12 --runde 25`, dann `npm run newround 25`. Danach die restlichen Streuverluste
(2× `ui`, 1× `staat`, 2× `wohnen` — IDs vor Rundenstart per `npm run stats`/`find` neu ermitteln,
das sind vermutlich neu ergänzte oder nachträglich als offen markierte Einzeleinträge, keine
ganze Kategorie) und danach beginnt die Suche nach **neuen** Plugins (der Altbestand ist dann
komplett durchgeprüft) — dafür vorher mit dem Nutzer klären, ob `docs/RECHERCHE.md` für
Neusuche-Runden noch Ergänzungen braucht (bisher nur auf Nachprüfung ausgelegt).

**Bewährtes Muster aus Runden 19–24 (Prefetch + ganze Kategorien pro Runde):** Bei jeder Runde
schreibt die Hauptsession die sauberen Treffer aus dem Briefing (vollständige Code-Stichprobe,
fxmanifest + README vorhanden) direkt selbst in den Katalog — typischerweise 30–60 % der Runde,
ganz ohne Subagent. Nur die kniffligen Fälle (tote Links, Tebex-Bot-Schutz, Namens-Kandidaten,
externe Anbieterseiten) gehen an einen einzigen Subagent pro Runde. Ergebnis über 5 Runden:
konstant 9–24 Tool-Aufrufe pro Subagent statt der vorher üblichen 40–70. **Wichtig dabei
etabliert:** Subagent-Funde vor dem Schreiben gegen die bestehende Katalogbeschreibung
gegenprüfen, nicht blind übernehmen — in Runde 20 (`pma_radio_ui`) und Runde 21 (`vsync`) wurde
je ein Fund verworfen, weil er der bestehenden Einordnung widersprochen hätte (siehe
CHANGELOG-Einträge dieser Runden für die Details). `abhaengigkeiten`-IDs müssen zum Muster
`^[a-z0-9][a-z0-9_-]*$` passen (klein, keine Großbuchstaben) — Subagents liefern das nicht
immer korrekt, vor dem Schreiben prüfen. `framework` ist ein einzelner Enum-Wert
(`qbox_nativ`/`qbcore_bridge`/`standalone`/`qbcore_only`), kein Array. `preis.typ` nur
`einmalig`/`abo`. `lizenz` nur `open_source`/`escrow`, keine SPDX-Kürzel wie "MIT"/"GPL-3.0".

## Werkzeug: `npm run prefetch` (seit 12.08.2026)

Auf Nutzerwunsch („weniger Tokens, schneller, ohne Genauigkeitsverlust") läuft die mechanische
Hälfte der Recherche jetzt als Script statt im Subagent-Kontext. **Ablauf jeder künftigen Runde:**

1. `npm run prefetch -- --kategorie <kat> --offen --max 11 --runde N`
2. Den Subagents im Prompt **nur den Pfad** `data/.prefetch/runde-N.md` nennen — niemals den
   Inhalt hineinkopieren, sonst ist die Ersparnis weg.
3. Die Agents lesen das Briefing und liefern nur noch das Urteil (Framework-Einordnung,
   Beleggrad, `update_grund`) plus die dort unter „Offen für dich" ausgewiesenen Restpunkte.

Gemessen: 10 Plugins in 4,9 s bei 7 API-Aufrufen, Briefing ~10 KB. Runde 18 kostete für 11
Plugins ~400 s und ~164k Tokens. Genauer ist es zusätzlich, weil die Code-Stichprobe nach
RECHERCHE.md §3 vorher praktisch nie durchgeführt wurde — das Script prüft alle `.lua`-Dateien
und nennt Fundstellen zeilengenau (Details im CHANGELOG-Eintrag „[Werkzeug] Prefetch").

Ein `GITHUB_TOKEN` oder `GH_TOKEN` in der Umgebung hebt das API-Limit von 60 auf 5000/h. Ohne
Token läuft es dank Owner-Bündelung auch, wird aber bei mehreren Runden hintereinander knapp —
falls Läufe mit `api-fehler` enden, ist das die Ursache (nicht mit `owner-weg` verwechseln, das
ist ein echter Befund).

**Runde 15 — wichtigster Fund:** `qbx_hotdogjob` hatte einen falschen Katalog-Pfad (Unterstrich
statt Bindestrich, korrekt `qbx-hotdogjob`) und ist zudem als „Unmaintained" markiert — bisher
nicht erfasst. Drei weitere `jim_*`-Einträge (`jim_tequilala`, `jim_upnatom`,
`jim_vanillaunicorn`) bestätigen das Runde-14-Muster (fälschlich als Open-Source geführt,
tatsächlich Tebex-Paid), `jim_recycle` ist dagegen eine echte Ausnahme mit funktionierendem Repo.

**Runde 14 — wichtigster Fund:** 8 von 9 geprüften `jim_*`-Jobs waren im Katalog fälschlich als
kostenlose Open-Source-Repos geführt — die verlinkten GitHub-Repos existieren nicht (404), es
sind tatsächlich kostenpflichtige Closed-Source-Produkte über Tebex. `lizenz` bei allen acht auf
`escrow` korrigiert. Nur `jim_mining` hat ein echtes öffentliches Repo.

**Runde 13 — wichtigster Fund:** `randolio_grandma` und `wk_wars2x` hatten beide Tippfehler in
den Katalog-Links (falscher Repo-Slug bzw. falsche Owner-Schreibweise), vermutlich nie tatsächlich
verifiziert. `sonoran_cad`-Preis (~$20/Monat) ließ sich nicht bestätigen — bewusst auf `null`
gesetzt statt eines möglicherweise falschen Betrags.

**Runde 12 — wichtigster Fund:** `qbx_policejob` (essenziell!) wurde zu `qbx_police` umbenannt
(GitHub-Redirect bestätigt), Link korrigiert, ID zur Wahrung der Querverweise unverändert
gelassen. `qbx_prison` frisch archiviert seit 09.07.2026. `qb_gangmenu` komplett aus der
qbcore-framework-Org entfernt. Offene Beziehungsfrage `qbx_medical`↔`qbx_ambulancejob` geklärt:
Pflicht-Ergänzung per fxmanifest-Beleg, kein alternatives Modul.

**Runde 11 — wichtigster Fund:** `ox_mdt` war entgegen der Katalog-Annahme NICHT archiviert
(weiterhin aktiv gepflegt) — die `ox_core`-Abhängigkeit und damit Qbox-Inkompatibilität bleibt
aber bestätigt, reine Statuskorrektur. `mythic_hospital`-Quelle ist komplett verschwunden (404
statt nur „ungepflegt"). `origen_police`: Qbox-Support-Verifizierung ergab negativ — kein Nachweis
gefunden, nur QBCore/ESX offiziell genannt.

**Runde 10 — wichtigster Fund:** `qbx_houses` und `qbx_apartments` (beide offizielle Qbox-Repos)
wurden am 09.07.2026 archiviert und offiziell als unmaintained markiert — `qbx_properties` ist
der bestätigte alleinige Nachfolger (Migrationsanleitung fordert das Entfernen der alten Module).
`ps_housing`/`ps_realtor` sind ebenfalls archiviert (vierte Project-Sloth-Welle nach
ps-inventory/ps-hud/ps-fuel).

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
| 10 | Nachprüfung Kategorie „Wohnen" komplett, 9 von 9 (kein Neufund) | 0 | 9 | 0 | 0 (3 verifiziert, 6 teilgeprüft) | `data/catalog/runde-10.json` | `f027817` |
| 11 | Nachprüfung Kategorie „Staat" Teil 1/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 0 (3 verifiziert, 5 teilgeprüft) | `data/catalog/runde-11.json` | `771f330` |
| 12 | Nachprüfung Kategorie „Staat" Teil 2/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 1 (5 verifiziert, 2 teilgeprüft, 1 herabgestuft) | `data/catalog/runde-12.json` | `58dbbab` |
| 13 | Nachprüfung Kategorie „Staat" Teil 3/3, letzte 7 — Kategorie komplett (kein Neufund) | 0 | 7 | 0 | 0 (3 verifiziert, 4 teilgeprüft) | `data/catalog/runde-13.json` | `912ef51` |
| 14 | Nachprüfung Kategorie „Zivil" Teil 1/3, 10 von 30 (kein Neufund, 8 lizenz-Korrekturen) | 0 | 10 | 0 | 9 (0 verifiziert, 1 teilgeprüft, 9 ungeprueft) | `data/catalog/runde-14.json` | `8be5710` |
| 15 | Nachprüfung Kategorie „Zivil" Teil 2/3, 10 von 30 (kein Neufund) | 0 | 10 | 0 | 0 (5 verifiziert, 5 teilgeprüft) | `data/catalog/runde-15.json` | `74e9862` |
| 16 | Nachprüfung Kategorie „Zivil" Teil 3/3, letzte 10 — Kategorie komplett (kein Neufund) | 0 | 10 | 0 | 3 (4 verifiziert/teilgeprüft, 3 ungeprueft) | `data/catalog/runde-16.json` | `c8a7383` |
| 17 | Nachprüfung Kategorie „Crime" Teil 1/3, 11 von 32 (kein Neufund) | 0 | 11 | 0 | 4 (2 verifiziert, 6 teilgeprüft, 4 ungeprueft) | `data/catalog/runde-17.json` | `8a4e940` |
| 18 | Nachprüfung Kategorie „Crime" Teil 2/3, 11 von 32 (kein Neufund) | 0 | 11 | 0 | 2 (5 verifiziert, 4 teilgeprüft, 2 ungeprueft) | `data/catalog/runde-18.json` | `d247353` |
| 19 | Nachprüfung Kategorie „Crime" Teil 3/3, letzte 10 + Nachtrag — Kategorie komplett (kein Neufund, erste Runde mit `npm run prefetch`) | 0 | 11 | 0 | 3 (7 verifiziert, 1 teilgeprüft, 3 ungeprueft) | `data/catalog/runde-19.json` | `22c46cd` |
| 20 | Nachprüfung Kategorie „Kommunikation" komplett, 14 von 16 (kein Neufund, erste Ganze-Kategorie-Runde) | 0 | 14 | 0 | 2 (6 verifiziert, 6 teilgeprüft, 2 ungeprueft) | `data/catalog/runde-20.json` | folgt |
| 21 | Nachprüfung Kategorie „Realismus & Welt" komplett, 17/17 (kein Neufund) | 0 | 17 | 0 | 3 (6 verifiziert, 8 teilgeprüft, 3 ungeprueft/404) | `data/catalog/runde-21.json` | folgt |
| 22 | Nachprüfung Kategorie „Waffen & Kampf" komplett, letzte 2 (kein Neufund) | 0 | 2 | 0 | 0 (1 verifiziert, 1 teilgeprüft) | `data/catalog/runde-22.json` | folgt |
| 23 | Nachprüfung Kategorie „Wirtschaft & Banking" komplett, 13/13 (kein Neufund) | 0 | 13 | 0 | 0 (3 verifiziert, 10 teilgeprüft) | `data/catalog/runde-23.json` | folgt |
| 24 | Nachprüfung Kategorie „Admin & Sicherheit" komplett, 14/14 (kein Neufund) | 0 | 14 | 0 | 3 (9 verifiziert, 2 teilgeprüft, 3 ungeprueft) | `data/catalog/runde-24.json` | folgt |
