#!/usr/bin/env node
/**
 * stats.mjs — Zahlen zum Katalog, ohne den Katalog in den Chat zu ziehen (CLAUDE.md §0).
 * Aufruf: npm run stats
 */

import { ladeKatalog, ladeKategorien, rot, gruen, gelb, blau, grau, fett } from './lib/katalog.mjs';

const { plugins, dateien, fehler } = ladeKatalog();
const kategorien = ladeKategorien();

if (fehler.length) {
  console.log(rot('⚠ Diese Dateien konnten nicht gelesen werden — die Zahlen sind unvollständig:'));
  fehler.forEach((f) => console.log(f.split('\n').map((z) => '  ' + z).join('\n')));
  console.log('');
}

if (!plugins.length) {
  console.log(grau('\nKatalog ist leer. Mit "npm run newround 1" die erste Runde anlegen.\n'));
  process.exit(0);
}

const zaehle = (fn) => {
  const m = new Map();
  for (const p of plugins) {
    const k = fn(p);
    if (k === null || k === undefined) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};

const balken = (anzahl, max, breite = 24) => '█'.repeat(Math.max(1, Math.round((anzahl / max) * breite)));

function block(titel, karte, reihenfolge) {
  const eintraege = reihenfolge
    ? reihenfolge.filter((k) => karte.has(k)).map((k) => [k, karte.get(k)])
    : [...karte.entries()].sort((a, b) => b[1] - a[1]);
  if (!eintraege.length) return;

  const max = Math.max(...eintraege.map((e) => e[1]));
  const breiteName = Math.max(...eintraege.map((e) => String(e[0]).length));

  console.log(fett('\n' + titel));
  for (const [k, v] of eintraege) {
    console.log(`  ${String(k).padEnd(breiteName)}  ${String(v).padStart(4)}  ${grau(balken(v, max))}`);
  }
}

const nameVonKat = new Map((kategorien.liste || []).map((k) => [k.id, k.name]));

console.log(fett(`\nKatalog · ${plugins.length} Plugins aus ${dateien.length} Datei(en)`));
console.log(grau('  ' + dateien.map((d) => `${d.name} (${(d.daten.plugins || []).length})`).join(', ')));

block('Kategorie', zaehle((p) => nameVonKat.get(p.kategorie) || `${p.kategorie} (unbekannt!)`),
  [...nameVonKat.values(), ...[...new Set(plugins.map((p) => p.kategorie))].filter((k) => !nameVonKat.has(k)).map((k) => `${k} (unbekannt!)`)]);

block('Qualität', zaehle((p) => p.qualitaet), ['verifiziert', 'teilgeprueft', 'ungeprueft']);
block('Framework', zaehle((p) => p.framework), ['qbox_nativ', 'qbcore_bridge', 'standalone', 'qbcore_only']);
block('Lizenz', zaehle((p) => p.lizenz), ['open_source', 'escrow']);
block('Link-Status', zaehle((p) => p.link_status), ['ok', 'umgezogen', '404', 'gesperrt', 'ungeprueft']);

/* ------------------------------- Kosten ------------------------------- */

const summe = { einmalig: {}, abo: {} };
for (const p of plugins) {
  if (!p.preis) continue;
  const topf = summe[p.preis.typ];
  if (!topf) continue;
  topf[p.preis.waehrung] = (topf[p.preis.waehrung] || 0) + p.preis.betrag;
}
const alsText = (topf) => Object.entries(topf).map(([w, b]) => `${b.toFixed(2)} ${w}`).join(' + ') || '0';

console.log(fett('\nKosten, wenn alles installiert wäre'));
console.log(`  einmalig     ${alsText(summe.einmalig)}`);
console.log(`  monatlich    ${alsText(summe.abo)}`);

/* ------------------------------ Auffälliges ------------------------------ */

const archiviert = plugins.filter((p) => p.archiviert).length;
const altStack = plugins.filter((p) => p.stack_hinweis).length;
const warnungVermutung = plugins.filter((p) => p.kompat_warnung && p.kompat_warnung.sicherheit === 'vermutung').length;
const warnungBestaetigt = plugins.filter((p) => p.kompat_warnung && p.kompat_warnung.sicherheit === 'bestaetigt').length;
const essenziell = plugins.filter((p) => p.essenziell).length;
const ohnePruefung = plugins.filter((p) => !p.geprueft_am).length;

console.log(fett('\nAuffälliges'));
console.log(`  essenziell                     ${essenziell}`);
console.log(`  archiviert 🪦                   ${archiviert}`);
console.log(`  Alt-Stack-Hinweis              ${altStack}`);
console.log(`  Kompat-Warnung bestätigt       ${warnungBestaetigt}`);
console.log(`  Kompat-Warnung Vermutung       ${warnungVermutung}`);
console.log(`  ohne geprueft_am               ${ohnePruefung}` + (ohnePruefung ? grau('  ← Kandidaten für die nächste Nachprüfrunde') : ''));

/* ----------------------------- Fortschritt ----------------------------- */

const ziel = 500;
const anteil = Math.min(1, plugins.length / ziel);
console.log(fett('\nKatalogziel 500–1000+'));
console.log(`  ${blau('█'.repeat(Math.round(anteil * 30)).padEnd(30, '·'))}  ${plugins.length}/${ziel}`);

const verifiziert = plugins.filter((p) => p.qualitaet === 'verifiziert').length;
const farbe = verifiziert / plugins.length > 0.5 ? gruen : gelb;
console.log(farbe(`  ${verifiziert} von ${plugins.length} verifiziert (${Math.round((verifiziert / plugins.length) * 100)} %)\n`));
