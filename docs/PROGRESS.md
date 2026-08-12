# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** `1a602b9` (Phase 0). Phase 1 ist fertig, aber noch **nicht** committet — das ist der nächste Schritt.
**Validate-Status:** grün (1 Katalogdatei `data/catalog/demo.json`, 10 Plugins, 1 beabsichtigte Warnung: `qbx_radio` nennt Nachfolger `mm_radio`, der noch nicht im Katalog steht)
**Katalogstand:** 10 gesamt · 0 verifiziert · 0 teilgeprüft · 10 ungeprüft (reine Demodaten, siehe unten)
**Aktuelle Runde:** — (noch keine Recherche-Runde begonnen, Phase 3 kommt erst nach Phase 2)

---

## Phase

- [x] Phase 0 — Repo, Schema, Validator, Build-Script
- [x] Phase 1 — App mit 10 Demo-Plugins, alle 59 Features aus FEATURES.md `getestet`
- [ ] Phase 2 — Konvertierung der 88 Altbestand-Plugins aus `reference/qbox-server-planer-v2-1.html`
- [ ] Phase 3 — Recherche-Runden 1–10
- [ ] Phase 4 — Finale Duplikatprüfung, Link-Check über alles, Release

## Woran ich zuletzt gearbeitet habe

Phase 1 komplett fertiggestellt und im Browser über `file://` durchgespielt (nicht nur mit
Node-Tests, wie es bei den vorherigen Modulen zwischendurch schon lief). Alle App-Module stehen:

- **State-Schicht:** `state.js` (Zustand, Migration, Backups, getrennte Resets),
  `katalogspeicher.js` (Import-Differenz-Persistenz nach Entscheidung D3a)
- **Logik:** `relations.js` (Gruppen, Ersetzt/Synergie/Ergänzt, beidseitige Konflikterkennung),
  `filters.js` (D1–D8), `compare.js` (C1–C4), `exportcfg.js` (ensure-Export, topologisch,
  zyklussicher), `costs.js` (F7), `custom.js` (H2), `import.js` (Katalog-/Zustand-Import mit
  Vorschau, E2–E10)
- **Darstellung:** `render.js` (vollständige Plugin-Karte), `ui.js` (Modal/Toast/Bestätigung),
  `main.js` (Render-Loop + Event-Delegation, führt alles zusammen), `style.css` (Dark Theme,
  Feature H3)
- **Daten:** `data/catalog/demo.json` mit 10 Einträgen, die jedes Merkmal aus dem Plan abdecken
  (Abhängigkeitskette, Ersetzt-Gruppe, Konflikt, Synergie, Ergänzt mit +/−, Preis einmalig/Abo,
  Kompat-Warnung bestätigt/Vermutung, archivierter Eintrag, Alt-Stack-Eintrag, Bundle)

**Architekturentscheidung während Phase 1 (D3a, siehe DECISIONS.md):** auf Nutzerwunsch speichert
das Tool importierte Katalog-Runden jetzt dauerhaft — aber nur die DIFFERENZ zum eingebauten
Katalog, nicht den vollen Katalog (der bleibt draußen, das war der Fehler der Vorversion). Eigener
localStorage-Schlüssel, Größenüberwachung, „Differenz verwerfen" ohne Nebenwirkung auf den
Nutzerzustand. Bei 1000 Plugins realistisch ~2,5 MB, weit unter dem 5-MB-Limit.

**Drei echte Bugs beim Browser-Test gefunden und behoben** (nicht nur Kosmetik — alle drei hätten
das Tool für den Nutzer unbrauchbar gemacht):
1. Badge „🆓 Kostenlos" erschien doppelt (Badge-Ableitung + Preisanzeige lieferten beides).
2. Zahnrad-Menü und Backup-Liste waren tote Knöpfe — `modal()` löste nur über Fuß-Buttons auf,
   nicht über `data-tat`-Elemente im Inhalt. Fix in `ui.js`: Klick-Listener auf `.modal-inhalt`.
3. Formular „Eigenes Plugin" (H2) speicherte nichts — `getElementById` griff erst NACH dem
   Schließen des Modals, wenn die Felder längst aus dem DOM entfernt waren. Fix: Eingaben werden
   laufend über `input`/`change` eingesammelt, solange das Fenster offen ist.

**Methodische Lehre, in FEATURES.md als Warnung festgehalten:** `location.reload()` aus der
Entwickler­konsole lädt in manchen Vorschau-Umgebungen nicht wirklich neu — meine ersten
Persistenz-Tests liefen darauf herein und bewiesen nichts. Mit echter Navigation wiederholt.

Zwei Dateien aus Phase 0 verschoben/ergänzt, weil der Bau-Prüfer Dopplungen fand:
`scripts/lib/schema.mjs` → `src/lib/schema.js` (App-Import nutzt jetzt exakt denselben
Schema-Prüfer wie `npm run validate`, statt einer zweiten, driftenden Variante), und
`src/lib/hilfen.js` neu für Code, der sich sonst in zwei App-Modulen dupliziert hätte
(`kopie`/`warnen` aus state.js+katalogspeicher.js, `WAEHRUNG_ZEICHEN` aus render.js+costs.js).

**Alle 59 Features in `docs/FEATURES.md` stehen auf `getestet`.** `npm run validate`,
`npm run selftest` (37/37) und `npm run build` laufen grün. `dist/qbox-planer.html` (148 KB)
wurde per echter Browser-Navigation über `file://` geprüft — Persistenz, Import/Export,
Konflikt-Warner, Vergleichsmodus, ensure-Export, alles bestätigt.

## Nächster Schritt

**Committen.** Phase 1 ist fertig, aber der gesamte Stand (17 neue/geänderte Dateien) liegt noch
uncommittet im Working Tree. Danach: Phase 2 (Altbestandskonvertierung) gemäß dem im Plan
festgehaltenen Ablauf beginnen — eigene Session, siehe „Bewusst verschoben" unten und den vollen
Plan in `C:\Users\tommy\.claude\plans\lies-zuerst-claude-md-und-fizzy-pancake.md`.

## Offene Punkte / Rückfragen an den Nutzer

- Keine offenen Rückfragen aktuell.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- **Phase 2** (Altbestandskonvertierung: 88 Plugins aus `reference/qbox-server-planer-v2-1.html`
  + 140 aus `reference/kimi-kataloge/`) ist im Plan detailliert ausgearbeitet (Feldabbildung,
  Zusammenführung nach Entscheidung D17, alles `qualitaet: "ungeprueft"` nach D18). Eigene Session,
  Sonnet 5, nur `data/` wächst dabei — `src/` wird nicht angefasst.
- Die Demodaten in `data/catalog/demo.json` sind absichtlich **nicht** nach `docs/RECHERCHE.md`
  recherchiert (`qualitaet: "ungeprueft"` durchgehend). Sie bleiben im Katalog, bis Phase 2/3
  echte Daten liefern — dann können sie ersetzt oder ergänzt werden.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |
