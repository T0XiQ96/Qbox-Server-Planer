/**
 * compare.js — Vergleichsmodus (C1-C5, C10).
 *
 * C1: Ein echter Funktionsvergleich entsteht nur innerhalb derselben Gruppe (docs/DECISIONS.md D10)
 *     — zwei grundverschiedene Plugins zu "bewerten" wäre irreführend. Welche Beziehung stattdessen
 *     besteht, benennt beziehungImVergleich() ausdrücklich (D25).
 * C2: "features" ist Freitext. Der Abgleich normalisiert nur auf Kleinschreibung/Leerzeichen,
 *     matcht also textgleiche Formulierungen, nicht sinngleiche ("Fraktions-Tresore" vs.
 *     "Tresore für Fraktionen" zählen als zwei verschiedene Funktionen). Das ist eine
 *     Dateneigenschaft der Freitext-Liste, keine Baustelle dieses Moduls.
 * C3: pro/contra/neutral kommen für BEIDE Seiten direkt aus dem Katalog (docs/RECHERCHE.md §5
 *     verlangt das schon bei der Recherche) — hier wird nur nebeneinandergestellt, nicht bewertet.
 * C4: außerhalb einer gemeinsamen Gruppe kein Funktionsvergleich, sondern die benannte Beziehung.
 *
 * Der frühere reine ZWEIervergleich (zwei Auswahlfelder, eigenes Fenster) ist entfallen: er war
 * ein zweiter Weg zur selben Frage, der weniger konnte als vergleicheMehrere() mit zwei Einträgen
 * — dort stehen zusätzlich die vollständigen Karten. C1-C4 sind damit vollständig abgedeckt.
 */

import { holePlugin } from './relations.js';
import { escapeHtml } from './render.js';
import { istGehakt } from './state.js';
import { WAEHRUNG_ZEICHEN } from '../lib/hilfen.js';

function normalisiert(text) {
  return String(text || '').trim().toLowerCase();
}

/* ========================= Vergleich über beliebig viele ========================= */

/**
 * Der Zweiervergleich oben beantwortet „A oder B?". Sobald eine Funktionsgruppe drei oder mehr
 * Anbieter hat — im Katalog der Normalfall, `hud` und `housing` haben je fünf — ist das die
 * falsche Frage: man will alle nebeneinander sehen, statt sich durch Paare zu klicken.
 *
 * Bewusst NICHT auf eine `gruppe` festgelegt, sondern auf eine beliebige ID-Liste. Der
 * Gruppenvergleich ist damit nur der häufigste Aufrufer, nicht die einzige Möglichkeit.
 */
export function vergleicheMehrere(index, ids) {
  const teilnehmer = [...new Set(ids)].map((id) => holePlugin(index, id)).filter(Boolean);
  if (teilnehmer.length < 2) {
    return { fehler: 'Für einen Vergleich braucht es mindestens zwei Einträge aus dem Katalog.' };
  }

  // Wie oft kommt eine Funktion vor? Daraus fällt beides ab: was alle können und was nur einer kann.
  const zaehler = new Map();
  for (const p of teilnehmer) {
    for (const f of new Set((p.features || []).map(normalisiert))) {
      zaehler.set(f, (zaehler.get(f) || 0) + 1);
    }
  }

  const gemeinsam = (teilnehmer[0].features || [])
    .filter((f) => zaehler.get(normalisiert(f)) === teilnehmer.length);

  const exklusiv = new Map();
  for (const p of teilnehmer) {
    exklusiv.set(p.id, (p.features || []).filter((f) => zaehler.get(normalisiert(f)) === 1));
  }

  const gruppen = new Set(teilnehmer.map((p) => p.gruppe).filter(Boolean));
  const selbeGruppe = gruppen.size === 1 && teilnehmer.every((p) => p.gruppe);

  return {
    teilnehmer,
    gemeinsam,
    exklusiv,
    selbeGruppe,
    gruppe: selbeGruppe ? teilnehmer[0].gruppe : null,
    beziehung: beziehungImVergleich(teilnehmer)
  };
}

