/**
 * compare.js — Vergleichsmodus (C1-C4).
 *
 * C1: Ein echter Funktionsvergleich entsteht nur innerhalb derselben Gruppe (docs/DECISIONS.md D10)
 *     — zwei grundverschiedene Plugins zu "bewerten" wäre irreführend.
 * C2: "features" ist Freitext. Der Abgleich normalisiert nur auf Kleinschreibung/Leerzeichen,
 *     matcht also textgleiche Formulierungen, nicht sinngleiche ("Fraktions-Tresore" vs.
 *     "Tresore für Fraktionen" zählen als zwei verschiedene Funktionen). Das ist eine
 *     Dateneigenschaft der Freitext-Liste, keine Baustelle dieses Moduls.
 * C3: pro/contra/neutral kommen für BEIDE Seiten direkt aus dem Katalog (docs/RECHERCHE.md §5
 *     verlangt das schon bei der Recherche) — hier wird nur nebeneinandergestellt, nicht bewertet.
 * C4: außerhalb einer gemeinsamen Gruppe gibt es keinen Funktionsvergleich, nur Zweck + Features
 *     je Seite mit einem ausdrücklichen Hinweis.
 */

import { holePlugin } from './relations.js';
import { escapeHtml } from './render.js';

function normalisiert(text) {
  return String(text || '').trim().toLowerCase();
}

/** C2 — gemeinsame und je Seite exklusive Funktionen, textbasiert. */
function funktionsAbgleich(featuresA, featuresB) {
  const normA = new Set((featuresA || []).map(normalisiert));
  const normB = new Set((featuresB || []).map(normalisiert));
  return {
    gemeinsam: (featuresA || []).filter((f) => normB.has(normalisiert(f))),
    nurA: (featuresA || []).filter((f) => !normB.has(normalisiert(f))),
    nurB: (featuresB || []).filter((f) => !normA.has(normalisiert(f)))
  };
}

/**
 * C1/C4 — baut den Vergleich zwischen zwei Katalog-IDs.
 * @returns {{fehler:string}|{modus:'funktionsvergleich'|'zweckvergleich', a:object, b:object, ...}}
 */
export function vergleiche(index, idA, idB) {
  const a = holePlugin(index, idA);
  const b = holePlugin(index, idB);
  if (!a || !b) return { fehler: 'Mindestens eine der beiden IDs ist nicht im Katalog.' };
  if (a.id === b.id) return { fehler: 'Das ist derselbe Eintrag.' };

  const basis = {
    a, b,
    proA: a.pro || [], contraA: a.contra || [], neutralA: a.neutral || [],
    proB: b.pro || [], contraB: b.contra || [], neutralB: b.neutral || []
  };

  const selbeGruppe = !!(a.gruppe && a.gruppe === b.gruppe);
  if (selbeGruppe) {
    return { modus: 'funktionsvergleich', gruppe: a.gruppe, ...basis, ...funktionsAbgleich(a.features, b.features) };
  }

  return {
    modus: 'zweckvergleich',
    hinweis: 'Unterschiedliche Funktionsgruppen — kein direkter Funktionsvergleich, sondern andere Use-Cases: Zweck und Funktionen je Seite.',
    ...basis
  };
}

/* ================================== Darstellung ================================== */

function abwaegungHTML(pro, contra, neutral) {
  const teil = (klasse, eintraege) => eintraege.length
    ? `<ul class="vergleich-${klasse}">${eintraege.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>` : '';
  return teil('pro', pro) + teil('contra', contra) + teil('neutral', neutral); // grün / rot / orange, Farben in style.css
}

function featureSpalteHTML(titel, eintraege) {
  if (!eintraege.length) return '';
  return `<div><strong>${escapeHtml(titel)}</strong><ul>${eintraege.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`;
}

/** C2+C3 — Ansicht für zwei Plugins derselben Gruppe. */
function funktionsvergleichHTML(v) {
  return `
    <div class="vergleich-funktionen">
      ${featureSpalteHTML('Beide können', v.gemeinsam)}
      ${featureSpalteHTML(`Nur ${v.a.name}`, v.nurA)}
      ${featureSpalteHTML(`Nur ${v.b.name}`, v.nurB)}
    </div>`;
}

/** C4 — Ansicht für grundverschiedene Plugins: Zweck + Features je Seite, kein Diff. */
function zweckvergleichHTML(v) {
  const seite = (p) => `<div>
    <h4>${escapeHtml(p.name)}</h4>
    <p>${escapeHtml(p.beschreibung)}</p>
    ${featureSpalteHTML('Features', p.features || [])}
  </div>`;
  return `<p class="vergleich-hinweis">ℹ️ ${escapeHtml(v.hinweis)}</p>
    <div class="vergleich-zweck">${seite(v.a)}${seite(v.b)}</div>`;
}

/** Baut den kompletten Vergleichsblock als HTML-String — inklusive C3 (pro/contra für beide). */
export function vergleichHTML(v) {
  if (v.fehler) return `<p class="vergleich-fehler">${escapeHtml(v.fehler)}</p>`;

  const kopf = `<div class="vergleich-kopf"><h3>${escapeHtml(v.a.name)}</h3><span>vs.</span><h3>${escapeHtml(v.b.name)}</h3></div>`;
  const mitte = v.modus === 'funktionsvergleich' ? funktionsvergleichHTML(v) : zweckvergleichHTML(v);
  const abwaegung = `
    <div class="vergleich-abwaegung">
      <div>${abwaegungHTML(v.proA, v.contraA, v.neutralA)}</div>
      <div>${abwaegungHTML(v.proB, v.contraB, v.neutralB)}</div>
    </div>`;

  return `<section class="vergleich">${kopf}${mitte}${abwaegung}</section>`;
}
