# Projekt: Qbox Server-Planer

Offline nutzbares HTML-Tool zum Planen eines FiveM/Qbox-Servers (DEV + MAIN).
Katalogziel: 500–1000+ Plugins, gefüllt in vielen Recherche-Runden.
Alle Antworten, Dokus und Plugin-Beschreibungen auf **Deutsch**.

---

## 0. SESSION-START — immer zuerst, ohne Nachfrage

Bei jedem neuen Chat führst du diese Schritte aus, bevor du irgendetwas anderes tust:

1. Lies in dieser Reihenfolge:
   - `docs/PROGRESS.md`   → wo stehen wir, was ist der nächste Schritt
   - `docs/FEATURES.md`   → Feature-Checkliste mit Status
   - `docs/DECISIONS.md`  → getroffene Entscheidungen (nicht still umwerfen)
   - `docs/MODELS.md`     → welches Modell für diese Art Aufgabe richtig ist
   - `docs/RECHERCHE.md`  → wie ein Katalogeintrag entsteht (nur vor Recherche-Runden nötig)
2. Führe `git log --oneline -10` aus, um den letzten echten Stand zu sehen.
3. Führe `npm run validate` aus. Ist es rot, ist Reparieren die erste Aufgabe — egal was ich sonst schreibe.
4. Prüfe den in `docs/MODELS.md` hinterlegten Modell-Check (Punkt 1 unten). Passt das aktive Modell
   nicht zur Aufgabe, sag mir das in einem Satz, **bevor** du anfängst.
5. Melde mir in maximal 5 Zeilen: Stand, nächster Schritt laut PROGRESS.md, Validate-Status.

Lies **niemals** den kompletten Katalog in den Kontext. Für Datenfragen gibt es `npm run stats`
und `npm run find <suchbegriff>`.

---

## 1. Modellwahl — vor dem Start prüfen

| Aufgabe | Modell | Effort |
|---|---|---|
| Architektur, Schema-Änderung, App-Code in `/src/`, Build-/Validator-Scripts | **Opus 5** | high, bei Architekturentscheidungen xhigh |
| Recherche-Runden, Katalogdaten in `/data/`, Link-Checks, Import-Fixes an Daten | **Sonnet 5** | medium, bei vielen Kompatibilitätsurteilen high |
| Reine Dateiumbenennung, Formatierung | Sonnet 5 | low |

**Faustregel: wird `/src/` angefasst → Opus. Wächst nur `/data/` → Sonnet.**

Wenn ich eine `/src/`-Aufgabe stelle und du läufst auf Sonnet, schreib zuerst:
„Das betrifft App-Code — bitte mit `/model claude-opus-5` neu starten." und warte.
Umgekehrt bei einer reinen Datenrunde auf Opus: weise auf den unnötigen Aufwand hin, arbeite aber weiter.

---

## 2. Nicht verhandelbare Architekturregeln

1. **Daten und App sind getrennt.** Plugin-Daten ausschließlich in `data/catalog/*.json`,
   App-Code ausschließlich in `src/`. Ein neues Plugin darf **niemals** eine Änderung in `src/` erfordern.
2. **Ausgeliefert wird immer eine gebaute Einzeldatei:** `npm run build` → `dist/qbox-planer.html`.
   Muss per Doppelklick über `file://` ohne Server laufen.
3. **`npm run validate` muss grün sein**, bevor etwas committet oder als fertig gemeldet wird.
   Geprüft wird: JSON-Schema, doppelte IDs über alle Runden, Pflichtfelder, kaputte Querverweise
   (`ersetzt`/`synergie`/`ergaenzt`/`abhaengigkeiten` zeigen auf existierende IDs).
4. **Keine erfundenen Fakten.** Nicht verifizierbares bekommt `qualitaet: "ungeprueft"` und
   `link_status: "ungeprueft"`. Lieber ein Feld leer als falsch.
5. **Nach jedem Arbeitsschritt:** `docs/PROGRESS.md` und `docs/CHANGELOG.md` fortschreiben,
   dann `git commit` mit aussagekräftiger Message.
