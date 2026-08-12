/**
 * state.js — mein Zustand, nicht der Katalog.
 *
 * Vier Regeln, die aus den Fehlern der Vorversion stammen (CLAUDE.md §4, Entscheidungen D3/D4):
 *
 *  1. Der localStorage-Schlüssel bleibt für immer "qbox_planer_v2". Wird er geändert, sind alle
 *     Haken weg. Versionssprünge laufen über schemaVersion IM Zustand, nie über einen neuen Schlüssel.
 *  2. In den Speicher gehört nur mein Zustand: Haken, Notizen, Prioritäten, Backups, eigene Plugins.
 *     Niemals der Katalog — bei 500+ Plugins plus Backups sprengt das die 5-MB-Grenze.
 *  3. Die Migration prüft ausschließlich Schlüssel, die auch wirklich geschrieben werden.
 *     Die Vorversion prüfte "qbox_planer_v1", das nie entstanden ist — der Zweig lief nie.
 *  4. Vor jedem Zurücksetzen entsteht automatisch ein Sicherheits-Snapshot (Feature E6).
 */

import { kopie, warnen } from '../lib/hilfen.js';

export const SPEICHER_SCHLUESSEL = 'qbox_planer_v2';
export const SCHEMA_VERSION = 3;

/** Die beiden einzigen Umgebungen (Entscheidung D11). */
export const UMGEBUNGEN = ['dev', 'main'];

const LEERER_ZUSTAND = {
  schemaVersion: SCHEMA_VERSION,
  umgebungen: {},   // id -> { dev:bool, dev_seit:'JJJJ-MM-TT', main:bool, main_seit:'...' }
  notizen: {},      // id -> Text
  prioritaet: {},   // id -> 'hoch' | 'mittel' | 'niedrig'
  backups: [],      // [{ name, erstellt, daten }]
  eigene: [],       // selbst angelegte Plugins (gehören mir, nicht dem Katalog)
  sortierung: 'standard'
};

let zustand = kopie(LEERER_ZUSTAND);

/* ============================== Laden & Sichern ============================== */

/** Liest den Zustand aus dem localStorage. Ein kaputter Eintrag darf den Start nie verhindern. */
export function ladeZustand() {
  let roh = null;
  try {
    roh = localStorage.getItem(SPEICHER_SCHLUESSEL);
  } catch (e) {
    warnen('localStorage ist nicht verfügbar — der Stand kann in dieser Sitzung nicht gesichert werden.', e);
    return zustand;
  }

  if (!roh) return zustand;

  try {
    const gelesen = JSON.parse(roh);
    // Die Version MUSS aus den gelesenen Rohdaten kommen, nicht aus dem gemischten Objekt:
    // mische ich vorher die Defaults unter, steht dort immer schon die aktuelle Version und
    // der Migrationszweig läuft nie. Genau dieser Fehler steckte in der Vorversion.
    const von = Number(gelesen.schemaVersion) || 1;
    zustand = migriere({ ...kopie(LEERER_ZUSTAND), ...gelesen }, von);
  } catch (e) {
    // Lieber mit leerem Zustand starten als weiß bleiben — aber das Kaputte aufheben,
    // damit nichts unwiederbringlich verloren ist.
    warnen('Gespeicherter Stand ist beschädigt und wurde beiseitegelegt.', e);
    try { localStorage.setItem(SPEICHER_SCHLUESSEL + '_beschaedigt_' + Date.now(), roh); } catch (_) { /* Speicher voll */ }
    zustand = kopie(LEERER_ZUSTAND);
  }
  return zustand;
}

/** Schreibt den Zustand zurück. Gibt false zurück, wenn der Speicher voll ist. */
export function speichern() {
  try {
    localStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(zustand));
    return true;
  } catch (e) {
    warnen('Speichern fehlgeschlagen — vermutlich ist der Browser-Speicher voll. Alte Backups löschen hilft.', e);
    return false;
  }
}

export const holeZustand = () => zustand;

