# CHANGELOG

Fortlaufendes Protokoll aller Änderungen — Tool-Versionen, Katalog-Runden und Korrekturen.
Wird nach jedem Arbeitsschritt ergänzt, neueste Einträge oben.

Format je Eintrag:

```
## [Version oder Runde] – TT.MM.JJJJ

**Neu:** ...
**Geändert:** ...
**Korrigiert:** ...
**Katalog:** X neu, Y aktualisiert, Z Duplikate übersprungen, N ungeprüft
**Commit:** <hash>
```

---

## [Runde 32] Siebte Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins: `solidcore_studios_police_mdt_with_dispatch`, `gs-app-finance-jg`,
`stark_vehiclecloset`, `v-sport-fivem`, `v-hud-fivem`, `qbx_evidence`, `snowflake_death`,
`security_ac`, `ccn-notify`, `lsv_traffic`.

**Erstes archiviertes offizielles Qbox-Repo im Katalog:** `qbx_evidence` (Beweismittelsystem)
ist auf GitHub archiviert, kein Nachfolger im Repo, in der Beschreibung oder in der
Qbox-Organisation erkennbar — `archiviert.text` entsprechend dokumentiert, `nachfolger` bewusst
weggelassen statt geraten (Schema erlaubt es optional).

**Zwei mit Gruppenvergleich:** `v-hud-fivem`↔`qbx_hud` (Gruppe `hud`, bestand schon — dritter
Anbieter neben `cx-hud`/`matti-hud`; `v-hud-fivem` stammt vom selben Autor wie `v-phone-fivem`
aus Runde 29), `ccn-notify`↔`t-notify` (Gruppe `notify`, bestand schon).

**Zwei Schema-Fehler beim Schreiben abgefangen:** `kompat_warnung` kam vom Subagent dreimal als
Array statt als einzelnes Objekt (`[{...}]` statt `{...}`) — vor dem Commit auf Objektform
korrigiert. `qbx_evidence.archiviert.nachfolger` kam als `null`, das Schema verlangt bei Angabe
einen String (leer erlaubt) oder das Feld ganz weglassen — Feld entfernt statt `null` zu
erzwingen.

**Katalog:** 10 neu, 2 aktualisiert (Gruppenvergleiche bei `qbx_hud`, `t-notify`), 0 Duplikate
übersprungen, 0 ungeprüft (9 verifiziert, 1 teilgeprüft)
**Datei:** `data/catalog/runde-32.json` · **Commit:** folgt

---

## [Runde 31] Sechste Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins, darunter drei weitere offizielle Qbox-project-Repos:
`qbx_binoculars`, `qbx_divegear`, `qbx_gearbox` (`qbx_gearbox` liegt bei einem Fork-Autor, nicht
im offiziellen Qbox-project-Namespace — als `teilgeprueft` markiert, kein README). Dazu sechs
Community-Funde: `bd-badges`, `anx_bridge`, `tx_garage`, `ryn-multichar`, `ryn-garages`,
`digonto-ambulance-job`, `saiif_banlist`.

**Fünf mit Gruppenvergleich, ein Datenfehler dabei gefunden und korrigiert:** Der Subagent hat
festgestellt, dass `qbx_garages` schon dieselbe Gruppe `garage` trägt wie `cd_garage` — beide
Garagensysteme sind Teil derselben Vergleichsgruppe, nicht getrennte Kategorien wie ursprünglich
im Prompt vermutet. `tx_garage` und `ryn-garages` wurden entsprechend beide in die bestehende
Gruppe `garage` eingeordnet (jetzt 5 Mitglieder: `cd_garage`, `qbx_garages`, `qs_garages`,
`rhd_garage`, `tx_garage`, `ryn-garages`). Weitere Gruppen: `anx_bridge`↔`jim_bridge` (**neue
Gruppe `bridge`**, Kollisionscheck durchgeführt), `ryn-multichar`↔`wasabi_multichar` (Gruppe
`multichar`, bestand schon), `digonto-ambulance-job`↔`qbx_ambulancejob` (Gruppe `ambulance`,
bestand schon).

**`tx_garage` als erstes `escrow`-Produkt seit Runde 26/27/28/29/30**, die alle open_source
waren: `escrow_ignore`-Block im fxmanifest und explizite "Tebex-ready"-README-Badges als
Verkaufssignal erkannt — Standardannahme `open_source` bewusst nicht angewendet.

**Schema-Fehler beim Schreiben gefunden:** `ergaenzt` (für `qbx_divegear`↔`qbx_diving`) erwartet
laut Schema ein Array von `{id, plus, minus}`-Objekten, nicht simple ID-Strings — der Subagent
lieferte `["qbx_diving"]`, `npm run validate` schlug sofort fehl (`erwartet Objekt, gefunden
Text`), vor dem Commit auf das korrekte Objektformat korrigiert.

**Katalog:** 10 neu, 5 aktualisiert (Gruppenvergleiche bei `jim_bridge`, `cd_garage`,
`qbx_garages`, `wasabi_multichar`, `qbx_ambulancejob`), 0 Duplikate übersprungen,
0 ungeprüft (9 verifiziert, 1 teilgeprüft)
**Datei:** `data/catalog/runde-31.json` · **Commit:** folgt

---

## [Runde 30] Fünfte Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins, darunter erstmals vier **offizielle Qbox-project-Repos**, die bislang
nicht im Katalog standen: `qbx_seatbelt`, `qbx_scrapyard`, `qbx_streetraces`, `qbx_npwd`. Dazu
sechs Community-Funde: `lxs-scrapping`, `y_mechanic`, `rhd_garage`, `vl_eas`, `ls_trucking`,
`mbt_malisling`.

**Fünf mit Gruppenvergleich:** `qbx_npwd`↔`npwd` (Gruppe `phone`, bestand schon — `qbx_npwd` ist
die fehlende Qbox-Bridge für `npwd`, kein Konkurrenzprodukt), `y_mechanic`↔`jg_mechanic` (Gruppe
`mechanic`, bestand schon), `rhd_garage`↔`cd_garage` (Gruppe `garage`, bestand schon),
`qbx_scrapyard`↔`lxs-scrapping` (**neue Gruppe `scrapping`** — musste diesmal selbst erkannt
werden, das Discover-Briefing hatte keine Gruppenzuordnung vorgeschlagen), `ls_trucking`↔
`cipher-trucking` (**neue Gruppe `trucking`**, Konkurrenzprodukt zum Runde-27-Fund).

**Kollisionsprüfung für neue Gruppennamen hat sich diesmal ausgezahlt:** Der Subagent hat vor
Vergabe von `scrapping` und `trucking` gezielt `grep -rn '"gruppe": "..."' data/catalog/*.json`
laufen lassen (wie seit Runde 28 vorgeschrieben) — beide Namen waren frei, keine Korrektur nötig.

**Katalog:** 10 neu, 4 aktualisiert (Gruppenvergleiche bei `npwd`, `jg_mechanic`, `cd_garage`,
`cipher-trucking`), 0 Duplikate übersprungen, 0 ungeprüft (8 verifiziert, 2 teilgeprüft)
**Datei:** `data/catalog/runde-30.json` · **Commit:** folgt

---

## [Runde 29] Vierte Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins aus der offenen Restliste von Runde 28 (`data/.prefetch/kandidaten-28.md`/-29.md, 9–52 ⭐):
`jraxion_megaphone`, `murderface-appearance`, `pl-voting`, `bs_laymo`, `ap_pet`, `v-phone-fivem`,
`ers-integration`, `keep-progressbar`, `whereiaml_vehicleshop`, `y_camera`.

**Drei mit Gruppenvergleich:** `murderface-appearance`↔`fivem_appearance`/`illenium_appearance`
(Gruppe `appearance`, bestand schon), `whereiaml_vehicleshop`↔`qbx_vehicleshop` (Gruppe
`dealership`, bestand schon), `y_camera`↔`polaroid_camera` (neue Gruppe `camera` — vor dem
Schreiben per Grep über alle `data/catalog/*.json` auf Kollision geprüft, siehe Lehre aus Runde
28; diesmal keine Kollision).

**Mehrere Framework-Korrekturen gegenüber dem Prefetch-Vorschlag**, alle mit Codebeleg: `bs_laymo`
und `v-phone-fivem` zeigen zusätzlich zu bestätigten `qbx_core`-Exporten auch `ox_core`-Zugriffe
im Code — als informativer Hinweis in `contra` aufgenommen, ohne das framework-Urteil zu
verwässern (beide bleiben bei `qbcore_bridge`, da echte Multi-Framework-Bridges vorliegen).
`keep-progressbar` und `jraxion_megaphone` laufen komplett ohne Framework-Bezug im Code →
`standalone`. `pl-voting` bindet sich nur über die fremde `pl_lib`-Bridge an, kein direkter
`qbx_core`-Export im eigenen Code — als `contra`-Punkt dokumentiert statt verschwiegen.

**Katalog:** 10 neu, 4 aktualisiert (Gruppenvergleiche bei `fivem_appearance`,
`illenium_appearance`, `qbx_vehicleshop`, `polaroid_camera`), 0 Duplikate übersprungen,
0 ungeprüft (alle 10 `verifiziert`)
**Datei:** `data/catalog/runde-29.json` · **Commit:** folgt

---

## [Runde 28] Dritte Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins über `npm run discover` gefunden (Vollsuche statt
`--seit-letztem-lauf`, da der inkrementelle Lauf 0 neue Kandidaten lieferte — die Rohtreffer von
heute waren bereits über Runde 26/27 abgedeckt). 60 Kandidaten insgesamt, davon diesmal spürbar
populärere Funde als in den vorigen beiden Runden (14–228 ⭐ statt meist 0–2) — 10 davon
ausgewählt und ausgearbeitet: `um-idcard`, `z-phone`, `ac_radio`, `mbt_meta_clothes`,
`slrn_scratchcard`, `polarix_truckerjob`, `cx-hud`, `red40_mining`, `murderface-shops`,
`bs_credit`.

**Fünf mit Gruppenvergleich:** `z-phone`↔`lb_phone` (Gruppe `phone`, bestand schon),
`ac_radio`↔`mm_radio` (Gruppe `radio`, bestand schon), `cx-hud`↔`qbx_hud` (Gruppe `hud`, bestand
schon), `polarix_truckerjob`↔`qbx_truckerjob` (neue Gruppe `truckerjob`),
`red40_mining`↔`jim_mining` (neue Gruppe `bergbau`).

**Kollision beim Gruppennamen gefunden und korrigiert:** Der Subagent hatte für
`red40_mining`/`jim_mining` die Gruppe `mining` vergeben — die gab es aber bereits, belegt von
`crypto_mining_sim` (ein Krypto-Mining-Simulator, funktional komplett anderes Thema als
Erzabbau). Vor dem Schreiben aufgefallen, weil `npm run validate` die Gruppe sofort als
vollständig (2 Mitglieder) meldete, statt wie bei den anderen vier neuen Gruppen als „nur ein
Mitglied" — das war das Signal für eine Namenskollision statt einer echten Zusammenführung.
Auf `bergbau` umbenannt. **Lehre für künftige Runden:** Bei einer neu vergebenen `gruppe`-ID
nach dem Schreiben kurz `npm run validate` auf genau diese Gruppe prüfen — meldet sie „nur ein
Mitglied" nicht, obwohl nur ein echter Katalogeintrag dazugehören sollte, ist der Name bereits
anderweitig vergeben.

