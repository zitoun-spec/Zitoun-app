'use strict';
const TZ='Europe/Amsterdam',app=document.getElementById('app');
const D=s=>new Date(s+'T12:00:00Z'),ymd=d=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(d),today=()=>ymd(new Date());
const add=(s,n)=>{const d=D(s);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const dow=s=>(D(s).getUTCDay()+6)%7,mon=s=>add(s,-dow(s));
const fmt=(s,o)=>new Intl.DateTimeFormat('nl-NL',{timeZone:'UTC',...o}).format(D(s));
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID(),DN=['Ma','Di','Wo','Do','Vr','Za','Zo'],ALL=[0,1,2,3,4,5,6];
const PARTS=[['ochtend','Ochtend'],['middag','Middag'],['avond','Avond'],['elk','Op elk moment']];
const COL=['#8e2440','#4f8f6c','#4a78d6','#8466c8','#d9803a'];
const IC={boek:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/>',halter:'<path d="M3 12h18M6 8v8M18 8v8M9 6v12M15 6v12"/>',kalender:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',hart:'<path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>',ster:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',huis:'<path d="M4 11l8-7 8 7v9H4z"/>',water:'<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',klok:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'};
const svg=n=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${IC[n]||''}</svg>`;
const GEAR='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>';
const blank=()=>({v:1,started:false,notes:[],habits:[],goals:[],logs:[],done:{},events:[],edone:{},lists:[],cats:[],set:{sort:'handmatig'}});
let AV='week',IR=30,IM=today().slice(0,7),ISD=today(),NF={q:'',kind:'',status:'',link:null},S=blank(),P={},db,T='routine',R='vandaag',vd=today(),ad=today(),F={cat:'',col:''},FM=null,last=today(),OP={};
/* opslag */
const open=()=>new Promise((a,b)=>{const r=indexedDB.open('dagritme',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error)});
const kvGet=k=>new Promise((a,b)=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)});
const kvSet=(k,v)=>new Promise((a,b)=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=a;t.onerror=()=>b(t.error)});
function toast(m,e){const t=document.getElementById('ts');t.innerHTML=`<div class="${e?'e':''}">${esc(m)}</div>`;clearTimeout(toast.h);toast.h=setTimeout(()=>t.innerHTML='',e?6000:2200)}
function refs(){const s=new Set,f=o=>o&&o.p&&o.p.photo&&s.add(o.p.photo);S.habits.forEach(f);S.events.forEach(f);S.goals.forEach(f);S.lists.forEach(l=>l.items.forEach(f));return s}
async function save(ph){try{if(ph){const r=refs();Object.keys(P).forEach(k=>r.has(k)||delete P[k]);await kvSet('photos',P)}await kvSet('state',S)}catch(e){toast('Opslaan mislukt: '+(e.message||e),1)}}
function norm(o){const s=Object.assign(blank(),o),t=today();
 s.habits.forEach((h,i)=>{h.id=h.id||uid();h.start=h.start||t;h.st=h.st||'actief';h.ord=h.ord??i;h.p=h.p||{};h.part=h.part||'elk';h.time=h.time||'';h.hist=h.hist||[{from:h.start,days:h.days||ALL,count:h.count||1}];delete h.days;delete h.count});
 s.notes.forEach(n=>{n.id=n.id||uid();n.kind=n.kind==='verbeter'?'verbeter':'notitie';n.status=n.status||'open';n.c=n.c||new Date().toISOString();n.u=n.u||n.c;n.link=n.link||null});
 s.habits.forEach(h=>{h.pz=h.pz||[];h.labels=h.labels||[];if(h.st==='pauze'&&!h.pz.length)h.pz.push({from:t,to:''});if(h.st==='archief'&&!h.ae)h.ae=t});
 s.goals.forEach(g=>{g.pz=g.pz||[];if(g.st==='pauze'&&!g.pz.length)g.pz.push({from:t,to:''});if(g.st==='archief'&&!g.ae)g.ae=t});
 s.goals.forEach(g=>{g.id=g.id||uid();g.start=g.start||t;g.st=g.st||'actief';g.p=g.p||{};g.type=g.type==='km'?'km':'aantal';g.hist=g.hist||[{from:g.start,target:g.target||1}];delete g.target});
 s.events.forEach(e=>{e.id=e.id||uid();e.ex=e.ex||[];e.tm=e.tm||{};e.days=e.days||[];e.p=e.p||{}});
 s.lists.forEach(l=>{l.id=l.id||uid();l.items=l.items||[];l.items.forEach(i=>{i.id=i.id||uid();i.p=i.p||{}})});
 s.cats.forEach(c=>c.id=c.id||uid());return s}
/* regels */
const ver=(h,d)=>{let v=null;for(const x of h.hist)if(x.from<=d)v=x;return v};
const sched=(h,d)=>{if(d<h.start||(h.ae&&d>h.ae)||(h.pz||[]).some(z=>d>=z.from&&(!z.to||d<z.to)))return null;const v=ver(h,d);return v&&v.days.includes(dow(d))?v:null};
const pass=o=>(!F.cat||o.p.cat===F.cat)&&(!F.col||o.p.color===F.col);
function moments(d,nf){const o=[];for(const h of S.habits){const v=sched(h,d);if(!v||(!nf&&!pass(h)))continue;for(let i=1;i<=v.count;i++){const lb=(h.labels||[])[i-1]||'',pk=PARTS.find(p=>p[0]===lb.toLowerCase());o.push({h,i,c:v.count,lab:lb,part:pk?pk[0]:h.part,k:`${d}|${h.id}|${i}`})}}
 const key=m=>S.set.sort==='tijd'?(m.h.time||'99:99'):String(m.h.ord).padStart(5,'0');return o.sort((a,b)=>key(a)<key(b)?-1:key(a)>key(b)?1:a.i-b.i)}
function occ(d){const r=[];for(const e of S.events){if(e.rec){if(e.days.includes(dow(d))&&d>=e.d&&(!e.end||d<=e.end)&&!e.ex.includes(d))r.push({e,d,s:e.allday?'':(e.tm[dow(d)]||e.s)})}else if(e.d===d)r.push({e,d,s:e.s})}
 return r.filter(o=>pass(o.e)).sort((a,b)=>(a.s||'')<(b.s||'')?-1:1)}
/* weergave */
const hd=(sub,title,x='')=>`<div class="H"><div><div class="m">${esc(sub)}</div><h1>${esc(title)}</h1></div><div class="hb">${x}<button class="gear" data-a="set" aria-label="Instellingen">${GEAR}</button></div></div>`;
const nb=(i,l,t)=>`<button class="gear" data-a="${i}" aria-label="${l}">${t}</button>`;
function row(o){const p=o.p||{},c=p.color||'',img=p.photo&&P[p.photo];
 const lead=img?`<img class="th" src="${img}" alt="">`:p.icon?`<span class="i" style="background:${c||'#2c2c30'}">${svg(p.icon)}</span>`:'';
 const R=p.side==='r';
 return `<div class="r">${o.ck!==undefined?`<button class="k ${o.ck?'on':''}" data-a="${o.a}" data-i="${esc(o.id)}" data-x="${esc(o.x||'')}" aria-pressed="${!!o.ck}" aria-label="${esc(o.title)} afvinken"><span>${o.ck?'✓':''}</span></button>`:''}${R?'':lead}<div class="x">${esc(o.title)}<small>${esc(o.sub||'')}</small></div>${R?lead:''}${c?`<i class="dt" style="background:${c}" role="img" aria-label="kleur"></i>`:''}${o.right||''}<button class="mo" data-a="${o.ed}" data-i="${esc(o.id)}" data-x="${esc(o.x||'')}" aria-label="${esc(o.title)} bewerken">⋯</button></div>`}
const empty=(t,b,a)=>`<div class="em"><p>${t}</p><button class="btn" data-a="${a}">${b}</button></div>`;
function fbar(items){const cs=S.cats,co=[...new Set(items.map(o=>o.p.color).filter(Boolean))];if(!cs.length&&co.length<2)return'';
 return `<div class="row sc" role="group" aria-label="Filter"><button class="ch ${!F.cat&&!F.col?'a':''}" data-a="fx0">Alles</button>${cs.map(c=>`<button class="ch ${F.cat===c.id?'a':''}" data-a="fc" data-i="${c.id}">${esc(c.n)}</button>`).join('')}${co.map(c=>`<button class="sw ${F.col===c?'a':''}" style="background:${c}" data-a="fk" data-i="${c}" aria-label="Filter op kleur ${c}"></button>`).join('')}</div>`}
function rRoutine(){const t=today(),day=R==='vandaag',all=moments(vd,1),dn=all.filter(m=>S.done[m.k]).length;
 const nav=nb('dm" data-i="-1','Vorige '+(day?'dag':'week'),'‹')+nb('dm" data-i="1','Volgende '+(day?'dag':'week'),'›')+(vd!==t?`<button class="gear" data-a="dt">Vandaag</button>`:'');
 let h=hd(fmt(vd,{weekday:'long',day:'numeric',month:'long'}),day?'Vandaag':'Week',nav);
 if(day)h+=`<div class="cd"><div style="display:flex;justify-content:space-between"><span>${all.length?`${dn} van ${all.length} momenten`:'Niet van toepassing'}</span>${all.length?`<span class="p">${Math.round(dn/all.length*100)}%</span>`:''}</div>${all.length?`<div class="tr"><div class="fl" style="width:${dn/all.length*100}%"></div></div>`:'<div class="m">Geen gewoontemomenten gepland.</div>'}</div>`;
 h+=`<div class="sg"><button class="${day?'a':''}" data-a="rv" data-i="vandaag">Vandaag</button><button class="${day?'':'a'}" data-a="rv" data-i="week">Week</button></div>`;
 return h+(day?rDay():rWeek())}
function rDay(){if(!S.habits.length)return empty('Nog geen gewoontes.','Eerste gewoonte toevoegen','nh');
 const ms=moments(vd);let h=fbar(S.habits);
 for(const[pk,pl]of PARTS){const g=ms.filter(m=>m.part===pk);if(g.length)h+=`<div class="t">${pl}</div>`+g.map(m=>row({id:m.k,a:'tog',ed:'eh',x:m.h.id,ck:!!S.done[m.k],title:m.h.n+(m.lab?` · ${m.lab.toLowerCase()}`:m.c>1?` · ${m.i}/${m.c}`:''),sub:m.h.time,p:m.h.p})).join('')}
 if(!ms.length)h+='<div class="cd m">Voor deze dag zijn geen momenten gepland.</div>';
 const ev=occ(vd);h+=`<div class="t">Afspraken</div>`+(ev.length?ev.map(o=>row({id:o.e.id,x:o.d,ed:'ee',title:o.e.t,sub:o.e.allday?'Hele dag':o.s,p:o.e.p})).join(''):'<div class="cd s">Niets gepland</div>');
 const par=S.habits.filter(h=>h.st!=='actief');if(par.length)h+=`<div class="t">Gepauzeerd of gearchiveerd</div>`+par.map(h=>row({id:h.id,ed:'eh',x:h.id,title:h.n,sub:h.st,p:h.p})).join('');return h}
const gact=(g,w)=>{const e=add(w,6);return !(g.start>e||(g.ae&&g.ae<w)||(g.pz||[]).some(z=>w>=z.from&&(!z.to||e<z.to)))};
function hst(h,m){const t=today();h.pz=h.pz||[];if(m==='p'){h.st='pauze';h.pz.push({from:t,to:''})}else if(m==='a'){h.st='archief';h.ae=t}else{if(h.st==='archief'){h.pz.push({from:add(h.ae,1),to:t});h.ae=''}else{const z=h.pz[h.pz.length-1];if(z&&!z.to)z.to=t}h.st='actief'}}
const wsum=(g,w)=>S.logs.filter(l=>l.gid===g.id&&l.d>=w&&l.d<=add(w,6)).reduce((a,l)=>a+Number(l.a),0);
function rWeek(){const w=mon(vd),e=add(w,6),gs=S.goals.filter(g=>gact(g,w));
 let h=`<div class="m" style="margin:4px 6px 8px">${fmt(w,{day:'numeric',month:'short'})} – ${fmt(e,{day:'numeric',month:'short'})}</div>`;
 if(!S.goals.length)return h+empty('Nog geen weekdoelen.','Eerste weekdoel toevoegen','ng');
 for(const g of gs){const tg=ver(g,e).target,tot=wsum(g,w),u=g.type==='km'?' km':'×',pc=Math.min(100,Math.round(tot/tg*100));
  h+=row({id:g.id,ed:'eg',title:g.n,sub:`${Math.round(tot*10)/10} van ${tg}${u} · ${pc}%`,p:g.p,right:`<button class="p" style="min-height:44px;border:0" data-a="lg" data-i="${g.id}">${g.type==='km'?'+ km':'+ 1'}</button>`});
  h+=`<div class="tr" style="margin:-2px 14px 10px"><div class="fl" style="width:${pc}%"></div></div>`}
 const lg=S.logs.filter(l=>l.d>=w&&l.d<=e&&gs.some(g=>g.id===l.gid)).sort((a,b)=>a.d<b.d?-1:1);
 h+=`<div class="t">Registraties deze week</div>`+(lg.length?lg.map(l=>{const g=S.goals.find(x=>x.id===l.gid);return row({id:l.id,ed:'el',title:`${g.n}: ${l.a}${g.type==='km'?' km':'×'}`,sub:fmt(l.d,{weekday:'long',day:'numeric',month:'short'}),p:{}})}).join(''):'<div class="cd s">Nog niets geregistreerd.</div>');return h}
function rAgenda(){if(AV==='maand')return rMonth();const w=mon(ad),t=today();
 let h=hd(fmt(ad,{month:'long',year:'numeric'}),'Agenda',nb('aw" data-i="-7','Vorige week','‹')+nb('aw" data-i="7','Volgende week','›')+`<button class="gear" data-a="at">Vandaag</button>`);
 h+=avs()+`<div class="wk">${ALL.map(i=>{const d=add(w,i);return `<button class="${d===ad?'a':''}" data-a="sd" data-i="${d}" aria-label="${fmt(d,{weekday:'long',day:'numeric',month:'long'})}">${DN[i]}<b>${+d.slice(8)}</b></button>`}).join('')}</div><div class="f"><label for="gd">Ga naar datum</label><input id="gd" type="date" value="${ad}"></div>`;
 for(const i of ALL){const d=add(w,i),o=occ(d);h+=`<div class="t ${d===ad?'sel':''}">${fmt(d,{weekday:'long',day:'numeric',month:'short'})}${d===t?' · vandaag':''}</div>`+(o.length?o.map(x=>row({id:x.e.id,x:d,a:'ek',ed:'ee',ck:!!S.edone[x.e.id+'|'+d],title:x.e.t,sub:[x.e.allday?'Hele dag':[x.s,x.e.e&&!x.e.rec?x.e.e:''].filter(Boolean).join('–'),x.e.loc].filter(Boolean).join(' · '),p:x.e.p})).join(''):'<div class="cd s">Niets gepland</div>')}
 return h}
function rLijsten(){let h=hd('Altijd bewaard','Lijsten')+fbar(S.lists.flatMap(l=>l.items));
 if(!S.lists.length)return h+empty('Nog geen lijsten.','Eerste lijst maken','nl');
 for(const l of S.lists){const it=l.items.filter(pass).sort((a,b)=>(a.done?1:0)-(b.done?1:0)),dn=l.items.filter(i=>i.done).length;
  h+=`<div class="t" style="display:flex;justify-content:space-between;align-items:center"><button class="mo" style="width:auto;font-size:12px;letter-spacing:inherit;text-transform:inherit;color:inherit" data-a="tl" data-i="${l.id}" aria-expanded="${!OP[l.id]}">${OP[l.id]?'▸':'▾'} ${esc(l.n)} · ${dn}/${l.items.length}</button><button class="mo" data-a="lm" data-i="${l.id}" aria-label="Lijst ${esc(l.n)} beheren">⋯</button></div>`;
  if(!OP[l.id])h+=it.map(i=>{const e=S.events.find(x=>x.id===i.eid);return row({id:i.id,x:l.id,a:'ti',ed:'ei',ck:!!i.done,title:i.t,sub:i.note,p:i.p,right:e?`<span class="p">Gepland ${fmt(e.d,{day:'numeric',month:'short'})}</span>`:''})}).join('')+`<button class="btn" data-a="ni" data-i="${l.id}">+ Item toevoegen</button>`}
 return h}
const welcome=()=>`<div class="em" style="padding-top:20vh"><h1>Dagritme</h1><p>Je gegevens blijven op deze iPhone. Hoe wil je beginnen?</p><button class="btn" data-a="st">Leeg beginnen</button><button class="btn" style="background:var(--cd)" data-a="im1">Startbestand importeren</button></div>`;
const FAB={routine:()=>R==='vandaag'?'nh':'ng',agenda:()=>'ne',lijsten:()=>'fl',notities:()=>'nn'};
function render(){if(!S.started){app.innerHTML=welcome();return}
 const v={routine:rRoutine,agenda:rAgenda,lijsten:rLijsten,notities:rNotes,inzicht:rInzicht}[T]();
 const fb=FAB[T]?`<button class="fab" data-a="${FAB[T]()}" aria-label="Toevoegen">+</button>`:'';
 app.innerHTML=v+fb+`<nav class="nav" aria-label="Hoofdmenu">${[['routine','Routine'],['agenda','Agenda'],['lijsten','Lijsten'],['notities','Notities'],['inzicht','Inzicht']].map(([k,l])=>`<button data-a="tab" data-i="${k}" class="${T===k?'a':''}" ${T===k?'aria-current="page"':''}>${l}</button>`).join('')}</nav>`}
const commit=async ph=>{await save(ph);render()};
/* formulieren */
function colorUI(k,cur){return `<div class="row">${COL.map(c=>`<button type="button" class="sw ${cur===c?'a':''}" style="background:${c}" data-a="pc" data-k="${k}" data-i="${c}" aria-label="Kleur ${c}"></button>`).join('')}<label class="sw" style="background:conic-gradient(#d9803a,#4f8f6c,#4a78d6,#8466c8,#d9803a);position:relative;overflow:hidden"><span class="m" style="position:absolute;opacity:0">Eigen kleur</span><input type="color" data-k="${k}" data-c="1" value="${cur||'#8e2440'}" style="position:absolute;inset:0;opacity:0;min-height:0" aria-label="Eigen kleur"></label><button type="button" class="ch ${cur?'':'a'}" style="flex:none" data-a="pc" data-k="${k}" data-i="">Geen</button></div>`}
function look(v){const p=v.p,ph=p.photo&&P[p.photo];
 return `<div class="f"><label>Foto (klein, alleen op deze iPhone)</label><div class="row">${ph?`<img class="th" src="${ph}" alt="">`:''}<span class="ph"><span class="btn" style="width:auto;display:flex;align-items:center">${ph?'Foto wijzigen':'Foto kiezen'}</span><input type="file" accept="image/*" data-ph="1" aria-label="Foto kiezen"></span>${ph?'<button type="button" class="btn" style="width:auto" data-a="pd">Foto verwijderen</button>':''}</div></div>
 <div class="f"><label>Icoon</label><div class="row">${Object.keys(IC).map(n=>`<button type="button" class="ic ${p.icon===n?'a':''}" data-a="pi" data-i="${n}" aria-label="Icoon ${n}">${svg(n)}</button>`).join('')}<button type="button" class="ch ${p.icon?'':'a'}" style="flex:none" data-a="pi" data-i="">Geen</button></div></div>
 <div class="f"><label>Plaats van foto of icoon</label><div class="sg"><button type="button" class="${p.side==='r'?'':'a'}" data-a="ps" data-i="l">Links</button><button type="button" class="${p.side==='r'?'a':''}" data-a="ps" data-i="r">Rechts</button></div></div>
 <div class="f"><label>Kleur</label>${colorUI('p.color',p.color)}</div>
 <div class="f"><label for="fc">Categorie</label><select id="fc" data-k="p.cat"><option value="">Geen</option>${S.cats.map(c=>`<option value="${c.id}" ${p.cat===c.id?'selected':''}>${esc(c.n)}</option>`).join('')}<option value="__new">Nieuwe categorie…</option></select></div>`}
function fld(f,v){const id='f_'+f.k;let h='';const val=v[f.k]??'';
 if(f.t==='text'||f.t==='date'||f.t==='time'||f.t==='number')h=`<input id="${id}" data-k="${f.k}" type="${f.t}" value="${esc(val)}" ${f.t==='number'?'inputmode="decimal" step="any" min="0"':''}${f.min?` min="${f.min}"`:''}>`;
 else if(f.t==='area')h=`<textarea id="${id}" data-k="${f.k}">${esc(val)}</textarea>`;
 else if(f.t==='sel')h=`<select id="${id}" data-k="${f.k}" data-re="${f.re?1:''}">${(typeof f.o==='function'?f.o(v):f.o).map(([a,b])=>`<option value="${a}" ${a==val?'selected':''}>${esc(b)}</option>`).join('')}</select>`;
 else if(f.t==='days')h=`<div class="row">${ALL.map(i=>`<button type="button" class="ch ${v[f.k].includes(i)?'a':''}" style="flex:none;min-width:44px" aria-pressed="${v[f.k].includes(i)}" data-a="fd" data-k="${f.k}" data-i="${i}">${DN[i]}</button>`).join('')}</div>`;
 else if(f.t==='times')h=`<div class="tg">${ALL.map(i=>`<label>${DN[i]}<input type="time" data-k="tm" data-j="${i}" value="${v.tm?.[i]||''}"></label>`).join('')}</div>`;
 else if(f.t==='color')h=colorUI(f.k,val);
 else return look(v);
 return `<div class="f"><label for="${id}">${f.l}</label>${h}</div>`}
function sheet(){const o=FM,s=document.getElementById('sh');if(!o){s.hidden=true;s.innerHTML='';return}const y=s.scrollTop;
 s.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(o.title)}"><h2>${esc(o.title)}</h2>${o.f.filter(f=>!f.if||f.if(o.v)).map(f=>fld(f,o.v)).join('')}${(o.x||[]).map((x,i)=>`<button type="button" class="btn ${x.c||''}" data-a="fe" data-i="${i}">${esc(x.l)}</button>`).join('')}<div class="bar"><button class="btn" data-a="fx">Annuleren</button><button class="btn pri" data-a="fs">Opslaan</button></div></div>`;s.hidden=false;s.scrollTop=y}
