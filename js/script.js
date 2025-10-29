// scripts.js — ArenaHub prototype + homepage spinner
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
   * 1) NAV / SCREEN SWITCHING (only if those elements exist)
   * ========================================================= */
  const screens = {
    dashboard: document.getElementById('screen-dashboard'),
    schedule:  document.getElementById('screen-schedule'),
    seating:   document.getElementById('screen-seating'),
    analytics: document.getElementById('screen-analytics')
  };
  const navButtons = document.querySelectorAll('.nav-btn');

  if (navButtons.length) {
    function show(screenKey){
      Object.values(screens).forEach(s => s?.classList.add('hidden'));
      screens[screenKey]?.classList.remove('hidden');
      navButtons.forEach(b => b.classList.remove('active'));
      document.getElementById('nav-' + screenKey)?.classList.add('active');
    }
    document.getElementById('nav-dashboard')?.addEventListener('click', () => show('dashboard'));
    document.getElementById('nav-schedule') ?.addEventListener('click', () => show('schedule'));
    document.getElementById('nav-seating')  ?.addEventListener('click', () => show('seating'));
    document.getElementById('nav-analytics')?.addEventListener('click', () => show('analytics'));
  }

  /* =========================================================
   * 2) DEMO DATA + DRAG/DROP (only on pages that have pools)
   * ========================================================= */
  const teamPool      = document.getElementById('team-pool');
  const attendeePool  = document.getElementById('attendee-pool');
  const slotsContainer= document.getElementById('slots');
  const seatingMap    = document.getElementById('seating-map');

  // Helpers
  function allowDrop(ev){ ev.preventDefault(); }
  function createDraggable(label, type){
    const el = document.createElement('div');
    el.className = (type === 'team' ? 'team-item' : 'seat-item');
    el.textContent = label;
    el.draggable = true;
    el.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({ id: el.id || null, label, type }));
    });
    return el;
  }

  // If the pools exist, wire the prototype behaviors
  if (teamPool || attendeePool || slotsContainer || seatingMap) {
    const teams = ['Apex Lions','Blue Circuit','Crimson Fox','DuneRiders','Echo Clan','Frostbyte'];
    const attendees = Array.from({length: 40}, (_,i) => `Fan ${i+1}`);

    if (teamPool) {
      teams.forEach((t, idx) => {
        const el = createDraggable(t, 'team');
        el.id = 'team-' + idx;
        teamPool.appendChild(el);
      });
    }

    if (slotsContainer) {
      for (let i=0;i<6;i++){
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.slot = i;
        slot.tabIndex = 0;
        slot.innerHTML = `<strong>Slot ${i+1}</strong><div class="slot-content"></div>`;
        slot.addEventListener('dragover', allowDrop);
        slot.addEventListener('drop', (ev) => {
          ev.preventDefault();
          const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
          if (data.type === 'team'){
            slot.querySelector('.slot-content').textContent = data.label;
            document.getElementById('next-match') && (document.getElementById('next-match').textContent = `${data.label} (scheduled)`);
          }
        });
        slotsContainer.appendChild(slot);
      }
    }

    if (attendeePool) {
      attendees.forEach((a, i) => {
        const el = createDraggable(a, 'attendee');
        el.id = 'att-' + i;
        attendeePool.appendChild(el);
      });
      attendeePool.addEventListener('dragover', allowDrop);
      attendeePool.addEventListener('drop', (ev) => { ev.preventDefault(); /* optional return-to-pool */ });
    }

    if (seatingMap) {
      for (let s=0;s<50;s++){
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.dataset.seatId = s;
        seat.textContent = 'Empty';
        seat.addEventListener('dragover', allowDrop);
        seat.addEventListener('drop', (ev) => {
          ev.preventDefault();
          const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
          seat.textContent = data.label;
          seat.setAttribute('aria-label', `Seat ${seat.dataset.seatId} occupied by ${data.label}`);
          updateOccupancy();
        });
        seatingMap.appendChild(seat);
      }

      document.getElementById('auto-fill')?.addEventListener('click', () => {
        const seats = document.querySelectorAll('.seat');
        const pool  = Array.from(document.querySelectorAll('#attendee-pool .seat-item'));
        let names = pool.length ? pool.map(n => n.textContent) : attendees.slice();
        let i = 0;
        seats.forEach(seat => {
          if (seat.textContent === 'Empty' && i < names.length) seat.textContent = names[i++];
        });
        updateOccupancy();
      });

      document.getElementById('btn-reset')?.addEventListener('click', () => location.reload());

      function updateOccupancy(){
        const occupied = Array.from(document.querySelectorAll('.seat')).filter(s => s.textContent !== 'Empty').length;
        document.getElementById('occupancy') && (document.getElementById('occupancy').textContent = `${occupied} / 500`);
        document.getElementById('streams')    && (document.getElementById('streams').textContent = Math.min(3, Math.ceil(occupied / 150)));
      }
      updateOccupancy();
    }
  }

  /* =========================================================
   * 3) CHARTS (only if canvas + Chart.js exist)
   * ========================================================= */
  (function initCharts(){
    const a = document.getElementById('attendanceChart');
    const s = document.getElementById('sponsorChart');
    if (!a || !s || !window.Chart) return;

    const ctx = a.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['-6d','-5d','-4d','-3d','-2d','-1d','Today'],
        datasets: [{ label: 'Attendance', data: [120,230,180,300,250,400,380], fill: true, tension: 0.4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    const ctx2 = s.getContext('2d');
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Main','Stage','HUD','Kiosk'],
        datasets: [{ label: 'Impressions', data: [4000, 2600, 1800, 900] }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  })();

  /* =========================================================
   * 4) HOME PAGE — 3-CARD SPINNER + GENRE SWITCHER
   * ========================================================= */
  const spinner      = document.getElementById('spinner');
  const genreLabel   = document.getElementById('genreLabel');
  const prevGenreBtn = document.getElementById('prevGenre');
  const nextGenreBtn = document.getElementById('nextGenre');
  const spinPrev     = document.getElementById('spinPrev');
  const spinNext     = document.getElementById('spinNext');

  if (spinner && genreLabel && spinPrev && spinNext) {
    // Use any global GENRES if defined elsewhere; otherwise fallback
    const GENRES = window.GENRES || [
      { name: "FPS", items: [
        { img:"images/event1.png", alt:"FPS Event 1", url:"#"},
        { img:"images/event2.png", alt:"FPS Event 2", url:"#"},
        { img:"images/event3.png", alt:"FPS Event 3", url:"#"}
      ]},
      { name: "MOBA", items: [
        { img:"images/event_moba1.png", alt:"MOBA Event 1", url:"#"},
        { img:"images/event_moba2.png", alt:"MOBA Event 2", url:"#"},
        { img:"images/event_moba3.png", alt:"MOBA Event 3", url:"#"}
      ]},
      { name: "Sports", items: [
        { img:"images/event_sports1.png", alt:"Sports Event 1", url:"#"},
        { img:"images/event_sports2.png", alt:"Sports Event 2", url:"#"},
        { img:"images/event_sports3.png", alt:"Sports Event 3", url:"#"}
      ]},
      { name: "FGC", items: [
        { img:"images/event_fgc1.png", alt:"FGC Event 1", url:"#"},
        { img:"images/event_fgc2.png", alt:"FGC Event 2", url:"#"},
        { img:"images/event_fgc3.png", alt:"FGC Event 3", url:"#"}
      ]}
    ];

    let genreIndex = 0;   // current genre
    let spinIndex  = 0;   // center card within genre
    let autoTimer  = null;

    const wrap = (n, len) => (n + len) % len;

    function renderSpinner(){
      const items = GENRES[genreIndex].items;
      const centerIdx = wrap(spinIndex, items.length);
      const leftIdx   = wrap(spinIndex - 1, items.length);
      const rightIdx  = wrap(spinIndex + 1, items.length);

      spinner.innerHTML = `
        <div class="spin-card left">
          <img src="${items[leftIdx].img}" alt="${items[leftIdx].alt}">
          <a class="btn-link" href="${items[leftIdx].url}"><button>Learn More</button></a>
        </div>
        <div class="spin-card center">
          <img src="${items[centerIdx].img}" alt="${items[centerIdx].alt}">
          <a class="btn-link" href="${items[centerIdx].url}"><button>Learn More</button></a>
        </div>
        <div class="spin-card right">
          <img src="${items[rightIdx].img}" alt="${items[rightIdx].alt}">
          <a class="btn-link" href="${items[rightIdx].url}"><button>Learn More</button></a>
        </div>
      `;
    }

    function renderGenre(){
      genreLabel.textContent = GENRES[genreIndex].name;
      spinIndex = 0;
      renderSpinner();
    }

    function nextItem(){ spinIndex = wrap(spinIndex + 1, GENRES[genreIndex].items.length); renderSpinner(); }
    function prevItem(){ spinIndex = wrap(spinIndex - 1, GENRES[genreIndex].items.length); renderSpinner(); }

    function bindCenterTilt(){
  const center = spinner.querySelector('.spin-card.center');
  if (!center) return;

  const MAX_TILT = 10;   // degrees
  const MAX_Z    = 110;  // px for extra lift

  function onMove(e){
    const rect = center.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top)  / rect.height;  // 0..1
    const rotY = (x - 0.5) * 2 * MAX_TILT;            // -MAX..MAX
    const rotX = (0.5 - y) * 2 * MAX_TILT;

    center.style.transform =
      `translateZ(${MAX_Z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.08)`;
  }

  function onLeave(){
    center.style.transform = `translateZ(80px) rotateX(1deg) scale(1.08)`;
  }

  center.addEventListener('mousemove', onMove);
  center.addEventListener('mouseleave', onLeave);
}


    prevGenreBtn?.addEventListener('click', () => { genreIndex = wrap(genreIndex - 1, GENRES.length); renderGenre(); });
    nextGenreBtn?.addEventListener('click', () => { genreIndex = wrap(genreIndex + 1, GENRES.length); renderGenre(); });
    bindCenterTilt();

    spinNext.addEventListener('click', nextItem);
    spinPrev.addEventListener('click', prevItem);

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') nextItem();
      if (e.key === 'ArrowLeft')  prevItem();
    });

    function startAuto(){ autoTimer = setInterval(nextItem, 4500); }
    function stopAuto(){ clearInterval(autoTimer); autoTimer = null; }
    spinner.addEventListener('mouseenter', stopAuto);
    spinner.addEventListener('mouseleave', startAuto);

    renderGenre();
    startAuto();
  }

});
