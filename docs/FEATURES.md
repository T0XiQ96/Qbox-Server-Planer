# FEATURES — Soll-Zustand des Tools

Vollständig aus dem ursprünglichen Chatverlauf und der v2.1-Datei zusammengetragen.
Status: `offen` / `gebaut` / `getestet`. Ein Feature gilt erst als fertig, wenn der Testfall
manuell durchgespielt wurde. Nichts aus dieser Liste darf bei einem Umbau verloren gehen —
`npm run validate` prüft nicht die Features, also ist diese Liste die einzige Absicherung.

**Stand 12.08.2026 (Ende Phase 1):** alle 59 Features `getestet` — durchgespielt in
`dist/qbox-planer.html` über `file://` mit den Demodaten aus `data/catalog/demo.json`.

Zwei Einschränkungen, die beim Nachtesten wichtig sind:

- Für Persistenz-Prüfungen muss die Seite **echt neu geladen** werden (Adresszeile/F5).
  Ein `location.reload()` aus der Entwicklerkonsole heraus lädt in manchen Vorschau-Umgebungen
  nicht wirklich neu — dann sieht man den alten Zustand aus dem Arbeitsspeicher und hält
  fälschlich für bewiesen, was gar nicht geprüft wurde.
- D7 „Sortierung" wirkt **innerhalb** der Kategorieblöcke, nicht über sie hinweg. Die Liste
  ist nach Kategorien gruppiert; alphabetisch sortiert wird je Block.

## A — Fortschritts-Tracking

