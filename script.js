const programme = [
  {name:'RRS Discovery',days:341,segments:[['Science',160],['Passage',35],['Mobilisation',30],['Science',78],['Maintenance',38]]},
  {name:'RRS James Cook',days:326,segments:[['Mobilisation',22],['Science',112],['Passage',49],['Science',104],['Maintenance',39]]},
  {name:'RRS SDA',days:188,segments:[['Maintenance',44],['Science',61],['Passage',28],['Science',39],['Mobilisation',16]]}
];
const activityColors={Science:'#39aa90',Passage:'#f3b547',Mobilisation:'#d74400',Maintenance:'#052b2b'};
const timeline=document.querySelector('#timeline');
programme.forEach(v=>{const row=document.createElement('div');row.className='timeline-row';row.innerHTML=`<div class="timeline-name"><strong>${v.name}</strong><small>${v.days} active days</small></div><div class="timeline-track">${v.segments.map(([n,d])=>`<button class="timeline-segment" style="width:${d/v.days*100}%;background:${activityColors[n]}" data-label="${n} · ${d} days" aria-label="${n}, ${d} days"></button>`).join('')}</div>`;timeline.append(row)});
document.querySelector('#timeline-legend').innerHTML=Object.entries(activityColors).map(([n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join('');

const emissions=[{name:'Vessel operations',value:15356,pct:72,color:'#39aa90'},{name:'Freight movements',value:3412,pct:16,color:'#f3b547'},{name:'Crew travel',value:2560,pct:12,color:'#d74400'}];
const emissionList=document.querySelector('#emission-list'),donut=document.querySelector('#emission-donut'),pie=donut.querySelector('svg');
const polar=(angle,radius=46)=>({x:50+radius*Math.cos(angle),y:50+radius*Math.sin(angle)});
const piePath=(start,end)=>{const outerStart=polar(start),outerEnd=polar(end),innerEnd=polar(end,25),innerStart=polar(start,25),large=end-start>Math.PI?1:0;return `M${outerStart.x} ${outerStart.y} A46 46 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} L${innerEnd.x} ${innerEnd.y} A25 25 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`};
let pieAngle=-Math.PI/2;
const resetEmissions=()=>{
  donut.querySelector('strong').textContent='21.3k';
  donut.querySelector('span').textContent='Tonnes CO₂e';
  emissionList.querySelectorAll('button').forEach(button=>button.classList.remove('active'));
  pie.querySelectorAll('.pie-slice').forEach(slice=>slice.classList.remove('selected','muted'));
};
const selectEmission=index=>{
  const emission=emissions[index];
  emissionList.querySelectorAll('button').forEach((button,i)=>button.classList.toggle('active',i===index));
  pie.querySelectorAll('.pie-slice').forEach((slice,i)=>{slice.classList.toggle('selected',i===index);slice.classList.toggle('muted',i!==index)});
  donut.querySelector('strong').textContent=(emission.value/1000).toFixed(1)+'k';
  donut.querySelector('span').textContent='Tonnes CO₂e';
};
emissions.forEach((emission,index)=>{
  const start=pieAngle,end=start+emission.pct/100*Math.PI*2,mid=(start+end)/2;
  pieAngle=end;
  const slice=document.createElementNS('http://www.w3.org/2000/svg','path');
  slice.setAttribute('d',piePath(start,end));slice.setAttribute('fill',emission.color);slice.setAttribute('tabindex','0');slice.setAttribute('role','button');slice.setAttribute('aria-label',`${emission.name}, ${emission.pct}%`);
  slice.classList.add('pie-slice');slice.style.setProperty('--slice-x',`${Math.cos(mid)*5}px`);slice.style.setProperty('--slice-y',`${Math.sin(mid)*5}px`);
  slice.addEventListener('click',event=>{event.stopPropagation();selectEmission(index)});slice.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectEmission(index)}});pie.append(slice);
  const button=document.createElement('button');button.innerHTML=`<i style="background:${emission.color}"></i><span>${emission.name}</span><b>${emission.pct}%</b>`;button.addEventListener('click',()=>selectEmission(index));emissionList.append(button);
});
donut.addEventListener('click',event=>{if(!event.target.classList.contains('pie-slice'))resetEmissions()});

