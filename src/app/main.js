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
import { baueIndex, aktiveKonflikte, fehlendeAbhaengigkeiten, bundleHinweis } from './relations.js';
import { kartenHTML, escapeHtml } from './render.js';
import { leererFilter, gefilterteUndSortierteListe, holeAktiveSortierung, setzeAktiveSortierung, SORTIER_OPTIONEN } from './filters.js';
import { vergleiche, vergleichHTML } from './compare.js';
import { ladeDifferenz, mitDifferenz, verwirfDifferenz, differenzInfo } from './katalogspeicher.js';
import { mitEigenen, legeEigenesAn } from './custom.js';
import { baueZustandsExport, leseZustandsDatei, uebernimmZustand, baueKatalogVorschau, wendeVorschauAn, vorschauZusammenfassung } from './import.js';
import { baueEnsureListe } from './exportcfg.js';
import { kostenBeiderUmgebungen, kostenText } from './costs.js';
import { toast, modal, frage, hinweis, ladeHerunter, waehleDatei } from './ui.js';

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
      <button class="btn btn-leise" id="btn-zuruecksetzen">↺ Zurücksetzen</button>
    </div>

    <div class="chips" id="chips"></div>
    <div class="treffer" id="treffer"></div>
    <div id="liste"></div>`;

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
      <div class="karten">${eintraege.map((p) => kartenHTML(index, p)).join('')}</div>
    </section>`;
  });

  document.getElementById('liste').innerHTML = bloecke.join('') ||
    '<p class="leer">Kein Plugin passt zu diesen Filtern.</p>';

  document.getElementById('treffer').textContent =
    `${sichtbar.length} von ${plugins.length} Plugins`;

  zeichneKosten();
  aktualisiereChips();
  aktualisiereKopf();
}

function zeichneKosten() {
  const k = kostenBeiderUmgebungen(index);
  document.getElementById('kosten').innerHTML = `
    <div class="kosten-spalte"><strong>🧪 DEV</strong>
      <span>einmalig ${kostenText(k.dev.einmalig)}</span><span>monatlich ${kostenText(k.dev.abo)}</span></div>
    <div class="kosten-spalte"><strong>✅ MAIN</strong>
      <span>einmalig ${kostenText(k.main.einmalig)}</span><span>monatlich ${kostenText(k.main.abo)}</span></div>`;
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
    zeichneListe();
    toast('Suche und Filter zurückgesetzt — deine Haken sind unberührt.');
  });

  document.getElementById('btn-zahnrad').addEventListener('click', oeffneZahnrad);
  document.getElementById('btn-eigenes').addEventListener('click', oeffneEigenesFormular);
  document.getElementById('btn-vergleich').addEventListener('click', oeffneVergleich);
}

/* ========================= Ein Listener für alle Karten ========================= */

function verdrahteListe() {
  const liste = document.getElementById('liste');

  liste.addEventListener('change', async (e) => {
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

  // B5 — Sprung zum Ziel mit kurzem Aufblinken. Der <a href="#karte-id"> springt von allein,
  // hier kommt nur die Hervorhebung dazu.
  liste.addEventListener('click', (e) => {
    const sprung = e.target.closest('[data-jump-id]');
    if (!sprung) return;
    const ziel = document.getElementById('karte-' + sprung.dataset.jumpId);
    if (!ziel) { toast('Dieser Eintrag ist (noch) nicht im Katalog.', 'warnung'); e.preventDefault(); return; }
    ziel.classList.remove('blinkt');
    void ziel.offsetWidth;          // Neustart der Animation erzwingen
    ziel.classList.add('blinkt');
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

  const inhalt = `
    <p class="hinweis-leise">Liegen beide in derselben Funktionsgruppe, entsteht ein Funktionsvergleich —
       sonst werden Zweck und Funktionen nebeneinandergestellt, ohne Wertung.</p>
    <div class="vergleich-auswahl">
      <select id="v-a" class="feld">${optionen(vorA)}</select>
      <select id="v-b" class="feld">${optionen(vorB)}</select>
    </div>
    <div id="v-ergebnis"></div>`;

  const fenster = modal({ titel: '⚖️ Vergleich', inhalt, knoepfe: [{ text: 'Schließen', wert: null }] });

  const zeichneVergleich = () => {
    const a = document.getElementById('v-a').value;
    const b = document.getElementById('v-b').value;
    document.getElementById('v-ergebnis').innerHTML = vergleichHTML(vergleiche(index, a, b));
  };
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
verdrahteListe();
zeichneListe();
