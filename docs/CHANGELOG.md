# CHANGELOG

Fortlaufendes Protokoll aller Änderungen — Tool-Versionen, Katalog-Runden und Korrekturen.
Wird nach jedem Arbeitsschritt ergänzt, neueste Einträge oben.

Format je Eintrag:

```
## [Version oder Runde] – TT.MM.JJJJ

**Neu:** ...
**Geändert:** ...
**Korrigiert:** ...
**Katalog:** X neu, Y aktualisiert, Z Duplikate übersprungen, N ungeprüft
**Commit:** <hash>
```

---

## [Runde 7] – 12.08.2026

**Neu:**
- `data/catalog/runde-7.json` — erste 8 von 23 Einträgen der Kategorie „Fahrzeuge & Mechanik"
  nachgeprüft (Teil 1/3), recherchiert über 1 Subagent

**Korrigiert:**
- `jim_mechanic`: **wichtigster Fund** — ist inzwischen kostenpflichtig (v3.6, primär über
  Tebex vertrieben), nicht mehr das im Katalog beschriebene kostenlose Open-Source-System.
  `lizenz` auf `escrow` korrigiert, Beschreibung/Contra angepasst. Qbox-Support bleibt bestätigt.
- `legacyfuel`: Link-Bug behoben (`legacy_fuel` Kleinschreibung führte zu 404, korrekt ist
  `LegacyFuel`), Nachfolger-Feld auf `ox_fuel` ergänzt.
- `cd_garage`, `jg_dealerships`, `jg_mechanic`: Store-Startseiten durch konkrete Produktseiten
  ersetzt, Qbox-Support-Aussagen jetzt direkt belegt statt nur behauptet, Preise ($54/$81)
  bestätigt.
- `cdn_fuel`: seit 09/2023 keine Aktivität mehr (58 offene Issues unbeantwortet) — Warnung ergänzt.

**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 5 auf
`teilgeprueft` hochgestuft/bestätigt
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 6] – 12.08.2026

**Neu:**
- `data/catalog/runde-6.json` — letzte 6 Einträge der Kategorie „Charakter, Inventar & UI"
  nachgeprüft (Teil 3/3) — Kategorie damit komplett durchgeprüft. Recherchiert über 1 Subagent
  (nur 6 Einträge, kein 3er-Split nötig)

**Korrigiert:**
- `wasabi_backpack`: **wichtigster Fund** — Katalog-Link war schlicht falsch geschrieben
  (`Wasabi-Backpack` statt `wasabi_backpack`), führte zu 404. Das erklärte den alten
  „bot-geschützt, manuell prüfen"-Vermerk. Korrigiert, Repo lange inaktiv (letzter Commit
  02/2023) aber nicht archiviert. Katalogtext „Framework-erkennend" war ungenau — es ist ein
  reines ox_inventory-Item ohne eigene Framework-Detection.
- `t-notify`: Katalogaussage „ungepflegt" war zu hart formuliert — Repo ist nicht archiviert,
  nur seit Ende 2024 ohne Commit.
- `qs_hud`, `qs_inventory`: konkrete Produktseiten im Quasar-Store gefunden (Katalog hatte nur
  die Startseite), Qbox-Support jetzt bestätigt statt nur vermutet. Preise bleiben unverifiziert
  (JS-Rendering im Shop).
- `wasabi_loading`, `wasabi_multichar`: konkrete Produktseiten ergänzt, Preise ($19.99 /
  $39.99) und Qbox-Bridge-Aussagen bestätigt.

**Katalog:** 0 neu, 6 aktualisiert, 0 Duplikate übersprungen, 2 auf `verifiziert`, 4 auf
`teilgeprueft` hochgestuft/bestätigt
**Kategorie „Charakter, Inventar & UI" (33 Einträge) ist damit komplett nachgeprüft.**
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 5] – 12.08.2026

**Neu:**
- `data/catalog/runde-5.json` — weitere 11 von 17 verbleibenden Einträgen der Kategorie
  „Charakter, Inventar & UI" nachgeprüft (Teil 2/3), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `qbx_loading`: **wichtigster Fund** — vom Owner am 09.07.2026 archiviert, kein Nachfolger
  genannt. Katalogtext „Gepflegt" war veraltet.