/** Nur für Import und Backup-Wiederherstellung: ersetzt den Zustand vollständig. */
export function setzeZustand(neu) {
  const von = Number(neu && neu.schemaVersion) || 1;
  zustand = migriere({ ...kopie(LEERER_ZUSTAND), ...neu }, von);
  speichern();
  return zustand;
}

/**
 * Hebt einen alten Zustand auf den aktuellen Stand.
 * Wird auch beim Import fremder Exporte durchlaufen, nicht nur beim Start.
 * @param {number} von Schemaversion der GELESENEN Daten — muss von außen kommen, siehe ladeZustand().
 */
function migriere(z, von) {
  // v1/v2 der alten Einzeldatei: "servers" mit devTS/mainTS, "notes", "prio", "custom".
  if (von < 3) {
    if (z.servers && !Object.keys(z.umgebungen || {}).length) {
      z.umgebungen = {};
      for (const [id, alt] of Object.entries(z.servers)) {
        z.umgebungen[id] = {
          dev: !!alt.dev, dev_seit: alsIso(alt.devTS),
          main: !!alt.main, main_seit: alsIso(alt.mainTS)
        };
      }
    }
    if (z.notes && !Object.keys(z.notizen || {}).length) z.notizen = z.notes;
    if (z.prio && !Object.keys(z.prioritaet || {}).length) z.prioritaet = z.prio;
    if (Array.isArray(z.custom) && !(z.eigene || []).length) z.eigene = z.custom;
    if (z.sort && z.sortierung === 'standard') z.sortierung = z.sort === 'def' ? 'standard' : z.sort;
  }

  // Der Katalog gehört nicht in den Zustand (D3). Alte Stände schleppen ihn mit — hier fliegt er raus.
  delete z.catalogExtra;
  delete z.catalogVer;
  delete z.servers; delete z.notes; delete z.prio; delete z.custom; delete z.sort;

  z.schemaVersion = SCHEMA_VERSION;
  return z;
}

/* ================================ Haken (A1) ================================ */

/**
 * Heutiges Datum als JJJJ-MM-TT in ORTSZEIT.
 * toISOString() rechnet nach UTC um und würde einen Haken, der abends gesetzt wird,
 * auf den Vortag datieren — in der Anzeige „seit TT.MM.JJJJ" (Feature A5) fällt das sofort auf.
 */
function heute() {
  const d = new Date();
  const zwei = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;
}

export function istGehakt(id, umgebung) {
  const e = zustand.umgebungen[id];
  return !!(e && e[umgebung]);
}

/** Zeitstempel „seit wann" zu einem Haken (Feature A5). */
export function hakenSeit(id, umgebung) {
  const e = zustand.umgebungen[id];
  return (e && e[umgebung + '_seit']) || '';
}

export function setzeHaken(id, umgebung, wert) {
  if (!UMGEBUNGEN.includes(umgebung)) throw new Error('Unbekannte Umgebung: ' + umgebung);

  const e = zustand.umgebungen[id] || (zustand.umgebungen[id] = { dev: false, dev_seit: '', main: false, main_seit: '' });
  e[umgebung] = !!wert;
  e[umgebung + '_seit'] = wert ? heute() : '';

  // Aufräumen: ein Eintrag ohne jeden Haken und ohne Datum muss nicht mitgeschleppt werden.
  if (!e.dev && !e.main) delete zustand.umgebungen[id];

  speichern();
  return !!wert;
}

/* ================================ Sortierung (D7) ================================ */

export const holeSortierung = () => zustand.sortierung;

export function setzeSortierung(wert) {
  zustand.sortierung = wert;
  speichern();
}

/* ========================= Notizen (A3) & Priorität (A4) ========================= */

export const holeNotiz = (id) => zustand.notizen[id] || '';

export function setzeNotiz(id, text) {
  const sauber = String(text || '').trim();
  if (sauber) zustand.notizen[id] = sauber;
  else delete zustand.notizen[id];
  speichern();
}

