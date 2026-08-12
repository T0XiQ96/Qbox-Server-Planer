#!/usr/bin/env node
/**
 * validate.mjs — Pflicht-Gate vor jedem Commit (CLAUDE.md §2.3).
 *
 * Geprüft wird in dieser Reihenfolge, damit die erste Meldung immer die nützlichste ist:
 *   1. JSON-Syntax        — mit Datei, Zeile, Spalte, Feld und Plugin (Feature E4)
 *   2. Schema             — Pflichtfelder, Enums, Muster, unbekannte Felder
 *   3. Doppelte IDs       — über ALLE Katalogdateien hinweg, mit beiden Fundstellen
 *   4. Querverweise       — abhaengigkeiten/konflikte/ersetzt/synergie/ergaenzt zeigen ins Leere
 *   5. Sonderregeln R1-R9 — siehe schema/plugin.schema.json
 *
 * Fehler -> Exit 1. Warnungen -> Exit 0, aber sichtbar.
 * Am Ende entsteht data/_ids.txt, das die Recherche-Runden zur Duplikatprüfung brauchen.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pruefe, unbekannteSchluessel } from '../src/lib/schema.js';
import {
  katalogDateien, KATALOG_ORDNER, ladeJson, ladeKategorien, pfad, relPfad,
  rot, gruen, gelb, blau, grau, fett
} from './lib/katalog.mjs';

// --ordner <pfad> prüft einen anderen Ordner. Nur für scripts/selftest.mjs gedacht;
// data/_ids.txt wird dann bewusst nicht geschrieben.
const ordnerArg = process.argv.indexOf('--ordner');
const ORDNER = ordnerArg >= 0 ? resolve(process.argv[ordnerArg + 1]) : KATALOG_ORDNER();
const IST_STANDARD = ORDNER === KATALOG_ORDNER();

const fehler = [];
const warnungen = [];
const melde = (datei, stelle, text) => fehler.push({ datei, stelle, text });
const warne = (datei, stelle, text) => warnungen.push({ datei, stelle, text });

/* ------------------------------ 0. Schema laden ------------------------------ */

const schemaErg = ladeJson(pfad('schema', 'plugin.schema.json'));
if (!schemaErg.ok) {
  console.error(rot('✖ Das Schema selbst ist kaputt:\n') + schemaErg.text);
  process.exit(1);
}
const SCHEMA = schemaErg.daten;

const luecken = unbekannteSchluessel(SCHEMA);
if (luecken.length) {
  console.error(rot('✖ Das Schema benutzt Schlüsselwörter, die der Prüfer nicht auswertet:'));
  luecken.forEach((l) => console.error('  ' + l));
  console.error(grau('  Entweder src/lib/schema.js erweitern oder das Schlüsselwort entfernen — eine stille Prüflücke wäre schlimmer.'));
  process.exit(1);
}

const kategorien = ladeKategorien();
if (!kategorien.ok) {
  console.error(rot('✖ data/kategorien.json:\n') + kategorien.text);
  process.exit(1);
}

/* --------------------------- 1. + 2. Dateien prüfen --------------------------- */

const dateien = katalogDateien(ORDNER);
const geladen = [];

for (const p of dateien) {
  const name = relPfad(p);
  const erg = ladeJson(p);
  if (!erg.ok) { melde(name, '', erg.text); continue; }   // Syntax kaputt -> Rest sinnlos

  const schemafehler = pruefe(erg.daten, SCHEMA);
  for (const sf of schemafehler) melde(name, sf.pfad, sf.meldung);

  geladen.push({ name, daten: erg.daten });
}

/* ------------------------- 3. IDs sammeln, Duplikate ------------------------- */

const index = new Map();   // id -> {datei, stelle, plugin}

for (const d of geladen) {
  (d.daten.plugins || []).forEach((p, i) => {
    const stelle = `plugins[${i}]`;
    if (!p || typeof p.id !== 'string') return;   // Schema hat das schon gemeldet
    const vorher = index.get(p.id);
    if (vorher) {
      melde(d.name, stelle, `doppelte ID "${p.id}" — steht schon in ${vorher.datei} (${vorher.stelle})`);
      return;
    }
    index.set(p.id, { datei: d.name, stelle, plugin: p });
  });
}

/* ---------------- 4. Querverweise + 5. Sonderregeln je Eintrag ---------------- */

const heute = new Date().toISOString().slice(0, 10);
const gruppen = new Map();