**Mehrere `kompat_warnung`-Funde mit echten Codebefunden statt reiner Übernahme des
Prefetch-Vorschlags:** `um-idcard` und `murderface-shops` haben je einen Legacy-Pfad mit
`exports['qb-inventory']` neben der eigentlichen Qbox-Anbindung im Code (konfigurationsabhängig,
kein hartes Problem, aber dokumentiert). `mbt_meta_clothes` nutzt `ox_core`- statt
`qbx_core`-Exports und ist laut README nur mit Ox Core/ESX getestet — als `standalone` statt
`qbcore_bridge` eingeordnet, Qbox-Kompatibilität ausdrücklich als unbestätigt markiert.
`z-phone` verlangt laut README eine Direktanpassung an `qb-core/server/player.lua` und zeigt
keinen `qbx_core`-Export im Code — `qualitaet: teilgeprueft` statt `verifiziert`.

**Katalog:** 10 neu, 5 aktualisiert (Gruppenvergleiche bei `lb_phone`, `mm_radio`, `qbx_hud`,
`qbx_truckerjob`, `jim_mining`), 0 Duplikate übersprungen, 0 ungeprüft (2 auf `teilgeprueft`
wegen dokumentierter Vorbehalte)
**Datei:** `data/catalog/runde-28.json` · **Commit:** folgt

---

## [Runde 27] Zweite Neusuche-Runde – 13.08.2026

**Neu:** 10 weitere Plugins über `npm run discover -- --seit-letztem-lauf` gefunden (20
Rohtreffer seit dem Runde-26-Lauf, 10 Kandidaten nach Dublettenfilter) und ausgearbeitet:
`cipher-admin`, `cipher`, `cipher-trucking`, `slrn_multijob`, `reo_wrap`, `ms_playersteal`,
`slrn_groups`, `cipher-dispatch`, `cipher-multicharacter`, `pxcommands`.

**Fünf der zehn Kandidaten (`cipher-admin`, `cipher`, `cipher-trucking`, `cipher-dispatch`,
`cipher-multicharacter`) stammen vom selben neuen GitHub-Account `XyraL`, alle 0 Sterne, alle am
selben Tag gepusht** — ein klassisches Wegwerf-Account-Muster. Statt sie pauschal zu verwerfen
oder unkritisch zu übernehmen, wurde jedes einzeln anhand von README-Umfang und Code-Stichprobe
bewertet: alle fünf zeigen echten Funktionsumfang und funktionierenden Code, bleiben also im
Katalog — `cipher-admin` bekam wegen eines gefundenen `exports['qb-inventory']`-Aufrufs neben der
ox_inventory-Anbindung aber `qualitaet: teilgeprueft` statt `verifiziert` (echte Bruchstelle auf
reinem Qbox-Stack, per `kompat_warnung` dokumentiert). Alle fünf tragen zusätzlich den Hinweis
„Lizenz untersagt laut README Weiterverbreitung/Wiederverkauf" in `contra`, obwohl der Code
öffentlich einsehbar ist.

**`pxcommands`** behauptet im README Qbox/QBCore-Kompatibilität, die Code-Stichprobe über alle
11 Lua-Dateien fand aber kein einziges Framework-spezifisches Muster — als `standalone`
eingeordnet, `qualitaet: teilgeprueft`, `kompat_warnung` mit `sicherheit: vermutung`, da die
Behauptung unbelegt bleibt.

**Zwei Gruppenzuordnungen wiederverwendet statt neu angelegt:** `cipher-dispatch` übernimmt die
bereits bestehende `gruppe: "dispatch"` von `cd_dispatch` (Escrow-Alternative, Vergleichshinweis
in `cd_dispatch.contra` ergänzt). `cipher-multicharacter` übernimmt `gruppe: "multichar"` und
wird damit dritter Anbieter neben `qb_multicharacter` und `w2f-multicharacter` (Runde 26) —
Vergleichshinweis in `w2f-multicharacter.contra` ergänzt.

**Muster bestätigt:** Subagent hat diesmal ausschließlich JSON zurückgeliefert statt selbst in
`data/catalog/runde-27.json` zu schreiben (anders als Runde 26) — die Hauptsession hat
geschrieben und gegen `data/_ids.txt`/bestehende Einträge geprüft, `npm run validate` grün ohne
Korrekturbedarf.

**Katalog:** 10 neu, 2 aktualisiert (Gruppenvergleiche bei `cd_dispatch`, `w2f-multicharacter`),
0 Duplikate übersprungen, 0 ungeprüft (2 auf `teilgeprueft` wegen dokumentierter Vorbehalte)
**Datei:** `data/catalog/runde-27.json` · **Commit:** folgt

---

## [Runde 26] Erste Neusuche-Runde – 13.08.2026

**Neu:** 11 bisher unbekannte Plugins in den Katalog aufgenommen — gefunden über
`npm run discover` (687 Rohtreffer → 25 Kandidaten in `data/.prefetch/kandidaten-26.md`),
davon 11 mit gutem Beleggrad (Stars/Aktivität/echter Funktionsumfang) manuell ausgewählt und
per `npm run prefetch --kandidaten` mit vollständiger Code-Stichprobe/README-Beleg vorbereitet.
Ausgearbeitet über einen Subagenten nach `docs/RECHERCHE.md` §7:
`mtc-cityhall`, `element_hud`, `w2f-multicharacter`, `slrn_rolldice`, `murderface-pets`,
`bs_garbagejob`, `cipher-mdt`, `w2f-ambulance`, `noted_fitbit`, `ad-houserobberys`, `matti-hud`.

**Fünf davon sind Konkurrenzprodukte zu Bestandseinträgen** (RECHERCHE.md §5-Vergleichsdaten
mitgepflegt): `mtc-cityhall`↔`qbx_cityhall` (Gruppe `cityhall`, neu angelegt),
`w2f-multicharacter`↔`qb_multicharacter` (Gruppe `multichar`, bereits vorhanden),
`bs_garbagejob`↔`qbx_garbagejob` (Gruppe `garbagejob`, neu angelegt),
`w2f-ambulance`↔`wasabi_ambulance` (Gruppe `ambulance`, bereits vorhanden — w2f-ambulance ist
die kostenlose Open-Source-Alternative zum $49.99-Escrow-Produkt),
`ad-houserobberys`↔`qbx_houserobbery` (Gruppe `houserobbery`, neu angelegt). Die drei neu
angelegten Gruppen erzeugen bei `npm run validate` erwartungsgemäß eine „nur ein Mitglied"-
Warnung, weil der Validator `gruppe` nur aus `plugins[]` zählt, nicht aus den `updates[]`, die
den Bestandseintrag ergänzen — löst sich beim Merge im Import/Build auf, kein Fehler.

**Framework-Korrekturen gegenüber dem Prefetch-Vorschlag:** vier Kandidaten hatten laut
fxmanifest-Rohsignalen `qbox_nativ` vorgeschlagen, README bestätigte aber echte
Qbox/QBCore/ESX-Autoerkennung im Code → auf `qbcore_bridge` korrigiert: `element_hud`,
`w2f-multicharacter`, `bs_garbagejob`, `noted_fitbit`.

**Zwei Abhängigkeits-Bereinigungen:** `lb-phone` → `lb_phone` (tatsächliche Katalog-ID) bei
`noted_fitbit`; `t3_lockpick` bei `ad-houserobberys` NICHT als `abhaengigkeiten`-ID übernommen
(steht noch in keinem Katalogeintrag) — stattdessen als `contra`-Punkt festgehalten, statt eine
ID zu erfinden.

**Katalog:** 11 neu, 5 aktualisiert (Gruppenvergleiche bei `qbx_cityhall`, `qb_multicharacter`,
`qbx_garbagejob`, `wasabi_ambulance`, `qbx_houserobbery`), 0 Duplikate übersprungen, 0 ungeprüft
**Datei:** `data/catalog/runde-26.json` · **Commit:** folgt

---

## [v3.0-r25b] Erstes GitHub-Release – 13.08.2026

**Neu:** Repo `T0XiQ96/Qbox-Server-Planer` (privat) angelegt, kompletter Verlauf (33 Commits)
gepusht. Erstes Release **v3.0-r25b** mit `dist/qbox-planer.html` als Anhang —
428 KB, 262 Plugins, per Doppelklick über `file://` nutzbar.

**Neu:** `docs/SUBAGENT-VORLAGE.md` — der feste Teil des Recherche-Prompts in zwei Varianten
(Nachprüfung / Neusuche) plus die Pflichtschritte nach der Rückmeldung. Bisher wurde dieser
Prompt in jeder Runde neu formuliert: 80 % Wiederholung, jedes Mal neu bezahlt, und in den
Runden ohne den Schema-Block lieferte der Subagent regelmäßig `framework` als Array oder
`lizenz: "MIT"` zurück. Der Block steht jetzt fest drin.

**Neu:** CLAUDE.md §2.8 — jeder Build wird zu einem GitHub-Release mit der `catalogVersion` als
Tag. `dist/` ist gitignored (reine Ableitung), das Release ist also der einzige Ort, an dem die
fertige Datei liegt.

## [Sparmaßnahmen] Briefing- und Doku-Diät – 13.08.2026

Nach dem Discover-Bau gezielt nach weiteren Einsparungen gesucht, **ohne Genauigkeitsverlust**.
Drei Stellen gefunden, alle gemessen statt geschätzt:

**1. fxmanifest-Dateilisten zusammenfassen.** Messung: bei `bob74_ipl` waren **52 von 60**
Briefing-Zeilen reine Dateipfade (`"gtav/ammunations.lua"`). Solche Zeilen können ein
Framework-Urteil nicht beeinflussen — entscheidend sind `@resource/`-Includes, `dependencies`
und Metafelder. Läufe ab 3 solchen Zeilen werden jetzt zu `… N weitere Dateizeilen ohne
@-Include …` gefaltet; alles mit `@` bleibt wörtlich. Ergebnis: Briefing 5,2 KB → **1,9 KB
(−63 %)**. **Zusätzlich ein Genauigkeitsgewinn:** vorher schnitt die 60-Zeilen-Grenze das Ende
langer Manifeste ab — genau dort stehen `dependencies` und `provide`. Jetzt ist die vollständige
Struktur sichtbar.

**2. Lizenz-Fließtext im README nur einmal.** GPL-READMEs drucken 5–10 wortgleiche Zeilen ab
(„Free Software Foundation", „WITHOUT ANY WARRANTY", …). Die erste bleibt als Lizenzbeleg, der
Rest entfällt.

**3. `docs/PROGRESS.md` von 313 auf 254 Zeilen.** Die Datei wird laut CLAUDE.md §0 bei **jedem**
Session-Start gelesen — Verdopplung kostet dort jedes Mal. Entfernt: 12 „wichtigster
Fund"-Absätze der Runden 4–15, die den CHANGELOG wortgleich verdoppelten, und ein veralteter
Sonnet-Test-Block (Runden 7–9), der vom späteren 7–15-Block überholt war. An ihre Stelle tritt
eine Destillat-Liste der **sieben wiederkehrenden Fehlermuster** — das ist der übertragbare Teil,
den eine neue Session tatsächlich braucht. Die Einzelfunde bleiben vollständig im CHANGELOG.

