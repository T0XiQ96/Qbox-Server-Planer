#!/usr/bin/env node
/**
 * newround.mjs — legt das Gerüst für eine Recherche-Runde an.
 * Aufruf: npm run newround 4
 *
 * Überschreibt nie eine vorhandene Datei — eine Runde ist Arbeit, die nicht verloren gehen darf.
 */

import { writeFileSync, existsSync } from 'node:fs';
import { pfad, relPfad, ladeKatalog, rot, gruen, gelb, grau, fett } from './lib/katalog.mjs';

const THEMEN = {
  1: 'Framework & Kern', 2: 'Jobs', 3: 'Crime & Heists', 4: 'Fahrzeuge',
  5: 'Housing & Immobilien', 6: 'MLOs & Maps', 7: 'HUD/UI/Notify', 8: 'Waffen & Gangs',
  9: 'Anticheat/Admin/Tools', 10: 'Nischen + finale Duplikatprüfung über alles'
};

const arg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
if (!arg) {
  console.error(rot('✖ Rundennummer fehlt.') + '  Aufruf: ' + fett('npm run newround 4'));
  process.exit(1);
}

const n = Number(arg);
const ziel = pfad('data', 'catalog', `runde-${n}.json`);

if (existsSync(ziel)) {
  console.error(rot(`✖ ${relPfad(ziel)} gibt es schon.`) + grau('\n  Nichts angefasst — eine vorhandene Runde wird nie überschrieben.'));
  process.exit(1);
}

const { plugins } = ladeKatalog();

// Die 20 Einträge mit dem ältesten Prüfdatum kommen laut docs/RECHERCHE.md §6 in die Nachprüfung.
const nachpruefen = plugins
  .slice()
  .sort((a, b) => (a.geprueft_am || '').localeCompare(b.geprueft_am || ''))
  .slice(0, 20)
  .map((p) => `${p.id} (geprueft_am: ${p.geprueft_am || 'nie'})`);

const geruest = {
  _hinweis: 'Recherche strikt nach docs/RECHERCHE.md. Jede Plugin-Seite tatsächlich lesen — kein Eintrag aus Vorwissen. Nicht Belegbares bekommt qualitaet "ungeprueft".',
  catalogVersion: `3.0-r${n}`,
  runde: n,
  thema: THEMEN[n] || '<Themenblock eintragen>',
  erstellt: new Date().toISOString().slice(0, 10),
  plugins: [],
  updates: []
};

writeFileSync(ziel, JSON.stringify(geruest, null, 2) + '\n', 'utf8');

console.log(gruen(`✔ ${relPfad(ziel)} angelegt.`) + grau(`  Thema: ${geruest.thema}`));
console.log(grau(`  Bestand: ${plugins.length} Plugins. IDs zur Duplikatprüfung: data/_ids.txt (npm run validate schreibt sie).`));

if (nachpruefen.length) {
  console.log(gelb('\n  Diese Einträge sind laut RECHERCHE.md §6 in dieser Runde nachzuprüfen:'));
  nachpruefen.forEach((z) => console.log(grau('    · ' + z)));
}
console.log('');
