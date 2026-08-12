/**
 * filters.js — Suche, Filter, Sortierung (D1-D8).
 *
 * Der Filterzustand (Suche, Kategorie, Status, Badges, Qualität, Diff-Ansicht) lebt bewusst NUR
 * im Arbeitsspeicher, nicht in state.js — Feature D8 verlangt, dass „↺ Zurücksetzen" ausschließlich
 * Suche/Filter trifft und Daten nie anfasst; die sauberste Garantie dafür ist, dass hier ohnehin
 * nichts Persistiertes existiert. Die einzige Ausnahme ist die Sortierung: die war schon in
 * state.js als Teil des Zustands vorgesehen (wie in reference/qbox-server-planer-v2-1.html) und
 * bleibt darüber persistiert.
 *
 * Alles hier sind reine Funktionen auf einer Plugin-Liste — kein DOM, wie der Rest des Projekts.
 */

import { istGehakt, holePrioritaet, holeSortierung, setzeSortierung } from './state.js';
import { istAbgedeckt } from './relations.js';
import { badgesVon } from './defaults.js';

export const STATUS_OPTIONEN = ['alle', 'main', 'dev', 'nirgends', 'abgedeckt'];
export const QUALITAET_OPTIONEN = ['alle', 'verifiziert', 'teilgeprueft', 'ungeprueft'];
export const SORTIER_OPTIONEN = ['standard', 'name', 'letztes_update', 'prioritaet'];

/** D8 — der Ausgangszustand für „↺ Zurücksetzen". Nie state.js anfassen, nur dieses Objekt neu bilden. */
export function leererFilter() {
  return {
    suche: '',
    kategorie: '',
    status: 'alle',
    qualitaet: 'alle',
    badges: [],       // mehrfach wählbar, UND-Logik (D4)
    nurEssenziell: false,
    nurDiff: false     // D6 — Diff-Ansicht
  };
}

/* ================================ D1 — Volltextsuche ================================ */

function suchtext(plugin) {
  return [plugin.name, plugin.kategorie, plugin.beschreibung, ...(plugin.features || [])]
    .join(' ')
    .toLowerCase();
}

export function passtSuche(plugin, suche) {
  const s = String(suche || '').trim().toLowerCase();
  return !s || suchtext(plugin).includes(s);
}

/* ================================ D2 — Kategorie ================================ */

export function passtKategorie(plugin, kategorie) {
  return !kategorie || plugin.kategorie === kategorie;
}

/* =========================== D3 — Status auf MAIN/DEV/nirgends/abgedeckt =========================== */

export function passtStatus(index, plugin, status) {
  switch (status) {
    case 'main': return istGehakt(plugin.id, 'main');
    case 'dev': return istGehakt(plugin.id, 'dev');
    case 'nirgends': return !istGehakt(plugin.id, 'dev') && !istGehakt(plugin.id, 'main');
    case 'abgedeckt': return istAbgedeckt(index, plugin, 'dev') || istAbgedeckt(index, plugin, 'main');
    default: return true; // 'alle'
  }
}

/* ============================== D4 — Badge-Chips, UND-Logik ============================== */

export function passtBadges(plugin, badgeIds) {
  if (!badgeIds || !badgeIds.length) return true;
  const eigene = new Set(badgesVon(plugin).map((b) => b.id));
  return badgeIds.every((id) => eigene.has(id));
}

/* ============================== D5 — Qualitätsstufe ============================== */

export function passtQualitaet(plugin, qualitaet) {
  return !qualitaet || qualitaet === 'alle' || plugin.qualitaet === qualitaet;
}

/* ========================== D6 — Diff-Ansicht (Deployment-Liste) ========================== */

/** true, wenn DEV und MAIN für dieses Plugin auseinanderlaufen. */
export function istDiff(plugin) {
  return istGehakt(plugin.id, 'dev') !== istGehakt(plugin.id, 'main');
}

/* ================================ Alles kombiniert (D1-D6) ================================ */

export function wendeFilterAn(index, plugins, filter) {
  const f = { ...leererFilter(), ...filter };
  return plugins.filter((p) =>
    passtSuche(p, f.suche) &&
    passtKategorie(p, f.kategorie) &&
    passtStatus(index, p, f.status) &&
    passtQualitaet(p, f.qualitaet) &&
    passtBadges(p, f.badges) &&
    (!f.nurEssenziell || p.essenziell) &&
    (!f.nurDiff || istDiff(p))
  );
}

/* ================================== D7 — Sortierung ================================== */

const PRIORITAETS_RANG = { hoch: 0, mittel: 1, niedrig: 2, '': 3 };

/**
 * "letztes_update" ist im Schema bewusst freier Text (docs/RECHERCHE.md: "aktiv gepflegt oder tot?",
 * kein Datumsfeld) — die Sortierung danach ist deshalb nur eine grobe alphabetische Näherung,
 * kein echtes Datum. Für eine verlässliche Sortierung bräuchte es ein eigenes Datumsfeld; das wäre
 * eine Schema-Änderung und damit außerhalb dieses Schritts.
 */
export function sortiere(plugins, sortierung) {
  const liste = [...plugins];
  switch (sortierung) {
    case 'name':
      return liste.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    case 'letztes_update':
      return liste.sort((a, b) => (b.letztes_update || '').localeCompare(a.letztes_update || '', 'de'));
    case 'prioritaet':
      return liste.sort((a, b) => {
        const diff = PRIORITAETS_RANG[holePrioritaet(a.id)] - PRIORITAETS_RANG[holePrioritaet(b.id)];
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'de');
      });
    default:
      return liste; // 'standard' = Reihenfolge im Katalog, unverändert
  }
}

export const holeAktiveSortierung = () => holeSortierung() || 'standard';
export const setzeAktiveSortierung = (wert) => setzeSortierung(wert);

/* ================================ Zusammen: filtern + sortieren ================================ */

export function gefilterteUndSortierteListe(index, plugins, filter) {
  return sortiere(wendeFilterAn(index, plugins, filter), holeAktiveSortierung());
}