**Ebenfalls verbessert (Genauigkeit, kostenneutral):** Die Code-Stichprobe nimmt bei Repos mit
mehr als 40 `.lua`-Dateien nicht mehr die alphabetisch ersten, sondern priorisiert
`bridge/framework/compat` vor `client|server|shared` vor dem Rest, und stellt `locales/`,
`config/`, `stream/` hinten an. Vorher konnte bei großen Repos die Stichprobe komplett aus
Sprachdateien bestehen, während die Framework-Aufrufe in `server/` ungeprüft blieben.

## [Werkzeug] Discover — Neusuche als Script – 13.08.2026

**Neu:** `npm run discover` (`scripts/discover.mjs`). Findet Kandidaten für **neue**
Katalogeinträge über mehrere GitHub-Suchen gleichzeitig und sortiert deterministisch aus, was
kein Modell sehen muss: bereits im Katalog vorhandene Treffer (nach ID **und** Link-Ziel),
vermutliche Umbenennungen, und Repos ohne `fxmanifest.lua` (= keine FiveM-Ressource). Erster
Lauf: 687 Rohtreffer aus 6 Abfragen bei **11 API-Aufrufen** → 74 bekannt, 24 Umbenennungen,
323 ohne Manifest, Rest echte Kandidaten. Dafür wurde bisher ein Subagent bezahlt.

**Neu:** `npm run prefetch -- --kandidaten` arbeitet jetzt auch für Plugins, die noch nicht im
Katalog stehen. Zusätzlich zum bisherigen Briefing entsteht pro Kandidat ein **Feldvorschlag** —
ein Katalogeintrag-Gerüst, in dem alles Ablesbare gefüllt ist (`version`, `letztes_update`,
`lizenz`, `abhaengigkeiten`, `archiviert`, `quelle`, begründeter `framework`-Vorschlag, `gruppe`).
Alles Urteilsabhängige steht als `<...>`-Platzhalter drin; die sind schema-ungültig, `validate`
fängt sie also ab, falls sie stehen bleiben.

**Wichtigste Design-Entscheidung:** Ein Konkurrenzprodukt ist **keine** Dublette. Der erste
Entwurf warf `mtc-cityhall` (gleicher Zweck wie `qbx_cityhall`, anderer Anbieter) als Duplikat
weg — das hätte reihenweise echte Funde verschluckt und genau die Vergleichsdaten gekostet, für
die RECHERCHE.md §5 existiert. Jetzt trennt `scripts/lib/dubletten.mjs` vier Fälle: `id` und
`link` (echte Dublette), `umbenannt` (gleicher Anbieter → Bestandseintrag aktualisieren) und
`gruppe` (anderer Anbieter → eigener Eintrag, `gruppe` wird gleich mitgeliefert). Das senkte die
Zahl der von Hand zu klärenden Fälle von 117 auf 24 und lieferte die Gruppenzuordnung gratis mit.

**Geändert:** HTTP-Schicht (Timeout, Cache, Token, Parallelität) aus `prefetch.mjs` nach
`scripts/lib/netz.mjs` gezogen, Namens-/Dublettenlogik nach `scripts/lib/dubletten.mjs`. Beide
Scripts laufen über die IP des Nutzers — die Höflichkeitsregeln stehen jetzt an einer Stelle,
statt dass ein zweites Werkzeug versehentlich aggressiver wird als das erste.

**Neu:** `docs/RECHERCHE.md` §7 beschreibt den Zwei-Phasen-Ablauf einer Neusuche-Runde
(Kandidaten finden → Ausgewählte vertiefen) und die Aufnahmekriterien.

**Tests:** `npm run selftest` 37 → 45 Prüfungen. Die acht neuen decken die Dublettenlogik ab,
inklusive der Fälle, an denen der erste Entwurf gescheitert wäre.

## [Runde 25b] – 13.08.2026

**Geändert:** Letzte 5 Katalogeinträge ohne `geprueft_am` nachgeprüft (Streuverluste außerhalb
„assets": `qb-inventory`/ui, `ps-mdt`/staat, `ps-housing`+`ps-realtor`/wohnen, `qs-inventory`/ui).
**Korrigiert:** `ps-realtor` war fälschlich als kostenpflichtig geführt (escrow, 5 EUR/Monat) —
tatsächlich öffentliches, quelloffenes Repo ohne Escrow, Preis auf `null` korrigiert.
`ps-housing` und `ps-realtor` beide seit 06.02.2026 archiviert (Project-Sloth-Fokus auf
ps-mdt v3). `ps-mdt` selbst weiterhin aktiv, Qbox-Support jetzt textlich per README belegt
(vorher nur Vermutung).
**Katalog:** 0 neu, 5 aktualisiert, 0 Duplikate übersprungen, 1 weiterhin ungeprueft
(`qs-inventory`, Tebex-Bot-Schutz)
**Meilenstein:** Kompletter Altbestand jetzt durchgeprüft — 0 Einträge mehr ohne `geprueft_am`.
**Commit:** folgt

## [Runde 25] – 13.08.2026

**Geändert:** Kategorie „MLOs, Kleidung & Assets" komplett nachgeprüft, 8/8 Einträge (kein
Neufund). `bob74_ipl` klar verifiziert; die restlichen 7 sind fremde Shop-/Forum-Seiten ohne
GitHub-Repo (Tebex-Bot-Schutz bei `gabz`/`k4mb1`/`patoche`, reine Forum-Übersichten bei
`cfx_free_mlos`/`eup`) — auf `teilgeprueft`/`ungeprueft` mit Websuche-Belegen eingeordnet, keine
geratenen Preise/Lizenzen.
**Neufund (Datenpflege, nicht Recherche):** `kingmaps_shop` ist ein bestätigtes Duplikat von
`kingmaps` (identische URL) — noch nicht zusammengeführt, siehe PROGRESS.md „Bewusst
verschoben". `patoche`-Link könnte veraltet sein (aktive Produktseiten unter
`patoche-mapping.tebex.io` statt Katalog-Link `patoche-maps.tebex.io`), wegen Bot-Schutz nicht
zweifelsfrei geklärt.
**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 6 weiterhin
teilgeprueft/ungeprueft (Shop-/Forum-Seiten ohne einsehbaren Code)
**Commit:** folgt

## [Runde 24] – 13.08.2026

**Neu:**
- `data/catalog/runde-24.json` — Kategorie „Admin & Sicherheit" komplett (14/14). 9 Einträge
  direkt aus dem Prefetch-Briefing geschrieben, 5 kniffligere Fälle (toter Link, drei externe
  Anti-Cheat-Anbieterseiten, ein Tebex-Shop) an einen Subagent delegiert.

**Korrigiert:**
- `screenshot_basic`: **wichtigster Fund der Runde** — Katalog-Link zeigte auf
  `citizenfx/cfx-server-data` (ein generisches, archiviertes Datenrepo ohne screenshot-basic
  überhaupt zu enthalten, Dateibaum durchsucht). Echtes Repo `citizenfx/screenshot-basic`
  gefunden und verlinkt.
- `qb_doorlock`: harte `@qb-core/`-Datei-Bindung im Code bestätigt, zusätzlich abhängig von
  Legacy-Stack (`qb-input`, `qb-minigames`) — `framework` auf `qbcore_only` korrigiert.
- `ps_donator`: archiviert seit 06.02.2026 (gleicher Tag wie `ps_drugprocessing`/
  `ps_weedplanting` aus Runden 17/18 — Project-Sloth-Muster jetzt neunmal bestätigt).
- `ps_adminmenu`: README nennt `qbox_core` ausdrücklich, Code-Stichprobe bestätigt echte
  Framework-Autoerkennung.
- `badger_discord_api`: Link tot, `JaredScar/Badger_Discord_API` (Unterstriche statt CamelCase)
  gefunden und bestätigt.
- `eagleac`, `waveshield`: beide Original-Domains verkauft/verwaist (leiten auf
  Domain-Verkaufsseiten um) — Projektstatus unklar, bewusst `ungeprueft` belassen statt
  spekulativer neuer Domains als sicher zu behandeln.
- `fiveguard`, `okokreports`: Bot-Schutz verhinderte Direktbeleg, Kernangaben nur aus
  Websuche-Snippets — entsprechend vorsichtig als `ungeprueft`/`vermutung` markiert.

**Katalog:** 0 neu, 14 aktualisiert (9 verifiziert, 2 teilgeprüft, 3 ungeprueft)
**Commit:** folgt

---

## [Runde 23] – 13.08.2026

**Neu:**
- `data/catalog/runde-23.json` — Kategorie „Wirtschaft & Banking" komplett (13/13). 3 Einträge
  direkt aus dem Briefing geschrieben, 10 an einen Subagent delegiert.

**Korrigiert:**
- `qb_banking`: Code-Stichprobe fand DREI rote Flaggen gleichzeitig (harter `@qb-core`-Include,
  `exports['qb-target']`, `exports['qb-inventory']`) — `framework` von unbekannt auf
  `qbcore_only` korrigiert, bisher fälschlich als möglicherweise Qbox-tauglich im Katalog.
  `qb_crypto` zeigt dasselbe Muster mit zwei roten Flaggen.
- `wasabi_oxshops`, `pl_printer`, `vending_machines`, `keep_crafting`, `crypto_mining_sim`,
  `give_cash`: Links korrigiert (Groß-/Kleinschreibung, Profil- statt Repo-Link, Platzhalter).
  Alle nur mit fxmanifest belegt (kein README/vollständige Code-Stichprobe), deshalb bewusst
  `teilgeprueft` statt `verifiziert` — auch wenn zwei davon in einer Vergleichsgruppe stehen
  (RECHERCHE.md §4 verlangt für `verifiziert` die volle Prüftiefe, nicht nur Gruppenzugehörigkeit).
- `keep_crafting`: seit 2023 archiviert, harte `qb-core`-Abhängigkeit.
- 4× `okok*`-Produkte (banking/billing/crafting/marketplace): konkrete Produktseiten statt nur
  Store-Startseite gefunden, `lizenz` auf `escrow` korrigiert.

**Katalog:** 0 neu, 13 aktualisiert (3 verifiziert, 10 teilgeprüft)
**Commit:** folgt

---

## [Runde 22] – 13.08.2026

**Neu:**
- `data/catalog/runde-22.json` — Kategorie „Waffen & Kampf" komplett (letzte 2 offene Einträge).

**Korrigiert:**
- `renewed_weaponscarry`: vollständig durch Code-Stichprobe verifiziert (ox_lib/ox_inventory,
  keine Framework-Bindung).
- `weapon_balancing`: Websuche bestätigt, dass es sich bewusst um eine ganze Kategorie
  konkurrierender Ansätze handelt (kostenlose Config-Only-Scripts bis kostenpflichtige
  Live-Editor-Tools) — passend zur bestehenden Katalogangabe „Version: Diverse". Bewusst kein
  einzelner Ersatzlink gesetzt, um die kategoriale Natur nicht falsch darzustellen.

**Katalog:** 0 neu, 2 aktualisiert (1 verifiziert, 1 teilgeprüft)
**Commit:** folgt

---

## [Runde 21] – 13.08.2026

