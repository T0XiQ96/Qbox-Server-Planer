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
import { ladeZustand, istGehakt, setzeHaken, setzeNotiz, setzePrioritaet, setzeZurueck, legeBackupAn, holeBackups, ladeBackup, loescheBackup, benenneBackupUm, holeAnsicht, setzeAnsicht } from './state.js';
import { baueIndex, aktiveKonflikte, fehlendeAbhaengigkeiten, bundleHinweis, alleGruppen, gruppenMitglieder, alternativen } from './relations.js';
import { kartenHTML, escapeHtml } from './render.js';
import { leererFilter, gefilterteUndSortierteListe, holeAktiveSortierung, setzeAktiveSortierung, SORTIER_OPTIONEN, passtSuche, gruppenMitAnzahl, OHNE_GRUPPE } from './filters.js';
import { vergleicheMehrere, mehrfachVergleichHTML } from './compare.js';
import { berichtBeiderUmgebungen, berichtZusammenfassung, warnIds, synergienBeiderUmgebungen, ungenutzteSynergien, UMGEBUNG_LABEL } from './warnings.js';
import { wissenSeiteHTML, wissenNavHTML } from './wissen.js';
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
        <button class="btn" id="btn-wissen">📖 Wissen</button>
        <button class="btn" id="btn-eigenes">➕ Eigenes Plugin</button>
        <button class="btn" id="btn-vergleich">⚖️ Vergleich</button>
        <button class="btn" id="btn-zahnrad">⚙️ Daten</button>
      </div>
      <div class="korbleiste" id="korbleiste"></div>
    </header>

    <details class="warnbox" id="warnbox">
      <summary><strong>⚠️ Qbox ↔ QBCore — worauf es ankommt</strong></summary>
      <ul>
        <li>Qbox bringt eine QBCore-Bridge mit. Standard-Exports werden übersetzt, <em>aber</em> nicht jeder Zugriff.</li>
        <li>Bricht trotz Bridge: harte Abhängigkeit auf <code>qb-inventory</code> oder <code>qb-target</code> (Qbox nutzt <code>ox_inventory</code>/<code>ox_target</code>).</li>
        <li>Bricht ebenfalls: Eingriffe in interne <code>qb-core</code>-Player-Funktionen und eigene SQL-Abfragen auf qb-Tabellen.</li>
        <li><code>ox_core</code> und <code>ox_mdt</code> sind <strong>nicht</strong> Qbox-kompatibel — <code>ox_lib</code>, <code>ox_inventory</code>, <code>ox_target</code>, <code>ox_doorlock</code> schon.</li>
        <li>Ein ⚠️-Badge nennt im Tooltip immer den Beleggrad: <em>bestätigt</em> oder <em>Vermutung</em>.</li>
      </ul>
    </details>

    <div id="pruefbericht"></div>

    <div class="kosten" id="kosten"></div>

    <div class="werkzeugleiste">
      <input type="search" id="f-suche" class="feld feld-suche" placeholder="🔍 Suchen (Name, Funktion, Kategorie) …">
      <select id="f-kategorie" class="feld"></select>
      <select id="f-gruppe" class="feld"></select>
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

    <div id="wissen-seite">
      <div class="wissen-kopf">
        <input type="search" id="wissen-suche" class="feld feld-suche" placeholder="🔍 Im Wissen suchen …">
        <span class="wissen-zaehler" id="wissen-zaehler"></span>
      </div>
      <div id="wissen-nav"></div>
      <div id="wissen-inhalt"></div>
    </div>

    <button class="btn zurueck-knopf" id="btn-zurueck" hidden></button>`;

  const kat = document.getElementById('f-kategorie');
  kat.innerHTML = '<option value="">Kategorie: alle</option>' +
    KATEGORIEN.map((k) => `<option value="${escapeHtml(k.id)}">${escapeHtml(k.name)}</option>`).join('');

  fuelleGruppenFilter();

  document.getElementById('chips').innerHTML = BADGE_CHIPS
    .map(([id, text]) => `<button class="chip" data-badge="${id}">${text}</button>`).join('');

  document.getElementById('f-sortierung').value = holeAktiveSortierung();
  verdrahteWarnbox();
  aktualisiereKopf();
  verdrahteWerkzeugleiste();
}

/**
 * H1 — die Warnbox merkt sich, ob sie zugeklappt war.
 *
 * Mit einer Ausnahme: Kommt mit einem Update neuer Inhalt dazu, klappt sie einmalig wieder auf.
 * Sonst hätte jemand, der sie vor einem halben Jahr zugeklappt hat, die neue Warnung nie gesehen —
 * und genau dafür ist der Kasten da. Die Marke unten wird bei JEDER inhaltlichen Änderung erhöht.
 */
const WARNBOX_INHALT_VERSION = 1;

function verdrahteWarnbox() {
  const box = document.getElementById('warnbox');
  if (!box) return;

  const gemerkt = holeAnsicht('warnbox') || {};
  const inhaltIstNeu = gemerkt.version !== WARNBOX_INHALT_VERSION;

  box.open = inhaltIstNeu ? true : !gemerkt.zu;
  // Die neue Marke sofort festhalten, sonst klappt der Kasten bei jedem Neuladen wieder auf.
  if (inhaltIstNeu) setzeAnsicht('warnbox', { zu: false, version: WARNBOX_INHALT_VERSION });

  box.addEventListener('toggle', () => {
    setzeAnsicht('warnbox', { zu: !box.open, version: WARNBOX_INHALT_VERSION });
  });
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

/**
 * Ein Verweis, der den VERGLEICH öffnet statt zur Karte zu springen.
 *
 * Bewusst sichtbar anders als `berichtLink()`: überall sonst führt ein Pluginname zur Karte, hier
 * führt er zu zwei Karten nebeneinander. Zwei gleich aussehende Verweise mit verschiedenem
 * Verhalten wären eine Falle, deshalb das ⚖️ davor.
 *
 * `data-vergleich-ids` ist bereits verdrahtet (siehe verdrahteGlobal) und belegt den
 * Vergleichskorb in genau dieser Reihenfolge — die erste ID steht links.
 */
function vergleichsVerweis(ids, beschriftung) {
  const eindeutig = [...new Set(ids)];
  return `<button type="button" class="bericht-partner"
    data-vergleich-ids="${escapeHtml(eindeutig.join(','))}"
    title="Beide nebeneinander ansehen">⚖️ ${escapeHtml(beschriftung)}</button>`;
}

function fundHTML(f) {
  // Eine Warnung ohne Weg zur Behebung ist eine halbe Warnung: fehlt eine Abhängigkeit, steht der
  // Haken direkt daneben statt irgendwo weiter unten in der Liste.
  const behebung = f.behebung
    ? `<button type="button" class="btn btn-klein bericht-behebe"
         data-behebe="${escapeHtml(f.behebung.id)}:${escapeHtml(f.behebung.umgebung)}">＋ setzen</button>`
    : '';

  // Der Fundtext trägt an der Stelle des Partners den Platzhalter {partner} (warnings.js).
  // Nur die Literalteile werden escapt, dazwischen kommt der gerenderte Verweis — sonst stünde
  // der Partnername als toter Text im Satz, obwohl das Objekt in f.partner längst vorliegt.
  let textHtml;
  if (f.partner[0] && f.text.includes('{partner}')) {
    const [vor, nach = ''] = f.text.split('{partner}');
    // Links das Plugin mit dem Problem, rechts der Partner.
    textHtml = escapeHtml(vor) + vergleichsVerweis([f.plugin.id, f.partner[0].id], f.partner[0].name) + escapeHtml(nach);
  } else {
    textHtml = escapeHtml(f.text);
  }

  return `<li class="bericht-fund bericht-${f.stufe}">
    <span class="bericht-zeichen">${STUFEN_ZEICHEN[f.stufe]}</span>
    <span class="bericht-text">${berichtLink(f.plugin)} — ${textHtml}</span>
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

/**
 * Das Auswahlfeld der Funktionsgruppen. Es entsteht aus den Daten, nie aus einer gepflegten Liste —
 * jede Recherche-Runde bringt neue Gruppen, und ein neues Plugin darf `src/` nicht anfassen müssen.
 * Deshalb auch nach einem Import erneut aufgerufen: der mitgebrachte Katalog kann Gruppen enthalten,
 * die der eingebaute nicht kennt.
 *
 * Die Mitgliederzahl steht mit dabei, weil sie die eigentliche Frage beantwortet: „lohnt sich hier
 * ein Vergleich?" — bei (1) gibt es nichts abzuwägen.
 */
function fuelleGruppenFilter() {
  const feld = document.getElementById('f-gruppe');
  if (!feld) return;                       // beim Start noch kein Gerüst — baueGeruest() holt es nach

  const vorher = feld.value;               // eine laufende Auswahl darf ein Import nicht wegräumen
  const gruppen = gruppenMitAnzahl(plugins);
  const ohne = plugins.filter((p) => !p.gruppe).length;

  feld.innerHTML = '<option value="">Funktionsgruppe: alle</option>'
    + gruppen.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.id)} (${g.anzahl})</option>`).join('')
    + (ohne ? `<option value="${OHNE_GRUPPE}">— ohne Gruppe (${ohne})</option>` : '');

  // Nur zurücksetzen, wenn die vorher gewählte Gruppe im neuen Katalog wirklich weg ist.
  const gibtsNoch = [...feld.options].some((o) => o.value === vorher);
  feld.value = gibtsNoch ? vorher : '';
  if (!gibtsNoch && filter.gruppe) filter.gruppe = '';
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
  binde('f-gruppe', 'gruppe');
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
    // Ohne das schlägt eine noch laufende Entprellung NACH dem Zurücksetzen zu und holt den
    // gerade geleerten Suchbegriff zurück: Feld leer, Liste trotzdem gefiltert.
    clearTimeout(sucheTimer);
    filter = leererFilter();
    document.getElementById('f-suche').value = '';
    for (const id of ['f-kategorie', 'f-gruppe', 'f-status', 'f-qualitaet']) {
      document.getElementById(id).value = (id === 'f-kategorie' || id === 'f-gruppe') ? '' : 'alle';
    }
    document.getElementById('f-essenziell').checked = false;
    document.getElementById('f-diff').checked = false;
    document.getElementById('f-warnungen').checked = false;
    zeichneListe();
    toast('Suche und Filter zurückgesetzt — deine Haken sind unberührt.');
  });

  document.getElementById('btn-zurueck').addEventListener('click', geheZurueck);

  document.getElementById('btn-wissen').addEventListener('click', () => zeigeWissen(!wissenSichtbar));

  let wissenTimer = null;
  document.getElementById('wissen-suche').addEventListener('input', (e) => {
    clearTimeout(wissenTimer);
    const wert = e.target.value;
    wissenTimer = setTimeout(() => { wissenSuche = wert; zeichneWissen(); }, 150);
  });

  document.getElementById('btn-zahnrad').addEventListener('click', oeffneZahnrad);
  document.getElementById('btn-eigenes').addEventListener('click', oeffneEigenesFormular);
  // Der Kopf-Knopf öffnet dasselbe Fensterlayout wie ⚖️ auf einer Karte, aber eine EIGENE,
  // gemerkte Auswahl (kopfZustand) — Funktionsgruppen-Wahl und Suchtreffer hier landen nie im
  // Korb/Drag&Drop-Verlauf. Schließen und neu Öffnen zeigt wieder denselben Stand.
  document.getElementById('btn-vergleich').addEventListener('click', () => {
    aktivesVergleichsZiel = kopfZustand;
    oeffneVergleichsFenster();
  });
}

/* ============================== Wissens-Datenbank ============================== */

/**
 * Eigene Ansicht statt eines weiteren Kastens auf der Startseite: 13 Kategorien passen nicht
 * mehr nebenbei in die Plugin-Liste. Umgeschaltet wird über eine Klasse am <body>, damit das
 * Ein- und Ausblenden vollständig in style.css steht und keine Elementliste im Code gepflegt
 * werden muss, die bei jedem neuen Baustein nachgezogen werden müsste.
 */
const WISSEN = daten.wissen || { kategorien: [], artikel: [] };
let wissenSichtbar = false;
let wissenSuche = '';

function zeigeWissen(an) {
  wissenSichtbar = an;
  document.body.classList.toggle('ansicht-wissen', an);
  document.getElementById('btn-wissen').textContent = an ? '📚 Zur Plugin-Liste' : '📖 Wissen';
  if (an) {
    zeichneWissen();
    window.scrollTo({ top: 0 });
  }
}

function zeichneWissen() {
  document.getElementById('wissen-nav').innerHTML = wissenSuche ? '' : wissenNavHTML(WISSEN);
  document.getElementById('wissen-inhalt').innerHTML = wissenSeiteHTML(WISSEN, index, wissenSuche);

  const gesamt = (WISSEN.artikel || []).length;
  const offen = (WISSEN.artikel || []).filter((a) => a.qualitaet === 'ungeprueft').length;
  document.getElementById('wissen-zaehler').textContent =
    `${gesamt} Artikel · ${offen} noch ungeprüft`;
}

/** „Siehe auch" springt innerhalb der Wissensseite und klappt das Ziel auf. */
function springeZuWissen(id) {
  if (!wissenSichtbar) zeigeWissen(true);
  if (wissenSuche) {                       // sonst ist das Ziel womöglich gerade ausgefiltert
    wissenSuche = '';
    document.getElementById('wissen-suche').value = '';
    zeichneWissen();
  }
  const ziel = document.getElementById('wissen-' + id);
  if (!ziel) { toast('Dieser Artikel ist (noch) nicht vorhanden.', 'warnung'); return; }
  ziel.open = true;
  ziel.scrollIntoView({ block: 'center', behavior: 'smooth' });
  blinke(ziel);
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

    // ⚖️ auf der Karte: einfacher Klick legt IMMER in den Korb (nie in die Kopf-Auswahl) UND
    // öffnet das an den Korb gebundene Fenster — bewusst kein Long-Press, der wäre unsichtbar,
    // ohne Zustandsanzeige und kollidiert mit dem Markieren von Text.
    const korb = e.target.closest('[data-korb]');
    if (korb) {
      e.preventDefault();
      korbZustand.add(korb.dataset.korb);
      zeichneListe();
      aktivesVergleichsZiel = korbZustand;
      oeffneVergleichsFenster();
      return;
    }

    // Treffer aus der Suchliste bzw. „− aus dem Vergleich" auf einer Karte im Fenster: beide
    // wirken auf das GERADE OFFENE Fenster — den Korb, wenn er es geöffnet hat, die Kopf-Auswahl,
    // wenn die es geöffnet hat, oder das einmalige Set bei „Alle N vergleichen".
    const korbAdd = e.target.closest('[data-korb-add]');
    if (korbAdd) {
      e.preventDefault();
      aktivesVergleichsZiel.add(korbAdd.dataset.korbAdd);
      if (aktivesVergleichsZiel === korbZustand) zeichneListe();
      frischeVergleichsFensterAuf();
      return;
    }

    const korbAb = e.target.closest('[data-korb-ab]');
    if (korbAb) {
      e.preventDefault();
      aktivesVergleichsZiel.entferne(korbAb.dataset.korbAb);
      if (aktivesVergleichsZiel === korbZustand) zeichneListe();
      frischeVergleichsFensterAuf();
      return;
    }

    // Ein Chip in der angedockten Leiste gehört immer zum Korb, unabhängig davon, welches
    // Fenster gerade offen ist.
    const korbWeg = e.target.closest('[data-korb-weg]');
    if (korbWeg) {
      e.preventDefault();
      korbZustand.entferne(korbWeg.dataset.korbWeg);
      zeichneListe();
      if (aktivesVergleichsZiel === korbZustand) frischeVergleichsFensterAuf();
      return;
    }

    if (e.target.closest('[data-korb-oeffnen]')) {
      e.preventDefault();
      aktivesVergleichsZiel = korbZustand;
      oeffneVergleichsFenster();
      return;
    }
    if (e.target.closest('[data-korb-leeren]')) {
      e.preventDefault();
      korbZustand.leeren();
      zeichneListe();
      if (aktivesVergleichsZiel === korbZustand) frischeVergleichsFensterAuf();
      return;
    }

    // „🧹 Auswahl leeren" IM Fenster: leert nur, woran das offene Fenster gerade hängt — bei
    // einem einmaligen Set aus „Alle N vergleichen" ist das ohne Wirkung auf Korb oder Kopf.
    if (e.target.closest('[data-fenster-leeren]')) {
      e.preventDefault();
      aktivesVergleichsZiel.leeren();
      if (aktivesVergleichsZiel === korbZustand) zeichneListe();
      frischeVergleichsFensterAuf();
      return;
    }

    const wissenZiel = e.target.closest('[data-wissen-ziel]');
    if (wissenZiel) { e.preventDefault(); springeZuWissen(wissenZiel.dataset.wissenZiel); return; }

    const sprung = e.target.closest('[data-jump-id]');
    if (sprung) {
      // Ein Plugin-Verweis aus einem Wissens-Artikel führt zurück in die Liste — sonst zeigt
      // der Anker auf eine Karte, die in dieser Ansicht gar nicht sichtbar ist.
      if (wissenSichtbar) zeigeWissen(false);
      behandleSprung(e, sprung);
    }
  });

  verdrahteZiehen();
}

/**
 * Drag&Drop als ZUSATZweg neben dem Klick — nie als einziger: auf Touch-Geräten gibt es kein
 * echtes HTML5-Ziehen, dort bleibt der Klickweg. Die Leiste klebt oben am Kopf und ist immer da,
 * das Ablageziel liegt also nie außerhalb des Sichtfelds.
 *
 * Wichtig: Während eines laufenden Zuges wird hier NICHTS neu gezeichnet. `korb-bereit` und
 * `korb-drueber` sind reine Rahmenfarben (style.css) — sie ändern nur die Darstellung, nicht das
 * Layout. Ein Neuzeichnen der Leiste im `dragstart` hat den Zug vorher abgebrochen, weil es die
 * Seite unter dem Cursor verschob (siehe zeichneKorbleiste).
 */
function verdrahteZiehen() {
  const leiste = document.getElementById('korbleiste');

  document.addEventListener('dragstart', (e) => {
    const knopf = e.target.closest('[data-korb]');
    if (!knopf) return;
    e.dataTransfer.setData('text/plain', knopf.dataset.korb);
    e.dataTransfer.effectAllowed = 'copy';
    leiste.classList.add('korb-bereit');
  });

  document.addEventListener('dragend', () => {
    leiste.classList.remove('korb-bereit', 'korb-drueber');
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
    // Ziehen legt IMMER in den Korb — das ist per Definition „der Drag&Drop-Verlauf", nie in die
    // Kopf-Auswahl.
    if (korbZustand.add(id)) {
      zeichneListe();
      if (aktivesVergleichsZiel === korbZustand) frischeVergleichsFensterAuf();
      toast(`${p.name} liegt im Vergleich ⚖️`);
    } else if (p) toast(`${p.name} liegt dort schon.`);
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

/**
 * „⚖️ Alle N vergleichen" aus dem Ersetzt-Block, sowie die ⚖️-Verweise im Prüfbericht und bei
 * den Synergien: ein einmaliger Blick auf genau dieses Set. Bewusst NICHT der Korb und NICHT die
 * Kopf-Auswahl — beide sind eigene, gemerkte Zustände, und ein Klick auf „braucht X" soll weder
 * die eine noch die andere überschreiben. Deshalb ein frischer, nirgends gespeicherter Zustand,
 * der mit dem Schließen des Fensters wieder verschwindet.
 */
function zeigeMehrfachVergleich(ids) {
  aktivesVergleichsZiel = erzeugeVergleichsZustand();
  aktivesVergleichsZiel.ersetze(ids);
  oeffneVergleichsFenster();
}

/* ============================== Vergleich: zwei getrennte Zustände ============================== */

/**
 * Zwei UNABHÄNGIGE Vergleichs-Sets statt einem gemeinsamen (Korrektur zu D23):
 *
 *   korbZustand — gefüllt AUSSCHLIESSLICH durch ⚖️ auf einer Karte (Klick oder Zug). Sichtbar als
 *                 angedockte Leiste im Kopf, das ist „der Drag&Drop-Verlauf".
 *   kopfZustand — gefüllt über das ⚖️-Vergleichsfenster im Kopf (Funktionsgruppen-Auswahl,
 *                 Such-Treffer). Bleibt erhalten, wenn das Fenster geschlossen und neu geöffnet
 *                 wird — „wo man war" steht dann wieder da, ohne dass die Kopf-Auswahl den
 *                 Korb anfasst oder umgekehrt.
 *
 * `aktivesVergleichsZiel` zeigt auf den Zustand, an dem das gerade offene Fenster hängt — beide
 * Fenster nutzen dieselbe Darstellung (korbTrefferHTML/korbInhaltHTML), nur das Ziel wechselt.
 * Ein dritter, namenloser Zustand entsteht bei jedem Klick auf „Alle N vergleichen" u.ä.
 * (siehe zeigeMehrfachVergleich) — der ist bewusst nicht benannt, weil er nirgends aufgehoben wird.
 *
 * Alles nur im Arbeitsspeicher, nicht im localStorage: Vergleichszustände sind Arbeitszustand wie
 * Suche und Filter (D8-Gedanke), kein Teil des Plans, den der Nutzer aufbewahren will.
 */
function erzeugeVergleichsZustand() {
  let ids = [];
  return {
    ids: () => ids,
    hat: (id) => ids.includes(id),
    add(id) {
      if (!index.has(id) || ids.includes(id)) return false;
      ids.push(id);
      return true;
    },
    entferne(id) { ids = ids.filter((x) => x !== id); },
    ersetze(neue) { ids = [...new Set(neue)].filter((id) => index.has(id)); },
    leeren() { ids = []; }
  };
}

const korbZustand = erzeugeVergleichsZustand();
const kopfZustand = erzeugeVergleichsZustand();
let aktivesVergleichsZiel = korbZustand;

let korbSuche = '';

/** Nur für die Karten-Anzeige (aktiver Rahmen ums ⚖️): zeigt IMMER den Korb, nie die Kopf-Auswahl. */
function imKorb(id) { return korbZustand.hat(id); }

/**
 * Die angedockte Leiste — IMMER sichtbar, auch leer.
 *
 * Vorher blendete sie sich erst beim Ziehbeginn ein. Das hatte zwei Fehler, die zusammen dazu
 * führten, dass sich in eine leere Liste nichts ziehen ließ (nur in eine bereits gefüllte):
 *
 *  1. `el.hidden` wirkte nie. `[hidden] { display: none }` steht im Browser-Stylesheet, unser
 *     `.korbleiste { display: flex }` in style.css — und eine Autoren-Regel schlägt die
 *     Browser-Regel unabhängig von der Spezifität. Die leere Leiste stand also immer da, nur mit
 *     leerem Inhalt: ein 18px hoher, unsichtbarer Streifen.
 *  2. Beim `dragstart` wuchs sie von 18px auf 42px. Sie sitzt im Kopf, also rutschte die ganze
 *     Liste darunter im selben Moment 24px nach unten — mitsamt der Karte, an der der Cursor
 *     gerade zog. Ein Ablageziel, das erst beim Zielen entsteht und dabei alles verschiebt, ist
 *     keines. War schon etwas drin, war die Leiste vorher so hoch wie nachher, es sprang nichts,
 *     und es funktionierte — genau das beobachtete Verhalten.
 *
 * Eine Leiste mit fester Höhe kostet eine Zeile im Kopf und ist dafür ein verlässliches Ziel, das
 * man sieht, BEVOR man zieht. Der Hinweistext macht den Zugweg nebenbei überhaupt erst auffindbar.
 */
function zeichneKorbleiste() {
  const el = document.getElementById('korbleiste');
  if (!el) return;

  const drin = korbZustand.ids();

  const chips = drin.map((id) => {
    const p = index.get(id);
    return `<span class="korb-chip">${escapeHtml(p ? p.name : id)}
      <button type="button" class="korb-weg" data-korb-weg="${escapeHtml(id)}" aria-label="Entfernen">✕</button></span>`;
  }).join('');

  el.innerHTML = `<span class="korb-titel">⚖️ Vergleich</span>
    <div class="korb-chips">${chips || '<span class="korb-leer">⚖️ einer Karte hierher ziehen</span>'}</div>
    <button type="button" class="btn btn-klein" data-korb-oeffnen="1" ${drin.length ? '' : 'disabled'}>Öffnen (${drin.length})</button>
    <button type="button" class="btn btn-klein btn-leise" data-korb-leeren="1" ${drin.length ? '' : 'disabled'}>leeren</button>`;
}

/* ------------------------------ Das Fenster ------------------------------ */

/** Öffnet das Vergleichsfenster, gebunden an `aktivesVergleichsZiel` — welchen Zustand das ist, legt der Aufrufer vorher fest. */
function oeffneVergleichsFenster() {
  aktuellesDetail = null;        // der Vergleich ist kein Glied der Detail-Kette
  korbSuche = '';
  modal({
    titel: '⚖️ Vergleich',
    klasse: 'modal-breit',
    inhalt: `<div class="korb-auswahl">
        <div class="korb-auswahl-kopf">
          ${korbGruppenWahlHTML()}
          <button type="button" class="btn btn-klein btn-leise" data-fenster-leeren="1">🧹 Auswahl leeren</button>
        </div>
        <input type="search" id="korb-suche" class="feld" placeholder="🔍 Plugin suchen (Name, Funktion, Kategorie) …">
        <div class="korb-treffer" id="korb-treffer">${korbTrefferHTML()}</div>
      </div>
      <div id="korb-inhalt">${korbInhaltHTML()}</div>`,
    knoepfe: [{ text: 'Schließen', wert: null }]
  });

  const gruppenFeld = document.getElementById('korb-gruppe');
  if (gruppenFeld) {
    gruppenFeld.addEventListener('change', (e) => {
      const gruppe = e.target.value;
      if (!gruppe) return;
      // Eine ganze Funktionsgruppe ersetzt die Auswahl — das ist die Frage „welches von diesen?",
      // und die beantwortet man nicht mit Fremdeinträgen daneben.
      aktivesVergleichsZiel.ersetze(gruppenMitglieder(index, gruppe).map((p) => p.id));
      zeichneListe();
      frischeVergleichsFensterAuf();
      e.target.value = '';
    });
  }

  const feld = document.getElementById('korb-suche');
  if (!feld) return;
  let tippTimer = null;
  feld.addEventListener('input', (e) => {
    clearTimeout(tippTimer);
    const wert = e.target.value;
    tippTimer = setTimeout(() => { korbSuche = wert; frischeKorbTrefferAuf(); }, 150);
  });
}

/** Ganze Funktionsgruppe auf einmal — steht über der Suche, weil es die gröbere Auswahl ist. */
function korbGruppenWahlHTML() {
  const gruppen = alleGruppen(index);
  if (!gruppen.length) return '';
  return `<label class="korb-gruppenwahl">Ganze Funktionsgruppe:
    <select id="korb-gruppe" class="feld">
      <option value="">— auswählen —</option>
      ${gruppen.map((g) => `<option value="${escapeHtml(g.gruppe)}">${escapeHtml(g.gruppe)} (${g.mitglieder.length})</option>`).join('')}
    </select>
  </label>`;
}

/**
 * Die Auswahlliste. Reihenfolge nach ausdrücklichem Wunsch: zuerst die Alternativen des ersten
 * Eintrags im aktiven Vergleichsziel (also genau das, was auf der Karte unter „wird ersetzt
 * durch" steht), danach alles Übrige alphabetisch. Gesucht wird mit derselben Funktion wie in
 * der Hauptsuche. „drin"/das ＋ beziehen sich auf `aktivesVergleichsZiel`, NICHT auf den Korb —
 * im Kopf-Vergleichsfenster zeigt es also die Kopf-Auswahl, nicht die Korb-Chips.
 */
function korbTrefferHTML() {
  const eigeneIds = aktivesVergleichsZiel.ids();
  const anker = eigeneIds.length ? index.get(eigeneIds[0]) : null;
  const alternativIds = new Set(anker ? alternativen(index, anker).map((p) => p.id) : []);

  const passend = plugins.filter((p) => passtSuche(p, korbSuche));
  const zuerst = passend.filter((p) => alternativIds.has(p.id));
  const rest = passend.filter((p) => !alternativIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const gesamt = [...zuerst, ...rest];

  if (!gesamt.length) return '<p class="hinweis-leise">Kein Plugin passt zu dieser Suche.</p>';

  // Das ＋ sitzt rechts: beim Durchgehen einer Trefferliste wandert der Blick von links (Name)
  // nach rechts zur Handlung, und mehrere hintereinander hinzuzufügen heißt dann, immer
  // dieselbe Stelle zu treffen.
  const zeile = (p) => {
    const drin = aktivesVergleichsZiel.hat(p.id);
    return `<button type="button" class="korb-treffer-zeile${drin ? ' korb-drin' : ''}"
      data-korb-${drin ? 'ab' : 'add'}="${escapeHtml(p.id)}">
      <span class="korb-name">${escapeHtml(p.name)}</span>
      ${alternativIds.has(p.id) ? '<span class="korb-marke">Alternative</span>' : ''}
      <small>${escapeHtml(KATEGORIE_NAMEN.get(p.kategorie) || p.kategorie)}</small>
      <span class="korb-zeichen" title="${drin ? 'Aus dem Vergleich nehmen' : 'Zum Vergleich hinzufügen'}">${drin ? '−' : '＋'}</span>
    </button>`;
  };

  // Kein Deckel: wer nicht sucht, sondern blättert, soll den ganzen Katalog durchscrollen können.
  // Die Liste scrollt in sich (style.css), und 400+ Knöpfe zu zeichnen kostet weniger als die
  // Kartenliste dahinter, die ohnehin bei jedem Neuzeichnen vollständig entsteht.
  return gesamt.map(zeile).join('');
}

/**
 * Jedes gewählte Plugin steht als vollständige Karte da — wie in der normalen Liste, mit Badges,
 * Beschreibung, Meta und Abwägung. Die Vergleichstabelle kommt DARUNTER, nicht statt der Karten:
 * die Tabelle beantwortet „worin unterscheiden sie sich", die Karten „was ist das überhaupt".
 */
function korbInhaltHTML() {
  const eigeneIds = aktivesVergleichsZiel.ids();
  if (!eigeneIds.length) {
    return '<p class="hinweis-leise">Noch nichts gewählt — oben suchen und mit ＋ hinzufügen.</p>';
  }

  const karten = eigeneIds.map((id) => {
    const p = index.get(id);
    if (!p) return '';
    return `<div class="korb-karte">
      ${kartenHTML(index, p, { detail: true, ohneKorb: true })}
      <button type="button" class="btn btn-klein btn-leise" data-korb-ab="${escapeHtml(id)}">− aus dem Vergleich</button>
    </div>`;
  }).join('');

  const tabelle = eigeneIds.length >= 2
    ? mehrfachVergleichHTML(vergleicheMehrere(index, eigeneIds))
    : '<p class="hinweis-leise">Ab zwei Einträgen kommt hier die Vergleichstabelle dazu.</p>';

  return `<div class="korb-karten">${karten}</div>${tabelle}`;
}

function frischeKorbTrefferAuf() {
  const el = document.getElementById('korb-treffer');
  if (el) el.innerHTML = korbTrefferHTML();
}

function frischeVergleichsFensterAuf() {
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
    // Der Grund ist der Partner: links das, was schon gesetzt ist, rechts der Vorschlag.
    const gruende = v.gruende.map((g) => `<li>${g.art === 'synergie' ? '🔗 Synergie mit' : '➕ Ergänzt sich mit'}
      ${vergleichsVerweis([g.von.id, v.ziel.id], g.von.name)}${punkte('karte-plus', g.plus)}${punkte('karte-minus', g.minus)}</li>`).join('');

    // Hängen mehrere gesetzte Plugins an demselben Vorschlag, lohnt der Blick auf alle zugleich.
    const alle = v.gruende.length > 1
      ? vergleichsVerweis([...v.gruende.map((g) => g.von.id), v.ziel.id], 'alle vergleichen')
      : '';

    return `<div class="synergie-vorschlag">
      <div class="synergie-kopf">
        ${berichtLink(v.ziel)}
        <span class="synergie-knoepfe">${alle}
          <button type="button" class="btn btn-klein" data-behebe="${escapeHtml(v.ziel.id)}:${escapeHtml(umgebung)}">＋ auf ${label} setzen</button>
        </span>
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

