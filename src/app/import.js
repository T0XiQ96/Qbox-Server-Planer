/**
 * import.js — Zustand-Import (E2) und Katalog-Update-Import mit Vorschau (E3, E8, E9, E10).
 *
 * Gespeichert wird nach Entscheidung D3a nur die IMPORT-DIFFERENZ (siehe katalogspeicher.js):
 * die Einträge, die dazukamen oder sich änderten. Der eingebaute Katalog steckt fest in der
 * gebauten HTML-Datei und wird nie mitgesichert — genau daran ist die Vorversion gescheitert,
 * die den kompletten Katalog nach `catalogExtra` in den localStorage schrieb.
 * Meine Haken, Notizen und Prioritäten bleiben in jedem Fall unberührt (Feature E3).
 *
 * Der Zähler klassifiziert jeden Eintrag GENAU EINMAL als neu / aktualisiert / unverändert —
 * die Vorversion zählte "neu" und "aktualisiert" doppelt (docs/CHANGELOG.md).
 */

import { parseJson, fehlerText } from '../lib/jsonfehler.js';
import { pruefe } from '../lib/schema.js';
import { mitStandard } from './defaults.js';
import { istGehakt, setzeZustand, meineDaten, legeBackupAn } from './state.js';
import { merkeEintraege } from './katalogspeicher.js';

/* ============================== E2 — Zustand-Import ============================== */

/** Der Export meines Zustands (Feature E2/E7 — enthält auch meine eigenen Plugins). */
export function baueZustandsExport() {
  return {
    typ: 'qbox-planer-zustand',
    exportiert: new Date().toISOString(),
    ...meineDaten()
  };
}

/**
 * Liest eine Zustandsdatei. Übernimmt noch nichts — das entscheidet der Aufrufer,
 * damit auch hier nichts ungefragt überschrieben wird.
 */
export function leseZustandsDatei(text, dateiname = 'Import') {
  const erg = parseJson(text, dateiname);
  if (!erg.ok) return { ok: false, meldung: fehlerText(erg.fehler), fehler: erg.fehler };

  const d = erg.daten;
  if (!d || typeof d !== 'object' || Array.isArray(d)) {
    return { ok: false, meldung: `${dateiname}\n  Erwartet wird ein Objekt mit meinem Zustand, gefunden: ${Array.isArray(d) ? 'eine Liste' : typeof d}` };
  }
  if (d.plugins && !d.umgebungen) {
    return { ok: false, meldung: `${dateiname}\n  Das sieht nach einer KATALOG-Datei aus (sie hat "plugins"), nicht nach einem Zustand.\n  Für Katalogdateien den Katalog-Import benutzen.` };
  }

  return { ok: true, daten: d };
}

/** Übernimmt einen gelesenen Zustand — mit Sicherheitsnetz, weil dabei mein Stand ersetzt wird. */
export function uebernimmZustand(daten) {
  legeBackupAn('vor Zustand-Import');
  setzeZustand(daten);
}

/* ========================= E3/E8/E9/E10 — Katalog-Vorschau ========================= */

/** Felder, deren Änderung in der Änderungsliste auftaucht. Rein technische Gleichheit. */
function geaenderteFelder(alt, neu) {
  const felder = new Set([...Object.keys(alt || {}), ...Object.keys(neu || {})]);
  felder.delete('update_grund');
  const geaendert = [];
  for (const f of felder) {
    if (JSON.stringify(alt?.[f]) !== JSON.stringify(neu?.[f])) geaendert.push(f);
  }
  return geaendert.sort();
}

/**
 * E9 — wird ein Eintrag, den ich schon gehakt habe, durch dieses Update zum Problemfall?
 * Gewarnt wird nur bei NEUEN Markierungen: was schon vorher archiviert war und trotzdem gehakt ist,
 * weiß ich bereits, das muss nicht bei jedem Import erneut aufpoppen.
 */
function warnungFuer(alt, neu) {
  const umgebungen = ['dev', 'main'].filter((u) => istGehakt(neu.id, u));
  if (!umgebungen.length) return null;

  const gruende = [];
  if (neu.archiviert && !alt?.archiviert) {
    gruende.push({
      art: 'archiviert',
      text: neu.archiviert.text || 'Das Repo ist archiviert.',
      nachfolger: neu.archiviert.nachfolger || ''
    });
  }
  if (neu.kompat_warnung?.sicherheit === 'bestaetigt' && alt?.kompat_warnung?.sicherheit !== 'bestaetigt') {
    gruende.push({ art: 'inkompatibel', text: neu.kompat_warnung.text, nachfolger: '' });
  }
  if (neu.framework === 'qbcore_only' && alt?.framework !== 'qbcore_only') {
    gruende.push({ art: 'inkompatibel', text: 'Läuft laut Katalog nur unter QBCore, nicht unter Qbox.', nachfolger: '' });
  }
  if (neu.stack_hinweis && !alt?.stack_hinweis) {
    gruende.push({ art: 'veraltet', text: neu.stack_hinweis, nachfolger: '' });
  }

  return gruende.length ? { id: neu.id, name: neu.name || neu.id, umgebungen, gruende } : null;
}

/**
 * Baut die Import-Vorschau, ohne irgendetwas zu übernehmen (Feature E10).
 *
 * @param {object} opt
 * @param {string} opt.text            Dateiinhalt
 * @param {string} opt.dateiname
 * @param {object} opt.schema          schema/plugin.schema.json (im Build eingebettet)
 * @param {string[]} opt.kategorienIds erlaubte Kategorien
 * @param {object[]} opt.plugins       aktueller Katalog
 */
