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

### 1a. Exakte URL-Muster für GitHub-Repos (kein Rätselraten, kein Web-UI-Klicken)

Bei einem GitHub-Link `https://github.com/<owner>/<repo>` immer diese vier Abrufe machen,
in dieser Reihenfolge — das erspart das langsame Durchklicken der Web-Oberfläche:

1. **Existenz + Status + letzter Push** (ein API-Call beantwortet mehrere Fragen auf einmal):
   `https://api.github.com/repos/<owner>/<repo>`
   Liefert als JSON u.a. `archived` (true/false), `pushed_at` (letzter Push, ISO-Datum),
   `default_branch` (für Schritt 2/3 wichtig — meist `main`, manchmal `master`),
   `license.spdx_id`, `description`. Ein 404 hier heißt: Repo existiert nicht (mehr) unter
   diesem Pfad → `link_status: "404"`, dann gezielt nach dem neuen Namen suchen
   (siehe 1b), nicht raten.
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

### 1b. Wenn der Katalog-Link 404 liefert — Repo-Umzug systematisch suchen

Nicht raten, sondern in dieser Reihenfolge prüfen, bevor der Eintrag auf `ungeprueft`/`404`
fällt:
1. GitHub leitet umbenannte Repos oft automatisch um — den Link trotzdem einmal im Klartext
   aufrufen (nicht nur die API), ein Redirect zeigt den neuen Pfad direkt in der URL-Leiste.
2. Alle Repos des gleichen Owners auflisten: `https://api.github.com/users/<owner>/repos?per_page=100`
   (oder `/orgs/<owner>/repos`, falls Org) → nach ähnlichem Namen suchen. Viele Autoren nutzen
   ein festes Präfix (z.B. `randol_*` statt `randolio_*`) — wenn ein Muster erkennbar ist, gezielt
   danach filtern statt einzeln zu raten.
3. GitHub-Suche über alle Repos: `https://github.com/search?q=<name>&type=repositories`.
4. Erst wenn alle drei nichts liefern: `link_status: "404"`, `qualitaet: "ungeprueft"`,
   `update_grund` explizit festhalten, dass systematisch gesucht wurde (welche Owner/Suchbegriffe),
   kein Ersatzlink raten.

### 1c. Tebex-Produktseiten (Premium/Escrow)

Tebex-Shopseiten sind oft bot-geschützt (403 bei direktem Fetch). Falls die Seite selbst nicht
lesbar ist, reicht als Beleg: die URL selbst (Store-Name im Pfad, Paket-ID), plus wenn vorhanden
eine separate Doku-Domain des Autors (z.B. `docs.<anbieter>.dev` oder `docs.<anbieter>.gitbook.io`)
oder ein Cfx-Forum-Thread zum Produkt — dort steht meist Preis, unterstützte Frameworks und ob
Escrow. Wenn nichts davon erreichbar ist: `qualitaet: "ungeprueft"`, `sicherheit: "vermutung"` bei
etwaigen `kompat_warnung`-Einträgen, keine Marketingaussagen der Seite ungeprüft übernehmen
(z.B. "fully open source" kann auch nur "nach Kauf editierbar" bedeuten, siehe Runde 15 `jim_tequilala`).

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