**Neu:**
- `data/catalog/runde-21.json` — Kategorie „Realismus & Welt" komplett (17/17). 6 Einträge
  direkt aus dem Briefing geschrieben, 11 an einen Subagent delegiert.

**Korrigiert:**
- `dpemotes`: Code-Stichprobe fand rote Flagge (`mysql-async` statt oxmysql) — bisher unbekanntes
  Kompatibilitätsrisiko, jetzt dokumentiert.
- `renewed_dutyblips`: README nennt Qbox ausdrücklich in der Framework-Liste, läuft über eigene
  `Renewed-Lib`-Bridge-Abstraktion.
- `renewed_weathersync`: Code-Stichprobe bestätigt eine ECHTE Framework-Autoerkennung im Code
  (nicht nur behauptet) — seltener Fall von vollständig code-belegtem Multi-Framework-Support.
- `vsync`: **Qualitätssicherung vor dem Schreiben** — der Subagent schlug einen aktiv gepflegten
  Fork (`vSyncR`) als Ersatzlink vor, das hätte aber der bestehenden Katalog-Einordnung „Legacy/
  archiviert, Nachfolger qbx_weathersync" widersprochen. Stattdessen den tatsächlichen
  archivierten Original-Repo (`DevTestingPizza/vSync`) verlinkt, der zur bestehenden Einordnung
  passt — der aktive Fork wurde bewusst NICHT übernommen.
- `remove_props`: gefundenes Repo (`Simple-World-Clear`) entfernt world-weit Props+Fahrzeuge,
  die Katalogbeschreibung meint aber nur spielergebundene Props — als unsicherer Match markiert
  statt stillschweigend gleichgesetzt.
- `qb_vehiclefailure`, `rpemotes`: keine verlässlichen Nachfolger gefunden (mehrere
  konkurrierende Forks bzw. gar kein Kandidat) — bewusst kein Ersatzlink geraten.
- 6 weitere Link-Korrekturen (Platzhalter/Tippfehler): `polaroid_camera`, `turbulence_off`,
  `scullyy_emotemenu`, `npc_density`, `zyke_smoking`, `cd_easytime`.

**Katalog:** 0 neu, 17 aktualisiert (6 verifiziert, 8 teilgeprüft, 3 ungeprueft/404)
**Commit:** folgt

---

## [Runde 20] – 13.08.2026

**Neu:**
- `data/catalog/runde-20.json` — Kategorie „Kommunikation & Telefon" komplett (14 von 16, auf
  Nutzerwunsch die ganze Kategorie statt der bisherigen 10–12er-Batches). 6 Einträge direkt aus
  dem Briefing geschrieben, 8 an einen Subagent delegiert.

**Korrigiert:**
- `qbot`: **wichtigster Fund** — entgegen der bisherigen Katalog-Annahme KEIN FXServer-Resource,
  sondern ein eigenständiger Discord-Bot (TypeScript/Node.js/Docker), läuft als separater Dienst.
- `qbx_radio`/`qbx_radio_legacy`: beide archiviert seit 09.07.2026 bestätigt, Nachfolger
  `mm_radio` war bereits korrekt vermerkt.
- `pma_radio_ui`: **Qualitätssicherung vor dem Schreiben** — der Subagent schlug
  `Qbox-project/mm_radio` als Link vor, das hätte aber der Katalogbeschreibung widersprochen
  (`pma_radio_ui` soll laut Katalog "framework-frei, Alternative zu mm_radio" sein, `mm_radio`
  ist aber `qbox_nativ`). Fund bewusst verworfen statt eines widersprüchlichen Eintrags.
- `wasabi_boombox`: Link-Tippfehler behoben (Groß-/Kleinschreibung).
- `okokchat`, `okokphone`, `qs_smartphone`: konkrete Produktseiten statt nur Store-Startseite
  gefunden; bei `okokphone` unbestätigten Preis bewusst NICHT übernommen (Budget ausgeschöpft).
- `gcphone`: kein eindeutiges Original-Repo unter mehreren privaten Forks auffindbar, kein
  Ersatzlink geraten.

**Katalog:** 0 neu, 14 aktualisiert (6 verifiziert, 6 teilgeprüft, 2 ungeprueft)
**Commit:** folgt

---

## [Runde 19] – 13.08.2026

**Neu:**
- `data/catalog/runde-19.json` — letzte 10 von 32 Einträgen der Kategorie „Crime & Unterwelt"
  nachgeprüft (Teil 3/3, Kategorie damit komplett), plus ein Nachtrag zu `qb_traphouse` aus
  Runde 18. **Erste Runde mit `npm run prefetch`:** sechs Einträge (fünf `qbx_*`-Repos plus der
  Nachtrag) wurden direkt aus dem automatisch erzeugten Briefing geschrieben, ganz **ohne
  Subagent** — vollständige Code-Stichprobe, fxmanifest und README lagen bereits vor. Nur die
  fünf kniffligen Restfälle (toter Owner, zwei Tebex-Bot-Schutz-Shops, zwei zu bestätigende
  Namens-Kandidaten) gingen an einen einzigen Subagent, der mit 9 Tool-Aufrufen auskam.

**Korrigiert:**
- `qbx_lockpick`: archiviert seit 09.07.2026 ('Not Maintained'), bisher nicht erfasst.
- `qbx_pawnshop`, `qbx_storerobbery`, `qbx_truckrobbery`, `qbx_weed`: vollständig durch
  automatische Code-Stichprobe verifiziert (ausschließlich grüne Flaggen). `qbx_storerobbery`
  zusätzlich als README-seitig 'WIP' gekennzeichnet vermerkt.
- `qb_traphouse` (Nachtrag zu Runde 18): die automatische Stichprobe fand eine zweite, zuvor von
  Hand übersehene rote Flagge — `exports['qb-target']` in `client/main.lua:25`.
- `rahe_boosting`: derselbe Fund wie `rahe_racing` in Runde 16 — GitHub-Owner existiert nicht
  mehr, tatsächlich ein kostenpflichtiges Tebex-Produkt desselben Anbieters (RAHE Development).
  `lizenz` auf `escrow` korrigiert.
- `randolio_moneywash`: bisher nur Profil-Link, `Randolio/randol_moneywash` gefunden und über
  fxmanifest bestätigt.
- `rainmad_heists`, `t1ger_heists`, `utk_fingerprint`: trotz Suche kein eindeutiges Produkt/Repo
  bestätigbar — bewusst `ungeprueft` belassen statt eines geratenen Treffers (RAHE-Boosting-Fall
  zeigt: das Suchbudget aus RECHERCHE.md 1c/1d wurde eingehalten, nicht vorzeitig aufgegeben).

**Katalog:** 0 neu, 11 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (7 verifiziert, 1
teilgeprüft, 3 auf `ungeprueft` mit korrigiertem/fehlendem Link)
**Kategorie „Crime & Unterwelt" nach Runden 17–19 komplett durchgeprüft (32/32).**
**Katalogstand:** 262 Plugins, 85 verifiziert/teilgeprüft (32 %), 34 archiviert.
**Commit:** folgt

---

## [Werkzeug] Prefetch für Recherche-Runden – 12.08.2026

Kein Katalog-Inhalt, sondern Werkzeug: die mechanische Hälfte einer Recherche-Runde läuft ab
jetzt als Script, nicht mehr im Subagent-Kontext.

**Neu:**
- `scripts/prefetch.mjs` + `npm run prefetch`. Erzeugt vor jeder Runde ein Briefing nach
  `data/.prefetch/runde-N.md` mit allem Deterministischen: Repo existiert/archiviert/letzter
  Push/Lizenz/Default-Branch, fxmanifest **wörtlich**, README-Belegzeilen **wörtlich**, und eine
  Code-Stichprobe über alle `.lua`-Dateien gegen die Muster aus RECHERCHE.md §3 mit Fundstellen
  als `datei.lua:zeile`. Bei totem Link zusätzlich die ähnlichsten Repo-Namen desselben Owners.
- Den Subagents wird nur der **Pfad** genannt, nie der Inhalt — das Briefing landet dadurch weder
  im Haupt- noch mehrfach im Subagent-Kontext.

**Warum es billiger ist:** Repo-Metadaten werden pro **Owner** gebündelt geholt statt pro Repo.
Eine Runde braucht dadurch ~4 API-Aufrufe statt ~15 und läuft selbst ohne Token im Limit.
Dateiinhalte kommen über `raw.githubusercontent.com`, das nicht am API-Limit hängt. Cache mit
7 Tagen Gültigkeit (kürzer als bei `linkcheck`, weil hier der Archiv-Status zählt).
Gemessen: 10 Plugins in **4,9 s** bei 7 API-Aufrufen, Briefing ~10 KB. Zum Vergleich Runde 18:
11 Plugins, ~400 s, ~164k Tokens über drei Subagents.

