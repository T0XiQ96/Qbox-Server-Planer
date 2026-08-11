/**
 * defaults.js — die EINE Stelle, an der fehlende Felder ergänzt werden.
 *
 * Der Vorgänger hat die Defaults nur auf den eingebauten Katalog angewandt (v2.1, Zeile 865),
 * nicht auf importierte Einträge — ein fehlendes Feld ließ das Rendern crashen (CLAUDE.md §4).
 * Deshalb läuft ab jetzt JEDE Quelle hier durch: eingebauter Katalog, importierte Runde,
 * eigene Plugins, wiederhergestelltes Backup, Altbestands-Konvertierung.
 *
 * Wichtig: Der Validator prüft die ROHDATEN, nicht das Ergebnis dieser Funktion.
 * Sonst würde ein fehlendes Pflichtfeld hier stillschweigend aufgefüllt und nie auffallen.
 */

/** Feste Vorgaben, unabhängig vom Eintrag. */
const STANDARD = {
  autor: '',
  gruppe: null,
  essenziell: false,
  beschreibung: '',
  features: [],
  link: '',
  link_status: 'ungeprueft',
  link_geprueft_am: '',
  geprueft_am: '',
  version: '',
  letztes_update: '',
  lizenz: 'open_source',
  preis: null,
  framework: 'standalone',
  abhaengigkeiten: [],
  konflikte: [],
  bundle: null,
  ersetzt: [],
  synergie: [],
  ergaenzt: [],
  kompat_warnung: null,
  archiviert: null,
  stack_hinweis: null,
  pro: [],
  contra: [],
  neutral: [],
  tipp: '',
  quelle: '',
  qualitaet: 'ungeprueft',
  kategorie: 'custom'
};

/** Ergänzt einen einzelnen Eintrag. Gibt immer ein neues Objekt zurück. */
export function mitStandard(eintrag) {
  const p = { ...eintrag };

  for (const [feld, wert] of Object.entries(STANDARD)) {
    if (p[feld] === undefined) p[feld] = Array.isArray(wert) ? [] : wert;
  }

  // Abgeleitete Felder
  if (!p.name) p.name = p.id || 'ohne Namen';
  if (p.ressource === undefined || p.ressource === null) p.ressource = p.id || '';

  // Listenfelder gegen versehentliche Einzelwerte absichern
  for (const feld of ['features', 'abhaengigkeiten', 'konflikte', 'ersetzt', 'synergie', 'pro', 'contra', 'neutral', 'ergaenzt']) {
    if (!Array.isArray(p[feld])) p[feld] = p[feld] ? [p[feld]] : [];
  }

  return p;
}

/** Ergänzt eine ganze Liste. */
export function alleMitStandard(liste) {
  return (Array.isArray(liste) ? liste : []).map(mitStandard);
}

/**
 * Badges werden ABGELEITET, nicht gespeichert — sonst müsste jeder neue Eintrag sie mitpflegen
 * und könnte im Widerspruch zu framework/lizenz/preis stehen (Feature G2).
 */
export function badgesVon(p) {
  const b = [];
  if (p.framework === 'qbox_nativ') b.push({ id: 'qbox', text: '✅ Qbox nativ' });
  if (p.framework === 'qbcore_bridge') b.push({ id: 'bridge', text: '🔁 QBCore-Bridge' });
  if (p.framework === 'standalone') b.push({ id: 'stand', text: '🌐 Standalone' });
  if (p.framework === 'qbcore_only') b.push({ id: 'qbonly', text: '⛔ nur QBCore' });
  if (p.lizenz === 'open_source') b.push({ id: 'open', text: '🔓 Open Source' });
  if (p.lizenz === 'escrow') b.push({ id: 'escrow', text: '🔒 Escrow' });
  b.push(p.preis ? { id: 'premium', text: '💰 Premium' } : { id: 'free', text: '🆓 Kostenlos' });
  return b;
}