function form(o){o.v=o.v||{};o.v.p=o.v.p?{...o.v.p}:{};FM=o;sheet()}
const closeForm=()=>{FM=null;sheet()};
function menu(t,o){const m=document.getElementById('mn');m.hidden=false;m.onclick=e=>{if(e.target===m)m.hidden=true};
 m.innerHTML=`<div class="sheet" role="dialog" aria-label="${esc(t)}"><h2>${esc(t)}</h2>${o.map(([l,f,c],i)=>`<button class="btn ${c||''}" data-a="mn" data-i="${i}">${esc(l)}</button>`).join('')}<button class="btn" data-a="mx">Annuleren</button></div>`;menu.o=o}
const shut=()=>{const m=document.getElementById('mn');m.hidden=true;m.innerHTML=''};
function small(img){return new Promise((ok,no)=>{const r=new FileReader;r.onload=()=>{const i=new Image;i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),m=Math.min(i.width,i.height);x.drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,128,128);ok(c.toDataURL('image/jpeg',.7))};i.onerror=no;i.src=r.result};r.onerror=no;r.readAsDataURL(img)})}
const setPath=(k,val)=>{const[a,b]=k.split('.');b?FM.v[a][b]=val:FM.v[a]=val};
/* acties */
const find=(a,id)=>a.find(x=>x.id===id),ord=a=>a.sort((x,y)=>x.ord-y.ord).forEach((x,i)=>x.ord=i);
const mv=(arr,id,d)=>{const i=arr.findIndex(x=>x.id===id),j=i+d;if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]};
function habitForm(h){const t=today(),v=h?(ver(h,t)||h.hist[h.hist.length-1]):{days:ALL,count:1};
 form({title:h?'Gewoonte bewerken':'Nieuwe gewoonte',v:{n:h?.n||'',part:h?.part||'ochtend',time:h?.time||'',cnt:v.count,labels:(h?.labels||[]).join(', '),days:[...v.days],from:t,p:h?.p},
 f:[{k:'n',l:'Naam',t:'text'},{k:'part',l:'Dagdeel',t:'sel',o:PARTS.map(([a,b])=>[a,b])},{k:'time',l:'Tijd (optioneel)',t:'time'},{k:'cnt',l:'Aantal momenten per dag',t:'number'},{k:'labels',l:'Namen van de momenten (optioneel, met komma). “Ochtend, Avond” zet ze in die dagdelen',t:'text'},{k:'days',l:'Actieve weekdagen',t:'days'},{k:'from',l:'Wijziging van schema geldt vanaf',t:'date',min:t},{k:'p',t:'look'}],
 x:h?[...noteX('h',h.id),{l:'Omhoog',fn:()=>{S.habits.sort((a,b)=>a.ord-b.ord);mv(S.habits,h.id,-1);ord(S.habits);commit();toast('Verplaatst')}},{l:'Omlaag',fn:()=>{S.habits.sort((a,b)=>a.ord-b.ord);mv(S.habits,h.id,1);ord(S.habits);commit();toast('Verplaatst')}},{l:h.st==='actief'?'Pauzeren':'Hervatten',fn:()=>{hst(h,h.st==='actief'?'p':'r');closeForm();commit()}},...(h.st==='archief'?[]:[{l:'Archiveren (historie blijft)',fn:()=>{hst(h,'a');closeForm();commit()}}]),{l:'Definitief verwijderen',c:'del',fn:()=>{if(!confirm(`“${h.n}” definitief verwijderen? Dit wist de gewoonte en al haar vinkjes. Notities en afspraken blijven staan.`))return;S.habits=S.habits.filter(x=>x!==h);unlink('h',h.id);Object.keys(S.done).forEach(k=>k.split('|')[1]===h.id&&delete S.done[k]);closeForm();commit(1)}}]:[],
 save:v=>{const n=v.n.trim(),c=Math.max(1,Math.min(20,parseInt(v.cnt)||1)),lbs=(v.labels||'').split(',').map(x=>x.trim()).filter(Boolean);if(!n)return toast('Geef een naam',1);if(!v.days.length)return toast('Kies minstens één weekdag',1);const f=v.from<t?t:v.from;
  if(!h){S.habits.push({id:uid(),n,labels:lbs,pz:[],part:v.part,time:v.time,start:f,st:'actief',ord:S.habits.length,p:v.p,hist:[{from:f,days:v.days.sort(),count:c}]})}
  else{Object.assign(h,{n,labels:lbs,part:v.part,time:v.time,p:v.p});const cur=ver(h,f);if(!cur||cur.count!==c||cur.days.join()!==v.days.slice().sort().join()){h.hist=h.hist.filter(x=>x.from!==f||x.from<=h.start&&false);h.hist.push({from:f,days:v.days.sort(),count:c});h.hist.sort((a,b)=>a.from<b.from?-1:1)}}
  closeForm();commit(1)}})}
