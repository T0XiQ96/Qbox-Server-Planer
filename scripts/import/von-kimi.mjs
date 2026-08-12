/**
 * von-kimi.mjs — repariert die 6 bekannten Syntaxdefekte in reference/kimi-kataloge/*.json
 * NUR IM SPEICHER (Originaldateien bleiben unverändert, siehe docs/DECISIONS.md
 * "Korrektur: Ursache der kaputten kimi-Kataloge"). Bricht bei jedem unbekannten Defekt mit
 * der Diagnose aus src/lib/jsonfehler.js ab, statt zu raten — genau der Fehler, den
 * Feature E4 im Tool selbst schon abfängt.
 */
import { readFileSync } from 'node:fs';
import { parseJson, fehlerText } from '../../src/lib/jsonfehler.js';

/** Die 6 bekannten Fixes, je Datei ein exaktes Such-/Ersatzpaar. Reihenfolge egal. */
const BEKANNTE_FIXES = {
  'katalog-runde-01.json': [
    // Zeile 11: ",cons":[" — öffnendes Anführungszeichen am Schlüssel fehlt
    { suche: ',cons":[', ersatz: ',"cons":[' },
    // Zeile 40: „Grandma's House": … — geradesAnführungszeichen im Text nicht escaped
    { suche: "House\": Heilung", ersatz: "House\\\": Heilung" },
    // Zeile 48: „Drücke E"-Hinweise — dito
    { suche: 'E"-Hinweise', ersatz: 'E\\"-Hinweise' },
    // Zeile 75: "cons:[" — schließendes Anführungszeichen am Schlüssel fehlt
    { suche: '"cons:[', ersatz: '"cons":[' }
  ],
  'katalog-runde-02.json': [
    // Zeile 30: „More Than Code"-UI — geradesAnführungszeichen im Text nicht escaped
    { suche: 'Than Code"-UI', ersatz: 'Than Code\\"-UI' },
    // Zeile 44: "pros:[" — schließendes Anführungszeichen am Schlüssel fehlt
    { suche: '"pros:[', ersatz: '"pros":[' }
  ]
};

/**
 * Lädt und repariert eine kimi-Katalogdatei.
 * @returns {{catalogVersion:string, round:number, theme:string, plugins:object[]}}
 */
export function ladeKimi(pfad) {
  const dateiname = pfad.split(/[\\/]/).pop();
  const original = readFileSync(pfad, 'utf8');

  let text = original;
  const fixes = BEKANNTE_FIXES[dateiname] || [];
  for (const { suche, ersatz } of fixes) {
    const anzahl = text.split(suche).length - 1;
    if (anzahl !== 1) {
      throw new Error(
        `${dateiname}: erwarteter bekannter Defekt "${suche}" kommt ${anzahl}× statt 1× vor — ` +
        `Datei hat sich seit der Analyse in docs/DECISIONS.md verändert, Fix nicht sicher anwendbar.`
      );
    }
    text = text.replace(suche, ersatz);
  }

  const ergebnis = parseJson(text, dateiname);
  if (!ergebnis.ok) {
    throw new Error(
      `${dateiname}: nach Anwendung der 6 bekannten Fixes bleibt ein UNBEKANNTER Defekt ` +
      `(kein Raten, siehe docs/RECHERCHE.md):\n` + fehlerText(ergebnis.fehler)
    );
  }
  return ergebnis.daten;
}