| # | Feature | Testfall | Status |
|---|---|---|---|
| A1 | DEV- und MAIN-Haken pro Plugin | Haken setzen, Browser schließen, wieder öffnen → Haken da | getestet |
| A2 | Persistenz in localStorage, fester Key, Schema-Version + Migration | Alten Stand einspielen → wird übernommen, nichts verloren | getestet |
| A3 | Notizfeld pro Plugin (Config, resmon-Werte, Tests) | Notiz speichern, Reload → Notiz da | getestet |
| A4 | Priorität pro Plugin (🔥 hoch / 🟡 mittel / ⚪ niedrig) | Prio setzen, danach danach filtern und sortieren | getestet |
| A5 | Zeitstempel beim Setzen eines Hakens („seit TT.MM.JJJJ") | Haken setzen → Datum erscheint unter dem Schalter | getestet |
| A6 | Kategorie-Zähler in der Überschrift („3/8 auf MAIN") | Haken setzen → Zähler zählt hoch | getestet |

## B — Beziehungen zwischen Plugins

| # | Feature | Testfall | Status |
|---|---|---|---|
| B1 | ⚠️ **Ersetzt**: gleiche Funktion, nur eines installieren | Button zeigt alle Alternativen der Gruppe | getestet |
| B2 | 🔗 **Synergie**: gehört zusammen, funktioniert auch allein | ps-mdt ↔ qbx_policejob wird angezeigt | getestet |
| B3 | ➕ **Ergänzt**: liefert Zusatzfunktionen, die das andere nicht abdeckt, mit +/−-Vergleich | ps-realtor ergänzt ps-housing → was es bringt, was es kostet | getestet |
| B4 | 📦 **Abhängigkeit**: muss vorhanden sein, sonst startet es nicht | ox_lib ← ox_inventory, anklickbar verlinkt | getestet |
| B5 | Alle Querverweise anklickbar → springt zum Eintrag mit Highlight | Klick auf Alternative → Sprung + kurzes Aufblinken | getestet |
| B6 | Banner neben dem Namen: „⚠️ ersetzt durch XXX [MAIN]", XXX anklickbar | Getrennte Banner für DEV und MAIN, wenn unterschiedliche Plugins gewählt sind | getestet |
| B7 | Karte wird **nicht** ausgeblendet — nur der betroffene DEV- bzw. MAIN-Schalter abgeschwächt | ox_inventory auf MAIN → bei qs-inventory ist nur der MAIN-Schalter gestrichelt, DEV normal | getestet |

## C — Vergleichsmodus

| # | Feature | Testfall | Status |
|---|---|---|---|
| C1 | Vergleich nur sinnvoll innerhalb derselben Funktionsgruppe | Zwei Inventare vergleichen → automatischer Funktionsvergleich | getestet |
| C2 | Bei gleicher Gruppe: gemeinsame Funktionen / Bonusfunktionen je Seite werden ausgewiesen | „beide können X", „nur A kann Y" | getestet |
| C3 | Pro & Contra **für beide** Seiten, nie nur für eines | Grün = Vorteil, Rot = Nachteil, Orange = neutral/zu beachten | getestet |
| C4 | Bei grundverschiedenen Plugins: kein besser/schlechter, sondern Zweck + Features je Seite, mit Hinweis | Radio vs. Garage vergleichen → Hinweis „andere Use-Cases" | getestet |

## D — Filter, Suche, Sortierung

| # | Feature | Testfall | Status |
|---|---|---|---|
| D1 | Live-Volltextsuche (Name, Funktion, Kategorie) | „police" tippen → filtert, leere Kategorien werden ausgeblendet | getestet |
| D2 | Kategorie-Dropdown | — | getestet |
| D3 | Status-Filter: auf MAIN / auf DEV / nirgends / abgedeckt | — | getestet |
| D4 | Badge-Filter-Chips, mehrfach wählbar, UND-Logik | „✅ Qbox nativ" + „🆓 Kostenlos" → nur Schnittmenge | getestet |
| D5 | Qualitäts-Filter: verifiziert / teilgeprüft / ungeprüft | — | getestet |
| D6 | Diff-Ansicht: nur Plugins, wo DEV ≠ MAIN (= Deployment-Liste) | — | getestet |
| D7 | Sortierung: Standard / Name / letztes Update / Priorität | — | getestet |
| D8 | „↺ Zurücksetzen" setzt **nur** Suche und Filter zurück, niemals Daten | Haken setzen, Filter zurücksetzen → Haken unangetastet | getestet |

## E — Zahnrad-Menü / Datenverwaltung

| # | Feature | Testfall | Status |
|---|---|---|---|
| E1 | Backup-Manager: Snapshot anlegen / laden / kopieren / löschen | Backup, Haken ändern, Backup laden → alter Stand zurück | getestet |
| E2 | Zustand-Export und -Import als JSON | Export, in anderem Browser importieren → identischer Stand | getestet |
| E3 | Katalog-Update-Import (JSON), merged, Haken/Notizen bleiben unberührt | Runde importieren → „X neu, Y aktualisiert", Haken unverändert | getestet |
| E4 | Import-Fehler nennt Feld und Zeile — nie nur „ungültige Datei" | Kaputte Datei importieren → präzise Fehlermeldung | getestet |
| E5 | Getrenntes Zurücksetzen: DEV-Haken / MAIN-Haken / Notizen / alles | — | getestet |
| E6 | Vor jedem Reset automatisch ein Sicherheits-Snapshot | „Alles zurücksetzen" → Backup „vor Reset" liegt danach vor | getestet |
| E7 | Export/Backup enthält Zustand **und** eigene Plugins | — | getestet |
| E8 | Import zeigt eine Änderungsliste: was neu, was aktualisiert, mit `update_grund` in Klartext | Runde importieren → Liste erscheint vor dem Übernehmen | getestet |
| E9 | Hervorgehobene Warnung, wenn ein Update ein bereits auf DEV/MAIN gehaktes Plugin als archiviert, veraltet oder inkompatibel markiert | Plugin haken, Update mit `archiviert` importieren → rote Meldung mit Nachfolger-Vorschlag | getestet |
| E10 | Import-Vorschau lässt sich abbrechen, ohne dass etwas übernommen wird | — | getestet |

## F — Server-Betrieb

| # | Feature | Testfall | Status |
|---|---|---|---|
| F1 | ensure-Export für server.cfg, getrennt für DEV und MAIN | Kopierbar + Download als .cfg | getestet |
| F2 | Automatische Abhängigkeitsreihenfolge (Dependencies zuerst), zyklussicher | ox_inventory vor qbx_core? → korrekt sortiert | getestet |
| F3 | Rote Warnung im Export bei fehlenden Abhängigkeiten | ox_inventory ohne ox_lib haken → Warnung oben im Export | getestet |
| F4 | Konflikt-Warner beim Haken setzen (nicht parallel installieren) | ox_fuel + ps-fuel → Popup | getestet |
| F5 | Abhängigkeits-Warner beim Haken setzen | — | getestet |
| F6 | Bundle-Erkennung („JG Mechanic enthält Garagen-Features → Konflikt mit cd_garage möglich") | — | getestet |
| F7 | Kosten-Tracker, getrennt nach einmalig und €/Monat, für MAIN und DEV | Premium-Plugin haken → Summe steigt in der richtigen Spalte | getestet |

## G — Informationen pro Plugin

| # | Feature | Testfall | Status |
|---|---|---|---|
| G1 | Beschreibung 2–3 Sätze + Funktionsliste | — | getestet |
| G2 | Badges: ✅ Qbox nativ / 🔁 QBCore-Bridge / 🌐 Standalone / 🔓 Open Source / 🔒 Escrow / 💰 Premium / 🆓 Kostenlos | — | getestet |
| G3 | ⚠️ Kompatibilitäts-Badge mit Tooltip: Grund + „bestätigt" oder „Vermutung" | Mouseover → ausführlicher Text | getestet |
| G4 | 🪦 Archiviert-Markierung mit Nachfolger-Hinweis (qbx_radio → mm_radio) | — | getestet |
| G5 | Legacy-/Alt-Stack-Hinweis (qb-inventory, ghmattimysql, vSync, gcphone, LegacyFuel, mysql-async, TokoVoIP): bleibt gelistet, klar als „alter Stack, nicht Qbox-Standard" markiert | — | getestet |
| G6 | Version, letztes Update, Autor, Quelle | — | getestet |
| G7 | 🔗 Link-Status + Prüfdatum („geprüft TT.MM.JJJJ" / „ungeprüft" / „404") | — | getestet |
| G8 | Preis mit Währung und Typ (einmalig vs. Abo) | — | getestet |
| G9 | Kennzeichnung „unabdingbar" vs. „nützlich" | Filter auf „nur essenziell" | getestet |
| G10 | Praxis-Tipp-Feld (Balancing, Performance, Doppel-Systeme vermeiden) | — | getestet |
| G11 | Qualitäts-Kennzeichnung: verifiziert / teilgeprüft / ungeprüft | — | getestet |

## H — Rahmen

| # | Feature | Testfall | Status |
|---|---|---|---|
| H1 | Warnbox oben: Qbox↔QBCore-Kompatibilitätsregeln (Bridge, harte qb-inventory/qb-target-Abhängigkeit, Core-Patching) | — | getestet |
| H2 | „➕ Eigenes Plugin hinzufügen"-Formular, landet im Zustand und im Export | Eigenes Plugin anlegen, exportieren, importieren → noch da | getestet |
| H3 | Dark Theme, GitHub-Stil | — | getestet |
| H4 | Katalogversion + Plugin-Anzahl in der Toolbar sichtbar | — | getestet |
| H5 | Läuft per Doppelklick über file://, ohne Server, ohne Internet | Datei auf USB-Stick, offline öffnen → funktioniert | getestet |
| H6 | Alles auf Deutsch | — | getestet |
