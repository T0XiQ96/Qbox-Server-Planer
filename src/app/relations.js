/**
 * relations.js — reine Abfragen über die Beziehungen zwischen Plugins.
 *
 * Baut nur Antworten aus Katalog + Zustand, formatiert aber nichts als HTML — das macht render.js.
 * Vorlage: reference/qbox-server-planer-v2-1.html (groupMembers, adopted, coveredBy, Zeile 885-887;
 * Konflikt-/Abhängigkeits-Check aus toggleSrv, Zeile 959-975).
 */

import { istGehakt } from './state.js';

/** Einmal pro Katalogstand aufrufen, Ergebnis überall herumreichen — nicht bei jeder Abfrage neu bauen. */
export function baueIndex(plugins) {
  return new Map(plugins.map((p) => [p.id, p]));
}

export function holePlugin(index, id) {
  return index.get(id) || null;
}

export function gruppenMitglieder(index, gruppe, ausgenommenId = null) {
  if (!gruppe) return [];
  const treffer = [];
  for (const p of index.values()) {
    if (p.gruppe === gruppe && p.id !== ausgenommenId) treffer.push(p);
  }
  return treffer;
}

/**
 * B1 — alle Alternativen zu einem Plugin: die übrige Gruppe (der Normalfall) plus explizite
 * "ersetzt"-Ziele (für gruppenübergreifende Fälle, siehe schema/plugin.schema.json). Dedupliziert.
 */
export function alternativen(index, plugin) {
  const gefunden = new Map();
  for (const p of gruppenMitglieder(index, plugin.gruppe, plugin.id)) gefunden.set(p.id, p);
  for (const id of plugin.ersetzt || []) {
    const ziel = holePlugin(index, id);
    if (ziel && ziel.id !== plugin.id) gefunden.set(ziel.id, ziel);
  }
  return [...gefunden.values()];
}

/**
 * B6 + B7 — welche Alternativen sind in "umgebung" schon adoptiert? Grundlage für den Banner
 * ("ersetzt durch XXX [MAIN]") UND für den abgeschwächten Schalter. Meist 0 oder 1 Treffer;
 * bei mehreren zeigt das eher auf einen Datenfehler (zwei Alternativen parallel gehakt) als auf
 * einen Programmierfehler — die Anzeige soll damit trotzdem umgehen können, daher immer ein Array.
 */
export function deckendeAlternativen(index, plugin, umgebung) {
  return alternativen(index, plugin).filter((p) => istGehakt(p.id, umgebung));
}

/** B2 — Synergie-Partner, unabhängig von Haken. */
export function synergiePartner(index, plugin) {
  return (plugin.synergie || []).map((id) => holePlugin(index, id)).filter(Boolean);
}

/** B3 vorwärts — was DIESES Plugin ergänzt, mit aufgelöstem Ziel und dem +/−-Vergleich. */
export function ergaenztZiele(index, plugin) {
  return (plugin.ergaenzt || [])
    .map((e) => ({ ziel: holePlugin(index, e.id), plus: e.plus || [], minus: e.minus || [] }))
    .filter((e) => e.ziel);
}

/** B3 rückwärts — welche anderen Plugins ergänzen DIESES Plugin (steht bei denen im "ergaenzt"-Feld). */
export function wirdErgaenztVon(index, plugin) {
  const treffer = [];
  for (const p of index.values()) {
    if (p.id === plugin.id) continue;
    const eintrag = (p.ergaenzt || []).find((e) => e.id === plugin.id);
    if (eintrag) treffer.push({ quelle: p, plus: eintrag.plus || [], minus: eintrag.minus || [] });
  }
  return treffer;
}

/**
 * F4 — aktive Konflikte in "umgebung". Geprüft in BEIDE Richtungen: ist ein Konflikt nur auf einer
 * Seite eingetragen (Datenqualität variiert über 500+ Einträge und viele Recherche-Runden hinweg),
 * soll die Warnung trotzdem greifen. Dedupliziert nach ID.
 */
export function aktiveKonflikte(index, plugin, umgebung) {
  const gefunden = new Map();

  for (const id of plugin.konflikte || []) {
    const p = holePlugin(index, id);
    if (p && istGehakt(p.id, umgebung)) gefunden.set(p.id, p);
  }
  for (const p of index.values()) {
    if (p.id === plugin.id || !istGehakt(p.id, umgebung)) continue;
    if ((p.konflikte || []).includes(plugin.id)) gefunden.set(p.id, p);
  }

  return [...gefunden.values()];
}

/** F3 + F5 — Abhängigkeiten, die in "umgebung" NICHT erfüllt sind. */
export function fehlendeAbhaengigkeiten(index, plugin, umgebung) {
  return (plugin.abhaengigkeiten || [])
    .map((id) => holePlugin(index, id))
    .filter((p) => p && !istGehakt(p.id, umgebung));
}

/** F6 — reiner Hinweistext, falls das Plugin selbst Fremdfunktionen mitbringt. Keine Blockade. */
export function bundleHinweis(plugin) {
  return plugin.bundle || '';
}

/** B7 + D3 — ist "umgebung" für dieses Plugin schon durch eine Alternative abgedeckt? */
export function istAbgedeckt(index, plugin, umgebung) {
  return deckendeAlternativen(index, plugin, umgebung).length > 0;
}
