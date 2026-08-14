/**
 * warnings.js — der laufende Prüfbericht über den aktuell gewählten Stand.
 *
 * Bis hierher warnte das Tool an zwei Stellen: als Popup im Moment des Hakensetzens (F4/F5/F6)
 * und als Kommentarblock in der ensure-Liste (F3). Beides reicht nicht. Das Popup ist weg, sobald
 * man es weggeklickt hat, und die ensure-Liste sieht man erst ganz am Ende — genau dann, wenn der
 * Plan eigentlich schon stehen soll. Wer zwischendurch einen Haken entfernt und damit eine
 * Abhängigkeit reißt, erfährt davon bis dahin gar nichts.
 *
 * Dieses Modul beantwortet deshalb jederzeit die Frage „stimmt mein aktueller Stand?" — für DEV
 * und MAIN getrennt, weil beide Umgebungen unterschiedlich bestückt sein dürfen (das ist der
 * ganze Zweck des Tools).
 *
 * Reine Funktionen auf Katalog + Zustand, kein DOM. Die Darstellung macht main.js.
 */

import { istGehakt } from './state.js';
import {
  holePlugin, alternativen, aktiveKonflikte, fehlendeAbhaengigkeiten, istAbgedeckt,
  synergiePartner, synergieRueckwaerts, ergaenztZiele, wirdErgaenztVon, gehakteListe
} from './relations.js';

export const UMGEBUNG_LABEL = { dev: 'DEV', main: 'MAIN' };

/**
 * Drei Stufen, bewusst nicht mehr:
 *   fehler   — so läuft der Server nicht oder nur mit Schaden (fehlende Abhängigkeit, Konflikt,
 *              zwei Plugins für dieselbe Aufgabe)
 *   warnung  — läuft, ist aber eine bekannte Falle (archiviert, toter Link, bestätigte Inkompatibilität)
 *   hinweis  — nur zur Kenntnis (Bundle bringt Fremdfunktionen mit)
 */
export const WARN_STUFEN = ['fehler', 'warnung', 'hinweis'];

const STUFEN_RANG = { fehler: 0, warnung: 1, hinweis: 2 };

/** Für paarweise Funde: ein Schlüssel, der A+B und B+A gleich behandelt. */
function paarSchluessel(idA, idB) {
  return [idA, idB].sort().join('|');
}

/* ================================ Prüfbericht ================================ */

/**
 * Alle Funde für eine Umgebung.
 *
 * @returns {Array<{stufe:string, art:string, umgebung:string, plugin:object,
 *                  partner:object[], text:string, behebung:?{id:string, umgebung:string}}>}
 */
export function pruefbericht(index, umgebung) {
  const funde = [];
  const gehakt = gehakteListe(index, umgebung);
  const gesehen = new Set();

  for (const p of gehakt) {
    /* --- fehler: zwei Plugins, die sich ausdrücklich nicht vertragen (F4) --- */
    for (const gegner of aktiveKonflikte(index, p, umgebung)) {
      const schluessel = 'konflikt:' + paarSchluessel(p.id, gegner.id);
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      funde.push({
        stufe: 'fehler', art: 'konflikt', umgebung, plugin: p, partner: [gegner],
        text: 'Sollte nicht parallel mit {partner} laufen — beides zusammen führt erfahrungsgemäß zu Problemen.',
        behebung: null
      });
    }

    /* --- fehler: zwei Plugins für dieselbe Aufgabe (B1/B7) --- */
    for (const alt of alternativen(index, p)) {
      if (!istGehakt(alt.id, umgebung)) continue;
      const schluessel = 'doppelt:' + paarSchluessel(p.id, alt.id);
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);
      funde.push({
        stufe: 'fehler', art: 'doppelt', umgebung, plugin: p, partner: [alt],
        text: 'Erfüllt dieselbe Aufgabe wie {partner}. Beide gleichzeitig zu installieren ist nicht vorgesehen — eines von beiden reicht.',
        behebung: null
      });
    }

    /* --- fehler: Abhängigkeit nicht gesetzt (F3/F5) --- */
    for (const fehlt of fehlendeAbhaengigkeiten(index, p, umgebung)) {
      funde.push({
        stufe: 'fehler', art: 'abhaengigkeit', umgebung, plugin: p, partner: [fehlt],
        text: `Braucht {partner}, das auf ${UMGEBUNG_LABEL[umgebung]} nicht gesetzt ist — ohne das startet die Ressource nicht.`,
        behebung: { id: fehlt.id, umgebung }
      });
    }

    /* --- warnung: das Repo ist tot (G4) --- */
    if (p.archiviert) {
      // `nachfolger` ist laut Schema eine Katalog-ID, keine Klartextbezeichnung. Löst sie auf,
      // wird daraus ein Verweis auf den echten Eintrag — und es steht der NAME da statt der
      // rohen ID, was hier bisher durchgängig falsch herum war. Löst sie nicht auf (im Katalog
      // kommt das einmal vor), bleibt sie ehrlich als unaufgelöste Kennung stehen.
      const nachfolgerId = p.archiviert.nachfolger || '';
      const nachfolger = nachfolgerId ? holePlugin(index, nachfolgerId) : null;

      let text = 'Archiviert — bekommt keine Updates mehr.';
      if (nachfolger) text += ' Nachfolger: {partner}';
      else if (nachfolgerId) text += ` Nachfolger: ${nachfolgerId} (nicht im Katalog).`;

      funde.push({
        stufe: 'warnung', art: 'archiviert', umgebung, plugin: p,
        partner: nachfolger ? [nachfolger] : [],
        text,
        behebung: null
      });
    }

    /* --- warnung: Link führt ins Leere (G7) --- */
    if (p.link_status === '404') {
      funde.push({
        stufe: 'warnung', art: 'linktot', umgebung, plugin: p, partner: [],
        text: 'Der hinterlegte Link ist tot (404) — die Quelle ist so nicht mehr beziehbar.',
        behebung: null
      });
    }

    /* --- warnung: belegte Inkompatibilität (G3). „vermutung" bleibt draußen: das Badge auf der
           Karte sagt es bereits, und eine Vermutung als Fehler zu führen wäre unehrlich. --- */
    if (p.kompat_warnung && p.kompat_warnung.sicherheit === 'bestaetigt') {
      funde.push({
        stufe: 'warnung', art: 'kompat', umgebung, plugin: p, partner: [],
        text: p.kompat_warnung.text,
        behebung: null
      });
    }

    /* --- hinweis: bringt Fremdfunktionen mit (F6) --- */
    if (p.bundle) {
      funde.push({
        stufe: 'hinweis', art: 'bundle', umgebung, plugin: p, partner: [],
        text: p.bundle,
        behebung: null
      });
    }
  }

  return funde.sort((a, b) =>
    STUFEN_RANG[a.stufe] - STUFEN_RANG[b.stufe] || a.plugin.name.localeCompare(b.plugin.name, 'de'));
}