6. **Nichts löschen, was ich schon habe.** Alte qb-Stacks, Legacy-Scripts und archivierte Repos
   bleiben im Katalog und werden über `stack_hinweis` / `archiviert` eingeordnet, nicht entfernt.
7. **Kein Rebuild der App bei Datenzuwachs.** Datenrunden ändern nur `data/`.

---

## 3. Wenn der Kontext eng wird

Bevor der Kontext vollläuft (spätestens bei ~70 %):
1. `docs/PROGRESS.md` auf den aktuellen Stand schreiben — inklusive „Woran ich gerade sitze" und
   allem, was ich sonst beim Neustart nicht mehr wüsste.
2. Committen.
3. Mir sagen: „Bitte `/clear` und neue Session — Stand ist gesichert."

Niemals eine Aufgabe halbfertig weiterschleppen, ohne dass sie in PROGRESS.md steht.
Recherche immer über Subagents laufen lassen (Task-Tool), damit Rohtext von Webseiten
nicht im Hauptkontext landet — nur das fertige Ergebnis kommt zurück.

---

## 4. Bekannte Fallstricke (aus dem gescheiterten Vorgängerprojekt)

- Alles in eine HTML-Datei zu packen führt bei jedem Rebuild zu Feature-Verlust. Nie wieder.
- Katalog-JSON muss **echtes JSON** sein (Keys in Anführungszeichen). Der Vorgänger zeigte bei
  einer kaputten Import-Datei nur „Ungültige Katalog-Datei" ohne Fundstelle — nicht, weil dort
  JS-Objektliterale geliefert wurden (das war ein falscher Verdacht, siehe `docs/DECISIONS.md`
  „Korrektur: Ursache der kaputten kimi-Kataloge"), sondern weil sechs einzelne Anführungszeichen
  fehlten oder falsch gesetzt waren. Der Validator (`src/lib/jsonfehler.js`) fängt beides ab und
  nennt Datei, Zeile, Spalte, Feld und Ursache im Klartext.
- Defaults müssen auf **alle** Datenquellen angewandt werden, nicht nur auf den eingebauten Katalog,
  sonst crasht das Rendern bei einem fehlenden Feld.
- Der localStorage-Key bleibt über alle Versionen konstant, sonst sind meine Haken weg.
- In den localStorage gehört **nur mein Zustand**, nie der Katalog (5-MB-Limit).
- Platzhalter-Marken im HTML-Rahmen (`src/index.html`) dürfen in Kommentaren nicht wörtlich
  erwähnt werden — `scripts/build.mjs` ersetzt sie per String-Suche über die ganze Datei und würde
  die Erwähnung sonst mitersetzen. Der Build bricht jetzt ab, wenn eine Marke nicht genau einmal
  vorkommt.

---

## 5. Befehle

```
npm run validate   # Schema + Duplikate + Querverweise (Pflicht-Gate)
npm run build      # dist/qbox-planer.html bauen
npm run stats      # Anzahl je Kategorie / Qualität / Status
npm run find <q>   # Plugin im Katalog suchen, ohne den Katalog zu laden
npm run linkcheck  # HTTP-Status aller Links → link_status + link_geprueft_am
npm run discover   # NEUE Plugins auf GitHub finden, Bekanntes automatisch aussortieren
npm run prefetch   # Recherche-Briefing für die Subagents vorab erzeugen
npm run newround N # Gerüst für data/catalog/runde-N.json anlegen
npm run selftest   # prüft die Prüfer (Validator-Meldungen, Dublettenlogik)
```

**Bei Neusuche-Runden läuft `discover` vor `prefetch`** (Details in `docs/RECHERCHE.md` §7):

```
npm run discover -- --runde 26                 # oder: --seit-letztem-lauf
npm run prefetch -- --kandidaten --max 12 --runde 26
```

`discover` fragt mehrere GitHub-Suchen ab, wirft alles raus, was schon im Katalog steht (ID **oder**
Link-Ziel), trennt Umbenennungen von Konkurrenzprodukten und verwirft Repos ohne `fxmanifest.lua`.
Erst der Rest geht in `prefetch`. Wichtig: **ein Konkurrenzprodukt ist keine Dublette** —
`ac_radio` und `mm_radio` sind zwei Einträge derselben `gruppe`. Diese Unterscheidung ist in
`npm run selftest` festgenagelt, weil ein Fehler dort echte Funde verschluckt.

`prefetch --kandidaten` liefert zusätzlich pro Kandidat einen **Feldvorschlag**: alles Ablesbare
ist gefüllt, alles Urteilsabhängige steht als `<...>`-Platzhalter drin — die sind schema-ungültig,
`npm run validate` fängt sie also ab, falls sie stehen bleiben.

**`prefetch` läuft immer vor einer Recherche-Runde**, sonst arbeiten die Subagents unnötig teuer:

```
npm run prefetch -- --kategorie crime --offen --max 11 --runde 19
```

Es holt alles Deterministische selbst (Repo-Status, archiviert, letzter Push, Lizenz, fxmanifest
wörtlich, README-Belegzeilen, Code-Stichprobe über alle `.lua`-Dateien nach RECHERCHE.md §3) und
schreibt es nach `data/.prefetch/runde-N.md`. Den Subagents wird **nur der Pfad** genannt — der
Inhalt darf nie in den Hauptkontext kopiert werden. Repo-Metadaten werden pro Owner gebündelt
geholt, dadurch braucht eine ganze Runde ~4 API-Aufrufe statt ~15. Ein `GITHUB_TOKEN` oder
`GH_TOKEN` in der Umgebung hebt das Limit von 60 auf 5000 Anfragen/h; ohne Token läuft es auch,
ist aber bei mehreren Runden hintereinander knapp.

`linkcheck` ist nur eine Nebensache: es meldet 404 und Umzüge über alle bekannten URLs. Es ersetzt
**nicht** die inhaltliche Prüfung — die läuft nach `docs/RECHERCHE.md` und besteht daraus, die
Seiten tatsächlich zu lesen. Das Script läuft lokal über meine IP, deshalb: max. 4 parallel,
Ergebnis-Cache mit 30 Tagen Gültigkeit, bei 429/403 Host überspringen, Tebex-Shops mit Bot-Schutz
gar nicht erst anfragen.

## 6. Modell- und Effort-Strategie

- Standardmodell: **Sonnet**, Effort **medium**.
- Opus nur für:
  - Kickoff einer neuen Phase (z. B. „Phase 0“, „Phase 1“)
  - Architektur-Entscheidungen, die mehrere Module betreffen
  - Fälle, in denen Sonnet nach 2–3 Versuchen im Kreis läuft.

- Wenn eine Session mit `claude --continue` fortgesetzt wird:
  1. Prüfe, mit welchem Modell die Session gespeichert wurde.
  2. Wenn es **Opus** ist und kein expliziter Opus‑Grund vorliegt (Kickoff, Architektur, hartes Debugging):
     - Frage mich: „Soll ich auf Sonnet wechseln, um Token zu sparen?“
     - Warte auf meine Antwort, bevor du weiterarbeitest.

- Eskalationslogik bei komplexen Aufgaben (wenn aktuell Sonnet):
  1. Wenn du merkst, dass du bei einem Problem im Kreis läufst (2–3 erfolglose Versuche, gleiche Fehler, keine Fortschritte):
     - Frage mich: „Ich komme bei [Problem] mit Sonnet/Effort medium nicht weiter. Soll ich Effort auf high setzen?“
  2. Wenn auch mit Effort high nach weiteren 2–3 Versuchen kein Durchbruch da ist:
     - Frage mich: „Ich stecke bei [Problem] fest. Soll ich für diese Aufgabe auf Opus (Effort medium) wechseln?“
  3. Nach Abschluss der Aufgabe:
     - Frage mich, ob wieder auf Sonnet/Effort medium zurückgewechselt werden soll.