const vessels=[
  {name:'RRS Discovery',type:'Oceanographic research vessel',description:'Long-range, multidisciplinary science platform with the programme’s highest share of active research days.',days:341,science:238,emissions:'6.9k',detail:'Discovery combines global range with advanced oceanographic capability. Its annual programme spans climate, deep-ocean and ecosystem research.',ports:'8',missions:'15',utilisation:'93%'},
  {name:'RRS James Cook',type:'Deep-sea research vessel',description:'A specialist deep-ocean platform balancing extended science campaigns with longer international passages.',days:326,science:216,emissions:'8.9k',detail:'James Cook supports complex deep-sea expeditions, requiring specialised equipment and a broad international logistics network.',ports:'11',missions:'13',utilisation:'89%'},
  {name:'RRS SDA',type:'Autonomous systems platform',description:'A flexible platform supporting autonomous operations, coastal deployments and rapid programme response.',days:188,science:100,emissions:'5.6k',detail:'SDA provides an agile base for autonomous systems and shorter science campaigns close to operational hubs.',ports:'6',missions:'9',utilisation:'52%'}
];
const tabs=document.querySelector('.vessel-tabs');
function showVessel(i){const v=vessels[i];document.querySelectorAll('.vessel-tabs button').forEach((b,j)=>b.classList.toggle('active',i===j));document.querySelector('#vessel-type').textContent=v.type;document.querySelector('#vessel-name').textContent=v.name;document.querySelector('#vessel-description').textContent=v.description;document.querySelector('#vessel-metrics').innerHTML=`<div><strong>${v.days}</strong><span>ACTIVE DAYS</span></div><div><strong>${v.science}</strong><span>SCIENCE DAYS</span></div><div><strong>${v.emissions}</strong><span>T CO₂E</span></div>`;document.querySelector('.ship-illustration').style.transform=`translateX(${i*4}px)`;document.querySelector('#vessel-more').onclick=()=>openPopover(v)}
vessels.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v.name.replace('RRS ','');b.setAttribute('role','tab');b.onclick=()=>showVessel(i);tabs.append(b)});showVessel(0);
const popover=document.querySelector('#popover'),backdrop=document.querySelector('#popover-backdrop');
function openPopover(v){document.querySelector('#popover-title').textContent=v.name;document.querySelector('#popover-body').textContent=v.detail;document.querySelector('#popover-data').innerHTML=`<div><span>Ports visited</span><b>${v.ports}</b></div><div><span>Missions</span><b>${v.missions}</b></div><div><span>Utilisation</span><b>${v.utilisation}</b></div>`;popover.classList.add('open');backdrop.classList.add('open');popover.setAttribute('aria-hidden','false')}
function closePopover(){popover.classList.remove('open');backdrop.classList.remove('open');popover.setAttribute('aria-hidden','true')}
popover.querySelector('button').onclick=closePopover;backdrop.onclick=closePopover;document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopover()});

