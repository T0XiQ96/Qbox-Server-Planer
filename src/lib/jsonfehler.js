/**
 * jsonfehler.js — JSON-Parsen mit brauchbarer Fehlermeldung.
 *
 * Wird von BEIDEN Seiten benutzt: von scripts/validate.mjs auf der Kommandozeile und
 * vom Katalog-Import in der App (Feature E4). Eine Meldung wie "Ungültige Katalog-Datei"
 * darf es nirgends mehr geben — jede Meldung nennt Datei, Zeile, Spalte, das betroffene
 * Feld, das umgebende Plugin und die Ursache im Klartext.
 *
 * Geparst wird mit JSON.parse. Die FEHLERSTELLE sucht dagegen ein eigener Scanner, denn die
 * Fehlertexte der Engines sind untereinander unvereinbar: V8 nennt eine Position, Firefox und
 * Safari formulieren ganz anders, und bei "Unexpected token" nennt V8 überhaupt keine Position.
 * Ein eigener Scanner liefert überall dieselbe Auskunft — auf der Kommandozeile wie im Browser.
 *
 * Enthält keine Node- und keine Browser-APIs.
 */

/** Ursachen, die wir im Klartext benennen können. */
const URSACHEN = {
  KEY_OHNE_START: 'Schlüssel ohne öffnendes Anführungszeichen',
  KEY_OHNE_ENDE: 'Schlüssel ohne schließendes Anführungszeichen',
  QUOTE_IM_TEXT: 'Nicht escapetes Anführungszeichen (") im Text',
  JS_LITERAL: 'JS-Objektliteral statt JSON: Schlüssel ohne Anführungszeichen',
  EINFACHE_QUOTES: "Einfache Anführungszeichen (') statt doppelter",
  KOMMA_AM_ENDE: 'Komma hinter dem letzten Element',
  KOMMA_FEHLT: 'Komma zwischen zwei Einträgen fehlt',
  ZEILENUMBRUCH: 'Zeilenumbruch mitten in einem Text',
  STRING_OFFEN: 'Text ohne schließendes Anführungszeichen',
  ABGESCHNITTEN: 'Datei endet mitten im Inhalt (abgeschnitten oder Klammer fehlt)',
  MUELL_AM_ENDE: 'Nach dem Ende der Daten steht noch etwas',
  UNBEKANNT: 'JSON-Syntaxfehler'
};

/**
 * Parst JSON und liefert bei einem Fehler eine vollständig aufbereitete Diagnose.
 * @param {string} text  Dateiinhalt
 * @param {string} datei Dateiname für die Meldung (bei Uploads der Name der gewählten Datei)
 * @returns {{ok:true, daten:any} | {ok:false, fehler:object}}
 */
export function parseJson(text, datei = 'unbekannt') {
  const roh = typeof text === 'string' ? text : String(text);
  const inhalt = roh.charCodeAt(0) === 0xfeff ? roh.slice(1) : roh; // BOM abschneiden

  try {
    return { ok: true, daten: JSON.parse(inhalt) };
  } catch (e) {
    return { ok: false, fehler: diagnose(inhalt, e, datei) };
  }
}

/**
 * Baut die Diagnose zu einem gescheiterten Parse-Versuch.
 * @returns {{datei:string, zeile:number, spalte:number, position:number, ursache:string,
 *            hinweis:string, feld:string, plugin:string, ausschnitt:string, zeiger:string, roh:string}}
 */
export function diagnose(inhalt, fehler, datei = 'unbekannt') {
  const meldung = String(fehler && fehler.message ? fehler.message : fehler);

  const stelle = scanne(inhalt) || { art: 'unbekannt', pos: engineposition(meldung, inhalt) };
  const erkannt = ursacheErkennen(inhalt, stelle, meldung);
  const zeigerPos = Math.max(0, Math.min(erkannt.zeigerPos != null ? erkannt.zeigerPos : stelle.pos, inhalt.length));

  const { zeile, spalte } = zeilePosition(inhalt, zeigerPos);
  const umfeld = feldUndPlugin(inhalt, zeigerPos);
  const sicht = ausschnitt(inhalt, zeigerPos);

  return {
    datei,
    zeile,
    spalte,
    position: zeigerPos,
    ursache: erkannt.ursache,
    hinweis: erkannt.hinweis || '',
    feld: erkannt.feld || umfeld.feld,
    plugin: umfeld.plugin,
    ausschnitt: sicht.zeile,
    zeiger: sicht.zeiger,
    roh: meldung
  };
}

