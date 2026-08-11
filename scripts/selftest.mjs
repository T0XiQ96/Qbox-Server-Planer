#!/usr/bin/env node
/**
 * selftest.mjs — prüft die Prüfer.
 *
 * Der wichtigste Teil ist der Regressionstest für Feature E4: eine kaputte Katalogdatei muss
 * Datei, ZEILE und FELD nennen. "Ungültige Katalog-Datei" ist genau die Meldung, an der das
 * Vorgängerprojekt gescheitert ist — an ihr war nicht zu erkennen, dass in
 * reference/kimi-kataloge/ nur sechs Anführungszeichen fehlten.
 *
 * Die beiden kimi-Dateien werden dabei ausschließlich GELESEN und nie verändert.
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseJson, fehlerText } from '../src/lib/jsonfehler.js';
import { mitStandard, badgesVon } from '../src/app/defaults.js';
import { pruefe } from './lib/schema.mjs';
import { pfad, rot, gruen, grau, fett } from './lib/katalog.mjs';

let gelaufen = 0;
let gescheitert = 0;

function pruefung(name, fn) {
  gelaufen++;
  try {
    fn();
    console.log('  ' + gruen('✔') + ' ' + name);
  } catch (e) {
    gescheitert++;
    console.log('  ' + rot('✖') + ' ' + name);
    console.log(grau('      ' + String(e.message).split('\n').join('\n      ')));
  }
}

const gleich = (ist, soll, was) => {
  if (ist !== soll) throw new Error(`${was}\n  erwartet: ${JSON.stringify(soll)}\n  bekommen: ${JSON.stringify(ist)}`);
};
const enthaelt = (text, teil, was) => {
  if (!String(text).includes(teil)) throw new Error(`${was}\n  vermisst: ${teil}\n  im Text:  ${String(text).slice(0, 400)}`);
};

/* ============================================================================
   1. Der echte Altbestand — die sechs bekannten Defekte
   ============================================================================ */

console.log(fett('\nJSON-Fehlermeldungen (Feature E4) — gegen reference/kimi-kataloge/'));

/** Die sechs Defekte, in der Reihenfolge, in der der Parser über sie stolpert. */
const ERWARTET = {
  'katalog-runde-01.json': [
    { zeile: 11, feld: 'cons', ursache: 'Schlüssel ohne öffnendes Anführungszeichen', reparatur: [',cons":', ',"cons":'] },
    { zeile: 40, feld: 'desc', ursache: 'Nicht escapetes Anführungszeichen', reparatur: ['„Grandma\'s House"', '„Grandma\'s House“'] },
    { zeile: 48, feld: 'desc', ursache: 'Nicht escapetes Anführungszeichen', reparatur: ['„Drücke E"', '„Drücke E“'] },
    { zeile: 75, feld: 'cons', ursache: 'Schlüssel ohne schließendes Anführungszeichen', reparatur: ['"cons:[', '"cons":['] }
  ],
  'katalog-runde-02.json': [
    { zeile: 30, feld: 'desc', ursache: 'Nicht escapetes Anführungszeichen', reparatur: ['„More Than Code"', '„More Than Code“'] },
    { zeile: 44, feld: 'pros', ursache: 'Schlüssel ohne schließendes Anführungszeichen', reparatur: ['"pros:[', '"pros":['] }
  ]
};
const EINTRAEGE = { 'katalog-runde-01.json': 83, 'katalog-runde-02.json': 57 };

for (const [datei, defekte] of Object.entries(ERWARTET)) {
  const quelle = pfad('reference', 'kimi-kataloge', datei);
  let text = readFileSync(quelle, 'utf8');   // nur lesen, die Originale bleiben unangetastet

  defekte.forEach((d, i) => {
    pruefung(`${datei} · Defekt ${i + 1}: Zeile ${d.zeile}, Feld "${d.feld}"`, () => {
      const erg = parseJson(text, datei);
      if (erg.ok) throw new Error('Datei parst, obwohl ein Defekt erwartet wird');

      const f = erg.fehler;
      gleich(f.zeile, d.zeile, 'falsche Zeilennummer');
      gleich(f.feld, d.feld, 'falsches Feld benannt');
      enthaelt(f.ursache, d.ursache, 'Ursache nicht im Klartext benannt');

      const ausgabe = fehlerText(f);
      enthaelt(ausgabe, datei, 'Dateiname fehlt in der Meldung');
      enthaelt(ausgabe, ':' + d.zeile + ':', 'Zeilennummer fehlt in der Meldung');
      if (!f.plugin) throw new Error('kein Plugin zugeordnet — die Meldung soll sagen, WO im Katalog es klemmt');
      if (/^Ungültige/i.test(ausgabe)) throw new Error('pauschale Meldung statt konkreter Fundstelle');
    });
    text = text.replace(d.reparatur[0], d.reparatur[1]);
  });

  pruefung(`${datei} · nach allen Reparaturen: ${EINTRAEGE[datei]} Einträge`, () => {
    const erg = parseJson(text, datei);
    if (!erg.ok) throw new Error('parst immer noch nicht:\n' + fehlerText(erg.fehler));
    gleich(erg.daten.plugins.length, EINTRAEGE[datei], 'unerwartete Anzahl Einträge');
  });
}