const ports=[{name:'Southampton',x:495,y:117,freight:28,people:184,type:'combined'},{name:'Reykjavík',x:443,y:74,freight:12,people:63,type:'people'},{name:'Cape Town',x:593,y:377,freight:22,people:118,type:'combined'},{name:'Punta Arenas',x:292,y:407,freight:19,people:96,type:'freight'},{name:'San Diego',x:122,y:193,freight:16,people:112,type:'people'},{name:'Singapore',x:795,y:272,freight:29,people:158,type:'combined'},{name:'Hobart',x:887,y:393,freight:0,people:111,type:'people'}];
const origin=ports[0],lines=document.querySelector('#route-lines'),nodes=document.querySelector('#route-nodes'),tooltip=document.querySelector('#map-tooltip');
ports.slice(1).forEach((p,i)=>{const type=p.type==='combined'?(i%2?'people':'freight'):p.type;lines.insertAdjacentHTML('beforeend',`<path class="route ${type}" data-type="${type}" d="M${origin.x} ${origin.y} Q${(origin.x+p.x)/2} ${Math.min(origin.y,p.y)-80} ${p.x} ${p.y}"/>`)});
ports.forEach(p=>{const t=p.type==='combined'?'freight':p.type;nodes.insertAdjacentHTML('beforeend',`<circle class="node ${t}" data-type="${p.type}" data-name="${p.name}" data-freight="${p.freight}" data-people="${p.people}" cx="${p.x}" cy="${p.y}" r="7" tabindex="0"/>`)});
function showTip(el){const map=document.querySelector('#world-map').getBoundingClientRect(),rect=el.getBoundingClientRect();tooltip.innerHTML=`<strong>${el.dataset.name}</strong><br>${el.dataset.freight} freight · ${el.dataset.people} journeys`;tooltip.style.display='block';tooltip.style.left=(rect.left-map.left+12)+'px';tooltip.style.top=(rect.top-map.top-40)+'px'}
nodes.querySelectorAll('.node').forEach(n=>{n.addEventListener('mouseenter',()=>showTip(n));n.addEventListener('focus',()=>showTip(n));n.addEventListener('mouseleave',()=>tooltip.style.display='none');n.addEventListener('blur',()=>tooltip.style.display='none')});
document.querySelectorAll('[data-route]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-route]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const mode=btn.dataset.route;document.querySelectorAll('.route,.node').forEach(el=>{const matches=mode==='combined'||el.dataset.type===mode||el.dataset.type==='combined';el.style.opacity=matches?'0.8':'0.08';el.style.pointerEvents=matches?'auto':'none'})});

const ranges=['vessel','freight','travel'];function updateScenario(){ranges.forEach(k=>document.querySelector(`#${k}-output`).textContent=document.querySelector(`#${k}-range`).value+'%');const v=+document.querySelector('#vessel-range').value,f=+document.querySelector('#freight-range').value,t=+document.querySelector('#travel-range').value;const reduction=(v*.72+f*.16+t*.12),saved=Math.round(21328*reduction/100);document.querySelector('#reduction-value').textContent='−'+reduction.toFixed(1)+'%';document.querySelector('#saved-value').textContent=saved.toLocaleString('en-GB');document.querySelector('#result-fill').style.width=Math.min(100,reduction*3.4)+'%'}ranges.forEach(k=>document.querySelector(`#${k}-range`).oninput=updateScenario);document.querySelector('#reset-scenario').onclick=()=>{document.querySelector('#vessel-range').value=0;document.querySelector('#freight-range').value=0;document.querySelector('#travel-range').value=0;updateScenario()};updateScenario();

const sections=[...document.querySelectorAll('.chapter')],navLinks=[...document.querySelectorAll('.chapter-nav a')];
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const activeIndex=sections.indexOf(e.target);navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));document.querySelector('#page-progress').style.height=(activeIndex/(sections.length-1)*100)+'%'}})},{rootMargin:'-35% 0px -55% 0px'});sections.forEach(s=>sectionObserver.observe(s));
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>revealObserver.observe(e));
const programmeStats=document.querySelector('#programme .stat-strip');
if(programmeStats&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const statValues=[...programmeStats.querySelectorAll('strong')].map(el=>({el,value:Number.parseInt(el.textContent,10),suffix:el.textContent.includes('%')?'%':''}));
  statValues.forEach(({el,suffix})=>el.textContent='0'+suffix);
  const statsObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const animationStart=performance.now(),duration=1250,stagger=90;
    const count=now=>{
      let complete=true;
      statValues.forEach(({el,value,suffix},index)=>{
        const progress=Math.max(0,Math.min(1,(now-animationStart-index*stagger)/duration));
        const eased=1-Math.pow(1-progress,4);
        el.textContent=Math.round(value*eased)+suffix;
        if(progress<1)complete=false;
      });
      if(!complete)requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    statsObserver.unobserve(entry.target);
  }),{threshold:.35});
  statsObserver.observe(programmeStats);
}
window.addEventListener('scroll',()=>{document.querySelector('.topbar').classList.toggle('scrolled',scrollY>20)},{passive:true});
const menu=document.querySelector('.menu-button'),nav=document.querySelector('.chapter-nav');menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))};navLinks.forEach(a=>a.onclick=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')});

const parallaxHero=document.querySelector('.hero'),parallaxGlobe=document.querySelector('.globe');
if(parallaxHero&&parallaxGlobe&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let globeFrame=0,globeTargetX=0,globeTargetY=0,globeHovering=false,globeScaleAnimation=null;
  const renderGlobe=()=>{parallaxGlobe.style.setProperty('--globe-x',`${globeTargetX.toFixed(2)}px`);parallaxGlobe.style.setProperty('--globe-y',`${globeTargetY.toFixed(2)}px`);globeFrame=0};
  const queueGlobe=()=>{if(!globeFrame)globeFrame=requestAnimationFrame(renderGlobe)};
  parallaxHero.addEventListener('pointermove',event=>{
    if(event.pointerType&&event.pointerType!=='mouse')return;
    if(globeHovering)return;
    const rect=parallaxGlobe.getBoundingClientRect(),dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2),distance=Math.hypot(dx,dy),range=Math.max(rect.width*2.2,320),strength=Math.max(0,1-distance/range);
    if(!strength){globeTargetX=0;globeTargetY=0}else{const travel=10*strength;globeTargetX=distance?dx/distance*travel:0;globeTargetY=distance?dy/distance*travel:0}
    queueGlobe();
  },{passive:true});
  const currentGlobeScale=()=>getComputedStyle(parallaxGlobe).scale==='none'?'1':getComputedStyle(parallaxGlobe).scale;
  parallaxGlobe.addEventListener('pointerenter',()=>{
    globeHovering=true;
    const start=currentGlobeScale();
    if(globeScaleAnimation)globeScaleAnimation.cancel();
    globeScaleAnimation=parallaxGlobe.animate([{scale:start},{scale:'1.12',offset:.44},{scale:'1.07'}],{duration:650,easing:'cubic-bezier(.2,.82,.24,1)',fill:'forwards'});
  },{passive:true});
  parallaxGlobe.addEventListener('pointerleave',()=>{
    globeHovering=false;
    const start=currentGlobeScale();
    if(globeScaleAnimation)globeScaleAnimation.cancel();
    const release=parallaxGlobe.animate([{scale:start},{scale:'1'}],{duration:920,easing:'cubic-bezier(.16,.82,.18,1)',fill:'forwards'});
    globeScaleAnimation=release;
    release.onfinish=()=>{if(globeScaleAnimation===release){release.cancel();globeScaleAnimation=null}};
  },{passive:true});
  parallaxHero.addEventListener('pointerleave',()=>{globeTargetX=0;globeTargetY=0;queueGlobe()},{passive:true});
}
