# FEATURES — Soll-Zustand des Tools

Vollständig aus dem ursprünglichen Chatverlauf und der v2.1-Datei zusammengetragen.
Status: `offen` / `gebaut` / `getestet`. Ein Feature gilt erst als fertig, wenn der Testfall
manuell durchgespielt wurde. Nichts aus dieser Liste darf bei einem Umbau verloren gehen —
`npm run validate` prüft nicht die Features, also ist diese Liste die einzige Absicherung.

**Stand 12.08.2026 (Ende Phase 1):** alle 59 Features `getestet` — durchgespielt in
`dist/qbox-planer.html` über `file://` mit den Demodaten aus `data/catalog/demo.json`.

**Stand 14.08.2026 (Ausbau-Runde 1):** 8 neue Features (B8, B9, C5, D9, F8, F9, F10) und eine
geänderte Filterregel (D4: UND → Facetten-Logik, siehe `docs/DECISIONS.md` D20). Geprüft am
echten Build mit dem vollen Katalog (404 Plugins), nicht mit Demodaten.

**Stand 14.08.2026 (Ausbau-Runde 2):** 4 neue Features (C6-C9) — der Vergleichskorb mit
⚖️-Knopf je Karte, eigenem Suchfeld, vollständigen Karten im Vergleich und Drag&Drop als
Zusatzweg (`docs/DECISIONS.md` D23).

**Wie diese Runde geprüft wurde — wichtig fürs Nachtesten:** Das Browser-Werkzeug verweigert
`file://`, deshalb lief der Test über einen lokalen HTTP-Server auf dieselbe gebaute Datei, mit
im Seitenkontext ausgeführten Klick-/Eingabe-Folgen statt von Hand. Fachlich ist das derselbe
Durchlauf, **aber H5 (Doppelklick über `file://`) ist damit ausdrücklich NICHT erneut belegt** —
das bleibt ein Handgriff für den nächsten echten Öffnen-Test. Zwei Stolpersteine, die dabei
auffielen und beim nächsten Skript-Test Zeit sparen: nach jedem Haken zeichnet `zeichneListe()`
die Liste neu, eine gemerkte DOM-Referenz auf einen Schalter ist danach abgehängt und ein darauf
abgefeuertes `change` erreicht den Listener nicht mehr (immer frisch abfragen); und die Suche
läuft 150 ms entprellt, ein `input`-Ereignis wirkt also nicht sofort.

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
| B8 | Sprung auf ein **ausgefiltertes** Plugin öffnet dessen vollständige Karte im Detail-Fenster; Suche und Filter dahinter bleiben unangetastet | Nach „blackmarket" suchen, dort auf `ox_lib` klicken → Fenster mit ox_lib, Liste dahinter weiter bei 1 Treffer | getestet |
| B10 | `archiviert.nachfolger` ist eine Katalog-ID und erscheint als **eigene anklickbare Zeile auf der Karte** (nicht mehr als rohe ID im Tooltip); nicht auflösbare Nachfolger werden als solche markiert statt behauptet | `legacyfuel` → Zeile „🪦 Nachfolger: ox_fuel", anklickbar | getestet |
| B9 | Zurück-Navigation als **Stapel**: schwebender Knopf in der Liste, „← Zurück" im Fenster; ✕/Esc führt an den Ausgangspunkt zurück | ox_lib → ox_inventory → Zurück → ox_lib; Sprung in der Liste → „← Zurück zu XXX" | getestet |

## C — Vergleichsmodus