/* ============================================================================
   2. Weitere Defektarten, die im Katalogalltag vorkommen
   ============================================================================ */

console.log(fett('\nWeitere JSON-Defekte'));

const faelle = [
  { name: 'JS-Objektliteral (unquotierte Schlüssel)', text: '{\n  "plugins": [\n    { id: "ox_lib" }\n  ]\n}', ursache: 'JS-Objektliteral', zeile: 3 },
  { name: 'Komma hinter dem letzten Element', text: '{\n  "plugins": [\n    { "id": "a" },\n  ]\n}', ursache: 'Komma hinter dem letzten Element', zeile: 3 },
  { name: 'einfache Anführungszeichen', text: "{\n  'catalogVersion': '1'\n}", ursache: 'Anführungszeichen', zeile: 2 },
  { name: 'Datei abgeschnitten', text: '{\n  "plugins": [\n    { "id": "a"', ursache: 'Datei endet mitten im Inhalt', zeile: 3 }
];

for (const f of faelle) {
  pruefung(f.name, () => {
    const erg = parseJson(f.text, 'test.json');
    if (erg.ok) throw new Error('parst, obwohl ein Fehler erwartet wird');
    enthaelt(erg.fehler.ursache, f.ursache, 'Ursache nicht erkannt');
    gleich(erg.fehler.zeile, f.zeile, 'falsche Zeilennummer');
  });
}

pruefung('gültiges JSON parst ohne Fehler', () => {
  const erg = parseJson('{"catalogVersion":"1","plugins":[]}', 'test.json');
  if (!erg.ok) throw new Error('gültiges JSON wurde als kaputt gemeldet');
});

/* ============================================================================
   3. Defaults — sie müssen auf JEDE Quelle wirken (CLAUDE.md §4)
   ============================================================================ */

console.log(fett('\nDefaults'));

pruefung('fehlende Felder werden ergänzt, ohne das Original zu verändern', () => {
  const roh = { id: 'ox_lib' };
  const p = mitStandard(roh);
  gleich(roh.qualitaet, undefined, 'das Original wurde verändert');
  gleich(p.qualitaet, 'ungeprueft', 'qualitaet nicht ergänzt');
  gleich(p.link_status, 'ungeprueft', 'link_status nicht ergänzt');
  gleich(p.ressource, 'ox_lib', 'ressource fällt nicht auf die id zurück');
  gleich(Array.isArray(p.abhaengigkeiten), true, 'Listenfeld fehlt');
  gleich(p.preis, null, 'preis nicht auf null gesetzt');
});

pruefung('Listenfelder bleiben getrennte Objekte je Eintrag', () => {
  const a = mitStandard({ id: 'a' });
  const b = mitStandard({ id: 'b' });
  a.pro.push('nur bei a');
  gleich(b.pro.length, 0, 'zwei Einträge teilen sich dieselbe Liste');
});

pruefung('ressource wird nicht überschrieben, wenn sie gesetzt ist', () => {
  gleich(mitStandard({ id: 'keep_bags', ressource: 'keep-bags' }).ressource, 'keep-bags', 'ressource überschrieben');
});

pruefung('Badges werden aus framework/lizenz/preis abgeleitet', () => {
  const b = badgesVon(mitStandard({ id: 'x', framework: 'qbox_nativ', lizenz: 'escrow', preis: { betrag: 20, waehrung: 'EUR', typ: 'einmalig' } }));
  const ids = b.map((x) => x.id).join(',');
  enthaelt(ids, 'qbox', 'Qbox-Badge fehlt');
  enthaelt(ids, 'escrow', 'Escrow-Badge fehlt');
  enthaelt(ids, 'premium', 'Premium-Badge fehlt');
});

/* ============================================================================
   4. Schema-Prüfer
   ============================================================================ */

console.log(fett('\nSchema-Prüfer'));

const SCHEMA = JSON.parse(readFileSync(pfad('schema', 'plugin.schema.json'), 'utf8'));
const gueltig = JSON.parse(readFileSync(pfad('scripts', 'testdaten', 'gut', 'minimal.json'), 'utf8'));

pruefung('gültige Datei kommt fehlerfrei durch', () => {
  const fehler = pruefe(gueltig, SCHEMA);
  if (fehler.length) throw new Error('unerwartete Fehler:\n' + fehler.map((f) => `${f.pfad}: ${f.meldung}`).join('\n'));
});

