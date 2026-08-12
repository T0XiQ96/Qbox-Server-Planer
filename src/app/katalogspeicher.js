/**
 * katalogspeicher.js — dauerhafte Ablage der Import-Differenz (Entscheidung D3a).
 *
 * Bewusst ein EIGENER localStorage-Schlüssel, getrennt von meinem Zustand:
 *  · "Import-Differenz verwerfen" kann so meine Haken gar nicht erst mitreißen,
 *  · die Größenüberwachung sieht genau den Teil, der wirklich wächst,
 *  · und ein voller Speicher beim Katalog kostet mich nicht meinen Stand.
 *
 * Gespeichert wird NUR die Differenz — Einträge, die per Import dazukamen oder sich änderten.
 * Der eingebaute Katalog steckt fest in der gebauten HTML-Datei und wird nie mitgesichert.
 * Genau daran ist die Vorversion gescheitert: sie legte den kompletten Katalog nach
 * `catalogExtra` in den localStorage und lief ins 5-MB-Limit.
 */

import { kopie, warnen } from '../lib/hilfen.js';

export const KATALOG_SCHLUESSEL = 'qbox_planer_katalog_diff';
export const KATALOG_SCHEMA_VERSION = 1;

/** Ab hier wird gewarnt. Der Browser gibt typischerweise 5 MB pro Herkunft — mit Reserve. */
export const WARN_GRENZE_BYTES = 3 * 1024 * 1024;

const LEER = { schemaVersion: KATALOG_SCHEMA_VERSION, eintraege: {}, herkunft: [] };

let diff = kopie(LEER);

/* ================================== Laden ================================== */

/** Liest die gespeicherte Differenz. Ein Defekt hier darf den Start nie verhindern. */
export function ladeDifferenz() {
  let roh = null;
  try {
    roh = localStorage.getItem(KATALOG_SCHLUESSEL);
  } catch (e) {
    warnen('localStorage nicht verfügbar — importierte Runden gelten nur für diese Sitzung.', e);
    return diff;
  }
  if (!roh) return diff;

  try {
    const gelesen = JSON.parse(roh);
    diff = { ...kopie(LEER), ...gelesen };
    if (!diff.eintraege || typeof diff.eintraege !== 'object') diff.eintraege = {};
  } catch (e) {
    warnen('Gespeicherte Katalog-Differenz ist beschädigt und wurde verworfen. Meine Haken sind davon nicht betroffen.', e);
    diff = kopie(LEER);
  }
  return diff;
}

/* ================================= Sichern ================================= */

/**
 * @returns {{ok:true, bytes:number, warnung?:string} | {ok:false, meldung:string, bytes:number}}
 */
export function sichereDifferenz() {
  const text = JSON.stringify(diff);
  const bytes = text.length * 2;   // localStorage speichert UTF-16, grobe, aber ehrliche Schätzung

  try {
    localStorage.setItem(KATALOG_SCHLUESSEL, text);
  } catch (e) {
    return {
      ok: false,
      bytes,
      meldung: 'Der Browser-Speicher ist voll — die importierte Runde gilt nur für diese Sitzung. ' +
        'Dauerhaft wird sie, indem die Datei nach data/catalog/ gelegt und "npm run build" ausgeführt wird. ' +
        'Alternativ die Import-Differenz verwerfen.'
    };
  }

  return bytes > WARN_GRENZE_BYTES
    ? { ok: true, bytes, warnung: `Die gespeicherten Import-Runden belegen ${imKlartext(bytes)}. Ab etwa 5 MB ist Schluss — die Runden dauerhaft über data/catalog/ + "npm run build" einbauen und die Differenz danach verwerfen.` }
    : { ok: true, bytes };
}

/* ============================== Differenz pflegen ============================== */

/**
 * Nimmt die übernommenen Einträge einer Import-Vorschau auf.
 * @param {object[]} eintraege bereits mit Defaults versehene Plugins
 * @param {{dateiname?:string, catalogVersion?:string, runde?:number|null}} herkunft
 */
export function merkeEintraege(eintraege, herkunft = {}) {
  for (const p of eintraege) diff.eintraege[p.id] = p;

  diff.herkunft.unshift({
    dateiname: herkunft.dateiname || '',
    catalogVersion: herkunft.catalogVersion || '',
    runde: herkunft.runde ?? null,
    anzahl: eintraege.length,
    importiert: new Date().toISOString()
  });

  return sichereDifferenz();
}

/**
 * Legt die Differenz über den eingebauten Katalog. Reihenfolge des eingebauten Katalogs bleibt
 * erhalten, neu Hinzugekommenes wird angehängt — sonst springen die Karten nach jedem Import.
 */
export function mitDifferenz(eingebautePlugins) {
  const eintraege = diff.eintraege || {};
  if (!Object.keys(eintraege).length) return eingebautePlugins;

  const gesehen = new Set();
  const ergebnis = eingebautePlugins.map((p) => {
    gesehen.add(p.id);
    return eintraege[p.id] || p;
  });

  for (const [id, p] of Object.entries(eintraege)) {
    if (!gesehen.has(id)) ergebnis.push(p);
  }
  return ergebnis;
}

/** Alles aus dem Import verwerfen. Rührt meinen Zustand nicht an — anderer Schlüssel. */
export function verwirfDifferenz() {
  diff = kopie(LEER);
  try {
    localStorage.removeItem(KATALOG_SCHLUESSEL);
  } catch (e) {
    warnen('Import-Differenz konnte nicht aus dem Speicher entfernt werden.', e);
  }
}

/* ================================== Auskunft ================================== */

export function differenzInfo() {
  const anzahl = Object.keys(diff.eintraege || {}).length;
  const bytes = JSON.stringify(diff).length * 2;
  return {
    anzahl,
    bytes,
    lesbar: imKlartext(bytes),
    knapp: bytes > WARN_GRENZE_BYTES,
    herkunft: diff.herkunft || []
  };
}

function imKlartext(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
