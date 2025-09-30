// Teams & slots
const teams = ['Apex Lions','Blue Circuit','Crimson Fox','DuneRiders','Echo Clan','Frostbyte'];
const teamPool = document.getElementById('team-pool');
teams.forEach((t)=>{
  const el = document.createElement('div'); el.className='draggable-item'; el.textContent=t; el.draggable=true;
  el.addEventListener('dragstart', ev=>ev.dataTransfer.setData('text/plain', t));
  teamPool.appendChild(el);
});

const slots = document.getElementById('slots');
for(let i=0;i<6;i++){
  const slot = document.createElement('div'); slot.className='slot'; slot.innerHTML=`<strong>Slot ${i+1}</strong>`;
  slot.addEventListener('dragover', ev=>ev.preventDefault());
  slot.addEventListener('drop', ev=>{ ev.preventDefault(); slot.innerHTML=`<strong>Slot ${i+1}</strong> <div>${ev.dataTransfer.getData('text/plain')}</div>`; });
  slots.appendChild(slot);
} 