pruefung('fehlendes Pflichtfeld wird beim Namen genannt', () => {
  const kaputt = JSON.parse(JSON.stringify(gueltig));
  delete kaputt.plugins[0].framework;
  const fehler = pruefe(kaputt, SCHEMA);
  enthaelt(fehler.map((f) => f.meldung).join('\n'), 'Pflichtfeld "framework" fehlt', 'Pflichtfeld nicht gemeldet');
});

pruefung('Tippfehler im Feldnamen wird gemeldet', () => {
  const kaputt = JSON.parse(JSON.stringify(gueltig));
  kaputt.plugins[0].beschreibnug = 'Tippfehler';
  const fehler = pruefe(kaputt, SCHEMA);
  enthaelt(fehler.map((f) => f.meldung).join('\n'), 'unbekanntes Feld "beschreibnug"', 'Tippfehler nicht erkannt');
});

pruefung('falscher Enum-Wert wird mit den erlaubten Werten gemeldet', () => {
  const kaputt = JSON.parse(JSON.stringify(gueltig));
  kaputt.plugins[0].framework = 'qbox';
  const fehler = pruefe(kaputt, SCHEMA);
  const text = fehler.map((f) => f.meldung).join('\n');
  enthaelt(text, 'nicht erlaubt', 'Enum-Verstoß nicht gemeldet');
  enthaelt(text, 'qbox_nativ', 'erlaubte Werte werden nicht genannt');
});

pruefung('kompat_warnung ohne sicherheit ist ein Fehler (R1)', () => {
  const kaputt = JSON.parse(JSON.stringify(gueltig));
  kaputt.plugins[0].kompat_warnung = { text: 'Irgendein Verdacht ohne Beleggrad.' };
  enthaelt(pruefe(kaputt, SCHEMA).map((f) => f.meldung).join('\n'), 'Pflichtfeld "sicherheit" fehlt', 'R1 greift nicht');
});

pruefung('Fehlerpfad zeigt auf den richtigen Eintrag', () => {
  const kaputt = JSON.parse(JSON.stringify(gueltig));
  kaputt.plugins[2].lizenz = 'gemeinfrei';
  const fehler = pruefe(kaputt, SCHEMA);
  enthaelt(fehler.map((f) => f.pfad).join('\n'), 'plugins[2].lizenz', 'Pfad zeigt nicht auf plugins[2].lizenz');
});

/* ============================================================================
   5. validate als Ganzes — gegen die Testordner
   ============================================================================ */

console.log(fett('\nvalidate im Ganzen'));

const validate = (ordner) => {
  const r = spawnSync(process.execPath, [pfad('scripts', 'validate.mjs'), '--ordner', pfad('scripts', 'testdaten', ordner)],
    { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });
  return { code: r.status, text: (r.stdout || '') + (r.stderr || '') };
};

pruefung('gültiger Testordner → Exit 0', () => {
  const r = validate('gut');
  gleich(r.code, 0, 'validate war rot, obwohl die Daten gültig sind:\n' + r.text);
  enthaelt(r.text, 'validate ist grün', 'kein grünes Ergebnis gemeldet');
});

const kaputt = validate('kaputt');

pruefung('kaputter Testordner → Exit 1', () => gleich(kaputt.code, 1, 'validate war grün, obwohl die Daten kaputt sind:\n' + kaputt.text));

const erwarteteMeldungen = [
  ['doppelte ID über Dateigrenzen', 'doppelte ID "dublette"'],
  ['Fundstelle der ersten Dublette wird genannt', 'a-erste.json'],
  ['toter Querverweis in abhaengigkeiten', '"gibtesnicht" gibt es im Katalog nicht'],
  ['toter Querverweis in ergaenzt', '"auchnicht" gibt es im Katalog nicht'],
  ['unbekannte Kategorie', 'steht nicht in data/kategorien.json'],
  ['verifiziert ohne Prüfdatum (R2)', 'ohne geprueft_am'],
  ['update_grund im plugins-Eintrag (R5)', 'gehört ausschließlich in updates[]'],
  ['Update ohne Original', 'ein Update ohne Original'],
  ['unbekanntes Feld', 'unbekanntes Feld "beschreibnug"'],
  ['ungültiger Enum-Wert', 'ist nicht erlaubt'],
  ['negativer Preis', 'kleiner als 0'],
  ['Nachfolger nur als Warnung', 'noch nicht im Katalog']
];
for (const [name, teil] of erwarteteMeldungen) {
  pruefung(name, () => enthaelt(kaputt.text, teil, 'Meldung fehlt in der Ausgabe von validate'));
}

/* ============================================================================ */

console.log('');
if (gescheitert) {
  console.log(rot(fett(`✖ ${gescheitert} von ${gelaufen} Prüfungen gescheitert.\n`)));
  process.exit(1);
}
console.log(gruen(fett(`✔ alle ${gelaufen} Prüfungen bestanden.\n`)));
