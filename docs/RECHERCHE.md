# RECHERCHE — was pro Plugin tatsächlich geprüft wird

Das ist der Kern des Projekts. Ein Katalogeintrag entsteht **nicht** aus Vorwissen, sondern daraus,
dass die tatsächliche Seite des Plugins gelesen wurde. Recherche läuft über Subagents (Task-Tool),
damit der Seiten-Rohtext nicht im Hauptkontext landet.

---

## 1. Quellen, die pro Plugin gelesen werden

In dieser Reihenfolge, bis die Fragen unten beantwortet sind:

1. **README** des Repos → Zweck, Features, angegebene Frameworks, Installationshinweise
2. **fxmanifest.lua** → `dependencies`, `shared_scripts` (nutzt es `@ox_lib/init.lua`?), `version`
3. **Code-Stichproben** → das ist der eigentliche Kompatibilitätsbeweis, siehe Abschnitt 3
4. **Releases / letzter Commit** → Version, letztes Update, aktiv oder tot
5. **Repo-Status** → archiviert? Fork eines toten Projekts? Nachfolger benannt?
6. **Issues**, gefiltert nach „qbox" / „qbx" → bekannte Probleme, offizielle Aussagen des Autors
7. Bei Premium: **Shop-Seite** → Preis, Typ (einmalig/Abo), Escrow ja/nein, genannte Frameworks
8. **Cfx-Forum-Thread**, falls vorhanden → Nutzerberichte zu Qbox

Ob die Seite überhaupt existiert (404, umgezogen, archiviert), fällt dabei nebenbei ab und geht
nach `link_status` + `link_geprueft_am`. Ein reiner HTTP-Statuscheck ohne Lesen des Inhalts ist
wertlos und ersetzt diesen Ablauf nicht.

### 1a. Zuerst: `npm run prefetch` — die mechanische Arbeit passiert vor der Recherche

**Vor jeder Runde** erzeugt die Hauptsession ein Briefing:

```
npm run prefetch -- --kategorie crime --offen --max 11 --runde 19
```

Das Script (`scripts/prefetch.mjs`) holt alles, was deterministisch ist, und schreibt es nach
`data/.prefetch/runde-N.md`: Repo existiert ja/nein, archiviert, letzter Push, Lizenz,
Default-Branch, das **fxmanifest wörtlich**, die README-Zeilen mit Framework-/Lizenz-Begriffen
**wörtlich**, und eine Code-Stichprobe über alle `.lua`-Dateien nach den Mustern aus Abschnitt 3
mit Fundstellen als `datei.lua:zeile`. Bei einem toten Link listet es zusätzlich die ähnlichsten
Repo-Namen desselben Owners — das löst Umbenennungen wie `randolio_*` → `randol_*` ohne eine
einzige Suche.

Der Subagent bekommt **den Pfad** zu diesem Briefing im Prompt genannt, nicht den Inhalt.
Er liest es und macht nur noch das, was Urteilsvermögen braucht: Framework-Einordnung, Beleggrad,
`update_grund` formulieren, und die unter „Offen für dich" ausgewiesenen Restpunkte.

Die Angaben im Briefing sind bereits abgerufen — **sie werden nicht nachgeholt**. Wer sie
trotzdem noch einmal abruft, verbrennt Kontext ohne Erkenntnisgewinn.

### 1b. Exakte URL-Muster für GitHub-Repos (wenn das Briefing eine Lücke lässt)

Nur nötig, wenn das Briefing für einen Eintrag etwas offen lässt oder gar nicht vorliegt.
Dann diese Abrufe, in dieser Reihenfolge — und **niemals** die HTML-Seite `github.com/<owner>/<repo>`
holen, solange die API dieselbe Frage beantwortet (die HTML-Seite kostet ein Vielfaches an Kontext):

1. **Existenz + Status + letzter Push** (ein API-Call beantwortet mehrere Fragen auf einmal):
   `https://api.github.com/repos/<owner>/<repo>`
   Liefert als JSON u.a. `archived` (true/false), `pushed_at` (letzter Push, ISO-Datum),
   `default_branch` (für Schritt 2/3 wichtig — meist `main`, manchmal `master`),
   `license.spdx_id`, `description`. Ein 404 hier heißt: Repo existiert nicht (mehr) unter
   diesem Pfad → `link_status: "404"`, dann gezielt nach dem neuen Namen suchen
   (siehe 1c), nicht raten.
