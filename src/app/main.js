/**
 * main.js — führt alle Module zu einer Seite zusammen.
 *
 * Zwei Entscheidungen prägen den Aufbau:
 *
 * 1. GERÜST EINMAL, LISTE OFT. Die Toolbar wird genau einmal gebaut, neu gezeichnet wird nur die
 *    Kartenliste. Würde bei jeder Änderung alles neu entstehen, verlöre das Suchfeld bei jedem
 *    Tastendruck den Fokus — der klassische Fehler beim "alles neu zeichnen".
 *
 * 2. EIN LISTENER STATT TAUSENDER. Klicks und Eingaben laufen über Event-Delegation an wenigen
 *    Containern. Bei 500-1000 Karten mit je vier Steuerelementen wäre alles andere Verschwendung,
 *    und nach jedem Neuzeichnen müssten sämtliche Listener neu gesetzt werden.
 *
 * Reihenfolge des Katalogaufbaus (wichtig, siehe D3a): eingebauter Katalog -> Import-Differenz
 * -> eigene Einträge. Bei gleicher ID gewinnt also immer das, was mir gehört.
 */

import { alleMitStandard } from './defaults.js';
import { ladeZustand, istGehakt, setzeHaken, setzeNotiz, setzePrioritaet, setzeZurueck, legeBackupAn, holeBackups, ladeBackup, loescheBackup } from './state.js';
import { baueIndex, aktiveKonflikte, fehlendeAbhaengigkeiten, bundleHinweis, alleGruppen, gruppenMitglieder, alternativen } from './relations.js';
import { kartenHTML, escapeHtml } from './render.js';
import { leererFilter, gefilterteUndSortierteListe, holeAktiveSortierung, setzeAktiveSortierung, SORTIER_OPTIONEN, passtSuche } from './filters.js';
import { vergleiche, vergleichHTML, vergleicheMehrere, mehrfachVergleichHTML } from './compare.js';
import { berichtBeiderUmgebungen, berichtZusammenfassung, warnIds, synergienBeiderUmgebungen, ungenutzteSynergien, UMGEBUNG_LABEL } from './warnings.js';
import { ladeDifferenz, mitDifferenz, verwirfDifferenz, differenzInfo } from './katalogspeicher.js';
import { mitEigenen, legeEigenesAn } from './custom.js';
import { baueZustandsExport, leseZustandsDatei, uebernimmZustand, baueKatalogVorschau, wendeVorschauAn, vorschauZusammenfassung } from './import.js';
import { baueEnsureListe } from './exportcfg.js';
import { kostenBeiderUmgebungen, kostenText } from './costs.js';
import { toast, modal, frage, hinweis, ladeHerunter, waehleDatei, schliesseModal } from './ui.js';

const daten = JSON.parse(document.getElementById('qbox-daten').textContent);
const KATEGORIEN = daten.kategorien || [];
const KATEGORIE_NAMEN = new Map(KATEGORIEN.map((k) => [k.id, k.name]));
const KATEGORIE_IDS = KATEGORIEN.map((k) => k.id);

const BADGE_CHIPS = [
  ['qbox', '✅ Qbox nativ'], ['bridge', '🔁 QBCore-Bridge'], ['stand', '🌐 Standalone'],
  ['qbonly', '⛔ nur QBCore'], ['open', '🔓 Open Source'], ['escrow', '🔒 Escrow'],
  ['premium', '💰 Premium'], ['free', '🆓 Kostenlos']
];

let filter = leererFilter();
let plugins = [];
let index = new Map();
let vergleichsAuswahl = [];

/* ============================== Katalog zusammensetzen ============================== */

function katalogAufbauen() {
  plugins = mitEigenen(mitDifferenz(alleMitStandard(daten.plugins || [])));
  index = baueIndex(plugins);
}

/* ==================================== Gerüst ==================================== */

function baueGeruest() {
  document.getElementById('app').innerHTML = `
    <header class="kopf">
      <div class="kopf-titel">
        <h1>🎮 Qbox Server-Planer</h1>
        <span class="kopf-version" id="kopf-version"></span>
      </div>
      <div class="kopf-knoepfe">
        <button class="btn" id="btn-eigenes">➕ Eigenes Plugin</button>
        <button class="btn" id="btn-vergleich">⚖️ Vergleich</button>
        <button class="btn" id="btn-zahnrad">⚙️ Daten</button>
      </div>
      <div class="korbleiste" id="korbleiste" hidden></div>
    </header>

    <div class="warnbox">
      <strong>⚠️ Qbox ↔ QBCore — worauf es ankommt</strong>
      <ul>
        <li>Qbox bringt eine QBCore-Bridge mit. Standard-Exports werden übersetzt, <em>aber</em> nicht jeder Zugriff.</li>
        <li>Bricht trotz Bridge: harte Abhängigkeit auf <code>qb-inventory</code> oder <code>qb-target</code> (Qbox nutzt <code>ox_inventory</code>/<code>ox_target</code>).</li>
        <li>Bricht ebenfalls: Eingriffe in interne <code>qb-core</code>-Player-Funktionen und eigene SQL-Abfragen auf qb-Tabellen.</li>
        <li><code>ox_core</code> und <code>ox_mdt</code> sind <strong>nicht</strong> Qbox-kompatibel — <code>ox_lib</code>, <code>ox_inventory</code>, <code>ox_target</code>, <code>ox_doorlock</code> schon.</li>
        <li>Ein ⚠️-Badge nennt im Tooltip immer den Beleggrad: <em>bestätigt</em> oder <em>Vermutung</em>.</li>
      </ul>
    </div>

    <div id="pruefbericht"></div>

    <div class="kosten" id="kosten"></div>

    <div class="werkzeugleiste">
      <input type="search" id="f-suche" class="feld feld-suche" placeholder="🔍 Suchen (Name, Funktion, Kategorie) …">
      <select id="f-kategorie" class="feld"></select>
      <select id="f-status" class="feld">
        <option value="alle">Status: alle</option>
        <option value="main">✅ auf MAIN</option>
        <option value="dev">🧪 auf DEV</option>
        <option value="nirgends">Nirgends gesetzt</option>
        <option value="abgedeckt">Durch Alternative abgedeckt</option>
      </select>
      <select id="f-qualitaet" class="feld">
        <option value="alle">Qualität: alle</option>
        <option value="verifiziert">✅ verifiziert</option>
        <option value="teilgeprueft">🟡 teilgeprüft</option>
        <option value="ungeprueft">⚪ ungeprüft</option>
      </select>
      <select id="f-sortierung" class="feld">
        <option value="standard">Sortierung: Standard</option>
        <option value="name">Name</option>
        <option value="letztes_update">Letztes Update</option>
        <option value="prioritaet">Priorität</option>
      </select>
      <label class="schalter-klein"><input type="checkbox" id="f-essenziell"> ⭐ nur unabdingbare</label>
      <label class="schalter-klein"><input type="checkbox" id="f-diff"> 🔀 nur DEV ≠ MAIN</label>
      <label class="schalter-klein"><input type="checkbox" id="f-warnungen"> ⚠️ nur mit Warnung</label>
      <button class="btn btn-leise" id="btn-zuruecksetzen">↺ Zurücksetzen</button>
    </div>

    <div class="chips" id="chips"></div>
    <div class="treffer" id="treffer"></div>
    <div id="liste"></div>
    <button class="btn zurueck-knopf" id="btn-zurueck" hidden></button>`;

  const kat = document.getElementById('f-kategorie');
  kat.innerHTML = '<option value="">Kategorie: alle</option>' +
    KATEGORIEN.map((k) => `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)}</option>`).join('');

  document.getElementById('chips').innerHTML = BADGE_CHIPS
    .map(([id, text]) => `<button class="chip" data-badge="${id}">${text}</button>`).join('');

  document.getElementById('f-sortierung').value = holeAktiveSortierung();
  aktualisiereKopf();
  verdrahteWerkzeugleiste();
}

