#!/usr/bin/env node
/**
 * find.mjs — Plugin im Katalog suchen, ohne den Katalog in den Chat zu laden (CLAUDE.md §0).
 * Aufruf: npm run find police
 *         npm run find -- --gruppe inventory
 *         npm run find -- --id ox_inventory      (vollständiger Eintrag)
 */

import { ladeKatalog, rot, gruen, gelb, blau, grau, fett } from './lib/katalog.mjs';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : null;
};
const suchId = flag('id');
const suchGruppe = flag('gruppe');
const suchKategorie = flag('kategorie');
const begriffe = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));

if (!suchId && !suchGruppe && !suchKategorie && !begriffe.length) {
  console.error(rot('✖ Suchbegriff fehlt.') + '  Aufruf: ' + fett('npm run find police') + grau('  ·  --id <id> · --gruppe <g> · --kategorie <k>'));
  process.exit(1);
}

const { plugins, fehler } = ladeKatalog();
if (fehler.length) fehler.forEach((f) => console.log(rot(f) + '\n'));

const zeichen = (p) => [
  p.essenziell ? '⭐' : '',
  p.archiviert ? '🪦' : '',
  p.stack_hinweis ? '🧱' : '',
  p.kompat_warnung ? (p.kompat_warnung.sicherheit === 'bestaetigt' ? '⚠️' : '❔') : '',
  p.preis ? '💰' : '',
  p.lizenz === 'escrow' ? '🔒' : ''
].filter(Boolean).join('');

const qualiFarbe = { verifiziert: gruen, teilgeprueft: gelb, ungeprueft: grau };

/* ---------------------- Vollanzeige eines Eintrags ---------------------- */

if (suchId) {
  const p = plugins.find((x) => x.id === suchId);
  if (!p) { console.error(rot(`✖ Keine ID "${suchId}" im Katalog.`)); process.exit(1); }

  console.log('\n' + fett(p.name) + grau(`  (${p.id})`) + '  ' + zeichen(p));
  const zeile = (k, v) => { if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)) console.log(`  ${grau(k.padEnd(18))}${Array.isArray(v) ? v.join(', ') : v}`); };

  zeile('Kategorie', p.kategorie);
  zeile('Gruppe', p.gruppe);
  zeile('Autor', p.autor);
  zeile('Framework', p.framework);
  zeile('Lizenz', p.lizenz);
  zeile('Preis', p.preis ? `${p.preis.betrag} ${p.preis.waehrung} (${p.preis.typ})` : 'kostenlos');
  zeile('Version', p.version);
  zeile('Letztes Update', p.letztes_update);
  zeile('Ressource', p.ressource);
  zeile('Link', p.link);
  zeile('Link-Status', `${p.link_status}${p.link_geprueft_am ? ' · ' + p.link_geprueft_am : ''}`);
  zeile('Qualität', `${p.qualitaet}${p.geprueft_am ? ' · geprüft ' + p.geprueft_am : ' · nie geprüft'}`);
  zeile('Quelle', p.quelle);
  console.log('\n  ' + p.beschreibung);

  const liste = (titel, werte, farbe = (s) => s) => {
    if (!werte || !werte.length) return;
    console.log('\n  ' + fett(titel));
    werte.forEach((w) => console.log('    ' + farbe(typeof w === 'string' ? '· ' + w : '· ' + JSON.stringify(w))));
  };
  liste('Features', p.features);
  liste('Pro', p.pro, gruen);
  liste('Contra', p.contra, rot);
  liste('Neutral', p.neutral, gelb);
  liste('Abhängigkeiten', p.abhaengigkeiten, blau);
  liste('Konflikte', p.konflikte, rot);
  liste('Synergie', p.synergie, blau);
  liste('Ersetzt', p.ersetzt, blau);

  for (const e of p.ergaenzt || []) {
    console.log('\n  ' + fett('Ergänzt ' + e.id));
    (e.plus || []).forEach((x) => console.log('    ' + gruen('+ ' + x)));
    (e.minus || []).forEach((x) => console.log('    ' + rot('− ' + x)));
  }
  if (p.kompat_warnung) console.log('\n  ' + gelb(`⚠ Kompatibilität (${p.kompat_warnung.sicherheit}): `) + p.kompat_warnung.text);
  if (p.archiviert) console.log('  ' + gelb('🪦 Archiviert: ') + p.archiviert.text + (p.archiviert.nachfolger ? grau(` → Nachfolger: ${p.archiviert.nachfolger}`) : ''));
  if (p.stack_hinweis) console.log('  ' + gelb('🧱 Alter Stack: ') + p.stack_hinweis);
  if (p.bundle) console.log('  ' + gelb('📦 Bundle: ') + p.bundle);
  if (p.tipp) console.log('  ' + blau('💡 Tipp: ') + p.tipp);
  console.log('');
  process.exit(0);
}

/* ---------------------------- Trefferliste ---------------------------- */

const nadeln = begriffe.map((b) => b.toLowerCase());
const treffer = plugins.filter((p) => {
  if (suchGruppe && p.gruppe !== suchGruppe) return false;
  if (suchKategorie && p.kategorie !== suchKategorie) return false;
  if (!nadeln.length) return true;
  const heu = [p.id, p.name, p.autor, p.kategorie, p.gruppe, p.beschreibung, ...(p.features || []), ...(p.pro || []), ...(p.contra || [])]
    .filter(Boolean).join(' ').toLowerCase();
  return nadeln.every((n) => heu.includes(n));
});

if (!treffer.length) {
  console.log(gelb(`\nKein Treffer für ${begriffe.join(' ') || suchGruppe || suchKategorie}.`) + grau(`  (${plugins.length} Plugins durchsucht)\n`));
  process.exit(0);
}

console.log(fett(`\n${treffer.length} Treffer`) + grau(` von ${plugins.length} Plugins\n`));

const breiteId = Math.min(28, Math.max(...treffer.map((p) => p.id.length)));
for (const p of treffer.slice(0, 60)) {
  const q = (qualiFarbe[p.qualitaet] || grau)(p.qualitaet.padEnd(12));
  console.log(`  ${fett(p.id.padEnd(breiteId))}  ${q} ${grau(p.kategorie.padEnd(14))} ${zeichen(p)}`);
  console.log(grau(`  ${' '.repeat(breiteId)}  ${p.beschreibung.slice(0, 96)}${p.beschreibung.length > 96 ? '…' : ''}`));
}
if (treffer.length > 60) console.log(grau(`\n  … ${treffer.length - 60} weitere. Suche eingrenzen.`));
console.log(grau(`\n  Vollständiger Eintrag: npm run find -- --id <id>\n`));
