/**
 * katalog.mjs — gemeinsame Grundlage aller Scripts: Pfade, Laden, Zusammenführen, Konsolenausgabe.
 *
 * Der Katalog wird NIE als Ganzes in einen Chat gelesen (CLAUDE.md §0) — dafür gibt es
 * stats und find, die hier aufsetzen.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { parseJson, fehlerText } from '../../src/lib/jsonfehler.js';
import { alleMitStandard, mitStandard } from '../../src/app/defaults.js';

export const WURZEL = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const pfad = (...teile) => join(WURZEL, ...teile);
export const relPfad = (p) => relative(WURZEL, p).split(sep).join('/');

/* ------------------------------- Ausgabe ------------------------------- */

const farbig = !process.env.NO_COLOR;
const f = (code, s) => (farbig ? `[${code}m${s}[0m` : s);
export const rot = (s) => f('31', s);
export const gruen = (s) => f('32', s);
export const gelb = (s) => f('33', s);
export const blau = (s) => f('36', s);
export const grau = (s) => f('90', s);
export const fett = (s) => f('1', s);

/* -------------------------------- Laden -------------------------------- */

export const KATALOG_ORDNER = () => pfad('data', 'catalog');

/**
 * Alle Katalogdateien in Ladereihenfolge. Updates späterer Runden gewinnen.
 * @param {string} [ordner] abweichender Ordner — wird nur von scripts/selftest.mjs benutzt.
 */
export function katalogDateien(ordner = KATALOG_ORDNER()) {
  if (!existsSync(ordner)) return [];
  return readdirSync(ordner)
    .filter((n) => n.endsWith('.json') && !n.startsWith('_'))
    .sort((a, b) => a.localeCompare(b, 'de', { numeric: true }))
    .map((n) => join(ordner, n));
}

/**
 * Lädt eine JSON-Datei mit ordentlicher Fehlermeldung.
 * @returns {{ok:true, daten:any} | {ok:false, text:string, fehler:object}}
 */
export function ladeJson(dateipfad) {
  if (!existsSync(dateipfad)) {
    return { ok: false, text: `${relPfad(dateipfad)}\n  Datei nicht gefunden`, fehler: null };
  }
  const erg = parseJson(readFileSync(dateipfad, 'utf8'), relPfad(dateipfad));
  return erg.ok ? erg : { ok: false, text: fehlerText(erg.fehler), fehler: erg.fehler };
}

/** Die erlaubten Kategorien aus data/kategorien.json. */
export function ladeKategorien() {
  const erg = ladeJson(pfad('data', 'kategorien.json'));
  if (!erg.ok) return { ok: false, text: erg.text, ids: [], liste: [] };
  const liste = erg.daten.kategorien || [];
  return { ok: true, liste, ids: liste.map((k) => k.id) };
}

/**
 * Lädt alle Katalogdateien.
 * @param {{defaults?:boolean}} opt defaults=true ergänzt fehlende Felder (für stats/find/build).
 *        Der Validator arbeitet bewusst OHNE Defaults, sonst fiele ein fehlendes Pflichtfeld nie auf.
 * @returns {{dateien:Array, plugins:Array, index:Map, fehler:Array<string>}}
 */
export function ladeKatalog(opt = {}) {
  const mitDefaults = opt.defaults !== false;
  const dateien = [];
  const fehler = [];

  for (const p of katalogDateien()) {
    const erg = ladeJson(p);
    if (!erg.ok) { fehler.push(erg.text); continue; }
    dateien.push({ pfad: p, name: relPfad(p), daten: erg.daten });
  }

  // Erst alle Plugins, dann alle Updates in Dateireihenfolge daraufsetzen.
  let plugins = [];
  for (const d of dateien) plugins.push(...(d.daten.plugins || []));
  if (mitDefaults) plugins = alleMitStandard(plugins);

  const index = new Map(plugins.map((p) => [p.id, p]));

  for (const d of dateien) {
    for (const u of d.daten.updates || []) {
      const ziel = index.get(u.id);
      if (!ziel) { fehler.push(`${d.name}\n  updates: "${u.id}" steht in keiner Katalogdatei`); continue; }
      const { update_grund, ...felder } = u;
      Object.assign(ziel, mitDefaults ? mitStandard({ ...ziel, ...felder }) : felder);
    }
  }

  return { dateien, plugins, index, fehler };
}

/** Kurzform: nur die fertigen Plugins. */
export function ladePlugins() {
  return ladeKatalog().plugins;
}