function aktualisiereKopf() {
  const info = differenzInfo();
  const zusatz = info.anzahl ? ` · +${info.anzahl} importiert (${info.lesbar})` : '';
  document.getElementById('kopf-version').textContent =
    `📚 Katalog v${daten.katalogVersion} · ${plugins.length} Plugins${zusatz}`;
}

/* ================================ Liste zeichnen ================================ */

function zeichneListe() {
  // Der Prüfbericht entsteht VOR dem Filtern: seine IDs sind die Grundlage für „nur mit Warnung".
  // Beide Umgebungen zusammen kosten nur einen Durchlauf über die gehakten Einträge — der teure
  // Teil (wer ergänzt wen, wer kollidiert mit wem) ist in relations.js vorberechnet.
  const bericht = berichtBeiderUmgebungen(index);
  filter.warnIds = warnIds(bericht);

  const sichtbar = gefilterteUndSortierteListe(index, plugins, filter);
  const nachKategorie = new Map();
  for (const p of sichtbar) {
    if (!nachKategorie.has(p.kategorie)) nachKategorie.set(p.kategorie, []);
    nachKategorie.get(p.kategorie).push(p);
  }

  const reihenfolge = [...KATEGORIE_IDS.filter((id) => nachKategorie.has(id)),
    ...[...nachKategorie.keys()].filter((id) => !KATEGORIE_IDS.includes(id))];

  const bloecke = reihenfolge.map((katId) => {
    const eintraege = nachKategorie.get(katId);
    // A6 — Zähler zählt über den GANZEN Katalog dieser Kategorie, nicht nur über die gefilterte
    // Ansicht: "3/8 auf MAIN" soll beim Filtern nicht plötzlich zu "1/1" werden.
    const alleDerKategorie = plugins.filter((p) => p.kategorie === katId);
    const aufMain = alleDerKategorie.filter((p) => istGehakt(p.id, 'main')).length;
    const aufDev = alleDerKategorie.filter((p) => istGehakt(p.id, 'dev')).length;

    return `<section class="kategorie">
      <h2 class="kategorie-titel">
        ${escapeHtml(KATEGORIE_NAMEN.get(katId) || katId)}
        <span class="kategorie-zaehler">${aufMain}/${alleDerKategorie.length} auf MAIN · ${aufDev} auf DEV</span>
      </h2>
      <div class="karten">${eintraege.map((p) => kartenHTML(index, p, { imKorb: imKorb(p.id) })).join('')}</div>
    </section>`;
  });

  document.getElementById('liste').innerHTML = bloecke.join('') ||
    '<p class="leer">Kein Plugin passt zu diesen Filtern.</p>';

  document.getElementById('treffer').textContent =
    `${sichtbar.length} von ${plugins.length} Plugins`;

  zeichnePruefbericht(bericht);
  zeichneKosten();
  zeichneKorbleiste();
  aktualisiereChips();
  aktualisiereKopf();
  aktualisiereZurueck();
}

/* ============================== Prüfbericht (oben) ============================== */

const STUFEN_ZEICHEN = { fehler: '⛔', warnung: '⚠️', hinweis: 'ℹ️' };

/** Ein Verweis in den Bericht hinein — dieselbe Sprung-Mechanik wie auf den Karten (B5). */
function berichtLink(p) {
  return `<a href="#karte-${escapeHtml(p.id)}" class="karte-sprung" data-jump-id="${escapeHtml(p.id)}">${escapeHtml(p.name)}</a>`;
}

function fundHTML(f) {
  // Eine Warnung ohne Weg zur Behebung ist eine halbe Warnung: fehlt eine Abhängigkeit, steht der
  // Haken direkt daneben statt irgendwo weiter unten in der Liste.
  const behebung = f.behebung
    ? `<button type="button" class="btn btn-klein bericht-behebe"
         data-behebe="${escapeHtml(f.behebung.id)}:${escapeHtml(f.behebung.umgebung)}">＋ setzen</button>`
    : '';
  return `<li class="bericht-fund bericht-${f.stufe}">
    <span class="bericht-zeichen">${STUFEN_ZEICHEN[f.stufe]}</span>
    <span class="bericht-text">${berichtLink(f.plugin)} — ${escapeHtml(f.text)}</span>
    ${behebung}</li>`;
}

/**
 * Warnt sofort, nicht erst beim Export (F3-F6 waren bis hierher entweder ein flüchtiges Popup
 * oder ein Kommentar in der ensure-Liste). Bleibt leer, solange gar nichts gehakt ist — ein
 * leerer Plan hat keine Probleme, und eine grüne Meldung dazu wäre nur Lärm.
 */
function zeichnePruefbericht(bericht) {
  const el = document.getElementById('pruefbericht');
  const vorher = el.querySelector('.bericht');
  const warOffen = vorher ? vorher.open : true;

  const etwasGehakt = plugins.some((p) => istGehakt(p.id, 'dev') || istGehakt(p.id, 'main'));
  if (!etwasGehakt) { el.innerHTML = ''; return; }

  const alle = [...bericht.dev, ...bericht.main];
  if (!alle.length) {
    el.innerHTML = '<div class="bericht bericht-sauber">✅ Prüfbericht: keine offenen Punkte auf DEV und MAIN.</div>';
    return;
  }

  const z = berichtZusammenfassung(alle);
  const teile = [];
  if (z.fehler) teile.push(`${z.fehler} Fehler`);
  if (z.warnung) teile.push(`${z.warnung} Warnung${z.warnung === 1 ? '' : 'en'}`);
  if (z.hinweis) teile.push(`${z.hinweis} Hinweis${z.hinweis === 1 ? '' : 'e'}`);

  const block = (umgebung) => {
    const funde = bericht[umgebung];
    if (!funde.length) return '';
    return `<div class="bericht-block">
      <h3>${umgebung === 'dev' ? '🧪' : '✅'} ${UMGEBUNG_LABEL[umgebung]}</h3>
      <ul>${funde.map(fundHTML).join('')}</ul></div>`;
  };

  el.innerHTML = `<details class="bericht${z.fehler ? ' bericht-hat-fehler' : ''}">
    <summary><strong>Prüfbericht</strong> — ${escapeHtml(teile.join(' · '))}</summary>
    ${block('dev')}${block('main')}</details>`;
  el.querySelector('.bericht').open = warOffen;
}

/* ============================ Kosten + Synergie-Zähler ============================ */