function goalForm(g){const t=today(),e=g?ver(g,t)||g.hist[0]:{target:1};
 form({title:g?'Weekdoel bewerken':'Nieuw weekdoel',v:{n:g?.n||'',type:g?.type||'aantal',target:e.target,from:t,p:g?.p},f:[{k:'n',l:'Naam',t:'text'},{k:'type',l:'Soort',t:'sel',o:[['aantal','Aantal keer'],['km','Kilometers']]},{k:'target',l:'Doel per week',t:'number'},{k:'from',l:'Nieuw doel geldt vanaf',t:'date',min:t},{k:'p',t:'look'}],
 x:g?[...noteX('g',g.id),{l:g.st==='actief'?'Pauzeren':'Hervatten',fn:()=>{hst(g,g.st==='actief'?'p':'r');closeForm();commit()}},...(g.st==='archief'?[]:[{l:'Archiveren (historie blijft)',fn:()=>{hst(g,'a');closeForm();commit()}}]),{l:'Definitief verwijderen',c:'del',fn:()=>{if(!confirm(`“${g.n}” verwijderen? Dit wist het doel en al zijn registraties.`))return;S.goals=S.goals.filter(x=>x!==g);unlink('g',g.id);S.logs=S.logs.filter(l=>l.gid!==g.id);closeForm();commit(1)}}]:[],
 save:v=>{const n=v.n.trim(),tg=parseFloat(String(v.target).replace(',','.'));if(!n||!(tg>0))return toast('Naam en doel zijn nodig',1);const f=v.from<t?t:v.from;
  if(!g)S.goals.push({id:uid(),n,type:v.type,start:f,st:'actief',p:v.p,hist:[{from:f,target:tg}]});else{Object.assign(g,{n,type:v.type,p:v.p});if(ver(g,f)?.target!==tg){g.hist=g.hist.filter(x=>x.from!==f);g.hist.push({from:f,target:tg});g.hist.sort((a,b)=>a.from<b.from?-1:1)}}closeForm();commit(1)}})}
