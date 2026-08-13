/**
 * dubletten.mjs — Namensvergleich und Dublettenprüfung gegen den Bestand.
 *
 * Warum das ein eigenes Modul ist: Bei der Nachprüfung war die Frage „kenne ich das schon?"
 * trivial — die ID stand ja im Katalog. Bei der Neusuche ist sie der teuerste vermeidbare
 * Fehler. Ein Kandidat, den es längst gibt (unter anderem Namen, mit umgezogenem Link, als
 * Fork), kostet eine volle Recherche und liefert am Ende ein Duplikat.
 *
 * Deshalb wird jeder Kandidat DETERMINISTISCH gegen den Bestand geprüft, bevor irgendein
 * Modell ihn zu sehen bekommt: gleiche ID, gleicher Link-Ziel, ähnlicher Name.
 *
 * Die Namensähnlichkeit stammt aus prefetch.mjs (dort für Umbenennungen: randolio_* → randol_*)
 * und wird hier gemeinsam genutzt, damit beide Seiten dieselbe Vorstellung von „ähnlich" haben.
 */

/** Vergleichsform: Groß/Klein und Trennzeichen sind bei FiveM-Namen bedeutungslos. */
export const normal = (s) => String(s || '').toLowerCase().replace(/[-_\s]/g, '');

/** Roher Namensabgleich über die längste gemeinsame Teilzeichenkette. */
export function aehnlich(a, b) {
  const x = normal(a), y = normal(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.9;
  let beste = 0;
  for (let i = 0; i < x.length; i++) {
    for (let j = i + beste + 1; j <= x.length; j++) {
      if (y.includes(x.slice(i, j))) beste = Math.max(beste, j - i); else break;
    }
  }
  return beste / Math.max(x.length, y.length);
}

/**
 * Der unterscheidende Teil eines Ressourcennamens: bei "randolio_busjob" ist das "busjob".
 * FiveM-Namen sind fast immer <autor>_<sache>, und der Autor ist beim Owner-Vergleich wertlos —
 * ohne diese Trennung landen alle randol_*-Repos gleichauf, weil sie sich das Präfix teilen.
 */
export const kern = (s) => {
  const teile = String(s || '').split(/[-_]/).filter(Boolean);
  return teile.length > 1 ? teile.slice(1).join('') : String(s || '');
};

/** Ähnlichkeit zweier Repo-Namen, Schwerpunkt auf dem unterscheidenden Teil. */
export function namensNaehe(a, b) {
  return 0.75 * aehnlich(kern(a), kern(b)) + 0.25 * aehnlich(a, b);
}

/** Der Autor-/Anbieterteil eines Ressourcennamens: bei "randolio_busjob" ist das "randolio". */
export const praefix = (s) => {
  const teile = String(s || '').split(/[-_]/).filter(Boolean);
  return teile.length > 1 ? teile[0] : '';
};

/** Owner/Repo aus einer GitHub-URL, sonst null. */
export function githubTeile(url) {
  const m = /^https?:\/\/(?:www\.)?github\.com\/([^/#?]+)(?:\/([^/#?]+))?/i.exec(url || '');
  if (!m) return null;
  return { owner: m[1], repo: m[2] ? m[2].replace(/\.git$/, '') : null };
}

/**
 * Vergleichsschlüssel für einen Link. GitHub-Links werden auf `github:owner/repo` reduziert,
 * damit `.git`-Endung, Groß/Klein und `www.` nicht als Unterschied zählen. Alles andere auf
 * Host + Pfad — so gilt derselbe Tebex-Shop unter zwei Schreibweisen als ein Ziel.
 */
export function linkSchluessel(url) {
  if (!url) return null;
  const g = githubTeile(url);
  if (g && g.repo) return `github:${g.owner.toLowerCase()}/${g.repo.toLowerCase()}`;
  try {
    const u = new URL(url);
    const weg = u.pathname.replace(/\/+$/, '').toLowerCase();
    return u.hostname.replace(/^www\./, '').toLowerCase() + weg;
  } catch {
    return String(url).toLowerCase().replace(/\/+$/, '');
  }
}

/** Repo-Name → gültige Katalog-ID nach dem Schema-Muster ^[a-z0-9][a-z0-9_-]*$. */
export function idAusName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/_+$/, '') || 'unbenannt';
}

/**
 * Nachschlagewerk über den vorhandenen Katalog.
 * @param {Array} plugins aus ladeKatalog()
 */
export function baueBestand(plugins) {
  const nachId = new Map();
  const nachLink = new Map();
  for (const p of plugins) {
    nachId.set(normal(p.id), p);
    const k = linkSchluessel(p.link);
    if (k && !nachLink.has(k)) nachLink.set(k, p);
  }
  return { nachId, nachLink, liste: plugins };
}

/**
 * Steckt der Kandidat schon im Katalog — und wenn nein, wohin gehört er?
 *
 * Vier Ergebnisse, absteigend nach Verlässlichkeit:
 *   `id`      — identische ID (nach Normalisierung). Sicher dieselbe Sache.
 *   `link`    — anderer Name, aber dasselbe Ziel. Sicher, und der häufigere Fall.
 *   `umbenannt` — gleicher Anbieter, gleiche Funktion, anderer Name (`wasabi_police` ↔
 *                `wasabi-police`). Sehr wahrscheinlich Umbenennung → vorhandenen Eintrag
 *                aktualisieren statt neu anzulegen.
 *   `gruppe`  — gleiche Funktion, **anderer** Anbieter (`ac_radio` ↔ `mm_radio`). Das ist
 *                KEINE Dublette, sondern ein Konkurrenzprodukt: eigener Eintrag, aber in
 *                dieselbe `gruppe` wie der Bestandseintrag (RECHERCHE.md §5).
 *
 * Die Trennung der letzten beiden ist der Punkt, an dem sich Aufwand spart: ohne sie landen
 * alle Funktionsgleichen im selben Topf „bitte von Hand prüfen", obwohl der Anbieterwechsel
 * mechanisch erkennbar ist — und `gruppe`-Zuordnung ist Recherchearbeit, die damit entfällt.
 *
 * @returns {{art:'id'|'link'|'umbenannt'|'gruppe', plugin:object, punkte:number}|null}
 */
export function pruefeDublette(bestand, kandidat, schwelle = 0.85) {
  const name = kandidat.id || kandidat.name;
  const id = normal(name);
  if (id && bestand.nachId.has(id)) {
    return { art: 'id', plugin: bestand.nachId.get(id), punkte: 1 };
  }

  const k = linkSchluessel(kandidat.link);
  if (k && bestand.nachLink.has(k)) {
    return { art: 'link', plugin: bestand.nachLink.get(k), punkte: 1 };
  }

  let beste = null;
  for (const p of bestand.liste) {
    const punkte = namensNaehe(name, p.id);
    if (punkte < schwelle || (beste && punkte <= beste.punkte)) continue;
    // Gleicher Anbieter → vermutlich Umbenennung. Anderer Anbieter → Konkurrenzprodukt.
    const gleicherAnbieter = aehnlich(praefix(name), praefix(p.id)) >= 0.8;
    beste = { art: gleicherAnbieter ? 'umbenannt' : 'gruppe', plugin: p, punkte };
  }
  return beste;
}