**Warum es genauer ist:** Die Code-Stichprobe nach §3 war vorher faktisch nie durchgeführt worden
(die Subagents schrieben durchgehend „Code-Stichprobe nicht durchgeführt" → `teilgeprueft`).
Das Script prüft **alle** `.lua`-Dateien. Beim Gegentest an `qb_traphouse` fand es zwei rote
Flaggen — darunter `exports['qb-target']` in `client/main.lua:25`, das der Subagent in Runde 18
von Hand übersehen hatte. Nebenbei fiel auf, dass `qbx_lockpick` (für Runde 19 vorgesehen)
bereits archiviert ist.

**Geändert:**
- `docs/RECHERCHE.md`: neuer Abschnitt 1a (Prefetch zuerst), alte URL-Muster nach 1b verschoben
  und um ein ausdrückliches Verbot ergänzt, GitHub-HTML-Seiten zu holen wenn die API dieselbe
  Frage beantwortet. Neu in 1c und 1d: **Suchbudgets** — höchstens 2 Abrufe pro totem Link,
  höchstens 3 pro Premium-Produkt. Begründung im Dokument: in den Runden 16–18 kostete jeder tote
  Link 30–45 Abrufe und endete trotzdem bei „nicht auffindbar". Abschnitt 4 hält jetzt fest, dass
  `verifiziert` dank automatischer Code-Stichprobe häufiger erreichbar ist.
- `CLAUDE.md` §5: `prefetch` dokumentiert, inklusive Hinweis auf `GITHUB_TOKEN`/`GH_TOKEN`.
- `.gitignore`: `data/.prefetch/` und `data/.prefetchcache.json` (reine Ableitung, jederzeit neu
  erzeugbar — wie `.linkcache.json`).

**Offen / vorgemerkt:** Der in Runde 18 übersehene `exports['qb-target']`-Treffer bei
`qb_traphouse` ist noch nicht im Katalog nachgetragen — gehört in Runde 19 mit erledigt.

**Katalog:** unverändert (262 Plugins). `npm run validate` grün, `npm run selftest` 37/37.
**Commit:** folgt

---

## [Runde 18] – 12.08.2026

**Neu:**
- `data/catalog/runde-18.json` — nächste 11 von 32 Einträgen der Kategorie „Crime & Unterwelt"
  nachgeprüft (Teil 2/3). Recherche über 3 parallele Subagents, durchgehend mit vorab
  aufgelösten Owner/Repo-Pfaden (siehe Runde 17).

**Korrigiert:**
- `ps_ui`, `ps_weedplanting`: beide seit Runde 18 archiviert bestätigt (04.08.2025 bzw.
  06.02.2026, letzteres am selben Tag wie `ps_drugprocessing` aus Runde 17) — bestätigt das
  Project-Sloth-Muster jetzt zum siebten/achten Mal. `ps_ui` hat einen benannten Nachfolger
  (`ps_lib`), auf den die restliche Funktionalität zusammengeführt wurde.
- `qb_keyminigame`, `qb_skillbar`: beide komplett aus der `qbcore-framework`-Org entfernt (404,
  Org-Suche bestätigt 0 Treffer) — weitere Fälle des schon aus Runde 8/9 bekannten Musters
  (`qb-customs`, `qb-gangmenu`).
- `qb_traphouse`: existiert noch, ist aber seit 20.05.2024 archiviert. Harte
  `@qb-core/shared/locale.lua`-Datei-Include im fxmanifest bestätigt echtes Bridge-Risiko —
  `kompat_warnung` von Vermutung auf bestätigt hochgestuft.
- `qb_minigames`: Standalone-Aussage (bisher unbelegte Altbestand-Übernahme) jetzt im Code/README
  tatsächlich verifiziert.
- `qbx_drugs`, `qbx_jewelery`: Abhängigkeiten im Code bestätigt bzw. präzisiert (ox_target/
  ox_inventory bzw. zusätzlich ox_target).
- `qbx_bankrobbery`, `qbx_fireworks`, `qbx_houserobbery`: Versionen/Grunddaten bestätigt, einige
  Synergie-/Abhängigkeitsangaben im aktuell einsehbaren Code nicht auffindbar — für spätere
  Code-Stichprobe vorgemerkt statt spekulativ korrigiert.

**Katalog:** 0 neu, 11 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (5 verifiziert, 4
teilgeprüft, 2 auf `ungeprueft` mit `link_status: "404"`)
**Kategorie „Crime & Unterwelt" nach Runden 17–18 zu 22/32 durchgeprüft — restliche 10 offen für
eine spätere Runde 19.**
**Session-Ende:** Nutzer hat für diese Session explizit „Runden 16–18, dann stoppen" vorgegeben.
Nach diesem Commit folgt kein eigenständiger Rundenstart mehr, sondern Zwischenstand-Meldung.
**Commit:** folgt

---

## [Runde 17] – 12.08.2026

**Neu:**
- `data/catalog/runde-17.json` — erste 11 von 32 Einträgen der Kategorie „Crime & Unterwelt"
  nachgeprüft (Teil 1/3). Recherche über 3 parallele Subagents, erstmals mit vorab von der
  Hauptsession aufgelösten Owner/Repo-Pfaden statt eigenständiger Suche (siehe RECHERCHE.md
  1a–1c, in dieser Runde eingeführt).

**Korrigiert:**
- `jim_pawnshop`, `mhacking`, `mt_washing`: alle drei Katalog-Links liefern 404, unter keinem
  bekannten Namens-/Autorenmuster ein Ersatz auffindbar (systematisch geprüft: vollständige
  Repo-Listen der Autoren/Orgs, jeweilige Shop-/Doku-Seiten) — bewusst auf `ungeprueft` mit
  `link_status: "404"` gesetzt, kein Ersatzlink geraten.
- `ps_drugprocessing`: seit 06.02.2026 archiviert — bestätigt zum sechsten Mal das
  „Project-Sloth archiviert reihenweise ps-*-Repos"-Muster (nach ps-inventory, ps-hud, ps-fuel,
  ps-housing, ps-realtor).
- `blackmarket_script`, `moneywash_qbtarget`, `pipe_hacking`: Platzhalter-Links
  (`github.com/topics/qbox`) durch echte Repos ersetzt (`pulsepk/pl_blackmarket`,
  `morethancodenl/mtc-moneywash`, `vizuugit/vzu_circuit_hack`).
- `pipe_hacking`: Lizenz war fälschlich als `escrow` geführt — README bestätigt „Free,
  open-source" unter MIT, korrigiert.
- `pl_fraud`: bisher nur Profil-Link ohne echtes Repo — `pulsepk/pl_fraud` gefunden und
  bestätigt (gleiches Namensschema wie `pl_atmrob`).
- `pl_atmrob`: Qbox-Support jetzt direkt im README belegt statt nur vermutet.
- `drc_drugs`: konkrete Produktseite (statt nur Store-Startseite) gefunden, Preis 42 EUR
  einmalig bestätigt.
- `okokrobbery`: Produkt unter diesem Namen weder im Tebex-Store noch im Cfx-Forum auffindbar —
  bewusst `ungeprueft` belassen, kein Ersatzlink geraten (möglicherweise Katalogfehler/
  umbenanntes Produkt, für spätere Klärung vorgemerkt).

**Katalog:** 0 neu, 11 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (2 verifiziert, 6
teilgeprüft, 4 auf `ungeprueft` mit korrigiertem/fehlendem Link)
**Commit:** folgt

---

## [Runde 16] – 12.08.2026

**Neu:**
- `data/catalog/runde-16.json` — letzte 10 von 30 Einträgen der Kategorie „Zivil-Jobs &
  Aktivitäten" nachgeprüft (Teil 3/3, Kategorie damit komplett). Recherche über 3 parallele
  Subagents.

**Korrigiert:**
- `randolio_burgershot`, `randolio_pizzajob`: Katalog-Links unter dem alten Namensmuster
  `randolio_*` existieren nicht mehr (404) — Autor benennt seine Repos konsequent `randol_*`.
  Beide Links korrigiert, `framework` von `standalone` auf `qbcore_bridge` korrigiert (README
  bestätigt ESX/QB-Bridge statt framework-agnostisch).
- `randolio_busjob`: kein Repo unter irgendeinem bekannten Namensmuster des Autors auffindbar
  (404, trotz gezielter Suche unter allen `randol_*`-Repos) — vermutlich nie veröffentlicht.
  Kein Ersatzlink geraten, bewusst auf `ungeprueft` mit `link_status: "404"` gesetzt.
- `rahe_racing`: Katalog-Link (`github.com/rahe-rescue/rahe-racing`) existiert nicht — kein
  Open-Source-Repo, tatsächlich ein kostenpflichtiges Tebex-Script. `lizenz` von `open_source`
  auf `escrow` korrigiert, Link auf die Tebex-Seite gesetzt.
- `wasabi_fishing`: Katalog-Link war nur die GitHub-Org-Profilseite, kein echtes Repo — echtes
  Repo (`wasabirobby/wasabi_fishing`) gefunden. `framework` von `standalone` auf
  `qbcore_bridge` korrigiert, `ox_target` als unbelegte Abhängigkeit entfernt.
- `qbx_vineyard`: Abhängigkeiten um `ox_lib`/`ox_inventory` präzisiert (Katalog nannte bisher
  nur `ox_target`).
- `qbx_recyclejob`, `qbx_taxijob`, `qbx_towjob`, `qbx_truckerjob`: alle Angaben bestätigt,
  keine inhaltlichen Änderungen nötig.

**Katalog:** 0 neu, 10 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (4 verifiziert/teilgeprüft
solide, 3 auf `ungeprueft`/`teilgeprueft` mit korrigierten Links, 3 mit Framework-/Lizenz-Korrektur)
**Kategorie „Zivil-Jobs & Aktivitäten" (30 Einträge) damit komplett nachgeprüft (Runden 14–16).**
**Commit:** folgt

---

## [Runde 15] – 12.08.2026

**Neu:**
- `data/catalog/runde-15.json` — nächste 10 von 30 Einträgen der Kategorie „Zivil-Jobs &
  Aktivitäten" nachgeprüft (Teil 2/3), recherchiert über 1 Subagent. Letzte Runde des vom
  Nutzer angekündigten Sonnet-5/low-Tests (Runden 7–15).

**Korrigiert:**
- `jim_tequilala`, `jim_upnatom`, `jim_vanillaunicorn`: bestätigen dasselbe Muster wie 8 der 9
  jim_*-Einträge aus Runde 14 — Katalog-Links existierten nicht (404), tatsächlich
  kostenpflichtige Closed-Source-Tebex-Produkte. `lizenz` auf `escrow` korrigiert.
- `jim_recycle`: Ausnahme vom Muster — echtes öffentliches Repo existiert tatsächlich, bleibt
  `open_source`, hängt aber von Jimathys separatem `jim_bridge`-Modul ab.
- `qbx_hotdogjob`: **wichtigster Fund** — Katalog-Pfad war falsch (Unterstrich statt Bindestrich,
  korrekt `qbx-hotdogjob`), zudem ist das Repo als „Unmaintained" markiert, bisher nicht im
  Katalog erfasst.
- `qbx_busjob`, `qbx_diving`, `qbx_garbagejob`, `qbx_lapraces`, `qbx_newsjob`: alle Angaben
  bestätigt, keine Änderung nötig.

**Katalog:** 0 neu, 10 aktualisiert, 0 Duplikate übersprungen, 5 auf `verifiziert`, 5 auf
`teilgeprueft`
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 14] – 12.08.2026

**Neu:**
- `data/catalog/runde-14.json` — erste 10 von 30 Einträgen der Kategorie „Zivil-Jobs &
  Aktivitäten" nachgeprüft (Teil 1/3, größte verbleibende Kategorie), recherchiert über 1 Subagent.

**Korrigiert:**
- **Wichtigster Fund dieser Runde:** 8 von 9 geprüften `jim_*`-Jobs (`jim_bahamas`,
  `jim_bakery`, `jim_beanmachine`, `jim_burgershot`, `jim_catcafe`, `jim_henhouse`,
  `jim_pizzathis`, `jim_popsdiner`) waren im Katalog fälschlich als kostenlose Open-Source-Repos
  geführt — die verlinkten GitHub-Repos existieren nicht (404, GitHub-API bestätigt). Es sind
  tatsächlich kostenpflichtige Closed-Source-Produkte über den Tebex-Store des Autors
  (jimathy666.tebex.io). `lizenz` bei allen acht von `open_source` auf `escrow` korrigiert,
  Beschreibungen angepasst, Qualität auf `ungeprueft` gesetzt (kein Code einsehbar). Nur
  `jim_mining` hat tatsächlich ein öffentliches, funktionierendes Repo und bleibt korrekt
  eingestuft.
- `flatbed`: Katalog-Link war nur eine GitHub-Suchergebnisseite, kein echtes Repo. Kein
  eindeutiger Ersatz gefunden — bewusst kein Link geraten, `qbx_towjob` bleibt empfohlener Ersatz.

**Katalog:** 0 neu, 10 aktualisiert, 0 Duplikate übersprungen, 0 auf `verifiziert`, 1 auf
`teilgeprueft`, 9 auf `ungeprueft`
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 13] – 12.08.2026

**Neu:**
- `data/catalog/runde-13.json` — letzte 7 Einträge der Kategorie „Staatliche Jobs & Fraktionen"
  nachgeprüft (Teil 3/3) — Kategorie damit komplett durchgeprüft (23/23).

**Korrigiert:**
- `randolio_grandma`, `wk_wars2x`: **wichtigster Fund** — beide Katalog-Links hatten
  Tippfehler (falscher Repo-Slug bzw. falsche Owner-Schreibweise), vermutlich nie tatsächlich
  verifiziert. Beide korrigiert.
