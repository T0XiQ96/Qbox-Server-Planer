# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** noch keiner — Repo ist initialisiert (`git init -b main`), aber es wurde bewusst noch nicht committet (siehe „Offene Punkte")
**Validate-Status:** grün (0 Katalogdateien, 0 Plugins — Katalog ist im Fundament noch leer)
**Katalogstand:** 0 gesamt · 0 verifiziert · 0 teilgeprüft · 0 ungeprüft
**Aktuelle Runde:** — (noch keine Recherche-Runde begonnen, Phase 3 kommt erst nach Phase 2)

---

## Phase

- [x] Phase 0 — Repo, Schema, Validator, Build-Script
- [ ] Phase 1 — App mit 10 Demo-Plugins, alle Features aus FEATURES.md durchgetestet
- [ ] Phase 2 — Konvertierung der 88 Altbestand-Plugins aus `reference/qbox-server-planer-v2-1.html`
- [ ] Phase 3 — Recherche-Runden 1–10
- [ ] Phase 4 — Finale Duplikatprüfung, Link-Check über alles, Release

## Woran ich zuletzt gearbeitet habe

Phase 0 fertig: `git init`, Ordnerstruktur, `package.json` ohne Abhängigkeiten (Entscheidung D15),
`schema/plugin.schema.json` (inkl. Zusatzfeld `ressource`, Entscheidung D16), der gemeinsame
JSON-Fehlerlokalisierer `src/lib/jsonfehler.js` (eigener Scanner statt Engine-Fehlertexte, damit
Konsole und Browser identisch melden — Feature E4), alle sieben Scripts (`validate`, `build`,
`stats`, `find`, `linkcheck`, `newround`, `selftest`), `data/kategorien.json` mit den 14 Kategorien
aus v2.1, sowie ein minimaler `src/index.html` + `src/app/main.js`-Platzhalter, der beweist, dass
die Bau-Kette bis `dist/qbox-planer.html` end-to-end funktioniert (die echte App ist Phase 1).

Dabei gefunden und behoben: der ursprüngliche Verdacht zu den kimi-Katalogen in `CLAUDE.md` §4 war
falsch (keine JS-Objektliterale, sondern 6 einzelne Anführungszeichen-Tippfehler — Korrektur in
`docs/DECISIONS.md`). Außerdem ein echter Build-Bug: `scripts/build.mjs` ersetzte Platzhalter-Marken
per globalem String-Replace, wodurch eine Erwähnung der Marke im Erklärkommentar von `src/index.html`
den eingebetteten Katalog und das Skript verdoppelte. Behoben durch Umschreiben des Kommentars
(keine wörtliche Markenerwähnung mehr) und eine Build-Prüfung, die abbricht, wenn eine Marke nicht
genau einmal vorkommt.

`npm run validate`, `npm run selftest` (37/37) und `npm run build` laufen alle grün, zuletzt erneut
bestätigt nach den obigen Fixes.

## Nächster Schritt

Phase 1 beginnen: `src/app/*.js`-Module nach Plan-Abschnitt 1.1 bauen (State/Persistenz zuerst,
Schritt 1a aus dem Umsetzungsplan), `src/style.css` anlegen, danach `src/app/main.js` durch die
echte App ersetzen. Der volle Plan mit allen Schritten 1a–1g steht in
`C:\Users\tommy\.claude\plans\lies-zuerst-claude-md-und-fizzy-pancake.md`.

## Offene Punkte / Rückfragen an den Nutzer

- **Noch kein Commit.** Der Nutzer hat den ursprünglichen Commit-Befehl für Phase 0 ausdrücklich
  zurückgezogen („committe noch nichts") und die Arbeit stattdessen fortsetzen lassen. Der erste
  Commit für Phase 0 steht noch aus und sollte in der nächsten Session (oder auf Zuruf) nachgeholt
  werden — Repo-Status ist sauber (kein Commit, aber `npm run validate`/`selftest`/`build` grün).
- CLAUDE.md §6 „Modell- und Effort-Strategie" ist neu dazugekommen (12.08.2026) und ändert die
  Modellwahl aus §1: Standard ist jetzt Sonnet 5 / Effort medium, Opus nur für Phasen-Kickoff,
  modulübergreifende Architekturentscheidungen oder wenn Sonnet feststeckt. §1 nicht mehr als
  „bei jeder /src/-Aufgabe zwingend Opus" lesen, sondern §6 als aktuelle Regel behandeln.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- Phase 2 (Altbestandskonvertierung) ist bereits detailliert geplant, aber laut Plan erst nach
  Abschluss von Phase 1 dran.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |
