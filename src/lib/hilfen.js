/**
 * hilfen.js — Kleinkram, den mehrere Module brauchen.
 *
 * Entstanden, weil der Kollisionsprüfer in scripts/build.mjs dieselben Helfer doppelt gefunden hat
 * (kopie/warnen in state.js und katalogspeicher.js, WAEHRUNG_ZEICHEN in render.js und costs.js).
 * Nach dem Bündeln teilen sich alle Module einen Gültigkeitsbereich — doppelte Namen auf oberster
 * Ebene würden sich still gegenseitig überschreiben.
 */

/** Tiefe Kopie über JSON. Reicht für unsere Daten: reine Objekte, Listen, Strings, Zahlen. */
export function kopie(wert) {
  return JSON.parse(JSON.stringify(wert));
}

/** Einheitliche Warnung auf der Konsole, ohne die Oberfläche zu stören. */
export function warnen(text, e) {
  if (typeof console !== 'undefined') console.warn('[Qbox-Planer] ' + text, e || '');
}

/** Anzeigezeichen der im Schema erlaubten Währungen. */
export const WAEHRUNG_ZEICHEN = { EUR: '€', USD: '$', GBP: '£' };