for (const [id, eintrag] of index) {
  const p = eintrag.plugin;
  const wo = (feld) => `${eintrag.stelle} "${id}" · ${feld}`;

  // R7 — Querverweise müssen auf existierende IDs zeigen
  for (const feld of ['abhaengigkeiten', 'konflikte', 'ersetzt', 'synergie']) {
    for (const ziel of p[feld] || []) {
      if (ziel === id) melde(eintrag.datei, wo(feld), `verweist auf sich selbst`);
      else if (!index.has(ziel)) melde(eintrag.datei, wo(feld), `"${ziel}" gibt es im Katalog nicht`);
    }
  }
  for (const e of p.ergaenzt || []) {
    if (e && typeof e.id === 'string' && !index.has(e.id)) {
      melde(eintrag.datei, wo('ergaenzt'), `"${e.id}" gibt es im Katalog nicht`);
    }
  }

  // R8 — Nachfolger nur als Warnung: er darf noch unkatalogisiert sein
  const nachfolger = p.archiviert && p.archiviert.nachfolger;
  if (nachfolger && !index.has(nachfolger)) {
    warne(eintrag.datei, wo('archiviert.nachfolger'), `"${nachfolger}" steht noch nicht im Katalog — in einer späteren Runde aufnehmen`);
  }

  // R2/R3 — geprüfte Qualität braucht Prüfdatum und Quelle
  if (p.qualitaet === 'verifiziert' && !p.geprueft_am) {
    melde(eintrag.datei, wo('qualitaet'), `"verifiziert" ohne geprueft_am — ohne Prüfdatum gibt es keine Verifikation`);
  }
  if ((p.qualitaet === 'verifiziert' || p.qualitaet === 'teilgeprueft') && !p.quelle) {
    melde(eintrag.datei, wo('qualitaet'), `"${p.qualitaet}" ohne quelle — die Fundstelle gehört nach docs/RECHERCHE.md dazu`);
  }

  // R4 — ein Linkstatus ohne Datum altert unbemerkt
  if ((p.link_status === 'ok' || p.link_status === '404') && !p.link_geprueft_am) {
    melde(eintrag.datei, wo('link_status'), `"${p.link_status}" ohne link_geprueft_am`);
  }

  // R5 — update_grund gehört nur in updates[]
  if (p.update_grund !== undefined) {
    melde(eintrag.datei, wo('update_grund'), `gehört ausschließlich in updates[], nicht in einen plugins[]-Eintrag`);
  }

  // R6 — Kategorie muss es geben
  if (p.kategorie && !kategorien.ids.includes(p.kategorie)) {
    melde(eintrag.datei, wo('kategorie'), `"${p.kategorie}" steht nicht in data/kategorien.json (erlaubt: ${kategorien.ids.join(', ')})`);
  }

  // Datum aus der Zukunft ist immer ein Tippfehler
  for (const feld of ['geprueft_am', 'link_geprueft_am']) {
    if (p[feld] && p[feld] > heute) warne(eintrag.datei, wo(feld), `liegt in der Zukunft (${p[feld]})`);
  }

  if (p.gruppe) {
    if (!gruppen.has(p.gruppe)) gruppen.set(p.gruppe, []);
    gruppen.get(p.gruppe).push(id);
  }
}

// R9 — eine Gruppe mit einem einzigen Mitglied bringt nichts
for (const [gruppe, mitglieder] of gruppen) {
  if (mitglieder.length === 1) {
    warne('data/catalog', `gruppe "${gruppe}"`, `nur ein Mitglied (${mitglieder[0]}) — Ersetzt-Logik und Vergleich greifen erst ab zwei`);
  }
}

/* ------------------------------ updates[] prüfen ------------------------------ */

for (const d of geladen) {
  (d.daten.updates || []).forEach((u, i) => {
    if (!u || typeof u.id !== 'string') return;
    if (!index.has(u.id)) melde(d.name, `updates[${i}]`, `"${u.id}" steht in keiner Katalogdatei — ein Update ohne Original`);
  });
}

/* --------------------------------- Ausgabe --------------------------------- */

console.log(fett('\nnpm run validate') + grau(`  ·  ${dateien.length} Katalogdatei(en), ${index.size} Plugins\n`));

if (warnungen.length) {
  console.log(gelb(`⚠ ${warnungen.length} Warnung(en):`));
  for (const w of warnungen) console.log(`  ${blau(w.datei)}${w.stelle ? grau(' · ' + w.stelle) : ''}\n    ${w.text}`);
  console.log('');
}

if (fehler.length) {
  console.log(rot(`✖ ${fehler.length} Fehler:`));
  for (const f of fehler) {
    if (!f.stelle) console.log('\n' + f.text.split('\n').map((z) => '  ' + z).join('\n'));
    else console.log(`\n  ${blau(f.datei)}${grau(' · ' + f.stelle)}\n    ${f.text}`);
  }
  console.log(rot('\n✖ validate ist ROT — reparieren geht vor allem anderen (CLAUDE.md §0.3).\n'));
  process.exit(1);
}

// data/_ids.txt für die Duplikatprüfung der Recherche-Runden
if (IST_STANDARD) {
  const zeilen = [...index.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'de'))
    .map(([id, e]) => `${id}\t${e.plugin.name || ''}\t${e.datei}`);
  writeFileSync(pfad('data', '_ids.txt'), zeilen.join('\n') + (zeilen.length ? '\n' : ''), 'utf8');
}

console.log(gruen('✔ validate ist grün.') + grau(IST_STANDARD ? `  data/_ids.txt geschrieben (${index.size} IDs).\n` : '\n'));