/** Beide Umgebungen auf einmal — was main.js bei jedem Neuzeichnen braucht. */
export function berichtBeiderUmgebungen(index) {
  return { dev: pruefbericht(index, 'dev'), main: pruefbericht(index, 'main') };
}

/** Zählt nach Stufe, für die Kopfzeile der Warnbox. */
export function berichtZusammenfassung(funde) {
  const zahl = { fehler: 0, warnung: 0, hinweis: 0 };
  for (const f of funde) zahl[f.stufe]++;
  return zahl;
}

/**
 * Alle Plugin-IDs, die in irgendeinem Fund vorkommen — Grundlage für den Filter „nur mit Warnung".
 * Beteiligte Partner zählen mit: bei einer fehlenden Abhängigkeit will man gerade das FEHLENDE
 * Plugin in der Liste sehen, um es zu setzen, obwohl es selbst gar nicht gehakt ist.
 */
export function warnIds(bericht) {
  const ids = new Set();
  for (const funde of Object.values(bericht)) {
    for (const f of funde) {
      ids.add(f.plugin.id);
      for (const p of f.partner) ids.add(p.id);
      if (f.behebung) ids.add(f.behebung.id);
    }
  }
  return ids;
}

/* ============================ Ungenutzte Synergien ============================ */

/**
 * „Was könnte ich zu dem, was ich schon habe, zusätzlich gebrauchen?"
 *
 * Gezählt wird aus drei Richtungen, weil der Katalog eine beidseitige Beziehung immer nur auf
 * einer Seite führt: eigene `synergie`-Einträge, fremde `synergie`-Einträge, die auf mich zeigen,
 * sowie `ergaenzt` in beide Richtungen (das ist per Definition „liefert Zusatzfunktionen, die das
 * andere nicht abdeckt" — also genau die Frage).
 *
 * Drei Fälle werden bewusst nicht vorgeschlagen:
 *   - schon gehakt          → kein Vorschlag nötig
 *   - archiviert            → ein totes Repo zu empfehlen wäre ein Bärendienst
 *   - bereits abgedeckt     → die Funktion liegt über eine Alternative schon an (z.B. ein anderes
 *                             HUD derselben Gruppe ist gesetzt), sonst wäre der Zähler nur Rauschen
 */
export function ungenutzteSynergien(index, umgebung) {
  const vorschlaege = new Map();

  const merke = (ziel, von, art, plus, minus) => {
    if (!ziel || ziel.id === von.id) return;
    if (istGehakt(ziel.id, umgebung)) return;
    if (ziel.archiviert) return;
    if (istAbgedeckt(index, ziel, umgebung)) return;
    if (!vorschlaege.has(ziel.id)) vorschlaege.set(ziel.id, { ziel, gruende: [] });
    vorschlaege.get(ziel.id).gruende.push({ von, art, plus: plus || [], minus: minus || [] });
  };

  for (const p of gehakteListe(index, umgebung)) {
    for (const partner of synergiePartner(index, p)) merke(partner, p, 'synergie', [], []);
    for (const partner of synergieRueckwaerts(index, p)) merke(partner, p, 'synergie', [], []);
    for (const e of ergaenztZiele(index, p)) merke(e.ziel, p, 'ergaenzt', e.plus, e.minus);
    for (const e of wirdErgaenztVon(index, p)) merke(e.quelle, p, 'ergaenzt', e.plus, e.minus);
  }

  return [...vorschlaege.values()].sort((a, b) =>
    b.gruende.length - a.gruende.length || a.ziel.name.localeCompare(b.ziel.name, 'de'));
}

/** Beide Umgebungen — für die beiden Zähler neben den Kostenspalten. */
export function synergienBeiderUmgebungen(index) {
  return { dev: ungenutzteSynergien(index, 'dev'), main: ungenutzteSynergien(index, 'main') };
}

/** Auflösung einer Behebung („jetzt setzen") auf das betroffene Plugin. */
export function behebungsZiel(index, behebung) {
  return behebung ? holePlugin(index, behebung.id) : null;
}
