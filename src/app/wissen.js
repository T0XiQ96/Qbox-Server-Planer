/**
 * wissen.js — die Wissens-Datenbank als eigene Ansicht.
 *
 * Kein eigenes Datenmodell im Code: Kategorien und Artikel kommen aus `data/wissen/` und werden
 * beim Build eingebettet (Entscheidung D28). Ein neuer Artikel oder eine neue Kategorie darf
 * niemals eine Änderung in diesem Modul erfordern — hier steht nur, WIE gezeichnet wird.
 *
 * Reine HTML-String-Bausteine wie render.js, kein DOM-Zugriff. Jeder Text läuft durch
 * escapeHtml(): die Artikel sind Daten und können später auch über einen Import hereinkommen.
 */

import { escapeHtml, datumDe } from './render.js';

/** Dieselben Stufen wie im Plugin-Katalog (D7) — ein Artikel darf nicht besser aussehen als er belegt ist. */
const WISSEN_QUALITAET = {
  verifiziert: { text: '✅ verifiziert', klasse: 'wissen-verifiziert' },
  teilgeprueft: { text: '🟡 teilgeprüft', klasse: 'wissen-teilgeprueft' },
  ungeprueft: { text: '⚪ ungeprüft', klasse: 'wissen-ungeprueft' }
};

/* ================================== Suche ================================== */

function wissenSuchtext(a) {
  const abschnitte = (a.abschnitte || [])
    .map((s) => `${s.titel} ${s.text} ${(s.schritte || []).join(' ')} ${s.code || ''}`)
    .join(' ');
  return [a.titel, a.kurz, a.warnung || '', (a.stichworte || []).join(' '), abschnitte]
    .join(' ').toLowerCase();
}

export function passtWissenSuche(artikel, suche) {
  const s = String(suche || '').trim().toLowerCase();
  return !s || wissenSuchtext(artikel).includes(s);
}

/* ================================ Bausteine ================================ */

function abschnittHTML(s) {
  const schritte = (s.schritte || []).length
    ? `<ol class="wissen-schritte">${s.schritte.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ol>` : '';
  const code = s.code ? `<pre class="wissen-code">${escapeHtml(s.code)}</pre>` : '';
  return `<div class="wissen-abschnitt">
    <h4>${escapeHtml(s.titel)}</h4>
    <p>${escapeHtml(s.text)}</p>${schritte}${code}
  </div>`;
}

/**
 * Ein Artikel als aufklappbarer Block. Zu ist der Normalfall: Die Kurzfassung soll zum Überfliegen
 * reichen, der volle Text kommt erst auf Wunsch — sonst wäre eine Kategorie mit fünf Artikeln
 * eine Textwand.
 */
export function wissenArtikelHTML(artikel, plugindex) {
  const q = WISSEN_QUALITAET[artikel.qualitaet] || WISSEN_QUALITAET.ungeprueft;
  const geprueft = artikel.geprueft_am ? ` · geprüft ${datumDe(artikel.geprueft_am)}` : '';

  const warnung = artikel.warnung
    ? `<p class="wissen-warnung">⚠️ ${escapeHtml(artikel.warnung)}</p>` : '';

  const stand = artikel.stand_hinweis
    ? `<p class="wissen-stand">🕒 ${escapeHtml(artikel.stand_hinweis)}</p>` : '';

  // Verweise auf Katalogeinträge nutzen dieselbe Sprung-Mechanik wie überall (B5). Nicht
  // katalogisierte IDs werden gar nicht erst als Verweis gezeigt.
  const plugins = (artikel.plugins || [])
    .filter((id) => plugindex.has(id))
    .map((id) => `<a href="#karte-${escapeHtml(id)}" class="karte-sprung" data-jump-id="${escapeHtml(id)}"
        >${escapeHtml(plugindex.get(id).name)}</a>`);
  const pluginZeile = plugins.length
    ? `<p class="wissen-verweise"><strong>Passende Plugins:</strong> ${plugins.join(', ')}</p>` : '';

  const siehe = (artikel.siehe_auch || []).length
    ? `<p class="wissen-verweise"><strong>Siehe auch:</strong> ${artikel.siehe_auch
        .map((id) => `<button type="button" class="bericht-partner" data-wissen-ziel="${escapeHtml(id)}">${escapeHtml(id)}</button>`)
        .join(', ')}</p>` : '';

  const quellen = (artikel.quellen || []).length
    ? `<p class="wissen-quellen"><strong>Quellen:</strong> ${artikel.quellen
        .map((u) => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u)}</a>`)
        .join(' · ')}</p>`
    : '<p class="wissen-quellen wissen-ohne-quelle">Noch ohne Quellenangabe — aus Erfahrungswissen geschrieben und nicht gegengeprüft.</p>';

  return `<details class="wissen-artikel" id="wissen-${escapeHtml(artikel.id)}">
    <summary>
      <span class="wissen-titel">${escapeHtml(artikel.titel)}</span>
      <span class="badge ${q.klasse}">${escapeHtml(q.text + geprueft)}</span>
      <span class="wissen-kurz">${escapeHtml(artikel.kurz)}</span>
    </summary>
    ${warnung}
    ${(artikel.abschnitte || []).map(abschnittHTML).join('')}
    ${pluginZeile}${siehe}${stand}${quellen}
  </details>`;
}

/** Die ganze Ansicht: Kategorie für Kategorie, leere Kategorien fallen bei aktiver Suche weg. */
export function wissenSeiteHTML(wissen, plugindex, suche = '') {
  const artikel = (wissen.artikel || []).filter((a) => passtWissenSuche(a, suche));

  if (!artikel.length) {
    return `<p class="leer">Kein Artikel passt zu „${escapeHtml(suche)}".</p>`;
  }

  const nachKategorie = new Map();
  for (const a of artikel) {
    if (!nachKategorie.has(a.kategorie)) nachKategorie.set(a.kategorie, []);
    nachKategorie.get(a.kategorie).push(a);
  }

  const bloecke = (wissen.kategorien || [])
    .filter((k) => nachKategorie.has(k.id))
    .map((k) => `<section class="wissen-kategorie" id="wissen-kat-${escapeHtml(k.id)}">
      <h2>${escapeHtml((k.zeichen ? k.zeichen + ' ' : '') + k.name)}
        <small>${escapeHtml(k.kurz || '')}</small></h2>
      ${nachKategorie.get(k.id).map((a) => wissenArtikelHTML(a, plugindex)).join('')}
    </section>`);

  return bloecke.join('') || '<p class="leer">Noch keine Artikel vorhanden.</p>';
}

/** Sprungleiste über der Seite — bei 13 Kategorien sonst viel Gescrolle. */
export function wissenNavHTML(wissen) {
  return `<nav class="wissen-nav">${(wissen.kategorien || [])
    .map((k) => `<a href="#wissen-kat-${escapeHtml(k.id)}">${escapeHtml((k.zeichen || '') + ' ' + k.name)}</a>`)
    .join('')}</nav>`;
}
