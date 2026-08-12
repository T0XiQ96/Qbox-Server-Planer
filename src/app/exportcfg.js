/**
 * exportcfg.js — ensure-Export für server.cfg, getrennt für DEV und MAIN (F1-F3).
 * Vorlage: reference/qbox-server-planer-v2-1.html, exportEnsure (Zeile 1091-1109).
 *
 * Wichtig: die "ensure"-Zeile benutzt IMMER plugin.ressource, nie plugin.id — beide können
 * auseinanderfallen (Entscheidung D16, Beispiel: kimi hat "keep_bags" als ID, der echte
 * Ressourcen-Ordner heißt "keep-bags"). defaults.js setzt ressource standardmäßig auf id,
 * wenn kein eigener Ordnername bekannt ist.
 */

import { istGehakt } from './state.js';
import { holePlugin } from './relations.js';

/**
 * F2 — topologische Sortierung: Abhängigkeiten stehen vor dem Element, das sie braucht.
 * Zyklussicher (F2-Testfall "zyklussicher"): eine Ringabhängigkeit lässt die Funktion nicht
 * endlos laufen, sondern bricht den Ring einmal auf und meldet ihn separat.
 *
 * @param {Map} index
 * @param {string[]} ausgewaehlteIds Plugins, die in dieser Umgebung gehakt sind
 * @returns {{reihenfolge:string[], fehlend:Array<{von:string,nach:string}>, zyklen:string[][]}}
 */
export function topologischeReihenfolge(index, ausgewaehlteIds) {
  const ausgewaehlt = new Set(ausgewaehlteIds);
  const erledigt = new Set();
  const reihenfolge = [];
  const fehlend = [];
  const zyklen = [];

  function besuche(id, pfad) {
    if (erledigt.has(id)) return;
    if (pfad.includes(id)) {
      zyklen.push([...pfad.slice(pfad.indexOf(id)), id]);
      return; // Ring hier aufbrechen, nicht weiter absteigen
    }

    const plugin = holePlugin(index, id);
    if (!plugin) return; // unbekannte ID — validate.mjs hat das schon gemeldet

    for (const depId of plugin.abhaengigkeiten || []) {
      if (ausgewaehlt.has(depId)) besuche(depId, [...pfad, id]);
      else if (index.get(depId)) fehlend.push({ von: id, nach: depId });
      // depId gibt es im Katalog gar nicht -> ebenfalls schon von validate.mjs gemeldet
    }

    erledigt.add(id);
    reihenfolge.push(id);
  }

  for (const id of ausgewaehlteIds) besuche(id, []);
  return { reihenfolge, fehlend, zyklen };
}

function ressourcenName(index, id) {
  const p = holePlugin(index, id);
  return p ? (p.ressource || p.id) : id;
}

function pluginName(index, id) {
  const p = holePlugin(index, id);
  return p ? p.name : id;
}

/**
 * F1 — die vollständige ensure-Liste als Text, inklusive Warnungen als Kommentarzeilen (F3).
 * @returns {{text:string, anzahl:number, fehlend:Array, zyklen:Array}}
 */
export function baueEnsureListe(index, umgebung, jetzt = new Date()) {
  const ausgewaehlt = [];
  for (const p of index.values()) if (istGehakt(p.id, umgebung)) ausgewaehlt.push(p.id);

  const { reihenfolge, fehlend, zyklen } = topologischeReihenfolge(index, ausgewaehlt);

  const kopf = [
    `# ensure-Liste ${umgebung.toUpperCase()} — generiert ${jetzt.toLocaleString('de-DE')}`,
    '# Reihenfolge: Abhängigkeiten zuerst (automatisch)'
  ];

  const warnungen = [];
  for (const f of fehlend) {
    warnungen.push(`# ⚠️ FEHLENDE ABHÄNGIGKEIT: ${pluginName(index, f.von)} ← fehlt: ${pluginName(index, f.nach)}`);
  }
  for (const z of zyklen) {
    warnungen.push(`# ⚠️ ZYKLUS ERKANNT: ${z.map((id) => pluginName(index, id)).join(' → ')} — Ring aufgebrochen, Reihenfolge kann falsch sein`);
  }

  const zeilen = reihenfolge.map((id) => `ensure ${ressourcenName(index, id)}`);

  const teile = [...kopf];
  if (warnungen.length) teile.push('#', ...warnungen);
  teile.push('', ...(zeilen.length ? zeilen : ['# (nichts auf ' + umgebung.toUpperCase() + ' gehakt)']));

  return { text: teile.join('\n') + '\n', anzahl: reihenfolge.length, fehlend, zyklen };
}

/* ============================== Kopieren & Download ============================== */

/** Kopiert Text in die Zwischenablage. Braucht einen Browser — hier nur der dünne Wrapper. */
export async function kopiereText(text) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return { ok: false, meldung: 'Zwischenablage in dieser Umgebung nicht verfügbar.' };
  }
  try {
    await navigator.clipboard.writeText(text);
    return { ok: true };
  } catch (e) {
    return { ok: false, meldung: 'Kopieren fehlgeschlagen: ' + e.message };
  }
}

/** Bietet Text als .cfg-Datei zum Download an. Braucht einen Browser. */
export function ladeAlsDatei(text, dateiname) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') {
    return { ok: false, meldung: 'Download in dieser Umgebung nicht verfügbar.' };
  }
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  a.click();
  URL.revokeObjectURL(a.href);
  return { ok: true };
}
