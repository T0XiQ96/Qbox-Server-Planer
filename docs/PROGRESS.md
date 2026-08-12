# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 12.08.2026
**Letzter Commit:** `19dfb87` (Phase 2). Runde 1 ist fertig, aber noch **nicht** committet — das ist der nächste Schritt.
**Validate-Status:** grün (3 Katalogdateien: `demo.json` 6, `altbestand.json` 256, `runde-1.json`
0 neue + 22 Updates · 262 Plugins gesamt · 13 harmlose „nur ein Mitglied"-Warnungen)
**Katalogstand:** 262 gesamt · 18 verifiziert · 4 teilgeprüft · 240 ungeprüft
**Aktuelle Runde:** Runde 1 — Nachprüfung der 22 essenziellen Altbestand-Einträge (kein
Neufund, auf Nutzerwunsch: „prüfe erstmal den Altbestand")

---

## Phase

- [x] Phase 0 — Repo, Schema, Validator, Build-Script
- [x] Phase 1 — App mit 10 Demo-Plugins, alle 59 Features aus FEATURES.md `getestet`
- [x] Phase 2 — Konvertierung des Altbestands aus `reference/qbox-server-planer-v2-1.html`
  (124 Einträge, nicht 88 wie ursprünglich geschätzt) und `reference/kimi-kataloge/` (140
  Einträge) → `data/catalog/altbestand.json`, 256 Plugins
- [~] Phase 3 — Recherche-Runden 1–10 (Runde 1 fertig, 2–10 offen)
- [ ] Phase 4 — Finale Duplikatprüfung, Link-Check über alles, Release

## Woran ich zuletzt gearbeitet habe

**Phase 2 komplett fertiggestellt** — Altbestandskonvertierung nach dem im Plan festgehaltenen
Ablauf (`C:\Users\tommy\.claude\plans\lies-zuerst-claude-md-und-fizzy-pancake.md`, Abschnitt
„Phase 2"). Vier neue, abhängigkeitsfreie Scripts unter `scripts/import/`:

- `von-v21.mjs` — liest `reference/qbox-server-planer-v2-1.html` **nur lesend**, schneidet das
  `RAW`-Array heraus und wertet es in einem Node-`vm`-Kontext aus (reines Datenliteral, kein
  ausführbarer Code). Wendet dieselben Defaults an wie das v2.1-Tool selbst.
- `von-kimi.mjs` — repariert die 6 bekannten Syntaxdefekte aus
  `reference/kimi-kataloge/*.json` (siehe `docs/DECISIONS.md` „Korrektur: Ursache der kaputten
  kimi-Kataloge") **nur im Speicher**; bricht bei jedem unbekannten Defekt mit der Diagnose aus
  `src/lib/jsonfehler.js` ab statt zu raten. Originaldateien bleiben unangetastet.
- `mapping.mjs` — eine gemeinsame Feldabbildung für beide Quellen, da sie dasselbe Rohvokabular
  benutzen (`cat`, `ess`, `badges`, `compat{level,text}`, `extends[].{adds,costs}`, `price{one,mon,c}`
  usw.). IDs werden konsequent kleingeschrieben (`normId`), auch in allen Querverweisfeldern.
- `build-altbestand.mjs` — führt beide Quellen nach **D17** zusammen: bei ID-Kollision gewinnt
  kimi **feldweise** (nur Felder, die kimi tatsächlich nennt, überschreiben v2.1 — via
  `Object.assign({}, v21Raw, kimiRaw)` auf Rohdaten-Ebene, bevor gemappt wird), Felder, die kimi
  nicht kennt, bleiben aus v2.1 erhalten. Schreibt `data/catalog/altbestand.json` und den
  Konfliktbericht `docs/altbestand-konflikte.md`.

**Tatsächliche Zahlen (Skript-Output, nicht die Plan-Schätzung):** v2.1 = 124 eindeutige Einträge
(nicht 88 — reine Schätzung vor dem Parsen), kimi Runde 1 = 83, kimi Runde 2 = 57. Zusammengeführt:
256 Plugins (124 aus v2.1 unverändert oder kimi-ergänzt, 132 nur bei kimi, 8 Kollisionen mit
tatsächlicher Feldänderung — alle in `docs/altbestand-konflikte.md` aufgeführt, größtenteils
`ox`-Ökosystem: Overextended-Repos wurden archiviert, kimi kennt den aktuellen TheOrderFivem-Fork,
v2.1 noch die alten Links).

**Ein echter Datenkonflikt gelöst:** `demo.json` enthielt vier IDs (`ox_lib`, `qbx_core`,
`qbx_policejob`, `ox_inventory`), die jetzt auch in `altbestand.json` stehen — doppelte IDs wären
ein Validator-Fehler gewesen. Entschieden nach der in `docs/PROGRESS.md` (vorige Fassung) bereits
angekündigten Regel „Demodaten bleiben, bis echte Daten sie ersetzen": die vier Einträge aus
`demo.json` entfernt, die verbleibenden sechs Demo-Einträge (`qs-inventory`, `qb-inventory`,
`ps-mdt`, `ps-housing`, `ps-realtor`, `qbx_radio`) referenzieren die vier IDs weiterhin über
`abhaengigkeiten`/`konflikte` — das funktioniert cross-file, weil der Validator (R7) Querverweise
über alle Katalogdateien hinweg auflöst, nicht nur innerhalb derselben Datei. Die
Abhängigkeitskette ox_lib ← qbx_core ← qbx_policejob bleibt damit für Phase-1-Feature-Tests intakt,
jetzt mit den echten (wenn auch ungeprüften) Altbestand-Feldern statt Demo-Platzhaltern.

**Fünf IDs mit Großbuchstaben normalisiert:** `okokGarage`, `LegacyFuel`, `okokPhone`, `vSync`,
`okokBanking` verstießen gegen die Schema-Regel `^[a-z0-9][a-z0-9_-]*$` und wurden beim Mapping
kleingeschrieben — die `normId()`-Funktion in `mapping.mjs` läuft konsistent über die eigene id
UND alle Querverweisfelder (`deps`, `conflicts`, `synergy`, `extends[].id`), damit nichts als toter
Querverweis endet.

`npm run validate` grün (262 Plugins, 2 Katalogdateien, 13 harmlose „nur ein Mitglied"-Warnungen
für Gruppen ohne zweiten Vergleichspartner), `npm run selftest` weiterhin 37/37 grün — die
Altbestandskonvertierung hat den JSON-Fehlerlokalisierer nicht angefasst, nur wiederverwendet.
Kein `npm run build` nötig (Regel §2.7: Datenrunden ändern nur `data/`, `src/` blieb unangetastet).

**Frühere Notiz, weiterhin gültig:**

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

## Runde 1 — Nachprüfung statt Neufund (auf Nutzerwunsch)

Nutzer bat explizit: „Fang an mit der ersten Runde, prüfe dabei den Altbestand erstmal" — deshalb
in Runde 1 bewusst **keine** Suche nach neuen Plugins, sondern ausschließlich Nachprüfung. Als
Stichprobe die 22 `essenziell: true` markierten Einträge gewählt (sinnvollere Priorität als
alphabetisch, da RECHERCHE.md §6 bei durchgehend leerem `geprueft_am` keine Reihenfolge vorgibt —
das sind die Plugins, auf denen der ganze Server aufbaut, also der teuerste Ort für falsche Daten).
Recherche über 4 parallele Subagents (echte GitHub-API-Abfragen, README/fxmanifest-Lektüre, keine
Vermutungen aus Vorwissen), Ergebnis als `updates[]` in `data/catalog/runde-1.json` — 22 Updates,
0 neue Plugins. `npm run validate`/`stats`/`selftest` grün, `scripts/lib/katalog.mjs` wendet die
Updates automatisch beim Laden an (geprüft: `ladeKatalog()` liefert die korrigierten Felder).

**Wichtige Funde (Altbestand war an mehreren Stellen veraltet oder schlicht falsch):**

- **ox_lib war NICHT mehr archiviert.** Der Katalog (aus der kimi-Runde übernommen, D17) behauptete
  „Overextended archiviert → Fork bei TheOrderFivem/CommunityOx". Tatsächlich (12.08.2026 per
  GitHub-API geprüft) ist `overextended/ox_lib` wieder aktiv und aktueller als jeder Fork
  (`communityox/ox_lib` ist archiviert). Overextended hat die Wartung offenbar wieder aufgenommen.
- **Dieselbe falsche Archiv-Kette betraf `ox_inventory`, `ox_target`, `ox_doorlock`, `ox_fuel`** —
  bei allen vieren ist das Original bei `overextended/*` aktiv und aktueller als der bisher
  verlinkte `TheOrderFivem`-Fork. Bei `ox_inventory` ist `TheOrderFivem/ox_inventory` inzwischen
  selbst archiviert. Bei **`ox_fuel` existierte der Katalog-Link `TheOrderFivem/ox_fuel` gar
  nicht** (404) — reiner Fehler in der Altbestand-Übernahme. Alle vier Links auf `overextended/*`
  korrigiert.
- **`qbx_multicharacter` ist seit 10.09.2023 archiviert** — die Funktion steckt seither fest in
  `qbx_core` (PR #119). Als `archiviert` mit Nachfolger `qbx_core` markiert, `essenziell` auf
  `false` gesetzt (separate Installation nicht mehr nötig/potenziell redundant).
- **`qbx_weathersync` ist seit 18.11.2023 archiviert, ohne Nachfolger.** Als `archiviert` markiert,
  `essenziell` auf `false`.
- **`qbx_smallresources`** ist zwar aktiv, aber der Autor kündigt im README selbst den Rückbau an
  („deprecated and will be deconstructed") — als `kompat_warnung` (bestätigt) festgehalten.
- **`renewed_banking` war fälschlich als `qbox_nativ` markiert** — README sagt ausdrücklich nur
  QBCore/ESX-Support. Auf `qbcore_bridge` korrigiert, `kompat_warnung` mit Zitat ergänzt.
- **`npwd`** ist framework-agnostisch, braucht für Qbox eine separate Bridge (`qbx_npwd`, noch
  nicht im Katalog) — als `kompat_warnung` festgehalten statt stillschweigend übernommen.
- **`mm_radio` existiert wirklich und ist aktiv** — der Nachfolger-Verweis im archivierten
  `qbx_radio`-Demo-Eintrag war also korrekt, keine Korrektur nötig.
- **`txadmin`**: Repo-Transfer `tabarra/txAdmin` → `citizenfx/txAdmin` (301-Redirect bestätigt),
  Link korrigiert. **`community_bridge`**: Katalog-Link zeigte auf ein 404-Repo
  (`Renewed-Scripts/community_bridge`), echtes Repo liegt bei `TheOrderFivem/community_bridge`.

**Bewusst nicht übernommen:** `qbx_garages` braucht laut README zusätzlich `qbx_vehicles`,
`npwd` braucht `qbx_npwd` — beide IDs sind noch nicht im Katalog. Nicht in `abhaengigkeiten`
aufgenommen (Validator-Regel R7 wäre ein harter Fehler bei totem Querverweis), stattdessen als
`tipp`/`kompat_warnung`-Text vermerkt. Kandidaten für eine künftige Runde.

## Nächster Schritt

**Committen.** Runde 1 ist fertig, aber `data/catalog/runde-1.json` und die Doku-Updates liegen
noch uncommittet im Working Tree. Danach: Runde 2 — jetzt mit echter Neusuche nach neuen Plugins
(RECHERCHE.md §6 verlangt beides je Runde; Runde 1 war auf Nutzerwunsch eine Ausnahme), plus
Nachprüfung der nächsten ältesten Einträge (aktuell: alle 240 verbleibenden `ungeprueft` mit
leerem `geprueft_am`, freie Themenwahl). `npm run newround 2` legt das Gerüst an.

## Offene Punkte / Rückfragen an den Nutzer

- Keine offenen Rückfragen aktuell.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- Die 8 Feldkollisionen zwischen v2.1 und kimi in `docs/altbestand-konflikte.md` sind zur
  Durchsicht protokolliert, aber nicht blockierend — bei Gelegenheit querlesen, ob die
  kimi-Version (gewinnt automatisch nach D17) überall die bessere Wahl war. Die in Runde 1
  gefundene falsche Archiv-Kette bei den ox_*-Plugins kam genau aus so einer kimi-Übernahme —
  ein Hinweis, dass die restlichen kimi-Funde ebenfalls mit Vorsicht zu genießen sind.
- `qbx_vehicles` und `qbx_npwd` sind laut Runde-1-Funden echte, aktive Qbox-Module, aber noch
  nicht im Katalog erfasst — gute Kandidaten für die Neusuche in Runde 2.
- 240 Katalogeinträge sind weiterhin `qualitaet: "ungeprueft"` (Demo- und Altbestand-Konvertierung,
  keiner nach `docs/RECHERCHE.md` recherchiert). Sie bleiben im Katalog, bis künftige Runden sie
  ersetzen oder hochstufen.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| 1 | Nachprüfung der 22 essenziellen Altbestand-Einträge (kein Neufund, auf Nutzerwunsch) | 0 | 22 | 0 | 0 (18 verifiziert, 4 teilgeprüft) | `data/catalog/runde-1.json` | folgt |