- `ps_hud`: Repo seit 06.02.2026 archiviert (dasselbe Project-Sloth-Team, das schon
  `ps-inventory` in Runde 4 archiviert hat), Framework auf `qbcore_only` korrigiert (harte
  `@qb-core`-Abhängigkeit, kein ox_lib, keine Qbox-Nennung), kein Nachfolger benannt.
- `pulse_scoreboard`: Platzhalter-Link (`github.com/topics/qbox`) war kein echtes Repo — ein
  „Ultimate Scoreboard" mit Qbox-Bezug existiert nicht. Ersetzt durch `acscripts/ac_scoreboard`
  (aktiv, Framework-Autoerkennung inkl. `qbx_core`), Name entsprechend angepasst.
- `qbx_scoreboard`: Gruppe von `null` auf `scoreboard` gesetzt — gehört inhaltlich zur selben
  Vergleichsgruppe wie der korrigierte `pulse_scoreboard`/`ac_scoreboard`-Eintrag.
- `ox_inventory_v3`: Archiviert-Status präzisiert — laut GitHub nicht formal archiviert, aber
  weiterhin unfertig/experimentell ohne Releases seit Erstellung.
- `qb_radialmenu`, `qb_spawn`, `qb_target`: Framework auf `qbcore_only` präzisiert (kein
  ox_lib-/Qbox-Bezug im fxmanifest). `qb_target`-Konfliktwarnung mit `ox_target` auf Beleggrad
  `vermutung` korrigiert (aus Funktionsüberschneidung geschlossen, keine Autor-Aussage gefunden).
- `qb_spawn`, `qbx_hud`, `qbx_scoreboard`, `qbx_spawn`, `qb_multicharacter`: weiterhin aktiv,
  Versionen/Commit-Daten aus fxmanifest bestätigt, keine Statusänderung nötig.

**Katalog:** 0 neu, 11 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 8 auf
`teilgeprueft` bestätigt/hochgestuft
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 4] – 12.08.2026

**Neu:**
- `data/catalog/runde-4.json` — erste 12 von 31 Einträgen der Kategorie „Charakter, Inventar &
  UI" nachgeprüft (Teil 1/3), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `lj_inventory`: Katalogaussage „ps-Fork gepflegt" überholt — Project-Sloth hat `ps-inventory`
  am 06.02.2026 archiviert (Fokus künftig auf ps-mdt v3), kein Nachfolger genannt.
- `interaction_menu_mod`, `mtc_loadingscreen`: Katalog-Link war nur die generische
  GitHub-Topic-Seite `github.com/topics/qbox` — echte, treffende Repos gefunden und verlinkt.
- `mythic_notify`: Link komplett tot (Repo verschwunden, auch der ursprüngliche Fork-Baum) — kein
  verlässlicher Nachfolge-Link gefunden, bleibt bewusst `teilgeprueft` statt eines geratenen Links.
- `mythic_progbar`: Katalog-Link falsch (404), funktionierender Fork bei
  `wasabirobby/mythic_progbar` gefunden und verlinkt.
- `fivem_appearance`: Katalogtext „Gepflegt" war überholt — kein Commit seit Februar 2023, de
  facto unmaintained (aber nicht offiziell archiviert).
- `illenium_appearance`: Qbox-Nutzung jetzt direkt belegt (offizielles `txAdminRecipe` lädt es als
  Standalone-Resource), aber letzter Commit November 2024 — Katalogtext „Aktiv · 2026" war zu
  optimistisch formuliert.
- `codem_inventory`, `cd_drawtextui`: tote/veraltete Shop-URLs auf aktuelle Produktseiten
  korrigiert. `okoknotify`, `okoktextui`: Preise bestätigt (je 4,99 EUR).

**Katalog:** 0 neu, 12 aktualisiert, 0 Duplikate übersprungen, 8 auf `verifiziert`, 4 auf
`teilgeprueft` hochgestuft
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 3] – 12.08.2026