| # | Feature | Testfall | Status |
|---|---|---|---|
| C12 | **Ein einziger Vergleich für alles**: der ⚖️-Knopf im Kopf öffnet dasselbe Fenster wie ⚖️ auf einer Karte. Der frühere separate Zweiervergleich mit zwei Auswahlfeldern ist entfallen — er konnte weniger (keine Karten, kein Mehrfach-Hinzufügen) | Kopf-⚖️ → Vergleichsfenster mit Suche und Auswahlliste, kein Auswahlfeld-Paar mehr | getestet |
| C13 | **Funktionsgruppe als Ganzes** direkt im Vergleichsfenster wählbar (über der Suche) | Gruppe „hud" wählen → 6 Karten im Vergleich | getestet |
| C14 | Das Vergleichsfenster nutzt die **volle Fensterbreite**, Karten stehen nebeneinander; bei schmalem Fenster stapeln sie wieder | Vollbild → 96 % Breite, 6 Karten in 3 Spalten | getestet |
| C15 | Das ＋ steht **rechts** an jedem Treffer, immer an derselben Stelle — mehrere hintereinander hinzufügen, ohne die Maus zu suchen | Treffer-Zeile: Name, Kategorie, ＋ als letztes Element | getestet |
| C1 | Vergleich nur sinnvoll innerhalb derselben Funktionsgruppe (seit C12 über den Mehrfachvergleich mit zwei Einträgen) | Zwei Inventare vergleichen → automatischer Funktionsvergleich | getestet |
| C2 | Bei gleicher Gruppe: gemeinsame Funktionen / Bonusfunktionen je Seite werden ausgewiesen | „beide können X", „nur A kann Y" | getestet |
| C3 | Pro & Contra **für beide** Seiten, nie nur für eines | Grün = Vorteil, Rot = Nachteil, Orange = neutral/zu beachten | getestet |
| C4 | Bei grundverschiedenen Plugins: kein besser/schlechter, sondern Zweck + Features je Seite, mit Hinweis | Radio vs. Garage vergleichen → Hinweis „andere Use-Cases" | getestet |
| C5 | Vergleich über **beliebig viele** Einträge als Tabelle (Status, Framework, Lizenz, Preis, Prüfstand, Update, Zustand, „nur hier", pro/contra/neutral) | „⚖️ Alle N vergleichen" im Ersetzt-Block; über ⚖️ auch je Funktionsgruppe wählbar | getestet |
| C6 | **Vergleichskorb**: ⚖️ oben rechts auf jeder Karte, einfacher Klick legt hinein und öffnet das Fenster; die Leiste dockt oben am Kopf an und übersteht Filter- und Suchwechsel | ⚖️ auf ps-hud → Fenster offen, Chip in der Leiste | getestet |
| C7 | Im Vergleichsfenster **eigenes Suchfeld** mit derselben Logik wie die Hauptsuche; Treffer-Reihenfolge: erst die Alternativen des ersten Eintrags (als „Alternative" markiert), dann alles Übrige alphabetisch | „house" tippen → 7 Treffer über Name **und** Beschreibung; bei ps-hud stehen die 5 HUD-Alternativen vorn | getestet |
| C8 | Im Vergleich steht jedes Plugin als **vollständige Karte** (Name, Badges, Beschreibung, Meta, Abwägung); die Vergleichstabelle kommt **darunter**, nicht statt der Karten | Zwei Einträge wählen → 2 vollständige Karten, danach die Tabelle mit 2 Spalten | getestet |
| C10 | Der Vergleich **benennt die tatsächliche Beziehung** (Konflikt / Alternativen / Nachfolge / Abhängigkeit / Synergie) statt pauschal „verschiedene Zwecke"; die Unterschiedstabelle startet nur bei echten Alternativen aufgeklappt | Abhängigkeit vergleichen → „X braucht Y — beide gehören auf den Server, kein Entweder-oder", Tabelle zu; zwei HUDs → „genau eines gehört auf den Server", Tabelle offen | getestet |
| C11 | Auswahlliste im Vergleich **ohne Trefferdeckel** — der ganze Katalog ist durchscrollbar | Fenster ohne Suchbegriff öffnen → alle 404 Einträge, kein „… und N weitere" | getestet |
| C9 | ⚖️ lässt sich **in die Leiste ziehen** (Zusatzweg, kein Pflichtweg): die Leiste erscheint beim Ziehbeginn als sichtbare Ablagefläche, der Abwurf legt hinein **ohne** das Fenster zu öffnen. Kein Long-Press. | oxmysql-⚖️ ziehen → Leiste erscheint mit „hierher ziehen", Abwurf legt es hinein, Fenster bleibt zu | getestet |

## D — Filter, Suche, Sortierung

| # | Feature | Testfall | Status |
|---|---|---|---|
| D1 | Live-Volltextsuche (Name, Funktion, Kategorie) | „police" tippen → filtert, leere Kategorien werden ausgeblendet | getestet |
| D2 | Kategorie-Dropdown | — | getestet |
| D3 | Status-Filter: auf MAIN / auf DEV / nirgends / abgedeckt | — | getestet |
| D4 | Badge-Filter-Chips, mehrfach wählbar, **Facetten-Logik**: innerhalb einer Facette (Framework / Lizenz / Preis) ODER, zwischen den Facetten UND | „Qbox nativ" + „Bridge" → beide Sorten (233); dazu „Escrow" → nur davon die Escrow-Einträge (29); alle vier Framework-Chips → alle 404 | getestet |
| D5 | Qualitäts-Filter: verifiziert / teilgeprüft / ungeprüft | — | getestet |
| D6 | Diff-Ansicht: nur Plugins, wo DEV ≠ MAIN (= Deployment-Liste) | — | getestet |
| D7 | Sortierung: Standard / Name / letztes Update / Priorität | — | getestet |
| D8 | „↺ Zurücksetzen" setzt **nur** Suche und Filter zurück, niemals Daten | Haken setzen, Filter zurücksetzen → Haken unangetastet | getestet |
| D9 | Filter „⚠️ nur mit Warnung": zeigt genau die Plugins aus dem Prüfbericht — auch die fehlenden Abhängigkeiten selbst, damit man sie direkt setzen kann | Plugin mit fehlender Abhängigkeit haken → Filter zeigt beide (das Plugin und das Fehlende) | getestet |

## E — Zahnrad-Menü / Datenverwaltung

| # | Feature | Testfall | Status |
|---|---|---|---|
| E1 | Backup-Manager: Snapshot anlegen / laden / kopieren / löschen | Backup, Haken ändern, Backup laden → alter Stand zurück | getestet |
| E11 | Beim Anlegen eines Backups wird **Datum + Uhrzeit vorgeschlagen**, der Name ist änderbar, mit Anlegen/Abbrechen; Enter bestätigt | „Backup anlegen" → Feld mit „Backup 14.8.2026, 10:54:14", überschreiben → Backup trägt den eigenen Namen | getestet |
| E12 | Backups lassen sich in der Verwaltung **umbenennen**; die Liste bleibt danach offen | „Umbenennen" → Feld mit altem Namen vorbelegt → Name geändert, Liste wieder da | getestet |
| E13 | Der Zustand-Export trägt **Datum und Uhrzeit im Dateinamen** (nicht nur im JSON) | Exportieren → `qbox-planer-stand_2026-08-14_1054.json` | getestet |
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
| F8 | **Laufender Prüfbericht ganz oben**, je Umgebung: Konflikt, doppelt belegte Funktion, fehlende Abhängigkeit (Fehler); archiviert, toter Link, bestätigte Inkompatibilität (Warnung); Bundle (Hinweis). Nicht erst im Export. | Plugin mit fehlender Abhängigkeit haken → Bericht erscheint sofort mit „2 Fehler" | getestet |
| F9 | **Ein-Klick-Behebung** im Prüfbericht: „＋ setzen" hakt die fehlende Abhängigkeit direkt | Auf „＋ setzen" klicken → Abhängigkeit gehakt, Fund verschwindet, Bericht wird grün | getestet |
| F11 | Im Prüfbericht ist **der genannte Partner anklickbar** (⚖️ davor) und öffnet den Vergleich — links das Plugin mit dem Problem, rechts der Partner. Gilt für fehlende Abhängigkeit, Konflikt, „doppelt" und Nachfolger | „Braucht ⚖️ ox_lib" klicken → Vergleich mit beiden Karten in dieser Reihenfolge | getestet |
| F12 | In den ungenutzten Synergien ist der **Grund** anklickbar; bei mehreren Gründen zusätzlich „⚖️ alle vergleichen" | Synergie-Fenster → „🔗 Synergie mit ⚖️ qbx_hud" öffnet den Vergleich | getestet |
| F10 | Zähler **„ungenutzte Synergien"** je Umgebung neben den Kosten; Klick listet auf, was zum aktuellen Stand noch dazupasst (`synergie` + `ergaenzt`, beide Richtungen), je mit „＋ setzen" | ox_lib auf MAIN → „🔗 2 ungenutzte Synergien" → ox_inventory, ox_target | getestet |

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
| H7 | Die Warnbox ist **ein- und ausklappbar und merkt sich den Zustand** über Neuladen hinweg — **außer** ein Update bringt neuen Inhalt, dann klappt sie einmalig wieder auf | Zuklappen, neu laden → bleibt zu. Inhaltsmarke zurücksetzen, neu laden → wieder offen, neue Marke gespeichert | getestet |
| H2 | „➕ Eigenes Plugin hinzufügen"-Formular, landet im Zustand und im Export | Eigenes Plugin anlegen, exportieren, importieren → noch da | getestet |
| H3 | Dark Theme, GitHub-Stil | — | getestet |
| H4 | Katalogversion + Plugin-Anzahl in der Toolbar sichtbar | — | getestet |
| H5 | Läuft per Doppelklick über file://, ohne Server, ohne Internet | Datei auf USB-Stick, offline öffnen → funktioniert | getestet |
| H6 | Alles auf Deutsch | — | getestet |
