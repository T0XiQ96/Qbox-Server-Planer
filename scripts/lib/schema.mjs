/**
 * schema.mjs — schlanker JSON-Schema-Prüfer für genau unser Schema.
 *
 * Bewusst keine Abhängigkeit (Entscheidung D15): das Repo muss in Jahren ohne
 * "npm install" laufen. Unterstützt die Schlüsselwörter, die schema/plugin.schema.json
 * benutzt — nicht mehr, aber vollständig und mit deutschen Meldungen:
 *
 *   $ref (nur lokal), $defs, allOf, type, enum, const, pattern,
 *   minLength, maxLength, minimum, maximum, minItems,
 *   properties, required, additionalProperties (false), items
 *
 * Trifft der Prüfer auf ein Schlüsselwort, das er nicht kennt, meldet er das laut,
 * statt es stillschweigend zu übergehen — sonst entstünde eine Prüflücke.
 */

const BEKANNT = new Set([
  '$schema', '$id', '$ref', '$defs', '$comment', 'title', 'description', '_regeln',
  'allOf', 'type', 'enum', 'const', 'pattern', 'minLength', 'maxLength',
  'minimum', 'maximum', 'minItems', 'properties', 'required', 'additionalProperties', 'items'
]);

const TYP_NAMEN = {
  string: 'Text', number: 'Zahl', integer: 'ganze Zahl', boolean: 'Ja/Nein',
  object: 'Objekt', array: 'Liste', null: 'null'
};

/**
 * @param {any} wert     zu prüfende Daten
 * @param {object} schema Wurzelschema
 * @returns {Array<{pfad:string, meldung:string}>} leere Liste = in Ordnung
 */
export function pruefe(wert, schema) {
  const fehler = [];
  gehe(wert, schema, schema, '', fehler);
  return fehler;
}

/**
 * Meldet Schlüsselwörter im Schema, die dieser Prüfer nicht auswertet.
 * Steigt gezielt nur dorthin ab, wo wieder ein Schema steht — unter "properties" und "$defs"
 * sind die Schlüssel Feldnamen, keine Schlüsselwörter.
 */
export function unbekannteSchluessel(schema, pfad = '#') {
  const treffer = [];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return treffer;

  for (const k of Object.keys(schema)) {
    if (!BEKANNT.has(k) && !k.startsWith('_')) treffer.push(`${pfad}/${k}`);
  }

  for (const behaelter of ['properties', '$defs']) {
    for (const [name, teil] of Object.entries(schema[behaelter] || {})) {
      treffer.push(...unbekannteSchluessel(teil, `${pfad}/${behaelter}/${name}`));
    }
  }
  if (schema.items) treffer.push(...unbekannteSchluessel(schema.items, `${pfad}/items`));
  for (const [i, teil] of (schema.allOf || []).entries()) {
    treffer.push(...unbekannteSchluessel(teil, `${pfad}/allOf/${i}`));
  }

  return treffer;
}

/* ------------------------------------------------------------------ */

