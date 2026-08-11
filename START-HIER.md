# So startest du

## 1. Ordner vorbereiten

Lege einen leeren Projektordner an und kopiere hinein:

```
qbox-planer/
├── CLAUDE.md                          ← aus diesem Paket
├── docs/
│   ├── PROGRESS.md                    ← aus diesem Paket
│   ├── FEATURES.md                    ← aus diesem Paket
│   ├── MODELS.md                      ← aus diesem Paket
│   ├── DECISIONS.md                   ← aus diesem Paket
│   └── CHANGELOG.md                   ← aus diesem Paket
└── reference/
    └── qbox-server-planer-v2-1.html   ← deine alte Datei
```

Ordner in VS Code öffnen, Claude Code starten, Modell auf **Opus 5** setzen
(`/model claude-opus-5`), Plan Mode an (Shift+Tab).

## 2. Erste Nachricht (kopieren)

```
Lies zuerst CLAUDE.md und alle Dateien in docs/. Das Projekt ist noch leer — wir starten bei Null.

Aufgabe: Erstelle einen Plan für Phase 0 und Phase 1 aus docs/PROGRESS.md.

Phase 0 — Fundament:
- git init, package.json, Ordnerstruktur data/ src/ scripts/ schema/ dist/ docs/ reference/
- schema/plugin.schema.json: verbindliches JSON Schema für einen Katalog-Eintrag. Felder:
  id, name, autor, kategorie, gruppe, essenziell, beschreibung, features[], link, link_status,
  link_geprueft_am, version, letztes_update, lizenz (open_source|escrow), preis {betrag, waehrung,
  typ: einmalig|abo}, framework (qbox_nativ|qbcore_bridge|standalone|qbcore_only),
  abhaengigkeiten[], konflikte[], bundle, ersetzt[], synergie[], ergaenzt[],
  kompat_warnung {text, sicherheit: bestaetigt|vermutung}, archiviert {text, nachfolger},
  stack_hinweis, pro[], contra[], neutral[], tipp, quelle,
  qualitaet (verifiziert|teilgeprueft|ungeprueft)
- scripts/: validate, build, stats, find, linkcheck, newround (siehe CLAUDE.md Abschnitt 5)
- validate prüft: Schema, doppelte IDs über alle Runden, Pflichtfelder, tote Querverweise

Phase 1 — App:
- src/ mit der Tool-Logik, Build erzeugt dist/qbox-planer.html als Einzeldatei (alles inline,
  läuft per file:// ohne Server)
- Alle Features aus docs/FEATURES.md umsetzen und dort auf "gebaut" setzen
- 10 Beispiel-Plugins in data/catalog/demo.json, die jedes Feature demonstrieren
  (Abhängigkeitskette, Ersetzt-Gruppe, Konflikt, Synergie, Ergänzt, Preis, Kompat-Warnung,
  archivierter Eintrag, Alt-Stack-Eintrag)

reference/qbox-server-planer-v2-1.html: Logik als Vorlage lesen (Gruppen/coveredBy, topologischer
ensure-Export mit Zyklusschutz, Konflikt-/Bundle-/Dependency-Warner, Kompat-Tooltip). Die dort
dokumentierten Bugs aus CLAUDE.md Abschnitt 4 nicht mitschleppen. Die Datei selbst bleibt unberührt.

Zeig mir den Plan und stell mir vorher alle Fragen, die du brauchst.
```

## 3. Danach

- **Phase 2** (Altbestand konvertieren) und **Phase 3** (Recherche-Runden): jeweils **neuer Chat**,
  `/model claude-sonnet-5`. Claude Code liest CLAUDE.md automatisch und arbeitet aus PROGRESS.md weiter.
- Rundenprompt siehe unten.
- Wenn etwas schiefgeht: `git log --oneline`, dann `git revert` oder `git checkout <hash>`.
  Deshalb der Commit nach jedem Schritt.

## 4. Rundenprompt (neue Session, Sonnet 5)

```
Recherche-Runde <N>, Thema: <Themenblock>.

Ziel: 75 neue, noch nicht vorhandene Plugins.
- Vorher gegen data/_ids.txt prüfen, Duplikate überspringen und im Bericht ausweisen
- Recherche strikt nach docs/RECHERCHE.md: jede Plugin-Seite tatsächlich lesen (README,
  fxmanifest, Code-Stichprobe, letzter Commit, Issues, Shop-Seite). Kein Eintrag aus Vorwissen
- Kompatibilität belegen, nicht raten: rote Flaggen (harte qb-inventory/qb-target-Abhängigkeit,
  Eingriff in interne qb-core-Player-Funktionen, ox_core) vs. grüne Flaggen (ox_lib, qbx_core-
  Exports, community_bridge/jim_bridge). Beleggrad bestaetigt|vermutung ist Pflichtfeld
- Zusätzlich die 20 Bestandseinträge mit dem ältesten geprueft_am nachprüfen und als "updates"
  in dieselbe Datei legen (mit update_grund im Klartext)
- Recherche über Subagents laufen lassen, nicht im Hauptkontext
- Ergebnis: data/catalog/runde-<N>.json, exakt nach schema/plugin.schema.json
- Bei vorhandenen Einträgen derselben Funktionsgruppe: pro/contra und ersetzt/synergie/ergaenzt
  aktualisieren, wenn die neue Recherche das hergibt
- Nicht verifizierbares als "ungeprueft" markieren, nichts erfinden
- Abschluss: npm run validate, npm run linkcheck, npm run build, PROGRESS.md + CHANGELOG.md
  fortschreiben, git commit

Bericht am Ende: neu / aktualisiert / übersprungen / ungeprüft.
```

**Themenblöcke:** 1 Framework & Kern · 2 Jobs · 3 Crime & Heists · 4 Fahrzeuge ·
5 Housing & Immobilien · 6 MLOs & Maps · 7 HUD/UI/Notify · 8 Waffen & Gangs ·
9 Anticheat/Admin/Tools · 10 Nischen + finale Duplikatprüfung über alles

## 5. Wichtige Quellen für die Recherche

github.com/orgs/Qbox-project/repositories · github.com/Renewed-Scripts · github.com/Project-Sloth ·
github.com/communityox · github.com/TheOrderFivem · github.com/topics/qbox ·
forum.cfx.re/c/releases · fivemx.com/qbox-scripts · docs.qbox.re ·
Shops: jgscripts.com, wasabiscripts.com, quasar-store.com, tgiann.com, stgscripts.com,
kuzquality.com, okok, codesign

## 6. Fachliche Grundregeln, die in der Bewertung zählen

- Qbox hat eine QBCore-Bridge. Scripts mit **harter** qb-inventory- oder qb-target-Abhängigkeit
  oder mit Patches an internen qb-core-Player-Funktionen brechen trotzdem → das ist das
  Kernkriterium jeder Kompatibilitätsbewertung
- ox_core und ox_mdt sind **nicht** Qbox-kompatibel (bestätigt); ox_lib, ox_inventory, ox_target,
  ox_doorlock schon
- qbx_radio ist archiviert, Nachfolger ist mm_radio
- jim_bridge macht die Jimathy-Scripts Qbox-fähig
- Scripts mit ox_lib- oder community_bridge-Support sind fast immer unproblematisch
