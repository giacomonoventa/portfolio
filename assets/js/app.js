(function(){
  const app = document.getElementById('app');
  const headerEl = document.getElementById('site-header');
  let MANIFEST = null;
  let CONTENT = null;
  let currentGallery = []; // usata dal lightbox

  // ---------- util ----------
  function el(tag, cls, html){
    const e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html !== undefined) e.innerHTML = html;
    return e;
  }
  function emptyState(label){
    return `<div class="ph-empty">${label || 'Foto in arrivo…'}</div>`;
  }
  // genera <picture> con sorgente mobile dedicata se presente (immagine "NN-mobile.jpg"),
  // altrimenti un <img> normale
  function pictureTag(img, alt){
    const altAttr = (alt || '').replace(/"/g,'&quot;');
    if(img.mobileUrl){
      return `<picture>
        <source media="(max-width:860px)" srcset="${img.mobileUrl}">
        <img src="${img.url}" alt="${altAttr}" loading="lazy">
      </picture>`;
    }
    return `<img src="${img.url}" alt="${altAttr}" loading="lazy">`;
  }

  // ---------- caricamento dati ----------
  Promise.all([
    fetch('manifest.json').then(r => r.json()),
    fetch('content.json').then(r => r.json())
  ]).then(([manifest, content]) => {
    MANIFEST = manifest;
    CONTENT = content;
    setupHeader();
    setupNav();
    router();
  }).catch(err => {
    app.innerHTML = `<div class="ph-empty" style="height:60vh;">Errore nel caricamento dei contenuti.</div>`;
    console.error(err);
  });

  // ---------- header / logo ----------
  function setupHeader(){
    const logoSlot = document.getElementById('logo-slot');
    if(MANIFEST.sistema.logo){
      logoSlot.innerHTML = `<img src="${MANIFEST.sistema.logo}" alt="logo">`;
    } // altrimenti resta il pallino bianco di default (già nel markup)
  }

  function setupNav(){
    const sportDD = document.getElementById('dropdown-sport');
    const eventiDD = document.getElementById('dropdown-eventi');
    sportDD.innerHTML = MANIFEST.sport.length
      ? MANIFEST.sport.map(c => `<a data-nav="cat" data-slug="${c.slug}" data-type="sport">${c.name}</a>`).join('')
      : `<div class="empty-note">Nessuno sport pubblicato</div>`;
    eventiDD.innerHTML = MANIFEST.eventi.length
      ? MANIFEST.eventi.map(c => `<a data-nav="cat" data-slug="${c.slug}" data-type="evento">${c.name}</a>`).join('')
      : `<div class="empty-note">Nessuna categoria pubblicata</div>`;

    document.querySelectorAll('[data-nav]').forEach(node=>{
      node.addEventListener('click', (e)=>{
        const type = node.dataset.nav;
        if(type === 'home') renderHome();
        else if(type === 'chi-sono') renderChiSono();
        else if(type === 'contatti') renderContatti();
        else if(type === 'cat') renderCategoria(node.dataset.slug, node.dataset.type);
        document.getElementById('mainnav').classList.remove('open');
      });
    });

    // dropdown a tap su mobile
    document.querySelectorAll('.navlink:not(.simple)').forEach(nl=>{
      nl.querySelector('span').addEventListener('click', ()=>{
        if(window.innerWidth <= 860) nl.classList.toggle('open');
      });
    });
    document.getElementById('hamburger').addEventListener('click', ()=>{
      document.getElementById('mainnav').classList.toggle('open');
    });
  }

  function router(){ renderHome(); }

  // ---------- HOME ----------
  function renderHome(){
    window.scrollTo(0,0);
    const hasHero = MANIFEST.copertina.length > 0;
    const heroSlides = hasHero
      ? MANIFEST.copertina.map((img,i)=>`<div class="hero-slide${i===0?' active':''}">${pictureTag(img,'')}</div>`).join('')
      : emptyState('Foto in arrivo…');

    app.innerHTML = `
      <section class="hero" id="hero">
        ${hasHero ? heroSlides : ''}
        ${hasHero ? '<div class="hero-overlay"></div>' : ''}
        <div class="hero-content">
          <div class="hero-title">Giacomo Noventa</div>
          <div class="hero-sub">Sport photography</div>
        </div>
      </section>

      <div class="section-head section-head--empty"></div>
      <div class="sport-grid" id="sport-grid"></div>

      <div class="section-head section-head--empty" style="margin-top:36px;"></div>
      <div class="other-grid" id="other-grid"></div>

      <footer>
        <div class="foot-left">GIACOMO NOVENTA<br>SPORT PHOTOGRAPHY<br>© ${new Date().getFullYear()}</div>
        <div class="foot-cta" data-nav="contatti">Richiedi un servizio →</div>
      </footer>
    `;
    document.querySelector('.foot-cta').addEventListener('click', renderContatti);

    // hero rotation
    const heroObserverTarget = document.getElementById('hero');
    if(hasHero && MANIFEST.copertina.length > 1){
      let idx = 0;
      const slides = heroObserverTarget.querySelectorAll('.hero-slide');
      setInterval(()=>{
        slides[idx].classList.remove('active');
        idx = (idx+1) % slides.length;
        slides[idx].classList.add('active');
      }, 4500);
    }
    // nome header appare solo dopo che la hero esce dalla vista
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        headerEl.classList.toggle('show-name', !entry.isIntersecting);
      });
    }, {threshold:0});
    io.observe(heroObserverTarget);

    buildSportGrid();
    buildOtherGrid();
  }

  function buildSportGrid(){
    const wrap = document.getElementById('sport-grid');
    if(MANIFEST.sport.length === 0){
      wrap.innerHTML = `<div class="ph-empty">Nessuno sport pubblicato ancora.</div>`;
      return;
    }
    wrap.innerHTML = MANIFEST.sport.map(cat => {
      const cover = cat.cover;
      const slides = cover.length
        ? cover.map((img,i)=>`<div class="band-slide${i===0?' active':''}">${pictureTag(img,cat.name)}</div>`).join('')
        : emptyState('Foto in arrivo…');
      return `
        <div class="sport-card" data-slug="${cat.slug}" data-type="sport">
          ${cover.length ? slides + '<div class="band-overlay"></div>' : slides}
          <div class="band-body">
            <div class="band-name">${cat.name}</div>
            <div class="band-cta"></div>
          </div>
        </div>`;
    }).join('');

    wrap.querySelectorAll('.sport-card').forEach(card=>{
      card.addEventListener('click', ()=> renderCategoria(card.dataset.slug, card.dataset.type));
      const slides = card.querySelectorAll('.band-slide');
      if(slides.length > 1){
        let idx = 0;
        setInterval(()=>{
          slides[idx].classList.remove('active');
          idx = (idx+1) % slides.length;
          slides[idx].classList.add('active');
        }, 3800 + Math.random()*800);
      }
    });
  }

  function buildOtherGrid(){
    const wrap = document.getElementById('other-grid');
    if(MANIFEST.eventi.length === 0){
      wrap.innerHTML = `<div class="ph-empty" style="height:180px;">Nessuna categoria pubblicata ancora.</div>`;
      return;
    }
    wrap.innerHTML = MANIFEST.eventi.map(cat=>{
      const cover0 = cat.cover[0];
      return `
        <div class="other-card" data-slug="${cat.slug}" data-type="evento">
          ${cover0 ? pictureTag(cover0,cat.name) : emptyState('Foto in arrivo…')}
          ${cover0 ? '<div class="cc-overlay"></div>' : ''}
          <div class="cc-body"><div class="cc-name">${cat.name}</div></div>
        </div>`;
    }).join('');
    wrap.querySelectorAll('.other-card').forEach(card=>{
      card.addEventListener('click', ()=> renderCategoria(card.dataset.slug, card.dataset.type));
    });
  }

  // ---------- PAGINA CATEGORIA ----------
  function renderCategoria(slug, type){
    const list = type === 'sport' ? MANIFEST.sport : MANIFEST.eventi;
    const cat = list.find(c => c.slug === slug);
    if(!cat) return renderHome();
    window.scrollTo(0,0);
    headerEl.classList.add('show-name');

    app.innerHTML = `
      <div class="cat-hero">
        <div>
          <span class="back-link" id="back-link">←</span>
          <div class="cat-hero-title">${cat.name}</div>
        </div>
      </div>
      <div class="organic-grid" id="organic-grid"></div>
    `;
    document.getElementById('back-link').addEventListener('click', renderHome);

    const grid = document.getElementById('organic-grid');
    if(cat.images.length === 0){
      grid.style.columnCount = 1;
      grid.innerHTML = emptyState('Foto in arrivo…');
      currentGallery = [];
      return;
    }
    currentGallery = cat.images;
    grid.innerHTML = cat.images.map((img,i)=>`
      <div class="g-item" data-index="${i}">
        ${pictureTag(img, cat.name + ' ' + (i+1))}
      </div>`).join('');

    grid.querySelectorAll('.g-item').forEach(item=>{
      item.addEventListener('click', ()=> openLightbox(parseInt(item.dataset.index,10)));
    });
    observeCascade();
  }

  function observeCascade(){
    const items = document.querySelectorAll('.g-item');
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const i = [...items].indexOf(entry.target);
          entry.target.style.transitionDelay = ((i % 6) * 70) + 'ms';
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
    items.forEach(it => io.observe(it));
  }

  // ---------- LIGHTBOX ----------
  const lightbox = document.getElementById('lightbox');
  const lbPhoto = document.getElementById('lb-photo');
  const lbCaption = document.getElementById('lb-caption');
  let lbIndex = 0;

  function openLightbox(i){
    lbIndex = i;
    renderLightbox();
    lightbox.classList.add('open');
  }
  function closeLightbox(){ lightbox.classList.remove('open'); }
  function navLightbox(dir){
    if(currentGallery.length === 0) return;
    lbIndex = (lbIndex + dir + currentGallery.length) % currentGallery.length;
    renderLightbox();
  }
  function renderLightbox(){
    const img = currentGallery[lbIndex];
    lbPhoto.innerHTML = `<img src="${img.url}" alt="">`;
    lbCaption.textContent = String(lbIndex+1).padStart(2,'0') + ' / ' + String(currentGallery.length).padStart(2,'0');
  }
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', ()=> navLightbox(-1));
  document.getElementById('lb-next').addEventListener('click', ()=> navLightbox(1));
  lightbox.addEventListener('click', (e)=>{ if(e.target.id === 'lightbox') closeLightbox(); });
  document.addEventListener('keydown', (e)=>{
    if(!lightbox.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowRight') navLightbox(1);
    if(e.key === 'ArrowLeft') navLightbox(-1);
  });
  // swipe touch
  let touchStartX = null;
  lightbox.addEventListener('touchstart', (e)=>{ touchStartX = e.changedTouches[0].clientX; }, {passive:true});
  lightbox.addEventListener('touchend', (e)=>{
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 50) navLightbox(dx < 0 ? 1 : -1);
    touchStartX = null;
  }, {passive:true});

  // ---------- CHI SONO ----------
  function renderChiSono(){
    window.scrollTo(0,0);
    headerEl.classList.add('show-name');
    const photo = MANIFEST.sistema.profilo
      ? `<img src="${MANIFEST.sistema.profilo}" alt="Giacomo Noventa">`
      : emptyState('Foto in arrivo…');
    app.innerHTML = `
      <div class="chisono-page">
        <h1>Chi sono</h1>
        <div class="chisono-grid">
          <div class="chisono-photo">${photo}</div>
          <div class="chisono-text">${CONTENT.bio.replace(/\n/g,'<br>')}</div>
        </div>
      </div>`;
  }

  // ---------- CONTATTI ----------
  function renderContatti(){
    window.scrollTo(0,0);
    headerEl.classList.add('show-name');
    app.innerHTML = `
      <div class="contatti-page">
        <h1>Contatti</h1>
        <p class="contatti-intro">Raccontami il tuo evento: ti risponderò il prima possibile con disponibilità e preventivo.</p>
        <form id="contact-form">
          <div class="form-row"><label>Nome e cognome</label><input type="text" name="nome" required></div>
          <div class="two-col">
            <div class="form-row"><label>Email</label><input type="email" name="email" required></div>
            <div class="form-row"><label>Telefono</label><input type="tel" name="telefono" required></div>
          </div>
          <div class="form-row"><label>Nome evento</label><input type="text" name="nome_evento" placeholder="Es. Finale campionato, Matrimonio..." required></div>

          <div class="toggle-row">
            <input type="checkbox" id="multi-day">
            <label for="multi-day">L'evento dura più giorni</label>
          </div>

          <div id="date-single" class="form-row">
            <label>Data evento</label>
            <input type="date" name="data_evento">
          </div>
          <div id="date-range" class="two-col" style="display:none;">
            <div class="form-row"><label>Data inizio</label><input type="date" name="data_inizio"></div>
            <div class="form-row"><label>Data fine</label><input type="date" name="data_fine"></div>
          </div>

          <div class="form-row"><label>Orario indicativo giornaliero</label><input type="text" name="orario" placeholder="Es. 15:00 - 19:00"></div>
          <div class="form-row"><label>Note (facoltativo)</label><textarea name="note" placeholder="Location, numero persone, esigenze particolari..."></textarea></div>

          <button type="submit" class="submit-btn">Invia richiesta</button>
          <div class="form-status" id="form-status"></div>
        </form>
      </div>`;

    const multiDay = document.getElementById('multi-day');
    const single = document.getElementById('date-single');
    const range = document.getElementById('date-range');
    multiDay.addEventListener('change', ()=>{
      single.style.display = multiDay.checked ? 'none' : 'block';
      range.style.display = multiDay.checked ? 'grid' : 'none';
    });

    document.getElementById('contact-form').addEventListener('submit', handleSubmit);
  }

  function handleSubmit(e){
    e.preventDefault();
    const form = e.target;
    const status = document.getElementById('form-status');
    const endpoint = CONTENT.formEndpoint;
    if(!endpoint || endpoint.includes('PLACEHOLDER')){
      status.textContent = 'Configurazione form non completata: imposta formEndpoint in content.json.';
      status.className = 'form-status err';
      return;
    }
    status.textContent = 'Invio in corso…';
    status.className = 'form-status';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    }).then(res=>{
      if(res.ok){
        status.textContent = 'Richiesta inviata! Ti risponderò al più presto.';
        status.className = 'form-status ok';
        form.reset();
      } else {
        status.textContent = 'Errore nell\'invio, riprova o scrivimi via email.';
        status.className = 'form-status err';
      }
    }).catch(()=>{
      status.textContent = 'Errore di connessione, riprova più tardi.';
      status.className = 'form-status err';
    });
  }
})();
