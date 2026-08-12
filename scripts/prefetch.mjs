#!/usr/bin/env node
/**
 * prefetch.mjs — die mechanische Hälfte einer Recherche-Runde vorab erledigen.
 *
 * Hintergrund: In den Runden 14–18 hat sich gezeigt, dass die Recherche-Subagents den Großteil
 * ihrer Aufrufe mit rein deterministischer Arbeit verbringen — existiert das Repo, ist es
 * archiviert, wann war der letzte Push, was steht im fxmanifest. Dafür braucht es kein
 * Sprachmodell. Dieses Script holt genau diese Fakten vorab und schreibt sie als Briefing nach
 * data/.prefetch/. Der Subagent liest das Briefing und macht nur noch das, was Urteilsvermögen
 * verlangt: README-Prosa lesen, Kompatibilität einordnen, tote Links nachrecherchieren.
 *
 * Das ersetzt NICHT docs/RECHERCHE.md — es erledigt dessen Abschnitt 1a vollständig und
 * bereitet 1b (Repo-Umzug) und §3 (Kompatibilitäts-Check) so weit vor, dass der Rest Urteil ist.
 *
 * Sparsam gegenüber GitHub, weil es über die IP des Nutzers läuft:
 *   · Repo-Metadaten werden pro OWNER in einem Rutsch geholt, nicht pro Repo
 *     (eine Runde braucht dadurch ~4 API-Aufrufe statt ~15 — passt selbst ohne Token ins Limit)
 *   · Dateiinhalte kommen über raw.githubusercontent.com, das nicht am API-Limit hängt
 *   · Ergebnis-Cache mit 7 Tagen Gültigkeit (kürzer als linkcheck: hier zählt Archiv-Status)
 *   · GITHUB_TOKEN oder GH_TOKEN aus der Umgebung wird genutzt, wenn vorhanden (60 → 5000 Anfragen/h)
 *   · Shops mit Bot-Schutz werden gar nicht erst angefragt, sondern als Handarbeit ausgewiesen
 *
 * Aufruf: npm run prefetch -- --kategorie crime --offen --max 11
 *         npm run prefetch -- --ids qbx_lockpick,qbx_pawnshop --runde 19
 *         npm run prefetch -- --kategorie crime --offen --neu       (Cache ignorieren)
 *         npm run prefetch -- --ids ox_lib --schnell                (ohne Code-Stichprobe)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { ladeKatalog, pfad, relPfad, rot, gruen, gelb, blau, grau, fett } from './lib/katalog.mjs';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const hat = (name) => args.includes('--' + name);

const NUR_OFFEN = hat('offen');
const NEU = hat('neu');
const SCHNELL = hat('schnell');
const MAX = Number(flag('max') || 12);
const RUNDE = flag('runde');
const IDS = (flag('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
const KATEGORIE = flag('kategorie');

const PARALLEL = 6;          // reine Netzwerk-Wartezeit, deshalb etwas höher als linkcheck
const CACHE_TAGE = 7;
const TIMEOUT_MS = 15000;
const MAX_LUA = 40;          // Code-Stichprobe: so viele .lua-Dateien je Repo, dann reicht es
const MAX_DATEI_BYTES = 150_000;

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

/** Übernommen aus linkcheck.mjs — eine Anfrage bringt hier nur einen 403. */
const BOT_SCHUTZ = [
  'tebex.io', 'quasar-store.com', 'jgscripts.com', 'wasabiscripts.com',
  'tgiann.com', 'stgscripts.com', 'kuzquality.com', 'okokscripts.io',
  'codesign.pro', 'fivem.net/store', 'store.fivem.net'
];

/** Links, die gar kein Repo bezeichnen — Altbestand-Platzhalter aus der Konvertierung. */
const PLATZHALTER = ['github.com/topics/', 'github.com/search'];