function logForm(g,l){const w=mon(vd),d=l?l.d:(today()>=w&&today()<=add(w,6)?today():w);
 form({title:l?'Registratie corrigeren':`${g.n}: toevoegen`,v:{a:l?l.a:(g.type==='km'?'':1),d},f:[{k:'a',l:g.type==='km'?'Afstand (km)':'Aantal',t:'number'},{k:'d',l:'Datum',t:'date'}],x:l?[{l:'Registratie verwijderen',c:'del',fn:()=>{S.logs=S.logs.filter(x=>x!==l);closeForm();commit()}}]:[],
 save:v=>{const a=parseFloat(String(v.a).replace(',','.'));if(!(a>0)||!v.d)return toast('Vul een bedrag en datum in',1);if(l){l.a=a;l.d=v.d}else S.logs.push({id:uid(),gid:g.id,d:v.d,a});closeForm();commit()}})}
function eventForm(e,d0,pre){const rec=e?.rec;
 form({title:e?'Afspraak bewerken':'Nieuwe afspraak',v:{t:e?.t||pre?.t||'',rec:rec?'w':'e',d:e?(rec?d0:e.d):(pre?.d||ad),end:e?.end||'',days:[...(e?.days||[])],allday:e?.allday?'1':'',s:e?.s||'',e:e?.e||'',tm:{...(e?.tm||{})},loc:e?.loc||'',note:e?.note||'',p:e?.p||pre?.p},
 f:[{k:'t',l:'Titel',t:'text'},{k:'rec',l:'Herhaling',t:'sel',re:1,o:[['e','Eenmalig'],['w','Wekelijks']]},{k:'d',l:'Datum / startdatum',t:'date'},{k:'end',l:'Einddatum (optioneel)',t:'date',if:v=>v.rec==='w'},{k:'days',l:'Weekdagen',t:'days',if:v=>v.rec==='w'},{k:'allday',l:'Hele dag',t:'sel',re:1,o:[['','Nee'],['1','Ja']]},{k:'s',l:'Begintijd',t:'time',if:v=>!v.allday},{k:'e',l:'Eindtijd',t:'time',if:v=>!v.allday},{k:'tm',l:'Andere begintijd per weekdag (optioneel)',t:'times',if:v=>v.rec==='w'&&!v.allday},{k:'loc',l:'Locatie',t:'text'},{k:'note',l:'Notitie',t:'area'},{k:'p',t:'look'}],
 x:e?[...noteX('e',e.id),{l:'Verwijderen',c:'del',fn:()=>delEvent(e,d0)}]:[],
 save:v=>{const o={t:v.t.trim(),rec:v.rec==='w',d:v.d,end:v.rec==='w'?v.end:'',days:v.rec==='w'?v.days.slice().sort():[],allday:!!v.allday,s:v.allday?'':v.s,e:v.allday?'':v.e,tm:v.rec==='w'&&!v.allday?Object.fromEntries(Object.entries(v.tm||{}).filter(x=>x[1]&&v.days.includes(+x[0]))):{},loc:v.loc,note:v.note,p:v.p};
  if(!o.t||!o.d)return toast('Titel en datum zijn nodig',1);if(o.rec&&!o.days.length)return toast('Kies minstens één weekdag',1);if(o.end&&o.end<o.d)return toast('Einddatum ligt voor de startdatum',1);
  const done=()=>{closeForm();shut();commit()};
  if(!e){const n={id:uid(),ex:[],...o};S.events.push(n);if(pre?.link)pre.link.eid=n.id;return done()}
  if(!e.rec)return(Object.assign(e,o),done());
  menu('Welke afspraken wijzigen?',[['Alleen deze afspraak',()=>{e.ex.push(d0);S.events.push({id:uid(),ex:[],...o,rec:false,days:[],end:'',tm:{},from:e.id});done()}],['Deze en volgende',()=>{if(d0<=e.d)Object.assign(e,o);else{e.end=add(d0,-1);S.events.push({id:uid(),ex:[],...o,from:e.id})}done()}],['De hele reeks',()=>{Object.assign(e,o,o.rec?{d:e.d}:{});done()}]])}})}