2. **fxmanifest.lua roh lesen** (nicht die Web-Ansicht, die ist langsamer und schwerer zu parsen):
   `https://raw.githubusercontent.com/<owner>/<repo>/<default_branch>/fxmanifest.lua`
   Manche Repos haben es in einem Unterordner — wenn der direkte Pfad 404 liefert, per GitHub-
   Code-Suche (`https://github.com/search?q=repo:<owner>/<repo>+filename:fxmanifest.lua&type=code`)
   den echten Pfad finden. Daraus: `version`, `dependencies`/`dependency`, `shared_scripts`
   (→ `@ox_lib/init.lua`?), `provide` (Legacy-Kompatibilitätsname, wichtig für Konflikt-Checks).
3. **README roh lesen**:
   `https://raw.githubusercontent.com/<owner>/<repo>/<default_branch>/README.md`
   → Zweck, genannte Frameworks, Installationsschritte, Lizenzhinweise im Klartext (viele Autoren
   schreiben "personal use only" o.ä. direkt ins README statt eine LICENSE-Datei zu pflegen —
   das zählt als `lizenz`-Beleg, auch ohne SPDX-Tag).
4. **Issues, gefiltert**: `https://github.com/<owner>/<repo>/issues?q=qbox+OR+qbx` (offen + geschlossen,
   also ohne `is:open`-Filter) → offizielle Autor-Aussagen zur Qbox-Kompatibilität.

### 1c. Wenn der Link tot ist — Suchbudget beachten

Das Prefetch-Briefing hat den Owner-Bestand bereits durchsucht und listet die ähnlichsten
Repo-Namen. Wenn dort nichts Passendes steht, ist die Suche zu **80 % schon erledigt**, und der
Rest ist selten ergiebig.

**Budget: höchstens 2 weitere Abrufe pro totem Link.** Sinnvoll sind genau diese zwei:
1. Den Original-Link einmal im Klartext aufrufen — GitHub leitet umbenannte Repos automatisch um,
   ein Redirect zeigt den neuen Pfad sofort.
2. Eine Websuche nach `<name> fivem` — deckt Umzüge zu einem anderen Owner oder zu Tebex ab.

Danach ist Schluss. `link_status: "404"`, `qualitaet: "ungeprueft"`, in `update_grund` festhalten,
was durchsucht wurde — **kein Ersatzlink geraten**.

Das ist ausdrücklich kein Qualitätsverlust: In den Runden 16–18 kostete jeder tote Link 30–45
Abrufe und endete trotzdem bei „nicht auffindbar" (`jim_pawnshop`, `mhacking`, `mt_washing`,
`randolio_busjob`). „Nicht auffindbar" ist ein vollwertiges, belastbares Ergebnis — kein Anlass,
weiterzusuchen.

### 1d. Tebex-Produktseiten (Premium/Escrow)

Tebex-Shopseiten sind oft bot-geschützt (403 bei direktem Fetch). Falls die Seite selbst nicht
lesbar ist, reicht als Beleg: die URL selbst (Store-Name im Pfad, Paket-ID), plus wenn vorhanden
eine separate Doku-Domain des Autors (z.B. `docs.<anbieter>.dev` oder `docs.<anbieter>.gitbook.io`)
oder ein Cfx-Forum-Thread zum Produkt — dort steht meist Preis, unterstützte Frameworks und ob
Escrow. Wenn nichts davon erreichbar ist: `qualitaet: "ungeprueft"`, `sicherheit: "vermutung"` bei
etwaigen `kompat_warnung`-Einträgen, keine Marketingaussagen der Seite ungeprüft übernehmen
(z.B. "fully open source" kann auch nur "nach Kauf editierbar" bedeuten, siehe Runde 15 `jim_tequilala`).

**Budget: höchstens 3 Abrufe pro Premium-Produkt.** Der Bot-Schutz gibt bei mehr Versuchen nicht
nach, und `teilgeprueft` mit korrekter Produkt-URL ist das erreichbare Maximum — mehr Aufwand
ändert das Ergebnis nicht.

---

## 2. Fragen, die jeder Eintrag beantworten muss