**Neu:**
- `data/catalog/runde-3.json` — Abschluss der Nachprüfung von Kategorie „Basis & Abhängigkeiten":
  14 `updates[]` für die restlichen 14 von 26 verbleibenden `ungeprueft`-Einträgen, Kategorie 1
  damit komplett durchgeprüft (31/31 inkl. Runde 1), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `peak_bridge`, `qbox_snippets`, `starterpack`, `vue_tailwind_boilerplate`: Katalog-Link war nur
  die generische GitHub-Topic-Seite `github.com/topics/qbox`, kein echtes Repo. Für
  `peak_bridge`/`qbox_snippets`/`starterpack` ein plausibles Repo gefunden und Link korrigiert
  (teils mit Vorbehalt: `starterpack` hat mehrere konkurrierende Kandidaten ohne eindeutig
  offizielle Quelle). Für `vue_tailwind_boilerplate` kein passender Treffer — bleibt bewusst
  `ungeprueft` statt eines geratenen Links.
- `polyzone`, `qb_input`, `qb_menu`: Katalogtext „inaktiv"/Legacy war ungenau — alle drei aktiv
  gepflegt, kein Archiv-Banner.
- `saltychat`: Organisation `v10networkscom` zu `SaltyHub-net` umbenannt, Link korrigiert.
- `qbox_core_site`, `quasar_store`: Katalogaussagen präzisiert (primär Shop statt Guide-Seite;
  kein dedizierter Qbox-Filter, sondern Framework-Tag pro Produkt).

**Katalog:** 0 neu, 14 aktualisiert, 0 Duplikate übersprungen, 4 auf `verifiziert`, 8 auf
`teilgeprueft` hochgestuft, 2 bleiben bewusst `ungeprueft` (keine belastbare Quelle gefunden)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 2] – 12.08.2026

**Neu:**
- `data/catalog/runde-2.json` — Fortsetzung der reinen Nachprüfung auf Nutzerwunsch (erst
  kompletten Altbestand durchprüfen, dann neue Plugins suchen): 12 `updates[]` für die ersten
  12 von 26 verbleibenden `ungeprueft`-Einträgen der Kategorie „Basis & Abhängigkeiten",
  recherchiert über 3 parallele Subagents

**Korrigiert:**
- `awesome_ox`, `ox_core`, `oxmysql`: dasselbe Falsch-Archiviert-Muster wie in Runde 1 bei
  `ox_lib`/`ox_inventory`/etc. — alle drei per GitHub-API bestätigt aktiv, `archiviert` auf
  `null` korrigiert. `oxmysql` hatte zusätzlich einen toten `TheOrderFivem`-Fork-Link (404),
  auf `overextended/oxmysql` korrigiert.
- `fivem_ts_boilerplate`: Repo umbenannt zu `overextended/fivem-ts`, Link korrigiert.
- `mumble-voip`: echt tot bestätigt (nicht nur behauptet) — offiziell archiviert seit
  12.12.2024, Nachfolger `pma-voice` als Community-Konsens ergänzt.
- `ghmattimysql`: Original-GitHub-Account (`GHMatti`) existiert nicht mehr — Fortführung bei
  `FrazzIe/ghmattimysql` gefunden, Link korrigiert, `stack_hinweis` auf `oxmysql` als
  moderneren Ersatz ergänzt.
- `fivemx_dir`: Katalogbehauptung eines dedizierten Qbox-Filters nicht bestätigt — als `contra`
  vermerkt statt stillschweigend übernommen.

**Katalog:** 0 neu, 12 aktualisiert, 0 Duplikate übersprungen, 10 auf `verifiziert` und 2 auf
`teilgeprueft` hochgestuft (vorher alle 12 `ungeprueft`)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 1] – 12.08.2026

**Neu:**
- `data/catalog/runde-1.json` — erste Recherche-Runde nach `docs/RECHERCHE.md`, auf
  ausdrücklichen Nutzerwunsch als reine Nachprüfung des Altbestands (keine Suche nach neuen
  Plugins): 22 `updates[]` für die essenziellen Basis-Plugins, recherchiert über 4 parallele
  Subagents (GitHub-API, README/fxmanifest, keine Vermutungen aus Vorwissen)

