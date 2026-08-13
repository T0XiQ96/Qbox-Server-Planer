/**
 * netz.mjs — gemeinsame HTTP-Schicht für prefetch und discover.
 *
 * Beide Scripts laufen über die IP des Nutzers, deshalb müssen für beide dieselben Regeln
 * gelten: Timeout, Ergebnis-Cache, Token aus der Umgebung, feste Parallelität. Sie stehen
 * hier an einer Stelle, damit ein zweites Werkzeug nicht versehentlich unhöflicher wird als
 * das erste — das war bei linkcheck/prefetch schon einmal fast passiert.
 *
 * Die GitHub-API hängt am Stundenlimit (60 ohne Token, 5000 mit), raw.githubusercontent.com
 * nicht. Deshalb bleibt die Trennung holeApi/holeRoh bestehen: was über raw geht, ist billig.
 */

import { writeFileSync, existsSync, readFileSync } from 'node:fs';

export const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

/** Warteschlange fester Breite — gleiche Form wie in linkcheck.mjs. */
export async function parallel(liste, breite, arbeit) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(breite, liste.length || 1) }, async () => {
    while (i < liste.length) await arbeit(liste[i++]);
  }));
}

/**
 * Erzeugt eine Netz-Schicht mit eigenem Cache.
 *
 * Jedes Werkzeug bekommt seine eigene Cache-Datei, weil die Haltbarkeit unterschiedlich ist:
 * bei prefetch zählt der Archiv-Status (kurz), bei discover die Trefferliste (länger).
 *
 * @param {{cachePfad?:string, cacheTage?:number, timeoutMs?:number, maxBytes?:number,
 *          frisch?:boolean, kennung?:string}} opt
 */
export function macheNetz(opt = {}) {
  const {
    cachePfad = null,
    cacheTage = 7,
    timeoutMs = 15000,
    maxBytes = 150_000,
    frisch = false,
    kennung = 'qbox-server-planer/3.0'
  } = opt;

  const heute = new Date().toISOString().slice(0, 10);
  const cache = cachePfad && existsSync(cachePfad) && !frisch
    ? JSON.parse(readFileSync(cachePfad, 'utf8'))
    : {};
  const zaehler = { api: 0, roh: 0, cache: 0, fehler: 0 };

  function ausCache(schluessel) {
    const e = cache[schluessel];
    if (!e) return null;
    const alter = (Date.parse(heute) - Date.parse(e._geholt)) / 86400000;
    if (alter > cacheTage) return null;
    const { _geholt, ...rest } = e;
    return rest;
  }

  function inCache(schluessel, wert) {
    cache[schluessel] = { ...wert, _geholt: heute };
  }

  async function hole(url, kopf = {}) {
    const abbruch = new AbortController();
    const uhr = setTimeout(() => abbruch.abort(), timeoutMs);
    try {
      return await fetch(url, {
        redirect: 'follow',
        signal: abbruch.signal,
        headers: { 'User-Agent': kennung, ...kopf }
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
        erg = { ok: true, status: res.status, text: text.length > maxBytes ? text.slice(0, maxBytes) : text };
      }
    } catch (e) {
      zaehler.fehler++;
      erg = { ok: false, status: 0, grund: String(e.cause?.code || e.message) };
    }
    inCache(merker, erg);
    return erg;
  }

  function speichere() {
    if (cachePfad) writeFileSync(cachePfad, JSON.stringify(cache, null, 2), 'utf8');
  }

  return { hole, holeApi, holeRoh, speichere, zaehler, heute };
}
