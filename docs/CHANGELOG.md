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
**Commit:** noch keiner — folgt direkt im Anschluss an diesen Changelog-Eintrag

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