/** Formatiert eine Diagnose als mehrzeiligen deutschen Text (Konsole wie Browser). */
export function fehlerText(f) {
  const zeilen = [`${f.datei}:${f.zeile}:${f.spalte}`];

  const wo = [];
  if (f.plugin) wo.push(`bei Plugin "${f.plugin}"`);
  if (f.feld) wo.push(`Feld "${f.feld}"`);
  if (wo.length) zeilen.push('  ' + wo.join(', '));

  zeilen.push('  ' + f.ursache);
  if (f.hinweis) zeilen.push('  ' + f.hinweis);
  zeilen.push('  ' + f.ausschnitt);
  zeilen.push('  ' + f.zeiger);
  return zeilen.join('\n');
}

/* ========================================================================== */
/*  Scanner — findet die Fehlerstelle unabhängig von der JS-Engine            */
/* ========================================================================== */

/**
 * Läuft den Text nach JSON-Regeln ab und meldet die erste Stelle, an der er nicht aufgeht.
 * @returns {{art:string, pos:number, schluessel?:object}|null} null = keine Stelle gefunden
 */
function scanne(t) {
  let i = 0;
  const n = t.length;

  const leer = () => { while (i < n && (t[i] === ' ' || t[i] === '\t' || t[i] === '\n' || t[i] === '\r')) i++; };
  const stelle = (art, pos = i, extra) => ({ art, pos, ...extra });

  function zeichenkette() {
    const start = i;
    i++; // öffnendes "
    while (i < n) {
      const c = t[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '"') { i++; return { start, ende: i - 1, inhalt: t.slice(start + 1, i - 1) }; }
      if (c === '\n') return { fehler: stelle('zeilenumbruch_im_text', i) };
      i++;
    }
    return { fehler: stelle('string_offen', start) };
  }

  function zahl() {
    const start = i;
    if (t[i] === '-') i++;
    while (i < n && t[i] >= '0' && t[i] <= '9') i++;
    if (t[i] === '.') { i++; while (i < n && t[i] >= '0' && t[i] <= '9') i++; }
    if (t[i] === 'e' || t[i] === 'E') {
      i++;
      if (t[i] === '+' || t[i] === '-') i++;
      while (i < n && t[i] >= '0' && t[i] <= '9') i++;
    }
    return i === start ? stelle('wert_erwartet', start) : null;
  }

  function objekt() {
    i++; // {
    leer();
    if (t[i] === '}') { i++; return null; }

    for (;;) {
      leer();
      if (i >= n) return stelle('ende_der_datei', n);
      if (t[i] !== '"') return stelle('schluessel_erwartet');

      const s = zeichenkette();
      if (s.fehler) return s.fehler;

      leer();
      if (t[i] !== ':') return stelle('doppelpunkt_erwartet', i, { schluessel: s });
      i++;

      const f = wert();
      if (f) return f;

      leer();
      if (t[i] === ',') { i++; continue; }
      if (t[i] === '}') { i++; return null; }
      if (i >= n) return stelle('ende_der_datei', n);
      return stelle('komma_oder_ende_erwartet');
    }
  }

  function liste() {
    i++; // [
    leer();
    if (t[i] === ']') { i++; return null; }

    for (;;) {
      const f = wert();
      if (f) return f;

      leer();
      if (t[i] === ',') { i++; continue; }
      if (t[i] === ']') { i++; return null; }
      if (i >= n) return stelle('ende_der_datei', n);
      return stelle('komma_oder_ende_erwartet');
    }
  }

  function wert() {
    leer();
    if (i >= n) return stelle('ende_der_datei', n);

    const c = t[i];
    if (c === '{') return objekt();
    if (c === '[') return liste();
    if (c === '"') { const s = zeichenkette(); return s.fehler || null; }
    if (c === '-' || (c >= '0' && c <= '9')) return zahl();
    if (t.startsWith('true', i)) { i += 4; return null; }
    if (t.startsWith('false', i)) { i += 5; return null; }
    if (t.startsWith('null', i)) { i += 4; return null; }
    return stelle('wert_erwartet');
  }

  const f = wert();
  if (f) return f;
  leer();
  return i < n ? stelle('muell_am_ende') : null;
}

/* ========================================================================== */
/*  Ursachen benennen                                                         */
/* ========================================================================== */