function zeichneKosten() {
  const k = kostenBeiderUmgebungen(index);
  const s = synergienBeiderUmgebungen(index);

  const spalte = (umgebung, zeichen) => {
    const offen = s[umgebung].length;
    // Der Zähler steht bewusst je Umgebung, direkt neben den Kosten derselben Umgebung: DEV und
    // MAIN sind unterschiedlich bestückt, ein gemeinsamer Wert wäre für beide falsch.
    const synergie = offen
      ? `<button type="button" class="kosten-synergie" data-synergie="${umgebung}">
           🔗 ${offen} ungenutzte Synergie${offen === 1 ? '' : 'n'}</button>`
      : '';
    return `<div class="kosten-spalte"><strong>${zeichen} ${UMGEBUNG_LABEL[umgebung]}</strong>
      <span>einmalig ${kostenText(k[umgebung].einmalig)}</span>
      <span>monatlich ${kostenText(k[umgebung].abo)}</span>${synergie}</div>`;
  };

  document.getElementById('kosten').innerHTML = spalte('dev', '🧪') + spalte('main', '✅');
}

function aktualisiereChips() {
  for (const knopf of document.querySelectorAll('#chips .chip')) {
    knopf.classList.toggle('chip-aktiv', filter.badges.includes(knopf.dataset.badge));
  }
}

/* ============================== Werkzeugleiste ============================== */

let sucheTimer = null;

function verdrahteWerkzeugleiste() {
  document.getElementById('f-suche').addEventListener('input', (e) => {
    clearTimeout(sucheTimer);
    const wert = e.target.value;
    sucheTimer = setTimeout(() => { filter.suche = wert; zeichneListe(); }, 150);
  });

  const binde = (id, feld) => document.getElementById(id)
    .addEventListener('change', (e) => { filter[feld] = e.target.value; zeichneListe(); });
  binde('f-kategorie', 'kategorie');
  binde('f-status', 'status');
  binde('f-qualitaet', 'qualitaet');

  document.getElementById('f-sortierung').addEventListener('change', (e) => {
    setzeAktiveSortierung(SORTIER_OPTIONEN.includes(e.target.value) ? e.target.value : 'standard');
    zeichneListe();
  });

  document.getElementById('f-essenziell').addEventListener('change', (e) => { filter.nurEssenziell = e.target.checked; zeichneListe(); });
  document.getElementById('f-diff').addEventListener('change', (e) => { filter.nurDiff = e.target.checked; zeichneListe(); });
  document.getElementById('f-warnungen').addEventListener('change', (e) => { filter.nurWarnungen = e.target.checked; zeichneListe(); });

  document.getElementById('chips').addEventListener('click', (e) => {
    const knopf = e.target.closest('.chip');
    if (!knopf) return;
    const id = knopf.dataset.badge;
    filter.badges = filter.badges.includes(id) ? filter.badges.filter((b) => b !== id) : [...filter.badges, id];
    zeichneListe();
  });

  // D8 — setzt AUSSCHLIESSLICH Suche und Filter zurück, niemals Daten.
  document.getElementById('btn-zuruecksetzen').addEventListener('click', () => {
    filter = leererFilter();
    document.getElementById('f-suche').value = '';
    for (const id of ['f-kategorie', 'f-status', 'f-qualitaet']) {
      document.getElementById(id).value = id === 'f-kategorie' ? '' : 'alle';
    }
    document.getElementById('f-essenziell').checked = false;
    document.getElementById('f-diff').checked = false;
    document.getElementById('f-warnungen').checked = false;
    zeichneListe();
    toast('Suche und Filter zurückgesetzt — deine Haken sind unberührt.');
  });

  document.getElementById('btn-zurueck').addEventListener('click', geheZurueck);

  document.getElementById('btn-zahnrad').addEventListener('click', oeffneZahnrad);
  document.getElementById('btn-eigenes').addEventListener('click', oeffneEigenesFormular);
  document.getElementById('btn-vergleich').addEventListener('click', oeffneVergleich);
}

/* ================= Ein Listener für Liste, Prüfbericht und Fenster ================= */

/**
 * Delegation an document statt an #liste: Karten und Verweise stehen inzwischen an drei Stellen
 * — in der Liste, im Prüfbericht und im Detail-Fenster. Ein eigener Listener je Ort hieße,
 * dieselbe Logik dreimal zu pflegen und bei jedem Neuzeichnen neu zu setzen.
 */
function verdrahteGlobal() {
  document.addEventListener('change', async (e) => {
    const ziel = e.target;

    if (ziel.classList.contains('haken-schalter')) {
      await hakenGesetzt(ziel.dataset.id, ziel.dataset.umgebung, ziel.checked);
      return;
    }
    if (ziel.classList.contains('karte-prioritaet')) {
      setzePrioritaet(ziel.dataset.id, ziel.value);
      zeichneListe();
      return;
    }
    // Notiz absichtlich auf "change" (also beim Verlassen), nicht auf jeden Tastendruck —
    // sonst würde die Liste beim Tippen neu gezeichnet und das Feld verlöre den Fokus.
    if (ziel.classList.contains('karte-notiz')) {
      setzeNotiz(ziel.dataset.id, ziel.value);
      toast('Notiz gespeichert 💾');
    }
  });

  document.addEventListener('click', (e) => {
    const behebe = e.target.closest('[data-behebe]');
    if (behebe) { e.preventDefault(); behebeFehlend(behebe.dataset.behebe); return; }

    const vergleich = e.target.closest('[data-vergleich-ids]');
    if (vergleich) { e.preventDefault(); zeigeMehrfachVergleich(vergleich.dataset.vergleichIds.split(',')); return; }

    const synergie = e.target.closest('[data-synergie]');
    if (synergie) { e.preventDefault(); zeigeSynergien(synergie.dataset.synergie); return; }

    // ⚖️ auf der Karte: einfacher Klick legt hinein UND öffnet — bewusst kein Long-Press,
    // der wäre unsichtbar, ohne Zustandsanzeige und kollidiert mit dem Markieren von Text.
    const korb = e.target.closest('[data-korb]');
    if (korb) { e.preventDefault(); korbHinzufuegen(korb.dataset.korb); oeffneKorbVergleich(); return; }

    const korbAdd = e.target.closest('[data-korb-add]');
    if (korbAdd) { e.preventDefault(); korbHinzufuegen(korbAdd.dataset.korbAdd); return; }

    const korbAb = e.target.closest('[data-korb-ab]');
    if (korbAb) { e.preventDefault(); korbEntfernen(korbAb.dataset.korbAb); return; }

    const korbWeg = e.target.closest('[data-korb-weg]');
    if (korbWeg) { e.preventDefault(); korbEntfernen(korbWeg.dataset.korbWeg); return; }

    if (e.target.closest('[data-korb-oeffnen]')) { e.preventDefault(); oeffneKorbVergleich(); return; }
    if (e.target.closest('[data-korb-leeren]')) { e.preventDefault(); korbLeeren(); return; }

    const sprung = e.target.closest('[data-jump-id]');
    if (sprung) behandleSprung(e, sprung);
  });

  verdrahteZiehen();
}

/**
 * Drag&Drop als ZUSATZweg neben dem Klick — nie als einziger: auf Touch-Geräten gibt es kein
 * echtes HTML5-Ziehen, dort bleibt der Klickweg. Die Leiste blendet sich beim Ziehbeginn ein,
 * damit das Ablageziel nie außerhalb des Sichtfelds liegt (sie klebt oben am Kopf).
 */
