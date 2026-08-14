# PROGRESS — aktueller Projektstand

> Diese Datei ist das Gedächtnis des Projekts. Sie wird nach **jedem** Arbeitsschritt aktualisiert.
> Sie muss so geschrieben sein, dass ein völlig neuer Chat allein damit weiterarbeiten kann.

**Letzte Aktualisierung:** 14.08.2026
**Letzter Commit:** `2f38fce` (App-Ausbau 1).

**Push-Stand (14.08.2026):** `origin/main` steht auf `6bb3d57` — gepusht bis inklusive
App-Ausbau 2. Letztes GitHub-Release: **v3.1-r39** (`dist/qbox-planer.html`, 404 Plugins).
**Versionskorrektur (14.08.2026):** Der erste Release-Versuch hieß fälschlich noch `v3.0-r39` —
`catalogVersion` folgte einem hartcodierten `"3.0-r${n}"` in `scripts/newround.mjs`, unabhängig
von der App-Version. Da diese Runde zwei App-Ausbaurunden mit echten `src/`-Änderungen enthält
(neue Features, keine reine Datenrunde), gehört das sichtbar gemacht: `package.json` auf
**3.1.0**, `newround.mjs` liest den Präfix jetzt aus `package.json` (`major.minor`) statt ihn
festzuschreiben, `runde-39.json` von Hand auf `3.1-r39` nachgezogen. Der falsche Release
`v3.0-r39` wurde gelöscht und durch `v3.1-r39` ersetzt. **Für künftige Runden:** eine reine
Datenrunde bleibt beim aktuellen `major.minor`-Präfix (z.B. weiterhin `3.1-r40`), ein
App-Ausbau erhöht `package.json` VOR dem nächsten `npm run newround`-Aufruf.
Nichts mehr offen auf dieser Seite.

**H5 (Doppelklick über `file://`) ist weiterhin nicht durch dieses Tool geprüft** — das
Browser-Werkzeug verweigert `file://`, jeder Testlauf lief über einen lokalen HTTP-Server. Der
Nutzer hat den Release-Build trotzdem freigegeben; ein manueller Doppelklick-Check steht bei
Gelegenheit noch aus, ist aber kein Blocker mehr.

---

## App-Ausbau — erste Runde fertig, zweite Runde ist beauftragt