| Feld | Frage |
|---|---|
| `version` | Welche Version ist aktuell? |
| `letztes_update` | Wann zuletzt Commit/Release? Aktiv gepflegt oder tot? |
| `framework` | qbox_nativ / qbcore_bridge / standalone / qbcore_only |
| `abhaengigkeiten` | Was muss zwingend laufen, damit es startet? |
| `kompat_warnung` | Woran genau könnte es unter Qbox scheitern — und ist das belegt oder vermutet? |
| `stack_hinweis` | Setzt es auf dem alten qb-Stack auf? Dann markieren, nicht aussortieren |
| `archiviert` | Archiviert/eingestellt? Gibt es einen benannten Nachfolger? |
| `lizenz` | Quelloffen oder Escrow — kann ich es selbst reparieren? |
| `preis` | Betrag, Währung, einmalig oder Abo |
| `pro` / `contra` / `neutral` | Nur belegbare Punkte, keine Marketingsprache |
| `qualitaet` | Wie gründlich wurde geprüft (Abschnitt 4) |

---

## 3. Der Kompatibilitäts-Check — das entscheidende Kriterium

Qbox bringt eine QBCore-Bridge mit. Standard-Exports werden übersetzt. Die Bridge hilft aber
**nicht**, wenn ein Script am Framework vorbeigreift. Geprüft wird gezielt nach diesen Mustern:

### Rote Flaggen (Script bricht trotz Bridge)

- Harte Abhängigkeit auf `exports['qb-inventory']` oder `exports['qb-target']`
  → Qbox nutzt `ox_inventory` / `ox_target`
- Direkte Zugriffe auf interne qb-core-Player-Funktionen oder Patches daran
  (z.B. Überschreiben von `Player.Functions.*`, Zugriff auf `QBCore.Players` statt über Exports)
  → greift an der Bridge vorbei, führt zu Crashes
- Eigene SQL-Queries auf qb-typische Tabellenstrukturen ohne Abstraktion
- Abhängigkeit auf `ox_core` → **bestätigt nicht Qbox-kompatibel** (betrifft u.a. `ox_mdt`)
- Veraltete Basis: `mysql-async`, `ghmattimysql`, `TokoVoIP`, `mythic_*`

### Grüne Flaggen (läuft erwartbar sauber)

- `@ox_lib/init.lua` in den `shared_scripts`, Nutzung von `lib.*`
- Nutzung von `exports.qbx_core` / offizielle Qbox-Exports
- `community_bridge` oder `jim_bridge` als Abstraktionsschicht
- Framework-Autoerkennung im Script (esx/qb/qbx-Zweige)
- Autor nennt Qbox ausdrücklich in README oder Shop-Beschreibung

### Beleggrad — Pflichtangabe

- `sicherheit: "bestaetigt"` → im Code, im fxmanifest, in der Doku oder in einer Aussage des Autors
  **nachlesbar**. Die Fundstelle kommt nach `quelle`.
- `sicherheit: "vermutung"` → aus Indizien geschlossen (z.B. Script ist von 2023 und nennt nur
  QBCore). Muss als Vermutung gekennzeichnet sein, im Tooltip erscheint das später auch so.

Nie eine Vermutung als bestätigt ausgeben. Lieber `qualitaet: "ungeprueft"` als eine erfundene
Sicherheit.

---

## 4. Prüftiefe — nicht alles kann gleich gründlich geprüft werden

| Stufe | Wann | Umfang |
|---|---|---|
| `verifiziert` | Plugin ist Teil einer Funktionsgruppe (also Vergleichskandidat), oder essenziell, oder Premium | Alle Quellen aus Abschnitt 1, Code-Stichprobe durchgeführt |
| `teilgeprueft` | Repo lesbar, aber Code nicht im Detail geprüft | README + fxmanifest + Commit-Datum |
| `ungeprueft` | Seite nicht erreichbar, Escrow ohne Einsicht, Tebex mit Bot-Schutz | Nur Name, Link, Shop-Angaben — klar so markiert |

Escrow-Scripts sind grundsätzlich nur bis `teilgeprueft` bewertbar, weil der Code verschlüsselt ist.
Das gehört als Nachteil in `contra`: bei Bridge-Problemen nicht selbst reparierbar.

**Seit Einführung von `npm run prefetch` ist `verifiziert` häufiger erreichbar**, weil die
Code-Stichprobe nicht mehr von Hand gemacht werden muss: Das Script prüft **alle** `.lua`-Dateien
eines Repos gegen die Muster aus Abschnitt 3 und nennt die Fundstellen zeilengenau. Wenn das
Briefing eine Code-Stichprobe ohne Lücken ausweist und fxmanifest sowie README vorliegen, ist
`verifiziert` die richtige Stufe — `teilgeprueft` bleibt für Fälle, in denen etwas davon fehlt
(kein README, fxmanifest im Unterordner, Escrow, Repo nicht lesbar).