- `sonoran_cad`: Preisangabe (~$20/Monat) konnte trotz mehrfacher Quellen nicht verifiziert
  werden (Pricing-Seite JS-gerendert) — Preisfeld bewusst auf `null` gesetzt statt eines
  möglicherweise falschen Fixbetrags, Qbox-Integration aber bestätigt.
- `redutzu_mdt`, `wasabi_ambulance`, `wasabi_mdt`, `wasabi_police`: konkrete Produktseiten statt
  Startseiten gefunden, Preise und Qbox-Support-Aussagen bestätigt.

**Katalog:** 0 neu, 7 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 4 auf
`teilgeprueft`
**Kategorie „Staatliche Jobs & Fraktionen" (23 Einträge) ist damit komplett nachgeprüft.**
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 12] – 12.08.2026

**Neu:**
- `data/catalog/runde-12.json` — nächste 8 von 23 Einträgen der Kategorie „Staatliche Jobs &
  Fraktionen" nachgeprüft (Teil 2/3), recherchiert über 1 Subagent.

**Korrigiert:**
- `qbx_policejob`: **wichtigster Fund** — Repo wurde zu `qbx_police` umbenannt (GitHub-Redirect
  bestätigt), Link im Katalog korrigiert (ID bleibt zur Wahrung der Querverweise unverändert).
- `qbx_prison`: frisch archiviert seit 09.07.2026, kein Nachfolger benannt.
- `qb_gangmenu`: Repo komplett aus der qbcore-framework-Org entfernt (404, nicht nur archiviert).
- `qbx_medical`/`qbx_ambulancejob`: offene Beziehungsfrage aus dem Katalog geklärt — per
  fxmanifest-Beleg ist `qbx_medical` eine Pflichtabhängigkeit von `qbx_ambulancejob` (ausgelagertes
  Kern-Gesundheitssystem), kein alternatives Modul. `abhaengigkeiten`-Feld bei `qbx_ambulancejob`
  entsprechend ergänzt.
- `ps_mdt`: nicht von der Project-Sloth-Archivierungswelle betroffen, Qbox-Support läuft
  inzwischen direkt über die `ps_lib`-Abstraktionsschicht im Original-Repo — der Katalog-Hinweis
  auf separate „Qbox-Community-Forks" war veraltet.

**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 5 auf `verifiziert`, 2 auf
`teilgeprueft`, 1 auf `ungeprueft` herabgestuft
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 11] – 12.08.2026

**Neu:**
- `data/catalog/runde-11.json` — erste 8 von 23 Einträgen der Kategorie „Staatliche Jobs &
  Fraktionen" nachgeprüft (Teil 1/3), recherchiert über 1 Subagent.

**Korrigiert:**
- `ox_mdt`: **wichtigster Fund** — entgegen der bisherigen Katalog-Annahme ist das Repo NICHT
  archiviert (GitHub-API: `archived:false`, letzter Push 04.05.2026, weiterhin aktiv gepflegt).
  Die `ox_core`-Abhängigkeit und damit Qbox-Inkompatibilität bleibt aber unverändert bestätigt.
- `mythic_hospital`: Ursprungslink ist jetzt 404 (Account existiert nicht mehr) — schärfer als
  der bisherige „ungepflegt"-Vermerk, die Quelle ist komplett verschwunden.
- `origen_police`: Qbox-Support-Verifizierung durchgeführt (offener Punkt aus dem Katalog) —
  Ergebnis negativ, kein Nachweis gefunden, CFX-Forum-Thread nennt seit 2023 nur QBCore/ESX.
- `leo_lockbox`, `mugshot_base64`: Platzhalter-Links (Topic-/Suchseite) durch echte Repos ersetzt.
- `cd_dispatch`, `codem_mdt`: konkrete Produktseiten statt Startseiten, Qbox-Support über
  Anbieter-Doku bestätigt.
- `ps_dispatch`: explizit geprüft, ob von der Project-Sloth-Archivierungswelle betroffen — ist
  es nicht, bleibt aktiv, aber seit rund einem Jahr ohne neuen Commit.

**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 5 auf
`teilgeprueft`
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 10] – 12.08.2026

**Neu:**
- `data/catalog/runde-10.json` — komplette Kategorie „Immobilien & Wohnen" nachgeprüft (9/9
  Einträge, passte in eine Runde), recherchiert über 1 Subagent.

**Korrigiert:**
- `qbx_houses`, `qbx_apartments`: **wichtigster Fund** — beide offiziellen Qbox-Repos wurden am
  09.07.2026 archiviert und offiziell als unmaintained markiert. `qbx_properties` ist der
  bestätigte alleinige Nachfolger (Migrationsanleitung fordert das Entfernen der alten Module).
  Katalogtext bei `qbx_properties` von „junger Nachfolger, evtl. parallel" auf „bestätigter
  alleiniger Nachfolger" korrigiert.
- `ps_housing`, `ps_realtor`: beide seit 06.02.2026 archiviert — vierte Project-Sloth-Archivierung
  nach `ps-inventory`, `ps-hud`, `ps-fuel`, kein Nachfolger benannt.
- `loaf_housing`, `nolag_properties`, `qs_housing`: Store-Startseiten durch konkrete Produktseiten
  ersetzt (teils veraltete Domains).
- `vms_housing`: Katalog-Domain war schlicht falsch (`vms.tebex.io` existiert nicht als
  Store-Domain, korrekt ist `vames-store.com`) — Qbox-Support jetzt bestätigt statt offen.

**Katalog:** 0 neu, 9 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 6 auf
`teilgeprueft`
**Kategorie „Immobilien & Wohnen" (9 Einträge) ist damit komplett nachgeprüft.**
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 9] – 12.08.2026

**Neu:**
- `data/catalog/runde-9.json` — letzte 7 Einträge der Kategorie „Fahrzeuge & Mechanik"
  nachgeprüft (Teil 3/3) — Kategorie damit komplett durchgeprüft (23/23). Letzte Runde des
  Sonnet-5/low-Tests (Runden 7–9).

**Korrigiert:**
- `renewed_vehicleshops`: **wichtigster Fund** — Katalog-Link ist tot (404), die Org
  `Renewed-Scripts` hat aktuell keinerlei Repo mit „vehicle"/„shop" im Namen mehr. Kein
  Ersatz-Link auffindbar, vermutlich eingestellt/umbenannt/in Escrow-Vertrieb übergegangen —
  bewusst auf `ungeprueft` herabgestuft statt eines geratenen Links.
- `wasabi_carlock`: gleicher Fehlertyp wie `wasabi_backpack` in Runde 6 (Katalog-Link falsch
  geschrieben), zusätzlich ist das Repo von WasabiRobby zur Org `wasabi-versions` umgezogen —
  Link korrigiert.
- `qs_garages`, `qs_vehiclekeys`: konkrete Quasar-Produktseiten statt Startseite gefunden,
  Qbox-Support jeweils bestätigt.
- `qbx_vehiclekeys`, `qbx_vehiclesales`, `qbx_vehicleshop`: weiterhin aktiv, Versionen/Daten
  bestätigt. Bei `qbx_vehicleshop` Hinweis auf laufende interne Refaktorierung
  (Richtung `qbx_vehicles`) ergänzt.

**Katalog:** 0 neu, 7 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 3 auf
`teilgeprueft`, 1 auf `ungeprueft` herabgestuft
**Kategorie „Fahrzeuge & Mechanik" (23 Einträge) ist damit komplett nachgeprüft.**
**Sonnet-5/low-Test (Runden 7–9) abgeschlossen** — Zusammenfassung siehe PROGRESS.md.
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 8] – 12.08.2026

**Neu:**
- `data/catalog/runde-8.json` — nächste 8 von 23 Einträgen der Kategorie „Fahrzeuge & Mechanik"
  nachgeprüft (Teil 2/3). Erster Recherche-Versuch brach nach 2 Tool-Aufrufen mit einer
  ungültigen „ich melde mich später"-Antwort ab (Subagents laufen synchron) — mit expliziter
  Klarstellung neu gestartet, zweiter Versuch lieferte vollständige GitHub-API-gestützte Ergebnisse.

**Korrigiert:**
- `ox_fuel`: **wichtigster Fund** — der bisher verlinkte Fork `TheOrderFivem/ox_fuel` existiert
  nicht mehr (404). Das Original `overextended/ox_fuel` ist entgegen der bisherigen
  Katalog-Annahme NICHT archiviert, sondern aktiv gepflegt (Release v1.5.4) — Link zurück aufs
  Original korrigiert, essenzielles Plugin auf `verifiziert` hochgestuft.
- `ps_fuel`: entgegen dem bisherigen Katalogstand tatsächlich archiviert (GitHub-API bestätigt)
  — reiht sich ein in die bereits archivierten Project-Sloth-Repos (`ps-inventory`, `ps-hud`).
- `qb_customs`: Original-Repo `qbcore-framework/qb-customs` existiert nicht mehr (404, komplette
  Org-Liste durchsucht), nur inoffizielle Community-Forks, kein offizieller Nachfolger.
- `mileage_tracker`: Platzhalter-Link (Topic-Seite) durch echtes Repo `jgscripts/jg-vehiclemileage`
  ersetzt.
- `okokgarage`: konkrete Produktseite (QB-Variante) statt Store-Startseite, aber Preis/Qbox-Nennung
  weiterhin nicht verifizierbar (Tebex-Bot-Schutz) — bleibt bewusst `ungeprueft`.
- `qbx_carwash`, `qbx_garages`, `qbx_mechanicjob`: weiterhin aktiv, Datenstände aktualisiert.

**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 4 auf `verifiziert`, 3 auf
`teilgeprueft` hochgestuft/bestätigt, 1 bleibt `ungeprueft`
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 7] – 12.08.2026

**Neu:**
- `data/catalog/runde-7.json` — erste 8 von 23 Einträgen der Kategorie „Fahrzeuge & Mechanik"
  nachgeprüft (Teil 1/3), recherchiert über 1 Subagent

**Korrigiert:**
- `jim_mechanic`: **wichtigster Fund** — ist inzwischen kostenpflichtig (v3.6, primär über
  Tebex vertrieben), nicht mehr das im Katalog beschriebene kostenlose Open-Source-System.
  `lizenz` auf `escrow` korrigiert, Beschreibung/Contra angepasst. Qbox-Support bleibt bestätigt.
- `legacyfuel`: Link-Bug behoben (`legacy_fuel` Kleinschreibung führte zu 404, korrekt ist
  `LegacyFuel`), Nachfolger-Feld auf `ox_fuel` ergänzt.
- `cd_garage`, `jg_dealerships`, `jg_mechanic`: Store-Startseiten durch konkrete Produktseiten
  ersetzt, Qbox-Support-Aussagen jetzt direkt belegt statt nur behauptet, Preise ($54/$81)
  bestätigt.
- `cdn_fuel`: seit 09/2023 keine Aktivität mehr (58 offene Issues unbeantwortet) — Warnung ergänzt.

**Katalog:** 0 neu, 8 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 5 auf
`teilgeprueft` hochgestuft/bestätigt
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 6] – 12.08.2026