export const holePrioritaet = (id) => zustand.prioritaet[id] || '';

export function setzePrioritaet(id, stufe) {
  if (stufe) zustand.prioritaet[id] = stufe;
  else delete zustand.prioritaet[id];
  speichern();
}

/* =========================== Eigene Plugins (H2, E7) =========================== */

export const holeEigene = () => zustand.eigene;

export function fuegeEigenesHinzu(plugin) {
  zustand.eigene.push(plugin);
  speichern();
  return plugin;
}

export function loescheEigenes(id) {
  const vorher = zustand.eigene.length;
  zustand.eigene = zustand.eigene.filter((p) => p.id !== id);
  if (zustand.eigene.length !== vorher) {
    // Haken, Notiz und Priorität hängen an der ID — mit dem Eintrag müssen sie mit weg,
    // sonst bleiben verwaiste Reste im Zustand liegen.
    delete zustand.umgebungen[id];
    delete zustand.notizen[id];
    delete zustand.prioritaet[id];
    speichern();
    return true;
  }
  return false;
}

/* ============================== Backups (E1, E6) ============================== */

/** Alles, was mir gehört — Grundlage für Backup und Export (Feature E7). */
export function meineDaten() {
  return {
    schemaVersion: SCHEMA_VERSION,
    umgebungen: kopie(zustand.umgebungen),
    notizen: kopie(zustand.notizen),
    prioritaet: kopie(zustand.prioritaet),
    eigene: kopie(zustand.eigene),
    sortierung: zustand.sortierung
  };
}

export function legeBackupAn(name) {
  zustand.backups.unshift({
    name: name || 'Backup ' + new Date().toLocaleString('de-DE'),
    erstellt: new Date().toISOString(),
    daten: meineDaten()
  });
  speichern();
  return zustand.backups[0];
}

export const holeBackups = () => zustand.backups;

export function ladeBackup(index) {
  const b = zustand.backups[index];
  if (!b) return false;

  legeBackupAn('vor dem Laden von „' + b.name + '"');   // auch das Laden ist ein Datenverlust-Risiko
  const backups = zustand.backups;                       // Backups überleben das Zurückspielen
  setzeZustand({ ...b.daten, backups });
  return true;
}

export function loescheBackup(index) {
  zustand.backups.splice(index, 1);
  speichern();
}

/* ============================== Zurücksetzen (E5) ============================== */

/** Jedes Zurücksetzen legt vorher einen Sicherheits-Snapshot an (Feature E6). */
export function setzeZurueck(was) {
  const bezeichnung = {
    dev: 'DEV-Haken', main: 'MAIN-Haken', notizen: 'Notizen',
    prioritaeten: 'Prioritäten', alles: 'alles'
  }[was];
  if (!bezeichnung) throw new Error('Unbekannter Reset: ' + was);

  legeBackupAn('vor Reset: ' + bezeichnung);

  if (was === 'dev' || was === 'main') {
    for (const [id, e] of Object.entries(zustand.umgebungen)) {
      e[was] = false;
      e[was + '_seit'] = '';
      if (!e.dev && !e.main) delete zustand.umgebungen[id];
    }
  } else if (was === 'notizen') {
    zustand.notizen = {};
  } else if (was === 'prioritaeten') {
    zustand.prioritaet = {};
  } else {
    const backups = zustand.backups;   // der Sicherheits-Snapshot darf nicht mitgelöscht werden
    zustand = { ...kopie(LEERER_ZUSTAND), backups };
  }

  speichern();
}

/* ================================== Kleinkram ================================== */

/**
 * Die Vorversion speicherte Zeitstempel als TT.MM.JJJJ, wir speichern JJJJ-MM-TT.
 * Ohne diese Umrechnung stünden nach einer Migration beide Formate nebeneinander
 * und die „seit"-Anzeige (Feature A5) wäre uneinheitlich.
 */
function alsIso(wert) {
  const s = String(wert || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