function ursacheErkennen(inhalt, stelle, meldung) {
  const pos = stelle.pos;
  const ab = inhalt.slice(pos, pos + 200);
  const davorRoh = inhalt.slice(0, pos);
  const davor = davorRoh.replace(/\s+$/, '');

  switch (stelle.art) {
    case 'ende_der_datei':
      return { ursache: URSACHEN.ABGESCHNITTEN, hinweis: 'Es fehlt eine schließende Klammer, oder die Datei wurde beim Kopieren abgeschnitten.' };

    case 'string_offen':
      return { ursache: URSACHEN.STRING_OFFEN, hinweis: 'Der Text ab hier wird nie geschlossen — meist fehlt ein " oder eines steht unescaped mitten im Text.' };

    case 'zeilenumbruch_im_text':
      return { ursache: URSACHEN.ZEILENUMBRUCH, hinweis: 'Ein Zeilenumbruch im Text muss als \\n geschrieben werden.' };

    case 'schluessel_erwartet': {
      // Komma hinter dem letzten Element: { "a": 1, }
      if (ab.startsWith('}') && davor.endsWith(',')) {
        return { ursache: URSACHEN.KOMMA_AM_ENDE, hinweis: 'Das letzte Feld eines Objekts bekommt kein Komma.', zeigerPos: davor.length - 1 };
      }
      // cons":[  — das öffnende Anführungszeichen fehlt
      let m = ab.match(/^([A-Za-z_][A-Za-z0-9_-]*)"\s*:/);
      if (m) {
        return { ursache: URSACHEN.KEY_OHNE_START, feld: m[1], hinweis: `Erwartet wird "${m[1]}": — geschrieben steht ${m[1]}":` };
      }
      // { id: "x" } — JS-Objektliteral
      m = ab.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/);
      if (m) {
        return { ursache: URSACHEN.JS_LITERAL, feld: m[1], hinweis: `JSON verlangt "${m[1]}": mit Anführungszeichen. JS-Objektliterale sind kein JSON.` };
      }
      if (ab.startsWith("'")) {
        return { ursache: URSACHEN.EINFACHE_QUOTES, hinweis: 'JSON kennt nur doppelte Anführungszeichen.' };
      }
      // Ein Wert-String wurde vorzeitig beendet, deshalb steht hier scheinbar ein Schlüssel.
      const s = stringDavor(inhalt, pos);
      if (s && /[„“”«»]/.test(s.inhalt)) return quoteImText(s);
      return { ursache: URSACHEN.UNBEKANNT, hinweis: 'Hier wird ein Feldname in Anführungszeichen erwartet. Originalmeldung: ' + meldung };
    }

    case 'wert_erwartet': {
      // Komma hinter dem letzten Element: [ 1, ]
      if (ab.startsWith(']') && davor.endsWith(',')) {
        return { ursache: URSACHEN.KOMMA_AM_ENDE, hinweis: 'Das letzte Element einer Liste bekommt kein Komma.', zeigerPos: davor.length - 1 };
      }
      if (ab.startsWith("'")) {
        return { ursache: URSACHEN.EINFACHE_QUOTES, hinweis: 'JSON kennt nur doppelte Anführungszeichen.' };
      }
      return { ursache: URSACHEN.UNBEKANNT, hinweis: 'Hier wird ein Wert erwartet. Originalmeldung: ' + meldung };
    }

    case 'doppelpunkt_erwartet': {
      // "cons:[  — das schließende Anführungszeichen des Schlüssels fehlt,
      // deshalb hat der Scanner den Doppelpunkt mit in den Namen gezogen.
      const s = stelle.schluessel;
      const k = s && s.inhalt.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:/);
      if (k) {
        return {
          ursache: URSACHEN.KEY_OHNE_ENDE,
          feld: k[1],
          hinweis: `Erwartet wird "${k[1]}": — geschrieben steht "${k[1]}:`,
          zeigerPos: s.start
        };
      }
      return { ursache: URSACHEN.UNBEKANNT, hinweis: 'Zwischen Feldname und Wert fehlt der Doppelpunkt.' };
    }

    case 'komma_oder_ende_erwartet': {
      const s = stringDavor(inhalt, pos);
      if (s) return quoteImText(s);
      return { ursache: URSACHEN.KOMMA_FEHLT, hinweis: 'Zwischen zwei Einträgen fehlt ein Komma — oder ein Wert wurde vorzeitig beendet.' };
    }

    case 'muell_am_ende':
      return { ursache: URSACHEN.MUELL_AM_ENDE, hinweis: 'Die Daten sind hier zu Ende. Wurden zwei Dateien aneinandergehängt?' };

    default:
      return { ursache: URSACHEN.UNBEKANNT, hinweis: 'Originalmeldung: ' + meldung };
  }
}

