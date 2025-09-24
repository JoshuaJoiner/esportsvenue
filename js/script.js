// Basic single-file interactive prototype logic

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const screens = {
    dashboard: document.getElementById('screen-dashboard'),
    schedule: document.getElementById('screen-schedule'),
    seating: document.getElementById('screen-seating'),
    analytics: document.getElementById('screen-analytics')
  };
  const navButtons = document.querySelectorAll('.nav-btn');
  function show(screenKey){
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenKey].classList.remove('hidden');
    navButtons.forEach(b => b.classList.remove('active'));
    document.getElementById('nav-' + screenKey).classList.add('active');
  }
  document.getElementById('nav-dashboard').addEventListener('click', () => show('dashboard'));
  document.getElementById('nav-schedule').addEventListener('click', () => show('schedule'));
  document.getElementById('nav-seating').addEventListener('click', () => show('seating'));
  document.getElementById('nav-analytics').addEventListener('click', () => show('analytics'));

  // Demo data
  const teams = ['Apex Lions','Blue Circuit','Crimson Fox','DuneRiders','Echo Clan','Frostbyte'];
  const attendees = Array.from({length: 40}, (_,i) => `Fan ${i+1}`);

  // Populate team pool
  const teamPool = document.getElementById('team-pool');
  teams.forEach((t,idx) => {
    const el = createDraggable(t, 'team');
    el.id = 'team-'+idx;
    teamPool.appendChild(el);
  });

  // Create schedule slots
  const slotsContainer = document.getElementById('slots');
  for(let i=0;i<6;i++){
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.slot = i;
    slot.tabIndex = 0;
    slot.innerHTML = `<strong>Slot ${i+1}</strong><div class="slot-content"></div>`;
    slotsContainer.appendChild(slot);
  }

  // Attendee pool
  const attendeePool = document.getElementById('attendee-pool');
  attendees.forEach((a, i) => {
    const el = createDraggable(a, 'attendee');
    el.id = 'att-'+i;
    attendeePool.appendChild(el);
  });

  // Seating map: grid of seats
  const seatingMap = document.getElementById('seating-map');
  // default 5 rows x 10 cols = 50 seats (responsive will show fewer on mobile)
  for(let s=0;s<50;s++){
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.dataset.seatId = s;
    seat.textContent = 'Empty';
    seat.addEventListener('dragover', allowDrop);
    seat.addEventListener('drop', dropSeat);
    seatingMap.appendChild(seat);
  }

  // Drag & drop handlers for team items and attendees
  function createDraggable(label, type){
    const el = document.createElement('div');
    el.className = (type === 'team' ? 'team-item' : 'seat-item');
    el.textContent = label;
    el.draggable = true;
    el.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', JSON.stringify({id: el.id || null, label, type}));
    });
    return el;
  }

  function allowDrop(ev){ ev.preventDefault(); }
  function dropSeat(ev){
    ev.preventDefault();
    const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
    const seat = ev.currentTarget;
    seat.textContent = data.label;
    seat.setAttribute('aria-label', `Seat ${seat.dataset.seatId} occupied by ${data.label}`);
    updateOccupancy();
  }

  // Schedule slots accept teams
  document.querySelectorAll('.slot').forEach(slot => {
    slot.addEventListener('dragover', allowDrop);
    slot.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
      if(data.type === 'team'){
        const content = slot.querySelector('.slot-content');
        content.textContent = data.label;
        document.getElementById('next-match').textContent = data.label + ' (scheduled)';
      }
    });
  });

  // Attendee pool items accept drop back (for removing)
  attendeePool.addEventListener('dragover', allowDrop);
  attendeePool.addEventListener('drop', (ev) => {
    ev.preventDefault();
    // optionally allow re-adding from seats (not necessary for demo)
  });

  // Auto-fill seats with attendees (demo)
  document.getElementById('auto-fill').addEventListener('click', () => {
    const seats = document.querySelectorAll('.seat');
    const pool = Array.from(document.querySelectorAll('#attendee-pool .seat-item'));
    // if attendee pool contains dragged elements, the pool might be empty; fallback to demo names
    let names = pool.length ? pool.map(n => n.textContent) : attendees.slice();
    let i = 0;
    seats.forEach(seat => {
      if(seat.textContent === 'Empty' && i < names.length){
        seat.textContent = names[i++];
      }
    });
    updateOccupancy();
  });

  // Reset demo
  document.getElementById('btn-reset').addEventListener('click', () => location.reload());

  // Occupancy widget
  function updateOccupancy(){
    const occupied = Array.from(document.querySelectorAll('.seat')).filter(s => s.textContent !== 'Empty').length;
    document.getElementById('occupancy').textContent = `${occupied} / 500`;
    document.getElementById('streams').textContent = Math.min(3, Math.ceil(occupied / 150)); // fake
  }

  // Initialize charts
  function initCharts(){
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const attendanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['-6d','-5d','-4d','-3d','-2d','-1d','Today'],
        datasets: [{
          label: 'Attendance',
          data: [120, 230, 180, 300, 250, 400, 380],
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });

    const ctx2 = document.getElementById('sponsorChart').getContext('2d');
    const sponsorChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Main','Stage','HUD','Kiosk'],
        datasets: [{ label:'Impressions', data:[4000, 2600, 1800, 900] }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}} }
    });
  }

  initCharts();
  updateOccupancy();
});