**Neu:**
- `data/catalog/runde-6.json` — letzte 6 Einträge der Kategorie „Charakter, Inventar & UI"
  nachgeprüft (Teil 3/3) — Kategorie damit komplett durchgeprüft. Recherchiert über 1 Subagent
  (nur 6 Einträge, kein 3er-Split nötig)

**Korrigiert:**
- `wasabi_backpack`: **wichtigster Fund** — Katalog-Link war schlicht falsch geschrieben
  (`Wasabi-Backpack` statt `wasabi_backpack`), führte zu 404. Das erklärte den alten
  „bot-geschützt, manuell prüfen"-Vermerk. Korrigiert, Repo lange inaktiv (letzter Commit
  02/2023) aber nicht archiviert. Katalogtext „Framework-erkennend" war ungenau — es ist ein
  reines ox_inventory-Item ohne eigene Framework-Detection.
- `t-notify`: Katalogaussage „ungepflegt" war zu hart formuliert — Repo ist nicht archiviert,
  nur seit Ende 2024 ohne Commit.
- `qs_hud`, `qs_inventory`: konkrete Produktseiten im Quasar-Store gefunden (Katalog hatte nur
  die Startseite), Qbox-Support jetzt bestätigt statt nur vermutet. Preise bleiben unverifiziert
  (JS-Rendering im Shop).
- `wasabi_loading`, `wasabi_multichar`: konkrete Produktseiten ergänzt, Preise ($19.99 /
  $39.99) und Qbox-Bridge-Aussagen bestätigt.

**Katalog:** 0 neu, 6 aktualisiert, 0 Duplikate übersprungen, 2 auf `verifiziert`, 4 auf
`teilgeprueft` hochgestuft/bestätigt
**Kategorie „Charakter, Inventar & UI" (33 Einträge) ist damit komplett nachgeprüft.**
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 5] – 12.08.2026

**Neu:**
- `data/catalog/runde-5.json` — weitere 11 von 17 verbleibenden Einträgen der Kategorie
  „Charakter, Inventar & UI" nachgeprüft (Teil 2/3), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `qbx_loading`: **wichtigster Fund** — vom Owner am 09.07.2026 archiviert, kein Nachfolger
  genannt. Katalogtext „Gepflegt" war veraltet.
- `ps_hud`: Repo seit 06.02.2026 archiviert (dasselbe Project-Sloth-Team, das schon
  `ps-inventory` in Runde 4 archiviert hat), Framework auf `qbcore_only` korrigiert (harte
  `@qb-core`-Abhängigkeit, kein ox_lib, keine Qbox-Nennung), kein Nachfolger benannt.
- `pulse_scoreboard`: Platzhalter-Link (`github.com/topics/qbox`) war kein echtes Repo — ein
  „Ultimate Scoreboard" mit Qbox-Bezug existiert nicht. Ersetzt durch `acscripts/ac_scoreboard`
  (aktiv, Framework-Autoerkennung inkl. `qbx_core`), Name entsprechend angepasst.
- `qbx_scoreboard`: Gruppe von `null` auf `scoreboard` gesetzt — gehört inhaltlich zur selben
  Vergleichsgruppe wie der korrigierte `pulse_scoreboard`/`ac_scoreboard`-Eintrag.
- `ox_inventory_v3`: Archiviert-Status präzisiert — laut GitHub nicht formal archiviert, aber
  weiterhin unfertig/experimentell ohne Releases seit Erstellung.
- `qb_radialmenu`, `qb_spawn`, `qb_target`: Framework auf `qbcore_only` präzisiert (kein
  ox_lib-/Qbox-Bezug im fxmanifest). `qb_target`-Konfliktwarnung mit `ox_target` auf Beleggrad
  `vermutung` korrigiert (aus Funktionsüberschneidung geschlossen, keine Autor-Aussage gefunden).
- `qb_spawn`, `qbx_hud`, `qbx_scoreboard`, `qbx_spawn`, `qb_multicharacter`: weiterhin aktiv,
  Versionen/Commit-Daten aus fxmanifest bestätigt, keine Statusänderung nötig.

**Katalog:** 0 neu, 11 aktualisiert, 0 Duplikate übersprungen, 3 auf `verifiziert`, 8 auf
`teilgeprueft` bestätigt/hochgestuft
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 4] – 12.08.2026

**Neu:**
- `data/catalog/runde-4.json` — erste 12 von 31 Einträgen der Kategorie „Charakter, Inventar &
  UI" nachgeprüft (Teil 1/3), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `lj_inventory`: Katalogaussage „ps-Fork gepflegt" überholt — Project-Sloth hat `ps-inventory`
  am 06.02.2026 archiviert (Fokus künftig auf ps-mdt v3), kein Nachfolger genannt.
- `interaction_menu_mod`, `mtc_loadingscreen`: Katalog-Link war nur die generische
  GitHub-Topic-Seite `github.com/topics/qbox` — echte, treffende Repos gefunden und verlinkt.
- `mythic_notify`: Link komplett tot (Repo verschwunden, auch der ursprüngliche Fork-Baum) — kein
  verlässlicher Nachfolge-Link gefunden, bleibt bewusst `teilgeprueft` statt eines geratenen Links.
- `mythic_progbar`: Katalog-Link falsch (404), funktionierender Fork bei
  `wasabirobby/mythic_progbar` gefunden und verlinkt.
- `fivem_appearance`: Katalogtext „Gepflegt" war überholt — kein Commit seit Februar 2023, de
  facto unmaintained (aber nicht offiziell archiviert).
- `illenium_appearance`: Qbox-Nutzung jetzt direkt belegt (offizielles `txAdminRecipe` lädt es als
  Standalone-Resource), aber letzter Commit November 2024 — Katalogtext „Aktiv · 2026" war zu
  optimistisch formuliert.
- `codem_inventory`, `cd_drawtextui`: tote/veraltete Shop-URLs auf aktuelle Produktseiten
  korrigiert. `okoknotify`, `okoktextui`: Preise bestätigt (je 4,99 EUR).

**Katalog:** 0 neu, 12 aktualisiert, 0 Duplikate übersprungen, 8 auf `verifiziert`, 4 auf
`teilgeprueft` hochgestuft
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 3] – 12.08.2026

**Neu:**
- `data/catalog/runde-3.json` — Abschluss der Nachprüfung von Kategorie „Basis & Abhängigkeiten":
  14 `updates[]` für die restlichen 14 von 26 verbleibenden `ungeprueft`-Einträgen, Kategorie 1
  damit komplett durchgeprüft (31/31 inkl. Runde 1), recherchiert über 3 parallele Subagents

**Korrigiert:**
- `peak_bridge`, `qbox_snippets`, `starterpack`, `vue_tailwind_boilerplate`: Katalog-Link war nur
  die generische GitHub-Topic-Seite `github.com/topics/qbox`, kein echtes Repo. Für
  `peak_bridge`/`qbox_snippets`/`starterpack` ein plausibles Repo gefunden und Link korrigiert
  (teils mit Vorbehalt: `starterpack` hat mehrere konkurrierende Kandidaten ohne eindeutig
  offizielle Quelle). Für `vue_tailwind_boilerplate` kein passender Treffer — bleibt bewusst
  `ungeprueft` statt eines geratenen Links.
- `polyzone`, `qb_input`, `qb_menu`: Katalogtext „inaktiv"/Legacy war ungenau — alle drei aktiv
  gepflegt, kein Archiv-Banner.
- `saltychat`: Organisation `v10networkscom` zu `SaltyHub-net` umbenannt, Link korrigiert.
- `qbox_core_site`, `quasar_store`: Katalogaussagen präzisiert (primär Shop statt Guide-Seite;
  kein dedizierter Qbox-Filter, sondern Framework-Tag pro Produkt).

**Katalog:** 0 neu, 14 aktualisiert, 0 Duplikate übersprungen, 4 auf `verifiziert`, 8 auf
`teilgeprueft` hochgestuft, 2 bleiben bewusst `ungeprueft` (keine belastbare Quelle gefunden)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 2] – 12.08.2026

**Neu:**
- `data/catalog/runde-2.json` — Fortsetzung der reinen Nachprüfung auf Nutzerwunsch (erst
  kompletten Altbestand durchprüfen, dann neue Plugins suchen): 12 `updates[]` für die ersten
  12 von 26 verbleibenden `ungeprueft`-Einträgen der Kategorie „Basis & Abhängigkeiten",
  recherchiert über 3 parallele Subagents

**Korrigiert:**
- `awesome_ox`, `ox_core`, `oxmysql`: dasselbe Falsch-Archiviert-Muster wie in Runde 1 bei
  `ox_lib`/`ox_inventory`/etc. — alle drei per GitHub-API bestätigt aktiv, `archiviert` auf
  `null` korrigiert. `oxmysql` hatte zusätzlich einen toten `TheOrderFivem`-Fork-Link (404),
  auf `overextended/oxmysql` korrigiert.
- `fivem_ts_boilerplate`: Repo umbenannt zu `overextended/fivem-ts`, Link korrigiert.
- `mumble-voip`: echt tot bestätigt (nicht nur behauptet) — offiziell archiviert seit
  12.12.2024, Nachfolger `pma-voice` als Community-Konsens ergänzt.
- `ghmattimysql`: Original-GitHub-Account (`GHMatti`) existiert nicht mehr — Fortführung bei
  `FrazzIe/ghmattimysql` gefunden, Link korrigiert, `stack_hinweis` auf `oxmysql` als
  moderneren Ersatz ergänzt.
- `fivemx_dir`: Katalogbehauptung eines dedizierten Qbox-Filters nicht bestätigt — als `contra`
  vermerkt statt stillschweigend übernommen.

**Katalog:** 0 neu, 12 aktualisiert, 0 Duplikate übersprungen, 10 auf `verifiziert` und 2 auf
`teilgeprueft` hochgestuft (vorher alle 12 `ungeprueft`)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Runde 1] – 12.08.2026

**Neu:**
- `data/catalog/runde-1.json` — erste Recherche-Runde nach `docs/RECHERCHE.md`, auf
  ausdrücklichen Nutzerwunsch als reine Nachprüfung des Altbestands (keine Suche nach neuen
  Plugins): 22 `updates[]` für die essenziellen Basis-Plugins, recherchiert über 4 parallele
  Subagents (GitHub-API, README/fxmanifest, keine Vermutungen aus Vorwissen)

**Korrigiert (Altbestand war veraltet oder falsch):**
- `ox_lib`, `ox_inventory`, `ox_target`, `ox_doorlock`, `ox_fuel`: die aus der kimi-Runde
  übernommene Archiv-Kette „Overextended archiviert → TheOrderFivem/CommunityOx-Fork aktuell"
  stimmt nicht mehr. `overextended/*` ist bei allen fünf wieder aktiv und aktueller als jeder
  Fork; bei `ox_inventory` ist der bisher empfohlene `TheOrderFivem`-Fork inzwischen selbst
  archiviert; der Katalog-Link zu `TheOrderFivem/ox_fuel` existierte nie (404). Alle fünf Links
  auf `overextended/*` korrigiert.