function delEvent(e,d0){const rm=()=>{S.events=S.events.filter(x=>x!==e);unlink('e',e.id);Object.keys(S.edone).forEach(k=>k.startsWith(e.id)&&delete S.edone[k]);closeForm();shut();commit(1)};
 if(!e.rec){if(confirm(`“${e.t}” verwijderen? Gekoppelde lijstitems blijven bestaan zonder planning.`))rm();return}
 menu('Welke afspraken verwijderen?',[['Alleen deze afspraak',()=>{e.ex.push(d0);closeForm();shut();commit()}],['Deze en volgende',()=>{if(d0<=e.d)rm();else{e.end=add(d0,-1);closeForm();shut();commit()}}],['De hele reeks',rm,'del']])}
function itemForm(l,i){form({title:i?'Item bewerken':'Nieuw item',v:{t:i?.t||'',note:i?.note||'',p:i?.p},f:[{k:'t',l:'Item',t:'text'},{k:'note',l:'Notitie',t:'area'},{k:'p',t:'look'}],
 x:i?[...noteX('i',i.id),...(!S.events.find(e=>e.id===i.eid)?[{l:'Inplannen als afspraak',fn:()=>{closeForm();eventForm(null,null,{t:i.t,p:i.p,d:today(),link:i})}}]:[{l:'Planning loskoppelen',fn:()=>{i.eid=null;closeForm();commit()}}]),{l:'Omhoog',fn:()=>{mv(l.items,i.id,-1);commit();toast('Verplaatst')}},{l:'Omlaag',fn:()=>{mv(l.items,i.id,1);commit();toast('Verplaatst')}},{l:'Verwijderen',c:'del',fn:()=>{if(!confirm(`“${i.t}” verwijderen?`))return;l.items=l.items.filter(x=>x!==i);unlink('i',i.id);closeForm();commit(1)}}]:[],
 save:v=>{if(!v.t.trim())return toast('Geef het item een naam',1);if(i)Object.assign(i,{t:v.t.trim(),note:v.note,p:v.p});else l.items.push({id:uid(),t:v.t.trim(),note:v.note,done:false,eid:null,p:v.p});closeForm();commit(1)}})}
function catForm(c){form({title:c?'Categorie bewerken':'Nieuwe categorie',v:{n:c?.n||'',color:c?.color||'',p:{}},f:[{k:'n',l:'Naam',t:'text'},{k:'color',l:'Kleur (optioneel)',t:'color'}],x:c?[{l:'Verwijderen (items blijven bestaan)',c:'del',fn:()=>{S.cats=S.cats.filter(x=>x!==c);[...S.habits,...S.events,...S.goals,...S.lists.flatMap(l=>l.items)].forEach(o=>o.p.cat===c.id&&delete o.p.cat);closeForm();commit(1)}}]:[],
 save:v=>{if(!v.n.trim())return toast('Geef een naam',1);if(c){c.n=v.n.trim();c.color=v.color}else S.cats.push({id:uid(),n:v.n.trim(),color:v.color});closeForm();commit()}})}
