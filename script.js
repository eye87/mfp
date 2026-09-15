const programme = [
  {name:'RRS Discovery',days:341,silhouette:'assets/vessels/silhouette-discovery.svg',segments:[['Science',160],['Passage',35],['Mobilisation',30],['Science',78],['Maintenance',38]]},
  {name:'RRS James Cook',days:326,silhouette:'assets/vessels/silhouette-james-cook.svg',segments:[['Mobilisation',22],['Science',112],['Passage',49],['Science',104],['Maintenance',39]]},
  {name:'RRS SDA',days:188,silhouette:'assets/vessels/silhouette-sda.svg',segments:[['Maintenance',44],['Science',61],['Passage',28],['Science',39],['Mobilisation',16]]}
];
const activityColors={Science:'#39aa90',Passage:'#f3b547',Mobilisation:'#d74400',Maintenance:'#052b2b'};
const timeline=document.querySelector('#timeline');
const campaignIds=['campaign-discovery','campaign-cook','campaign-sda'];
timeline.addEventListener('click',event=>{
  const segment=event.target.closest('.timeline-segment');
  if(!segment||!segment.dataset.label.startsWith('Science'))return;
  const row=segment.closest('.timeline-row');
  const index=Array.from(timeline.children).indexOf(row);
  const campaign=document.getElementById(campaignIds[index]);
  if(!campaign)return;
  openCampaign(campaign.id);
});
programme.forEach(v=>{const row=document.createElement('div');const scienceDays=v.segments.reduce((total,[activity,days])=>total+(activity==='Science'?days:0),0);row.className='timeline-row';row.innerHTML=`<div class="timeline-name"><strong>${v.name}</strong><small><span class="active-days">${v.days} active days</span><span class="day-separator">·</span><span class="science-days">${scienceDays} science days</span></small><img class="timeline-ship-silhouette" src="${v.silhouette}" alt="" aria-hidden="true"></div><div class="timeline-track">${v.segments.map(([n,d])=>`<button class="timeline-segment" style="width:${d/v.days*100}%;background:${activityColors[n]}" data-label="${n} · ${d} days" aria-label="${n}, ${d} days"></button>`).join('')}</div>`;timeline.append(row)});
document.querySelector('#timeline-legend').innerHTML=Object.entries(activityColors).map(([n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join('');

const emissions=[{name:'Vessel operations',value:15356,pct:72,color:'#39aa90'},{name:'Freight movements',value:3412,pct:16,color:'#f3b547'},{name:'Crew travel',value:2560,pct:12,color:'#d74400'}];
const emissionList=document.querySelector('#emission-list'),donut=document.querySelector('#emission-donut'),pie=donut.querySelector('svg');
const polar=(angle,radius=46)=>({x:50+radius*Math.cos(angle),y:50+radius*Math.sin(angle)});
const piePath=(start,end,innerRadius=25,outerRadius=46)=>{const outerStart=polar(start,outerRadius),outerEnd=polar(end,outerRadius),innerEnd=polar(end,innerRadius),innerStart=polar(start,innerRadius),large=end-start>Math.PI?1:0;return `M${outerStart.x} ${outerStart.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} L${innerEnd.x} ${innerEnd.y} A${innerRadius} ${innerRadius} 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`};
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
  const start=pieAngle,end=start+emission.pct/100*Math.PI*2;
  pieAngle=end;
  const slice=document.createElementNS('http://www.w3.org/2000/svg','g'),base=document.createElementNS('http://www.w3.org/2000/svg','path'),pop=document.createElementNS('http://www.w3.org/2000/svg','path');
  slice.classList.add('pie-slice');slice.setAttribute('tabindex','0');slice.setAttribute('role','button');slice.setAttribute('aria-label',`${emission.name}, ${emission.pct}%`);
  base.classList.add('pie-slice-base');base.setAttribute('d',piePath(start,end));base.setAttribute('fill',emission.color);
  pop.classList.add('pie-slice-pop');pop.setAttribute('d',piePath(start,end,44.5,49));pop.setAttribute('fill',emission.color);
  slice.append(base,pop);
  slice.addEventListener('click',event=>{event.stopPropagation();selectEmission(index)});slice.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectEmission(index)}});pie.append(slice);
  const button=document.createElement('button');button.innerHTML=`<i style="background:${emission.color}"></i><span>${emission.name}</span><b>${emission.pct}%</b>`;button.addEventListener('click',()=>selectEmission(index));emissionList.append(button);
});
donut.addEventListener('click',event=>{if(!event.target.classList.contains('pie-slice'))resetEmissions()});

