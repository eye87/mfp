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
programme.forEach(v=>{const row=document.createElement('div');const scienceDays=v.segments.reduce((total,[activity,days])=>total+(activity==='Science'?days:0),0);row.className='timeline-row';row.innerHTML=`<div class="timeline-name"><strong>${v.name}</strong><img class="timeline-ship-silhouette" src="${v.silhouette}" alt="" aria-hidden="true"><small><span class="active-days">${v.days} active days</span><span class="day-separator">·</span><span class="science-days">${scienceDays} science days</span></small></div><div class="timeline-track">${v.segments.map(([n,d])=>`<button class="timeline-segment" style="width:${d/v.days*100}%;background:${activityColors[n]}" data-label="${n} · ${d} days" aria-label="${n}, ${d} days"></button>`).join('')}</div>`;timeline.append(row)});
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
const oceanYearRange=document.querySelector('#ocean-year-range');
const oceanYearLabel=document.querySelector('#ocean-year-label');
const oceanActiveCount=document.querySelector('#ocean-active-count');
const oceanActiveDate=document.querySelector('#ocean-active-date');
const oceanFeatureName=document.querySelector('#ocean-feature-name');
const oceanFeatureVessel=document.querySelector('#ocean-feature-vessel');
const oceanFeatureImage=document.querySelector('#ocean-feature-image');
const oceanMapCanvas=document.querySelector('#ocean-map-canvas');
const oceanMapPopup=document.querySelector('#ocean-map-popup');
const oceanPopupClose=document.querySelector('#ocean-popup-close');
const oceanPlaybackToggle=document.querySelector('#ocean-playback-toggle');
const oceanPlaybackLabel=document.querySelector('#ocean-playback-label');
let vesselYearFrame=null,vesselYearPreviousTime=null;
const activityPointLayer=document.querySelector('#activity-points');
const oceanActivityPointLayer=document.querySelector('#ocean-activity-points');
const researchActivities=[
  {name:'North Atlantic carbon survey',vessel:'Discovery',x:505,y:165,start:0,end:58,color:'#39aa90'},
  {name:'Southern Ocean monitoring',vessel:'Attenborough',x:663,y:465,start:46,end:82,color:'#052b2b'},
  {name:'Eastern Pacific sampling',vessel:'James Cook',x:204,y:285,start:40,end:108,color:'#d74400'},
  {name:'Indonesian seas campaign',vessel:'Discovery',x:1012,y:315,start:59,end:150,color:'#39aa90'},
  {name:'Greenland margin survey',vessel:'Attenborough',x:489,y:105,start:90,end:150,color:'#052b2b'},
  {name:'Mediterranean observations',vessel:'James Cook',x:625,y:214,start:121,end:196,color:'#d74400'},
  {name:'Western Indian Ocean survey',vessel:'Attenborough',x:790,y:330,start:151,end:235,color:'#052b2b'},
  {name:'High Arctic campaign',vessel:'Attenborough',x:632,y:60,start:236,end:258,color:'#052b2b'},
  {name:'Cape region ecosystem study',vessel:'James Cook',x:700,y:478,start:212,end:273,color:'#d74400'},
  {name:'Western Pacific transect',vessel:'Discovery',x:1075,y:255,start:243,end:319,color:'#39aa90'},
  {name:'South Atlantic habitat survey',vessel:'James Cook',x:537,y:390,start:274,end:349,color:'#d74400'},
  {name:'Patagonian shelf observations',vessel:'Attenborough',x:426,y:450,start:305,end:364,color:'#052b2b'},
  {name:'Equatorial Atlantic sampling',vessel:'Discovery',x:490,y:320,start:334,end:364,color:'#39aa90'},
  {name:'Equatorial Atlantic sampling',vessel:'Attenborough',x:490,y:320,start:0,end:45,color:'#052b2b'}
];
researchActivities.forEach(activity=>{
  const point=document.createElementNS('http://www.w3.org/2000/svg','circle');
  point.classList.add('activity-point');
  point.setAttribute('cx',activity.x);point.setAttribute('cy',activity.y);point.setAttribute('r','10');
  point.setAttribute('fill',activity.color);point.setAttribute('role','img');
  point.setAttribute('aria-label',`${activity.name}, ${activity.vessel}`);
  const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=`${activity.name} · RRS ${activity.vessel}`;
  point.append(title);activity.point=point;activityPointLayer.append(point);

  const oceanPoint=document.createElementNS('http://www.w3.org/2000/svg','circle');
  const oceanColors={Discovery:'#39aa90','James Cook':'#ff6a35',Attenborough:'#052b2b'};
  oceanPoint.classList.add('ocean-activity-point');
  oceanPoint.setAttribute('cx',activity.x);oceanPoint.setAttribute('cy',activity.y);oceanPoint.setAttribute('r','8');
  oceanPoint.setAttribute('fill',oceanColors[activity.vessel]);oceanPoint.setAttribute('role','button');oceanPoint.setAttribute('tabindex','0');
  oceanPoint.setAttribute('aria-label',`${activity.name}, RRS ${activity.vessel}`);
  const oceanTitle=document.createElementNS('http://www.w3.org/2000/svg','title');oceanTitle.textContent=`${activity.name} · RRS ${activity.vessel}`;
  oceanPoint.append(oceanTitle);activity.oceanPoint=oceanPoint;oceanActivityPointLayer.append(oceanPoint);
});
const activityIsLive=(activity,day)=>activity.start<=activity.end?(day>=activity.start&&day<=activity.end):(day>=activity.start||day<=activity.end);
let selectedOceanActivity=null;
const oceanVesselImages={
  Discovery:'assets/vessels/rrs-discovery-generated.png',
  'James Cook':'assets/vessels/rrs-james-cook-generated.png',
  Attenborough:'assets/vessels/rrs-sda-generated.png'
};
function positionOceanPopup(activity){
  const pointRect=activity.oceanPoint.getBoundingClientRect(),canvasRect=oceanMapCanvas.getBoundingClientRect();
  const pointX=pointRect.left+pointRect.width/2-canvasRect.left,pointY=pointRect.top+pointRect.height/2-canvasRect.top;
  const margin=12,halfWidth=oceanMapPopup.offsetWidth/2;
  oceanMapPopup.style.left=`${Math.max(halfWidth+margin,Math.min(canvasRect.width-halfWidth-margin,pointX))}px`;
  oceanMapPopup.style.top=`${pointY}px`;
  oceanMapPopup.classList.toggle('is-below',pointY-oceanMapPopup.offsetHeight-14<margin);
}
function closeOceanPopup(){
  selectedOceanActivity=null;
  researchActivities.forEach(item=>item.oceanPoint.classList.remove('selected'));
  oceanMapPopup.hidden=true;
}
function selectOceanActivity(activity){
  selectedOceanActivity=activity;
  researchActivities.forEach(item=>item.oceanPoint.classList.toggle('selected',item===activity));
  oceanFeatureName.textContent=activity.name;
  oceanFeatureVessel.textContent=`RRS ${activity.vessel}`;
  oceanFeatureImage.src=oceanVesselImages[activity.vessel];
  oceanFeatureImage.alt=`RRS ${activity.vessel}`;
  oceanMapPopup.hidden=false;
  positionOceanPopup(activity);
}
researchActivities.forEach(activity=>{
  const toggleActivity=()=>{if(selectedOceanActivity===activity&&!oceanMapPopup.hidden)closeOceanPopup();else selectOceanActivity(activity)};
  activity.oceanPoint.addEventListener('click',toggleActivity);
  activity.oceanPoint.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleActivity()}});
});
oceanPopupClose.addEventListener('click',closeOceanPopup);
oceanMapCanvas.addEventListener('click',event=>{if(!event.target.closest('.ocean-activity-point')&&!event.target.closest('.ocean-map-popup'))closeOceanPopup()});
window.addEventListener('resize',()=>{if(selectedOceanActivity)positionOceanPopup(selectedOceanActivity)});
// Illustrative water-only connections, sampled against the map's land silhouette.
const attenboroughRoutes=[{"start":46,"d":"M488,320L544,376L544,428L608,492L640,492L644,488L648,488L664,472L664,464"},{"start":90,"d":"M664,464L664,472L648,488L644,488L640,492L608,492L604,488L604,480L600,476L600,468L596,464L596,456L592,452L592,440L588,436L588,432L584,428L584,412L496,324L496,320L492,316L492,312L480,300L480,120L484,116L484,108L488,104"},{"start":151,"d":"M488,104L488,240L484,244L484,276L480,280L480,300L492,312L492,316L496,320L496,324L584,412L584,428L588,432L588,436L592,440L592,452L596,456L596,464L600,468L600,476L604,480L604,488L608,492L640,492L644,488L648,488L692,444L692,432L696,428L696,408L768,336L772,336L776,332L784,332L788,328"},{"start":236,"d":"M788,328L776,328L696,408L696,428L692,432L692,444L648,488L644,488L640,492L608,492L604,488L604,480L600,476L600,468L596,464L596,456L592,452L592,440L588,436L588,432L584,428L584,412L496,324L496,320L492,316L492,312L480,300L480,280L484,276L484,244L492,236L492,232L508,216L508,212L512,208L512,180L516,176L516,120L532,104L536,104L540,100L548,100L552,96L556,96L560,92L564,92L588,68L592,68L596,64L620,64L624,60L632,60"},{"start":305,"d":"M632,60L624,60L620,64L596,64L592,68L588,68L552,104L536,104L532,108L528,108L516,120L516,176L512,180L512,208L508,212L508,216L492,232L492,236L484,244L484,276L480,280L480,328L476,332L476,336L472,340L472,344L468,348L468,352L464,356L464,364L460,368L460,372L456,376L456,380L452,384L452,388L448,392L448,396L444,400L444,408L440,412L440,416L436,420L436,424L432,428L432,432L428,436L428,440L424,444L424,448"},{"start":0,"d":"M424,448L428,444L428,440L440,428L440,424L444,420L444,416L448,412L448,404L452,400L452,396L456,392L456,388L460,384L460,380L464,376L464,372L468,368L468,360L472,356L472,352L476,348L476,344L480,340L480,336L484,332L484,328L488,324L488,320"}];
const routeNS='http://www.w3.org/2000/svg';
const attenboroughLayer=document.createElementNS(routeNS,'g');
attenboroughLayer.classList.add('attenborough-journey');
attenboroughLayer.setAttribute('aria-hidden','true');
const journeyDefs=document.createElementNS(routeNS,'defs');
const journeyMask=document.createElementNS(routeNS,'mask');
journeyMask.id='attenborough-journey-mask';
journeyMask.setAttribute('maskUnits','userSpaceOnUse');
journeyMask.setAttribute('x','0');journeyMask.setAttribute('y','0');
journeyMask.setAttribute('width','1200');journeyMask.setAttribute('height','600');
const journeyReveal=document.createElementNS(routeNS,'path');
journeyReveal.setAttribute('fill','none');journeyReveal.setAttribute('stroke','white');
journeyReveal.setAttribute('stroke-width','8');
journeyMask.append(journeyReveal);journeyDefs.append(journeyMask);
const journeyLine=document.createElementNS(routeNS,'path');
journeyLine.classList.add('attenborough-journey-line');
journeyLine.setAttribute('mask','url(#attenborough-journey-mask)');
attenboroughLayer.append(journeyDefs,journeyLine);
oceanActivityPointLayer.before(attenboroughLayer);
let currentAttenboroughRoute=null,attenboroughRouteLength=0;
function updateAttenboroughJourney(day){
  const route=[...attenboroughRoutes].sort((a,b)=>b.start-a.start).find(route=>day>=route.start);
  if(route!==currentAttenboroughRoute){
    currentAttenboroughRoute=route;
    journeyLine.setAttribute('d',route.d);journeyReveal.setAttribute('d',route.d);
    attenboroughRouteLength=journeyLine.getTotalLength();
  }
  const elapsed=Math.max(0,day-route.start);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // First draw towards the destination, then erase from the departure point.
  const head=reducedMotion?1:Math.min(1,elapsed/14);
  const tail=reducedMotion?0:Math.max(0,Math.min(1,(elapsed-14)/14));
  journeyReveal.setAttribute('stroke-dasharray',`${attenboroughRouteLength*(head-tail)} ${attenboroughRouteLength+1}`);
  journeyReveal.setAttribute('stroke-dashoffset',String(-attenboroughRouteLength*tail));
}
const otherVesselRoutes={"Discovery":[{"start":0,"d":"M490,320L490,308L486,304L486,290L484,288L484,206L486,204L486,202L490,198L490,194L492,192L492,190L494,188L494,184L496,182L496,180L498,178L498,176L500,174L500,172L502,170L502,166L504,164"},{"start":59,"d":"M504,164L504,232L494,242L494,246L490,250L490,254L486,258L486,284L484,286L484,288L486,290L486,296L498,308L498,312L500,314L500,316L588,404L588,420L590,422L590,426L592,428L592,430L594,432L594,434L596,436L596,438L598,440L598,454L600,456L600,458L602,460L602,462L604,464L604,466L606,468L606,470L608,472L608,480L610,482L610,486L612,488L630,488L632,486L636,486L638,484L640,484L642,482L644,482L646,480L648,480L650,478L652,478L654,476L658,476L660,474L662,474L664,472L666,472L668,470L670,470L672,468L674,468L676,466L680,466L682,464L684,464L686,462L688,462L690,460L692,460L694,458L696,458L698,456L702,456L704,454L706,454L708,452L710,452L712,450L714,450L716,448L720,448L722,446L724,446L726,444L728,444L730,442L732,442L734,440L736,440L738,438L740,438L742,436L746,436L748,434L750,434L752,432L754,432L756,430L758,430L760,428L762,428L764,426L768,426L770,424L772,424L774,422L776,422L778,420L780,420L782,418L784,418L786,416L790,416L792,414L794,414L796,412L798,412L800,410L802,410L804,408L806,408L808,406L812,406L814,404L816,404L818,402L820,402L822,400L824,400L826,398L828,398L830,396L834,396L836,394L838,394L840,392L842,392L844,390L846,390L848,388L850,388L852,386L854,386L856,384L860,384L862,382L864,382L866,380L868,380L870,378L872,378L874,376L876,376L878,374L882,374L884,372L922,372L930,364L962,364L972,354L972,352L974,350L974,344L992,326L994,326L1002,318L1004,318L1006,316L1010,316L1012,314"},{"start":243,"d":"M1012,314L1070,256L1072,256L1074,254"},{"start":334,"d":"M1074,254L1068,254L1062,260L1060,260L982,338L980,338L968,350L968,352L964,356L964,362L962,364L930,364L922,372L918,372L886,404L758,404L712,450L710,450L708,452L674,452L646,480L644,480L640,484L636,484L634,486L622,486L620,488L612,488L528,404L528,402L526,400L526,398L524,396L524,394L522,392L522,390L520,388L520,384L518,382L518,380L516,378L516,376L514,374L514,372L512,370L512,368L510,366L510,362L508,360L508,358L506,356L506,354L504,352L504,350L502,348L502,346L500,344L500,340L498,338L498,336L496,334L496,332L494,330L494,328L492,326L492,322L490,320"}],"James Cook":[{"start":40,"d":"M536,390L532,390L352,570L344,570L342,568L336,568L334,566L332,566L320,554L320,552L314,546L314,544L312,542L312,538L310,536L310,522L308,520L308,518L306,516L306,506L304,504L304,502L302,500L302,498L300,496L300,494L298,492L298,490L296,488L296,484L294,482L294,480L292,478L292,476L290,474L290,472L288,470L288,468L286,466L286,462L284,460L284,458L282,456L282,454L280,452L280,450L278,448L278,446L276,444L276,442L274,440L274,436L272,434L272,432L270,430L270,428L268,426L268,424L266,422L266,420L264,418L264,414L262,412L262,410L260,408L260,406L258,404L258,402L256,400L256,398L254,396L254,392L252,390L252,388L250,386L250,384L248,382L248,380L246,378L246,376L244,374L244,370L242,368L242,366L240,364L240,362L238,360L238,358L236,356L236,354L234,352L234,348L232,346L232,344L230,342L230,340L228,338L228,336L226,334L226,332L224,330L224,326L222,324L222,322L220,320L220,318L218,316L218,314L216,312L216,310L214,308L214,304L212,302L212,300L210,298L210,296L208,294L208,292L206,290L206,286L204,284"},{"start":121,"d":"M204,284L206,286L206,288L210,292L210,344L256,390L256,392L300,436L300,458L302,460L302,500L304,502L304,504L306,506L306,516L308,518L308,520L310,522L310,536L312,538L312,542L314,544L314,546L320,552L320,554L332,566L334,566L336,568L342,568L344,570L352,570L484,438L484,286L486,284L486,258L490,254L490,250L494,246L494,242L514,222L514,216L528,202L544,202L548,198L552,198L554,196L566,196L568,194L588,194L590,196L592,196L594,198L596,198L598,200L600,200L602,202L606,202L608,204L610,204L612,206L614,206L616,208L618,208L620,210L624,210L626,212"},{"start":212,"d":"M626,212L624,210L612,210L610,208L598,208L584,194L568,194L566,196L554,196L552,198L548,198L544,202L528,202L514,216L514,222L494,242L494,246L490,250L490,254L486,258L486,284L484,286L484,288L486,290L486,296L498,308L498,312L500,314L500,316L588,404L588,420L590,422L590,426L592,428L592,430L594,432L594,434L596,436L596,438L598,440L598,454L600,456L600,458L602,460L602,462L604,464L604,466L606,468L606,470L608,472L608,480L610,482L610,486L612,488L680,488L682,486L684,486L686,484L688,484L690,482L692,482L694,480L698,480L700,478"},{"start":274,"d":"M700,478L688,478L684,482L670,482L668,484L636,484L634,486L622,486L620,488L612,488L590,466L590,460L548,418L548,416L546,414L546,410L544,408L544,406L542,404L542,402L540,400L540,398L538,396L538,392L536,390"}]};
const otherJourneys=Object.entries(otherVesselRoutes).map(([vessel,routes],index)=>{
  const layer=document.createElementNS(routeNS,'g');
  layer.classList.add('attenborough-journey');
  layer.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(routeNS,'defs');
  const mask=document.createElementNS(routeNS,'mask');
  const id='fleet-journey-'+index;
  mask.id=id;mask.setAttribute('maskUnits','userSpaceOnUse');
  mask.setAttribute('x','0');mask.setAttribute('y','0');mask.setAttribute('width','1200');mask.setAttribute('height','600');
  const reveal=document.createElementNS(routeNS,'path');
  reveal.setAttribute('fill','none');reveal.setAttribute('stroke','white');reveal.setAttribute('stroke-width','8');
  mask.append(reveal);defs.append(mask);
  // The simplified atlas closes some narrow straits: never paint on its land pixels.
  const water=document.createElementNS(routeNS,'mask');
  water.id=id+'-water';water.setAttribute('maskUnits','userSpaceOnUse');
  water.setAttribute('x','0');water.setAttribute('y','0');water.setAttribute('width','1200');water.setAttribute('height','600');
  const sea=document.createElementNS(routeNS,'rect');
  sea.setAttribute('width','1200');sea.setAttribute('height','600');sea.setAttribute('fill','white');
  const land=document.createElementNS(routeNS,'image');
  land.setAttribute('href','assets/maps/world-map.svg');land.setAttribute('x','30');land.setAttribute('y','30');
  land.setAttribute('width','1140');land.setAttribute('height','540');land.setAttribute('preserveAspectRatio','xMidYMid meet');
  land.style.filter='brightness(0)';
  water.append(sea,land);defs.append(water);
  const clip=document.createElementNS(routeNS,'g');clip.setAttribute('mask','url(#'+water.id+')');
  const line=document.createElementNS(routeNS,'path');
  line.classList.add('attenborough-journey-line');
  line.style.stroke=vessel==='Discovery'?'#39aa90':'#ff6a35';
  line.setAttribute('mask','url(#'+id+')');clip.append(line);layer.append(defs,clip);
  oceanActivityPointLayer.before(layer);
  return {routes:routes.sort((a,b)=>b.start-a.start),layer,line,reveal,current:null,length:0};
});
function updateOtherJourneys(day){
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  otherJourneys.forEach(journey=>{
    const route=journey.routes.find(route=>day>=route.start);
    journey.layer.style.display=route?'':'none';
    if(!route)return;
    if(journey.current!==route){
      journey.current=route;journey.line.setAttribute('d',route.d);journey.reveal.setAttribute('d',route.d);
      journey.length=journey.line.getTotalLength();
    }
    const elapsed=day-route.start,head=reduced?1:Math.min(1,elapsed/14),tail=reduced?0:Math.max(0,Math.min(1,(elapsed-14)/14));
    journey.reveal.setAttribute('stroke-dasharray',`${journey.length*(head-tail)} ${journey.length+1}`);
    journey.reveal.setAttribute('stroke-dashoffset',String(-journey.length*tail));
  });
}
function updateVesselPositions(){
  const day=Number(vesselYearRange.value),progress=day/364;
  updateAttenboroughJourney(day);
  updateOtherJourneys(day);
  const date=new Date(Date.UTC(2025,0,1+day));
  const formattedDate=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(date);
  const activeActivities=researchActivities.filter(activity=>activityIsLive(activity,day));
  researchActivities.forEach(activity=>activity.point.classList.toggle('active',activeActivities.includes(activity)));
  researchActivities.forEach(activity=>activity.oceanPoint.classList.toggle('active',activeActivities.includes(activity)));
  if(selectedOceanActivity&&!activeActivities.includes(selectedOceanActivity))closeOceanPopup();
  activityPointLayer.setAttribute('aria-label',`${activeActivities.length} active research locations in ${formattedDate}`);
  oceanActivityPointLayer.setAttribute('aria-label',`${activeActivities.length} active research locations in ${formattedDate}`);
  vesselYearTooltip.textContent=formattedDate;
  vesselYearRange.style.setProperty('--range-progress',`${progress*100}%`);
  vesselYearControl.style.setProperty('--tooltip-position',`${Math.max(3,Math.min(97,progress*100))}%`);
  oceanYearRange.value=day;
  oceanYearRange.style.setProperty('--range-progress',`${progress*100}%`);
  oceanYearLabel.textContent=new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(date).toUpperCase();
  oceanActiveDate.textContent=formattedDate;
  oceanActiveCount.textContent=`${activeActivities.length} active ${activeActivities.length===1?'location':'locations'}`;
}
vesselYearRange.addEventListener('input',updateVesselPositions);
oceanYearRange.addEventListener('input',()=>{vesselYearRange.value=oceanYearRange.value;updateVesselPositions()});
function setVesselAutoplay(playing){
  if(playing&&vesselYearFrame)return;
  if(vesselYearFrame){cancelAnimationFrame(vesselYearFrame);vesselYearFrame=null}
  vesselYearPreviousTime=null;
  if(!playing)return;
  const animate=time=>{
    if(vesselYearPreviousTime!==null){
      const elapsed=Math.min(50,time-vesselYearPreviousTime);
      const nextValue=Number(vesselYearRange.value)+elapsed/70;
      vesselYearRange.value=nextValue>=364?nextValue-364:nextValue;
      updateVesselPositions();
    }
    vesselYearPreviousTime=time;
    vesselYearFrame=requestAnimationFrame(animate);
  };
  vesselYearFrame=requestAnimationFrame(animate);
}
vesselYearRange.addEventListener('pointerdown',()=>{setVesselAutoplay(false);vesselYearControl.classList.add('dragging')});
vesselYearRange.addEventListener('pointerup',()=>{vesselYearControl.classList.remove('dragging');setVesselAutoplay(true)});
vesselYearRange.addEventListener('pointercancel',()=>{vesselYearControl.classList.remove('dragging');setVesselAutoplay(true)});
vesselYearRange.addEventListener('focus',()=>setVesselAutoplay(false));
vesselYearRange.addEventListener('blur',()=>setVesselAutoplay(true));
let oceanMapHovered=false,vesselManuallyPaused=false,oceanPointerActive=false,oceanFocusActive=false;
const reducedVesselMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function syncOceanPlayback(){
  const paused=reducedVesselMotion||oceanMapHovered||vesselManuallyPaused||oceanPointerActive||oceanFocusActive;
  setVesselAutoplay(!paused);
  attenboroughLayer.classList.toggle('is-paused',paused);
  otherJourneys.forEach(journey=>journey.layer.classList.toggle('is-paused',paused));
  oceanPlaybackToggle.classList.toggle('is-paused',paused);
  oceanPlaybackToggle.setAttribute('aria-pressed',String(paused));
  oceanPlaybackToggle.setAttribute('aria-label',paused?'Play timeline':'Pause timeline');
  oceanPlaybackLabel.textContent=paused?'Paused':'Playing';
}
oceanYearRange.addEventListener('pointerdown',()=>{oceanPointerActive=true;syncOceanPlayback()});
oceanYearRange.addEventListener('pointerup',()=>{oceanPointerActive=false;syncOceanPlayback()});
oceanYearRange.addEventListener('pointercancel',()=>{oceanPointerActive=false;syncOceanPlayback()});
oceanYearRange.addEventListener('focus',()=>{oceanFocusActive=true;syncOceanPlayback()});
oceanYearRange.addEventListener('blur',()=>{oceanFocusActive=false;syncOceanPlayback()});
oceanMapCanvas.addEventListener('mouseenter',()=>{oceanMapHovered=true;syncOceanPlayback()});
oceanMapCanvas.addEventListener('mouseleave',()=>{oceanMapHovered=false;syncOceanPlayback()});
oceanPlaybackToggle.addEventListener('click',()=>{vesselManuallyPaused=!vesselManuallyPaused;syncOceanPlayback()});
updateVesselPositions();
syncOceanPlayback();

