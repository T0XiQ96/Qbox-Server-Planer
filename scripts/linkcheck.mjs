#!/usr/bin/env node
/**
 * linkcheck.mjs — HTTP-Status aller Links prüfen und nach link_status/link_geprueft_am zurückschreiben.
 *
 * Das hier ist eine NEBENSACHE (CLAUDE.md §5): es findet 404 und Umzüge, ersetzt aber NICHT
 * die inhaltliche Prüfung nach docs/RECHERCHE.md. Ein grüner Statuscode sagt nichts darüber,
 * ob das Plugin unter Qbox läuft.
 *
 * Läuft über die IP des Nutzers, deshalb bewusst zurückhaltend:
 *   · höchstens 4 Anfragen gleichzeitig
 *   · Ergebnis-Cache mit 30 Tagen Gültigkeit
 *   · bei 429 oder 403 wird der ganze Host für diesen Lauf übersprungen
 *   · Shops mit bekanntem Bot-Schutz werden gar nicht erst angefragt
 *
 * Aufruf: npm run linkcheck            schreibt zurück
 *         npm run linkcheck -- --dry   nur anzeigen
 *         npm run linkcheck -- --alle  Cache ignorieren
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { katalogDateien, ladeJson, pfad, relPfad, rot, gruen, gelb, blau, grau, fett } from './lib/katalog.mjs';

const TROCKEN = process.argv.includes('--dry');
const ALLE = process.argv.includes('--alle');
const PARALLEL = 4;
const CACHE_TAGE = 30;
const TIMEOUT_MS = 12000;

/** Shops mit Bot-Schutz: eine Anfrage bringt nur einen 403 und kostet Reputation. */
const BOT_SCHUTZ = [
  'tebex.io', 'quasar-store.com', 'jgscripts.com', 'wasabiscripts.com',
  'tgiann.com', 'stgscripts.com', 'kuzquality.com', 'okokscripts.io',
  'codesign.pro', 'fivem.net/store', 'store.fivem.net'
];

const heute = new Date().toISOString().slice(0, 10);
const cachePfad = pfad('data', '.linkcache.json');
const cache = existsSync(cachePfad) ? JSON.parse(readFileSync(cachePfad, 'utf8')) : {};

/* --------------------------- Links einsammeln --------------------------- */

const dateien = [];
for (const p of katalogDateien()) {
  const erg = ladeJson(p);
  if (!erg.ok) { console.log(rot(erg.text) + '\n'); continue; }
  dateien.push({ pfad: p, name: relPfad(p), daten: erg.daten, geaendert: false });
}

const aufgaben = [];
for (const d of dateien) {
  for (const p of d.daten.plugins || []) {
    if (p && typeof p.link === 'string' && /^https?:\/\//.test(p.link)) aufgaben.push({ datei: d, plugin: p });
  }
}

if (!aufgaben.length) {
  console.log(grau('\nKeine Links im Katalog.\n'));
  process.exit(0);
}

console.log(fett(`\nnpm run linkcheck`) + grau(`  ·  ${aufgaben.length} Links, ${PARALLEL} parallel`));
console.log(gelb('  Hinweis: prüft nur die Erreichbarkeit. Die inhaltliche Prüfung läuft nach docs/RECHERCHE.md.\n'));

/* ------------------------------- Prüfen ------------------------------- */

const gesperrteHosts = new Set();
const zaehler = { ok: 0, umgezogen: 0, tot: 0, gesperrt: 0, cache: 0, uebersprungen: 0 };
const meldungen = [];

const hostVon = (url) => { try { return new URL(url).host; } catch { return ''; } };
const istBotGeschuetzt = (url) => BOT_SCHUTZ.some((h) => url.toLowerCase().includes(h));

function ausCache(url) {
  const e = cache[url];
  if (!e || ALLE) return null;
  const alter = (Date.parse(heute) - Date.parse(e.geprueft)) / 86400000;
  return alter <= CACHE_TAGE ? e : null;
}

async function hole(url, methode) {
  const abbruch = new AbortController();
  const uhr = setTimeout(() => abbruch.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: methode,
      redirect: 'follow',
      signal: abbruch.signal,
      headers: { 'User-Agent': 'qbox-server-planer/3.0 (Linkcheck, 4 parallel)' }
    });
  } finally {
    clearTimeout(uhr);
  }
}

async function pruefeLink(url) {
  let res;
  try {
    res = await hole(url, 'HEAD');
    if ([403, 405, 501, 404].includes(res.status)) res = await hole(url, 'GET'); // manche Hosts mögen kein HEAD
  } catch (e) {
    return { status: 'ungeprueft', grund: e.name === 'AbortError' ? 'Zeitüberschreitung' : String(e.cause?.code || e.message) };
  }

  if (res.status === 429 || res.status === 403) return { status: 'gesperrt', code: res.status, grund: 'Host blockt (' + res.status + ')' };
  if (res.status === 404 || res.status === 410) return { status: '404', code: res.status };

  const zielGleich = res.url.replace(/\/$/, '') === url.replace(/\/$/, '');
  if (res.ok && !zielGleich) return { status: 'umgezogen', code: res.status, ziel: res.url };
  if (res.ok) return { status: 'ok', code: res.status };
  return { status: 'ungeprueft', code: res.status, grund: 'HTTP ' + res.status };
}