const vesselYearRange=document.querySelector('#vessel-year-range');
const vesselYearControl=document.querySelector('.vessel-year-control');
const vesselYearTooltip=document.querySelector('#vessel-year-tooltip');
let vesselYearTimer=null;
const routeVessels=[
  {route:document.querySelector('#discovery-route'),ship:document.querySelector('#discovery-ship'),offset:0},
  {route:document.querySelector('#cook-route'),ship:document.querySelector('#cook-ship'),offset:.08},
  {route:document.querySelector('#sda-route'),ship:document.querySelector('#sda-ship'),offset:.16}
];
function updateVesselPositions(){
  const day=Number(vesselYearRange.value),progress=day/364;
  routeVessels.forEach(({route,ship,offset})=>{
    const length=route.getTotalLength(),position=(progress+offset)%1*length;
    const point=route.getPointAtLength(position);
    route.style.strokeDasharray=`${position} ${Math.max(0,length-position)}`;
    ship.setAttribute('transform',`translate(${point.x} ${point.y})`);
  });
  const date=new Date(Date.UTC(2025,0,1+day));
  vesselYearTooltip.textContent=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
  vesselYearControl.style.setProperty('--tooltip-position',`${Math.max(3,Math.min(97,progress*100))}%`);
}
vesselYearRange.addEventListener('input',updateVesselPositions);
function setVesselAutoplay(playing){
  if(vesselYearTimer){clearInterval(vesselYearTimer);vesselYearTimer=null}
  if(playing)vesselYearTimer=setInterval(()=>{vesselYearRange.value=(Number(vesselYearRange.value)+1)%365;updateVesselPositions()},70);
}
vesselYearRange.addEventListener('pointerdown',()=>{setVesselAutoplay(false);vesselYearControl.classList.add('dragging')});
vesselYearRange.addEventListener('pointerup',()=>{vesselYearControl.classList.remove('dragging');setVesselAutoplay(true)});
vesselYearRange.addEventListener('pointercancel',()=>{vesselYearControl.classList.remove('dragging');setVesselAutoplay(true)});
vesselYearRange.addEventListener('focus',()=>setVesselAutoplay(false));
vesselYearRange.addEventListener('blur',()=>setVesselAutoplay(true));
updateVesselPositions();
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setVesselAutoplay(true);

const vessels=[
  {name:'RRS Discovery',type:'Oceanographic research vessel',description:'Long-range, multidisciplinary science platform with the programme’s highest share of active research days.',days:341,science:238,emissions:'6.9k',detail:'Discovery combines global range with advanced oceanographic capability. Its annual programme spans climate, deep-ocean and ecosystem research.',ports:'8',missions:'15',utilisation:'93%',image:'assets/vessels/rrs-discovery-generated.png',alt:'Illustrative representation of RRS Discovery at sea'},
  {name:'RRS James Cook',type:'Deep-sea research vessel',description:'A specialist deep-ocean platform balancing extended science campaigns with longer international passages.',days:326,science:216,emissions:'8.9k',detail:'James Cook supports complex deep-sea expeditions, requiring specialised equipment and a broad international logistics network.',ports:'11',missions:'13',utilisation:'89%',image:'assets/vessels/rrs-james-cook-generated.png',alt:'Illustrative representation of RRS James Cook at sea'},
  {name:'RRS SDA',type:'Polar research vessel',description:'A flexible polar platform supporting multidisciplinary science, autonomous operations and extended missions in challenging environments.',days:188,science:100,emissions:'5.6k',detail:'The Sir David Attenborough provides a capable base for polar science, autonomous systems and long-duration campaigns.',ports:'6',missions:'9',utilisation:'52%',image:'assets/vessels/rrs-sda-generated.png',alt:'Illustrative representation of RRS Sir David Attenborough in polar waters'}
];
const tabs=document.querySelector('.vessel-tabs');
function showVessel(i){const v=vessels[i],image=document.querySelector('#vessel-image');document.querySelectorAll('.vessel-tabs button').forEach((b,j)=>b.classList.toggle('active',i===j));document.querySelector('#vessel-type').textContent=v.type;document.querySelector('#vessel-name').textContent=v.name;document.querySelector('#vessel-description').textContent=v.description;document.querySelector('#vessel-metrics').innerHTML=`<div><strong>${v.days}</strong><span>ACTIVE DAYS</span></div><div><strong>${v.science}</strong><span>SCIENCE DAYS</span></div><div><strong>${v.emissions}</strong><span>T CO₂E</span></div>`;image.src=v.image;image.alt=v.alt;document.querySelector('#vessel-more').onclick=()=>openPopover(v)}
vessels.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v.name.replace('RRS ','');b.setAttribute('role','tab');b.onclick=()=>showVessel(i);tabs.append(b)});showVessel(0);
const popover=document.querySelector('#popover'),backdrop=document.querySelector('#popover-backdrop');
document.querySelectorAll('[data-campaign]').forEach(button=>button.addEventListener('click',()=>openCampaign(button.dataset.campaign)));
function openCampaign(id){
  const template=document.getElementById(id),card=template.closest('article');
  openPopover({name:card.querySelector('h4').textContent,detail:card.querySelector('h4 + p').textContent,ports:'',missions:'',utilisation:''});
  popover.classList.add('campaign-panel');
  popover.querySelector('.kicker').textContent=card.querySelector('.kicker').textContent;
  const content=document.createElement('div');content.className='campaign-content';
  content.append(template.content.cloneNode(true));
  document.querySelector('#popover-data').replaceChildren(content);
}
let panelTrigger;
function openPopover(v){panelTrigger=document.activeElement;popover.classList.remove('campaign-panel');popover.querySelector('.kicker').textContent='Vessel profile';document.querySelector('#popover-title').textContent=v.name;document.querySelector('#popover-body').textContent=v.detail;document.querySelector('#popover-data').innerHTML=`<div><span>Ports visited</span><b>${v.ports}</b></div><div><span>Missions</span><b>${v.missions}</b></div><div><span>Utilisation</span><b>${v.utilisation}</b></div>`;popover.classList.add('open');backdrop.classList.add('open');popover.setAttribute('aria-hidden','false');popover.setAttribute('aria-labelledby','popover-title');popover.scrollTop=0;popover.querySelector('button').focus()}
function closePopover(){popover.classList.remove('open');backdrop.classList.remove('open');popover.setAttribute('aria-hidden','true');panelTrigger?.focus({preventScroll:true})}
popover.querySelector('button').onclick=closePopover;backdrop.onclick=closePopover;document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopover()});

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