const vessels=[
  {name:'RRS Discovery',tab:'Discovery',type:'Oceanographic research vessel',description:'Long-range, multidisciplinary science platform with the programme’s highest share of active research days.',days:341,science:238,emissions:'6.9k',detail:'Discovery combines global range with advanced oceanographic capability. Its annual programme spans climate, deep-ocean and ecosystem research.',ports:'8',missions:'15',utilisation:'93%',image:'assets/vessels/rrs-discovery-generated.png',alt:'Illustrative representation of RRS Discovery at sea'},
  {name:'RRS James Cook',tab:'James Cook',type:'Deep-sea research vessel',description:'A specialist deep-ocean platform balancing extended science campaigns with longer international passages.',days:326,science:216,emissions:'8.9k',detail:'James Cook supports complex deep-sea expeditions, requiring specialised equipment and a broad international logistics network.',ports:'11',missions:'13',utilisation:'89%',image:'assets/vessels/rrs-james-cook-generated.png',alt:'Illustrative representation of RRS James Cook at sea'},
  {name:'RRS Attenborough',tab:'Attenborough',type:'Polar research vessel',description:'A flexible polar platform for multidisciplinary science in challenging environments.',days:188,science:100,emissions:'5.6k',detail:'RRS Attenborough provides a capable base for polar science, autonomous systems and long-duration campaigns.',ports:'6',missions:'9',utilisation:'52%',image:'assets/vessels/rrs-sda-generated.png',alt:'Illustrative representation of RRS Attenborough in polar waters'}
];
const tabs=document.querySelector('.vessel-tabs');
let scienceShareFrame;
function animateScienceShare(value){
  const container=document.querySelector('#science-share');
  container.innerHTML='<span><strong>0%</strong><small>of active days dedicated to science</small></span><i><b></b></i>';
  const number=container.querySelector('strong'),fill=container.querySelector('b');
  cancelAnimationFrame(scienceShareFrame);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){number.textContent=`${value}%`;fill.style.width=`${value}%`;return}
  requestAnimationFrame(()=>{fill.style.width=`${value}%`});
  const started=performance.now(),duration=720;
  const tick=now=>{
    const progress=Math.min((now-started)/duration,1),eased=1-Math.pow(1-progress,3);
    number.textContent=`${Math.round(value*eased)}%`;
    if(progress<1)scienceShareFrame=requestAnimationFrame(tick);
  };
  scienceShareFrame=requestAnimationFrame(tick);
}
function showVessel(i){const v=vessels[i],image=document.querySelector('#vessel-image'),scienceShare=Math.round(v.science/v.days*100);document.querySelectorAll('.vessel-tabs button').forEach((b,j)=>b.classList.toggle('active',i===j));document.querySelector('#vessel-type').textContent=v.type;document.querySelector('#vessel-name').textContent=v.name;document.querySelector('#vessel-description').textContent=v.description;animateScienceShare(scienceShare);document.querySelector('#vessel-metrics').innerHTML=`<div><strong>${v.days}</strong><span>ACTIVE DAYS</span></div><div><strong>${v.science}</strong><span>SCIENCE DAYS</span></div><div><strong>${v.emissions}</strong><span>T CO₂E</span></div>`;image.src=v.image;image.alt=v.alt;document.querySelector('#vessel-more').onclick=()=>openPopover(v)}
vessels.forEach((v,i)=>{const b=document.createElement('button');b.textContent=v.tab;b.setAttribute('role','tab');b.onclick=()=>showVessel(i);tabs.append(b)});showVessel(0);
const popover=document.querySelector('#popover'),backdrop=document.querySelector('#popover-backdrop');
document.querySelectorAll('[data-campaign]').forEach(card=>{
  card.addEventListener('click',()=>openCampaign(card.dataset.campaign));
  card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCampaign(card.dataset.campaign)}});
});
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
const mobileHeader=document.querySelector('.topbar');
let headerScrollAnchor=Math.max(0,window.scrollY);
function updateMobileHeader(){
  const y=Math.max(0,Math.min(window.scrollY,Math.max(0,document.documentElement.scrollHeight-window.innerHeight)));
  mobileHeader.classList.toggle('scrolled',y>20);
  const menuOpen=document.querySelector('.chapter-nav').classList.contains('open');
  if(!window.matchMedia('(max-width:900px)').matches||y<80||menuOpen){
    mobileHeader.classList.remove('mobile-header-hidden');headerScrollAnchor=y;return;
  }
  const delta=y-headerScrollAnchor;
  if(Math.abs(delta)<8)return;
  mobileHeader.classList.toggle('mobile-header-hidden',delta>0);
  headerScrollAnchor=y;
}
window.addEventListener('scroll',updateMobileHeader,{passive:true});
window.addEventListener('resize',updateMobileHeader);
// Reveal for keyboard navigation without letting persistent touch focus pin the bar.
mobileHeader.addEventListener('focusin',()=>{
  mobileHeader.classList.remove('mobile-header-hidden');
  headerScrollAnchor=Math.max(0,window.scrollY);
});
window.addEventListener('hashchange',()=>{mobileHeader.classList.remove('mobile-header-hidden');headerScrollAnchor=Math.max(0,window.scrollY)});
const menu=document.querySelector('.menu-button'),nav=document.querySelector('.chapter-nav');menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')};navLinks.forEach(a=>a.onclick=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')});

