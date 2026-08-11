/**
 * main.js — Einstiegspunkt für scripts/build.mjs.
 *
 * Nur ein Platzhalter für Phase 0: er beweist, dass die Bau-Kette (Module bündeln,
 * Katalog+Kategorien einbetten, Platzhalter im Rahmen ersetzen, alles in eine Datei) end-to-end
 * funktioniert. Die eigentliche App (State, Render, Filter, Vergleich, Export, Backup — siehe
 * Plan Abschnitt 1.1) entsteht in Phase 1 und ersetzt diese Datei durch die echten Module.
 */

const daten = JSON.parse(document.getElementById('qbox-daten').textContent);

function baustelle() {
  const el = document.getElementById('app');
  el.innerHTML = `
    <h1>Qbox Server-Planer</h1>
    <p>Phase 0 abgeschlossen: Schema, Validator und Build-Kette stehen.</p>
    <p>Katalog v${daten.katalogVersion} · ${daten.plugins.length} Plugin(s) · ${daten.kategorien.length} Kategorien · gebaut am ${daten.gebaut}</p>
    <p>Die eigentliche Oberfläche entsteht in Phase 1.</p>
  `;
}

baustelle();
