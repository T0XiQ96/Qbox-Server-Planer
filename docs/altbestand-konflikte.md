# Altbestand-Konflikte — v2.1 vs. kimi (Phase 2, D17)

Automatisch erzeugt von `scripts/import/build-altbestand.mjs`. Bei jeder ID, die in
sowohl v2.1 als auch einer kimi-Runde vorkommt und wo kimi mindestens ein Feld anders
füllt, gewinnt kimi FELDWEISE (D17). Diese Liste ist zur Durchsicht, keine offene Aufgabe —
nichts davon blockiert `npm run validate`.

**8 Kollisionen mit tatsächlicher Feldänderung.**

## `ox_inventory` (kimi-Runde 1)

Überschriebene Felder: `ver`, `updated`, `link`, `compat`, `desc`, `pros`, `cons`, `neutral`, `tip`

- **ver**
  - v2.1: "2.x"
  - kimi: "2.44.1 (letztes Overextended-Release, Feb 2025)"
- **updated**
  - v2.1: "Aktiv · 2026"
  - kimi: "⚠️ Overextended archiviert 04/2025 → CommunityOx archiviert 04/2026 → JETZT: TheOrderFivem"
- **link**
  - v2.1: "https://github.com/overextended/ox_inventory"
  - kimi: "https://github.com/TheOrderFivem/ox_inventory"
- **compat**
  - v2.1: null
  - kimi: {"level":"bestaetigt","text":"Archiv-Kette bestätigt: Overextended (04/2025) → CommunityOx (04/2026) → TheOrderFivem (aktuell). Qbox-Setup laut Doku: setr inventory:framework \"qbx\" in server.cfg + ox_inventory DIREKT NACH qbx_core starten."}
- **desc**
  - v2.1: "Slot-Inventar mit Item-Metadaten, Stashes, Shops, Truhen. Qbox-Standard – ersetzt qb-inventory komplett."
  - kimi: "Slot-Inventar mit Metadaten, Stashes, Shops. Qbox-Standard. WICHTIG: Nur noch vom TheOrderFivem-Fork beziehen (Overextended/CommunityOx sind archiviert)!"
- **pros**
  - v2.1: ["Qbox-Standard","Metadaten perfekt für Waffen","Riesige Community"]
  - kimi: ["Qbox-Standard","Metadaten","Aktiver Fork bei TheOrder"]
- **cons**
  - v2.1: ["UI-Umbau braucht Web-Kenntnisse"]
  - kimi: ["Original-Orgs archiviert – Links aus alten Tutorials sind tot"]
- **neutral**
  - v2.1: ["Items in Lua, Bilder als PNG"]
  - kimi: ["server.cfg: setr inventory:framework \"qbx\""]
- **tip**
  - v2.1: "Item-Bilder konsequent benennen (itemname.png)."
  - kimi: "Startreihenfolge: oxmysql → ox_lib → qbx_core → ox_inventory. Der ensure-Export macht das automatisch."

## `ox_lib` (kimi-Runde 1)

Überschriebene Felder: `updated`, `link`, `desc`, `pros`, `cons`, `tip`

- **updated**
  - v2.1: "Aktiv · 2026"
  - kimi: "⚠️ Overextended archiviert → Fork bei TheOrderFivem/CommunityOx"
- **link**
  - v2.1: "https://github.com/overextended/ox_lib"
  - kimi: "https://github.com/TheOrderFivem/ox_lib"
- **desc**
  - v2.1: "Universelle Bibliothek: Menüs, Dialoge, Notifications, Progressbars, Keybinds, Cache, Discord-Logging. Fundament von Qbox."
  - kimi: "Universelle UI-/Utility-Bibliothek. Fundament von Qbox. Auch hier: aktiven Fork nutzen, nicht das archivierte Original."
- **pros**
  - v2.1: ["Ersetzt viele Einzel-Scripts","Top-Doku","Logger integriert"]
  - kimi: ["Ersetzt viele Einzel-Scripts","Top-Doku (coxdocs.dev / overextended.dev)"]
- **cons**
  - v2.1: ["Lernkurve"]
  - kimi: ["Original-Repo read-only"]
- **tip**
  - v2.1: "Wer ox_lib beherrscht, baut 80% seiner Custom-UIs damit."
  - kimi: "Doku: coxdocs.dev (CommunityOx) ist aktueller als overextended.dev."

