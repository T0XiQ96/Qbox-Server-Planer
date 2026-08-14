#!/usr/bin/env node
/**
 * validate-wissen.mjs — Pflicht-Gate für die Wissens-Datenbank (data/wissen/).
 *
 * Läuft am Ende von `npm run validate` mit. Geprüft wird dasselbe wie beim Plugin-Katalog:
 * Schema, doppelte IDs, kaputte Querverweise — plus zwei Regeln, die es nur hier gibt:
 *
 *  W1: Ein Artikel darf nur `verifiziert` sein, wenn er mindestens eine Quelle UND ein
 *      `geprueft_am` hat. Sonst wäre die Qualitätsstufe eine Behauptung ohne Beleg — genau der
 *      Fehler, den D7/D18 beim Plugin-Katalog verhindern sollen.
 *  W2: `plugins`-Verweise müssen auf existierende Katalog-IDs zeigen. Ein Artikel, der auf ein
 *      Plugin verweist, das es nicht (mehr) gibt, führt den Leser ins Leere.
 */

import { pruefe } from '../src/lib/schema.js';
import { pfad, relPfad, ladeJson, ladePlugins, rot, gruen, gelb, grau, fett } from './lib/katalog.mjs';
import { readdirSync, existsSync } from 'node:fs';

const ORDNER = pfad('data', 'wissen');
const fehler = [];
const warnungen = [];
const melde = (datei, stelle, text) => fehler.push({ datei, stelle, text });
const warne = (datei, stelle, text) => warnungen.push({ datei, stelle, text });

if (!existsSync(ORDNER)) {
  console.log(grau('  Wissens-Datenbank: kein data/wissen/ vorhanden — übersprungen.'));
  process.exit(0);
}

/* ------------------------------- Schema laden ------------------------------- */

const schemaErg = ladeJson(pfad('schema', 'wissen.schema.json'));
if (!schemaErg.ok) {
  console.error(rot('✖ schema/wissen.schema.json ist nicht lesbar:\n') + schemaErg.meldung);
  process.exit(1);
}
const SCHEMA = schemaErg.daten;

/* ------------------------------ Kategorien laden ------------------------------ */

const katErg = ladeJson(pfad('data', 'wissen', 'kategorien.json'));
if (!katErg.ok) {
  console.error(rot('✖ data/wissen/kategorien.json ist nicht lesbar:\n') + katErg.meldung);
  process.exit(1);
}
const KATEGORIE_IDS = new Set((katErg.daten.kategorien || []).map((k) => k.id));

/* ------------------------------ Artikel einlesen ------------------------------ */

const dateien = readdirSync(ORDNER)
  .filter((d) => d.endsWith('.json') && d !== 'kategorien.json')
  .sort()
  .map((d) => pfad('data', 'wissen', d));

const artikel = new Map();   // id -> {datei, eintrag}

for (const datei of dateien) {
  const erg = ladeJson(datei);
  if (!erg.ok) { melde(relPfad(datei), '', erg.meldung); continue; }

  for (const f of pruefe(erg.daten, SCHEMA)) {
    melde(relPfad(datei), f.pfad || '(Wurzel)', f.meldung);
  }

  for (const [i, a] of (erg.daten.artikel || []).entries()) {
    if (!a || typeof a.id !== 'string') continue;
    const stelle = `artikel[${i}] „${a.id}"`;

    if (artikel.has(a.id)) {
      melde(relPfad(datei), stelle, `doppelte id — steht schon in ${artikel.get(a.id).datei}`);
      continue;
    }
    artikel.set(a.id, { datei: relPfad(datei), stelle, eintrag: a });
  }
}

/* -------------------------------- Regeln prüfen -------------------------------- */

const katalogIds = new Set(ladePlugins().map((p) => p.id));

for (const { datei, stelle, eintrag: a } of artikel.values()) {
  if (!KATEGORIE_IDS.has(a.kategorie)) {
    melde(datei, stelle, `unbekannte kategorie „${a.kategorie}" — nicht in data/wissen/kategorien.json`);
  }

  // W1 — verifiziert nur mit Beleg
  if (a.qualitaet === 'verifiziert') {
    if (!(a.quellen || []).length) melde(datei, stelle, 'qualitaet „verifiziert" ohne quellen — nicht belegbar');
    if (!a.geprueft_am) melde(datei, stelle, 'qualitaet „verifiziert" ohne geprueft_am');
  }

  // W2 — Querverweise
  for (const id of a.siehe_auch || []) {
    if (!artikel.has(id)) melde(datei, stelle, `siehe_auch „${id}" ist kein bekannter Wissens-Artikel`);
  }
  for (const id of a.plugins || []) {
    if (!katalogIds.has(id)) warne(datei, stelle, `plugins „${id}" steht nicht im Plugin-Katalog`);
  }
}

/* ---------------------------------- Ausgabe ---------------------------------- */

const nachStufe = { verifiziert: 0, teilgeprueft: 0, ungeprueft: 0 };
for (const { eintrag } of artikel.values()) nachStufe[eintrag.qualitaet]++;

console.log(fett('\nWissens-Datenbank') + grau(
  `  ·  ${dateien.length} Datei(en), ${artikel.size} Artikel, ${KATEGORIE_IDS.size} Kategorien`));
console.log(grau(`  ✅ ${nachStufe.verifiziert} verifiziert · 🟡 ${nachStufe.teilgeprueft} teilgeprüft · ⚪ ${nachStufe.ungeprueft} ungeprüft`));

if (warnungen.length) {
  console.log(gelb(`\n⚠ ${warnungen.length} Warnung(en):`));
  for (const w of warnungen) console.log(`  ${relPfadFarbe(w.datei)}${grau(' · ' + w.stelle)}\n    ${w.text}`);
}

if (fehler.length) {
  console.log(rot(`\n✖ ${fehler.length} Fehler:`));
  for (const f of fehler) console.log(`\n  ${relPfadFarbe(f.datei)}${grau(' · ' + f.stelle)}\n    ${f.text}`);
  console.log(rot('\n✖ Wissens-Datenbank ist ROT.\n'));
  process.exit(1);
}

console.log(gruen('✔ Wissens-Datenbank ist grün.\n'));

function relPfadFarbe(p) { return '[36m' + p + '[0m'; }
