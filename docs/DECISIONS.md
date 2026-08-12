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

## Offen / zu klären

- Ablageort des Repos (lokal vs. Unraid-Share).
