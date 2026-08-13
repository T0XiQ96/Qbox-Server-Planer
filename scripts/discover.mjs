#!/usr/bin/env node
/**
 * discover.mjs — Kandidaten für NEUE Katalogeinträge finden, ohne dafür ein Modell zu bezahlen.
 *
 * Hintergrund: Die Runden 1–25 waren reine Nachprüfung — der Link stand im Katalog, die Frage
 * war nur, ob er noch stimmt. Ab Runde 26 geht es um Plugins, die wir noch gar nicht kennen.
 * Naiv gemacht hieße das: ein Subagent sucht auf GitHub, liest Trefferlisten, sortiert Bekanntes
 * aus. Das ist teurer Rohtext für eine Arbeit, die vollständig deterministisch ist.
 *
 * Dieses Script erledigt deshalb die ganze erste Phase einer Neusuche-Runde:
 *   1. GitHub-Suche über mehrere Abfragen (Topics, Namensmuster, Beschreibungen)
 *   2. Doppelte Treffer zwischen den Abfragen zusammenführen
 *   3. **Alles aussortieren, was schon im Katalog steht** — nach ID, Link-Ziel und Namensnähe
 *   4. fxmanifest.lua prüfen: ohne die Datei ist es keine FiveM-Ressource, sondern ein
 *      Tool/Fork/Dotfiles-Repo, das im Suchindex mitschwimmt
 *   5. Vorsortieren nach Aktivität, Verbreitung und Framework-Signalen
 *
 * Übrig bleibt eine kurze Kandidatenliste. Erst die geht in `npm run prefetch -- --kandidaten`
 * und danach an einen Subagent. So bezahlt kein Modell mehr dafür, 300 Suchtreffer zu sichten.
 *
 * Aufruf:
 *   npm run discover                                  (Vorgabe-Abfragen, 60 Kandidaten)
 *   npm run discover -- --seit 2026-01-01             (nur seither gepusht)
 *   npm run discover -- --seit-letztem-lauf           (nur Neues seit dem letzten Durchlauf)
 *   npm run discover -- --topic qbox --max 100
 *   npm run discover -- --suche "qbx_ in:name fork:false"
 *   npm run discover -- --runde 26                    (schreibt kandidaten-26.md)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { ladeKatalog, pfad, relPfad, rot, gruen, gelb, grau, fett } from './lib/katalog.mjs';
import { macheNetz, parallel, TOKEN } from './lib/netz.mjs';
import { baueBestand, pruefeDublette, idAusName } from './lib/dubletten.mjs';

const args = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : null; };
const hat = (name) => args.includes('--' + name);

const MAX = Number(flag('max') || 60);
const MIN_STERNE = Number(flag('min-sterne') || 0);
const RUNDE = flag('runde');
const SEIT = flag('seit');
const SEIT_LETZTEM = hat('seit-letztem-lauf');
const NEU = hat('neu');
const SCHNELL = hat('schnell');       // ohne fxmanifest-Prüfung
const ALLES = hat('alles');           // auch Repos ohne fxmanifest behalten
const EIGENE_SUCHE = flag('suche');
const TOPIC = flag('topic');

const PARALLEL = 6;
const SEITEN_JE_ABFRAGE = 2;          // 200 Treffer je Abfrage reichen; Suche ist nach Aktualität sortiert

/**
 * Die Vorgabe-Abfragen. Bewusst breit gestreut, weil kein einzelnes Merkmal zuverlässig ist:
 * viele Qbox-Ressourcen setzen kein Topic, viele tragen „qbx" nur im Namen, und manche nennen
 * Qbox ausschließlich in der Beschreibung. Überschneidungen sind egal — Schritt 2 führt zusammen.
 */
const VORGABE_ABFRAGEN = [
  { name: 'topic:qbox', q: 'topic:qbox' },
  { name: 'topic:qbx', q: 'topic:qbx' },
  { name: 'qbx_ im Namen', q: 'qbx_ in:name fork:false' },
  { name: 'qbox im Namen', q: 'qbox in:name fork:false' },
  { name: 'qbox in der Beschreibung', q: 'qbox in:description fork:false' },
  { name: 'topic:fivem + qbox', q: 'topic:fivem qbox fork:false' }
];