**Erste Ausbaurunde am App-Code seit Phase 1 ist fertig** (Einzelheiten im CHANGELOG-Eintrag
„[App-Ausbau 1]"): Facetten-Filter statt reinem UND, laufender Prüfbericht oben mit
Ein-Klick-Behebung, Detail-Fenster für ausgefilterte Sprungziele plus Zurück-Stapel, Zähler für
ungenutzte Synergien je Umgebung, Vergleich über beliebig viele Einträge, Filter „nur mit
Warnung", und Rückwärts-Indizes gegen die quadratisch wachsende Zeichenlast. Neue Datei:
`src/app/warnings.js`. Neue Entscheidungen: DECISIONS **D20, D21, D22**. Neue Features in
FEATURES.md: **B8, B9, C5, D9, F8, F9, F10**; **D4 wurde umgeschrieben** (UND → Facetten).

**Wichtig fürs Nachtesten:** Diese Runde wurde am echten Build mit allen 404 Plugins über einen
lokalen HTTP-Server geprüft, mit im Seitenkontext ausgeführten Klick-/Eingabefolgen — fachlich
derselbe Durchlauf, **aber H5 (Doppelklick über `file://`) ist NICHT erneut belegt**, weil das
Browser-Werkzeug `file://` verweigert. Das ist der einzige offene Prüfpunkt dieser Runde.

**App-Ausbau 2 ist ebenfalls fertig** (CHANGELOG „[App-Ausbau 2] Vergleichskorb"): ⚖️-Knopf oben
rechts auf jeder Karte, einfacher Klick legt in den Korb und öffnet das Fenster; eigenes
Suchfeld im Fenster mit der Hauptsuch-Logik (Alternativen zuerst, als solche markiert);
vollständige Karten im Vergleich mit der Tabelle darunter; Drag&Drop als Zusatzweg mit der
Leiste als sichtbarer Ablagefläche. Kein Long-Press (DECISIONS **D23**). Neue Features:
**C6, C7, C8, C9**. `ui.js` nimmt für das breite Fenster jetzt eine `klasse` entgegen.

**Beide Ausbaurunden sind gebaut, committet und ohne Konsolenfehler getestet.**
**Validate-Status:** grün (42 Katalogdateien inkl. `runde-39.json` · 404 Plugins gesamt · 20
harmlose „nur ein Mitglied"-Warnungen, `minigames` jetzt mit 3 Mitgliedern kein Einzelfall mehr).
**Katalogstand:** 404 gesamt (262 Altbestand + vierzehn Runden à 10–11 aus Runde 26–39), **0
Einträge ohne `geprueft_am`.**

**Der alte `discover`-Standardpool (6 feste Abfragen) war nach Runde 38 abgearbeitet — Runde 39
hat stattdessen mit gezielten Zusatzsuchen neu aufgefüllt** (siehe „Nächster Schritt" unten für
das genaue Vorgehen, das sich bewährt hat und wiederholbar ist).

**Runden 26–37 — Neusuche-Serie, Kurzfassung (Einzelfunde vollständig im CHANGELOG):**
Zwölf Runden à 10–11 neue Plugins über `npm run discover`/`prefetch --kandidaten`, macht 121
neue Einträge seit dem Ende der Altbestand-Nachprüfung. Runden 30–32 brachten insgesamt acht
bislang übersehene offizielle Qbox-project-Repos (`qbx_seatbelt`, `qbx_scrapyard`,
`qbx_streetraces`, `qbx_npwd`, `qbx_binoculars`, `qbx_divegear`, `qbx_gearbox`, `qbx_evidence`
— letzteres bereits archiviert, erster archivierter Neufund dieser Serie). Subagent liefert seit
Runde 27 ausschließlich JSON zurück, die Hauptsession schreibt und prüft gegen — das hat sich
bewährt und bleibt Standard.
**Vier feste Lehren aus dieser Serie, für jede künftige Runde relevant:**
1. **Gruppennamen-Kollisionsprüfung ist Pflicht** (Runde 28: `mining` kollidierte mit
   `crypto_mining_sim`, auf `bergbau` korrigiert). Vor dem Schreiben per Grep über alle
   `data/catalog/*.json` nach `"gruppe": "<neuer-name>"` prüfen; nach dem Schreiben in der
   `validate`-Ausgabe kontrollieren, dass eine neu vergebene Gruppe „nur ein Mitglied" meldet —
   meldet sie das nicht, ist der Name schon anderweitig vergeben. Ab Runde 29 vorab geprüft,
   keine Kollision mehr aufgetreten.
2. **Wegwerf-Account-Cluster nicht pauschal ablehnen** (Runde 27: 5 von 10 Kandidaten vom selben
   frischen 0-Stern-Account) — jeden einzeln über README-Umfang/Code-Substanz bewerten, bei
   Zweifeln `qualitaet: teilgeprueft` statt Ablehnung oder blinder Übernahme.
3. **`ergaenzt` ist keine ID-Liste, sondern ein Array aus `{id, plus, minus}`-Objekten**
   (Runde 31: Subagent lieferte `["qbx_diving"]`, `npm run validate` fing es sofort ab). Vor dem
   Schreiben eines `ergaenzt`-Eintrags kurz ein bestehendes Beispiel in `data/catalog/*.json`
   ansehen.
4. **`kompat_warnung` ist ein einzelnes Objekt, kein Array** — und `archiviert.nachfolger`
   verlangt bei Angabe einen String (leer erlaubt), niemals `null`; ist kein Nachfolger bekannt,
   das Feld ganz weglassen (Runde 32: beide Fehler traten im selben Rundenergebnis auf, vor dem
   Commit korrigiert).

Details zu Einzelfunden, Framework-Korrekturen und Preis-/Lizenz-Fällen jeder Runde stehen im
`docs/CHANGELOG.md` — hier bewusst nicht wiederholt, damit diese Datei bei vielen weiteren
Runden lesbar bleibt.

**Auswahl der Kandidaten pro Runde ist eine Kuratierung der Hauptsession:** `data/.kandidaten.json`
wird nach jedem `discover`-Lauf per Node-Skript auf die gewählten ~10 gekürzt (gitignored, kein
Verlust: `discover` erzeugt bei Bedarf neu), priorisiert nach Sternen/Aktivität — hat sich seit
Runde 28 deutlich ausgezahlt (14–228⭐ statt vorher meist 0–2⭐).

**Runde 25 — Kategorie „MLOs, Kleidung & Assets" komplett (8/8):** `bob74_ipl` klar verifiziert
(Standalone-IPL-Fixer). Die restlichen 7 waren überwiegend fremde Shop-/Forum-Seiten ohne
GitHub-Repo (Tebex-Bot-Schutz bei `gabz`/`k4mb1`/`patoche`, reine Forum-Übersichten bei
`cfx_free_mlos`/`eup`) — alle auf `teilgeprueft`/`ungeprueft` mit Belegen aus Websuche/Forum
eingeordnet, keine geratenen Preise oder Lizenzen. **Zwei Funde für später:** `kingmaps_shop`
ist ein bestätigtes Duplikat von `kingmaps` (gleiche URL) — Zusammenführung ist eine
Datenpflege-Entscheidung, noch nicht ausgeführt. `patoche`-Link (`patoche-maps.tebex.io`) könnte
falsch sein — aktive Produktseiten liegen unter `patoche-mapping.tebex.io`, wegen Bot-Schutz auf
beiden Domains nicht zweifelsfrei geklärt.
**Runde 25b — letzte Streuverluste ohne `geprueft_am` (`qb-inventory`/ui, `ps-mdt`/staat,
`ps-housing`+`ps-realtor`/wohnen, `qs-inventory`/ui):** Damit ist der komplette Altbestand
durchgeprüft. Wichtigste Funde: **`ps-realtor`** war im Katalog fälschlich als kostenpflichtig
(escrow, 5 EUR/Monat) geführt — tatsächlich ein öffentliches, quelloffenes Repo ohne
Escrow-Verschlüsselung, Preis auf `null`/`open_source` korrigiert. **`ps-housing` und
`ps-realtor`** sind beide seit 06.02.2026 archiviert (gleiche Project-Sloth-Ankündigung wie
`ps-mdt`-Fokus). `ps-mdt` selbst ist weiterhin aktiv, README bestätigt jetzt textlich
Qbox-Unterstützung über die `ps_lib`-Abstraktionsschicht (vorher nur Vermutung). `qb-inventory`
bestätigt als reiner alter qb-Stack ohne ox-Bridge. `qs-inventory` bleibt bot-geschützt und
ungeprueft.

**Vorgehensweise „weniger Subagent-Arbeit" (Nutzerwunsch, ab Runde 17 eingeführt und in Runde 18
bestätigt):** `docs/RECHERCHE.md` wurde um Abschnitte 1a–1c ergänzt (exakte URL-Muster
`api.github.com/repos/<owner>/<repo>`, `raw.githubusercontent.com/.../fxmanifest.lua` bzw.
`README.md`, systematisches Vorgehen bei 404/Repo-Umzug nach Autoren-Namensmuster, Umgang mit
bot-geschützten Tebex-Seiten). Zusätzlich löst die Hauptsession vor dem Rundenstart bei bereits
bekannten GitHub-Links den Owner/Repo-Pfad selbst per `npm run find`/Katalog-Auszug auf und gibt
ihn den Subagents direkt mit — nur bei echten Platzhalter-Links (`github.com/topics/qbox`) oder
reinen Profil-Links müssen Subagents noch selbst suchen. Bewährt sich über zwei Runden: weiterhin
akkurate, gut belegte Funde bei spürbar weniger Tool-Aufrufen pro Subagent für bekannte Repos.
**Für künftige Runden beibehalten.**

**Sonnet-5/low-Test abgeschlossen (Runden 7–15, Nutzerwunsch statt der in CLAUDE.md §1
vorgegebenen medium-Einstellung für Datenrunden).** Zwischenfazit: Über 9 Runden hinweg keine vom
Effort-Level ausgelöste Qualitätsverschlechterung bei erfolgreichem Rundenabschluss — im
Gegenteil, die Runden lieferten durchgehend belastbare, gut belegte Funde (u. a. `ox_fuel`-Fork
tot, `qbx_houses`/`qbx_apartments` archiviert, `qbx_policejob`→`qbx_police` umbenannt, und in
Runde 14/15 ein systematischer Datenfehler bei 11 `jim_*`-Einträgen, die fälschlich als
Open-Source geführt waren obwohl sie kostenpflichtige Tebex-Produkte sind — ein Fund, der eher für
gründliche Recherche als gegen sie spricht). Einziger echter Abbruch-Zwischenfall war das
„ich melde mich später"-Verhalten eines Subagents in Runde 8 (Subagents laufen synchron; mit einer
expliziten Klarstellung im Prompt reproduzierbar behoben, seither nicht wieder aufgetreten).
Einschätzung: Für reine Nachprüfungs-Recherche (Link-/Status-Checks, Repo-Metadaten lesen,
Beleggrad einordnen) ist low eine brauchbare, günstigere Alternative zu medium. Für Aufgaben mit
vielen gleichzeitigen Kompatibilitätsurteilen oder Neufund-Suche würde ich vorsichtshalber wieder
auf medium wechseln, wie in CLAUDE.md §1 vorgesehen — das wurde in diesen 9 Runden aber nicht
getestet, da es sich durchgehend um reine Nachprüfung handelte.

---

## Phase

- [x] Phase 0 — Repo, Schema, Validator, Build-Script
- [x] Phase 1 — App mit 10 Demo-Plugins, alle 59 Features aus FEATURES.md `getestet`
- [x] Phase 2 — Konvertierung des Altbestands aus `reference/qbox-server-planer-v2-1.html`
  (124 Einträge, nicht 88 wie ursprünglich geschätzt) und `reference/kimi-kataloge/` (140
  Einträge) → `data/catalog/altbestand.json`, 256 Plugins
- [~] Phase 3 — Recherche-Runden (Runde 1–2 fertig, weitere offen — Zielzahl 10 war eine grobe
  Planungsannahme; bei kategorieweiser Nachprüfung von 240 Altbestand-Einträgen zu 10–12/Runde
  werden es eher 20+ Runden allein für die Nachprüfung, plus Runden für echte Neusuche danach)
- [ ] Phase 4 — Finale Duplikatprüfung, Link-Check über alles, Release

## Woran ich zuletzt gearbeitet habe

**Ausführliche Historie zu Phase 0–2 und Runde 1 steht in `docs/CHANGELOG.md`** (nicht hier
wiederholt, damit diese Datei bei 40+ geplanten Runden lesbar bleibt). Kurzfassung: Phase 0–2
fertig (Fundament, App, Altbestandskonvertierung 256 Plugins), Runde 1 fertig (22 essenzielle
Einträge nachgeprüft, siehe Runde-1-Eintrag im CHANGELOG für die Einzelfunde).

**Runden 2–3 — Kategorie „Basis & Abhängigkeiten" komplett durchgeprüft (31/31):**

Nutzer bestätigte nach Runde 1 ausdrücklich: erst **den kompletten Altbestand durchprüfen**
(„möglichst alles geprüft"), erst danach neue Plugins suchen. Vorgehen abgestimmt (AskUserQuestion):
**größere Batches (10–12 Plugins/Runde)**, Reihenfolge **nach Kategorie** (`data/kategorien.json`,
Anzeigereihenfolge). Runde 2 (12) + Runde 3 (14) = restliche 26 Einträge der Kategorie
„1. Basis & Abhängigkeiten" abgeschlossen (die essenziellen deckte schon Runde 1 ab). Recherche
über je 3 parallele Subagents, `updates[]` in `data/catalog/runde-2.json`/`runde-3.json`.

**Wiederkehrendes Muster (jetzt in 2 von 3 Runden bestätigt):** Mehrere overextended-Repos
(`awesome_ox`, `ox_core`, `oxmysql` in Runde 2; dasselbe schon bei `ox_lib`/`ox_inventory`/etc. in
Runde 1) waren im Katalog fälschlich als archiviert markiert — tatsächlich aktiv, `archiviert` auf
`null` korrigiert. `oxmysql` hatte zusätzlich einen toten `TheOrderFivem`-Fork-Link (404), wie
schon `ox_fuel` in Runde 1. **Neuer Fund in Runde 3:** vier Katalogeinträge
(`peak_bridge`, `qbox_snippets`, `starterpack`, `vue_tailwind_boilerplate`) hatten als „Link" nur
die generische GitHub-Topic-Suchseite `github.com/topics/qbox` — kein echtes Repo. Für drei davon
wurde ein plausibles Repo gefunden und der Link korrigiert (teils mit Vorbehalt, z.B. `starterpack`
hat mehrere konkurrierende Kandidaten); für `vue_tailwind_boilerplate` gab es keinen passenden
Treffer — bleibt bewusst `ungeprueft` statt eines geratenen Links.

**Für spätere Runden vorgemerkt:** Die 8 v2.1/kimi-Feldkollisionen in
`docs/altbestand-konflikte.md` sind weiterhin nur protokolliert, nicht durchgesehen — das
Falsch-Archiviert-Muster ist ein Hinweis, dass die kimi-Übernahmen zum `ox`-Ökosystem generell mit
Vorsicht zu lesen sind. `qbx_vehicles` und `qbx_npwd` (aus Runde 1) sind weiterhin Kandidaten für
die erste Neusuche-Runde. Die Topic-Seiten-Links (`github.com/topics/qbox`) könnten in weiteren
Kategorien öfter auftauchen — beim Recherchieren künftiger Runden aktiv drauf achten.

## Veröffentlichung

Repo: **https://github.com/T0XiQ96/Qbox-Server-Planer** (privat, Account T0XiQ96).
Authentifizierung läuft über den `GITHUB_TOKEN` in der Umgebung (Scopes `repo`, `workflow`) —
kein separater `gh`-Login gespeichert. `gh` liegt unter `/c/Program Files/GitHub CLI/gh.exe`
und ist nicht im PATH.

Letztes Release: **v3.0-r25b** mit `qbox-planer.html` als Anhang. Regel dazu in CLAUDE.md §2.8:
nach jedem `npm run build`, das committet wird, ein Release mit der `catalogVersion` als Tag.

## Nächster Schritt

**Runden 26–39 sind fertig.** 142 Kandidaten sind jetzt im Katalog (404 gesamt). Der alte
`discover`-Standardpool (6 feste Abfragen) war nach Runde 38 abgearbeitet. **Runde 39 hat
stattdessen mit gezielten Zusatzsuchen aufgefüllt — dieses Vorgehen hat sich bewährt und ist
das Muster für weitere Runden, sobald der Pool wieder dünn wird:**

```
npm run discover -- --suche "qbox <thema> in:description,readme fork:false" --max 30 --runde 40a
cp data/.kandidaten.json data/.kandidaten-40a.json   # sichern, bevor der nächste Lauf überschreibt
npm run discover -- --suche "qbox <anderes-thema> ..." --max 30 --runde 40b
cp data/.kandidaten.json data/.kandidaten-40b.json
# ggf. weitere Themen …
```

Danach die `.kandidaten-*.json`-Dateien per Node-Skript zusammenführen (nach `id` deduplizieren),
nach Sternen sortieren, die besten ~10–11 auswählen (Autoren-Cluster wie `MalibuTechTeam` nicht
alle auf einmal nehmen, sondern über Runden verteilen) und als `data/.kandidaten.json` mit
`runde: N` neu schreiben — danach wie gewohnt `npm run newround N` und
`npm run prefetch -- --kandidaten --max 11 --runde N`. Die Sicherungsdateien am Ende löschen.

**Themen, die in Runde 39 gut funktioniert haben:** `qbox mlo`, `qbox heist`,
`qbox clothing OR qbox weapon`. **Für Runde 40 noch nicht ausprobiert, naheliegende Kandidaten:**
`qbox drugs`, `qbox garage`, `qbox phone`, `qbox banking`, andere Kategorie-Stichworte aus
`data/kategorien.json`, die im Katalog noch dünn besetzt sind. Ein `--suche`-String mit `OR`
funktioniert (siehe Runde 39, drittes Thema) — spart einen Lauf gegenüber zwei Einzelsuchen.

**Bei jeder neu vergebenen `gruppe`-ID:** vor dem Schreiben per Grep über alle
`data/catalog/*.json` nach `"gruppe": "<neuer-name>"` auf Kollision prüfen (Lehre aus Runde 28)
UND prüfen, ob ein vermeintlich neuer Bestandseintrag nicht schon eine andere, bereits etablierte
Gruppe trägt (Lehre aus Runde 31: `qbx_garages` hatte schon dieselbe Gruppe wie `cd_garage`).
**Beim Schreiben von `ergaenzt`:** kein Array aus IDs, sondern `{id, plus, minus}`-Objekte (Lehre
aus Runde 31, siehe Schema/Beispiel in `data/catalog/altbestand.json`). **Bei
Wegwerf-Account-Clustern:** nicht pauschal verwerfen — jeden einzeln über README-Umfang/
Code-Substanz bewerten, bei Zweifeln `qualitaet: teilgeprueft` statt Ablehnung. **`version` ist
immer Text, niemals `null`** (Lehre aus Runde 38: Validator lehnt `null` ab, Platzhalter wie
"unbekannt" verwenden).

Zwei kleine Aufräumpunkte aus Runde 25 sind noch offen (siehe „Bewusst verschoben" unten:
`kingmaps_shop`-Duplikat, `patoche`-Linkverdacht) — beiläufig in einer künftigen Runde mitnehmen.

**Bewährtes Muster aus Runden 19–24 (Prefetch + ganze Kategorien pro Runde):** Bei jeder Runde
schreibt die Hauptsession die sauberen Treffer aus dem Briefing (vollständige Code-Stichprobe,
fxmanifest + README vorhanden) direkt selbst in den Katalog — typischerweise 30–60 % der Runde,
ganz ohne Subagent. Nur die kniffligen Fälle (tote Links, Tebex-Bot-Schutz, Namens-Kandidaten,
externe Anbieterseiten) gehen an einen einzigen Subagent pro Runde. Ergebnis über 5 Runden:
konstant 9–24 Tool-Aufrufe pro Subagent statt der vorher üblichen 40–70. **Wichtig dabei
etabliert:** Subagent-Funde vor dem Schreiben gegen die bestehende Katalogbeschreibung
gegenprüfen, nicht blind übernehmen — in Runde 20 (`pma_radio_ui`) und Runde 21 (`vsync`) wurde
je ein Fund verworfen, weil er der bestehenden Einordnung widersprochen hätte (siehe
CHANGELOG-Einträge dieser Runden für die Details). `abhaengigkeiten`-IDs müssen zum Muster
`^[a-z0-9][a-z0-9_-]*$` passen (klein, keine Großbuchstaben) — Subagents liefern das nicht
immer korrekt, vor dem Schreiben prüfen. `framework` ist ein einzelner Enum-Wert
(`qbox_nativ`/`qbcore_bridge`/`standalone`/`qbcore_only`), kein Array. `preis.typ` nur
`einmalig`/`abo`. `lizenz` nur `open_source`/`escrow`, keine SPDX-Kürzel wie "MIT"/"GPL-3.0".

## Werkzeug: `npm run prefetch` (seit 12.08.2026)

Auf Nutzerwunsch („weniger Tokens, schneller, ohne Genauigkeitsverlust") läuft die mechanische
Hälfte der Recherche jetzt als Script statt im Subagent-Kontext. **Ablauf jeder künftigen Runde:**

1. `npm run prefetch -- --kategorie <kat> --offen --max 11 --runde N`
2. Den Subagents im Prompt **nur den Pfad** `data/.prefetch/runde-N.md` nennen — niemals den
   Inhalt hineinkopieren, sonst ist die Ersparnis weg.
3. Die Agents lesen das Briefing und liefern nur noch das Urteil (Framework-Einordnung,
   Beleggrad, `update_grund`) plus die dort unter „Offen für dich" ausgewiesenen Restpunkte.

Gemessen: 10 Plugins in 4,9 s bei 7 API-Aufrufen, Briefing ~10 KB. Runde 18 kostete für 11
Plugins ~400 s und ~164k Tokens. Genauer ist es zusätzlich, weil die Code-Stichprobe nach
RECHERCHE.md §3 vorher praktisch nie durchgeführt wurde — das Script prüft alle `.lua`-Dateien
und nennt Fundstellen zeilengenau (Details im CHANGELOG-Eintrag „[Werkzeug] Prefetch").

Ein `GITHUB_TOKEN` oder `GH_TOKEN` in der Umgebung hebt das API-Limit von 60 auf 5000/h. Ohne
Token läuft es dank Owner-Bündelung auch, wird aber bei mehreren Runden hintereinander knapp —
falls Läufe mit `api-fehler` enden, ist das die Ursache (nicht mit `owner-weg` verwechseln, das
ist ein echter Befund).

## Fehlermuster aus 25 Runden — worauf sich das Suchen lohnt

Die Einzelfunde jeder Runde stehen im `docs/CHANGELOG.md` (dort ist der Platz dafür, CLAUDE.md
§2.5) und werden hier **nicht** wiederholt — diese Datei wird bei jedem Session-Start gelesen,
Verdopplung kostet also jedes Mal. Übertragbar ist nur, was sich als *Muster* wiederholt hat:

1. **Falsch geschriebene Katalog-Links sind der häufigste Einzelfehler.** Großschreibung,
   Unterstrich statt Bindestrich, falscher Owner (`wasabi_backpack`, `legacyfuel`,
   `randolio_grandma`, `wk_wars2x`, `qbx_hotdogjob`, `wasabi_carlock`). Ein 404 heißt deshalb
   zuerst „Schreibweise prüfen", nicht „Repo ist weg". Das Prefetch-Briefing listet dafür die
   ähnlichsten Repo-Namen desselben Owners.
2. **Fälschlich als archiviert geführt — besonders im `ox`-Ökosystem.** `ox_fuel`, `ox_mdt`,
   `oxmysql`, `awesome_ox`, `ox_core` waren alle aktiv, obwohl der Katalog sie als tot führte.
   Die kimi-Übernahmen zum ox-Stack sind generell mit Vorsicht zu lesen.
3. **Project-Sloth archiviert reihenweise `ps-*`-Repos** (ps-inventory, ps-hud, ps-fuel,
   ps-housing, ps-realtor — alle 06.02.2026, Fokus liegt jetzt auf ps-mdt v3).
4. **Offizielle Qbox-Repos wurden am 09.07.2026 gebündelt archiviert** (`qbx_houses`,
   `qbx_apartments`, `qbx_loading`, `qbx_prison`). Bei weiteren `qbx_*`-Einträgen mit altem
   Prüfdatum lohnt ein Blick.
5. **`jim_*` ist fast durchgehend Tebex-Paid, nicht Open-Source** — 11 Einträge waren falsch
   als quelloffen geführt, die verlinkten Repos existieren nicht. Ausnahmen mit echtem Repo:
   `jim_mining`, `jim_recycle`, `jim_bridge`.
6. **Topic-Seiten als Link** (`github.com/topics/qbox`) statt eines echten Repos — Altlast der
   Konvertierung, tauchte in mehreren Kategorien auf.
7. **Preise lieber `null` als geraten.** Mehrfach ließ sich ein im Katalog stehender Betrag nicht
   belegen (`sonoran_cad`, `qs_*`); bewusst geleert statt einen plausiblen Wert zu behalten.
   Umgekehrt war `ps-realtor` fälschlich als kostenpflichtig geführt.

## Offene Punkte / Rückfragen an den Nutzer

- Keine offenen Rückfragen aktuell.

## Bewusst verschoben (nicht vergessen, aber nicht jetzt)

- Die 8 Feldkollisionen zwischen v2.1 und kimi in `docs/altbestand-konflikte.md` — bei Gelegenheit
  querlesen, siehe „Woran ich zuletzt gearbeitet habe" oben.
- `qbx_vehicles` und `qbx_npwd` — Kandidaten für die erste Neusuche-Runde, sobald der Altbestand
  durchgeprüft ist.
- `starterpack` hat einen Best-Effort-Link ohne eindeutigen offiziellen Kandidaten,
  `vue_tailwind_boilerplate` hat gar keinen passenden Link gefunden — beide in einer künftigen
  Runde nochmal gezielt angehen oder aus dem Katalog nehmen, falls sich nichts Besseres findet.
- `kingmaps_shop` (Runde 25) ist ein bestätigtes Duplikat von `kingmaps` — gleiche URL, gleiche
  Fakten. Zusammenführen oder einen der beiden Einträge entfernen, sobald eine App-Aufgabe ansteht
  (reine Datenpflege, keine Recherche mehr nötig).
- `patoche` (Runde 25): Katalog-Link `patoche-maps.tebex.io` lieferte 403, alle über Websuche
  gefundenen aktiven Produktseiten liegen unter `patoche-mapping.tebex.io`. Bot-Schutz verhinderte
  eine zweifelsfreie Klärung, ob das ein Tippfehler, Umzug oder zweiter Shop ist — vor einer
  Höherstufung auf `verifiziert` gezielt nachprüfen.
- Nach Runde 25/25b sind noch **38 Katalogeinträge** `qualitaet: "ungeprueft"`, alle Kategorien
  sind aber inzwischen mindestens einmal durchgeprüft — der ursprüngliche Rückstand „13 Einträge
  ganz ohne `geprueft_am`" ist auf 0 abgebaut.

---

## Rundenprotokoll

| Runde | Thema | Neu | Aktualisiert | Übersprungen (Dup.) | Ungeprüft | Datei | Commit |
|---|---|---|---|---|---|---|---|
| 1 | Nachprüfung der 22 essenziellen Altbestand-Einträge (kein Neufund, auf Nutzerwunsch) | 0 | 22 | 0 | 0 (18 verifiziert, 4 teilgeprüft) | `data/catalog/runde-1.json` | `91d1c40` |
| 2 | Nachprüfung Kategorie „Basis" Teil 1/2, 12 von 26 (kein Neufund) | 0 | 12 | 0 | 0 (10 verifiziert, 2 teilgeprüft) | `data/catalog/runde-2.json` | `f504f7d` |
| 3 | Nachprüfung Kategorie „Basis" Teil 2/2, restliche 14 von 26 — Kategorie fertig | 0 | 14 | 0 | 2 (4 verifiziert, 8 teilgeprüft, 2 weiterhin ungeprueft) | `data/catalog/runde-3.json` | `7afa348` |
| 4 | Nachprüfung Kategorie „UI" Teil 1/3, 12 von 31 (kein Neufund) | 0 | 12 | 0 | 0 (8 verifiziert, 4 teilgeprüft) | `data/catalog/runde-4.json` | `3f0345a` |
| 5 | Nachprüfung Kategorie „UI" Teil 2/3, 11 von 17 verbleibenden (kein Neufund) | 0 | 11 | 0 | 0 (3 verifiziert, 8 teilgeprüft) | `data/catalog/runde-5.json` | `266eeec` |
| 6 | Nachprüfung Kategorie „UI" Teil 3/3, letzte 6 — Kategorie komplett (kein Neufund) | 0 | 6 | 0 | 0 (2 verifiziert, 4 teilgeprüft) | `data/catalog/runde-6.json` | `7745445` |
| 7 | Nachprüfung Kategorie „Fahrzeuge" Teil 1/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 0 (3 verifiziert, 5 teilgeprüft) | `data/catalog/runde-7.json` | `c92f18f` |
| 8 | Nachprüfung Kategorie „Fahrzeuge" Teil 2/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 1 (4 verifiziert, 3 teilgeprüft, 1 ungeprueft) | `data/catalog/runde-8.json` | `5851328` |
| 9 | Nachprüfung Kategorie „Fahrzeuge" Teil 3/3, letzte 7 — Kategorie komplett (kein Neufund) | 0 | 7 | 0 | 1 (3 verifiziert, 3 teilgeprüft, 1 auf ungeprueft herabgestuft) | `data/catalog/runde-9.json` | `b688c5a` |
| 10 | Nachprüfung Kategorie „Wohnen" komplett, 9 von 9 (kein Neufund) | 0 | 9 | 0 | 0 (3 verifiziert, 6 teilgeprüft) | `data/catalog/runde-10.json` | `f027817` |
| 11 | Nachprüfung Kategorie „Staat" Teil 1/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 0 (3 verifiziert, 5 teilgeprüft) | `data/catalog/runde-11.json` | `771f330` |
| 12 | Nachprüfung Kategorie „Staat" Teil 2/3, 8 von 23 (kein Neufund) | 0 | 8 | 0 | 1 (5 verifiziert, 2 teilgeprüft, 1 herabgestuft) | `data/catalog/runde-12.json` | `58dbbab` |
| 13 | Nachprüfung Kategorie „Staat" Teil 3/3, letzte 7 — Kategorie komplett (kein Neufund) | 0 | 7 | 0 | 0 (3 verifiziert, 4 teilgeprüft) | `data/catalog/runde-13.json` | `912ef51` |
| 14 | Nachprüfung Kategorie „Zivil" Teil 1/3, 10 von 30 (kein Neufund, 8 lizenz-Korrekturen) | 0 | 10 | 0 | 9 (0 verifiziert, 1 teilgeprüft, 9 ungeprueft) | `data/catalog/runde-14.json` | `8be5710` |
| 15 | Nachprüfung Kategorie „Zivil" Teil 2/3, 10 von 30 (kein Neufund) | 0 | 10 | 0 | 0 (5 verifiziert, 5 teilgeprüft) | `data/catalog/runde-15.json` | `74e9862` |
| 16 | Nachprüfung Kategorie „Zivil" Teil 3/3, letzte 10 — Kategorie komplett (kein Neufund) | 0 | 10 | 0 | 3 (4 verifiziert/teilgeprüft, 3 ungeprueft) | `data/catalog/runde-16.json` | `c8a7383` |
| 17 | Nachprüfung Kategorie „Crime" Teil 1/3, 11 von 32 (kein Neufund) | 0 | 11 | 0 | 4 (2 verifiziert, 6 teilgeprüft, 4 ungeprueft) | `data/catalog/runde-17.json` | `8a4e940` |
| 18 | Nachprüfung Kategorie „Crime" Teil 2/3, 11 von 32 (kein Neufund) | 0 | 11 | 0 | 2 (5 verifiziert, 4 teilgeprüft, 2 ungeprueft) | `data/catalog/runde-18.json` | `d247353` |
| 19 | Nachprüfung Kategorie „Crime" Teil 3/3, letzte 10 + Nachtrag — Kategorie komplett (kein Neufund, erste Runde mit `npm run prefetch`) | 0 | 11 | 0 | 3 (7 verifiziert, 1 teilgeprüft, 3 ungeprueft) | `data/catalog/runde-19.json` | `22c46cd` |
| 20 | Nachprüfung Kategorie „Kommunikation" komplett, 14 von 16 (kein Neufund, erste Ganze-Kategorie-Runde) | 0 | 14 | 0 | 2 (6 verifiziert, 6 teilgeprüft, 2 ungeprueft) | `data/catalog/runde-20.json` | folgt |
| 21 | Nachprüfung Kategorie „Realismus & Welt" komplett, 17/17 (kein Neufund) | 0 | 17 | 0 | 3 (6 verifiziert, 8 teilgeprüft, 3 ungeprueft/404) | `data/catalog/runde-21.json` | folgt |
| 22 | Nachprüfung Kategorie „Waffen & Kampf" komplett, letzte 2 (kein Neufund) | 0 | 2 | 0 | 0 (1 verifiziert, 1 teilgeprüft) | `data/catalog/runde-22.json` | folgt |
| 23 | Nachprüfung Kategorie „Wirtschaft & Banking" komplett, 13/13 (kein Neufund) | 0 | 13 | 0 | 0 (3 verifiziert, 10 teilgeprüft) | `data/catalog/runde-23.json` | folgt |
| 24 | Nachprüfung Kategorie „Admin & Sicherheit" komplett, 14/14 (kein Neufund) | 0 | 14 | 0 | 3 (9 verifiziert, 2 teilgeprüft, 3 ungeprueft) | `data/catalog/runde-24.json` | `83be0c9` |
| 25 | Nachprüfung Kategorie „MLOs, Kleidung & Assets" komplett, 8/8 (kein Neufund) | 0 | 8 | 0 | 3 (1 verifiziert, 4 teilgeprüft, 3 ungeprueft/Bot-Schutz) | `data/catalog/runde-25.json` | folgt |
| 25b | Letzte Streuverluste ohne `geprueft_am` (ui/staat/wohnen), Altbestand damit komplett durchgeprüft | 0 | 5 | 0 | 1 (4 verifiziert, 0 teilgeprüft, 1 ungeprueft/Bot-Schutz) | `data/catalog/runde-25b.json` | folgt |
| 26 | Erste Neusuche-Runde: 11 neue Plugins über discover/prefetch, 5 davon Konkurrenzprodukte mit Gruppenvergleich | 11 | 5 (Gruppenvergleiche bei Bestandseinträgen) | 0 | 0 (10 verifiziert, 1 teilgeprüft) | `data/catalog/runde-26.json` | folgt |
| 27 | Zweite Neusuche-Runde: 10 neue Plugins über discover --seit-letztem-lauf, 5 davon Wegwerf-Account-Cluster einzeln geprüft, 2 an Bestandsgruppen angeschlossen | 10 | 2 (Gruppenvergleiche bei `cd_dispatch`, `w2f-multicharacter`) | 0 | 0 (8 verifiziert, 2 teilgeprüft) | `data/catalog/runde-27.json` | folgt |
| 28 | Dritte Neusuche-Runde: 10 populärere Plugins (14–228⭐) über volle discover-Suche, 5 mit Gruppenvergleich, 1 Gruppennamen-Kollision (`mining`→`bergbau`) korrigiert | 10 | 5 (Gruppenvergleiche bei `lb_phone`, `mm_radio`, `qbx_hud`, `qbx_truckerjob`, `jim_mining`) | 0 | 0 (8 verifiziert, 2 teilgeprüft) | `data/catalog/runde-28.json` | folgt |
| 29 | Vierte Neusuche-Runde: 10 weitere Plugins (9–52⭐) aus der Restliste von Runde 28, 3 mit Gruppenvergleich, Kollisionsprüfung diesmal vorab durchgeführt | 10 | 4 (Gruppenvergleiche bei `fivem_appearance`, `illenium_appearance`, `qbx_vehicleshop`, `polaroid_camera`) | 0 | 0 (alle 10 verifiziert) | `data/catalog/runde-29.json` | folgt |
| 30 | Fünfte Neusuche-Runde: 4 offizielle Qbox-project-Repos plus 6 Community-Funde, 5 mit Gruppenvergleich (2 neue Gruppen selbst erkannt/kollisionsgeprüft) | 10 | 4 (Gruppenvergleiche bei `npwd`, `jg_mechanic`, `cd_garage`, `cipher-trucking`) | 0 | 0 (8 verifiziert, 2 teilgeprüft) | `data/catalog/runde-30.json` | folgt |
| 31 | Sechste Neusuche-Runde: 3 weitere offizielle Qbox-project-Repos plus 7 Community-Funde, 5 mit Gruppenvergleich (qbx_garages als 5. Mitglied der garage-Gruppe erkannt), `ergaenzt`-Schemafehler vor Commit korrigiert | 10 | 5 (Gruppenvergleiche bei `jim_bridge`, `cd_garage`, `qbx_garages`, `wasabi_multichar`, `qbx_ambulancejob`) | 0 | 0 (9 verifiziert, 1 teilgeprüft) | `data/catalog/runde-31.json` | folgt |
| 32 | Siebte Neusuche-Runde: 10 neue Plugins, erstes archiviertes offizielles Qbox-Repo (qbx_evidence) im Katalog, 2 mit Gruppenvergleich, `kompat_warnung`-/`archiviert.nachfolger`-Schemafehler vor Commit korrigiert | 10 | 2 (Gruppenvergleiche bei `qbx_hud`, `t-notify`) | 0 | 0 (9 verifiziert, 1 teilgeprüft) | `data/catalog/runde-32.json` | folgt |
| 33 | Achte Neusuche-Runde: 10 neue Plugins, 2 Autoren-Cluster einzeln bewertet, `distortionz_police` als kosmetischer qbx_policejob-Fork ehrlich eingeordnet, 4 mit Gruppenvergleich | 10 | 4 (Gruppenvergleiche bei `ox_mdt`, `cd_garage`, `qb_multicharacter`, `pulse_scoreboard`) | 0 | 0 (6 verifiziert, 4 teilgeprüft) | `data/catalog/runde-33.json` | folgt |
| 34 | Neunte Neusuche-Runde: 10 neue Plugins, `distortionz_robped` als eigenständig abgegrenzt, `pigeon-dice`-Lizenz auf escrow korrigiert, 1 mit Gruppenvergleich | 10 | 1 (Gruppenvergleich bei `leo_lockbox`, neue Gruppe `vehicle_lockbox`) | 0 | 0 (9 verifiziert, 1 teilgeprüft) | `data/catalog/runde-34.json` | folgt |
| 35 | Zehnte Neusuche-Runde: 10 neue Plugins, 2 neue blackmarket-Konkurrenten, 2 Lizenz-Fehleinstufungen (escrow→open_source) vor Commit korrigiert | 10 | 1 (blackmarket_script mit 2 neuen Vergleichspunkten) | 0 | 0 (6 verifiziert, 4 teilgeprüft) | `data/catalog/runde-35.json` | folgt |
| 36 | Elfte Neusuche-Runde: 10 populäre Plugins (10–34⭐), lone_radio bewusst nicht der radio-Gruppe zugeordnet, 3 mit Gruppenvergleich | 10 | 3 (Gruppenvergleiche bei `keep_crafting`, `xsound`, `qb_minigames`) | 0 | 0 (9 verifiziert, 1 teilgeprüft) | `data/catalog/runde-36.json` | folgt |
| 37 | Zwölfte Neusuche-Runde: letzte 10 Kandidaten des aktuellen discover-Pools, 2 Autoren-Cluster einzeln geprüft, 2 mit Gruppenvergleich | 10 | 2 (Gruppenvergleiche bei `qbx_hud`, `wasabi_fishing`) | 0 | 0 (alle 10 verifiziert) | `data/catalog/runde-37.json` | `c393c45` |
| 38 | Dreizehnte Neusuche-Runde: 10 kuratierte Kandidaten aus vollem discover-Lauf (0-8⭐), `pl_lib`-Fehlzuordnung korrigiert (Bridge statt ox_lib-Alternative), 1 mit Gruppenvergleich, neue Gruppe `wuerfelspiel` | 10 | 4 (Gruppenvergleiche/Synergie bei `qbx_garages`, `slrn_rolldice`, `jim_bridge`, `anx_bridge`) | 0 | 0 (alle 10 verifiziert) | `data/catalog/runde-38.json` | `d637ed1` |
| 39 | Vierzehnte Neusuche-Runde: 11 Kandidaten aus 3 gezielten Zusatzsuchen (qbox mlo/heist/clothing+weapon) statt des erschöpften Standardpools, 4 mit Gruppenvergleich, neue Gruppe `burgershot`, 2 Framework-Korrekturen | 11 | 4 (Gruppenvergleiche bei `jim_burgershot`, `loaf_housing`, `randolio_moneywash`, `qb_minigames`) | 0 | 0 (9 verifiziert, 2 teilgeprüft) | `data/catalog/runde-39.json` | folgt |
