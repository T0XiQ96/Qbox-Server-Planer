/**
 * ui.js — Oberflächen-Grundbausteine: Toast, Modal, Bestätigung.
 *
 * Eigene Modals statt confirm()/alert(): die Import-Vorschau (E8/E10) braucht ohnehin ein echtes
 * Fenster mit Änderungsliste und Abbrechen-Knopf, und dann sollen Warner und Rückfragen nicht in
 * einem zweiten, fremden Stil erscheinen. Alles rein lokal, ohne externe Abhängigkeit (H5).
 *
 * Achtung beim Einsetzen von Inhalten: HTML wird hier bewusst als String übergeben, weil die
 * Aufrufer (render.js, import.js) fertige, bereits escapte Bausteine liefern. Wer hier Rohtext
 * hineingibt, muss ihn vorher selbst durch escapeHtml() schicken.
 */

let modalOffen = null;

/* =================================== Toast =================================== */

let toastTimer = null;

export function toast(text, art = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = text;
  el.className = 'toast toast-' + art + ' sichtbar';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, art === 'fehler' ? 6000 : 3000);
}

/* =================================== Modal =================================== */

/**
 * Öffnet ein Modal.
 * @param {{titel:string, inhalt:string, knoepfe?:Array<{text:string, art?:string, wert?:any}>}} opt
 * @returns {Promise<any>} Wert des gedrückten Knopfes, null bei Abbruch (Esc, Klick daneben, ✕)
 */
export function modal({ titel, inhalt, knoepfe = [{ text: 'Schließen', wert: null }] }) {
  schliesseModal();

  return new Promise((aufloesen) => {
    const huelle = document.createElement('div');
    huelle.className = 'modal-huelle';
    huelle.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${titel}">
        <div class="modal-kopf">
          <h2>${titel}</h2>
          <button class="modal-schliessen" aria-label="Schließen">✕</button>
        </div>
        <div class="modal-inhalt">${inhalt}</div>
        <div class="modal-fuss"></div>
      </div>`;

    const fuss = huelle.querySelector('.modal-fuss');
    knoepfe.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (k.art ? 'btn-' + k.art : '');
      b.textContent = k.text;
      b.addEventListener('click', () => beenden(k.wert === undefined ? i : k.wert));
      fuss.appendChild(b);
    });

    function beenden(wert) {
      if (modalOffen !== huelle) return;
      document.removeEventListener('keydown', beiTaste);
      huelle.remove();
      modalOffen = null;
      aufloesen(wert);
    }

    function beiTaste(e) { if (e.key === 'Escape') beenden(null); }

    huelle.querySelector('.modal-schliessen').addEventListener('click', () => beenden(null));
    huelle.addEventListener('click', (e) => { if (e.target === huelle) beenden(null); });
    document.addEventListener('keydown', beiTaste);

    // Menü-Modals: ein Element mit data-tat im INHALT schließt das Fenster und liefert seinen Wert.
    // Ohne das wären Zahnrad-Menü und Backup-Liste tote Knöpfe — sie liegen im Inhalt, nicht im Fuß.
    huelle.querySelector('.modal-inhalt').addEventListener('click', (e) => {
      const punkt = e.target.closest('[data-tat]');
      if (punkt) beenden(punkt.dataset.tat);
    });

    document.body.appendChild(huelle);
    modalOffen = huelle;
    huelle.__beenden = beenden;

    const ersterKnopf = fuss.querySelector('button');
    if (ersterKnopf) ersterKnopf.focus();
  });
}

export function schliesseModal() {
  if (modalOffen && modalOffen.__beenden) modalOffen.__beenden(null);
}

/* ================================ Bestätigung ================================ */

/** @returns {Promise<boolean>} */
export async function frage({ titel, inhalt, jaText = 'Ja', neinText = 'Abbrechen', art = 'gefahr' }) {
  const antwort = await modal({
    titel,
    inhalt,
    knoepfe: [
      { text: neinText, wert: false },
      { text: jaText, art, wert: true }
    ]
  });
  return antwort === true;
}

/** Nur eine Meldung, ein Knopf. */
export function hinweis({ titel, inhalt }) {
  return modal({ titel, inhalt, knoepfe: [{ text: 'Verstanden', wert: null }] });
}

/* ============================== Kleine Helfer ============================== */

/** Bietet Text als Datei zum Download an — auch über file:// nutzbar. */
export function ladeHerunter(text, dateiname, typ = 'application/json') {
  const blob = new Blob([text], { type: typ });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = dateiname;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Öffnet einen Dateiauswahl-Dialog und liefert den Inhalt als Text. */
export function waehleDatei(endung = '.json') {
  return new Promise((aufloesen) => {
    const eingabe = document.createElement('input');
    eingabe.type = 'file';
    eingabe.accept = endung;
    eingabe.addEventListener('change', () => {
      const datei = eingabe.files && eingabe.files[0];
      if (!datei) return aufloesen(null);

      const leser = new FileReader();
      leser.onload = () => aufloesen({ name: datei.name, text: String(leser.result) });
      leser.onerror = () => aufloesen(null);
      leser.readAsText(datei);
    });
    eingabe.click();
  });
}