const laufPfad = pfad('data', '.discover-lauf.json');
const netz = macheNetz({
  cachePfad: pfad('data', '.discovercache.json'),
  cacheTage: 3,               // Trefferlisten altern schneller als Repo-Metadaten
  frisch: NEU,
  kennung: 'qbox-server-planer/3.0 (Discover)'
});

/* ------------------------------ Abfragen bauen ------------------------------ */

let abfragen = VORGABE_ABFRAGEN;
if (EIGENE_SUCHE) abfragen = [{ name: 'eigene Abfrage', q: EIGENE_SUCHE }];
else if (TOPIC) abfragen = [{ name: `topic:${TOPIC}`, q: `topic:${TOPIC}` }];

let seitDatum = SEIT;
if (SEIT_LETZTEM) {
  const lauf = existsSync(laufPfad) ? JSON.parse(readFileSync(laufPfad, 'utf8')) : {};
  seitDatum = lauf.zuletzt || null;
  if (!seitDatum) {
    console.log(gelb('\n--seit-letztem-lauf: es gibt noch keinen früheren Lauf — dieser hier wird der erste.\n'));
  }
}
if (seitDatum) abfragen = abfragen.map((a) => ({ ...a, q: `${a.q} pushed:>=${seitDatum}` }));

/* -------------------------------- Suchen -------------------------------- */

console.log(fett('\nnpm run discover') + grau(`  ·  ${abfragen.length} Abfrage(n)${seitDatum ? `, gepusht seit ${seitDatum}` : ''}`));
console.log(TOKEN
  ? grau('  GitHub-Token gefunden — 30 Suchanfragen/min.\n')
  : gelb('  Kein GITHUB_TOKEN/GH_TOKEN gesetzt — nur 10 Suchanfragen/min.') + grau(' Läuft, dauert aber länger.\n'));

/** full_name → Rohtreffer. Zusammenführung über alle Abfragen. */
const treffer = new Map();
const abfrageFehler = [];

for (const a of abfragen) {
  let gefunden = 0;
  for (let seite = 1; seite <= SEITEN_JE_ABFRAGE; seite++) {
    const url = 'https://api.github.com/search/repositories'
      + `?q=${encodeURIComponent(a.q)}&sort=updated&order=desc&per_page=100&page=${seite}`;
    const erg = await netz.holeApi(url);
    if (!erg.ok) {
      abfrageFehler.push(`${a.name}: ${erg.grund}`);
      break;
    }
    const posten = erg.daten.items || [];
    for (const r of posten) {
      if (!treffer.has(r.full_name)) {
        treffer.set(r.full_name, {
          voll: r.full_name,
          owner: r.owner?.login || r.full_name.split('/')[0],
          repo: r.name,
          link: r.html_url,
          beschreibung: r.description || '',
          sterne: r.stargazers_count || 0,
          push: (r.pushed_at || '').slice(0, 10),
          archiviert: !!r.archived,
          lizenz: r.license?.spdx_id || '',
          branch: r.default_branch || 'main',
          topics: r.topics || [],
          gefundenVia: []
        });
      }
      treffer.get(r.full_name).gefundenVia.push(a.name);
      gefunden++;
    }
    if (posten.length < 100) break;
  }
  console.log(grau(`  ${a.name.padEnd(28)} ${gefunden} Treffer`));
}

if (abfrageFehler.length) {
  console.log(rot('\n  Abfragen mit Problemen:'));
  abfrageFehler.forEach((f) => console.log(grau('    ' + f)));
}

if (!treffer.size) {
  console.log(gelb('\nKeine Treffer. Andere Abfrage versuchen oder --seit lockern.\n'));
  netz.speichere();
  process.exit(0);
}

/* --------------------- Gegen den Bestand aussortieren --------------------- */

const { plugins, fehler } = ladeKatalog();
if (fehler.length) fehler.forEach((f) => console.log(rot(f) + '\n'));
const bestand = baueBestand(plugins);

const bekannt = [];      // sicher schon im Katalog — raus
const umbenannt = [];    // gleicher Anbieter, anderer Name — vermutlich Umbenennung, Entscheidung nötig
let kandidaten = [];