function settings(){menu('Instellingen',[[`Volgorde: ${S.set.sort==='tijd'?'op tijd':'handmatig'} (wijzig)`,()=>{S.set.sort=S.set.sort==='tijd'?'handmatig':'tijd';shut();commit()}],['Categorieën beheren',()=>{shut();menu('Categorieën',[...S.cats.map(c=>[c.n,()=>{shut();catForm(c)}]),['+ Nieuwe categorie',()=>{shut();catForm()}]])}],['Exporteren (JSON)',()=>{shut();exp()}],['Importeren (vervangt alles)',()=>{shut();document.getElementById('imf').click()}],['Alle gegevens wissen',()=>{shut();if(confirm('Alles op dit apparaat wissen? Dit kan niet ongedaan worden gemaakt.')){S=blank();S.started=true;P={};commit(1)}},'del'],['Info: opslag en privacy',()=>{shut();alert('Alles staat lokaal op deze iPhone (IndexedDB). Er is nog geen server gekoppeld. Lokale opslag is geen back-up: maak regelmatig een export. Een export bevat al je persoonlijke gegevens en foto’s. Meldingen volgen in deel 3.')}]])}
function exp(){const j=JSON.stringify({app:'dagritme',v:1,S,P}),b=new Blob([j],{type:'application/json'});if(b.size>5e6)alert('Let op: dit exportbestand is groot ('+Math.round(b.size/1e6)+' MB), vooral door foto’s.');const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='dagritme-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();toast('Export gemaakt. Bewaar het bestand veilig.')}
async function imp(f){try{const j=JSON.parse(await f.text());if(j.app!=='dagritme'||!j.S||typeof j.S!=='object')throw new Error('Geen Dagritme-bestand');if(S.started&&!confirm('Alle huidige gegevens vervangen door dit bestand?'))return;S=norm(j.S);S.started=true;P=j.P&&typeof j.P==='object'?j.P:{};await commit(1);toast('Import gelukt')}catch(e){toast('Import mislukt: '+e.message,1)}}
const ACT={
 st(){S.started=true;commit()},im1(){document.getElementById('imf').click()},tab(d){T=d.i;if(T!=='notities')NF.link=null;render();scrollTo(0,0)},rv(d){R=d.i;render()},
 dm(d){vd=add(vd,(R==='vandaag'?1:7)*d.i);render()},dt(){vd=today();render()},aw(d){ad=AV==='maand'?mshift(ad.slice(0,7),+d.i>0?1:-1)+'-01':add(ad,+d.i);render()},av(d){AV=d.i;render()},at(){ad=today();render()},sd(d){ad=d.i;render()},
 tog(d){S.done[d.i]?delete S.done[d.i]:S.done[d.i]=1;commit()},ek(d){const k=d.i+'|'+d.x;S.edone[k]?delete S.edone[k]:S.edone[k]=1;commit()},ti(d){const l=find(S.lists,d.x),i=find(l.items,d.i);i.done=!i.done;commit()},
 nh(){habitForm()},eh(d){habitForm(find(S.habits,d.x||d.i))},ng(){goalForm()},eg(d){goalForm(find(S.goals,d.i))},lg(d){logForm(find(S.goals,d.i))},el(d){const l=find(S.logs,d.i);logForm(find(S.goals,l.gid),l)},
 ne(){eventForm()},ee(d){eventForm(find(S.events,d.i),d.x)},
 nl(){const n=prompt('Naam van de lijst');if(n&&n.trim()){S.lists.push({id:uid(),n:n.trim(),items:[]});commit()}},ni(d){itemForm(find(S.lists,d.i))},ei(d){itemForm(find(S.lists,d.x),find(find(S.lists,d.x).items,d.i))},
 fl(){menu('Toevoegen',[...S.lists.map(l=>['Item in '+l.n,()=>{shut();itemForm(l)}]),['Nieuwe lijst',()=>{shut();ACT.nl()}]])},
 tl(d){OP[d.i]=!OP[d.i];render()},lm(d){const l=find(S.lists,d.i);menu(l.n,[['Hernoemen',()=>{shut();const n=prompt('Nieuwe naam',l.n);if(n&&n.trim()){l.n=n.trim();commit()}}],['Omhoog',()=>{mv(S.lists,l.id,-1);shut();commit()}],['Omlaag',()=>{mv(S.lists,l.id,1);shut();commit()}],['Lijst verwijderen',()=>{shut();if(confirm(`Lijst “${l.n}” met ${l.items.length} items verwijderen?`)){l.items.forEach(i=>unlink('i',i.id));S.lists=S.lists.filter(x=>x!==l);commit(1)}},'del']])},
 set:settings,fc(d){F={cat:F.cat===d.i?'':d.i,col:''};render()},fk(d){F={cat:'',col:F.col===d.i?'':d.i};render()},fx0(){F={cat:'',col:''};render()},
 fx:closeForm,fd(d){const a=FM.v[d.k],i=+d.i;a.includes(i)?a.splice(a.indexOf(i),1):a.push(i);sheet()},pc(d){setPath(d.k,d.i);sheet()},pi(d){FM.v.p.icon=d.i;sheet()},ps(d){FM.v.p.side=d.i;sheet()},pd(){delete FM.v.p.photo;sheet()},
 fe(d){FM.x[+d.i].fn()},fs(){FM.save(FM.v)},nn(){noteForm()},en(d){noteForm(find(S.notes,d.i))},nf(d){NF.kind=d.k;NF.status=d.s;render()},nu(){NF.link=null;render()},ma(d){IM=mshift(IM,+d.i);render()},is(d){ISD=d.i;IM=d.i.slice(0,7);render()},ir(d){IR=+d.i;render()},id(){vd=ISD;R='vandaag';T='routine';render();scrollTo(0,0)},
 mn(d){const f=menu.o[+d.i][1];f()},mx:shut};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&ACT[b.dataset.a])ACT[b.dataset.a](b.dataset,b)});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='nq'){NF.q=t.value;document.getElementById('nlist').innerHTML=noteRows();return}if(!FM||!t.dataset.k||t.dataset.c)return;
 if(t.dataset.j!==undefined){FM.v.tm=FM.v.tm||{};FM.v.tm[t.dataset.j]=t.value}else if(t.dataset.k==='p.cat'&&t.value==='__new'){const n=prompt('Naam van de categorie');if(n&&n.trim()){const c={id:uid(),n:n.trim()};S.cats.push(c);FM.v.p.cat=c.id;save()}sheet()}else{setPath(t.dataset.k,t.value);if(t.dataset.re)sheet()}});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset.c&&FM){setPath(t.dataset.k,t.value);sheet()}
 if(t.dataset.ph&&t.files[0]&&FM){try{const id=uid();P[id]=await small(t.files[0]);FM.v.p.photo=id;sheet()}catch{toast('Foto kon niet worden gelezen',1)}}
 if(t.id==='gd'&&t.value){ad=t.value;render()}
 if(t.id==='imf'&&t.files[0]){await imp(t.files[0]);t.value=''}});
function chk(){const t=today();if(t!==last){if(vd===last)vd=t;if(ad===last)ad=t;last=t;if(!FM)render()}}
document.addEventListener('visibilitychange',()=>!document.hidden&&chk());addEventListener('focus',chk);addEventListener('pageshow',chk);setInterval(chk,60000);
addEventListener('online',()=>toast('Weer online'));addEventListener('offline',()=>toast('Offline: de app blijft werken'));

