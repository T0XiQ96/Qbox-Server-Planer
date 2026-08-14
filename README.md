# Qbox Server-Planer

Ein offline nutzbares Planungs-Werkzeug für FiveM-Server auf Basis des **Qbox**-Frameworks.
Ein Katalog mit **500+ recherchierten Plugins** (Stand: v3.4-r50, 524 Einträge), dazu ein
Werkzeug, das dir hilft zu entscheiden, was du auf deinem Server installierst — inklusive
Abhängigkeiten, Konflikten, Alternativen und Warnungen vor kaputter QBCore-Kompatibilität.

Alles läuft als **eine einzige HTML-Datei**, ganz ohne Server, Internetverbindung oder
Installation. Doppelklick, fertig.

---

## Was das Tool kann

**Katalog & Suche**
- 500+ Plugins, kategorisiert in 14 Bereichen (Basis, Fahrzeuge, Wohnen, Staatliche Jobs,
  Crime, Kommunikation, Waffen, Wirtschaft, Admin, MLOs/Assets u. a.)
- Volltextsuche, Filter nach Kategorie, Framework, Preis, Lizenz, Qualität, Funktionsgruppe
- Facetten-Filter statt starrem UND — mehrere Filter kombinieren sich sinnvoll

**Zwei Umgebungen gleichzeitig planen**
- Getrennte Haken für **DEV**- und **MAIN**-Server pro Plugin
- Zeitstempel, wann ein Haken gesetzt wurde, Notizfeld pro Plugin, Prioritäts-Marker

**Beziehungen zwischen Plugins — das Kernstück**
- ⚠️ **Ersetzt**: konkurrierende Plugins für dieselbe Funktion (z. B. mehrere Tankstellen- oder
  Garagen-Systeme) werden als Gruppe erkannt, nur eines sollte installiert werden
- 🔗 **Synergie**: Plugins, die zusammen mehr können, aber auch einzeln funktionieren
- ➕ **Ergänzt**: ein Plugin liefert Zusatzfunktionen zu einem anderen, mit ausformuliertem
  Plus/Minus-Vergleich
- 📦 **Abhängigkeiten**: was vorausgesetzt wird, anklickbar verlinkt, mit Zyklus- und
  Vollständigkeitsprüfung
- 🪦 **Archiviert**: totes oder abgelöstes Repo, mit Nachfolger-Verweis, wenn bekannt

**Kompatibilitäts-Warnungen statt Bauchgefühl**
- Jedes Plugin trägt einen Beleggrad: `bestaetigt` (im Code/README nachgewiesen) oder
  `vermutung` (Indiz, aber nicht zweifelsfrei belegt) — nie geraten
- Laufender Prüfbericht mit Ein-Klick-Behebung für offene Warnungen
- Alt-Stack-Hinweise für Plugins mit harter `qb-inventory`/`qb-target`-Abhängigkeit, die unter
  reinem Qbox brechen können

**Vergleich**
- Beliebig viele Plugins nebeneinander vergleichen (Klick oder Drag & Drop in die Vergleichsleiste)
- Funktionsgruppen-Filter, um konkurrierende Alternativen direkt gegenüberzustellen

**Wissens-Datenbank**
- Eigener Reiter mit 42 Hintergrund-Artikeln zu 13 Themen (txAdmin, Server aufsetzen,
  Admins & Rechte, AntiCheat u. a.)

**Backup & Export**
- Dein Fortschritt (Haken, Notizen, Prioritäten) liegt lokal im Browser (`localStorage`),
  niemals der Katalog selbst — Export/Import als Backup-Datei mit Umbenennen-Dialog

---

## Schnellstart

1. Aktuellstes Release unter [**Releases**](../../releases) herunterladen
   (`qbox-planer-vX.X-rXX.html`)
2. Datei per Doppelklick öffnen — läuft im Browser über `file://`, keine Installation, kein
   Internet nötig, keine Daten verlassen deinen Rechner
3. Filtern, Haken setzen, Notizen schreiben — der Fortschritt bleibt beim nächsten Öffnen erhalten

---

## Open Source — nimm dir, was du brauchst

Das komplette Projekt steht unter der **MIT-Lizenz** (siehe [LICENSE](LICENSE)). Du darfst:

