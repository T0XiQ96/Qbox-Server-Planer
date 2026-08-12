/**
 * mapping.mjs — Feldabbildung v2.1/kimi-Rohformat → Katalogschema (Phase 2, D17/D18).
 *
 * Beide Altbestand-Quellen (v2.1-RAW-Array, kimi-Runden) benutzen dasselbe Rohvokabular
 * (cat, ess, badges, ver, updated, deps, conflicts, synergy, extends, compat, archived,
 * bundle, tip, pros, cons, neutral, desc, price, group). Ein gemeinsamer Mapper reicht.
 */

/** Wandelt eine id in das erlaubte Katalogformat (kleingeschrieben) um. */
export function normId(id) {
  return String(id).toLowerCase();
}

function mapPrice(price) {
  if (!price) return null;
  const waehrung = price.c === '€' ? 'EUR' : price.c === '£' ? 'GBP' : 'USD';
  if (price.one != null) return { betrag: price.one, waehrung, typ: 'einmalig' };
  if (price.mon != null) return { betrag: price.mon, waehrung, typ: 'abo' };
  return null;
}

function mapFramework(badges) {
  if (badges.includes('qbox')) return 'qbox_nativ';
  if (badges.includes('bridge')) return 'qbcore_bridge';
  if (badges.includes('stand')) return 'standalone';
  return 'standalone';
}

function mapLizenz(badges) {
  return badges.includes('escrow') ? 'escrow' : 'open_source';
}

function textliste(arr) {
  if (!Array.isArray(arr)) return [];
  const gefiltert = arr.filter(t => t && t !== '–' && t !== '-');
  return gefiltert;
}

function stackHinweis(raw) {
  const name = raw.name || '';
  const id = raw.id || '';
  if (/legacy/i.test(name) || /\(via Bridge\)/i.test(name) || /^qb_/.test(id)) {
    return 'Alter QBCore-Stack — im Rahmen der Altbestand-Konvertierung (Phase 2) übernommen, nicht einzeln nach docs/RECHERCHE.md nachrecherchiert.';
  }
  return null;
}

/**
 * Bildet einen zusammengeführten Rohdatensatz (v2.1 und/oder kimi, bereits per D17
 * feldweise gemergt) auf ein Katalog-Plugin-Objekt ab.
 * @param {object} raw
 * @returns {object}
 */
export function mapEntry(raw) {
  const badges = Array.isArray(raw.badges) ? raw.badges : [];
  const id = normId(raw.id);

  const plugin = {
    id,
    name: raw.name,
    kategorie: raw.cat,
    essenziell: !!raw.ess,
    beschreibung: raw.desc,
    link: raw.link,
    link_status: 'ungeprueft',
    version: raw.ver && raw.ver !== '–' ? raw.ver : '',
    letztes_update: raw.updated || '',
    lizenz: mapLizenz(badges),
    framework: mapFramework(badges),
    qualitaet: 'ungeprueft'
  };

  if (raw.group) plugin.gruppe = String(raw.group).toLowerCase();
  else plugin.gruppe = null;

  const preis = mapPrice(raw.price);
  if (preis) plugin.preis = preis;

  const deps = (raw.deps || []).map(normId);
  if (deps.length) plugin.abhaengigkeiten = deps;

  const konflikte = (raw.conflicts || []).map(normId);
  if (konflikte.length) plugin.konflikte = konflikte;

  const synergie = (raw.synergy || []).map(normId);
  if (synergie.length) plugin.synergie = synergie;

  if (raw.bundle) plugin.bundle = raw.bundle;

  const ergaenzt = (raw.extends || []).map(e => ({
    id: normId(e.id),
    plus: textliste(e.adds),
    minus: textliste(e.costs)
  }));
  if (ergaenzt.length) plugin.ergaenzt = ergaenzt;

  if (raw.compat && raw.compat.text && raw.compat.level) {
    plugin.kompat_warnung = { text: raw.compat.text, sicherheit: raw.compat.level };
  }

  if (raw.archived) {
    const text = typeof raw.archived === 'string' ? raw.archived : raw.archived.text;
    plugin.archiviert = { text, nachfolger: '' };
  }

  const hinweis = stackHinweis(raw);
  if (hinweis) plugin.stack_hinweis = hinweis;

  const pro = textliste(raw.pros);
  if (pro.length) plugin.pro = pro;
  const contra = textliste(raw.cons);
  if (contra.length) plugin.contra = contra;
  const neutral = textliste(raw.neutral);
  if (neutral.length) plugin.neutral = neutral;

  if (raw.tip) plugin.tipp = raw.tip;

  return plugin;
}