async function arbeite(aufgabe) {
  const p = aufgabe.plugin;
  const url = p.link;

  if (istBotGeschuetzt(url)) {
    zaehler.uebersprungen++;
    meldungen.push({ art: 'skip', id: p.id, text: 'Shop mit Bot-Schutz — nicht angefragt, Status bleibt "' + p.link_status + '"' });
    return;
  }
  if (gesperrteHosts.has(hostVon(url))) {
    zaehler.uebersprungen++;
    meldungen.push({ art: 'skip', id: p.id, text: `Host ${hostVon(url)} blockt in diesem Lauf — übersprungen` });
    return;
  }

  let erg = ausCache(url);
  if (erg) zaehler.cache++;
  else {
    erg = await pruefeLink(url);
    cache[url] = { status: erg.status, geprueft: heute, ziel: erg.ziel || '', code: erg.code || 0 };
    if (erg.status === 'gesperrt') gesperrteHosts.add(hostVon(url));
  }

  // "ungeprueft" bedeutet: wir wissen es nicht. Dann bleibt der bisherige Stand stehen.
  if (erg.status !== 'ungeprueft') {
    if (p.link_status !== erg.status || p.link_geprueft_am !== heute) {
      p.link_status = erg.status;
      p.link_geprueft_am = heute;
      aufgabe.datei.geaendert = true;
    }
  }

  if (erg.status === 'ok') zaehler.ok++;
  else if (erg.status === 'umgezogen') { zaehler.umgezogen++; meldungen.push({ art: 'move', id: p.id, text: `→ ${erg.ziel || cache[url].ziel}` }); }
  else if (erg.status === '404') { zaehler.tot++; meldungen.push({ art: 'tot', id: p.id, text: `404 · ${url}` }); }
  else if (erg.status === 'gesperrt') { zaehler.gesperrt++; meldungen.push({ art: 'skip', id: p.id, text: erg.grund || 'blockt' }); }
  else meldungen.push({ art: 'skip', id: p.id, text: erg.grund || 'nicht prüfbar' });
}

/** Einfache Warteschlange mit fester Breite. */
async function abarbeiten(liste, breite) {
  let i = 0;
  let fertig = 0;
  const arbeiter = Array.from({ length: breite }, async () => {
    while (i < liste.length) {
      const meine = liste[i++];
      await arbeite(meine);
      fertig++;
      if (fertig % 10 === 0 || fertig === liste.length) {
        process.stdout.write(grau(`\r  ${fertig}/${liste.length} geprüft …`));
      }
    }
  });
  await Promise.all(arbeiter);
  process.stdout.write('\r' + ' '.repeat(40) + '\r');
}

await abarbeiten(aufgaben, PARALLEL);

/* ------------------------------ Ergebnis ------------------------------ */

for (const m of meldungen) {
  const farbe = m.art === 'tot' ? rot : m.art === 'move' ? gelb : grau;
  const zeichen = m.art === 'tot' ? '✖' : m.art === 'move' ? '↪' : '·';
  console.log(`  ${farbe(zeichen)} ${fett(m.id.padEnd(24))} ${farbe(m.text)}`);
}

console.log(fett('\nErgebnis'));
console.log(`  ${gruen('ok')}          ${zaehler.ok}`);
console.log(`  ${gelb('umgezogen')}   ${zaehler.umgezogen}`);
console.log(`  ${rot('404')}         ${zaehler.tot}`);
console.log(`  ${grau('gesperrt')}    ${zaehler.gesperrt}`);
console.log(`  ${grau('übersprungen')} ${zaehler.uebersprungen}`);
console.log(`  ${grau('aus Cache')}   ${zaehler.cache}`);

if (!TROCKEN) {
  writeFileSync(cachePfad, JSON.stringify(cache, null, 2), 'utf8');
  let geschrieben = 0;
  for (const d of dateien) {
    if (!d.geaendert) continue;
    writeFileSync(d.pfad, JSON.stringify(d.daten, null, 2) + '\n', 'utf8');
    geschrieben++;
  }
  console.log(geschrieben
    ? gruen(`\n✔ ${geschrieben} Katalogdatei(en) aktualisiert.`) + grau('  Danach: npm run validate\n')
    : grau('\nKeine Änderung an den Katalogdateien.\n'));
} else {
  console.log(grau('\n--dry: nichts geschrieben.\n'));
}