function verdrahteZiehen() {
  const leiste = document.getElementById('korbleiste');

  document.addEventListener('dragstart', (e) => {
    const knopf = e.target.closest('[data-korb]');
    if (!knopf) return;
    e.dataTransfer.setData('text/plain', knopf.dataset.korb);
    e.dataTransfer.effectAllowed = 'copy';
    ziehtGerade = true;
    zeichneKorbleiste();
    leiste.classList.add('korb-bereit');
  });

  document.addEventListener('dragend', () => {
    ziehtGerade = false;
    leiste.classList.remove('korb-bereit', 'korb-drueber');
    zeichneKorbleiste();
  });

  leiste.addEventListener('dragover', (e) => {
    e.preventDefault();                       // ohne das nimmt der Browser den Abwurf nicht an
    e.dataTransfer.dropEffect = 'copy';
    leiste.classList.add('korb-drueber');
  });
  leiste.addEventListener('dragleave', (e) => {
    if (!leiste.contains(e.relatedTarget)) leiste.classList.remove('korb-drueber');
  });
  leiste.addEventListener('drop', (e) => {
    e.preventDefault();
    leiste.classList.remove('korb-drueber');
    const id = e.dataTransfer.getData('text/plain');
    const p = index.get(id);
    if (korbHinzufuegen(id)) toast(`${p.name} liegt im Vergleich ⚖️`);
    else if (p) toast(`${p.name} liegt dort schon.`);
  });
}

/* ========================= Sprung-Navigation und Zurück ========================= */

/**
 * Der Zurück-Weg. Jeder Sprung legt ab, wohin er zurückführt:
 *   {typ:'liste',  id, scrollY}  — aus der Liste heraus gesprungen
 *   {typ:'fenster', id}          — aus einem Detail-Fenster in das nächste
 * Ein Stapel, kein einzelner Schritt: A→B→C soll rückwärts auch wieder C→B→A laufen.
 */
let zurueckStapel = [];
let aktuellesDetail = null;

function merkeHerkunft(vonId) {
  if (aktuellesDetail) zurueckStapel.push({ typ: 'fenster', id: aktuellesDetail });
  else zurueckStapel.push({ typ: 'liste', id: vonId, scrollY: window.scrollY });
}

function blinke(el) {
  el.classList.remove('blinkt');
  void el.offsetWidth;          // Neustart der Animation erzwingen
  el.classList.add('blinkt');
}

function kehreZurListeZurueck(eintrag) {
  window.scrollTo({ top: eintrag.scrollY, behavior: 'smooth' });
  const karte = eintrag.id ? document.getElementById('karte-' + eintrag.id) : null;
  if (karte) blinke(karte);
}

function geheZurueck() {
  const eintrag = zurueckStapel.pop();
  if (!eintrag) { aktualisiereZurueck(); return; }

  if (eintrag.typ === 'fenster') { zeigeDetail(eintrag.id, false); return; }

  schliesseModal();
  aktuellesDetail = null;
  kehreZurListeZurueck(eintrag);
  aktualisiereZurueck();
}

function aktualisiereZurueck() {
  const knopf = document.getElementById('btn-zurueck');
  if (!knopf) return;
  const oben = zurueckStapel[zurueckStapel.length - 1];
  // Solange ein Fenster offen ist, sitzt das Zurück in dessen Fuß — der schwebende Knopf gilt
  // nur der Liste, sonst gäbe es zwei Zurücks nebeneinander.
  if (!oben || aktuellesDetail) { knopf.hidden = true; return; }
  const ziel = oben.id ? index.get(oben.id) : null;
  knopf.textContent = ziel ? `← Zurück zu ${ziel.name}` : '← Zurück zur vorherigen Stelle';
  knopf.hidden = false;
}

/**
 * B5 — Sprung zu einem anderen Katalogeintrag.
 *
 * Bis hierher scheiterte der Sprung still, sobald das Ziel gerade ausgefiltert war: der Anker
 * fand nichts im DOM und die Meldung behauptete, der Eintrag sei „nicht im Katalog" — was
 * schlicht falsch war. Jetzt entscheidet der Ort des Ziels:
 *   sichtbar          → in der Liste dorthin springen (wie bisher)
 *   ausgefiltert      → im Detail-Fenster öffnen, Filter bleiben unangetastet
 *   gar nicht im Katalog → ehrliche Meldung
 */
function behandleSprung(e, el) {
  const zielId = el.dataset.jumpId;
  const imFenster = !!el.closest('.modal-huelle');
  const vonKarte = el.closest('.karte');
  const vonId = vonKarte ? vonKarte.id.replace(/^(?:detail-)?karte-/, '') : null;

  if (!index.has(zielId)) {
    e.preventDefault();
    toast('Dieser Eintrag ist (noch) nicht im Katalog.', 'warnung');
    return;
  }

  // Innerhalb eines Fensters bleibt die Kette im Fenster — ein Sprung in die Liste dahinter
  // würde den gerade gelesenen Zusammenhang wegreißen.
  if (imFenster) { e.preventDefault(); zeigeDetail(zielId); return; }

  const zielEl = document.getElementById('karte-' + zielId);
  if (zielEl) {
    merkeHerkunft(vonId);
    blinke(zielEl);               // der <a href="#karte-…"> springt von allein
    aktualisiereZurueck();
    return;
  }

  e.preventDefault();
  merkeHerkunft(vonId);
  zeigeDetail(zielId, false);
}

/** Öffnet ein Plugin als vollständige Karte im Fenster, ohne die Liste dahinter anzufassen. */
function zeigeDetail(id, mitHerkunft = true) {
  const p = index.get(id);
  if (!p) { toast('Dieser Eintrag ist (noch) nicht im Katalog.', 'warnung'); return; }
  if (mitHerkunft) merkeHerkunft(null);

  aktuellesDetail = id;
  const knoepfe = [];
  if (zurueckStapel.length) knoepfe.push({ text: '← Zurück', wert: 'zurueck' });
  knoepfe.push({ text: 'Schließen', wert: null });

  modal({ titel: escapeHtml(p.name), inhalt: kartenHTML(index, p, { detail: true, imKorb: imKorb(id) }), knoepfe })
    .then((wahl) => {
      if (wahl === 'zurueck') { geheZurueck(); return; }
      if (aktuellesDetail !== id) return;      // ein anderes Fenster hat inzwischen übernommen

      // ✕/Esc heißt „raus hier", nicht „einen Schritt zurück": zurück an die Stelle in der Liste,
      // von der die ganze Kette ausging.
      aktuellesDetail = null;
      const anfang = zurueckStapel.find((s) => s.typ === 'liste');
      zurueckStapel = [];
      aktualisiereZurueck();
      if (anfang) kehreZurListeZurueck(anfang);
    });

  aktualisiereZurueck();
}

/* ===================== Behebung, Mehrfachvergleich, Synergien ===================== */

/** „＋ setzen" aus dem Prüfbericht bzw. der Synergie-Liste. */
async function behebeFehlend(wert) {
  const [id, umgebung] = String(wert).split(':');
  const p = index.get(id);
  if (!p) return;
  schliesseModal();
  await hakenGesetzt(id, umgebung, true);
  toast(`${p.name} auf ${UMGEBUNG_LABEL[umgebung] || umgebung} gesetzt ✅`);
}

/** „⚖️ Alle N vergleichen" aus dem Ersetzt-Block: belegt den Korb mit der ganzen Gruppe. */
function zeigeMehrfachVergleich(ids) {
  vergleichsKorb = ids.filter((id) => index.has(id));
  zeichneListe();
  oeffneKorbVergleich();
}

/* ============================== Vergleichskorb ============================== */