function gehe(wert, schema, wurzel, pfad, fehler) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.$ref) {
    const ziel = aufloesen(schema.$ref, wurzel);
    if (!ziel) { fehler.push({ pfad, meldung: `Schema-Verweis ${schema.$ref} nicht auflösbar` }); return; }
    gehe(wert, ziel, wurzel, pfad, fehler);
    // Geschwister-Schlüsselwörter neben $ref weiter prüfen (z.B. description) — unschädlich.
  }

  if (Array.isArray(schema.allOf)) {
    for (const teil of schema.allOf) gehe(wert, teil, wurzel, pfad, fehler);
  }

  if (schema.type !== undefined && !typPasst(wert, schema.type)) {
    const erwartet = [].concat(schema.type).map((t) => TYP_NAMEN[t] || t).join(' oder ');
    fehler.push({ pfad, meldung: `erwartet ${erwartet}, gefunden ${typVon(wert)}` });
    return; // Folgefehler wären nur Rauschen
  }

  if (schema.enum && !schema.enum.some((e) => gleich(e, wert))) {
    fehler.push({ pfad, meldung: `Wert ${JSON.stringify(wert)} ist nicht erlaubt. Erlaubt: ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}` });
  }
  if (schema.const !== undefined && !gleich(schema.const, wert)) {
    fehler.push({ pfad, meldung: `muss ${JSON.stringify(schema.const)} sein` });
  }

  if (typeof wert === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(wert)) {
      fehler.push({ pfad, meldung: `"${kurz(wert)}" passt nicht zum erlaubten Muster ${schema.pattern}` });
    }
    if (schema.minLength !== undefined && wert.length < schema.minLength) {
      fehler.push({ pfad, meldung: `zu kurz: ${wert.length} Zeichen, mindestens ${schema.minLength} nötig` });
    }
    if (schema.maxLength !== undefined && wert.length > schema.maxLength) {
      fehler.push({ pfad, meldung: `zu lang: ${wert.length} Zeichen, höchstens ${schema.maxLength} erlaubt` });
    }
  }

  if (typeof wert === 'number') {
    if (schema.minimum !== undefined && wert < schema.minimum) fehler.push({ pfad, meldung: `${wert} ist kleiner als ${schema.minimum}` });
    if (schema.maximum !== undefined && wert > schema.maximum) fehler.push({ pfad, meldung: `${wert} ist größer als ${schema.maximum}` });
  }

  if (Array.isArray(wert)) {
    if (schema.minItems !== undefined && wert.length < schema.minItems) {
      fehler.push({ pfad, meldung: `Liste braucht mindestens ${schema.minItems} Einträge` });
    }
    if (schema.items) wert.forEach((el, i) => gehe(el, schema.items, wurzel, `${pfad}[${i}]`, fehler));
  }

  if (wert && typeof wert === 'object' && !Array.isArray(wert)) {
    for (const pflicht of schema.required || []) {
      if (wert[pflicht] === undefined) fehler.push({ pfad: pfad || '(Wurzel)', meldung: `Pflichtfeld "${pflicht}" fehlt` });
    }
    if (schema.properties) {
      for (const [feld, teilSchema] of Object.entries(schema.properties)) {
        if (wert[feld] !== undefined) gehe(wert[feld], teilSchema, wurzel, pfad ? `${pfad}.${feld}` : feld, fehler);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const feld of Object.keys(wert)) {
        if (!(feld in schema.properties)) {
          fehler.push({ pfad: pfad || '(Wurzel)', meldung: `unbekanntes Feld "${feld}" — Tippfehler? Erlaubt sind: ${Object.keys(schema.properties).join(', ')}` });
        }
      }
    }
  }
}

function aufloesen(ref, wurzel) {
  if (!ref.startsWith('#/')) return null;
  let ziel = wurzel;
  for (const teil of ref.slice(2).split('/')) {
    ziel = ziel && ziel[teil.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (ziel === undefined) return null;
  }
  return ziel;
}

function typVon(w) {
  if (w === null) return 'null';
  if (Array.isArray(w)) return 'Liste';
  if (Number.isInteger(w)) return 'ganze Zahl';
  return TYP_NAMEN[typeof w] || typeof w;
}

function typPasst(wert, typ) {
  return [].concat(typ).some((t) => {
    switch (t) {
      case 'string': return typeof wert === 'string';
      case 'number': return typeof wert === 'number' && Number.isFinite(wert);
      case 'integer': return Number.isInteger(wert);
      case 'boolean': return typeof wert === 'boolean';
      case 'object': return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
      case 'array': return Array.isArray(wert);
      case 'null': return wert === null;
      default: return false;
    }
  });
}

const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const kurz = (s) => (s.length > 40 ? s.slice(0, 40) + '…' : s);