/* deel 2: notities */
const ST={open:'Open',bezig:'Bezig',af:'Afgerond'},NT=[['','Geen koppeling'],['h','Gewoonte'],['g','Weekdoel'],['e','Afspraak'],['i','Lijstitem'],['d','Datum']];
const mshift=(ym,n)=>{const d=new Date(ym+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,7)};
const targets=t=>t==='h'?S.habits.map(x=>[x.id,x.n]):t==='g'?S.goals.map(x=>[x.id,x.n]):t==='e'?S.events.map(x=>[x.id,x.t+(x.rec?' (reeks)':' · '+x.d)]):t==='i'?S.lists.flatMap(l=>l.items.map(i=>[i.id,l.n+': '+i.t])):[];
const tname=l=>{if(!l)return'';if(l.t==='d')return fmt(l.id,{day:'numeric',month:'long'});const x=targets(l.t).find(a=>a[0]===l.id);return x?x[1]:''};
const unlink=(t,id)=>S.notes.forEach(n=>{if(n.link&&n.link.t===t&&n.link.id===id)n.link=null});
const nCount=(t,id)=>S.notes.filter(n=>n.link&&n.link.t===t&&n.link.id===id).length;
const noteX=(t,id)=>[{l:`Opmerkingen bekijken (${nCount(t,id)})`,fn:()=>{closeForm();NF={q:'',kind:'',status:'',link:{t,id}};T='notities';render()}},{l:'Opmerking toevoegen',fn:()=>{closeForm();noteForm(null,{lt:t,lid:id})}}];
function noteRows(){const q=NF.q.toLowerCase(),a=S.notes.filter(n=>(!NF.kind||n.kind===NF.kind)&&(!NF.status||n.status===NF.status)&&(!NF.link||(n.link&&n.link.t===NF.link.t&&n.link.id===NF.link.id))&&(!q||[n.title,n.text,n.wat,n.ver,n.act,tname(n.link)].join(' ').toLowerCase().includes(q))).sort((x,y)=>x.u<y.u?1:-1);
 return a.length?a.map(n=>row({id:n.id,ed:'en',title:n.title||(n.text||n.wat||n.ver||'').slice(0,60),sub:[n.kind==='verbeter'?'Verbeterpunt':'Notitie',tname(n.link),'gewijzigd '+fmt(ymd(new Date(n.u)),{day:'numeric',month:'short'})].filter(Boolean).join(' · '),p:{},right:n.kind==='verbeter'?`<span class="p">${ST[n.status]}</span>`:''})).join(''):'<div class="cd s">Geen notities gevonden.</div>'}
function rNotes(){let h=hd('Eigen opmerkingen','Notities');if(!S.notes.length)return h+empty('Nog geen notities of verbeterpunten.','Eerste notitie schrijven','nn');
 h+=`<div class="f"><label for="nq">Zoeken</label><input id="nq" type="search" value="${esc(NF.q)}"></div><div class="row sc">${[['','','Alles'],['notitie','','Notities'],['verbeter','','Verbeterpunten'],['','open','Open'],['','bezig','Bezig'],['','af','Afgerond']].map(([k,s,l])=>`<button class="ch ${NF.kind===k&&NF.status===s?'a':''}" data-a="nf" data-k="${k}" data-s="${s}">${l}</button>`).join('')}${NF.link?`<button class="ch a" data-a="nu">Gekoppeld: ${esc(tname(NF.link))} ✕</button>`:''}</div>`;
 return h+`<div id="nlist">${noteRows()}</div>`}
function noteForm(n,pre){const L=n?.link||{},V=k=>v=>v.kind==='verbeter';
 form({title:n?'Bewerken':'Nieuwe notitie',v:{kind:n?.kind||'notitie',title:n?.title||'',text:n?.text||'',wat:n?.wat||'',ver:n?.ver||'',act:n?.act||'',status:n?.status||'open',lt:pre?.lt??L.t??'',lid:pre?.lid??(L.t&&L.t!=='d'?L.id:''),ld:L.t==='d'?L.id:today()},
 f:[{k:'kind',l:'Soort',t:'sel',re:1,o:[['notitie','Notitie'],['verbeter','Verbeterpunt']]},{k:'title',l:'Titel (optioneel)',t:'text'},{k:'text',l:'Tekst',t:'area'},{k:'wat',l:'Wat gaat er nog niet goed of kan beter?',t:'area',if:V()},{k:'ver',l:'Wat wil ik concreet veranderen?',t:'area',if:V()},{k:'act',l:'Volgende actie (optioneel)',t:'text',if:V()},{k:'status',l:'Status',t:'sel',o:[['open','Open'],['bezig','Bezig'],['af','Afgerond']],if:V()},{k:'lt',l:'Koppelen aan',t:'sel',re:1,o:NT},{k:'lid',l:'Welk item?',t:'sel',o:v=>[['','Kies…'],...targets(v.lt)],if:v=>['h','g','e','i'].includes(v.lt)},{k:'ld',l:'Datum',t:'date',if:v=>v.lt==='d'}],
 x:n?[{l:'Maak er een lijstitem van',fn:()=>S.lists.length?menu('Toevoegen aan lijst',S.lists.map(l=>[l.n,()=>{l.items.push({id:uid(),t:(n.title||n.act||n.ver||n.text||'Item').slice(0,80),note:'',done:false,eid:null,p:{}});shut();commit();toast('Lijstitem gemaakt (notitie blijft bestaan)')}])):toast('Maak eerst een lijst',1)},{l:'Verwijderen',c:'del',fn:()=>{if(!confirm('Deze notitie verwijderen?'))return;S.notes=S.notes.filter(x=>x!==n);closeForm();commit()}}]:[],
 save:v=>{if(!(v.title+v.text+(v.kind==='verbeter'?v.wat+v.ver+v.act:'')).trim())return toast('Schrijf iets op',1);
  const link=v.lt==='d'&&v.ld?{t:'d',id:v.ld}:['h','g','e','i'].includes(v.lt)&&targets(v.lt).some(a=>a[0]===v.lid)?{t:v.lt,id:v.lid}:null,now=new Date().toISOString(),o={kind:v.kind,title:v.title.trim(),text:v.text,wat:v.kind==='verbeter'?v.wat:'',ver:v.kind==='verbeter'?v.ver:'',act:v.kind==='verbeter'?v.act:'',status:v.kind==='verbeter'?v.status:'open',link,u:now};
  if(n)Object.assign(n,o);else S.notes.push({id:uid(),c:now,...o});closeForm();commit()}})}
/* deel 2: kalender en inzicht */
function cal(ym,fn,sel){const f=ym+'-01',st=add(f,-dow(f)),t=today();let h='<div class="cal">'+DN.map(n=>`<span class="m" style="text-align:center">${n}</span>`).join('');
 for(let i=0;i<42;i++){const d=add(st,i);if(i>=35&&d.slice(0,7)!==ym)break;const c=fn(d);h+=`<button class="cl ${d===sel?'a':''} ${d.slice(0,7)===ym?'':'o'} ${d===t?'t':''} ${c.s||''}" data-a="${c.a}" data-i="${d}" aria-label="${fmt(d,{weekday:'long',day:'numeric',month:'long'})}${c.l?', '+c.l:''}"><b>${+d.slice(8)}</b><small>${c.t||''}</small></button>`}return h+'</div>'}