/**
 * Welche Beziehung besteht zwischen den Verglichenen — und was heißt sie für den Server?
 *
 * Diese Frage wurde vorher nicht gestellt: alles, was nicht dieselbe `gruppe` teilte, bekam den
 * Satz „kein besser oder schlechter, sondern verschiedene Zwecke". Bei einer ABHÄNGIGKEIT ist das
 * grob irreführend — es liest sich wie ein Entweder-oder, dabei müssen zwingend beide laufen.
 * Genau dieser Fall entsteht jetzt ständig, weil der Prüfbericht die fehlende Abhängigkeit
 * direkt in den Vergleich schickt.
 *
 * Erste Übereinstimmung gewinnt. Die Reihenfolge ist Absicht: der Konflikt ist die schärfste
 * Aussage und muss auch dann oben stehen, wenn die beiden zufällig dieselbe Gruppe teilen.
 */
export function beziehungImVergleich(teilnehmer) {
  const paare = [];
  for (const a of teilnehmer) {
    for (const b of teilnehmer) if (a.id !== b.id) paare.push([a, b]);
  }

  for (const [a, b] of paare) {
    if ((a.konflikte || []).includes(b.id)) {
      return { art: 'konflikt', text: `${a.name} und ${b.name} vertragen sich laut Katalog nicht — höchstens eines davon gehört auf den Server.` };
    }
  }

  const gruppen = new Set(teilnehmer.map((p) => p.gruppe).filter(Boolean));
  if (gruppen.size === 1 && teilnehmer.every((p) => p.gruppe)) {
    return {
      art: 'alternativen',
      text: `Alle ${teilnehmer.length} bedienen dieselbe Funktionsgruppe „${teilnehmer[0].gruppe}" — davon gehört genau eines auf den Server.`
    };
  }

  for (const [a, b] of paare) {
    if (a.archiviert && a.archiviert.nachfolger === b.id) {
      return { art: 'nachfolge', text: `${a.name} ist archiviert, ${b.name} ist der im Katalog genannte Nachfolger — hier steht der Umstieg zum Nachlesen.` };
    }
  }

  for (const [a, b] of paare) {
    if ((a.abhaengigkeiten || []).includes(b.id)) {
      return { art: 'abhaengigkeit', text: `${a.name} braucht ${b.name} — beide gehören auf den Server, das ist kein Entweder-oder.` };
    }
  }

  for (const [a, b] of paare) {
    if ((a.synergie || []).includes(b.id) || (a.ergaenzt || []).some((e) => e && e.id === b.id)) {
      return { art: 'synergie', text: `${a.name} und ${b.name} ergänzen sich — beide zusammen sind sinnvoll, es ist keine Auswahl zwischen ihnen.` };
    }
  }

  return { art: 'verschieden', text: 'Unterschiedliche Funktionsgruppen — kein besser oder schlechter, sondern verschiedene Zwecke nebeneinander.' };
}

/* -------------------------------- Darstellung -------------------------------- */

const VERGLEICH_FRAMEWORK = {
  qbox_nativ: '✅ Qbox nativ', qbcore_bridge: '🔁 QBCore-Bridge',
  standalone: '🌐 Standalone', qbcore_only: '⛔ nur QBCore'
};
const VERGLEICH_LIZENZ = { open_source: '🔓 Open Source', escrow: '🔒 Escrow' };
const VERGLEICH_QUALITAET = { verifiziert: '✅ verifiziert', teilgeprueft: '🟡 teilgeprüft', ungeprueft: '⚪ ungeprüft' };

function vergleichPreisText(p) {
  if (!p.preis) return '🆓 kostenlos';
  const zeichen = WAEHRUNG_ZEICHEN[p.preis.waehrung] || p.preis.waehrung + ' ';
  return p.preis.typ === 'abo' ? `${zeichen}${p.preis.betrag}/Monat` : `${zeichen}${p.preis.betrag} einmalig`;
}