/* ============================ Kleiner Texteingabe-Dialog ============================ */

/**
 * Ein Feld, ein OK, ein Abbrechen. Der Wert wird laufend eingesammelt, weil das Modal beim
 * Schließen aus dem DOM verschwindet — danach wäre das Eingabefeld nicht mehr auslesbar
 * (derselbe Grund wie beim „Eigenes Plugin"-Formular).
 *
 * @returns {Promise<string|null>} getrimmter Text, oder null bei Abbruch/leerer Eingabe
 */
async function frageNachText({ titel, beschriftung, vorschlag = '', okText = 'OK' }) {
  const fenster = modal({
    titel,
    inhalt: `<label class="formular-breit">${escapeHtml(beschriftung)}
      <input id="text-eingabe" class="feld" value="${escapeHtml(vorschlag)}"></label>`,
    knoepfe: [{ text: 'Abbrechen', wert: false }, { text: okText, art: 'gut', wert: true }]
  });

  const feld = document.getElementById('text-eingabe');
  let wert = vorschlag;
  if (feld) {
    feld.addEventListener('input', () => { wert = feld.value; });
    // Enter soll bestätigen — sonst muss man für ein einziges Feld zur Maus greifen.
    feld.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.querySelector('.modal-fuss .btn-gut').click(); }
    });
    feld.focus();
    feld.select();
  }

  const ok = await fenster;
  const sauber = String(wert || '').trim();
  return ok && sauber ? sauber : null;
}