const avs=()=>`<div class="sg"><button class="${AV==='week'?'a':''}" data-a="av" data-i="week">Week</button><button class="${AV==='maand'?'a':''}" data-a="av" data-i="maand">Maand</button></div>`;
function rMonth(){const ym=ad.slice(0,7);let h=hd(fmt(ym+'-01',{month:'long',year:'numeric'}),'Agenda',nb('aw" data-i="-1','Vorige maand','‹')+nb('aw" data-i="1','Volgende maand','›')+`<button class="gear" data-a="at">Vandaag</button>`)+avs();
 h+=cal(ym,d=>{const n=occ(d).length;return{a:'sd',t:n?'● '.repeat(Math.min(n,3)).trim():'',l:n?n+' afspraken':''}},ad);
 const o=occ(ad);h+=`<div class="t sel">${fmt(ad,{weekday:'long',day:'numeric',month:'long'})}</div>`+(o.length?o.map(x=>row({id:x.e.id,x:ad,a:'ek',ed:'ee',ck:!!S.edone[x.e.id+'|'+ad],title:x.e.t,sub:[x.e.allday?'Hele dag':x.s,x.e.loc].filter(Boolean).join(' · '),p:x.e.p})).join(''):'<div class="cd s">Niets gepland</div>');return h}
const dstat=d=>{const m=moments(d,1);return m.length?{t:m.length,n:m.filter(x=>S.done[x.k]).length}:null};
function hstreak(h){const t=today();let run=0,best=0;for(let d=h.start;d<=t;d=add(d,1)){const v=sched(h,d);if(!v)continue;let ok=1;for(let i=1;i<=v.count;i++)if(!S.done[`${d}|${h.id}|${i}`])ok=0;if(ok){run++;best=Math.max(best,run)}else if(d<t)run=0}return{cur:run,best}}
const wres=(g,w)=>{const tg=ver(g,add(w,6))?.target||1,tot=wsum(g,w);return{tot,tg,met:tot>=tg,v:Math.min(1,tot/tg)}};
function gstreak(g){const w0=mon(today());let run=0,best=0;for(let w=mon(g.start);w<=w0;w=add(w,7)){if(!gact(g,w))continue;if(wres(g,w).met){run++;best=Math.max(best,run)}else if(w<w0)run=0}return{cur:run,best}}
function bars(vals,H,lab){const n=vals.length,bw=340/n;return `<svg viewBox="0 0 340 ${H}" width="100%" role="img" aria-label="${esc(lab)}">`+vals.map((v,i)=>v==null?`<rect x="${i*bw+1}" y="${H-2}" width="${Math.max(bw-2,1)}" height="2" fill="#3a3a40"/>`:`<rect x="${i*bw+1}" y="${H-Math.max(v*H,2)}" width="${Math.max(bw-2,1)}" height="${Math.max(v*H,2)}" rx="2" fill="#8e2440"/>`).join('')+'</svg>'}
function rInzicht(){const t=today(),days=[...Array(IR)].map((_,i)=>add(t,i-IR+1)),st=days.map(dstat),ok=st.filter(Boolean),tot=ok.reduce((a,x)=>a+x.t,0),dn=ok.reduce((a,x)=>a+x.n,0),full=ok.filter(x=>x.n===x.t).length;
 let h=hd('Uit je echte registraties','Inzicht')+`<div class="sg"><button class="${IR===7?'a':''}" data-a="ir" data-i="7">7 dagen</button><button class="${IR===30?'a':''}" data-a="ir" data-i="30">30 dagen</button></div>`;
 const lab=ok.length?`${Math.round(dn/tot*100)}% van ${tot} momenten, ${full} van ${ok.length} dagen volledig`:'Geen gewoontemomenten gepland';
 h+=`<div class="cd"><div style="display:flex;justify-content:space-between"><span>Dagelijkse voortgang</span><span class="p">${ok.length?Math.round(dn/tot*100)+'%':'n.v.t.'}</span></div><div class="m" style="margin:4px 0 8px">${lab}</div>${bars(st.map(x=>x?x.n/x.t:null),90,'Dagelijkse voltooiing, '+lab)}<div class="m" style="display:flex;justify-content:space-between"><span>${fmt(days[0],{day:'numeric',month:'short'})}</span><span>${fmt(t,{day:'numeric',month:'short'})}</span></div><div class="m" style="margin-top:8px">Elk uitvoermoment telt mee (tandenpoetsen 2, bidden 5). Een dag is pas volledig als alle momenten zijn afgevinkt. Dagen zonder gepland moment tellen niet mee.</div></div>`;
 const hs=S.habits.filter(x=>x.st!=='archief'||true);h+=`<div class="t">Streaks per gewoonte</div>`+(hs.length?hs.map(x=>{const s=hstreak(x);return `<div class="cd" style="display:flex;justify-content:space-between;gap:8px"><span>${esc(x.n)}</span><span class="m">nu ${s.cur} · langste ${s.best} dagen</span></div>`}).join(''):'<div class="cd s">Nog geen gewoontes.</div>');
 h+=`<div class="t">Weekdoelen (laatste 8 weken)</div>`+(S.goals.length?S.goals.map(g=>{const ws=[...Array(8)].map((_,i)=>add(mon(t),-7*(7-i))),rs=ws.map(w=>gact(g,w)?wres(g,w):null),s=gstreak(g),c=rs[7],u=g.type==='km'?' km':'×';return `<div class="cd"><div style="display:flex;justify-content:space-between;gap:8px"><span>${esc(g.n)}</span><span class="m">nu ${s.cur} · langste ${s.best} weken</span></div><div class="m">Deze week: ${c?`${Math.round(c.tot*10)/10} van ${c.tg}${u}`:'n.v.t.'}</div>${bars(rs.map(r=>r?r.v:null),60,`${g.n}: `+rs.map(r=>r?Math.round(r.v*100)+'%':'n.v.t.').join(', '))}</div>`}).join(''):'<div class="cd s">Nog geen weekdoelen.</div>');
 h+=`<div class="t">Kalender</div><div class="hb" style="justify-content:space-between;align-items:center;margin-bottom:6px"><button class="gear" data-a="ma" data-i="-1" aria-label="Vorige maand">‹</button><span>${fmt(IM+'-01',{month:'long',year:'numeric'})}</span><button class="gear" data-a="ma" data-i="1" aria-label="Volgende maand">›</button></div>`+cal(IM,d=>{const x=d<=t?dstat(d):null;return x?{a:'is',t:Math.round(x.n/x.t*100)+'%',s:x.n===x.t?'l2':x.n?'l1':'',l:`${x.n} van ${x.t} momenten`}:{a:'is',t:'',l:'geen momenten'}},ISD);
 const ms=moments(ISD,1),nn=S.notes.filter(n=>n.link&&n.link.t==='d'&&n.link.id===ISD);
 h+=`<div class="t sel">${fmt(ISD,{weekday:'long',day:'numeric',month:'long'})}</div>`+(ms.length?ms.map(m=>`<div class="cd s">${S.done[m.k]?'✓ Gedaan':'○ Niet gedaan'} · ${esc(m.h.n)}${m.lab?' · '+esc(m.lab.toLowerCase()):m.c>1?` · ${m.i}/${m.c}`:''}</div>`).join('')+`<button class="btn" data-a="id">Deze dag bekijken en corrigeren</button>`:'<div class="cd s">Niet van toepassing: geen momenten gepland.</div>')+nn.map(n=>`<div class="cd s">Notitie: ${esc(n.title||n.text||n.wat)}</div>`).join('');return h}
(async()=>{try{db=await open();S=norm(await kvGet('state')||blank());P=await kvGet('photos')||{}}catch(e){toast('Opslag niet beschikbaar: '+e.message+'. Wijzigingen blijven niet bewaard.',1)}
 render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})})();