/**
 * EIN gemeinsames Vergleichs-Set statt mehrerer Wege, die sich gegenseitig überschreiben.
 * Gefüllt wird es auf drei Arten: ⚖️ auf einer Karte (öffnet zugleich das Fenster), die
 * Auswahlliste im Fenster, oder „Alle N vergleichen" aus dem Ersetzt-Block.
 *
 * Bewusst nur im Arbeitsspeicher, nicht im localStorage: der Korb ist Arbeitszustand wie Suche
 * und Filter (D8-Gedanke), kein Teil des Plans, den der Nutzer aufbewahren will.
 */
let vergleichsKorb = [];
let korbSuche = '';
let ziehtGerade = false;

const KORB_MAX_TREFFER = 60;

function imKorb(id) { return vergleichsKorb.includes(id); }

function korbHinzufuegen(id) {
  if (!index.has(id) || imKorb(id)) return false;
  vergleichsKorb.push(id);
  zeichneListe();
  frischeKorbFensterAuf();
  return true;
}

function korbEntfernen(id) {
  vergleichsKorb = vergleichsKorb.filter((x) => x !== id);
  zeichneListe();
  frischeKorbFensterAuf();
}

function korbLeeren() {
  vergleichsKorb = [];
  zeichneListe();
  frischeKorbFensterAuf();
}

/** Die angedockte Leiste. Beim Ziehen erscheint sie auch leer — sonst gäbe es kein sichtbares Ziel. */
function zeichneKorbleiste() {
  const el = document.getElementById('korbleiste');
  if (!el) return;

  if (!vergleichsKorb.length && !ziehtGerade) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;

  const chips = vergleichsKorb.map((id) => {
    const p = index.get(id);
    return `<span class="korb-chip">${escapeHtml(p ? p.name : id)}
      <button type="button" class="korb-weg" data-korb-weg="${escapeHtml(id)}" aria-label="Entfernen">✕</button></span>`;
  }).join('');

  el.innerHTML = `<span class="korb-titel">⚖️ Vergleich</span>
    <div class="korb-chips">${chips || '<span class="korb-leer">⚖️ einer Karte hierher ziehen</span>'}</div>
    <button type="button" class="btn btn-klein" data-korb-oeffnen="1" ${vergleichsKorb.length ? '' : 'disabled'}>Öffnen (${vergleichsKorb.length})</button>
    <button type="button" class="btn btn-klein btn-leise" data-korb-leeren="1">leeren</button>`;
}

/* ------------------------------ Das Fenster ------------------------------ */

function oeffneKorbVergleich() {
  aktuellesDetail = null;        // der Vergleich ist kein Glied der Detail-Kette
  korbSuche = '';
  modal({
    titel: '⚖️ Vergleich',
    klasse: 'modal-breit',
    inhalt: `<div class="korb-auswahl">
        <input type="search" id="korb-suche" class="feld" placeholder="🔍 Plugin suchen (Name, Funktion, Kategorie) …">
        <div class="korb-treffer" id="korb-treffer">${korbTrefferHTML()}</div>
      </div>
      <div id="korb-inhalt">${korbInhaltHTML()}</div>`,
    knoepfe: [{ text: 'Schließen', wert: null }]
  });

  const feld = document.getElementById('korb-suche');
  if (!feld) return;
  let tippTimer = null;
  feld.addEventListener('input', (e) => {
    clearTimeout(tippTimer);
    const wert = e.target.value;
    tippTimer = setTimeout(() => { korbSuche = wert; frischeKorbTrefferAuf(); }, 150);
  });
}

/**
 * Die Auswahlliste. Reihenfolge nach ausdrücklichem Wunsch: zuerst die Alternativen des ersten
 * Korb-Eintrags (also genau das, was auf der Karte unter „wird ersetzt durch" steht), danach
 * alles Übrige alphabetisch. Gesucht wird mit derselben Funktion wie in der Hauptsuche.
 */
