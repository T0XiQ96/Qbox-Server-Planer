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
    gruppe: '',
    status: 'alle',
    qualitaet: 'alle',
    badges: [],        // mehrfach wählbar, Facetten-Logik (D4)
    nurEssenziell: false,
    nurDiff: false,    // D6 — Diff-Ansicht
    nurWarnungen: false,
    // Keine Filtereinstellung, sondern das Nachschlagewerk dazu: main.js legt vor jedem Zeichnen
    // die IDs aus dem aktuellen Prüfbericht hier ab. So bleibt dieses Modul frei von Zustand und
    // "↺ Zurücksetzen" räumt es zusammen mit dem Filter selbst weg.
    warnIds: null
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

/* ============================ D2b — Funktionsgruppe ============================ */

/**
 * Die Kategorie sagt, WORUM es geht („Fahrzeuge"), die Gruppe sagt, WOFÜR es einen Ersatz gibt
 * („garage" — davon gehört genau eines auf den Server, D10). Das war bisher nur im Vergleich
 * erreichbar, obwohl „zeig mir alle Garagen-Systeme" genauso eine Frage an die Liste ist.
 *
 * OHNE_GRUPPE ist kein Gruppenname, sondern die Gegenfrage: „was steht für sich allein, ohne
 * Alternative im Katalog?". Als Sonderwert im selben Auswahlfeld statt als zweiter Schalter.
 * Das Ausrufezeichen kann nie mit einer echten Gruppe kollidieren: das Schema lässt für `gruppe`
 * nur `^[a-z0-9][a-z0-9_-]*$` zu.
 */
export const OHNE_GRUPPE = '!ohne';

export function passtGruppe(plugin, gruppe) {
  if (!gruppe) return true;
  if (gruppe === OHNE_GRUPPE) return !plugin.gruppe;
  return plugin.gruppe === gruppe;
}

/**
 * Alle im Katalog tatsächlich vorkommenden Gruppen mit ihrer Mitgliederzahl — Grundlage des
 * Auswahlfelds. Bewusst aus den Daten abgeleitet und nicht als Liste gepflegt: eine neue Gruppe
 * entsteht in jeder Recherche-Runde und darf niemals eine Änderung in `src/` erfordern
 * (CLAUDE.md §2.1).
 */
export function gruppenMitAnzahl(plugins) {
  const zaehler = new Map();
  for (const p of plugins) {
    if (p.gruppe) zaehler.set(p.gruppe, (zaehler.get(p.gruppe) || 0) + 1);
  }
  return [...zaehler.entries()]
    .map(([id, anzahl]) => ({ id, anzahl }))
    .sort((a, b) => a.id.localeCompare(b.id, 'de'));
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

/* ============================== D4 — Badge-Chips, Facetten-Logik ============================== */

/**
 * Die Chips zerfallen in drei Facetten. Ein Plugin hat aus jeder Facette genau einen Wert
 * (badgesVon() leitet sie aus framework/lizenz/preis ab) — deshalb kann eine reine UND-Logik über
 * alle Chips hinweg gar nicht funktionieren: „Qbox nativ" UND „QBCore-Bridge" ist zwangsläufig leer.
 *
 * Richtig ist die übliche Facetten-Logik:
 *   INNERHALB einer Facette ODER  — „zeig mir Qbox-native ODER Bridge-Plugins"
 *   ZWISCHEN den Facetten UND     — „…aber davon nur die kostenlosen"
 *
 * Eine Facette, aus der nichts gewählt ist, schränkt nicht ein.
 */
export const BADGE_FACETTEN = {
  framework: ['qbox', 'bridge', 'stand', 'qbonly'],
  lizenz: ['open', 'escrow'],
  preis: ['premium', 'free']
};

const FACETTEN_LISTE = Object.values(BADGE_FACETTEN);
const BEKANNTE_BADGES = new Set(FACETTEN_LISTE.flat());

export function passtBadges(plugin, badgeIds) {
  if (!badgeIds || !badgeIds.length) return true;
  const eigene = new Set(badgesVon(plugin).map((b) => b.id));

  for (const facette of FACETTEN_LISTE) {
    const gewaehlt = facette.filter((id) => badgeIds.includes(id));
    if (!gewaehlt.length) continue;                          // Facette ungenutzt -> keine Einschränkung
    if (!gewaehlt.some((id) => eigene.has(id))) return false; // innerhalb: ODER
  }

  // Ein Chip, der zu keiner Facette gehört, kann nur aus einer künftigen Erweiterung stammen.
  // Für den bleibt es beim strengen UND — das ist die sichere Annahme, solange niemand
  // ausdrücklich entschieden hat, wohin er gehört.
  return badgeIds.filter((id) => !BEKANNTE_BADGES.has(id)).every((id) => eigene.has(id));
}

/* ===================== Filter „nur mit Warnung" (Prüfbericht) ===================== */

/**
 * `warnIds` kommt aus warnings.js und wird von main.js vor jedem Zeichnen gesetzt. Fehlt es,
 * greift der Filter bewusst hart (leere Liste) statt still alles durchzulassen — sonst sähe ein
 * Fehler in der Verdrahtung wie „keine Probleme vorhanden" aus.
 */
export function passtWarnung(plugin, nurWarnungen, warnIdListe) {
  if (!nurWarnungen) return true;
  return !!warnIdListe && warnIdListe.has(plugin.id);
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
    passtGruppe(p, f.gruppe) &&
    passtStatus(index, p, f.status) &&
    passtQualitaet(p, f.qualitaet) &&
    passtBadges(p, f.badges) &&
    passtWarnung(p, f.nurWarnungen, f.warnIds) &&
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
