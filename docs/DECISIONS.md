# DECISIONS — getroffene Entscheidungen

Jede Entscheidung bleibt gültig, bis sie hier ausdrücklich widerrufen wird.
Nichts hiervon still umwerfen — bei Zweifeln nachfragen.

| # | Entscheidung | Begründung | Datum |
|---|---|---|---|
| D1 | Daten (`data/`) und App (`src/`) strikt getrennt, Auslieferung als gebaute Einzeldatei `dist/qbox-planer.html` | Der Vorgänger hatte alles in einer HTML-Datei; ab ~88 Plugins ging bei jedem Rebuild etwas verloren | 11.08.2026 |
| D2 | JSON Schema + `npm run validate` als Pflicht-Gate vor jedem Commit | Verhindert den Fehler „Ungültige Katalog-Datei" strukturell | 11.08.2026 |
| D3 | Im localStorage liegt nur der Nutzerzustand, nie der Katalog | 5-MB-Limit; mit 500+ Plugins plus Backups läuft das über | 11.08.2026 |
| D3a | **Präzisierung von D3** (12.08.2026): Der VOLLE Katalog bleibt weiterhin aus dem localStorage draußen — er steckt fest in der gebauten HTML-Datei. Gespeichert wird ausschließlich die **Import-Differenz**: Einträge, die per Katalog-Import dazukamen oder sich änderten. Dazu drei Sicherungen: (a) eine Größenüberwachung, die warnt, bevor es eng wird, (b) Backups und Zustand-Export enthalten die Differenz NICHT (sie sichern meinen Stand, nicht Katalogdaten), (c) eine Möglichkeit, die Differenz zu verwerfen. Grund: ohne Persistenz wäre ein Import nach jedem Neuladen weg; automatisches Nachladen von `data/catalog/*.json` scheidet aus, weil `fetch` über `file://` blockiert ist (H5). Die Differenz hängt am Browser, nicht an der Datei — für den Wechsel auf einen anderen Rechner bleiben Zustand-Export und `npm run build` der Weg | 12.08.2026 |
| D4 | localStorage-Key bleibt über alle Versionen konstant, Änderungen nur über Migration | Sonst sind die Haken des Nutzers nach einem Update weg | 11.08.2026 |
| D5 | Git von Anfang an, Commit nach jedem Schritt und jeder Runde | Rückkehr zu einer funktionierenden Version muss jederzeit möglich sein | 11.08.2026 |
| D6 | Eine JSON-Datei pro Recherche-Runde, IDs global eindeutig | Nachvollziehbarkeit und Duplikatprüfung über alle Runden | 11.08.2026 |
| D7 | Qualitätsstufen `verifiziert` / `teilgeprueft` / `ungeprueft` statt „alles verifiziert" | 1000 Einträge sind machbar, 1000 einzeln geprüfte nicht — die Unsicherheit wird sichtbar gemacht statt versteckt | 11.08.2026 |
| D8 | Link-Prüfung läuft als Script (`npm run linkcheck`), nicht als Modellarbeit | Hunderte URLs in Minuten statt Kontextverbrauch; Tebex-Shops mit Bot-Schutz bleiben „ungeprüft" | 11.08.2026 |
| D9 | Alte qb-Stacks und Legacy-Scripts bleiben im Katalog, markiert statt gelöscht | Ausdrücklicher Wunsch: einordnen, nicht entfernen — man muss die Fallen erkennen können | 11.08.2026 |
| D10 | Vergleich nur innerhalb derselben Funktionsgruppe automatisch; sonst nur Zweckbeschreibung | Zwei grundverschiedene Plugins zu „bewerten" wäre irreführend | 11.08.2026 |
| D11 | Nur zwei Umgebungen: DEV und MAIN, keine dritte Stufe | Ausdrücklich so gewünscht | 11.08.2026 |
| D12 | Preise vollständig erfassen, keine Obergrenze, getrennt nach einmalig und Abo | Ausdrücklich so gewünscht | 11.08.2026 |
| D13 | `reference/qbox-server-planer-v2-1.html` ist eingefrorene Referenz, wird nicht weiterentwickelt | Logik als Vorlage nutzen, Bugs nicht mitschleppen | 11.08.2026 |
| D14 | Alle Inhalte und Dokus auf Deutsch | — | 11.08.2026 |
| D15 | Scripts (`scripts/`) und der JSON-Fehlerlokalisierer (`src/lib/jsonfehler.js`) kommen ohne npm-Abhängigkeiten aus, kein `node_modules` | Das Repo muss auch in Jahren noch ohne `npm install` laufen | 12.08.2026 |
| D16 | Zusätzliches Schema-Feld `ressource` (optional, Standard = `id`) | `id` ist der stabile Katalog-Schlüssel für Querverweise, der ensure-Export im Tool nutzt aber `ressource` — Autoren benennen Ordner anders als die Katalog-ID (Bsp. kimi: `keep_bags` vs. Ordner `keep-bags`) | 12.08.2026 |
| D17 | Bei ID-Kollision zwischen v2.1-Altbestand und kimi-Katalogen (Phase 2) gewinnt kimi **feldweise**: widersprüchliche Felder werden überschrieben, Felder, die kimi nicht kennt (z.B. `ergaenzt` mit plus/minus aus v2.1), bleiben erhalten. Jede Überschreibung kommt in einen Konfliktbericht zur Durchsicht | kimi ist die neuere Recherche (z.B. Archiv-Kette von `ox_inventory`), v2.1 hat aber Datenfelder, die kimi nicht abbildet — beides wegwerfen wäre Datenverlust | 12.08.2026 |
| D18 | Der gesamte Altbestand (88 aus v2.1 **und** 140 aus kimi, Phase 2) bekommt `qualitaet: "ungeprueft"` und leeres `geprueft_am` | Keiner der Einträge ist nach `docs/RECHERCHE.md` entstanden — konsequent ehrlich markieren statt gepflegter aussehen zu lassen, als es ist | 12.08.2026 |
| D19 | Katalogdaten entstehen ab jetzt ausschließlich hier im Projekt: Recherche-Runden laufen in Claude Code mit **Sonnet 5** über Subagents nach `docs/RECHERCHE.md`. Keine Zulieferung mehr durch fremde Modelle/Tools | Die kimi-Kataloge (fremd zugeliefert) enthielten 6 Syntaxfehler, die erst der eigene Validator fand — Fremddaten ohne unser Gate sind ein Risiko. Die beiden kimi-Dateien bleiben einmaliger Altbestand für Phase 2, kein laufender Weg | 12.08.2026 |
| D20 | **Badge-Filter-Chips arbeiten nach Facetten-Logik statt reinem UND** (widerruft die ursprüngliche Regel in FEATURES.md D4): innerhalb einer Facette (Framework / Lizenz / Preis) ODER, zwischen den Facetten UND. Ein Chip, der zu keiner Facette gehört, bleibt beim strengen UND | Ein Plugin hat aus jeder Facette genau einen Wert — `framework` ist ein Enum, kein Array. Reines UND über alle Chips liefert deshalb bei „Qbox nativ" + „QBCore-Bridge" zwangsläufig eine leere Liste, was wie ein Fehler aussieht. Gewollt ist „zeig mir beide Sorten". Nachgemessen am vollen Katalog: 233 Treffer für Qbox∪Bridge, davon 29 mit Escrow, alle vier Framework-Chips = alle 404 | 14.08.2026 |
| D21 | Die rückwärts gerichteten Beziehungsabfragen (`wer ergänzt mich`, `wer nennt mich als Konflikt`, `wer ist in meiner Gruppe`, `wer nennt mich als Synergie`) werden **einmal je Katalogstand vorberechnet** und in einer `WeakMap` an der Index-Map selbst zwischengespeichert | Sie wurden für jede sichtbare Karte einzeln beantwortet, jede mit einem vollen Katalogdurchlauf — bei 400 Plugins rund eine Million Durchläufe je Neuzeichnen, bei den angepeilten 1000 das Sechsfache. Die WeakMap lässt alle Funktionssignaturen unverändert und verfällt von allein, weil `baueIndex()` bei jedem neuen Katalogstand eine neue Map erzeugt. Haken und Notizen ändern die Beziehungsstruktur nicht und dürfen den Speicher deshalb auch nicht verwerfen | 14.08.2026 |
| D22 | Ein Sprung auf ein Plugin, das gerade **ausgefiltert** ist, öffnet dessen vollständige Karte in einem Detail-Fenster — Suche und Filter bleiben unangetastet. Rückweg über einen Zurück-**Stapel** (schwebender Knopf in der Liste, „← Zurück" im Fenster); ✕/Esc führt an den Ausgangspunkt der Kette zurück | Vorher scheiterte der Sprung still und meldete „nicht im Katalog", was schlicht falsch war. Die Alternative — Filter automatisch zurücksetzen — wurde ausdrücklich verworfen: der gerade eingestellte Filter ist Arbeitszustand und darf nicht durch einen Klick auf einen Querverweis verlorengehen | 14.08.2026 |
| D23 | Der Vergleich läuft über **einen** gemeinsamen Korb, gefüllt auf drei Wegen (⚖️ auf der Karte, Auswahlliste im Fenster, „Alle N vergleichen"). Bedient wird er mit **einfachem Klick**; Drag&Drop ist ein Zusatzweg, **Long-Press ausdrücklich nicht**. Der Korb lebt nur im Arbeitsspeicher | Long-Press wurde vom Nutzer vorgeschlagen und nach Erläuterung verworfen („perfekt mach es so"): die Geste ist unsichtbar, zeigt keinen Zustand und kollidiert mit dem Markieren von Text. Drag&Drop allein scheidet als einziger Weg aus, weil es auf Touch kein echtes HTML5-Ziehen gibt — deshalb erscheint die Leiste beim Ziehbeginn als sichtbare Ablagefläche und der Klickweg bleibt vollwertig. Der Korb ist Arbeitszustand wie Suche und Filter (D8-Gedanke) und gehört damit nicht in den localStorage | 14.08.2026 |

## Korrektur: Ursache der kaputten kimi-Kataloge (CLAUDE.md §4)

Der ursprüngliche Verdacht — die kimi-Kataloge seien JS-Objektliterale mit unquotierten Keys —
war **falsch**. Tatsächlich sind die Keys korrekt quotiert. Es waren exakt 6 punktuelle Tippfehler
(3 je Datei, in `reference/kimi-kataloge/katalog-runde-01.json` und `-02.json`): zweimal ein
fehlendes öffnendes bzw. schließendes Anführungszeichen an einem Feldnamen (`cons":`/`"cons:`,
`"pros:`), und dreimal ein deutsches Anführungszeichen `„…"` im Fließtext, dessen schließendes
Zeichen ein gerades `"` statt `“` oder `\"` war. Nach Reparatur parsen beide Dateien sauber:
83 + 57 = 140 Einträge. Der v2.1-Importer verschluckte den Parse-Fehler in einem `catch` und zeigte
nur „⚠️ Ungültige Katalog-Datei" — das ist Feature E4 in `docs/FEATURES.md`. Der neue
JSON-Fehlerlokalisierer (`src/lib/jsonfehler.js`, von `scripts/validate.mjs` UND vom
Katalog-Import in der App genutzt) benennt stattdessen Datei, Zeile, Spalte, betroffenes Feld und
Ursache im Klartext — mit genau diesen sechs Fällen regressionsgetestet in `scripts/selftest.mjs`.
Die Originaldateien in `reference/kimi-kataloge/` bleiben unverändert.

## Korrektur: tatsächliche Größe des v2.1-Altbestands (Plan/CLAUDE.md nannten 88)

Der Plan und `docs/PROGRESS.md` gingen vor der Umsetzung von Phase 2 von 88 Plugins in
`reference/qbox-server-planer-v2-1.html` aus — eine grobe Schätzung, nicht gezählt. Das
tatsächliche `RAW`-Array enthält **124 eindeutige Einträge** (keine Duplikate), ausgewertet von
`scripts/import/von-v21.mjs` per Node-`vm`. Zusammen mit den 140 kimi-Einträgen (83 + 57) und 8
Kollisionen (D17, kimi gewinnt feldweise) ergibt das 256 Plugins in `data/catalog/altbestand.json`.
Fünf v2.1-IDs enthielten Großbuchstaben (`okokGarage`, `LegacyFuel`, `okokPhone`, `vSync`,
`okokBanking`) und wurden beim Mapping kleingeschrieben, weil die Schema-ID-Regel
(`^[a-z0-9][a-z0-9_-]*$`) das verlangt — alle Querverweise (`deps`/`conflicts`/`synergy`) sind
konsistent mitkleingeschrieben, dieselbe Normalisierungsfunktion läuft auf beiden Seiten.
(12.08.2026)

## Offen / zu klären

- Ablageort des Repos (lokal vs. Unraid-Share).
