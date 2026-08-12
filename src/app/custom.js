/**
 * custom.js — eigene Plugins anlegen (Feature H2).
 *
 * Eigene Einträge sind MEINE Daten, keine Katalogdaten: sie liegen im Zustand (state.js),
 * werden mit exportiert und mit gesichert (Feature E7) und überstehen deshalb auch ein
 * "Import-Differenz verwerfen". Der Katalog aus data/catalog/ bleibt davon unberührt —
 * ein eigener Eintrag landet nie in einer Recherche-Runde.
 */

import { holeEigene, fuegeEigenesHinzu, loescheEigenes } from './state.js';
import { mitStandard } from './defaults.js';

/** Kennzeichen aller selbst angelegten Einträge — daran erkennt die Oberfläche sie wieder. */
export const EIGEN_PRAEFIX = 'custom_';

export const istEigenes = (plugin) => String(plugin?.id || '').startsWith(EIGEN_PRAEFIX);

/**
 * Legt einen eigenen Eintrag an.
 * Bewusst nur zwei Pflichtangaben (Name, Kategorie) — das Formular soll schnell gehen.
 * Alles Weitere füllt mitStandard(), damit ein eigener Eintrag im Rendern nie anders behandelt
 * werden muss als ein Katalogeintrag (CLAUDE.md §4: Defaults gelten für JEDE Quelle).
 *
 * @returns {{ok:false, meldung:string} | {ok:true, plugin:object}}
 */
export function legeEigenesAn(felder, kategorienIds = []) {
  const name = String(felder.name || '').trim();
  if (!name) return { ok: false, meldung: 'Ein Name ist nötig.' };

  const kategorie = String(felder.kategorie || '').trim();
  if (kategorienIds.length && !kategorienIds.includes(kategorie)) {
    return { ok: false, meldung: `Unbekannte Kategorie "${kategorie}".` };
  }

  const link = String(felder.link || '').trim();
  if (link && !/^https?:\/\//.test(link)) {
    return { ok: false, meldung: 'Der Link muss mit http:// oder https:// beginnen.' };
  }

  const betrag = Number(felder.preisBetrag);
  const preis = Number.isFinite(betrag) && betrag > 0
    ? { betrag, waehrung: felder.preisWaehrung || 'EUR', typ: felder.preisTyp === 'abo' ? 'abo' : 'einmalig' }
    : null;

  const plugin = mitStandard({
    id: EIGEN_PRAEFIX + Date.now(),
    name,
    ressource: String(felder.ressource || '').trim(),
    kategorie,
    gruppe: String(felder.gruppe || '').trim() || null,
    beschreibung: String(felder.beschreibung || '').trim() || 'Eigener Eintrag.',
    link,
    link_status: 'ungeprueft',
    framework: felder.framework || 'standalone',
    lizenz: felder.lizenz || 'open_source',
    preis,
    // Ein selbst angelegter Eintrag ist per Definition nicht nach docs/RECHERCHE.md geprüft.
    qualitaet: 'ungeprueft',
    geprueft_am: ''
  });

  fuegeEigenesHinzu(plugin);
  return { ok: true, plugin };
}

export function entferneEigenes(id) {
  return loescheEigenes(id);
}

/**
 * Legt die eigenen Einträge über den Katalog. Läuft NACH der Import-Differenz —
 * bei gleicher ID gewinnt mein eigener Eintrag, denn er gehört mir.
 */
export function mitEigenen(plugins) {
  const eigene = holeEigene();
  if (!eigene.length) return plugins;

  const nachId = new Map(plugins.map((p) => [p.id, p]));
  for (const p of eigene) nachId.set(p.id, mitStandard(p));
  return [...nachId.values()];
}