## `oxmysql` (kimi-Runde 1)

Überschriebene Felder: `updated`, `link`, `desc`, `pros`, `cons`, `tip`

- **updated**
  - v2.1: "Aktiv · 2026"
  - kimi: "⚠️ Original archiviert – Fork nutzen"
- **link**
  - v2.1: "https://github.com/overextended/oxmysql"
  - kimi: "https://github.com/TheOrderFivem/oxmysql"
- **desc**
  - v2.1: "Standard-Datenbank-Wrapper: asynchron, Prepared Statements, viel schneller als mysql-async. Pflicht für Qbox und fast alle modernen Scripts."
  - kimi: "Standard-DB-Wrapper. Funktioniert auch archiviert stabil, aber Sicherheitsfixes kommen nur noch über TheOrder-Fork."
- **pros**
  - v2.1: ["Sehr performant","Standard-API","SQL-Injection-Schutz"]
  - kimi: ["Performant","Standard-API"]
- **cons**
  - v2.1: ["Keine"]
  - kimi: ["Original read-only"]
- **tip**
  - v2.1: "Unraid: MariaDB-Container, eigenes Schema pro Server (dev/main trennen!)."
  - kimi: "Unraid: MariaDB-Container, Schema pro Server trennen."

## `ox_target` (kimi-Runde 1)

Überschriebene Felder: `updated`, `link`, `desc`, `pros`, `cons`

- **updated**
  - v2.1: "Aktiv · 2026"
  - kimi: "⚠️ Original archiviert – Fork nutzen"
- **link**
  - v2.1: "https://github.com/overextended/ox_target"
  - kimi: "https://github.com/TheOrderFivem/ox_target"
- **desc**
  - v2.1: "Third-Eye-Interaktion (ALT → zielen). Qbox-Standard mit qb-target-Kompatibilitäts-Wrapper."
  - kimi: "Third-Eye-Interaktion, Qbox-Standard mit qb-target-Wrapper. Aktiven Fork nutzen."
- **pros**
  - v2.1: ["Qbox-Standard","Performant","Wrapper eingebaut"]
  - kimi: ["Qbox-Standard","Wrapper eingebaut"]
- **cons**
  - v2.1: ["Wrapper deckt nicht 100% ab"]
  - kimi: ["Original read-only"]

## `ox_fuel` (kimi-Runde 1)

Überschriebene Felder: `updated`, `link`, `desc`, `pros`, `cons`

- **updated**
  - v2.1: "Aktiv"
  - kimi: "⚠️ Original archiviert – Fork nutzen"
- **link**
  - v2.1: "https://github.com/overextended/ox_fuel"
  - kimi: "https://github.com/TheOrderFivem/ox_fuel"
- **desc**
  - v2.1: "Tanken via Target, Kanister, Tankstellen-Besitz. Moderner als LegacyFuel."
  - kimi: "Tanken via Target, Kanister, Tankstellen-Besitz. Aktiven Fork nutzen (Original archiviert)."
- **pros**
  - v2.1: ["Performant","Tankstellen-Eigentum","Kanister"]
  - kimi: ["Performant","Tankstellen-Eigentum"]
- **cons**
  - v2.1: ["UI minimalistisch"]
  - kimi: ["UI minimalistisch","Original read-only"]

## `qbx_pawnshop` (kimi-Runde 1)

Überschriebene Felder: `group`, `tip`

- **group**
  - v2.1: null
  - kimi: "pawnshop"
- **tip**
  - v2.1: "Ankaufspreise UNTER Marktwert → Hehler-Risiko spiegelt sich im Preis."
  - kimi: "Ankaufspreise UNTER Marktwert."

## `qbx_recyclejob` (kimi-Runde 1)

Überschriebene Felder: `group`, `desc`

- **group**
  - v2.1: null
  - kimi: "recycling"
- **desc**
  - v2.1: "Recyclinghof: Material gegen Rohstoffe. Kombinierbar mit Crafting (z.B. jim-mechanic-Teile)."
  - kimi: "Recyclinghof: Material gegen Rohstoffe. Kombinierbar mit Crafting."

## `qbx_busjob` (kimi-Runde 1)

Überschriebene Felder: `group`

- **group**
  - v2.1: null
  - kimi: "busjob"