---

## 5. Vergleichsdaten sind Recherche-Ergebnis, keine Meinung

Sobald zwei Plugins in derselben `gruppe` liegen, muss aus den gelesenen Quellen hervorgehen:

- welche Funktionen **beide** haben
- welche Funktion **nur eines** hat (= Bonus der jeweiligen Seite)
- `pro` und `contra` **für beide**, nicht nur für den Favoriten
- Punkte, die weder Vor- noch Nachteil sind, nach `neutral` (im Tool orange)

Findet eine spätere Runde neue Informationen zu einem Plugin, das schon im Katalog steht, werden
die Vergleichsdaten der **ganzen Gruppe** mit aktualisiert.

---

## 6. Katalog-Updates: neue UND bestehende Einträge

Jede Runde liefert eine importierbare JSON-Datei, die beides enthalten kann:

```json
{
  "catalogVersion": "2.4",
  "runde": 4,
  "erstellt": "2026-08-11",
  "plugins": [ ... neue Einträge ... ],
  "updates": [ ... Änderungen an bestehenden IDs ... ]
}
```

Ein `updates`-Eintrag enthält nur die geänderten Felder plus `id` und `geprueft_am`, dazu ein
`update_grund` in Klartext (z.B. „Repo seit 03/2026 archiviert, Nachfolger benannt" oder
„Autor bestätigt Qbox-Support in README, Warnung entfällt").

Beim Import zeigt das Tool eine **Änderungsliste**: was neu ist, was sich geändert hat, und
besonders hervorgehoben: Plugins, die ich bereits auf DEV oder MAIN gehakt habe und die durch das
Update als archiviert, veraltet oder inkompatibel markiert wurden. Genau dafür ist die
Update-Mechanik da — der Katalog altert sonst still vor sich hin.

Jede Runde enthält deshalb neben der Suche nach neuen Plugins auch eine **Nachprüfung** der
ältesten Einträge im Bestand (die 20 mit dem ältesten `geprueft_am`).

---

## 7. Neusuche — wie ein bisher unbekanntes Plugin in den Katalog kommt

Die Abschnitte 1–6 setzen voraus, dass der Link schon im Katalog steht. Ab Runde 26 geht es um
Plugins, die wir noch gar nicht kennen. Das ist eine andere Aufgabe: nicht „stimmt das noch?",
sondern „gibt es das überhaupt, und gehört es hier hinein?".

Die Versuchung ist, einen Subagent einfach suchen zu lassen. Das ist der teuerste denkbare Weg:
Trefferlisten sind Rohtext, und die Hälfte davon ist Zeug, das wir längst haben. **Deshalb läuft
die Neusuche in zwei getrennten Phasen**, und die erste kostet kein Modell.

### 7a. Phase 1 — Kandidaten finden (`npm run discover`)

```
npm run discover -- --runde 26
npm run discover -- --seit-letztem-lauf     (nur, was seit dem letzten Durchlauf dazukam)
```

Das Script fragt mehrere GitHub-Suchen gleichzeitig ab (`topic:qbox`, `topic:qbx`, `qbx_ in:name`,
`qbox in:description`, …), führt die Treffer zusammen und **sortiert deterministisch aus**:

| Schritt | Was passiert | Warum das kein Modell braucht |
|---|---|---|
| Bekannt | Treffer, deren ID **oder Link-Ziel** schon im Katalog steht, fliegen raus | Zeichenvergleich |
| Umbenannt | Gleicher Anbieter, anderer Name (`wasabi_backpack` ↔ `wasabi-backpacks`) → eigene Liste | Präfix-Vergleich |
| Gruppe | **Anderer** Anbieter, gleiche Funktion (`ac_radio` ↔ `mm_radio`) → bleibt Kandidat, aber mit fertiger `gruppe`-Zuordnung | Präfix-Vergleich |
| Keine Ressource | Kein `fxmanifest.lua`/`__resource.lua` im Repo → raus | HTTP-Abruf |
| Reihung | Nach Aktivität, Sternen und Framework-Signalen aus dem fxmanifest | Rechnen |

Der letzte Punkt der Gruppen-Zeile ist der wichtigste und leicht zu übersehen: **Ein
Konkurrenzprodukt ist keine Dublette.** `mtc-cityhall` und `qbx_cityhall` sind zwei Einträge in
derselben `gruppe` — wer das als Dublette verwirft, verliert genau die Vergleichsdaten, für die
Abschnitt 5 existiert. Die Unterscheidung ist mechanisch (gleicher Anbieter = Umbenennung,
anderer Anbieter = Konkurrenz) und in `npm run selftest` festgenagelt.

Ergebnis ist `data/.prefetch/kandidaten-N.md` — eine Tabelle, keine Prosa. Aus ihr wird
**entschieden**, welche Kandidaten in den Katalog sollen. Das ist Nachdenken, kein Abrufen.

Zur Größenordnung aus dem ersten Lauf (13.08.2026): 687 Rohtreffer aus 6 Abfragen, **11
API-Aufrufe**, davon 74 bereits im Katalog, 24 vermutliche Umbenennungen, 323 ohne fxmanifest —
übrig blieben rund 200 echte Kandidaten. Kein Modell hat dafür eine Zeile gelesen.

### 7b. Phase 2 — Ausgewählte Kandidaten vertiefen (`npm run prefetch -- --kandidaten`)

```
npm run prefetch -- --kandidaten --max 12 --runde 26
```

Ab hier ist der Ablauf identisch zur Nachprüfung: fxmanifest wörtlich, README-Belegzeilen,
Code-Stichprobe über alle `.lua`-Dateien nach Abschnitt 3. Zusätzlich enthält das Briefing
(`data/.prefetch/neu-runde-N.md`) pro Kandidat einen **Feldvorschlag**: das Gerüst eines
Katalogeintrags, in dem alles gefüllt ist, was aus den Fakten ablesbar ist — `version`,
`letztes_update`, `lizenz`, `abhaengigkeiten`, `archiviert`, `quelle`, ein begründeter
`framework`-Vorschlag und die `gruppe`, falls Phase 1 eine erkannt hat.

Was **nicht** gefüllt ist, steht als `<...>`-Platzhalter drin: `kategorie`, `beschreibung`, und
alles, was Urteil verlangt. Diese Platzhalter sind für das Schema ungültige Werte — wer sie stehen
lässt, fliegt bei `npm run validate` auf. Das ist Absicht.

**Der Feldvorschlag ist ein Vorschlag, kein Eintrag.** Er wird gegengelesen, nicht übernommen.
Insbesondere `framework` ist aus Code-Mustern geschlossen und muss gegen das README geprüft
werden; `lizenz: open_source` steht dort, weil GitHub eine SPDX-Lizenz meldet — dass ein Repo
öffentlich ist, sagt nichts über ein zusätzliches Tebex-Escrow-Produkt desselben Autors
(siehe die `jim_*`-Funde aus Runde 14/15).

### 7c. Was ein Kandidat erfüllen muss, um Katalogeintrag zu werden

- **Es ist eine FiveM-Ressource.** `fxmanifest.lua` vorhanden (prüft Phase 1 automatisch).
- **Es ist nicht schon drin.** Weder als ID, noch als Link-Ziel, noch als Umbenennung.
- **Es ist einordbar.** Eine der Kategorien aus `data/kategorien.json` passt. Wenn nicht,
  ist das eine Entscheidung für den Nutzer, kein Grund, eine Kategorie zu erfinden.
- **Es ist belegbar beschreibbar.** Die `beschreibung` muss aus README/Shop-Seite hervorgehen.
  Ein Repo ohne README und ohne Beschreibung bekommt keinen erfundenen Zweck — dann lieber
  `qualitaet: "ungeprueft"` mit dem, was das fxmanifest hergibt.

Ein toter oder unbelegbarer Kandidat wird **nicht** aufgenommen. Der Katalog wächst über echte
Funde, nicht über Zeilenzahl — das Ziel „500–1000+" ist eine Erwartung, keine Quote.

### 7d. Was die Neusuche NICHT ändert

Alles aus Abschnitt 2–5 gilt unverändert: dieselben Pflichtfelder, derselbe Kompatibilitäts-Check,
derselbe Beleggrad, dieselbe Vergleichspflicht innerhalb einer `gruppe`. Ein neuer Eintrag ist
kein Eintrag zweiter Klasse — er durchläuft dieselbe Prüfung wie eine Nachkontrolle, nur dass
Phase 1 die Vorauswahl übernommen hat.