- `qbx_multicharacter`: archiviert seit 10.09.2023, Funktion seither fest in `qbx_core`
  eingebaut (PR #119) — als `archiviert` markiert, `essenziell` auf `false`.
- `qbx_weathersync`: archiviert seit 18.11.2023, kein Nachfolger — als `archiviert` markiert,
  `essenziell` auf `false`.
- `renewed_banking`: fälschlich `framework: "qbox_nativ"` — README bestätigt nur QBCore/ESX,
  auf `qbcore_bridge` korrigiert.
- `txadmin`: Repo-Transfer `tabarra/txAdmin` → `citizenfx/txAdmin`, Link korrigiert.
- `community_bridge`: Katalog-Link zeigte auf ein nicht existierendes Repo
  (`Renewed-Scripts/community_bridge`, 404), korrekt ist `TheOrderFivem/community_bridge`.
- `qbx_smallresources`, `npwd`: neue `kompat_warnung` ergänzt (Autor kündigt Rückbau an,
  bzw. braucht für Qbox die separate, noch nicht katalogisierte Bridge `qbx_npwd`).
- `mm_radio`: bestätigt existent und aktiv — keine Korrektur nötig, der Nachfolger-Verweis im
  archivierten `qbx_radio`-Demo-Eintrag war richtig.

**Katalog:** 0 neu, 22 aktualisiert, 0 Duplikate übersprungen, 18 auf `verifiziert` und 4 auf
`teilgeprueft` hochgestuft (vorher alle 22 `ungeprueft`)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Phase 2] – 12.08.2026

**Neu:**
- `scripts/import/von-v21.mjs` — liest `reference/qbox-server-planer-v2-1.html` nur lesend,
  wertet das `RAW`-Array in einem Node-`vm`-Kontext aus (reines Datenliteral)
- `scripts/import/von-kimi.mjs` — repariert die 6 bekannten Syntaxdefekte aus
  `reference/kimi-kataloge/*.json` NUR im Speicher (Originaldateien unverändert), bricht bei
  jedem unbekannten Defekt mit der `jsonfehler.js`-Diagnose ab statt zu raten
- `scripts/import/mapping.mjs` — gemeinsame Feldabbildung Rohformat → Katalogschema für beide
  Quellen (identisches Rohvokabular)
- `scripts/import/build-altbestand.mjs` — führt beide Quellen nach D17 zusammen (kimi gewinnt
  feldweise bei ID-Kollision, v2.1-only-Felder bleiben erhalten) und schreibt
  `data/catalog/altbestand.json` + `docs/altbestand-konflikte.md`
- `data/catalog/altbestand.json` — 256 Plugins (124 aus v2.1, 132 nur bei kimi, 8 Kollisionen),
  durchgehend `qualitaet: "ungeprueft"`, `geprueft_am: ""` (D18)
- `docs/altbestand-konflikte.md` — Konfliktbericht der 8 Feld-Überschreibungen zur Durchsicht

**Geändert:**
- `data/catalog/demo.json`: die vier Einträge, die jetzt echte Entsprechungen in
  `altbestand.json` haben (`ox_lib`, `qbx_core`, `qbx_policejob`, `ox_inventory`), entfernt —
  gleiche ID wäre ein Duplikatfehler gewesen. Die Abhängigkeitskette der übrigen sechs
  Demo-Einträge bleibt über diese IDs cross-file intakt (`abhaengigkeiten`/`konflikte` zeigen
  jetzt auf die altbestand-Version). Bewusst vorgesehen, siehe `docs/PROGRESS.md` Phase 1.

**Korrigiert:**
- `docs/DECISIONS.md`/Plan gingen von 88 Plugins in `reference/qbox-server-planer-v2-1.html`
  aus (grobe Schätzung vor dem tatsächlichen Parsen). Das `RAW`-Array enthält tatsächlich
  **124** eindeutige Einträge, keine Duplikate. Fünf IDs (`okokGarage`, `LegacyFuel`,
  `okokPhone`, `vSync`, `okokBanking`) enthielten Großbuchstaben und wurden beim Mapping
  kleingeschrieben (Schema-Pflicht `^[a-z0-9][a-z0-9_-]*$`); alle Querverweise sind konsistent
  mitkleingeschrieben.

**Katalog:** 256 neu (davon 124 aus v2.1, 132 nur bei kimi), 0 aktualisiert (Altbestand ist eine
eigenständige Datei, kein `updates`-Import gegen einen bestehenden Katalog), 8 Kollisionen
feldweise nach kimi aufgelöst (`docs/altbestand-konflikte.md`), 256 ungeprüft (D18)
**Commit:** folgt direkt im Anschluss an diesen Changelog-Eintrag

---

## [Phase 1] – 12.08.2026

**Neu:**
- Alle App-Module in `src/app/`: `state.js`, `relations.js`, `render.js`, `filters.js`,
  `compare.js`, `import.js`, `katalogspeicher.js`, `custom.js`, `exportcfg.js`, `costs.js`,
  `ui.js`, `main.js`
- `src/style.css` — Dark Theme im GitHub-Stil (Feature H3)
- `src/lib/hilfen.js` — geteilter Kleinkram (`kopie`, `warnen`, `WAEHRUNG_ZEICHEN`), entstanden
  weil der Bau-Prüfer dieselben Definitionen doppelt in zwei Modulen fand
- `data/catalog/demo.json` — 10 Demo-Plugins, decken jedes Merkmal aus dem Plan ab
- Alle 59 Features aus `docs/FEATURES.md` `getestet`

**Geändert:**
- `scripts/lib/schema.mjs` → `src/lib/schema.js` verschoben und ins Build eingebettet: der
  Katalog-Import in der App prüft jetzt mit demselben Schema-Prüfer wie `npm run validate`
- `docs/DECISIONS.md`: D3a ergänzt (Import-Differenz wird dauerhaft gespeichert, aber nur die
  Differenz zum eingebauten Katalog, nicht der volle Katalog — Präzisierung von D3)
- `src/index.html`: Platzhalter-Erklärkommentar umgeschrieben, damit er die Marken nicht mehr
  wörtlich nennt (siehe „Korrigiert")

**Korrigiert:**
- `scripts/build.mjs` verdoppelte eingebetteten Katalog und Skript, weil der Erklärkommentar in
  `src/index.html` die Platzhalter-Marken wörtlich nannte und der globale String-Replace auch dort
  zuschlug. Kommentar umgeschrieben, plus eine Prüfung, die abbricht, wenn eine Marke nicht genau
  einmal vorkommt.
- Badge „🆓 Kostenlos" erschien doppelt auf der Karte (Badge-Ableitung und Preisanzeige lieferten
  beide denselben Fall).
- Zahnrad-Menü und Backup-Liste reagierten nicht auf Klicks — `modal()` löste nur über die
  Fuß-Buttons auf, nicht über `data-tat`-Elemente im Inhalt.
- Formular „Eigenes Plugin" (H2) speicherte nichts, weil die Feldwerte erst nach dem Schließen
  des Modals ausgelesen wurden, wenn das Formular schon aus dem DOM entfernt war.

**Katalog:** 0 neu, 0 aktualisiert, 0 Duplikate übersprungen, 10 ungeprüft (Demodaten, nicht
nach docs/RECHERCHE.md recherchiert — bewusst so markiert)
**Commit:** `aeec4e7`

---

## [Phase 0] – 12.08.2026

**Neu:**
- Repo initialisiert (`git init -b main`), Ordnerstruktur (`data/catalog`, `src`, `scripts`,
  `schema`, `dist`), `package.json` ohne Abhängigkeiten (Entscheidung D15)
- `schema/plugin.schema.json` — vollständiges Schema für Plugin- und Katalogdatei-Einträge,
  inkl. Zusatzfeld `ressource` (D16) und Sonderregeln R1–R10
- `src/lib/jsonfehler.js` — gemeinsamer JSON-Fehlerlokalisierer für CLI und App-Import
  (eigener Zeichen-für-Zeichen-Scanner statt Engine-Fehlertexte, damit Konsole und Browser
  identisch melden), löst Feature E4
- `scripts/`: `validate`, `build`, `stats`, `find`, `linkcheck`, `newround`, `selftest` sowie
  `scripts/lib/katalog.mjs` (zentrales Laden + Defaults) und `scripts/lib/schema.mjs`
  (eigener, abhängigkeitsfreier Schema-Prüfer)
- `data/kategorien.json` mit den 14 Kategorien aus `reference/qbox-server-planer-v2-1.html`
- `src/index.html` (Rahmen) + `src/app/main.js` (Platzhalter) — beweist die Bau-Kette bis
  `dist/qbox-planer.html` end-to-end; die echte App folgt in Phase 1
- `scripts/testdaten/` (gültige und absichtlich kaputte Katalogdateien) für `npm run selftest`

**Geändert:**
- `docs/DECISIONS.md`: D15–D19 ergänzt; Korrektur-Abschnitt zur tatsächlichen Ursache der
  kaputten kimi-Kataloge (siehe „Korrigiert")
- `CLAUDE.md` §4: falsche Verdachtsdiagnose zu den kimi-Katalogen durch den belegten Befund ersetzt

**Korrigiert:**
- Der in `CLAUDE.md` §4 vermutete Fehler in den kimi-Katalogen (JS-Objektliterale mit
  unquotierten Keys) war **falsch**. Tatsächlich waren es 6 einzelne Anführungszeichen-Tippfehler
  über beide Dateien (`reference/kimi-kataloge/katalog-runde-01.json` und `-02.json`), belegt
  und regressionsgetestet in `scripts/selftest.mjs`. Nach Reparatur im Speicher parsen beide
  Dateien sauber (83 + 57 = 140 Einträge). Die Originaldateien bleiben unverändert.
- Build-Bug in `scripts/build.mjs`: Platzhalter-Marken (`<!--@STIL-->` etc.) wurden per globalem
  String-Replace ersetzt. Eine Erwähnung der Marke im Erklärkommentar von `src/index.html`
  führte dazu, dass der eingebettete Katalog und das gebündelte Skript im Build-Ergebnis
  verdoppelt wurden. Behoben durch Umschreiben des Kommentars (keine wörtliche Markenerwähnung
  mehr) und eine Prüfung in `build.mjs`, die abbricht, wenn eine Block-Marke nicht genau einmal
  vorkommt.

**Katalog:** 0 neu, 0 aktualisiert, 0 Duplikate übersprungen, 0 ungeprüft (Katalog ist im
Fundament noch leer, erste Daten kommen mit Phase 1 als `data/catalog/demo.json`)
**Commit:** noch keiner — bewusst zurückgestellt, siehe `docs/PROGRESS.md` „Offene Punkte"

---

## [Vorgeschichte] – 11.08.2026

Projekt wird auf Basis der alten Einzeldatei `qbox-server-planer-v2-1.html` (88 Plugins,
14 Kategorien) neu aufgebaut. Gründe siehe `DECISIONS.md`. Bekannte Fehler der Altversion,
die im Neubau nicht wieder auftreten dürfen:

- Katalog-Import scheiterte an JS-Objektliteralen statt echtem JSON („Ungültige Katalog-Datei")
- Default-Felder wurden nur auf den eingebauten Katalog angewandt, nicht auf importierte Einträge
  → fehlendes Feld ließ das Rendern crashen
- Import-Zähler zählte „neu" und „aktualisiert" doppelt
- Kompletter Katalog lag im localStorage (5-MB-Limit)
- Migrationszweig prüfte einen Key, der nie geschrieben wurde
- `resetAll()` löschte ohne Sicherheitskopie
