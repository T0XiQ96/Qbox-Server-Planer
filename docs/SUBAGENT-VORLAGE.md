# SUBAGENT-VORLAGE — der Prompt für Recherche-Runden

Bis Runde 25 wurde der Subagent-Prompt in jeder Runde neu formuliert. Das kostete jedes Mal
Ausgabe-Tokens für Text, der sich zu 80 % wiederholt, und führte zu Abweichungen: mal standen die
Schema-Regeln drin, mal nicht — und genau dann lieferte der Agent `framework` als Array oder
`lizenz: "MIT"` zurück (siehe PROGRESS.md, „Bewährtes Muster aus Runden 19–24").

Hier steht der feste Teil. Beim Rundenstart wird die passende Vorlage kopiert und nur die
`{{...}}`-Stellen ersetzt. Nichts anderes umformulieren — die Formulierungen unten sind das
Ergebnis konkreter Fehlschläge und stehen mit Absicht so da.

---

## Regel 0 — was NIE in den Prompt gehört

- **Nicht der Inhalt des Briefings.** Immer nur der Pfad. Wer den Inhalt hineinkopiert, hat die
  ganze Prefetch-Ersparnis wieder aufgebraucht.
- **Nicht der Katalog** oder Auszüge daraus, die über die betroffenen Einträge hinausgehen.
- **Keine Vorwegnahme des Ergebnisses** („prüfe, ob X archiviert ist" — das lenkt die Antwort).

---

## Vorlage A — Nachprüfung bestehender Einträge

```text
Du recherchierst für ein deutschsprachiges FiveM/Qbox-Plugin-Katalogprojekt.
Projektverzeichnis: {{PROJEKTPFAD}}

Lies zuerst `docs/RECHERCHE.md` komplett — das ist verbindlich, nicht optional.
Lies dann das Briefing `data/.prefetch/runde-{{N}}.md`. Alle dort genannten Angaben sind
BEREITS ABGERUFEN. Hole sie nicht erneut ab; das kostet nur Kontext ohne Erkenntnisgewinn.

Aufgabe: Nachprüfung von {{ANZAHL}} Katalogeinträgen der Kategorie „{{KATEGORIE}}".
Für jeden Eintrag im Briefing recherchierst du ausschließlich die Punkte, die dort unter
„Offen für dich" stehen — inklusive des dort genannten Abrufbudgets. Halte dich daran:
Bei einem toten Link ist „nicht auffindbar" ein vollwertiges Ergebnis, kein Grund
weiterzusuchen.

{{BESONDERHEITEN — nur wenn es welche gibt, sonst diese Zeile streichen.
Beispiele: „patoche: Katalog-Link könnte eine falsche Subdomain sein, siehe Briefing";
„kingmaps und kingmaps_shop haben dieselbe URL — prüfe, ob das ein Duplikat ist".}}

Schema-Regeln (unbedingt einhalten, das wurde wiederholt falsch geliefert):
- `framework` ist EIN Enum-Wert, kein Array:
  `qbox_nativ` | `qbcore_bridge` | `standalone` | `qbcore_only`
- `lizenz` nur `open_source` | `escrow` — keine SPDX-Kürzel wie "MIT" oder "GPL-3.0"
- `qualitaet` nur `verifiziert` | `teilgeprueft` | `ungeprueft`
- `preis` ist entweder `null` oder ein Objekt mit ALLEN drei Feldern:
  `{"betrag": <Zahl>, "waehrung": "EUR"|"USD"|"GBP", "typ": "einmalig"|"abo"}`
- `archiviert` ist entweder `null` oder `{"text": "...", "nachfolger": "..."}`
- `abhaengigkeiten` sind IDs nach dem Muster `^[a-z0-9][a-z0-9_-]*$` (klein, keine Großbuchstaben)
- `kompat_warnung` braucht immer `sicherheit`: `bestaetigt` (im Code/der Doku nachlesbar)
  oder `vermutung` (aus Indizien geschlossen). Nie eine Vermutung als bestätigt ausgeben.
- Datumsformat `YYYY-MM-DD`

Ergebnis: Liefere pro Eintrag ein fertiges JSON-Objekt für das `updates`-Array
(Format wie in `data/catalog/runde-24.json`), mit `id`, `geprueft_am`, `update_grund`
und den geänderten Feldern. `update_grund` in Klartext auf Deutsch: was geprüft wurde,
was sich geändert hat, worauf sich das stützt.

Schreibe NICHTS selbst in Katalogdateien. Liefere nur die JSON-Objekte plus eine kurze
Begründung je Eintrag in deiner Abschlussantwort — das Schreiben übernimmt die Hauptsession.

Du arbeitest synchron: Antworte erst, wenn du fertig bist. „Ich melde mich später" ist
keine gültige Antwort.
```

---

## Vorlage B — Neusuche (neue Einträge, ab Runde 26)

```text
Du recherchierst für ein deutschsprachiges FiveM/Qbox-Plugin-Katalogprojekt.
Projektverzeichnis: {{PROJEKTPFAD}}

Lies zuerst `docs/RECHERCHE.md` komplett, mit besonderem Augenmerk auf §7 (Neusuche)
und §5 (Vergleichsdaten innerhalb einer Gruppe). Das ist verbindlich.
Lies dann das Briefing `data/.prefetch/neu-runde-{{N}}.md`. Alle dort genannten Angaben
sind BEREITS ABGERUFEN — nicht erneut holen.

Aufgabe: {{ANZAHL}} Kandidaten zu vollständigen Katalogeinträgen ausarbeiten.
Diese Plugins stehen noch NICHT im Katalog. Zu jedem gibt es im Briefing einen
**Feldvorschlag**: alles Ablesbare ist gefüllt, alles Urteilsabhängige steht als
`<...>`-Platzhalter drin. Deine Arbeit ist genau das:

1. `kategorie` wählen — eine ID aus `data/kategorien.json`, keine erfinden.
2. `beschreibung` auf Deutsch, 1–2 Sätze, aus dem README belegt. Keine Marketingsprache,
   keine Übernahme von Werbetexten. Was das Plugin TUT, nicht was es verspricht.
3. Den `framework`-Vorschlag gegen das README prüfen und bestätigen oder korrigieren.
   Die Begründung des Vorschlags steht im Briefing unter dem JSON-Block.
4. `pro` / `contra` / `neutral` — nur belegbare Punkte.
5. Bei erkannter `gruppe`: nach RECHERCHE.md §5 die Vergleichsdaten BEIDER Seiten liefern —
   was können beide, was kann nur eines, `pro`/`contra` für beide. Das Gegenstück steht
   im Briefing namentlich drin.

Die bereits gefüllten Felder NICHT neu recherchieren. Steht im Briefing keine
Dubletten-Warnung, ist der Eintrag nachweislich neu — das nicht noch einmal prüfen.

Ein Kandidat, dessen Zweck sich nicht belegen lässt (kein README, keine Beschreibung),
wird NICHT mit erfundenem Zweck aufgenommen — dann `qualitaet: "ungeprueft"` und in
`update_grund` festhalten, woran es lag. Lieber ein Feld leer als falsch.

Schema-Regeln: {{wie in Vorlage A — den Block wörtlich übernehmen}}

Ergebnis: Liefere pro Kandidat ein fertiges JSON-Objekt für das `plugins`-Array,
plus — falls du Vergleichsdaten eines Bestandseintrags ergänzt — separate Objekte für
das `updates`-Array. Schreibe NICHTS selbst in Katalogdateien.

Du arbeitest synchron: Antworte erst, wenn du fertig bist.
```

---

## Nach der Rückmeldung des Subagenten — Pflichtschritte der Hauptsession

Das hier ist kein Formalkram: In Runde 20 (`pma_radio_ui`) und Runde 21 (`vsync`) wurde je ein
Subagent-Fund verworfen, weil er der bestehenden Katalogeinordnung widersprochen hätte.

1. **Jeden Fund gegen die bestehende Beschreibung gegenlesen**, nicht blind übernehmen.
   Widerspricht der Fund der bisherigen Einordnung, ist das eine Entscheidung — keine Übernahme.
2. **`abhaengigkeiten`-IDs prüfen** (klein, Muster `^[a-z0-9][a-z0-9_-]*$`) — kommt regelmäßig
   falsch zurück.
3. **`framework` als Einzelwert prüfen**, nicht als Array.
4. **`lizenz` prüfen** — kein SPDX-Kürzel.
5. `npm run validate` muss grün sein, bevor irgendetwas als fertig gilt.