function quoteImText(s) {
  const deutsch = /[„“”«»]/.test(s.inhalt);
  return {
    ursache: URSACHEN.QUOTE_IM_TEXT,
    hinweis: deutsch
      ? 'Im Text steht ein deutsches Anführungszeichen „ und als Abschluss ein gerades ". Richtig ist entweder “ oder ein escapetes \\".'
      : 'Der Wert wurde vorzeitig beendet. Ein " mitten im Text muss als \\" geschrieben werden.',
    zeigerPos: s.ende
  };
}

/* ========================================================================== */
/*  Kleinkram                                                                 */
/* ========================================================================== */

/** Nur noch Rückfallebene, falls der Scanner nichts findet. */
function engineposition(meldung, inhalt) {
  const m = meldung.match(/position (\d+)/i);
  if (m) return Math.min(+m[1], Math.max(0, inhalt.length - 1));

  const lz = meldung.match(/line (\d+) column (\d+)/i);
  if (lz) {
    const zeilen = inhalt.split('\n');
    let p = 0;
    for (let i = 0; i < +lz[1] - 1 && i < zeilen.length; i++) p += zeilen[i].length + 1;
    return Math.min(p + (+lz[2] - 1), Math.max(0, inhalt.length - 1));
  }
  return Math.max(0, inhalt.length - 1);
}

function zeilePosition(inhalt, pos) {
  const vorher = inhalt.slice(0, pos);
  return { zeile: vorher.split('\n').length, spalte: pos - vorher.lastIndexOf('\n') };
}

/**
 * Findet den String, der unmittelbar vor pos abgeschlossen wurde.
 * @returns {{start:number, ende:number, inhalt:string}|null}
 */
function stringDavor(inhalt, pos) {
  let i = pos - 1;
  while (i >= 0 && /\s/.test(inhalt[i])) i--;
  if (i < 0 || inhalt[i] !== '"') return null;

  const ende = i;
  for (let j = i - 1; j >= 0; j--) {
    if (inhalt[j] === '"') {
      let schraegstriche = 0;
      for (let k = j - 1; k >= 0 && inhalt[k] === '\\'; k--) schraegstriche++;
      if (schraegstriche % 2 === 0) return { start: j, ende, inhalt: inhalt.slice(j + 1, ende) };
    }
    if (inhalt[j] === '\n' && j < i - 600) break; // Reißleine bei kaputten Dateien
  }
  return null;
}

/** Sucht rückwärts das zuletzt geöffnete Feld und die zuletzt gesehene Plugin-id. */
function feldUndPlugin(inhalt, pos) {
  const davor = inhalt.slice(0, pos);

  let feld = '';
  const felder = /"([A-Za-z_][A-Za-z0-9_-]*)"\s*:/g;
  let m;
  while ((m = felder.exec(davor)) !== null) feld = m[1];

  let plugin = '';
  const ids = /"id"\s*:\s*"([^"\n]{1,64})"/g;
  while ((m = ids.exec(davor)) !== null) plugin = m[1];

  if (feld === 'id') feld = '';
  return { feld, plugin };
}

/** Schneidet die betroffene Zeile auf Fensterbreite zu und baut den Zeiger darunter. */
function ausschnitt(inhalt, pos, breite = 55) {
  const zeilenStart = inhalt.lastIndexOf('\n', pos - 1) + 1;
  let zeilenEnde = inhalt.indexOf('\n', pos);
  if (zeilenEnde < 0) zeilenEnde = inhalt.length;

  const zeile = inhalt.slice(zeilenStart, zeilenEnde);
  const spalteInZeile = pos - zeilenStart;

  const von = Math.max(0, spalteInZeile - breite);
  const bis = Math.min(zeile.length, spalteInZeile + breite);

  const prefix = von > 0 ? '…' : '';
  const suffix = bis < zeile.length ? '…' : '';

  return {
    zeile: prefix + zeile.slice(von, bis).replace(/\t/g, ' ') + suffix,
    zeiger: ' '.repeat(prefix.length + (spalteInZeile - von)) + '^'
  };
}