**Korrigiert (Altbestand war veraltet oder falsch):**
- `ox_lib`, `ox_inventory`, `ox_target`, `ox_doorlock`, `ox_fuel`: die aus der kimi-Runde
  übernommene Archiv-Kette „Overextended archiviert → TheOrderFivem/CommunityOx-Fork aktuell"
  stimmt nicht mehr. `overextended/*` ist bei allen fünf wieder aktiv und aktueller als jeder
  Fork; bei `ox_inventory` ist der bisher empfohlene `TheOrderFivem`-Fork inzwischen selbst
  archiviert; der Katalog-Link zu `TheOrderFivem/ox_fuel` existierte nie (404). Alle fünf Links
  auf `overextended/*` korrigiert.
- `qbx_multicharacter`: archiviert seit 10.09.2023, Funktion seither fest in `qbx_core`
  eingebaut (PR #119) — als `archiviert` markiert, `essenziell` auf `false`.
- `qbx_weathersync`: archiviert seit 18.11.2023, kein Nachfolger — als `archiviert` markiert,
  `essenziell` auf `false`.
- `renewed_banking`: fälschlich `framework: "qbox_nativ"` — README bestätigt nur QBCore/ESX,
  auf `qbcore_bridge` korrigiert.
- `txadmin`: Repo-Transfer `tabarra/txAdmin` → `citizenfx/txAdmin`, Link korrigiert.
- `community_bridge`: Katalog-Link zeigte auf ein nicht existierendes Repo
  (`Renewed-Scripts/community_bridge`, 404), korrekt ist `TheOrderFivem/community_bridge`.
- `qbx_smallresources`, `npwd`: neue `kompat_warnung` ergänzt (Autor kündigt Rückbau an,
  bzw. braucht für Qbox die separate, noch nicht katalogisierte Bridge `qbx_npwd`).
- `mm_radio`: bestätigt existent und aktiv — keine Korrektur nötig, der Nachfolger-Verweis im
  archivierten `qbx_radio`-Demo-Eintrag war richtig.

**Katalog:** 0 neu, 22 aktualisiert, 0 Duplikate übersprungen, 18 auf `verifiziert` und 4 auf
`teilgeprueft` hochgestuft (vorher alle 22 `ungeprueft`)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Phase 2] – 12.08.2026

**Neu:**
- `scripts/import/von-v21.mjs` — liest `reference/qbox-server-planer-v2-1.html` nur lesend,
  wertet das `RAW`-Array in einem Node-`vm`-Kontext aus (reines Datenliteral)
- `scripts/import/von-kimi.mjs` — repariert die 6 bekannten Syntaxdefekte aus
  `reference/kimi-kataloge/*.json` NUR im Speicher (Originaldateien unverändert), bricht bei
  jedem unbekannten Defekt mit der `jsonfehler.js`-Diagnose ab statt zu raten
- `scripts/import/mapping.mjs` — gemeinsame Feldabbildung Rohformat → Katalogschema für beide
  Quellen (identisches Rohvokabular)
- `scripts/import/build-altbestand.mjs` — führt beide Quellen nach D17 zusammen (kimi gewinnt
  feldweise bei ID-Kollision, v2.1-only-Felder bleiben erhalten) und schreibt
  `data/catalog/altbestand.json` + `docs/altbestand-konflikte.md`
- `data/catalog/altbestand.json` — 256 Plugins (124 aus v2.1, 132 nur bei kimi, 8 Kollisionen),
  durchgehend `qualitaet: "ungeprueft"`, `geprueft_am: ""` (D18)
- `docs/altbestand-konflikte.md` — Konfliktbericht der 8 Feld-Überschreibungen zur Durchsicht

**Geändert:**
- `data/catalog/demo.json`: die vier Einträge, die jetzt echte Entsprechungen in
  `altbestand.json` haben (`ox_lib`, `qbx_core`, `qbx_policejob`, `ox_inventory`), entfernt —
  gleiche ID wäre ein Duplikatfehler gewesen. Die Abhängigkeitskette der übrigen sechs
  Demo-Einträge bleibt über diese IDs cross-file intakt (`abhaengigkeiten`/`konflikte` zeigen
  jetzt auf die altbestand-Version). Bewusst vorgesehen, siehe `docs/PROGRESS.md` Phase 1.