export function baueKatalogVorschau({ text, dateiname = 'Import', schema, kategorienIds = [], plugins = [] }) {
  const erg = parseJson(text, dateiname);
  if (!erg.ok) return { ok: false, meldung: fehlerText(erg.fehler), fehler: erg.fehler };

  const daten = erg.daten;

  // Dieselbe Schema-Prüfung wie "npm run validate" — das Schema wird dafür mitgebaut.
  if (schema) {
    const schemafehler = pruefe(daten, schema);
    if (schemafehler.length) {
      return {
        ok: false,
        meldung: `${dateiname}\n  ${schemafehler.length} Schema-Fehler:\n` +
          schemafehler.slice(0, 12).map((f) => `    ${f.pfad || '(Wurzel)'}: ${f.meldung}`).join('\n') +
          (schemafehler.length > 12 ? `\n    … und ${schemafehler.length - 12} weitere` : ''),
        schemafehler
      };
    }
  }

  const vorhanden = new Map(plugins.map((p) => [p.id, p]));
  const neu = [];
  const aktualisiert = [];
  const unveraendert = [];
  const warnungen = [];
  const hinweise = [];

  /** Ein Eintrag wird genau einmal einsortiert — nie doppelt gezählt. */
  const einsortieren = (roheingabe, istTeilUpdate) => {
    const alt = vorhanden.get(roheingabe.id);

    if (!alt) {
      if (istTeilUpdate) {
        hinweise.push(`updates[]: "${roheingabe.id}" steht nicht im Katalog — übersprungen, ein Update ohne Original.`);
        return;
      }
      neu.push(mitStandard(roheingabe));
      return;
    }

    // Teil-Update: nur die mitgelieferten Felder überschreiben. Volleintrag: komplett ersetzen.
    const { update_grund, ...felder } = roheingabe;
    const zusammengefuehrt = mitStandard(istTeilUpdate ? { ...alt, ...felder } : roheingabe);
    const felderGeaendert = geaenderteFelder(alt, zusammengefuehrt);

    if (!felderGeaendert.length) { unveraendert.push(alt.id); return; }

    aktualisiert.push({ alt, neu: zusammengefuehrt, felder: felderGeaendert, grund: update_grund || '' });

    const warnung = warnungFuer(alt, zusammengefuehrt);
    if (warnung) warnungen.push(warnung);
  };

  for (const p of daten.plugins || []) if (p && typeof p.id === 'string') einsortieren(p, false);
  for (const u of daten.updates || []) if (u && typeof u.id === 'string') einsortieren(u, true);

  // Kategorien und Querverweise: hier nur Hinweise, keine Blockade. Eine Runde darf auf einen
  // Eintrag zeigen, der erst mit einer späteren Runde in den Katalog kommt.
  const alleIds = new Set([...vorhanden.keys(), ...neu.map((p) => p.id)]);
  for (const p of [...neu, ...aktualisiert.map((a) => a.neu)]) {
    if (kategorienIds.length && !kategorienIds.includes(p.kategorie)) {
      hinweise.push(`"${p.id}": unbekannte Kategorie "${p.kategorie}".`);
    }
    for (const feld of ['abhaengigkeiten', 'konflikte', 'ersetzt', 'synergie']) {
      for (const ziel of p[feld] || []) {
        if (!alleIds.has(ziel)) hinweise.push(`"${p.id}" · ${feld}: "${ziel}" ist (noch) nicht im Katalog.`);
      }
    }
  }

  return {
    ok: true,
    vorschau: {
      dateiname,
      catalogVersion: daten.catalogVersion || '',
      runde: daten.runde ?? null,
      erstellt: daten.erstellt || '',
      neu, aktualisiert, unveraendert, warnungen, hinweise,
      gesamt: neu.length + aktualisiert.length + unveraendert.length
    }
  };
}

/**
 * Übernimmt eine Vorschau: aktualisiert den Katalog im Speicher UND sichert die Differenz
 * dauerhaft (D3a), damit die Runde ein Neuladen übersteht.
 *
 * Rührt meinen Zustand nicht an: Haken, Notizen und Prioritäten hängen an der Plugin-ID,
 * und die ändert sich beim Import nie (Feature E3).
 *
 * @returns {{plugins:object[], gesichert:object}} gesichert = Ergebnis von sichereDifferenz(),
 *          enthält bei vollem Speicher ok:false samt Klartext-Meldung.
 */
export function wendeVorschauAn(vorschau, plugins) {
  const uebernommen = [...vorschau.aktualisiert.map((a) => a.neu), ...vorschau.neu];

  const nachId = new Map(plugins.map((p) => [p.id, p]));
  for (const p of uebernommen) nachId.set(p.id, p);

  const gesichert = merkeEintraege(uebernommen, {
    dateiname: vorschau.dateiname,
    catalogVersion: vorschau.catalogVersion,
    runde: vorschau.runde
  });

  return { plugins: [...nachId.values()], gesichert };
}

/** Kurzfassung für die Änderungsliste (Feature E8). */
export function vorschauZusammenfassung(v) {
  const teile = [`${v.neu.length} neu`, `${v.aktualisiert.length} aktualisiert`];
  if (v.unveraendert.length) teile.push(`${v.unveraendert.length} unverändert`);
  return teile.join(', ');
}
