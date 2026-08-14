#!/usr/bin/env node
/**
 * build.mjs — baut dist/qbox-planer.html als EINE Datei.
 *
 * Alles wird eingebettet: CSS, JavaScript, Katalog, Kategorien. Kein fetch, kein Modul-Import
 * zur Laufzeit — sonst blockt der Browser die Datei über file:// (Feature H5, Doppelklick, offline).
 *
 * Der Bundler ist bewusst winzig (Entscheidung D15): er folgt den relativen ESM-Importen ab
 * src/app/main.js, sortiert topologisch, streicht import/export und hängt alles aneinander.
 * Weil danach alle Module denselben Gültigkeitsbereich teilen, prüft er zusätzlich auf
 * doppelte Namen auf oberster Ebene — sonst überschreiben sich zwei Module still gegenseitig.
 *
 * Vor dem Bauen läuft immer validate. Ein roter Katalog wird nicht ausgeliefert.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pfad, relPfad, ladeKatalog, rot, gruen, gelb, grau, fett } from './lib/katalog.mjs';

const EINSTIEG = pfad('src', 'app', 'main.js');
const RAHMEN = pfad('src', 'index.html');
const STIL = pfad('src', 'style.css');
const ZIEL = pfad('dist', 'qbox-planer.html');

/* ------------------------------ 1. Pflicht-Gate ------------------------------ */

console.log(fett('\nnpm run build'));
console.log(grau('  1/4  validate …'));

for (const gateSkript of ['validate.mjs', 'validate-wissen.mjs']) {
  const gate = spawnSync(process.execPath, [pfad('scripts', gateSkript)], { encoding: 'utf8' });
  if (gate.status !== 0) {
    console.log(gate.stdout || '');
    console.error(gate.stderr || '');
    console.error(rot(`✖ Build abgebrochen: ${gateSkript} ist rot. Rote Daten werden nicht gebaut.\n`));
    process.exit(1);
  }
}

for (const datei of [RAHMEN, EINSTIEG]) {
  if (!existsSync(datei)) {
    console.error(rot(`✖ ${relPfad(datei)} fehlt.`) + grau('  Ohne Rahmen und Einstiegsmodul lässt sich nichts bauen.\n'));
    process.exit(1);
  }
}

/* -------------------------------- 2. Bundeln -------------------------------- */

console.log(grau('  2/4  Module bündeln …'));