/** Wo steht dieses Plugin schon? Beantwortet beim Vergleichen die eigentliche Frage: „was habe ich denn?" */
function vergleichStatusText(p) {
  const teile = [];
  if (istGehakt(p.id, 'dev')) teile.push('🧪 DEV');
  if (istGehakt(p.id, 'main')) teile.push('✅ MAIN');
  return teile.length ? teile.join(' · ') : '—';
}

function punkteHTML(klasse, eintraege) {
  if (!eintraege || !eintraege.length) return '<span class="vergleich-leer">—</span>';
  return `<ul class="${klasse}">${eintraege.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
}

function zeileHTML(titel, teilnehmer, zelle) {
  return `<tr><th scope="row">${escapeHtml(titel)}</th>${teilnehmer.map((p) => `<td>${zelle(p)}</td>`).join('')}</tr>`;
}

/**
 * Tabelle statt Nebeneinander: bei mehr als zwei Spalten ist die Zeile das, was man vergleicht
 * („wer ist Qbox-nativ?"), nicht die Karte. Breite Tabellen scrollen waagerecht (style.css).
 */
export function mehrfachVergleichHTML(v) {
  if (v.fehler) return `<p class="vergleich-fehler">${escapeHtml(v.fehler)}</p>`;

  const t = v.teilnehmer;
  const b = v.beziehung || beziehungImVergleich(t);
  const hinweis = `<p class="vergleich-hinweis vergleich-${b.art}">ℹ️ ${escapeHtml(b.text)}</p>`;

  const gemeinsam = v.gemeinsam.length
    ? `<div class="vergleich-gemeinsam"><strong>Alle können:</strong>${punkteHTML('', v.gemeinsam)}</div>` : '';

  // Nur bei echten Alternativen ist die Zeile-für-Zeile-Gegenüberstellung die eigentliche Frage.
  // Bei einer Abhängigkeit will man die Karten lesen, nicht „Dafür/Dagegen" zweier Dinge
  // vergleichen, die beide laufen müssen — dann startet die Tabelle eingeklappt.
  const offen = b.art === 'alternativen' ? ' open' : '';

  const tabelle = `
    <details class="vergleich-tabelle-block"${offen}>
      <summary>Unterschiede im Einzelnen</summary>
      <div class="vergleich-tabelle-huelle">
      <table class="vergleich-tabelle">
        <thead><tr><th></th>${t.map((p) => `<th scope="col">${escapeHtml(p.name)}</th>`).join('')}</tr></thead>
        <tbody>
          ${zeileHTML('Gesetzt auf', t, (p) => escapeHtml(vergleichStatusText(p)))}
          ${zeileHTML('Framework', t, (p) => escapeHtml(VERGLEICH_FRAMEWORK[p.framework] || p.framework))}
          ${zeileHTML('Lizenz', t, (p) => escapeHtml(VERGLEICH_LIZENZ[p.lizenz] || p.lizenz))}
          ${zeileHTML('Preis', t, (p) => escapeHtml(vergleichPreisText(p)))}
          ${zeileHTML('Prüfstand', t, (p) => escapeHtml(VERGLEICH_QUALITAET[p.qualitaet] || p.qualitaet))}
          ${zeileHTML('Letztes Update', t, (p) => escapeHtml(p.letztes_update || '—'))}
          ${zeileHTML('Zustand', t, (p) => p.archiviert ? '🪦 archiviert' : '—')}
          ${zeileHTML('Nur hier', t, (p) => punkteHTML('vergleich-nur', v.exklusiv.get(p.id)))}
          ${zeileHTML('Dafür', t, (p) => punkteHTML('vergleich-pro', p.pro))}
          ${zeileHTML('Dagegen', t, (p) => punkteHTML('vergleich-contra', p.contra))}
          ${zeileHTML('Zu beachten', t, (p) => punkteHTML('vergleich-neutral', p.neutral))}
        </tbody>
      </table>
      </div>
    </details>`;

  return `<section class="vergleich">${hinweis}${gemeinsam}${tabelle}</section>`;
}