**Korrigiert:**
- `docs/DECISIONS.md`/Plan gingen von 88 Plugins in `reference/qbox-server-planer-v2-1.html`
  aus (grobe Schätzung vor dem tatsächlichen Parsen). Das `RAW`-Array enthält tatsächlich
  **124** eindeutige Einträge, keine Duplikate. Fünf IDs (`okokGarage`, `LegacyFuel`,
  `okokPhone`, `vSync`, `okokBanking`) enthielten Großbuchstaben und wurden beim Mapping
  kleingeschrieben (Schema-Pflicht `^[a-z0-9][a-z0-9_-]*$`); alle Querverweise sind konsistent
  mitkleingeschrieben.

**Katalog:** 256 neu (davon 124 aus v2.1, 132 nur bei kimi), 0 aktualisiert (Altbestand ist eine
eigenständige Datei, kein `updates`-Import gegen einen bestehenden Katalog), 8 Kollisionen
feldweise nach kimi aufgelöst (`docs/altbestand-konflikte.md`), 256 ungeprüft (D18)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Phase 1] – 12.08.2026

**Neu:**
- Alle App-Module in `src/app/`: `state.js`, `relations.js`, `render.js`, `filters.js`,
  `compare.js`, `import.js`, `katalogspeicher.js`, `custom.js`, `exportcfg.js`, `costs.js`,
  `ui.js`, `main.js`
- `src/style.css` — Dark Theme im GitHub-Stil (Feature H3)
- `src/lib/hilfen.js` — geteilter Kleinkram (`kopie`, `warnen`, `WAEHRUNG_ZEICHEN`), entstanden
  weil der Bau-Prüfer dieselben Definitionen doppelt in zwei Modulen fand
- `data/catalog/demo.json` — 10 Demo-Plugins, decken jedes Merkmal aus dem Plan ab
- Alle 59 Features aus `docs/FEATURES.md` `getestet`

**Geändert:**
- `scripts/lib/schema.mjs` → `src/lib/schema.js` verschoben und ins Build eingebettet: der
  Katalog-Import in der App prüft jetzt mit demselben Schema-Prüfer wie `npm run validate`
- `docs/DECISIONS.md`: D3a ergänzt (Import-Differenz wird dauerhaft gespeichert, aber nur die
  Differenz zum eingebauten Katalog, nicht der volle Katalog — Präzisierung von D3)
- `src/index.html`: Platzhalter-Erklärkommentar umgeschrieben, damit er die Marken nicht mehr
  wörtlich nennt (siehe „Korrigiert")

**Korrigiert:**
- `scripts/build.mjs` verdoppelte eingebetteten Katalog und Skript, weil der Erklärkommentar in
  `src/index.html` die Platzhalter-Marken wörtlich nannte und der globale String-Replace auch dort
  zuschlug. Kommentar umgeschrieben, plus eine Prüfung, die abbricht, wenn eine Marke nicht genau
  einmal vorkommt.
- Badge „🆓 Kostenlos" erschien doppelt auf der Karte (Badge-Ableitung und Preisanzeige lieferten
  beide denselben Fall).
- Zahnrad-Menü und Backup-Liste reagierten nicht auf Klicks — `modal()` löste nur über die
  Fuß-Buttons auf, nicht über `data-tat`-Elemente im Inhalt.
- Formular „Eigenes Plugin" (H2) speicherte nichts, weil die Feldwerte erst nach dem Schließen
  des Modals ausgelesen wurden, wenn das Formular schon aus dem DOM entfernt war.

**Katalog:** 0 neu, 0 aktualisiert, 0 Duplikate übersprungen, 10 ungeprüft (Demodaten, nicht
nach docs/RECHERCHE.md recherchiert — bewusst so markiert)
**Commit:** `aeec4e7`

---

## [Phase 0] – 12.08.2026

