/**
 * render.js — Schritt 1b+1c: die vollständige Plugin-Karte (G1-G11, A1/A3-A5, B1-B7).
 *
 * Alles hier sind reine HTML-String-Bausteine, ohne DOM-API und ohne Event-Listener — deshalb
 * in Node testbar wie der Rest des Projekts. Checkbox/Notiz/Priorität tragen data-Attribute, an
 * denen später EIN zentraler Event-Delegierer (kommt mit main.js, sobald es eine echte Seite zum
 * Testen im Browser gibt) andockt. Die Sprung-Navigation (B5) ist dagegen schon vollständig: ein
 * echter <a href="#karte-id">-Anker springt auch ganz ohne JavaScript. Nur das kurze Aufblinken
 * danach braucht später einen kleinen Listener.
 *
 * Jeder Katalog-Text läuft durch escapeHtml(), bevor er in einen Template-String wandert. Das ist
 * hier keine Vorsichtsmaßnahme fürs Prinzip: importierte Katalog-Updates (E2/E3) und später das
 * „Eigenes Plugin"-Formular (H2) bringen echte externe Strings in genau diese Felder.
 */

import { WAEHRUNG_ZEICHEN } from '../lib/hilfen.js';
import { badgesVon } from './defaults.js';
import { istGehakt, hakenSeit, holeNotiz, holePrioritaet } from './state.js';
import { alternativen, deckendeAlternativen, istAbgedeckt, synergiePartner, ergaenztZiele, wirdErgaenztVon } from './relations.js';

/* ============================== Grundbausteine ============================== */

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (z) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[z]));
}