function korbTrefferHTML() {
  const anker = vergleichsKorb.length ? index.get(vergleichsKorb[0]) : null;
  const alternativIds = new Set(anker ? alternativen(index, anker).map((p) => p.id) : []);

  const passend = plugins.filter((p) => passtSuche(p, korbSuche));
  const zuerst = passend.filter((p) => alternativIds.has(p.id));
  const rest = passend.filter((p) => !alternativIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const gesamt = [...zuerst, ...rest];

  if (!gesamt.length) return '<p class="hinweis-leise">Kein Plugin passt zu dieser Suche.</p>';

  const zeile = (p) => {
    const drin = imKorb(p.id);
    return `<button type="button" class="korb-treffer-zeile${drin ? ' korb-drin' : ''}"
      data-korb-${drin ? 'ab' : 'add'}="${escapeHtml(p.id)}">
      <span class="korb-zeichen">${drin ? '−' : '＋'}</span>
      <span class="korb-name">${escapeHtml(p.name)}</span>
      ${alternativIds.has(p.id) ? '<span class="korb-marke">Alternative</span>' : ''}
      <small>${escapeHtml(KATEGORIE_NAMEN.get(p.kategorie) || p.kategorie)}</small>
    </button>`;
  };

  const rest_hinweis = gesamt.length > KORB_MAX_TREFFER
    ? `<p class="hinweis-leise">… und ${gesamt.length - KORB_MAX_TREFFER} weitere — Suche verfeinern.</p>` : '';
  return gesamt.slice(0, KORB_MAX_TREFFER).map(zeile).join('') + rest_hinweis;
}

/**
 * Jedes gewählte Plugin steht als vollständige Karte da — wie in der normalen Liste, mit Badges,
 * Beschreibung, Meta und Abwägung. Die Vergleichstabelle kommt DARUNTER, nicht statt der Karten:
 * die Tabelle beantwortet „worin unterscheiden sie sich", die Karten „was ist das überhaupt".
 */
function korbInhaltHTML() {
  if (!vergleichsKorb.length) {
    return '<p class="hinweis-leise">Noch nichts gewählt — oben suchen und mit ＋ hinzufügen.</p>';
  }

  const karten = vergleichsKorb.map((id) => {
    const p = index.get(id);
    if (!p) return '';
    return `<div class="korb-karte">
      ${kartenHTML(index, p, { detail: true, ohneKorb: true })}
      <button type="button" class="btn btn-klein btn-leise" data-korb-ab="${escapeHtml(id)}">− aus dem Vergleich</button>
    </div>`;
  }).join('');

  const tabelle = vergleichsKorb.length >= 2
    ? mehrfachVergleichHTML(vergleicheMehrere(index, vergleichsKorb))
    : '<p class="hinweis-leise">Ab zwei Einträgen kommt hier die Vergleichstabelle dazu.</p>';

  return `<div class="korb-karten">${karten}</div>${tabelle}`;
}

function frischeKorbTrefferAuf() {
  const el = document.getElementById('korb-treffer');
  if (el) el.innerHTML = korbTrefferHTML();
}

function frischeKorbFensterAuf() {
  if (!document.getElementById('korb-inhalt')) return;   // Fenster ist gar nicht offen
  frischeKorbTrefferAuf();
  document.getElementById('korb-inhalt').innerHTML = korbInhaltHTML();
}

/** Was ließe sich zum aktuellen Stand noch sinnvoll dazunehmen? */
function zeigeSynergien(umgebung) {
  aktuellesDetail = null;
  const vorschlaege = ungenutzteSynergien(index, umgebung);
  const label = UMGEBUNG_LABEL[umgebung] || umgebung;

  if (!vorschlaege.length) {
    return hinweis({ titel: `🔗 Synergien (${label})`, inhalt: '<p>Zum aktuellen Stand gibt es nichts Offenes.</p>' });
  }

  const punkte = (klasse, eintraege) => eintraege.length
    ? `<ul class="${klasse}">${eintraege.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` : '';

  const zeile = (v) => {
    const gruende = v.gruende.map((g) => `<li>${g.art === 'synergie' ? '🔗 Synergie mit' : '➕ Ergänzt sich mit'}
      <strong>${escapeHtml(g.von.name)}</strong>${punkte('karte-plus', g.plus)}${punkte('karte-minus', g.minus)}</li>`).join('');
    return `<div class="synergie-vorschlag">
      <div class="synergie-kopf">
        ${berichtLink(v.ziel)}
        <button type="button" class="btn btn-klein" data-behebe="${escapeHtml(v.ziel.id)}:${escapeHtml(umgebung)}">＋ auf ${label} setzen</button>
      </div>
      ${v.ziel.beschreibung ? `<p>${escapeHtml(v.ziel.beschreibung)}</p>` : ''}
      <ul class="synergie-gruende">${gruende}</ul>
    </div>`;
  };

  modal({
    titel: `🔗 Ungenutzte Synergien (${label})`,
    inhalt: `<p class="hinweis-leise">Passt zu dem, was auf ${label} schon gesetzt ist. Bereits abgedeckte
             und archivierte Einträge stehen bewusst nicht in der Liste.</p>
             ${vorschlaege.map(zeile).join('')}`,
    knoepfe: [{ text: 'Schließen', wert: null }]
  });
}

/** F4/F5/F6 — Warner beim Haken setzen. */
async function hakenGesetzt(id, umgebung, wert) {
  setzeHaken(id, umgebung, wert);

  if (wert) {
    const plugin = index.get(id);
    const konflikte = aktiveKonflikte(index, plugin, umgebung);
    const fehlend = fehlendeAbhaengigkeiten(index, plugin, umgebung);
    const bundle = bundleHinweis(plugin);

    if (konflikte.length) {
      const weiter = await frage({
        titel: '⚠️ Konflikt',
        inhalt: `<p><strong>${escapeHtml(plugin.name)}</strong> sollte nicht parallel laufen mit:</p>
          <ul>${konflikte.map((k) => `<li>${escapeHtml(k.name)}</li>`).join('')}</ul>
          <p>Beides auf ${umgebung.toUpperCase()} zu installieren führt erfahrungsgemäß zu Problemen.</p>`,
        jaText: 'Trotzdem setzen', neinText: 'Rückgängig'
      });
      if (!weiter) setzeHaken(id, umgebung, false);
    }

    if (fehlend.length) {
      toast(`Fehlende Abhängigkeit: ${fehlend.map((f) => f.name).join(', ')}`, 'warnung');
    }
    if (bundle) {
      toast(`📦 ${plugin.name}: ${bundle}`, 'warnung');
    }
  }

  zeichneListe();
  frischeDetailAuf();
}

/**
 * Ein Haken im Detail-Fenster ändert auch Banner und abgeschwächte Schalter derselben Karte.
 * Ohne das Nachzeichnen bliebe im Fenster der Stand von vor dem Klick stehen.
 */
function frischeDetailAuf() {
  if (!aktuellesDetail) return;
  const inhalt = document.querySelector('.modal-huelle .modal-inhalt');
  const p = index.get(aktuellesDetail);
  if (inhalt && p) inhalt.innerHTML = kartenHTML(index, p, { detail: true, imKorb: imKorb(p.id) });
}

/* ================================== Vergleich ================================== */

/**
 * C1-C4 — Vergleich zweier Plugins.
 * Vorbelegt wird, was gerade sinnvoll ist: zwei Mitglieder derselben Funktionsgruppe, denn nur
 * dort entsteht ein echter Funktionsvergleich (Entscheidung D10). Gibt es keine solche Gruppe,
 * bleibt es bei den ersten beiden Einträgen und der Zweck-Ansicht.
 */
async function oeffneVergleich() {
  const auswaehlbar = plugins.slice().sort((a, b) => a.name.localeCompare(b.name, 'de'));
  if (auswaehlbar.length < 2) {
    return hinweis({ titel: '⚖️ Vergleich', inhalt: '<p>Dafür braucht es mindestens zwei Plugins im Katalog.</p>' });
  }

  const optionen = (ausgewaehlt) => auswaehlbar
    .map((p) => `<option value="${escapeHtml(p.id)}"${p.id === ausgewaehlt ? ' selected' : ''}>${escapeHtml(p.name)}</option>`).join('');

  const [vorA, vorB] = vorauswahl(auswaehlbar);

  // Ganze Gruppe statt Paar: sobald eine Funktionsgruppe drei oder mehr Anbieter hat — im Katalog
  // der Normalfall — ist "A oder B?" die falsche Frage.
  const gruppen = alleGruppen(index);
  const gruppenWahl = gruppen.length ? `
    <label class="vergleich-gruppenwahl">Ganze Funktionsgruppe:
      <select id="v-gruppe" class="feld">
        <option value="">— Zweiervergleich —</option>
        ${gruppen.map((g) => `<option value="${escapeHtml(g.gruppe)}">${escapeHtml(g.gruppe)} (${g.mitglieder.length})</option>`).join('')}
      </select>
    </label>` : '';

  const inhalt = `
    <p class="hinweis-leise">Liegen beide in derselben Funktionsgruppe, entsteht ein Funktionsvergleich —
       sonst werden Zweck und Funktionen nebeneinandergestellt, ohne Wertung.</p>
    ${gruppenWahl}
    <div class="vergleich-auswahl" id="v-paar">
      <select id="v-a" class="feld">${optionen(vorA)}</select>
      <select id="v-b" class="feld">${optionen(vorB)}</select>
    </div>
    <div id="v-ergebnis"></div>`;

  const fenster = modal({ titel: '⚖️ Vergleich', inhalt, knoepfe: [{ text: 'Schließen', wert: null }] });

  const gruppenFeld = document.getElementById('v-gruppe');
  const zeichneVergleich = () => {
    const gruppe = gruppenFeld ? gruppenFeld.value : '';
    const paar = document.getElementById('v-paar');
    const ergebnis = document.getElementById('v-ergebnis');

    if (gruppe) {
      paar.hidden = true;
      const ids = gruppenMitglieder(index, gruppe).map((p) => p.id);
      ergebnis.innerHTML = mehrfachVergleichHTML(vergleicheMehrere(index, ids));
      return;
    }
    paar.hidden = false;
    ergebnis.innerHTML = vergleichHTML(vergleiche(index, document.getElementById('v-a').value, document.getElementById('v-b').value));
  };

  if (gruppenFeld) gruppenFeld.addEventListener('change', zeichneVergleich);
  document.getElementById('v-a').addEventListener('change', zeichneVergleich);
  document.getElementById('v-b').addEventListener('change', zeichneVergleich);
  zeichneVergleich();

  await fenster;
}

/** Sucht zwei Plugins derselben Gruppe, damit der Vergleich gleich etwas Sinnvolles zeigt. */
function vorauswahl(liste) {
  const nachGruppe = new Map();
  for (const p of liste) {
    if (!p.gruppe) continue;
    if (!nachGruppe.has(p.gruppe)) nachGruppe.set(p.gruppe, []);
    nachGruppe.get(p.gruppe).push(p.id);
  }
  for (const mitglieder of nachGruppe.values()) {
    if (mitglieder.length >= 2) return [mitglieder[0], mitglieder[1]];
  }
  return [liste[0].id, liste[1].id];
}

/* ============================== Eigenes Plugin (H2) ============================== */

async function oeffneEigenesFormular() {
  const kategorien = KATEGORIEN.map((k) => `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)}</option>`).join('');
  const inhalt = `
    <div class="formular">
      <label>Name *<input id="e-name" class="feld"></label>
      <label>Kategorie *<select id="e-kategorie" class="feld">${kategorien}</select></label>
      <label>Ressourcen-Ordner<input id="e-ressource" class="feld" placeholder="wie im server.cfg, falls abweichend"></label>
      <label>Link<input id="e-link" class="feld" placeholder="https://…"></label>
      <label>Funktionsgruppe<input id="e-gruppe" class="feld" placeholder="z.B. inventar"></label>
      <label>Framework<select id="e-framework" class="feld">
        <option value="standalone">🌐 Standalone</option><option value="qbox_nativ">✅ Qbox nativ</option>
        <option value="qbcore_bridge">🔁 QBCore-Bridge</option><option value="qbcore_only">⛔ nur QBCore</option>
      </select></label>
      <label>Lizenz<select id="e-lizenz" class="feld">
        <option value="open_source">🔓 Open Source</option><option value="escrow">🔒 Escrow</option>
      </select></label>
      <label>Preis<input id="e-preis" class="feld" type="number" min="0" step="0.01" placeholder="leer = kostenlos"></label>
      <label>Preistyp<select id="e-preistyp" class="feld">
        <option value="einmalig">einmalig</option><option value="abo">monatlich</option>
      </select></label>
      <label class="formular-breit">Beschreibung<textarea id="e-beschreibung" rows="3" class="feld"></textarea></label>
    </div>`;

  const fenster = modal({
    titel: '➕ Eigenes Plugin hinzufügen',
    inhalt,
    knoepfe: [{ text: 'Abbrechen', wert: false }, { text: 'Speichern', art: 'gut', wert: true }]
  });

  // Die Eingaben werden laufend eingesammelt, solange das Fenster offen ist. Nach dem Schließen
  // ist das Modal aus dem DOM entfernt — dann wären die Felder über getElementById nicht mehr
  // erreichbar und alles käme leer an.
  const eingaben = {};
  const felder = {
    name: 'e-name', kategorie: 'e-kategorie', ressource: 'e-ressource', link: 'e-link',
    gruppe: 'e-gruppe', framework: 'e-framework', lizenz: 'e-lizenz',
    preisBetrag: 'e-preis', preisTyp: 'e-preistyp', beschreibung: 'e-beschreibung'
  };
  for (const [schluessel, id] of Object.entries(felder)) {
    const el = document.getElementById(id);
    eingaben[schluessel] = el.value;                                  // Vorbelegung der Auswahlfelder
    el.addEventListener('input', () => { eingaben[schluessel] = el.value; });
    el.addEventListener('change', () => { eingaben[schluessel] = el.value; });
  }

  const speichern = await fenster;
  if (!speichern) return;

  const erg = legeEigenesAn(eingaben, KATEGORIE_IDS);

  if (!erg.ok) { toast(erg.meldung, 'fehler'); return; }
  katalogAufbauen();
  zeichneListe();
  toast(`${erg.plugin.name} hinzugefügt ➕`);
}

/* ================================ Zahnrad-Menü ================================ */

async function oeffneZahnrad() {
  const info = differenzInfo();
  const inhalt = `
    <div class="menue">
      <button class="menue-punkt" data-tat="ensure-dev">📋 ensure-Liste DEV</button>
      <button class="menue-punkt" data-tat="ensure-main">📋 ensure-Liste MAIN</button>
      <hr>
      <button class="menue-punkt" data-tat="zustand-export">💾 Zustand exportieren</button>
      <button class="menue-punkt" data-tat="zustand-import">📂 Zustand importieren</button>
      <button class="menue-punkt" data-tat="katalog-import">📦 Katalog-Update importieren</button>
      <hr>
      <button class="menue-punkt" data-tat="backup-neu">🗄️ Backup anlegen</button>
      <button class="menue-punkt" data-tat="backup-liste">🗂️ Backups verwalten (${holeBackups().length})</button>
      <hr>
      <button class="menue-punkt" data-tat="reset-dev">↩️ DEV-Haken zurücksetzen</button>
      <button class="menue-punkt" data-tat="reset-main">↩️ MAIN-Haken zurücksetzen</button>
      <button class="menue-punkt" data-tat="reset-notizen">↩️ Notizen löschen</button>
      <button class="menue-punkt menue-gefahr" data-tat="reset-alles">🗑️ Alles zurücksetzen</button>
      ${info.anzahl ? `<hr><button class="menue-punkt menue-gefahr" data-tat="diff-verwerfen">🧹 Import-Differenz verwerfen (${info.anzahl} Einträge, ${info.lesbar})</button>` : ''}
    </div>`;

  const tat = await modal({ titel: '⚙️ Daten', inhalt, knoepfe: [{ text: 'Schließen', wert: null }] });
  if (tat) await fuehreAus(tat);
}

async function fuehreAus(tat) {
  switch (tat) {
    case 'ensure-dev': return zeigeEnsure('dev');
    case 'ensure-main': return zeigeEnsure('main');
    case 'zustand-export': {
      ladeHerunter(JSON.stringify(baueZustandsExport(), null, 2), 'qbox-planer-stand.json');
      return toast('Stand exportiert 💾');
    }
    case 'zustand-import': return zustandImportieren();
    case 'katalog-import': return katalogImportieren();
    case 'backup-neu': {
      const b = legeBackupAn();
      return toast(`Backup „${b.name}" angelegt 🗄️`);
    }
    case 'backup-liste': return zeigeBackups();
    case 'reset-dev': return zuruecksetzen('dev', 'Alle DEV-Haken');
    case 'reset-main': return zuruecksetzen('main', 'Alle MAIN-Haken');
    case 'reset-notizen': return zuruecksetzen('notizen', 'Alle Notizen');
    case 'reset-alles': return zuruecksetzen('alles', 'Haken, Notizen, Prioritäten und eigene Plugins');
    case 'diff-verwerfen': return diffVerwerfen();
  }
}

async function zuruecksetzen(was, beschreibung) {
  const ja = await frage({
    titel: '↩️ Zurücksetzen',
    inhalt: `<p>${escapeHtml(beschreibung)} werden zurückgesetzt.</p>
             <p>Vorher wird automatisch ein Sicherheits-Backup angelegt — rückgängig machen ist also möglich.</p>`,
    jaText: 'Zurücksetzen'
  });
  if (!ja) return;
  setzeZurueck(was);
  katalogAufbauen();
  zeichneListe();
  toast('Zurückgesetzt — ein Backup „vor Reset" liegt bereit.');
}

async function diffVerwerfen() {
  const ja = await frage({
    titel: '🧹 Import-Differenz verwerfen',
    inhalt: `<p>Alle per Import dazugekommenen Katalogeinträge werden entfernt.</p>
             <p>Deine Haken, Notizen und eigenen Plugins bleiben unangetastet — sie liegen getrennt davon.</p>`,
    jaText: 'Verwerfen'
  });
  if (!ja) return;
  verwirfDifferenz();
  katalogAufbauen();
  zeichneListe();
  toast('Import-Differenz verworfen 🧹');
}

function zeigeEnsure(umgebung) {
  const erg = baueEnsureListe(index, umgebung);
  const warnung = erg.fehlend.length
    ? `<p class="hinweis-rot">⚠️ Fehlende Abhängigkeiten stehen oben als Kommentar — erst nachholen!</p>` : '';
  return modal({
    titel: `📋 ensure-Liste (${umgebung.toUpperCase()})`,
    inhalt: `${warnung}<pre class="ensure-box" id="ensure-box">${escapeHtml(erg.text)}</pre>`,
    knoepfe: [
      { text: '📋 Kopieren', wert: 'kopieren' },
      { text: '⬇️ Als .cfg', wert: 'datei' },
      { text: 'Schließen', wert: null }
    ]
  }).then((wahl) => {
    if (wahl === 'kopieren') navigator.clipboard.writeText(erg.text).then(() => toast('Kopiert 📋'), () => toast('Kopieren nicht möglich', 'fehler'));
    if (wahl === 'datei') { ladeHerunter(erg.text, `ensure-${umgebung}.cfg`, 'text/plain'); toast('Heruntergeladen ⬇️'); }
  });
}

async function zeigeBackups() {
  const backups = holeBackups();
  if (!backups.length) return hinweis({ titel: '🗂️ Backups', inhalt: '<p>Noch keine Backups vorhanden.</p>' });

  const inhalt = `<div class="menue">${backups.map((b, i) => `
    <div class="backup-zeile">
      <span>${escapeHtml(b.name)}<small>${new Date(b.erstellt).toLocaleString('de-DE')}</small></span>
      <span><button class="btn btn-klein" data-tat="laden:${i}">Laden</button>
            <button class="btn btn-klein btn-gefahr" data-tat="loeschen:${i}">Löschen</button></span>
    </div>`).join('')}</div>`;

  const tat = await modal({ titel: '🗂️ Backups', inhalt, knoepfe: [{ text: 'Schließen', wert: null }] });
  if (!tat) return;

  const [was, iText] = String(tat).split(':');
  const i = Number(iText);
  if (was === 'laden') {
    const ja = await frage({ titel: 'Backup laden', inhalt: `<p>Aktueller Stand wird ersetzt. Vorher wird automatisch gesichert.</p>`, jaText: 'Laden' });
    if (ja && ladeBackup(i)) { katalogAufbauen(); zeichneListe(); toast('Backup geladen ↩️'); }
  } else if (was === 'loeschen') {
    loescheBackup(i);
    toast('Backup gelöscht');
  }
}

/* =================================== Importe =================================== */

async function zustandImportieren() {
  const datei = await waehleDatei('.json');
  if (!datei) return;

  const erg = leseZustandsDatei(datei.text, datei.name);
  if (!erg.ok) return hinweis({ titel: '⚠️ Import nicht möglich', inhalt: `<pre class="fehler-box">${escapeHtml(erg.meldung)}</pre>` });

  const ja = await frage({ titel: '📂 Zustand importieren', inhalt: '<p>Dein aktueller Stand wird ersetzt. Vorher wird automatisch ein Backup angelegt.</p>', jaText: 'Importieren' });
  if (!ja) return;

  uebernimmZustand(erg.daten);
  katalogAufbauen();
  zeichneListe();
  toast('Zustand importiert 📂');
}

async function katalogImportieren() {
  const datei = await waehleDatei('.json');
  if (!datei) return;

  const erg = baueKatalogVorschau({
    text: datei.text, dateiname: datei.name,
    schema: daten.schema, kategorienIds: KATEGORIE_IDS, plugins
  });

  // E4 — nie "ungültige Datei", sondern Fundstelle im Klartext.
  if (!erg.ok) return hinweis({ titel: '⚠️ Import nicht möglich', inhalt: `<pre class="fehler-box">${escapeHtml(erg.meldung)}</pre>` });

  const v = erg.vorschau;
  const uebernehmen = await modal({ titel: '📦 Import-Vorschau', inhalt: vorschauHTML(v), knoepfe: [
    { text: 'Abbrechen', wert: false },
    { text: `Übernehmen (${vorschauZusammenfassung(v)})`, art: 'gut', wert: true }
  ] });

  if (!uebernehmen) return toast('Import abgebrochen — nichts übernommen.');

  const ergebnis = wendeVorschauAn(v, plugins);
  plugins = ergebnis.plugins;
  index = baueIndex(plugins);
  katalogAufbauen();
  zeichneListe();

  if (!ergebnis.gesichert.ok) hinweis({ titel: '⚠️ Nicht dauerhaft gespeichert', inhalt: `<p>${escapeHtml(ergebnis.gesichert.meldung)}</p>` });
  else if (ergebnis.gesichert.warnung) toast(ergebnis.gesichert.warnung, 'warnung');
  else toast(`Import übernommen: ${vorschauZusammenfassung(v)} ✅`);
}

/** E8 + E9 — Änderungsliste mit hervorgehobener Warnung für bereits gehakte Plugins. */
function vorschauHTML(v) {
  const warnungen = v.warnungen.length ? `
    <div class="vorschau-warnung">
      <strong>⚠️ Achtung — betrifft Plugins, die du bereits gesetzt hast:</strong>
      ${v.warnungen.map((w) => `
        <div class="vorschau-warnung-zeile">
          <strong>${escapeHtml(w.name)}</strong> (${w.umgebungen.map((u) => u.toUpperCase()).join(' + ')})
          <ul>${w.gruende.map((g) => `<li>${escapeHtml(g.text)}${g.nachfolger ? ` <em>Nachfolger: ${escapeHtml(g.nachfolger)}</em>` : ''}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>` : '';

  const neu = v.neu.length ? `<h4>Neu (${v.neu.length})</h4><ul>${v.neu.map((p) => `<li>${escapeHtml(p.name)}</li>`).join('')}</ul>` : '';
  const geaendert = v.aktualisiert.length ? `<h4>Aktualisiert (${v.aktualisiert.length})</h4><ul>${v.aktualisiert.map((a) => `
    <li><strong>${escapeHtml(a.neu.name)}</strong>${a.grund ? ` — ${escapeHtml(a.grund)}` : ''}
      <small>Felder: ${escapeHtml(a.felder.join(', '))}</small></li>`).join('')}</ul>` : '';
  const gleich = v.unveraendert.length ? `<p><small>${v.unveraendert.length} Einträge unverändert.</small></p>` : '';
  const hinweise = v.hinweise.length ? `<details><summary>${v.hinweise.length} Hinweise</summary><ul>${v.hinweise.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul></details>` : '';

  return `<p><strong>${escapeHtml(v.dateiname)}</strong>${v.catalogVersion ? ` · Katalog v${escapeHtml(v.catalogVersion)}` : ''}${v.runde != null ? ` · Runde ${v.runde}` : ''}</p>
    ${warnungen}${neu}${geaendert}${gleich}${hinweise}
    <p class="hinweis-leise">Deine Haken, Notizen und Prioritäten bleiben unverändert.</p>`;
}

/* ==================================== Start ==================================== */

ladeZustand();
ladeDifferenz();
katalogAufbauen();
baueGeruest();
verdrahteGlobal();
zeichneListe();
