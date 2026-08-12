/**
 * von-v21.mjs — liest reference/qbox-server-planer-v2-1.html NUR LESEND, schneidet das
 * RAW-Array heraus und wertet es in einem Node-vm-Kontext aus (reines Datenliteral, kein
 * ausführbarer Code). Wendet dieselben Defaults an wie das v2.1-Tool selbst (Zeile
 * "const P=RAW.map(...)"), damit fehlende Felder wie im Original behandelt werden.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const V21_DEFAULTS = {
  group: null, ess: false, ver: '–', updated: 'ungeprüft', deps: [], linkcheck: '11.08.2026',
  price: null, conflicts: [], synergy: [], extends: [], compat: null, archived: null,
  bundle: null, tip: null, pros: ['–'], cons: ['–'], neutral: ['–']
};

/** @returns {object[]} Rohdatensätze aus dem RAW-Array, Defaults angewandt. */
export function ladeV21(pfad) {
  const html = readFileSync(pfad, 'utf8');

  const startMarker = 'const RAW=[';
  const startIdx = html.indexOf(startMarker);
  if (startIdx < 0) throw new Error(`${pfad}: Marke "${startMarker}" nicht gefunden.`);
  const start = startIdx + startMarker.length - 1; // inkl. öffnender [

  const endMarker = '\n];\nconst P=RAW.map';
  const endIdx = html.indexOf(endMarker, start);
  if (endIdx < 0) throw new Error(`${pfad}: Ende des RAW-Arrays nicht gefunden.`);
  const end = endIdx + 2; // inkl. schließender ]

  const quelltext = html.slice(start, end);
  const raw = vm.runInNewContext(quelltext, {}, { filename: 'v21-raw-array' });

  return raw.map(eintrag => Object.assign({}, V21_DEFAULTS, eintrag));
}
