/**
 * build-altbestand.mjs — Phase 2: führt v2.1-Altbestand und kimi-Runden 1+2 zu
 * data/catalog/altbestand.json zusammen (siehe Plan "Phase 2", D17, D18).
 *
 * Ablauf:
 *   1. v2.1-RAW-Array lesen (von-v21.mjs), Defaults angewandt.
 *   2. kimi-Runden 1 und 2 lesen, 6 bekannte Syntaxdefekte NUR im Speicher reparieren
 *      (von-kimi.mjs), Originaldateien bleiben unverändert.
 *   3. Zusammenführen nach D17: bei ID-Kollision gewinnt kimi FELDWEISE — nur Felder, die
 *      kimi tatsächlich nennt, überschreiben v2.1; Felder, die kimi nicht kennt, bleiben aus
 *      v2.1 erhalten. Jede Überschreibung kommt in den Konfliktbericht.
 *   4. Auf das Katalogschema abbilden (mapping.mjs), alles qualitaet:"ungeprueft" (D18).
 *   5. data/catalog/altbestand.json + docs/altbestand-konflikte.md schreiben.
 *
 * Reiner Lesezugriff auf reference/. Danach: `npm run validate`.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { ladeV21 } from './von-v21.mjs';
import { ladeKimi } from './von-kimi.mjs';
import { mapEntry, normId } from './mapping.mjs';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const WURZEL = path.resolve(HIER, '..', '..');

function unterschiedlicheFelder(alt, neu) {
  const felder = [];
  for (const key of Object.keys(neu)) {
    if (JSON.stringify(neu[key]) !== JSON.stringify(alt[key])) felder.push(key);
  }
  return felder;
}

function main() {
  const v21 = ladeV21(path.join(WURZEL, 'reference', 'qbox-server-planer-v2-1.html'));
  const kimi1 = ladeKimi(path.join(WURZEL, 'reference', 'kimi-kataloge', 'katalog-runde-01.json'));
  const kimi2 = ladeKimi(path.join(WURZEL, 'reference', 'kimi-kataloge', 'katalog-runde-02.json'));

  console.log(`v2.1: ${v21.length} Einträge · kimi Runde 1: ${kimi1.plugins.length} · kimi Runde 2: ${kimi2.plugins.length}`);

  /** @type {Map<string, {raw:object, ausV21:boolean}>} */
  const bestand = new Map();
  for (const eintrag of v21) {
    bestand.set(normId(eintrag.id), { raw: eintrag, ausV21: true });
  }

  const konflikte = [];
  let kimiNeu = 0;

  for (const runde of [{ nr: 1, plugins: kimi1.plugins }, { nr: 2, plugins: kimi2.plugins }]) {
    for (const kimiRaw of runde.plugins) {
      const id = normId(kimiRaw.id);
      const vorhanden = bestand.get(id);

      if (!vorhanden) {
        bestand.set(id, { raw: kimiRaw, ausV21: false });
        kimiNeu++;
        continue;
      }

      const felder = unterschiedlicheFelder(vorhanden.raw, kimiRaw);
      if (vorhanden.ausV21 && felder.length) {
        konflikte.push({ id, runde: runde.nr, felder, altV21: vorhanden.raw, neuKimi: kimiRaw });
      }
      bestand.set(id, { raw: Object.assign({}, vorhanden.raw, kimiRaw), ausV21: vorhanden.ausV21 });
    }
  }

  const plugins = [...bestand.values()]
    .map(eintrag => mapEntry(eintrag.raw))
    .sort((a, b) => a.id.localeCompare(b.id));

  const katalog = {
    catalogVersion: '3.0-altbestand',
    runde: null,
    thema: 'Altbestandskonvertierung (Phase 2): v2.1 (124 Einträge) + kimi-Runden 1+2 (140 Einträge), zusammengeführt nach D17',
    erstellt: new Date().toISOString().slice(0, 10),
    plugins
  };

  const zielKatalog = path.join(WURZEL, 'data', 'catalog', 'altbestand.json');
  writeFileSync(zielKatalog, JSON.stringify(katalog, null, 2) + '\n', 'utf8');
  console.log(`Geschrieben: ${path.relative(WURZEL, zielKatalog)} · ${plugins.length} Plugins gesamt (${kimiNeu} nur bei kimi, ${konflikte.length} Kollisionen mit Überschreibung).`);

  const berichtZeilen = [
    '# Altbestand-Konflikte — v2.1 vs. kimi (Phase 2, D17)',
    '',
    'Automatisch erzeugt von `scripts/import/build-altbestand.mjs`. Bei jeder ID, die in',
    'sowohl v2.1 als auch einer kimi-Runde vorkommt und wo kimi mindestens ein Feld anders',
    'füllt, gewinnt kimi FELDWEISE (D17). Diese Liste ist zur Durchsicht, keine offene Aufgabe —',
    'nichts davon blockiert `npm run validate`.',
    '',
    `**${konflikte.length} Kollisionen mit tatsächlicher Feldänderung.**`,
    ''
  ];
  for (const k of konflikte) {
    berichtZeilen.push(`## \`${k.id}\` (kimi-Runde ${k.runde})`);
    berichtZeilen.push('');
    berichtZeilen.push(`Überschriebene Felder: ${k.felder.map(f => '`' + f + '`').join(', ')}`);
    berichtZeilen.push('');
    for (const feld of k.felder) {
      berichtZeilen.push(`- **${feld}**`);
      berichtZeilen.push(`  - v2.1: ${JSON.stringify(k.altV21[feld])}`);
      berichtZeilen.push(`  - kimi: ${JSON.stringify(k.neuKimi[feld])}`);
    }
    berichtZeilen.push('');
  }

  const zielBericht = path.join(WURZEL, 'docs', 'altbestand-konflikte.md');
  writeFileSync(zielBericht, berichtZeilen.join('\n'), 'utf8');
  console.log(`Geschrieben: ${path.relative(WURZEL, zielBericht)}`);
}

main();