/** Datum und Uhrzeit als sortierbarer Baustein für Dateinamen: 2026-08-14_0231 */
function zeitstempel() {
  const d = new Date();
  const zwei = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}_${zwei(d.getHours())}${zwei(d.getMinutes())}`;
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
      // Datum und Uhrzeit gehören in den Dateinamen, nicht nur ins JSON: im Download-Ordner
      // liegen sonst fünf gleichnamige Dateien und keine sagt, welche die neuere ist.
      ladeHerunter(JSON.stringify(baueZustandsExport(), null, 2), `qbox-planer-stand_${zeitstempel()}.json`);
      return toast('Stand exportiert 💾');
    }
    case 'zustand-import': return zustandImportieren();
    case 'katalog-import': return katalogImportieren();
    case 'backup-neu': {
      const name = await frageNachText({
        titel: '🗄️ Backup anlegen',
        beschriftung: 'Name des Backups',
        vorschlag: 'Backup ' + new Date().toLocaleString('de-DE'),
        okText: 'Anlegen'
      });
      if (!name) return toast('Abgebrochen — kein Backup angelegt.');
      const b = legeBackupAn(name);
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
            <button class="btn btn-klein" data-tat="umbenennen:${i}">Umbenennen</button>
            <button class="btn btn-klein btn-gefahr" data-tat="loeschen:${i}">Löschen</button></span>
    </div>`).join('')}</div>`;

  const tat = await modal({ titel: '🗂️ Backups', inhalt, knoepfe: [{ text: 'Schließen', wert: null }] });
  if (!tat) return;

  const [was, iText] = String(tat).split(':');
  const i = Number(iText);

  if (was === 'laden') {
    const ja = await frage({ titel: 'Backup laden', inhalt: `<p>Aktueller Stand wird ersetzt. Vorher wird automatisch gesichert.</p>`, jaText: 'Laden' });
    if (ja && ladeBackup(i)) { katalogAufbauen(); zeichneListe(); toast('Backup geladen ↩️'); }
    return;
  }

  if (was === 'umbenennen') {
    const alt = holeBackups()[i];
    if (!alt) return;
    const name = await frageNachText({
      titel: '✏️ Backup umbenennen', beschriftung: 'Neuer Name', vorschlag: alt.name, okText: 'Umbenennen'
    });
    if (name && benenneBackupUm(i, name)) toast(`Umbenannt in „${name}"`);
    // Zurück in die Liste, sonst müsste man das Menü für jede weitere Änderung neu öffnen.
    return zeigeBackups();
  }

  if (was === 'loeschen') {
    loescheBackup(i);
    toast('Backup gelöscht');
    return zeigeBackups();
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
  fuelleGruppenFilter();   // der importierte Katalog kann Gruppen mitbringen, die es vorher nicht gab
  zeichneListe();

  if (!ergebnis.gesichert.ok) hinweis({ titel: '⚠️ Nicht dauerhaft gespeichert', inhalt: `<p>${escapeHtml(ergebnis.gesichert.meldung)}</p>` });
  else if (ergebnis.gesichert.warnung) toast(ergebnis.gesichert.warnung, 'warnung');
  else toast(`Import übernommen: ${vorschauZusammenfassung(v)} ✅`);
}

/**
 * `nachfolger` ist eine Katalog-ID. In der Vorschau wird daraus kein Verweis (das Ziel ist noch
 * gar nicht gerendert), aber wenigstens der lesbare Name statt der rohen Kennung.
 */
function nachfolgerName(id) {
  const p = index.get(id);
  return p ? p.name : id;
}

/** E8 + E9 — Änderungsliste mit hervorgehobener Warnung für bereits gehakte Plugins. */
function vorschauHTML(v) {
  const warnungen = v.warnungen.length ? `
    <div class="vorschau-warnung">
      <strong>⚠️ Achtung — betrifft Plugins, die du bereits gesetzt hast:</strong>
      ${v.warnungen.map((w) => `
        <div class="vorschau-warnung-zeile">
          <strong>${escapeHtml(w.name)}</strong> (${w.umgebungen.map((u) => u.toUpperCase()).join(' + ')})
          <ul>${w.gruende.map((g) => `<li>${escapeHtml(g.text)}${g.nachfolger ? ` <em>Nachfolger: ${escapeHtml(nachfolgerName(g.nachfolger))}</em>` : ''}</li>`).join('')}</ul>
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