const heute = new Date().toISOString().slice(0, 10);
const cachePfad = pfad('data', '.prefetchcache.json');
const cache = existsSync(cachePfad) && !NEU ? JSON.parse(readFileSync(cachePfad, 'utf8')) : {};

/* ------------------------- Kompatibilitäts-Muster ------------------------- */
/* Direkt aus docs/RECHERCHE.md §3. Das Script belegt die Fundstelle, das Urteil bleibt beim Agent. */

const MUSTER = [
  // Rote Flaggen — Script greift am Framework vorbei, Bridge hilft nicht
  { art: 'rot', name: "exports['qb-inventory']", re: /exports\[['"]qb-inventory['"]\]/ },
  { art: 'rot', name: "exports['qb-target']", re: /exports\[['"]qb-target['"]\]/ },
  { art: 'rot', name: 'QBCore.Players (intern)', re: /QBCore\.Players\b/ },
  { art: 'rot', name: 'Player.Functions.* (Patch)', re: /Player\.Functions\.\w+\s*=/ },
  { art: 'rot', name: '@qb-core/ Datei-Include', re: /@qb-core\// },
  { art: 'rot', name: 'ox_core (nicht Qbox)', re: /@ox_core\/|exports\.ox_core|exports\[['"]ox_core['"]\]/ },
  { art: 'rot', name: 'mysql-async / ghmattimysql', re: /mysql-async|ghmattimysql/ },
  { art: 'rot', name: 'TokoVoIP / mythic_*', re: /TokoVoIP|mythic_\w+/ },
  // Grüne Flaggen — läuft erwartbar sauber
  { art: 'gruen', name: '@ox_lib/init.lua', re: /@ox_lib\/init\.lua/ },
  { art: 'gruen', name: 'exports.qbx_core', re: /exports\.qbx_core|exports\[['"]qbx_core['"]\]|@qbx_core\// },
  { art: 'gruen', name: 'exports.ox_target', re: /exports\.ox_target|exports\[['"]ox_target['"]\]/ },
  { art: 'gruen', name: 'exports.ox_inventory', re: /exports\.ox_inventory|exports\[['"]ox_inventory['"]\]/ },
  { art: 'gruen', name: 'community_bridge / jim_bridge', re: /community_bridge|jim_bridge/ },
  { art: 'gruen', name: 'Framework-Autoerkennung', re: /GetResourceState\(\s*['"](es_extended|qb-core|qbx_core)['"]/ }
];

/** Begriffe, die eine README-Zeile für die Einordnung interessant machen. */
const README_BEGRIFFE = /qbox|qbx|esx|qbcore|qb-core|ox_lib|ox_target|ox_inventory|ox_core|escrow|tebex|licen[sc]e|depend|require|framework|bridge|standalone|archiv|deprecat|unmaintain|no longer/i;

/* --------------------------------- Holen --------------------------------- */

const zaehler = { api: 0, roh: 0, cache: 0, fehler: 0 };

async function hole(url, kopf = {}) {
  const abbruch = new AbortController();
  const uhr = setTimeout(() => abbruch.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: abbruch.signal,
      headers: { 'User-Agent': 'qbox-server-planer/3.0 (Prefetch)', ...kopf }
    });
  } finally {
    clearTimeout(uhr);
  }
}

/** GitHub-API mit Token, falls vorhanden. Gibt {ok, daten, status} zurück. */
async function holeApi(url) {
  const merker = 'api:' + url;
  const zwischen = ausCache(merker);
  if (zwischen) { zaehler.cache++; return zwischen; }

  const kopf = { Accept: 'application/vnd.github+json' };
  if (TOKEN) kopf.Authorization = 'Bearer ' + TOKEN;

  let erg;
  try {
    const res = await hole(url, kopf);
    zaehler.api++;
    if (res.status === 403 || res.status === 429) {
      const rest = res.headers.get('x-ratelimit-remaining');
      erg = { ok: false, status: res.status, grund: rest === '0' ? 'API-Limit erschöpft' : 'blockt (403)' };
    } else if (!res.ok) {
      erg = { ok: false, status: res.status, grund: 'HTTP ' + res.status };
    } else {
      erg = { ok: true, status: res.status, daten: await res.json() };
    }
  } catch (e) {
    zaehler.fehler++;
    erg = { ok: false, status: 0, grund: e.name === 'AbortError' ? 'Zeitüberschreitung' : String(e.cause?.code || e.message) };
  }
  // Fehlschläge wegen Limit nicht cachen — die sollen beim nächsten Lauf neu versucht werden.
  if (erg.ok || erg.status === 404) inCache(merker, erg);
  return erg;
}

/** Rohdatei von raw.githubusercontent.com. Hängt nicht am API-Limit. */
async function holeRoh(url) {
  const merker = 'roh:' + url;
  const zwischen = ausCache(merker);
  if (zwischen) { zaehler.cache++; return zwischen; }

  let erg;
  try {
    const res = await hole(url);
    zaehler.roh++;
    if (!res.ok) erg = { ok: false, status: res.status };
    else {
      const text = await res.text();
      erg = { ok: true, status: res.status, text: text.length > MAX_DATEI_BYTES ? text.slice(0, MAX_DATEI_BYTES) : text };
    }
  } catch (e) {
    zaehler.fehler++;
    erg = { ok: false, status: 0, grund: String(e.cause?.code || e.message) };
  }
  inCache(merker, erg);
  return erg;
}

function ausCache(schluessel) {
  const e = cache[schluessel];
  if (!e) return null;
  const alter = (Date.parse(heute) - Date.parse(e._geholt)) / 86400000;
  if (alter > CACHE_TAGE) return null;
  const { _geholt, ...rest } = e;
  return rest;
}

function inCache(schluessel, wert) {
  cache[schluessel] = { ...wert, _geholt: heute };
}

/* ---------------------- Repo-Bestand je Owner (1 Abruf) ---------------------- */

const ownerBestand = new Map();

/**
 * Alle öffentlichen Repos eines Owners. Das ist der eigentliche Trick: ein Abruf beantwortet
 * für die ganze Runde "existiert es / archiviert / letzter Push / Lizenz / Default-Branch" —
 * und liefert nebenbei die Kandidatenliste für umbenannte Repos (RECHERCHE.md 1b).
 */
async function holeOwnerBestand(owner) {
  if (ownerBestand.has(owner)) return ownerBestand.get(owner);

  const repos = [];
  let seite = 1;
  let fehler = null;
  let status = 200;
  while (seite <= 4) { // 400 Repos reichen für jeden Owner im Katalog
    const erg = await holeApi(`https://api.github.com/users/${owner}/repos?per_page=100&page=${seite}&sort=full_name`);
    if (!erg.ok) {
      // Manche Orgs antworten nur unter /orgs/
      if (seite === 1) {
        const alt = await holeApi(`https://api.github.com/orgs/${owner}/repos?per_page=100&page=1`);
        if (alt.ok) { repos.push(...alt.daten); seite++; continue; }
        status = alt.status === 404 && erg.status === 404 ? 404 : erg.status;
      } else {
        status = erg.status;
      }
      fehler = erg.grund;
      break;
    }
    repos.push(...erg.daten);
    if (erg.daten.length < 100) break;
    seite++;
  }

  const bestand = {
    fehler,
    status,
    liste: repos.map((r) => ({
      name: r.name,
      archiviert: r.archived,
      push: (r.pushed_at || '').slice(0, 10),
      lizenz: r.license?.spdx_id || '',
      branch: r.default_branch || 'main',
      beschreibung: r.description || ''
    }))
  };
  ownerBestand.set(owner, bestand);
  return bestand;
}

/* ------------------------------ Auswertung ------------------------------ */

const githubTeile = (url) => {
  const m = /^https?:\/\/(?:www\.)?github\.com\/([^/#?]+)(?:\/([^/#?]+))?/i.exec(url || '');
  if (!m) return null;
  return { owner: m[1], repo: m[2] ? m[2].replace(/\.git$/, '') : null };
};

const normal = (s) => s.toLowerCase().replace(/[-_\s]/g, '');

/** Roher Namensabgleich über die längste gemeinsame Teilzeichenkette. */
function aehnlich(a, b) {
  const x = normal(a), y = normal(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.9;
  let beste = 0;
  for (let i = 0; i < x.length; i++) {
    for (let j = i + beste + 1; j <= x.length; j++) {
      if (y.includes(x.slice(i, j))) beste = Math.max(beste, j - i); else break;
    }
  }
  return beste / Math.max(x.length, y.length);
}

/**
 * Der unterscheidende Teil eines Ressourcennamens: bei "randolio_busjob" ist das "busjob".
 * FiveM-Namen sind fast immer <autor>_<sache>, und der Autor ist beim Owner-Vergleich wertlos —
 * ohne diese Trennung landen alle randol_*-Repos gleichauf, weil sie sich das Präfix teilen.
 */
const kern = (s) => {
  const teile = s.split(/[-_]/).filter(Boolean);
  return teile.length > 1 ? teile.slice(1).join('') : s;
};

/** Ähnlichkeit zweier Repo-Namen, Schwerpunkt auf dem unterscheidenden Teil. */
function namensNaehe(a, b) {
  return 0.75 * aehnlich(kern(a), kern(b)) + 0.25 * aehnlich(a, b);
}

function kandidaten(bestand, gesucht) {
  return bestand.liste
    .map((r) => ({ ...r, punkte: namensNaehe(gesucht, r.name) }))
    .filter((r) => r.punkte > 0.4)
    .sort((a, b) => b.punkte - a.punkte)
    .slice(0, 6);
}

/** fxmanifest wörtlich (ohne Leerzeilen/Kommentare), plus abgeleitete Kurzfassung. */
function fxAuswerten(text) {
  const zeilen = text.split(/\r?\n/).map((z) => z.trimEnd())
    .filter((z) => z.trim() && !z.trim().startsWith('--'));
  // Zeilenanfang-gebunden, sonst greift die Suche auf "fx_version 'cerulean'" zu.
  const version = /^[ \t]*version\s+['"]([^'"]+)['"]/m.exec(text)?.[1] || '';
  const deps = [...text.matchAll(/dependenc(?:y|ies)\s*[{(]?\s*([^}\)]*)/gi)]
    .flatMap((m) => [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]));
  return { zeilen: zeilen.slice(0, 60), gekuerzt: zeilen.length > 60, version, deps: [...new Set(deps)] };
}

function readmeBelege(text) {
  const treffer = [];
  const zeilen = text.split(/\r?\n/);
  for (let i = 0; i < zeilen.length && treffer.length < 18; i++) {
    const z = zeilen[i].trim();
    if (z.length < 4 || !README_BEGRIFFE.test(z)) continue;
    treffer.push({ nr: i + 1, text: z.length > 160 ? z.slice(0, 160) + '…' : z });
  }
  return { treffer, gesamt: zeilen.length };
}

/** Code-Stichprobe nach RECHERCHE.md §3 über die .lua-Dateien des Repos. */
async function codeStichprobe(owner, repo, branch) {
  const baum = await holeApi(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  if (!baum.ok) return { fehler: baum.grund || 'Baum nicht abrufbar', funde: [], dateien: 0 };

  const luas = (baum.daten.tree || [])
    .filter((e) => e.type === 'blob' && /\.lua$/i.test(e.path) && (e.size || 0) < MAX_DATEI_BYTES)
    .map((e) => e.path);

  const auswahl = luas.slice(0, MAX_LUA);
  const funde = new Map();

  await parallel(auswahl, PARALLEL, async (weg) => {
    const datei = await holeRoh(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${weg}`);
    if (!datei.ok) return;
    const zeilen = datei.text.split(/\r?\n/);
    for (const m of MUSTER) {
      for (let i = 0; i < zeilen.length; i++) {
        if (!m.re.test(zeilen[i])) continue;
        if (!funde.has(m.name)) funde.set(m.name, { art: m.art, stellen: [] });
        const e = funde.get(m.name);
        if (e.stellen.length < 2) e.stellen.push(`${weg}:${i + 1}`);
        break; // je Datei und Muster reicht die erste Fundstelle
      }
    }
  });

  return {
    dateien: auswahl.length,
    gesamt: luas.length,
    funde: [...funde.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => (a.art === b.art ? 0 : a.art === 'rot' ? -1 : 1))
  };
}

/** Warteschlange fester Breite — gleiche Form wie in linkcheck.mjs. */
async function parallel(liste, breite, arbeit) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(breite, liste.length || 1) }, async () => {
    while (i < liste.length) await arbeit(liste[i++]);
  }));
}

/* ------------------------- Ein Plugin durcharbeiten ------------------------- */

async function bearbeite(p) {
  const e = { id: p.id, name: p.name, link: p.link || '', kategorie: p.kategorie, qualitaet: p.qualitaet, offen: [] };
  const url = e.link;

  if (!url) {
    e.lage = 'kein-link';
    e.offen.push('Kein Link im Katalog. Echtes Repo/Produkt suchen (höchstens 4 Abrufe), sonst `ungeprueft` lassen.');
    return e;
  }
  if (PLATZHALTER.some((x) => url.toLowerCase().includes(x))) {
    e.lage = 'platzhalter';
    e.offen.push('Link ist ein Altbestand-Platzhalter (Topic-/Suchseite), kein Repo. Echtes Repo suchen (höchstens 4 Abrufe), sonst `ungeprueft`.');
    return e;
  }
  if (BOT_SCHUTZ.some((h) => url.toLowerCase().includes(h))) {
    e.lage = 'bot-schutz';
    e.offen.push('Shop mit Bot-Schutz — bewusst nicht angefragt. Konkrete Produktseite, Anbieter-Doku oder Cfx-Thread als Beleg suchen (höchstens 3 Abrufe), siehe RECHERCHE.md 1d.');
    return e;
  }

  const teile = githubTeile(url);
  if (!teile) {
    e.lage = 'fremd';
    e.offen.push('Kein GitHub-Link — Seite selbst lesen und nach RECHERCHE.md einordnen.');
    return e;
  }

  const bestand = await holeOwnerBestand(teile.owner);
  e.owner = teile.owner;
  e.ownerAnzahl = bestand.liste.length;
  if (bestand.fehler && !bestand.liste.length) {
    // Ein 404 auf die Owner-Liste ist kein Abrufproblem, sondern ein Befund: den Account gibt es
    // nicht (mehr). Dann kann auch das Repo darunter nicht existieren — siehe rahe-rescue, Runde 16.
    if (bestand.status === 404) {
      e.lage = 'owner-weg';
      e.offen.push(`Der Owner \`${teile.owner}\` existiert auf GitHub nicht (mehr) — damit ist auch das Repo tot. `
        + 'Höchstens 2 Abrufe: Websuche nach einem Umzug (anderer Owner oder Tebex), dann `link_status: "404"` und `ungeprueft`.');
    } else {
      e.lage = 'api-fehler';
      e.offen.push(`Owner-Bestand nicht abrufbar (${bestand.fehler}) — das ist ein Abrufproblem, KEIN Befund. `
        + 'Repo einzeln über die API prüfen, bevor du etwas als tot einstufst.');
    }
    return e;
  }

  // Reiner Profil-Link ohne Repo — der pl_fraud-Fall aus Runde 17.
  if (!teile.repo) {
    e.lage = 'nur-profil';
    e.kandidaten = kandidaten(bestand, p.id);
    e.offen.push(e.kandidaten.length
      ? 'Link zeigt nur aufs Profil. Passendsten Kandidaten oben per fxmanifest/README bestätigen (1–2 Abrufe), dann Link korrigieren.'
      : 'Link zeigt nur aufs Profil, kein ähnlich benanntes Repo im Bestand. Höchstens 2 Websuchen, dann `ungeprueft`.');
    return e;
  }

  const meta = bestand.liste.find((r) => r.name.toLowerCase() === teile.repo.toLowerCase());
  if (!meta) {
    e.lage = '404';
    e.kandidaten = kandidaten(bestand, teile.repo);
    e.offen.push(e.kandidaten.length
      ? 'Repo nicht im Owner-Bestand (404). Kandidaten oben prüfen — Treffer bestätigen und Link korrigieren, sonst `ungeprueft`.'
      : `Repo nicht im Owner-Bestand (404) und kein ähnlicher Name unter ${bestand.liste.length} Repos. Höchstens 2 Websuchen (Umbenennung/Tebex), dann ehrlich \`ungeprueft\` — nicht weitersuchen.`);
    return e;
  }

  e.lage = 'ok';
  e.meta = meta;

  const roh = (weg) => `https://raw.githubusercontent.com/${teile.owner}/${teile.repo}/${meta.branch}/${weg}`;
  const [fx, readme] = await Promise.all([holeRoh(roh('fxmanifest.lua')), holeRoh(roh('README.md'))]);

  if (fx.ok) e.fx = fxAuswerten(fx.text);
  else e.offen.push('fxmanifest.lua nicht im Wurzelverzeichnis — Unterordner prüfen (1 Abruf über die Dateiliste).');

  if (readme.ok) e.readme = readmeBelege(readme.text);
  else e.offen.push('Keine README.md im Wurzelverzeichnis — Framework-Aussage aus fxmanifest und Repo-Beschreibung ableiten.');

  if (!SCHNELL) e.code = await codeStichprobe(teile.owner, teile.repo, meta.branch);

  if (!e.offen.length) {
    e.offen.push('Nichts nachzuholen — Briefing deckt Abschnitt 1a und §3 ab. Nur noch Einordnung und Urteil schreiben.');
  }
  return e;
}

/* --------------------------- Plugins auswählen --------------------------- */

const { plugins, fehler } = ladeKatalog();
if (fehler.length) fehler.forEach((f) => console.log(rot(f) + '\n'));

let ziel = plugins;
if (IDS.length) {
  ziel = IDS.map((id) => plugins.find((p) => p.id === id)).filter(Boolean);
  const fehlend = IDS.filter((id) => !plugins.some((p) => p.id === id));
  if (fehlend.length) console.log(rot('✖ Unbekannte IDs: ') + fehlend.join(', ') + '\n');
} else {
  if (KATEGORIE) ziel = ziel.filter((p) => p.kategorie === KATEGORIE);
  if (NUR_OFFEN) ziel = ziel.filter((p) => !p.geprueft_am);
  ziel = ziel.slice(0, MAX);
}

if (!ziel.length) {
  console.log(gelb('\nKeine passenden Plugins.') + grau('  Aufruf: npm run prefetch -- --kategorie crime --offen\n'));
  process.exit(0);
}

console.log(fett('\nnpm run prefetch') + grau(`  ·  ${ziel.length} Plugins, ${PARALLEL} parallel`));
console.log(TOKEN
  ? grau('  GitHub-Token gefunden — 5000 Anfragen/h.\n')
  : gelb('  Kein GITHUB_TOKEN/GH_TOKEN gesetzt — 60 Anfragen/h.') + grau(' Reicht dank Owner-Bündelung meist, aber ein Token ist robuster.\n'));

/* ------------------------------ Durchlauf ------------------------------ */

const ergebnisse = [];
let fertig = 0;
// Bewusst seriell über die Plugins: so wird der Owner-Bestand einmal geholt und dann
// aus dem Speicher bedient, statt dass mehrere Arbeiter denselben Owner parallel abrufen.
for (const p of ziel) {
  ergebnisse.push(await bearbeite(p));
  fertig++;
  process.stdout.write(grau(`\r  ${fertig}/${ziel.length} vorbereitet …`));
}
process.stdout.write('\r' + ' '.repeat(40) + '\r');

/* ------------------------------ Briefing ------------------------------ */

const zeichenLage = {
  ok: '🟢', '404': '🔴', 'owner-weg': '🔴', 'nur-profil': '🟠', platzhalter: '🟠',
  'bot-schutz': '🔒', fremd: '⚪', 'kein-link': '🔴', 'api-fehler': '⚪'
};

const zeilen = [];
zeilen.push(`# Prefetch-Briefing${RUNDE ? ` — Runde ${RUNDE}` : ''}`);
zeilen.push('');
zeilen.push(`Erstellt: ${heute} · ${ziel.length} Plugins · erzeugt von \`scripts/prefetch.mjs\``);
zeilen.push('');
zeilen.push('**Wie du das hier benutzt:** Alle Angaben unten sind bereits abgerufen und wörtlich');
zeilen.push('übernommen — du musst sie **nicht** nachholen. Sie decken docs/RECHERCHE.md Abschnitt 1a');
zeilen.push('(Repo-Status, fxmanifest, README-Belege) und §3 (Code-Stichprobe) ab. Deine Aufgabe ist die');
zeilen.push('Einordnung: Framework-Urteil, Beleggrad, `update_grund` schreiben. Was pro Eintrag noch offen');
zeilen.push('ist, steht jeweils unter „Offen für dich" — inklusive Abruf-Budget. Halte dich daran: bei');
zeilen.push('einem toten Link ist „nicht auffindbar" ein vollwertiges Ergebnis, kein Grund weiterzusuchen.');
zeilen.push('');
zeilen.push('---');

for (const e of ergebnisse) {
  zeilen.push('');
  zeilen.push(`## ${zeichenLage[e.lage] || '·'} ${e.id}`);
  zeilen.push('');
  zeilen.push(`- Katalog-Link: ${e.link || '_keiner_'}`);
  zeilen.push(`- Bisher im Katalog: \`qualitaet: ${e.qualitaet}\` · Kategorie \`${e.kategorie}\``);

  if (e.meta) {
    const m = e.meta;
    zeilen.push(`- **Repo-Status:** ${m.archiviert ? '🪦 **ARCHIVIERT**' : 'aktiv, nicht archiviert'}` +
      ` · letzter Push ${m.push || 'unbekannt'} · Lizenz ${m.lizenz || 'keine angegeben'} · Branch \`${m.branch}\``);
    if (m.beschreibung) zeilen.push(`- Repo-Beschreibung: „${m.beschreibung}"`);
  }

  if (e.kandidaten?.length) {
    zeilen.push(`- Owner \`${e.owner}\` hat ${e.ownerAnzahl} öffentliche Repos. Ähnlichste Namen:`);
    for (const k of e.kandidaten) {
      zeilen.push(`    - \`${k.name}\`${k.archiviert ? ' 🪦' : ''} · Push ${k.push || '?'}${k.beschreibung ? ` · „${k.beschreibung.slice(0, 90)}"` : ''}`);
    }
  } else if (e.lage === '404' || e.lage === 'nur-profil') {
    zeilen.push(`- Owner \`${e.owner}\` hat ${e.ownerAnzahl} öffentliche Repos — **kein ähnlicher Name darunter**.`);
  }

  if (e.fx) {
    zeilen.push(`- **fxmanifest.lua** (wörtlich${e.fx.gekuerzt ? ', gekürzt auf 60 Zeilen' : ''}):`);
    zeilen.push('```lua');
    zeilen.push(...e.fx.zeilen);
    zeilen.push('```');
    if (e.fx.version || e.fx.deps.length) {
      zeilen.push(`    _abgeleitet:_ version \`${e.fx.version || '—'}\`, dependencies \`${e.fx.deps.join(', ') || '—'}\`` +
        ' (die Rohzeilen oben gelten, falls das abweicht)');
    }
  }

  if (e.readme) {
    zeilen.push(`- **README-Belegzeilen** (${e.readme.treffer.length} Treffer aus ${e.readme.gesamt} Zeilen, wörtlich):`);
    if (!e.readme.treffer.length) zeilen.push('    _keine Zeile mit Framework-/Lizenz-Begriffen gefunden_');
    for (const t of e.readme.treffer) zeilen.push(`    - L${t.nr}: ${t.text}`);
  }

  if (e.code) {
    if (e.code.fehler) {
      zeilen.push(`- Code-Stichprobe nicht möglich: ${e.code.fehler}`);
    } else {
      zeilen.push(`- **Code-Stichprobe** (${e.code.dateien} von ${e.code.gesamt} .lua-Dateien nach RECHERCHE.md §3):`);
      if (!e.code.funde.length) zeilen.push('    _kein Muster getroffen — weder rote noch grüne Flagge_');
      for (const f of e.code.funde) {
        zeilen.push(`    - ${f.art === 'rot' ? '🔴' : '🟢'} \`${f.name}\` → ${f.stellen.join(', ')}`);
      }
    }
  }

  zeilen.push(`- **Offen für dich:** ${e.offen.join(' ')}`);
}

zeilen.push('');
zeilen.push('---');
zeilen.push('');
zeilen.push('Erinnerung: Nicht Belegbares bekommt `qualitaet: "ungeprueft"`, Vermutungen werden als');
zeilen.push('`sicherheit: "vermutung"` gekennzeichnet. Lieber ein Feld leer als falsch (CLAUDE.md §2.4).');
zeilen.push('');

const ordner = pfad('data', '.prefetch');
mkdirSync(ordner, { recursive: true });
const zielPfad = pfad('data', '.prefetch', RUNDE ? `runde-${RUNDE}.md` : 'prefetch.md');
writeFileSync(zielPfad, zeilen.join('\n'), 'utf8');
writeFileSync(cachePfad, JSON.stringify(cache, null, 2), 'utf8');

/* ------------------------------ Ergebnis ------------------------------ */

const nachLage = {};
for (const e of ergebnisse) nachLage[e.lage] = (nachLage[e.lage] || 0) + 1;

for (const e of ergebnisse) {
  const farbe = e.lage === 'ok' ? (e.meta?.archiviert ? gelb : gruen) : e.lage === '404' || e.lage === 'kein-link' ? rot : gelb;
  const zusatz = e.lage === 'ok'
    ? `${e.meta.archiviert ? 'ARCHIVIERT · ' : ''}Push ${e.meta.push}${e.code?.funde?.length ? ` · ${e.code.funde.length} Muster` : ''}`
    : e.kandidaten?.length ? `${e.kandidaten.length} Namens-Kandidaten` : e.lage;
  console.log(`  ${farbe(zeichenLage[e.lage] || '·')} ${fett(e.id.padEnd(24))} ${grau(zusatz)}`);
}

console.log(fett('\nErgebnis'));
for (const [lage, n] of Object.entries(nachLage)) console.log(`  ${grau(lage.padEnd(14))} ${n}`);
console.log(grau(`\n  API-Aufrufe ${zaehler.api} · Rohdateien ${zaehler.roh} · aus Cache ${zaehler.cache}${zaehler.fehler ? ' · Fehler ' + zaehler.fehler : ''}`));
console.log(gruen(`\n✔ Briefing: `) + fett(relPfad(zielPfad)));
console.log(grau('  Diesen Pfad den Recherche-Subagents im Prompt nennen — nicht den Inhalt hineinkopieren.\n'));
