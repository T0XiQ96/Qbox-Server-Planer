/**
 * costs.js — Kosten-Tracker, getrennt nach einmalig/Abo und nach DEV/MAIN (F7).
 */

import { WAEHRUNG_ZEICHEN } from '../lib/hilfen.js';
import { istGehakt } from './state.js';

/** @returns {{einmalig:Object<string,number>, abo:Object<string,number>}} Betrag je Währung. */
export function kostenSumme(index, umgebung) {
  const einmalig = {};
  const abo = {};

  for (const p of index.values()) {
    if (!p.preis || !istGehakt(p.id, umgebung)) continue;
    const topf = p.preis.typ === 'abo' ? abo : einmalig;
    topf[p.preis.waehrung] = (topf[p.preis.waehrung] || 0) + p.preis.betrag;
  }

  return { einmalig, abo };
}

export function kostenBeiderUmgebungen(index) {
  return { dev: kostenSumme(index, 'dev'), main: kostenSumme(index, 'main') };
}

/** Formatiert einen Währungstopf, z.B. {EUR:45, USD:10} -> "€45 + $10". */
export function kostenText(topf) {
  const teile = Object.entries(topf).map(([w, betrag]) => `${WAEHRUNG_ZEICHEN[w] || w + ' '}${rundeGeld(betrag)}`);
  return teile.length ? teile.join(' + ') : '0';
}

function rundeGeld(betrag) {
  const gerundet = Math.round(betrag * 100) / 100;
  return Number.isInteger(gerundet) ? String(gerundet) : gerundet.toFixed(2);
}