**Neu:**
- Repo initialisiert (`git init -b main`), Ordnerstruktur (`data/catalog`, `src`, `scripts`,
  `schema`, `dist`), `package.json` ohne Abhängigkeiten (Entscheidung D15)
- `schema/plugin.schema.json` — vollständiges Schema für Plugin- und Katalogdatei-Einträge,
  inkl. Zusatzfeld `ressource` (D16) und Sonderregeln R1–R10
- `src/lib/jsonfehler.js` — gemeinsamer JSON-Fehlerlokalisierer für CLI und App-Import
  (eigener Zeichen-für-Zeichen-Scanner statt Engine-Fehlertexte, damit Konsole und Browser
  identisch melden), löst Feature E4
- `scripts/`: `validate`, `build`, `stats`, `find`, `linkcheck`, `newround`, `selftest` sowie
  `scripts/lib/katalog.mjs` (zentrales Laden + Defaults) und `scripts/lib/schema.mjs`
  (eigener, abhängigkeitsfreier Schema-Prüfer)
- `data/kategorien.json` mit den 14 Kategorien aus `reference/qbox-server-planer-v2-1.html`
- `src/index.html` (Rahmen) + `src/app/main.js` (Platzhalter) — beweist die Bau-Kette bis
  `dist/qbox-planer.html` end-to-end; die echte App folgt in Phase 1
- `scripts/testdaten/` (gültige und absichtlich kaputte Katalogdateien) für `npm run selftest`

**Geändert:**
- `docs/DECISIONS.md`: D15–D19 ergänzt; Korrektur-Abschnitt zur tatsächlichen Ursache der
  kaputten kimi-Kataloge (siehe „Korrigiert")
- `CLAUDE.md` §4: falsche Verdachtsdiagnose zu den kimi-Katalogen durch den belegten Befund ersetzt

**Korrigiert:**
- Der in `CLAUDE.md` §4 vermutete Fehler in den kimi-Katalogen (JS-Objektliterale mit
  unquotierten Keys) war **falsch**. Tatsächlich waren es 6 einzelne Anführungszeichen-Tippfehler
  über beide Dateien (`reference/kimi-kataloge/katalog-runde-01.json` und `-02.json`), belegt
  und regressionsgetestet in `scripts/selftest.mjs`. Nach Reparatur im Speicher parsen beide
  Dateien sauber (83 + 57 = 140 Einträge). Die Originaldateien bleiben unverändert.
- Build-Bug in `scripts/build.mjs`: Platzhalter-Marken (`<!--@STIL-->` etc.) wurden per globalem
  String-Replace ersetzt. Eine Erwähnung der Marke im Erklärkommentar von `src/index.html`
  führte dazu, dass der eingebettete Katalog und das gebündelte Skript im Build-Ergebnis
  verdoppelt wurden. Behoben durch Umschreiben des Kommentars (keine wörtliche Markenerwähnung
  mehr) und eine Prüfung in `build.mjs`, die abbricht, wenn eine Block-Marke nicht genau einmal
  vorkommt.

**Katalog:** 0 neu, 0 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (Katalog ist im
Fundament noch leer, erste Daten kommen mit Phase 1 als `data/catalog/demo.json`)
**Commit:** noch keiner — bewusst zurückgestellt, siehe `docs/PROGRESS.md` „Offene Punkte"

---

## [Vorgeschichte] – 11.08.2026

Projekt wird auf Basis der alten Einzeldatei `qbox-server-planer-v2-1.html` (88 Plugins,
14 Kategorien) neu aufgebaut. Gründe siehe `DECISIONS.md`. Bekannte Fehler der Altversion,
die im Neubau nicht wieder auftreten dürfen:

- Katalog-Import scheiterte an JS-Objektliteralen statt echtem JSON („Ungültige Katalog-Datei")
- Default-Felder wurden nur auf den eingebauten Katalog angewandt, nicht auf importierte Einträge
  → fehlendes Feld ließ das Rendern crashen
- Import-Zähler zählte „neu" und „aktualisiert" doppelt
- Kompletter Katalog lag im localStorage (5-MB-Limit)
- Migrationszweig prüfte einen Key, der nie geschrieben wurde
- `resetAll()` löschte ohne Sicherheitskopie