const viewLinks=[...document.querySelectorAll('[data-view-link]')];
const storyHashes=new Set(sections.map(section=>`#${section.id}`));
const dashboardView=document.querySelector('.dashboard-view');
const navModeToggle=document.querySelector('.nav-mode-toggle');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const dashboardDonut=dashboardView.querySelector('.mini-donut');
const dashboardPie=dashboardDonut.querySelector('svg');
let dashboardPieAngle=-Math.PI/2;
emissions.forEach((emission,index)=>{
  const start=dashboardPieAngle,end=start+emission.pct/100*Math.PI*2;
  dashboardPieAngle=end;
  const slice=document.createElementNS('http://www.w3.org/2000/svg','g'),base=document.createElementNS('http://www.w3.org/2000/svg','path'),pop=document.createElementNS('http://www.w3.org/2000/svg','path');
  slice.classList.add('dashboard-pie-slice');
  slice.style.setProperty('--slice-delay',`${index*.1}s`);
  slice.dataset.value=(emission.value/1000).toFixed(1)+'k';
  slice.dataset.label=emission.name;
  slice.setAttribute('tabindex','0');slice.setAttribute('role','button');slice.setAttribute('aria-label',`${emission.name}, ${emission.pct}%`);
  base.classList.add('dashboard-pie-base');base.setAttribute('d',piePath(start,end));base.setAttribute('fill',emission.color);
  pop.classList.add('dashboard-pie-pop');pop.setAttribute('d',piePath(start,end,44.5,49));pop.setAttribute('fill',emission.color);
  slice.append(base,pop);dashboardPie.append(slice);
});
const dashboardDonutSegments=[...dashboardPie.querySelectorAll('.dashboard-pie-slice')];
const dashboardLegendItems=[...dashboardView.querySelectorAll('.footprint-chart li')];
const dashboardDonutValue=dashboardDonut.querySelector('strong');
const dashboardDonutLabel=dashboardDonutValue.querySelector('small');
function resetDashboardDonut(){
  dashboardDonutSegments.forEach(segment=>segment.classList.remove('selected','muted'));
  dashboardLegendItems.forEach(item=>item.classList.remove('active'));
  dashboardDonutValue.firstChild.nodeValue='21.3k';
  dashboardDonutLabel.textContent='t CO₂e';
}
function selectDashboardDonutSegment(activeSegment){
  const activeIndex=dashboardDonutSegments.indexOf(activeSegment);
  dashboardDonutSegments.forEach(segment=>{
    segment.classList.toggle('selected',segment===activeSegment);
    segment.classList.toggle('muted',segment!==activeSegment);
  });
  dashboardLegendItems.forEach((item,index)=>item.classList.toggle('active',index===activeIndex));
  dashboardDonutValue.firstChild.nodeValue=activeSegment.dataset.value;
  dashboardDonutLabel.textContent=activeSegment.dataset.label;
}
dashboardDonutSegments.forEach(segment=>{
  segment.addEventListener('click',event=>{event.stopPropagation();selectDashboardDonutSegment(segment)});
  segment.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectDashboardDonutSegment(segment)}});
});
dashboardDonut.addEventListener('click',event=>{if(!event.target.closest('.dashboard-pie-slice'))resetDashboardDonut()});
dashboardLegendItems.forEach((item,index)=>{
  item.tabIndex=0;
  item.setAttribute('role','button');
  item.setAttribute('aria-label',`${emissions[index].name}, ${emissions[index].pct}%`);
  item.addEventListener('click',()=>selectDashboardDonutSegment(dashboardDonutSegments[index]));
  item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectDashboardDonutSegment(dashboardDonutSegments[index])}});
});
function animateDashboard(){
  if(reducedMotion.matches){
    dashboardView.classList.add('is-animated');
    return;
  }
  dashboardView.classList.remove('is-animated');
  dashboardView.querySelectorAll('[data-count]').forEach(element=>{
    const target=Number(element.dataset.count),decimals=Number(element.dataset.decimals||0),suffix=element.dataset.suffix||'';
    element.textContent=(0).toFixed(decimals)+suffix;
    const start=performance.now(),duration=1250;
    const tick=now=>{
      const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,4),value=target*eased;
      element.textContent=value.toFixed(decimals)+suffix;
      if(progress<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    dashboardView.classList.add('is-animated');
  }));
}
function setCompactNavigation(compact){
  document.body.classList.toggle('nav-compact',compact);
  navModeToggle.setAttribute('aria-pressed',String(compact));
  navModeToggle.setAttribute('aria-label',compact?'Uitgeschreven navigatie inschakelen':'Compacte navigatie inschakelen');
  navModeToggle.title=compact?'Navigatie uitklappen':'Navigatie inklappen';
  try{localStorage.setItem('mfp-nav-compact',String(compact))}catch{}
}
try{setCompactNavigation(localStorage.getItem('mfp-nav-compact')==='true')}catch{setCompactNavigation(false)}
navModeToggle.addEventListener('click',()=>setCompactNavigation(!document.body.classList.contains('nav-compact')));
function syncView(){
  const isStory=storyHashes.has(location.hash);
  document.body.dataset.view=isStory?'story':'dashboard';
  viewLinks.forEach(link=>link.classList.toggle('active',link.dataset.viewLink===(isStory?'story':'dashboard')));
  menu.style.visibility='visible';
  if(!isStory&&location.hash!=='#dashboard')history.replaceState(null,'','#dashboard');
  if(!isStory)animateDashboard();
}
window.addEventListener('hashchange',syncView);
viewLinks.forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');window.scrollTo(0,0);if(link.dataset.viewLink==='dashboard'&&document.body.dataset.view==='dashboard')animateDashboard()}));
syncView();

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