for (const t of treffer.values()) {
  const id = idAusName(t.repo);
  const dub = pruefeDublette(bestand, { id, name: t.repo, link: t.link });
  if (dub && (dub.art === 'id' || dub.art === 'link')) {
    bekannt.push({ ...t, id, dub });
  } else if (dub && dub.art === 'umbenannt') {
    umbenannt.push({ ...t, id, dub });
  } else {
    // 'gruppe' bleibt Kandidat: gleiche Funktion, anderer Anbieter = eigener Eintrag.
    // Der Hinweis wird mitgeführt, damit die `gruppe`-Zuordnung nicht neu recherchiert wird.
    kandidaten.push({ ...t, id, gruppeHinweis: dub?.art === 'gruppe' ? dub : null });
  }
}

/* ----------------- fxmanifest: ist das überhaupt eine Ressource? ----------------- */

/**
 * Der entscheidende Filter. Die GitHub-Suche liefert zwangsläufig auch Server-Templates,
 * Dotfiles, Discord-Bots und Doku-Repos. Ohne fxmanifest.lua (oder das alte __resource.lua)
 * ist es keine FiveM-Ressource — und damit kein Katalogeintrag.
 */
async function pruefeManifest(k) {
  for (const datei of ['fxmanifest.lua', '__resource.lua']) {
    const res = await netz.holeRoh(`https://raw.githubusercontent.com/${k.voll}/${k.branch}/${datei}`);
    if (!res.ok) continue;
    k.manifest = datei;
    k.manifestText = res.text;
    k.version = /^[ \t]*version\s+['"]([^'"]+)['"]/m.exec(res.text)?.[1] || '';
    const t = res.text;
    k.signale = {
      ox_lib: /@ox_lib\//.test(t),
      qbx_core: /qbx_core/.test(t),
      qb_core: /@qb-core\/|['"]qb-core['"]/.test(t),
      esx: /es_extended/.test(t),
      escrow: /escrow_ignore|fivem-appearance-escrow/i.test(t)
    };
    return;
  }
  k.manifest = null;
}

if (!SCHNELL && kandidaten.length) {
  process.stdout.write(grau(`\n  fxmanifest-Prüfung für ${kandidaten.length} Kandidaten …`));
  await parallel(kandidaten, PARALLEL, pruefeManifest);
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
}

const ohneManifest = SCHNELL ? [] : kandidaten.filter((k) => !k.manifest);
if (!SCHNELL && !ALLES) kandidaten = kandidaten.filter((k) => k.manifest);
if (MIN_STERNE) kandidaten = kandidaten.filter((k) => k.sterne >= MIN_STERNE);

/* ------------------------------ Vorsortieren ------------------------------ */

const heute = netz.heute;
const monateSeit = (datum) => (datum ? (Date.parse(heute) - Date.parse(datum)) / (86400000 * 30.4) : 999);

/**
 * Reihung, keine Bewertung. Sie entscheidet nur, welche Kandidaten oben stehen und damit
 * zuerst recherchiert werden — sie sagt nichts über die Qualität eines Plugins aus.
 */
function punkte(k) {
  let p = 0;
  const alter = monateSeit(k.push);
  if (alter <= 12) p += 3; else if (alter <= 24) p += 2; else if (alter <= 36) p += 1;
  if (k.sterne >= 50) p += 2; else if (k.sterne >= 10) p += 1;
  const text = (k.beschreibung + ' ' + k.topics.join(' ')).toLowerCase();
  if (/qbox|qbx/.test(text)) p += 3;
  if (k.signale?.qbx_core) p += 3;
  if (k.signale?.ox_lib) p += 2;
  if (k.archiviert) p -= 2;
  return p;
}

kandidaten.forEach((k) => { k.punkte = punkte(k); });
kandidaten.sort((a, b) => b.punkte - a.punkte || (b.push || '').localeCompare(a.push || ''));
const ausgewaehlt = kandidaten.slice(0, MAX);

/* -------------------------------- Ausgabe -------------------------------- */

const kurzSignal = (k) => {
  if (!k.signale) return '';
  const s = [];
  if (k.signale.qbx_core) s.push('qbx_core');
  if (k.signale.ox_lib) s.push('ox_lib');
  if (k.signale.qb_core) s.push('qb-core');
  if (k.signale.esx) s.push('esx');
  if (k.signale.escrow) s.push('escrow?');
  return s.join(' · ');
};

const z = [];
z.push(`# Kandidaten für neue Katalogeinträge${RUNDE ? ` — Runde ${RUNDE}` : ''}`);
z.push('');
z.push(`Erstellt: ${heute} · erzeugt von \`scripts/discover.mjs\``);
z.push('');
z.push(`Durchsucht: ${abfragen.map((a) => '`' + a.q + '`').join(', ')}`);
z.push('');
z.push('**Was hier schon erledigt ist** — nicht nachholen:');
z.push('');
z.push(`- ${treffer.size} Rohtreffer aus ${abfragen.length} GitHub-Abfragen zusammengeführt`);
z.push(`- ${bekannt.length} davon stehen **bereits im Katalog** (ID- oder Link-Treffer) und sind raus`);
z.push(`- ${umbenannt.length} sind vermutlich **Umbenennungen** vorhandener Einträge → unten als „Vor der Recherche klären"`);
if (!SCHNELL) z.push(`- ${ohneManifest.length} ohne \`fxmanifest.lua\`/\`__resource.lua\` aussortiert (keine FiveM-Ressource)`);
z.push(`- Rest nach Aktivität/Verbreitung/Framework-Signalen gereiht: **${ausgewaehlt.length} Kandidaten**`);
z.push(`- davon ${ausgewaehlt.filter((k) => k.gruppeHinweis).length} mit erkannter **Gruppenzugehörigkeit** (Spalte „Gruppe")`);
z.push('');
z.push('**Was du damit machst:** Die Liste durchgehen und entscheiden, welche Kandidaten in den');
z.push('Katalog sollen. Für die ausgewählten dann `npm run prefetch -- --kandidaten` laufen lassen —');
z.push('das holt fxmanifest, README und Code-Stichprobe wie bei jeder Nachprüfrunde. **Erst danach**');
z.push('geht etwas an einen Subagent. Die Spalte „Signale" ist ein Hinweis aus dem fxmanifest,');
z.push('kein Framework-Urteil — das entsteht wie immer nach docs/RECHERCHE.md §3.');
z.push('');
z.push('---');
z.push('');
z.push('## Kandidaten');
z.push('');
z.push('Die Spalte **Gruppe** nennt einen Bestandseintrag mit gleicher Funktion von einem anderen');
z.push('Anbieter. Wo sie gefüllt ist, steht die `gruppe`-Zuordnung des neuen Eintrags damit schon fest');
z.push('— und nach RECHERCHE.md §5 müssen dann die Vergleichsdaten **beider** Seiten mitgepflegt werden.');
z.push('');
z.push('| # | Repo | Push | ⭐ | Signale | Gruppe | Beschreibung |');
z.push('|---|---|---|---|---|---|---|');
ausgewaehlt.forEach((k, i) => {
  const b = (k.beschreibung || '').replace(/\|/g, '\\|').slice(0, 80);
  const g = k.gruppeHinweis ? `\`${k.gruppeHinweis.plugin.id}\`` : '—';
  z.push(`| ${i + 1} | [\`${k.voll}\`](${k.link})${k.archiviert ? ' 🪦' : ''} | ${k.push || '?'} | ${k.sterne} | ${kurzSignal(k) || '—'} | ${g} | ${b} |`);
});
z.push('');

if (umbenannt.length) {
  z.push('## Vor der Recherche klären — vermutlich Umbenennung');
  z.push('');
  z.push('Gleicher Anbieter, gleiche Funktion, anderer Name. Das ist fast immer ein umbenanntes oder');
  z.push('umgezogenes Repo — dann gehört es als `updates`-Eintrag zum **vorhandenen** Plugin, nicht als');
  z.push('neuer Katalogeintrag. Prüfen kostet einen Blick auf beide Links, keinen Abruf.');
  z.push('');
  z.push('| Fund | Katalog-Eintrag | Nähe | Push |');
  z.push('|---|---|---|---|');
  for (const u of umbenannt) {
    z.push(`| [\`${u.voll}\`](${u.link}) | \`${u.dub.plugin.id}\` (${u.dub.plugin.link || 'kein Link'}) | ${u.dub.punkte.toFixed(2)} | ${u.push || '?'} |`);
  }
  z.push('');
}

if (ohneManifest.length) {
  z.push('## Aussortiert: kein fxmanifest');
  z.push('');
  z.push('Nur zur Nachvollziehbarkeit — hier ist nichts zu tun. Wenn ein Name hier auffällt, der');
  z.push('eigentlich eine Ressource sein müsste, liegt das Manifest vermutlich in einem Unterordner');
  z.push('(dann per `--alles` erneut laufen lassen und den Pfad von Hand prüfen).');
  z.push('');
  z.push(ohneManifest.map((k) => '`' + k.voll + '`').join(' · '));
  z.push('');
}

if (bekannt.length) {
  z.push('## Bereits im Katalog (kein Handlungsbedarf)');
  z.push('');
  z.push(`${bekannt.length} Treffer, hier nur als Beleg, dass die Suche den Bestand tatsächlich abdeckt:`);
  z.push('');
  z.push(bekannt.map((k) => `\`${k.voll}\`→\`${k.dub.plugin.id}\``).join(' · '));
  z.push('');
}

z.push('---');
z.push('');
z.push('Erinnerung: Ein Kandidat wird erst durch die Recherche nach `docs/RECHERCHE.md` zum');
z.push('Katalogeintrag. Diese Liste ist eine Vorauswahl, kein Katalogzuwachs.');
z.push('');

const ordner = pfad('data', '.prefetch');
mkdirSync(ordner, { recursive: true });
const zielPfad = pfad('data', '.prefetch', RUNDE ? `kandidaten-${RUNDE}.md` : `kandidaten-${heute}.md`);
writeFileSync(zielPfad, z.join('\n'), 'utf8');

// Maschinenlesbar für `prefetch --kandidaten`: nur das Nötige, keine Rohtexte.
const jsonPfad = pfad('data', '.kandidaten.json');
writeFileSync(jsonPfad, JSON.stringify({
  erstellt: heute,
  runde: RUNDE ? Number(RUNDE) : null,
  abfragen: abfragen.map((a) => a.q),
  kandidaten: ausgewaehlt.map((k) => ({
    id: k.id, name: k.repo, link: k.link, owner: k.owner,
    push: k.push, sterne: k.sterne, archiviert: k.archiviert,
    beschreibung: k.beschreibung, punkte: k.punkte,
    gruppe_kandidat: k.gruppeHinweis ? k.gruppeHinweis.plugin.id : null
  }))
}, null, 2), 'utf8');

writeFileSync(laufPfad, JSON.stringify({ zuletzt: heute, kandidaten: ausgewaehlt.length }, null, 2), 'utf8');
netz.speichere();

/* ------------------------------ Zusammenfassung ------------------------------ */

console.log('');
for (const k of ausgewaehlt.slice(0, 15)) {
  const farbe = k.archiviert ? gelb : gruen;
  console.log(`  ${farbe(k.archiviert ? '🪦' : '🟢')} ${fett(k.voll.padEnd(38))} ${grau(`${k.push} · ⭐${k.sterne} · ${kurzSignal(k) || '—'}`)}`);
}
if (ausgewaehlt.length > 15) console.log(grau(`  … und ${ausgewaehlt.length - 15} weitere im Briefing`));

console.log(fett('\nErgebnis'));
console.log(`  ${grau('Rohtreffer'.padEnd(20))} ${treffer.size}`);
console.log(`  ${grau('bereits im Katalog'.padEnd(20))} ${bekannt.length}`);
console.log(`  ${grau('vermutl. umbenannt'.padEnd(20))} ${umbenannt.length}`);
if (!SCHNELL) console.log(`  ${grau('ohne fxmanifest'.padEnd(20))} ${ohneManifest.length}`);
console.log(`  ${grau('Kandidaten'.padEnd(20))} ${gruen(String(ausgewaehlt.length))}`);
console.log(grau(`\n  API-Aufrufe ${netz.zaehler.api} · Rohdateien ${netz.zaehler.roh} · aus Cache ${netz.zaehler.cache}${netz.zaehler.fehler ? ' · Fehler ' + netz.zaehler.fehler : ''}`));
console.log(gruen('\n✔ Briefing: ') + fett(relPfad(zielPfad)));
console.log(grau('  ') + relPfad(jsonPfad) + grau('  → weiter mit: ') + fett('npm run prefetch -- --kandidaten'));
console.log(grau('  Den Pfad den Subagents nennen, nicht den Inhalt hineinkopieren.\n'));