- die fertige `dist/qbox-planer.html` einfach benutzen
- den kompletten Katalog (`data/catalog/*.json`) für eigene Zwecke weiterverwenden oder
  in ein eigenes Tool einbauen
- den Quellcode (`src/`, `scripts/`) forken, verändern, selbst weiterbauen

Es sind keine privaten Daten, Zugangsdaten, IPs oder Server-Details irgendeiner Art im Repo
enthalten — alles hier ist recherchiertes Wissen über öffentlich verfügbare FiveM/Qbox-Plugins.

---

## Selbst weiter recherchieren oder das Tool erweitern

Das gesamte Projekt ist so aufgebaut, dass eine KI-Coding-Oberfläche (z. B.
**[Claude Code](https://claude.com/product/claude-code)**, aber auch andere Werkzeuge mit
Datei- und Terminalzugriff) den Katalog eigenständig weiter ausbauen oder das Tool
weiterentwickeln kann — das ist genau so entstanden.

### Voraussetzungen

- [Node.js](https://nodejs.org/) (für die Build-/Recherche-Skripte)
- Optional ein `GITHUB_TOKEN` in der Umgebung (hebt das GitHub-API-Limit für Recherchen von
  60 auf 5000 Anfragen/Stunde — ohne Token funktioniert alles trotzdem, nur langsamer)

```bash
npm install        # nur falls scripts/ externe Pakete braucht
npm run validate    # Katalog gegen Schema prüfen (Pflicht vor jedem Commit)
npm run build        # dist/qbox-planer.html neu bauen
npm run stats         # Katalog-Statistik (Anzahl je Kategorie/Qualität/Status)
npm run find <suchbegriff>   # ein Plugin suchen, ohne den ganzen Katalog zu laden
```

### Katalog erweitern (mit einer KI-Coding-Oberfläche)

1. Repo klonen, Ordner in **Claude Code** (oder einem vergleichbaren Werkzeug) öffnen
2. Die KI liest beim Start automatisch [`CLAUDE.md`](CLAUDE.md) — dort stehen alle
   Architektur- und Recherche-Regeln des Projekts (auf Deutsch)
3. Neue Plugins finden: `npm run discover -- --suche "qbox <thema>" --max 30 --runde N`
   sucht auf GitHub nach neuen Kandidaten und sortiert bereits Bekanntes automatisch aus
4. Mechanische Vorrecherche: `npm run prefetch -- --kandidaten --max 11 --runde N` holt
   Repo-Status, Lizenz, `fxmanifest`-Auszug und eine Code-Stichprobe für jeden Kandidaten
5. Die KI liest dieses Briefing und trifft die fachlichen Urteile (Kategorie, Framework,
   Qualität, Kompatibilität) — Details zur Methodik stehen in
   [`docs/RECHERCHE.md`](docs/RECHERCHE.md)
6. `npm run validate` muss grün sein, bevor etwas committet wird

Die wichtigste Regel dabei: **nichts erfinden.** Was sich nicht aus README, Quellcode oder
Repo-Metadaten belegen lässt, bekommt `qualitaet: "ungeprueft"` statt eines geratenen Werts.

### Projektstruktur

```
data/catalog/    Plugin-Katalog, aufgeteilt in Recherche-Runden (reine Daten, kein Code)
data/wissen/     Wissens-Datenbank-Artikel
schema/          JSON-Schema, gegen das der Katalog validiert wird
src/             App-Code (wird zu dist/qbox-planer.html gebaut)
scripts/         Node-Skripte: validate, build, discover, prefetch, stats, find, linkcheck
docs/            Projektdokumentation (Fortschritt, Entscheidungen, Recherche-Methodik)
```

**Wichtigste Regel im Code:** Daten (`data/`) und App (`src/`) sind strikt getrennt — ein
neues Plugin im Katalog erfordert nie eine Code-Änderung. Details in `CLAUDE.md`.

---

## Haftungsausschluss

Der Katalog ist eine Fleißarbeit, keine Garantie. Kompatibilitätsangaben mit dem Vermerk
„vermutung" sind Indizien, keine Zusicherung. Vor dem produktiven Einsatz eines Plugins
immer selbst die verlinkte Quelle prüfen — Repos verändern sich, werden verkauft, archiviert
oder umbenannt.