/** ISO-Datum (JJJJ-MM-TT, so liegt es im Katalog) als TT.MM.JJJJ für die Anzeige. */
export function datumDe(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

function span(klasse, inhalt, titel) {
  const t = titel ? ` title="${escapeHtml(titel)}"` : '';
  return `<span class="${klasse}"${t}>${inhalt}</span>`;
}

function liste(klasse, eintraege) {
  if (!eintraege || !eintraege.length) return '';
  return `<ul class="${klasse}">${eintraege.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
}

/* ================================ G2 — Badges ================================ */

export function badgesHTML(plugin) {
  return badgesVon(plugin).map((b) => span(`badge badge-${b.id}`, escapeHtml(b.text))).join('');
}

/* ============================ G3 — Kompat-Tooltip ============================ */

export function kompatHTML(plugin) {
  const k = plugin.kompat_warnung;
  if (!k) return '';
  const grad = k.sicherheit === 'bestaetigt' ? 'BESTÄTIGT' : 'VERMUTUNG';
  return span('badge badge-kompat', '⚠️ Kompatibilität', `${grad}: ${k.text}`);
}

/* ========================== G4 — Archiviert-Markierung ========================== */

export function archivHTML(plugin) {
  const a = plugin.archiviert;
  if (!a) return '';
  const nachfolger = a.nachfolger ? ` Nachfolger: ${a.nachfolger}.` : '';
  return span('badge badge-archiviert', '🪦 Archiviert', `${a.text}${nachfolger}`);
  // Der Nachfolger wird als Text im Tooltip genannt. Anklickbar-zum-Eintrag-springen ist Feature B5
  // und kommt zusammen mit den übrigen Sprüngen in Schritt 1c — dort existiert die Karte des Ziels
  // erst im gerenderten DOM, auf das gesprungen werden könnte.
}

/* ========================= G5 — Alt-Stack-Hinweis ========================= */

export function altStackHTML(plugin) {
  if (!plugin.stack_hinweis) return '';
  return span('badge badge-altstack', '🧱 Alter Stack', plugin.stack_hinweis);
}

/* ============================== G7 — Link-Status ============================== */

export function linkStatusHTML(plugin) {
  const karten = {
    ok: '🔗 geprüft', umgezogen: '🔗 umgezogen', '404': '🔗 404 — tot',
    gesperrt: '🔗 nicht prüfbar (Bot-Schutz)', ungeprueft: '🔗 ungeprüft'
  };
  const text = karten[plugin.link_status] || karten.ungeprueft;
  const datum = plugin.link_geprueft_am ? ` ${datumDe(plugin.link_geprueft_am)}` : '';
  const klasse = plugin.link_status === '404' ? 'badge-linktot' : plugin.link_status === 'ok' ? 'badge-linkok' : 'badge-linkoffen';
  return span(`badge ${klasse}`, escapeHtml(text + datum));
}

/* ================================ G8 — Preis ================================ */

export function preisHTML(plugin) {
  const p = plugin.preis;
  // Kein Preis -> nichts. Den Fall "kostenlos" deckt bereits der Badge aus badgesVon() ab;
  // beides zu zeigen ergäbe zweimal "🆓 Kostenlos" nebeneinander.
  if (!p) return '';
  const zeichen = WAEHRUNG_ZEICHEN[p.waehrung] || p.waehrung + ' ';
  const text = p.typ === 'abo' ? `${zeichen}${p.betrag}/Monat` : `${zeichen}${p.betrag} einmalig`;
  return span('badge badge-preis', escapeHtml(text));
}

/* ============================ G11 — Qualitätsstufe ============================ */

export function qualitaetHTML(plugin) {
  const text = { verifiziert: '✅ verifiziert', teilgeprueft: '🟡 teilgeprüft', ungeprueft: '⚪ ungeprüft' }[plugin.qualitaet] || plugin.qualitaet;
  const datum = plugin.geprueft_am ? `Zuletzt geprüft ${datumDe(plugin.geprueft_am)}` : 'Noch nie inhaltlich geprüft';
  return span(`badge badge-qualitaet-${plugin.qualitaet}`, escapeHtml(text), datum);
}

/* ========================= G9 — essenziell vs. nützlich ========================= */

export function essenziellHTML(plugin) {
  return plugin.essenziell ? span('badge badge-essenziell', '⭐ unabdingbar') : '';
}

/* ============================== G1 — Beschreibung ============================== */

export function beschreibungHTML(plugin) {
  const beschreibung = plugin.beschreibung ? `<p class="karte-beschreibung">${escapeHtml(plugin.beschreibung)}</p>` : '';
  return beschreibung + liste('karte-features', plugin.features);
}

/* ===================== G6 — Autor, Version, Update, Quelle, Link ===================== */

export function metaHTML(plugin) {
  const zeilen = [];
  if (plugin.autor) zeilen.push(`Autor: ${escapeHtml(plugin.autor)}`);
  if (plugin.version) zeilen.push(`Version: ${escapeHtml(plugin.version)}`);
  if (plugin.letztes_update) zeilen.push(`Letztes Update: ${escapeHtml(plugin.letztes_update)}`);
  if (plugin.quelle) zeilen.push(`Quelle: ${escapeHtml(plugin.quelle)}`);

  const link = plugin.link
    ? `<a class="karte-link" href="${escapeHtml(plugin.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(plugin.link)}</a>`
    : '';

  return zeilen.length || link
    ? `<p class="karte-meta">${zeilen.join(' · ')}</p>${link}`
    : '';
}

/* ============================ Pro / Contra / Neutral ============================ */

export function vorUndNachteileHTML(plugin) {
  const teile = [
    liste('karte-pro', plugin.pro),
    liste('karte-contra', plugin.contra),
    liste('karte-neutral', plugin.neutral)
  ].filter(Boolean);
  return teile.length ? `<div class="karte-abwaegung">${teile.join('')}</div>` : '';
}

/* ================================ G10 — Tipp ================================ */

export function tippHTML(plugin) {
  return plugin.tipp ? `<p class="karte-tipp">💡 ${escapeHtml(plugin.tipp)}</p>` : '';
}

/* ============================== Alles zusammen ============================== */

/* ============================ B5 — Sprung zu einem Eintrag ============================ */

/** Ein anklickbarer Verweis auf einen anderen Katalogeintrag. Springt auch ohne JavaScript. */
function sprungLink(index, id, praefix = '') {
  const ziel = index.get(id);
  const name = ziel ? ziel.name : id;
  const fehlt = ziel ? '' : ' karte-sprung-fehlt';
  return `<a href="#karte-${escapeHtml(id)}" class="karte-sprung${fehlt}" data-jump-id="${escapeHtml(id)}">${praefix}${escapeHtml(name)}</a>`;
}

/** 🧪/✅ — auf welchen Umgebungen ein Plugin schon steht, als kurzes Präfix vor dem Namen. */
function statusPraefix(id) {
  const dev = istGehakt(id, 'dev') ? '🧪' : '';
  const main = istGehakt(id, 'main') ? '✅' : '';
  return dev + main;
}

/* ============================== B1 — Ersetzt-Gruppe ============================== */

export function ersetztHTML(index, plugin) {
  const andere = alternativen(index, plugin);
  if (!andere.length) return '';
  const eintraege = andere.map((p) => `<li>${sprungLink(index, p.id, statusPraefix(p.id))}</li>`).join('');

  // Genau hier steht die Frage im Raum, die der Zweiervergleich nur umständlich beantwortet:
  // „welches von diesen nehme ich?" — deshalb der Direkteinstieg mit allen Beteiligten auf einmal.
  const alleIds = [plugin.id, ...andere.map((p) => p.id)].join(',');
  const knopf = `<button type="button" class="btn btn-klein karte-vergleich"
    data-vergleich-ids="${escapeHtml(alleIds)}">⚖️ Alle ${andere.length + 1} vergleichen</button>`;

  return `<div class="karte-beziehung karte-ersetzt">
    <strong>⚠️ Ersetzt / wird ersetzt durch:</strong><ul>${eintraege}</ul>${knopf}</div>`;
}

/* ================================ B2 — Synergie ================================ */

export function synergieHTML(index, plugin) {
  const partner = synergiePartner(index, plugin);
  if (!partner.length) return '';
  const eintraege = partner.map((p) => sprungLink(index, p.id, statusPraefix(p.id))).join(', ');
  return `<div class="karte-beziehung karte-synergie"><strong>🔗 Synergie mit:</strong> ${eintraege}</div>`;
}

/* ============================== B3 — Ergänzt (+/−) ============================== */

export function ergaenztHTML(index, plugin) {
  const vorwaerts = ergaenztZiele(index, plugin).map((e) => `
    <li>${sprungLink(index, e.ziel.id, statusPraefix(e.ziel.id))}
      ${liste('karte-plus', e.plus)}${liste('karte-minus', e.minus)}
    </li>`).join('');

  const rueckwaerts = wirdErgaenztVon(index, plugin).map((e) => `
    <li>${sprungLink(index, e.quelle.id, statusPraefix(e.quelle.id))}
      ${liste('karte-plus', e.plus)}${liste('karte-minus', e.minus)}
    </li>`).join('');

  const teile = [];
  if (vorwaerts) teile.push(`<div><strong>➕ Ergänzt:</strong><ul>${vorwaerts}</ul></div>`);
  if (rueckwaerts) teile.push(`<div><strong>➕ Wird ergänzt durch:</strong><ul>${rueckwaerts}</ul></div>`);
  return teile.length ? `<div class="karte-beziehung karte-ergaenzt">${teile.join('')}</div>` : '';
}

/* ============================== B4 — Abhängigkeiten ============================== */

export function abhaengigkeitenHTML(index, plugin) {
  if (!plugin.abhaengigkeiten || !plugin.abhaengigkeiten.length) return '';
  const eintraege = plugin.abhaengigkeiten.map((id) => `<li>${sprungLink(index, id, statusPraefix(id))}</li>`).join('');
  return `<div class="karte-beziehung karte-abhaengigkeiten"><strong>📦 Braucht:</strong><ul>${eintraege}</ul></div>`;
}

/* ============================= B6 — Banner „ersetzt durch" ============================= */

/**
 * Getrennte Banner für DEV und MAIN (Testfall B6): ist plugin in einer Umgebung schon durch eine
 * Alternative abgedeckt, erscheint dort ein eigener Banner mit anklickbarem Namen.
 */
export function bannerHTML(index, plugin) {
  const zeilen = [];
  for (const [umgebung, label] of [['dev', 'DEV'], ['main', 'MAIN']]) {
    const deckt = deckendeAlternativen(index, plugin, umgebung);
    if (!deckt.length) continue;
    const namen = deckt.map((p) => sprungLink(index, p.id)).join(', ');
    zeilen.push(`<div class="karte-banner karte-banner-${umgebung}">⚠️ auf ${label} bereits ersetzt durch ${namen}</div>`);
  }
  return zeilen.join('');
}

/* ========================= A1/A5 — Haken-Schalter mit Zeitstempel ========================= */

export function hakenHTML(index, plugin) {
  const zelle = (umgebung, label) => {
    const gehakt = istGehakt(plugin.id, umgebung);
    const seit = gehakt ? hakenSeit(plugin.id, umgebung) : '';
    const abgeschwaecht = istAbgedeckt(index, plugin, umgebung) ? ' schalter-abgedeckt' : '';
    return `<label class="karte-schalter${abgeschwaecht}">
      <input type="checkbox" class="haken-schalter" data-id="${escapeHtml(plugin.id)}" data-umgebung="${umgebung}" ${gehakt ? 'checked' : ''}>
      ${label}${seit ? ` <small>seit ${datumDe(seit)}</small>` : ''}
    </label>`;
  };
  return `<div class="karte-haken">${zelle('dev', '🧪 DEV')}${zelle('main', '✅ MAIN')}</div>`;
}

/* ================================== A3 — Notiz ================================== */

export function notizHTML(plugin) {
  const text = holeNotiz(plugin.id);
  return `<textarea class="karte-notiz" data-id="${escapeHtml(plugin.id)}"
    placeholder="Notiz (Config, resmon-Werte, Tests) …">${escapeHtml(text)}</textarea>`;
}

/* ================================ A4 — Priorität ================================ */

const PRIORITAETEN = [['', '–'], ['hoch', '🔥 hoch'], ['mittel', '🟡 mittel'], ['niedrig', '⚪ niedrig']];

export function prioritaetHTML(plugin) {
  const aktuell = holePrioritaet(plugin.id);
  const optionen = PRIORITAETEN.map(([wert, text]) =>
    `<option value="${wert}" ${wert === aktuell ? 'selected' : ''}>${text}</option>`).join('');
  return `<select class="karte-prioritaet" data-id="${escapeHtml(plugin.id)}">${optionen}</select>`;
}

/* ============================== Alles zusammen ============================== */

/**
 * Die vollständige Karte: Info-Seite (1b) + Beziehungen, Banner und Steuerelemente (1c).
 *
 * `opt.detail` zeichnet dieselbe Karte für das Detail-Fenster. Nötig ist dafür nur ein anderes
 * DOM-`id`-Präfix: Ein Sprung auf ein ausgefiltertes Plugin öffnet dessen Karte im Fenster,
 * während die Liste dahinter gefiltert bleibt — stünde dort dieselbe `id`, zeigten alle
 * `#karte-…`-Anker plötzlich ins Fenster statt in die Liste.
 */
export function kartenHTML(index, plugin, opt = {}) {
  const kopf = `<h3 class="karte-titel">${escapeHtml(plugin.name)}${essenziellHTML(plugin)}</h3>`;
  const badges = `<div class="karte-badges">${badgesHTML(plugin)}${kompatHTML(plugin)}${archivHTML(plugin)}${altStackHTML(plugin)}${preisHTML(plugin)}${qualitaetHTML(plugin)}${linkStatusHTML(plugin)}</div>`;
  const beziehungen = ersetztHTML(index, plugin) + synergieHTML(index, plugin) + ergaenztHTML(index, plugin) + abhaengigkeitenHTML(index, plugin);
  const kennung = (opt.detail ? 'detail-karte-' : 'karte-') + escapeHtml(plugin.id);

  return `<article id="${kennung}" class="karte${opt.detail ? ' karte-imfenster' : ''}" data-kategorie="${escapeHtml(plugin.kategorie)}">
${bannerHTML(index, plugin)}
${kopf}
${badges}
${beschreibungHTML(plugin)}
${metaHTML(plugin)}
${vorUndNachteileHTML(plugin)}
${tippHTML(plugin)}
${beziehungen}
<div class="karte-aktionen">
${hakenHTML(index, plugin)}
${prioritaetHTML(plugin)}
${notizHTML(plugin)}
</div>
</article>`;
}
