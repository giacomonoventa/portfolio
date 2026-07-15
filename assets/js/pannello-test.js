/**
 * pannello-test.js — STRUMENTO TEMPORANEO DI TEST GRAFICO
 * ---------------------------------------------------------
 * Per rimuoverlo del tutto a fine lavoro:
 *   1) elimina questo file
 *   2) elimina la riga <script src="assets/js/pannello-test.js"></script>
 *      da index.html (e da qualunque altra pagina lo richiami)
 * Nessun altro file va toccato: i valori che avrai eventualmente copiato
 * nel CSS restano lì, il pannello sparisce senza lasciare altro codice in giro.
 *
 * Non salva nulla: modifica solo le variabili CSS (:root) live nel browser,
 * a livello visivo. Ricaricando la pagina senza aver copiato i valori nel
 * file style.css, tutto torna come scritto nel CSS.
 */
(function () {
  // ---- elenco delle variabili controllabili, raggruppate per categoria ----
  // (nessun controllo sui colori, come richiesto)
  const GROUPS = [
    {
      label: 'Testo — titoli',
      vars: [
        { name: '--fs-hero-title', label: 'Titolo copertina (nome)' },
        { name: '--fs-page-title', label: 'Titolo "Chi sono" / "Contatti"' },
        { name: '--fs-cat-title', label: 'Titolo pagina categoria' },
        { name: '--fs-card-title', label: 'Nome sport nelle card' },
        { name: '--fs-card-title-sm', label: 'Nome categoria "Altri eventi"' },
        { name: '--fs-brand', label: 'Nome nell\'header' }
      ]
    },
    {
      label: 'Testo — corrente e meta',
      vars: [
        { name: '--fs-hero-sub', label: 'Sottotitolo copertina' },
        { name: '--fs-nav', label: 'Voci di menu' },
        { name: '--fs-label', label: 'Etichette sezione (Sport / Altri eventi)' },
        { name: '--fs-body', label: 'Testo corrente (bio Chi sono)' },
        { name: '--fs-body-small', label: 'Testo secondario (intro, campi form)' },
        { name: '--fs-form-label', label: 'Etichette sopra i campi del form' },
        { name: '--fs-mono', label: 'Didascalie/meta piccole (mono)' },
        { name: '--fs-button', label: 'Testo bottone invio form' },
        { name: '--fs-icon-close', label: 'Icona chiusura lightbox (X)' },
        { name: '--fs-icon-arrow', label: 'Icone frecce lightbox' }
      ]
    },
    {
      label: 'Immagini — proporzioni e dimensioni',
      vars: [
        { name: '--img-sport-ratio', label: 'Proporzione card sport (0.8 ≈ 4:5)' },
        { name: '--img-chisono-ratio', label: 'Proporzione foto "Chi sono" (0.75 ≈ 3:4)' },
        { name: '--other-card-height', label: 'Altezza card "Altri eventi"' },
        { name: '--hero-height', label: 'Altezza copertina' },
        { name: '--logo-size', label: 'Dimensione logo header' },
        { name: '--lightbox-w', label: 'Larghezza max foto nel lightbox' },
        { name: '--lightbox-h', label: 'Altezza max foto nel lightbox' }
      ]
    },
    {
      label: 'Spaziature',
      vars: [
        { name: '--space-container-x', label: 'Margine laterale pagine' },
        { name: '--space-section', label: 'Spazio sopra ogni sezione' },
        { name: '--space-page-top', label: 'Spazio sopra titoli di pagina' },
        { name: '--space-band-gap', label: 'Spazio tra le card sport' },
        { name: '--space-grid-gap', label: 'Spazio nella griglia galleria' },
        { name: '--space-footer-top', label: 'Spazio sopra il footer' },
        { name: '--space-form-row', label: 'Spazio tra i campi del form' }
      ]
    }
  ];

  // ---- parsing generico "numero + unità" da un valore CSS ----
  function parseValue(raw) {
    const s = String(raw).trim();
    const m = s.match(/^(-?\d*\.?\d+)(\D*)$/);
    if (!m) return { num: 0, unit: '' };
    return { num: parseFloat(m[1]), unit: m[2] || '' };
  }

  function currentRootValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // ---- costruzione UI ----
  const wrap = document.createElement('div');
  wrap.id = 'pt-wrap';

  const style = document.createElement('style');
  style.textContent = `
    #pt-wrap{position:fixed; left:0; right:0; bottom:0; z-index:99999; font-family:'Inter',Arial,sans-serif;}
    #pt-tab{
      display:flex; align-items:center; justify-content:center; gap:8px;
      height:34px; background:#151517; color:#eee; border-top:1px solid #333;
      cursor:pointer; font-size:12px; letter-spacing:.05em; user-select:none;
    }
    #pt-tab:hover{background:#1d1d20;}
    #pt-panel{
      max-height:0; overflow:hidden; background:#101012; border-top:1px solid #333;
      transition:max-height .25s ease;
    }
    #pt-panel.pt-open{max-height:22vh;}
    #pt-scroll{max-height:22vh; overflow-y:auto; padding:16px 20px 26px;}
    .pt-group{margin-bottom:18px;}
    .pt-group h4{
      color:#888; font-size:11px; text-transform:uppercase; letter-spacing:.08em;
      margin:0 0 10px; padding-bottom:6px; border-bottom:1px solid #2a2a2d;
    }
    .pt-row{display:grid; grid-template-columns:1fr 2fr 70px; gap:10px; align-items:center; margin-bottom:8px;}
    .pt-row label{color:#ccc; font-size:12px;}
    .pt-row input[type=range]{width:100%;}
    .pt-val{
      color:#fff; font-size:11.5px; font-family:'Courier New',monospace;
      background:#1c1c1f; border:1px solid #333; border-radius:3px;
      padding:4px 6px; text-align:center; cursor:text; user-select:all;
    }
    #pt-reset{
      margin-top:6px; background:#2a2a2e; color:#eee; border:1px solid #444;
      border-radius:3px; padding:6px 14px; font-size:11px; cursor:pointer;
    }
    #pt-reset:hover{background:#333;}
    @media (max-width:700px){
      .pt-row{grid-template-columns:90px 1fr 60px;}
    }
  `;
  document.head.appendChild(style);

  let groupsHtml = '';
  GROUPS.forEach((g, gi) => {
    groupsHtml += `<div class="pt-group"><h4>${g.label}</h4>`;
    g.vars.forEach((v, vi) => {
      groupsHtml += `
        <div class="pt-row">
          <label for="pt-${gi}-${vi}">${v.label}</label>
          <input type="range" id="pt-${gi}-${vi}" data-var="${v.name}">
          <span class="pt-val" id="pt-val-${gi}-${vi}" title="Clicca per selezionare e copiare"></span>
        </div>`;
    });
    groupsHtml += `</div>`;
  });

  wrap.innerHTML = `
    <div id="pt-tab">▲ Pannello test grafico (temporaneo)</div>
    <div id="pt-panel">
      <div id="pt-scroll">
        ${groupsHtml}
        <button id="pt-reset">Ripristina valori del CSS (ricarica pagina)</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const tab = document.getElementById('pt-tab');
  const panel = document.getElementById('pt-panel');
  tab.addEventListener('click', () => {
    panel.classList.toggle('pt-open');
    const isOpen = panel.classList.contains('pt-open');
    tab.textContent = isOpen
      ? '▼ Pannello test grafico (temporaneo)'
      : '▲ Pannello test grafico (temporaneo)';
    setHeroLabelsVisible(isOpen);
  });

  document.getElementById('pt-reset').addEventListener('click', () => location.reload());

  // ---- etichette misure/proporzioni sovrapposte alle immagini di copertina ----
  // Visibili solo quando il pannello è aperto. Mostrano dimensione attuale
  // renderizzata + proporzione, e sotto min/max consentiti nella modalità
  // attuale (desktop/mobile) secondo le variabili CSS attive.
  const heroLabelStyle = document.createElement('style');
  heroLabelStyle.textContent = `
    .pt-dim-label{
      position:absolute; top:10px; left:10px; z-index:50;
      background:rgba(0,0,0,.62); color:#fff; font-family:'Courier New',monospace;
      padding:6px 9px; border-radius:4px; line-height:1.35; pointer-events:none;
      display:none;
    }
    .pt-dim-label.pt-show{display:block;}
    .pt-dim-label .pt-dim-main{font-size:12px; font-weight:600;}
    .pt-dim-label .pt-dim-sub{font-size:9.5px; color:#bbb; margin-top:2px;}
  `;
  document.head.appendChild(heroLabelStyle);

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  function isMobileNow() {
    return window.innerWidth <= 700; // stessa soglia usata nel CSS del sito
  }

  // stima min/max px per --hero-height nella modalità attuale, leggendo
  // il valore corrente (vh/px) e traducendolo in un range indicativo
  function heroMinMax() {
    const raw = currentRootValue('--hero-height');
    const { num, unit } = parseValue(raw || '92vh');
    const vh = window.innerHeight;
    let curPx;
    if (unit === 'vh') curPx = Math.round(vh * (num / 100));
    else curPx = num;
    const minPx = Math.round(curPx * (isMobileNow() ? 0.5 : 0.4));
    const maxPx = Math.round(curPx * (isMobileNow() ? 1.3 : 1.4));
    return { minPx, maxPx };
  }

  function buildLabelsForHero() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;
    const slides = heroSection.querySelectorAll('.hero-slide');
    slides.forEach(slide => {
      if (slide.querySelector('.pt-dim-label')) return; // già presente
      slide.style.position = slide.style.position || 'absolute';
      const label = document.createElement('div');
      label.className = 'pt-dim-label';
      label.innerHTML = `<div class="pt-dim-main"></div><div class="pt-dim-sub"></div>`;
      slide.appendChild(label);
    });
  }

  function updateHeroLabels() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w === 0 || h === 0) return;
    const divisor = gcd(w, h) || 1;
    const ratioStr = `${Math.round(w / divisor)}:${Math.round(h / divisor)}`;
    const { minPx, maxPx } = heroMinMax();
    const modeLabel = isMobileNow() ? 'mobile' : 'desktop';

    heroSection.querySelectorAll('.pt-dim-label').forEach(label => {
      label.querySelector('.pt-dim-main').textContent = `${w}×${h}px — ${ratioStr}`;
      label.querySelector('.pt-dim-sub').textContent = `min ${minPx}px — max ${maxPx}px (${modeLabel})`;
    });
  }

  function setHeroLabelsVisible(visible) {
    document.querySelectorAll('.pt-dim-label').forEach(label => {
      label.classList.toggle('pt-show', visible);
    });
    if (visible) updateHeroLabels();
  }

  // ricostruisce/aggiorna le etichette periodicamente (le slide della
  // copertina possono essere generate dopo il caricamento di app.js)
  const heroLabelInterval = setInterval(() => {
    buildLabelsForHero();
    if (panel.classList.contains('pt-open')) updateHeroLabels();
  }, 800);

  window.addEventListener('resize', () => {
    if (panel.classList.contains('pt-open')) updateHeroLabels();
  });

  // ---- inizializzazione slider: legge il valore attuale da :root ----
  GROUPS.forEach((g, gi) => {
    g.vars.forEach((v, vi) => {
      const input = document.getElementById(`pt-${gi}-${vi}`);
      const out = document.getElementById(`pt-val-${gi}-${vi}`);
      const raw = currentRootValue(v.name);
      const { num, unit } = parseValue(raw || '0');

      // range/step adattivi in base all'unità e al valore di partenza
      let min, max, step;
      if (unit === '' ) { // valori decimali tipo i ratio immagine
        min = Math.max(0.3, +(num * 0.4).toFixed(2));
        max = +(num * 2).toFixed(2);
        step = 0.01;
      } else if (unit === 'vh' || unit === 'vw') {
        min = Math.max(10, Math.round(num * 0.4));
        max = Math.round(num * 1.4);
        step = 1;
      } else { // px
        min = Math.max(1, Math.round(num * 0.3));
        max = Math.round(num * 2.5);
        step = 1;
      }

      input.min = min;
      input.max = max;
      input.step = step;
      input.value = num;
      out.textContent = num + unit;

      input.addEventListener('input', () => {
        const newVal = input.value + unit;
        document.documentElement.style.setProperty(v.name, newVal);
        out.textContent = newVal;
        if (v.name === '--hero-height' && panel.classList.contains('pt-open')) {
          updateHeroLabels();
        }
      });

      // click sul valore: lo seleziona per una copia rapida
      out.addEventListener('click', () => {
        const range = document.createRange();
        range.selectNodeContents(out);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    });
  });
})();