const IMPORT_ZEILE = /^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]\s*;?\s*$/gm;
const NAME_ZEILE = /^(?:export\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm;

const module = new Map();   // absoluter Pfad -> {quelle, importe[]}
const reihenfolge = [];
const besucht = new Set();
const imGang = new Set();

function einlesen(datei) {
  if (module.has(datei)) return module.get(datei);
  if (!existsSync(datei)) {
    console.error(rot(`✖ Import zeigt ins Leere: ${relPfad(datei)}`));
    process.exit(1);
  }
  const quelle = readFileSync(datei, 'utf8');
  const importe = [...quelle.matchAll(IMPORT_ZEILE)].map((m) => resolve(dirname(datei), m[1]));
  const eintrag = { datei, quelle, importe };
  module.set(datei, eintrag);
  return eintrag;
}

function sortieren(datei) {
  if (besucht.has(datei)) return;
  if (imGang.has(datei)) {
    console.error(rot(`✖ Ringschluss im Import: ${relPfad(datei)} importiert sich am Ende selbst.`));
    process.exit(1);
  }
  imGang.add(datei);
  for (const imp of einlesen(datei).importe) sortieren(imp);
  imGang.delete(datei);
  besucht.add(datei);
  reihenfolge.push(datei);
}

sortieren(EINSTIEG);

// Namenskollisionen finden, bevor sie sich still gegenseitig überschreiben.
const namen = new Map();
const kollisionen = [];
for (const datei of reihenfolge) {
  for (const m of module.get(datei).quelle.matchAll(NAME_ZEILE)) {
    const name = m[1];
    if (namen.has(name)) kollisionen.push(`${name}  (${relPfad(namen.get(name))} und ${relPfad(datei)})`);
    else namen.set(name, datei);
  }
}
if (kollisionen.length) {
  console.error(rot('✖ Doppelte Namen auf oberster Ebene — nach dem Bündeln teilen sich alle Module einen Gültigkeitsbereich:'));
  kollisionen.forEach((k) => console.error('    ' + k));
  console.error(grau('  Einen der beiden umbenennen.\n'));
  process.exit(1);
}

const skript = reihenfolge.map((datei) => {
  const quelle = module.get(datei).quelle
    .replace(IMPORT_ZEILE, '')
    .replace(/^export\s+(?=(const|let|var|function|class|async)\b)/gm, '');
  return `/* ===== ${relative(pfad('src'), datei).split('\\').join('/')} ===== */\n${quelle.trim()}\n`;
}).join('\n');

/* ------------------------------ 3. Daten holen ------------------------------ */

console.log(grau('  3/4  Katalog einbetten …'));

const { plugins, dateien } = ladeKatalog();
const kategorien = JSON.parse(readFileSync(pfad('data', 'kategorien.json'), 'utf8'));
const paket = JSON.parse(readFileSync(pfad('package.json'), 'utf8'));

const katalogVersion = dateien.length
  ? (dateien[dateien.length - 1].daten.catalogVersion || paket.version)
  : paket.version;

/** In ein <script>-Element eingebettetes JSON: < muss escapt werden, sonst beendet </script die Datei. */
const alsJson = (wert) => JSON.stringify(wert).replace(/</g, '\\u003c');

// Das Schema wandert mit in die gebaute Datei, damit der Katalog-Import in der App GENAU dieselbe
// Prüfung fährt wie "npm run validate". Sonst würden Kommandozeile und Werkzeug auseinanderdriften
// und eine Datei, die hier durchgeht, im Tool durchfallen (oder schlimmer: umgekehrt).
const schema = JSON.parse(readFileSync(pfad('schema', 'plugin.schema.json'), 'utf8'));

// Die Wissens-Datenbank wandert genauso mit wie der Katalog: sie ist Daten, kein Code (D28).
// Ein neuer Artikel bedeutet also eine Datei in data/wissen/ und einen Rebuild — nie eine
// Änderung in src/.
const wissenOrdner = pfad('data', 'wissen');
const wissen = { kategorien: [], artikel: [] };
if (existsSync(wissenOrdner)) {
  wissen.kategorien = JSON.parse(readFileSync(pfad('data', 'wissen', 'kategorien.json'), 'utf8')).kategorien || [];
  for (const name of readdirSync(wissenOrdner).filter((d) => d.endsWith('.json') && d !== 'kategorien.json').sort()) {
    wissen.artikel.push(...(JSON.parse(readFileSync(pfad('data', 'wissen', name), 'utf8')).artikel || []));
  }
}

const daten = {
  katalogVersion,
  toolVersion: paket.version,
  gebaut: new Date().toISOString().slice(0, 10),
  kategorien: kategorien.kategorien,
  schema,
  plugins,
  wissen
};

/* -------------------------------- 4. Schreiben -------------------------------- */

console.log(grau('  4/4  schreiben …'));

let html = readFileSync(RAHMEN, 'utf8');
const stil = existsSync(STIL) ? readFileSync(STIL, 'utf8') : '';

const platzhalter = {
  '<!--@STIL-->': `<style>\n${stil}\n</style>`,
  '<!--@DATEN-->': `<script type="application/json" id="qbox-daten">${alsJson(daten)}</script>`,
  '<!--@SKRIPT-->': `<script>\n${skript}\n</script>`,
  '@VERSION@': `${paket.version}`,
  '@KATALOGVERSION@': `${katalogVersion}`,
  '@ANZAHL@': `${plugins.length}`,
  '@GEBAUT@': daten.gebaut
};

// Die Block-Platzhalter (<!--@STIL-->, <!--@DATEN-->, <!--@SKRIPT-->) dürfen NUR genau einmal
// vorkommen. Erwähnt der Rahmen die Marke ein zweites Mal (z.B. in einem erklärenden Kommentar),
// würde split/join den Inhalt dort ein zweites Mal einsetzen — genau das schon einmal passiert.
for (const [marke, ersatz] of Object.entries(platzhalter)) {
  const istBlock = marke.startsWith('<!--');
  const anzahl = html.split(marke).length - 1;

  if (istBlock && anzahl === 0) {
    console.error(rot(`✖ ${relPfad(RAHMEN)} enthält den Platzhalter ${marke} nicht.`));
    process.exit(1);
  }
  if (istBlock && anzahl > 1) {
    console.error(rot(`✖ ${relPfad(RAHMEN)} enthält den Platzhalter ${marke} ${anzahl}× statt genau einmal.`));
    console.error(grau('  Sonst würde der Inhalt an jeder Fundstelle noch einmal eingesetzt — auch in Kommentaren, die ihn nur erwähnen.'));
    process.exit(1);
  }

  html = html.split(marke).join(ersatz);
}

if (/<script[^>]+src=|<link[^>]+href=/i.test(html)) {
  console.error(rot('✖ Im Ergebnis steht noch ein externer src/href-Verweis. Über file:// würde das nicht laden.'));
  process.exit(1);
}

mkdirSync(dirname(ZIEL), { recursive: true });
writeFileSync(ZIEL, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log(gruen(`\n✔ ${relPfad(ZIEL)} gebaut.`) + grau(`  ${kb} KB · ${plugins.length} Plugins · ${reihenfolge.length} Module · Katalog v${katalogVersion}`));
console.log(grau('  Per Doppelklick öffnen — kein Server nötig.\n'));

if (plugins.length === 0) console.log(gelb('  Hinweis: der Katalog ist leer. Demo-Daten liegen in data/catalog/demo.json.\n'));
