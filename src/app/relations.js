/**
 * relations.js — reine Abfragen über die Beziehungen zwischen Plugins.
 *
 * Baut nur Antworten aus Katalog + Zustand, formatiert aber nichts als HTML — das macht render.js.
 * Vorlage: reference/qbox-server-planer-v2-1.html (groupMembers, adopted, coveredBy, Zeile 885-887;
 * Konflikt-/Abhängigkeits-Check aus toggleSrv, Zeile 959-975).
 *
 * RÜCKWÄRTS-INDIZES (seit Schritt 2a): Drei Abfragen hier sind ihrer Natur nach rückwärts gerichtet
 * — "wer hat mich in seiner Gruppe", "wer ergänzt mich", "wer nennt mich als Konflikt". Naiv
 * beantwortet kostet jede davon einen Durchlauf über den ganzen Katalog. Da render.js sie für JEDE
 * sichtbare Karte aufruft (und bannerHTML/istAbgedeckt gleich mehrfach), wuchs der Aufwand
 * quadratisch: bei 400 Plugins rund eine Million Durchläufe je Neuzeichnen, bei den angepeilten
 * 1000 das Sechsfache. Deshalb werden die Rückrichtungen einmal je Katalogstand vorberechnet.
 *
 * Der Zwischenspeicher hängt an der Index-Map selbst (WeakMap). Das hat zwei Vorteile: die
 * Signatur aller Funktionen bleibt unverändert, und ein neuer Katalogstand erzeugt in
 * baueIndex() zwangsläufig eine neue Map — der alte Eintrag verfällt damit von allein. Haken,
 * Notizen und Prioritäten ändern die Beziehungsstruktur nicht und dürfen den Speicher deshalb
 * auch nicht verwerfen.
 */

import { istGehakt } from './state.js';

/** Einmal pro Katalogstand aufrufen, Ergebnis überall herumreichen — nicht bei jeder Abfrage neu bauen. */
export function baueIndex(plugins) {
  return new Map(plugins.map((p) => [p.id, p]));
}

/* ========================= Vorberechnete Rückrichtungen ========================= */

const beziehungsSpeicher = new WeakMap();

/**
 * Baut (und merkt sich) die drei Rückwärts-Zuordnungen zu einem Index.
 * Ein Durchlauf über den Katalog statt einem Durchlauf pro Abfrage.
 */
function beziehungsIndizes(index) {
  const gemerkt = beziehungsSpeicher.get(index);
  if (gemerkt) return gemerkt;

  const neu = {
    nachGruppe: new Map(),     // gruppe -> Plugin[]
    ergaenztVon: new Map(),    // id -> {quelle, plus, minus}[]
    konfliktGegen: new Map(),  // id -> Plugin[] (die DIESE id in ihren konflikten nennen)
    synergieVon: new Map()     // id -> Plugin[] (die DIESE id als Synergie nennen)
  };

  for (const p of index.values()) {
    if (p.gruppe) {
      if (!neu.nachGruppe.has(p.gruppe)) neu.nachGruppe.set(p.gruppe, []);
      neu.nachGruppe.get(p.gruppe).push(p);
    }
    for (const e of p.ergaenzt || []) {
      if (!e || !e.id) continue;
      if (!neu.ergaenztVon.has(e.id)) neu.ergaenztVon.set(e.id, []);
      neu.ergaenztVon.get(e.id).push({ quelle: p, plus: e.plus || [], minus: e.minus || [] });
    }
    for (const id of p.konflikte || []) {
      if (!neu.konfliktGegen.has(id)) neu.konfliktGegen.set(id, []);
      neu.konfliktGegen.get(id).push(p);
    }
    for (const id of p.synergie || []) {
      if (!neu.synergieVon.has(id)) neu.synergieVon.set(id, []);
      neu.synergieVon.get(id).push(p);
    }
  }

  beziehungsSpeicher.set(index, neu);
  return neu;
}

/** Alle belegten Funktionsgruppen mit mindestens zwei Mitgliedern — Grundlage für den Gruppenvergleich. */
export function alleGruppen(index) {
  const treffer = [];
  for (const [gruppe, mitglieder] of beziehungsIndizes(index).nachGruppe) {
    if (mitglieder.length >= 2) treffer.push({ gruppe, mitglieder });
  }
  return treffer.sort((a, b) => a.gruppe.localeCompare(b.gruppe, 'de'));
}

/* ================================ Grundabfragen ================================ */

export function holePlugin(index, id) {
  return index.get(id) || null;
}

export function gruppenMitglieder(index, gruppe, ausgenommenId = null) {
  if (!gruppe) return [];
  const alle = beziehungsIndizes(index).nachGruppe.get(gruppe) || [];
  return ausgenommenId ? alle.filter((p) => p.id !== ausgenommenId) : [...alle];
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

/**
 * B2 rückwärts — wer nennt DIESES Plugin als Synergie? Eine Synergie ist inhaltlich beidseitig,
 * im Katalog steht sie aber nur bei einem der beiden. Für den Synergie-Zähler zählt beides,
 * sonst hinge der Vorschlag davon ab, welche Seite die Recherche zufällig gepflegt hat.
 */
export function synergieRueckwaerts(index, plugin) {
  return beziehungsIndizes(index).synergieVon.get(plugin.id) || [];
}

/** B3 vorwärts — was DIESES Plugin ergänzt, mit aufgelöstem Ziel und dem +/−-Vergleich. */
export function ergaenztZiele(index, plugin) {
  return (plugin.ergaenzt || [])
    .map((e) => ({ ziel: holePlugin(index, e.id), plus: e.plus || [], minus: e.minus || [] }))
    .filter((e) => e.ziel);
}

/** B3 rückwärts — welche anderen Plugins ergänzen DIESES Plugin (steht bei denen im "ergaenzt"-Feld). */
export function wirdErgaenztVon(index, plugin) {
  return beziehungsIndizes(index).ergaenztVon.get(plugin.id) || [];
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
  for (const p of beziehungsIndizes(index).konfliktGegen.get(plugin.id) || []) {
    if (p.id !== plugin.id && istGehakt(p.id, umgebung)) gefunden.set(p.id, p);
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

/** Alle in einer Umgebung gehakten Plugins — Ausgangspunkt jedes Prüfberichts. */
export function gehakteListe(index, umgebung) {
  const treffer = [];
  for (const p of index.values()) if (istGehakt(p.id, umgebung)) treffer.push(p);
  return treffer;
}
