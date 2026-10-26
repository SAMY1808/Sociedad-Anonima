/* ALCALDE — simulador de ciudad isométrico con política satírica */
(()=>{
'use strict';
const N=48,TW=64,TH=32,HW=TW/2,HH=TH/2,SAVE_KEY='alcalde-save-v1';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fmt=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('es-CO');
const num=n=>Math.round(n).toLocaleString('es-CO');
const MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ---------- tipos y herramientas ---------- */
const T={NONE:0,ROAD:1,R:2,C:3,I:4,PARK:5,POLICE:6,FIRE:7,CLINIC:8,SCHOOL:9,COAL:10,SOLAR:11,WATER:12,STATUE:13,HALL:14};
const TOOLS=[
 {id:'pan',n:'Mover',e:'✋',cost:0,g:'Mapa',d:'Arrastra para mover el mapa. Rueda o pellizco para acercar.'},
 {id:'bull',n:'Demoler',e:'🧨',cost:5,g:'Mapa',d:'Derriba edificios, calles y zonas.'},
 {id:'road',n:'Calle',e:'🛣️',cost:15,up:.35,t:T.ROAD,g:'Urbanismo',d:'Las zonas necesitan una calle al lado para crecer. Arrastra para trazar.'},
 {id:'R',n:'Residencial',e:'🏠',cost:8,t:T.R,g:'Urbanismo',d:'Zona de vivienda. Genera población y paga impuestos.'},
 {id:'C',n:'Comercial',e:'🏬',cost:8,t:T.C,g:'Urbanismo',d:'Zona de comercio y oficinas. Da empleo y recauda.'},
 {id:'I',n:'Industrial',e:'🏭',cost:8,t:T.I,g:'Urbanismo',d:'Zona industrial. Mucho empleo, mucha contaminación.'},
 {id:'park',n:'Parque',e:'🌳',cost:60,up:6,t:T.PARK,r:5,g:'Urbanismo',d:'Alegra a los vecinos y limpia el aire. Los ecologistas lo adoran.'},
 {id:'coal',n:'Planta de carbón',e:'⚡',cost:2200,up:220,t:T.COAL,r:9,g:'Servicios',d:'Produce 120 unidades de energía. Barata y sucia.'},
 {id:'solar',n:'Planta solar',e:'☀️',cost:2600,up:60,t:T.SOLAR,g:'Servicios',d:'Produce 45 unidades de energía. Limpia pero cara por vatio.'},
 {id:'water',n:'Torre de agua',e:'🚰',cost:900,up:70,t:T.WATER,g:'Servicios',d:'Abastece 100 unidades de consumo de agua.'},
 {id:'police',n:'Policía',e:'🚓',cost:700,up:130,t:T.POLICE,r:10,g:'Servicios',d:'Reduce el crimen en su radio.'},
 {id:'fire',n:'Bomberos',e:'🚒',cost:600,up:110,t:T.FIRE,r:10,g:'Servicios',d:'Protege de incendios.'},
 {id:'clinic',n:'Clínica',e:'🏥',cost:900,up:150,t:T.CLINIC,r:10,g:'Servicios',d:'Salud pública: sube la felicidad.'},
 {id:'school',n:'Colegio',e:'🏫',cost:800,up:130,t:T.SCHOOL,r:9,g:'Servicios',d:'Educación: sube la felicidad y el valor del suelo.'},
 {id:'statue',n:'Estatua del alcalde',e:'🗿',cost:3500,up:15,t:T.STATUE,g:'Vanidad',d:'Un monumento a tu persona. Sube tu aprobación... y las sospechas de los ecologistas y la prensa.'},
];
const TOOL=Object.fromEntries(TOOLS.map(t=>[t.id,t]));
const BYTYPE={};TOOLS.forEach(t=>{if(t.t)BYTYPE[t.t]=t});
const CAPR=[0,8,22,55],CAPC=[0,5,14,34],CAPI=[0,8,20,45],UNITS=[0,1,2,4];
const ZNAME={[T.R]:'Residencial',[T.C]:'Comercial',[T.I]:'Industrial'};

/* ---------- estado ---------- */
let G=null;
const grid={};            // ter,typ,lvl,sub
const cov={};             // mapas de cobertura
let S={};                 // estadísticas derivadas
let cars=[],modalQueue=[],modalOpen=false;

const FACS={vec:{n:'Vecinos',e:'🏘️',w:.4,d:'Seguridad, servicios, impuestos al hogar'},
            emp:{n:'Empresarios',e:'💼',w:.25,d:'Impuestos de empresa, empleo, burocracia'},
            eco:{n:'Ecologistas',e:'🌿',w:.2,d:'Contaminación, parques, energía limpia'},
            fun:{n:'Funcionarios',e:'🗂️',w:.15,d:'Cobertura de servicios y caja saneada'}};

function newState(opts){
  const seed=(Math.random()*1e9)|0;
  const st={seed,name:opts.city,mayor:opts.mayor,profile:opts.profile,month:0,money:40000,debt:0,personal:0,susp:0,cap:40,loyalty:30,buzz:0,
    tax:{R:9,C:9,I:9},fac:{vec:55,emp:55,eco:55,fun:55},decrees:{},pop:0,speed:1,nextElection:48,terms:0,
    lastEvent:0,recent:[],log:[],milestones:{},opp:pick(['Evaristo Pardo','Cleotilde Ramírez','Aníbal "El Contador" Vega','Doña Mercedes Ospina']),
    lastFiscalia:-99,over:null,bonus:{cr:0},hist:{inc:0,exp:0}};
  if(opts.profile==='tec'){st.money+=15000;st.fac.fun=65;st.cap=30}
  if(opts.profile==='pop'){st.fac.vec=70;st.cap=60;st.money-=8000}
  if(opts.profile==='emp'){st.fac.emp=72;st.personal=12000;st.susp=8;st.fac.eco=45}
  return st;
}
function allocGrid(){
  ['ter','typ','lvl','sub'].forEach(k=>grid[k]=new Uint8Array(N*N));
  ['police','fire','clinic','school','park','poll','crime','lv'].forEach(k=>cov[k]=new Float32Array(N*N));
}
allocGrid();

/* ---------- generación del mapa ---------- */
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function vnoise(x,y,seed){
  const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const h=(a,b)=>{let n=(a*374761393+b*668265263+seed*1274126177)|0;n=(n^(n>>>13))*1274126177|0;return((n^(n>>>16))>>>0)/4294967296};
  const s=t=>t*t*(3-2*t);
  const a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1);
  return a+(b-a)*s(xf)+(c-a)*s(yf)+(a-b-c+d)*s(xf)*s(yf);
}
function genMap(seed){
  allocGrid();
  const c=(N-1)/2;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const d=Math.max(Math.abs(i-c),Math.abs(j-c))/c, dd=Math.hypot(i-c,j-c)/(c*1.2);
    const n=vnoise(i*.11,j*.11,seed)*.6+vnoise(i*.25,j*.25,seed+7)*.2;
    const v=n+Math.pow(d,3)*.55+Math.pow(dd,2)*.15;
    const idx=j*N+i;
    let water=v>.74;
    // río diagonal
    const rv=Math.abs((i-j)*.7+Math.sin(i*.35+seed)*3+9);
    if(rv<1.6 && Math.hypot(i-c,j-c)>7) water=true;
    if(Math.hypot(i-c,j-c)<7) water=false;
    grid.ter[idx]=water?1:0;
    if(!water && vnoise(i*.3+40,j*.3,seed+3)>.62 && Math.random()<.85) grid.ter[idx]=2;
    grid.sub[idx]=(Math.random()*256)|0;
  }
  const hx=Math.round(c),hy=Math.round(c);
  const hi=hy*N+hx;grid.ter[hi]=0;grid.typ[hi]=T.HALL;grid.lvl[hi]=1;
  for(let k=-3;k<=3;k++){ if(k===0)continue; setRoad(hx+k,hy+1); }
  setRoad(hx,hy+1);
}
function setRoad(i,j){const idx=j*N+i;if(grid.ter[idx]===1)return;grid.ter[idx]=0;grid.typ[idx]=T.ROAD;grid.lvl[idx]=0}

/* ---------- utilidades de grilla ---------- */
const inb=(i,j)=>i>=0&&j>=0&&i<N&&j<N;
const typeAt=(i,j)=>inb(i,j)?grid.typ[j*N+i]:-1;
function roadAccess(i,j){
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){ if(!di&&!dj)continue; if(typeAt(i+di,j+dj)===T.ROAD)return true; }
  return false;
}
function hsh(i,j,k){let h=(i*374761393+j*668265263+k*2147483647+(G?G.seed:0))|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296}

/* ---------- recálculo de infraestructura y estadísticas ---------- */
function spread(arr,list,rad,mult){
  for(const [si,sj,k] of list){
    const r=Math.ceil(rad);
    for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){
      const i=si+di,j=sj+dj;if(!inb(i,j))continue;
      const d=Math.hypot(di,dj);if(d>=rad)continue;
      arr[j*N+i]+=(1-d/rad)*mult*k;
    }
  }
}
function recalc(){
  const cnt=new Array(16).fill(0);
  let capR=0,capC=0,capI=0,units=0,zunits=0,zoneTiles=0;
  const src={police:[],fire:[],clinic:[],school:[],park:[],poll:[]};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const idx=j*N+i,t=grid.typ[idx],l=grid.lvl[idx];
    cnt[t]++;
    if(t===T.R){capR+=CAPR[l];units+=UNITS[l];zunits+=UNITS[l]}
    else if(t===T.C){capC+=CAPC[l];units+=UNITS[l];zunits+=UNITS[l]}
    else if(t===T.I){capI+=CAPI[l];units+=UNITS[l];zunits+=UNITS[l];if(l)src.poll.push([i,j,[0,.45,.7,1][l]])}
    else if(t===T.POLICE){src.police.push([i,j,1]);units++}
    else if(t===T.FIRE){src.fire.push([i,j,1]);units++}
    else if(t===T.CLINIC){src.clinic.push([i,j,1]);units++}
    else if(t===T.SCHOOL){src.school.push([i,j,1]);units++}
    else if(t===T.PARK){src.park.push([i,j,1]);}
    else if(t===T.COAL){src.poll.push([i,j,1.1]);}
    else if(t===T.HALL){units+=2}
    if((t===T.R||t===T.C||t===T.I))zoneTiles++;
  }
  const pCap=cnt[T.COAL]*120+cnt[T.SOLAR]*45,wCap=cnt[T.WATER]*100;
  const pRatio=units===0?1:Math.min(1,pCap/units),wRatio=zunits===0?1:Math.min(1,wCap/zunits);
  const eff=(G.money<0?.6:1)*(G.decrees.recorte?.9:1);
  for(const k of ['police','fire','clinic','school','park','poll','crime','lv'])cov[k].fill(0);
  spread(cov.police,src.police,10,.9*eff);spread(cov.fire,src.fire,10,.9*eff);
  spread(cov.clinic,src.clinic,10,.9*eff);spread(cov.school,src.school,9,.9*eff);
  spread(cov.park,src.park,5,1.1);spread(cov.poll,src.poll,8,.7);
  // los parques limpian el aire
  for(let k=0;k<N*N;k++){cov.poll[k]=clamp(cov.poll[k]-cov.park[k]*.35,0,1)}

  const pop=G.pop,workers=pop*.5,jobs=capC+capI;
  const employed=Math.min(workers,jobs),unemp=workers>1?clamp(1-employed/workers,0,1):0;
  // cobertura media sobre residenciales
  let nR=0,aPol=0,aFir=0,aCli=0,aSch=0,aPark=0,aPoll=0;
  for(let k=0;k<N*N;k++){ if(grid.typ[k]===T.R&&grid.lvl[k]>0){nR++;aPol+=Math.min(1,cov.police[k]);aFir+=Math.min(1,cov.fire[k]);aCli+=Math.min(1,cov.clinic[k]);aSch+=Math.min(1,cov.school[k]);aPark+=Math.min(1,cov.park[k]);aPoll+=cov.poll[k]} }
  if(nR){aPol/=nR;aFir/=nR;aCli/=nR;aSch/=nR;aPark/=nR;aPoll/=nR}else{aPol=aFir=aCli=aSch=aPark=0.3}
  const decCrime=(G.decrees.seca?-.1:0)+(G.decrees.alumbrado?.07:0);
  const crime=clamp(.42+unemp*.5-aPol*.75+decCrime+(pop>3000?.04:0),0,1);
  const statue=cnt[T.STATUE]>0;
  let h=.5+.14*aCli+.12*aSch+.08*aFir+.2*aPark-.32*aPoll-.3*crime-.4*unemp-(G.tax.R-9)*.02
        -(1-pRatio)*.5-(1-wRatio)*.4+(statue?.03:0)+(G.decrees.vivienda?.03:0)+(G.decrees.ciclovia?.03:0)+G.buzz*.004;
  if(G.decrees.recorte)h-=.03;
  h=clamp(h,0,1);
  // demanda
  const tx=t=>(G.tax[t]-9)*.03;
  let dR=.28+clamp((jobs-workers)/(jobs+workers+20),-1,1)*.7-tx('R')-(unemp>.12?.3:0)+(G.decrees.vivienda?.15:0)+(h-.5)*.4;
  let dC=clamp((pop*.2-capC)/(pop*.2+10),-1,1)*.8+(pop<20?.15:0)-tx('C');
  let dI=clamp((workers*.45-capI)/(workers*.45+12),-1,1)*.8+.12-tx('I')+(G.decrees.exencion?.2:0);
  const target=capR*(.4+.6*h);
  S={cnt,capR,capC,capI,units,zunits,pCap,wCap,pRatio,wRatio,workers,jobs,employed,unemp,crime,h,aPol,aFir,aCli,aSch,aPark,aPoll,
     dR:clamp(dR,-1,1),dC:clamp(dC,-1,1),dI:clamp(dI,-1,1),target,statue,zoneTiles};
  // valor del suelo y delito por celda
  for(let k=0;k<N*N;k++){
    cov.lv[k]=clamp(.38+cov.park[k]*.28+cov.school[k]*.16+cov.clinic[k]*.1+cov.police[k]*.1-cov.poll[k]*.5,0,1);
    cov.crime[k]=clamp(.45-cov.police[k]*.8+unemp*.4,0,1);
  }
  S.approval=approval();
}
function approval(){
  let a=0;for(const k in FACS)a+=G.fac[k]*FACS[k].w;
  a+=G.buzz*.5+(G.decrees.propaganda?5:0);
  if(G.susp>40)a-=(G.susp-40)*.28;
  return clamp(a,0,100);
}

/* ---------- construcción ---------- */
function toast(m,bad){const box=$('#toasts');while(box.children.length>=3)box.firstChild.remove();const d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=m;$('#toasts').appendChild(d);setTimeout(()=>d.remove(),2600)}
function applyTool(tool,i,j,sim){
  const idx=j*N+i;
  if(!inb(i,j)||grid.ter[idx]===1)return 0;
  const cur=grid.typ[idx];
  if(cur===T.HALL)return 0;
  if(tool.id==='bull'){
    if(cur===T.NONE&&grid.ter[idx]!==2)return 0;
    if(!sim){ if(G.money<tool.cost){return -1} G.money-=tool.cost; grid.typ[idx]=T.NONE;grid.lvl[idx]=0;grid.ter[idx]=0; }
    return tool.cost;
  }
  if(!tool.t)return 0;
  const isZone=tool.t===T.R||tool.t===T.C||tool.t===T.I;
  if(cur===tool.t&&(isZone||tool.t===T.ROAD))return 0;
  if(cur!==T.NONE&&!(isZone&&(cur===T.R||cur===T.C||cur===T.I)))return 0;
  if(!sim){
    if(G.money<tool.cost)return -1;
    G.money-=tool.cost;grid.typ[idx]=tool.t;grid.lvl[idx]=0;grid.ter[idx]=0;grid.sub[idx]=(Math.random()*256)|0;
  }
  return tool.cost;
}

/* ---------- decretos ---------- */
const DECREES=[
 {id:'vivienda',n:'Subsidio de vivienda',cap:12,d:'Más demanda residencial y vecinos contentos. Cuesta caja cada mes.',pro:'Los vecinos aplauden; los empresarios hablan de "populismo".'},
 {id:'exencion',n:'Exenciones a la industria',cap:14,d:'Más demanda industrial; empresarios felices, ecologistas furiosos. Reduce el recaudo.',pro:'"Es inversión, no regalo", aclara tu secretario de hacienda.'},
 {id:'seca',n:'Ley seca nocturna',cap:10,d:'Baja el crimen. A nadie le gusta y a los empresarios menos.',pro:'La ciudad duerme más temprano. Y de mal humor.'},
 {id:'propaganda',n:'Pauta oficial en medios',cap:8,d:'+Aprobación constante. Cuesta caja y levanta sospechas.',pro:'Curiosamente, todos los periódicos te adoran.'},
 {id:'recorte',n:'Plan de austeridad',cap:12,d:'Ahorra caja cada mes. Funcionarios y vecinos sufren; los servicios rinden menos.',pro:'"Hacer más con menos", dices sin sonrojarte.'},
 {id:'ciclovia',n:'Ciclovías y peatonalización',cap:12,d:'Ecologistas felices y vecinos algo más. Cuesta caja; a los comerciantes no les gusta.',pro:'Los ciclistas te dedican un himno. Los taxistas, otro.'},
 {id:'alumbrado',n:'Concesionar el alumbrado a "Luminarias del Cuñado S.A."',cap:10,once:true,d:'+$9.000 ahora. Sube el crimen para siempre y la Fiscalía te mira.',pro:'La concesión es por 30 años. Tu cuñado ya compró lancha.'},
];
const DEC=Object.fromEntries(DECREES.map(d=>[d.id,d]));

/* ---------- eventos ---------- */
const sc=()=>clamp(1+G.pop/1500,1,7);
const $$=n=>Math.round(n*sc()/50)*50;
const E={money:n=>{G.money+=n},fac:(k,n)=>{G.fac[k]=clamp(G.fac[k]+n,0,100)},susp:n=>{G.susp=clamp(G.susp+n,0,120)},cap:n=>{G.cap=clamp(G.cap+n,0,100)},own:n=>{G.personal+=n},buzz:n=>{G.buzz=clamp(G.buzz+n,-15,25)},loy:n=>{G.loyalty=clamp(G.loyalty+n,0,100)}};
const randTiles=(cond,n)=>{const out=[];for(let k=0;k<400&&out.length<n;k++){const i=(Math.random()*N)|0,j=(Math.random()*N)|0;if(cond(grid.typ[j*N+i],grid.lvl[j*N+i]))out.push([i,j])}return out};
function damage(n,types){
  const t=randTiles((ty,l)=>types.includes(ty)&&l>0,n);
  t.forEach(([i,j])=>{grid.lvl[j*N+i]=Math.max(0,grid.lvl[j*N+i]-1)});
  return t.length;
}
const EVENTS=[
 {id:'contrato',w:1.2,min:80,t:'Una obra con "amigos"',x:'Los Hermanos Cemento & Hijos te invitan a almorzar. Quieren la próxima licitación y traen un sobre manila. "Es solo un detalle, alcalde."',
  o:[{l:'Aceptar el sobre',s:'Platica fácil, riesgo difícil',f:()=>{E.own($$(5000));E.susp(12);E.fac('emp',6);E.money(-$$(1500));return 'La obra sale carísima, pero tu cuenta en Andorra agradece.'}},
     {l:'Licitación transparente',s:'Lenta y aburrida',f:()=>{E.money(-$$(600));E.fac('fun',4);E.cap(3);return 'Nadie te lo agradece, pero duermes tranquilo.'}},
     {l:'Rechazarlo y tuitearlo',s:'Indignación pública',f:()=>{E.fac('vec',5);E.fac('emp',-6);E.buzz(2);return 'Tu tuit se hace viral. Los constructores te vetan.'}}]},
 {id:'basura',w:1,min:150,t:'Huelga de recolectores',x:'La basura se acumula en las esquinas. El sindicato exige nivelación salarial y tú tienes poca caja.',
  o:[{l:'Ceder a sus exigencias',s:'Costoso',f:()=>{E.money(-$$(2500));E.fac('fun',10);E.fac('emp',-3);return 'Se acaba la huelga. Los demás gremios toman nota.'}},
     {l:'Contratar esquiroles',s:'Mano dura',f:()=>{E.fac('vec',-6);E.fac('fun',-12);E.cap(5);return 'La basura se va, el rencor se queda.'}},
     {l:'Negociar con café y tiempo',s:'Gasta capital político',f:()=>{E.cap(-8);E.money(-$$(1000));E.fac('fun',4);return 'Tras 14 reuniones, un acuerdo que nadie entiende.'}}]},
 {id:'periodista',w:1.3,min:100,c:()=>G.susp>=14,t:'Un periodista curioso',x:'Una reportera publicó fotos de tu cena en el restaurante más caro de la región. Pagada con la caja menor.',
  o:[{l:'Comprarle pauta publicitaria',s:'Dinero caliente',f:()=>{E.money(-$$(2000));E.susp(-10);E.buzz(1);return 'De pronto su periódico te encuentra encantador.'}},
     {l:'Demandarla por injuria',s:'Muy mal look',f:()=>{E.cap(-8);E.fac('vec',-5);E.susp(4);return 'Ahora la prensa internacional también te investiga.'}},
     {l:'Declarar que fue "una reunión de trabajo"',s:'Clásico',f:()=>{if(Math.random()<.5){E.susp(-3);return 'Cuela. Por esta vez.'}E.susp(8);E.fac('vec',-4);return 'Nadie te cree y te mandan un meme con tu cara.'}}]},
 {id:'cunado',w:.8,min:60,t:'Tu cuñado necesita trabajo',x:'En la cena familiar tu cuñado Wilmer insiste: "Un puestico de nada, hermano". Sabe cosas de ti.',
  o:[{l:'Nombrarlo secretario de Cultura',s:'Paz familiar',f:()=>{E.susp(6);E.fac('fun',-6);E.cap(6);return 'Wilmer inaugura una exposición de cuadros suyos. Con tu presupuesto.'}},
     {l:'Decirle que no',s:'Cena incómoda',f:()=>{E.cap(-5);return 'Wilmer no te habla. Mejor así.'}}]},
 {id:'fabrica',w:1,min:200,t:'Fábrica en el parque',x:'Un empresario quiere construir una planta justo al lado del parque y promete "400 empleos" y un generoso aporte de campaña.',
  o:[{l:'Aprobarla',s:'+Empleo, +caja, -aire',f:()=>{E.money($$(5000));E.fac('eco',-12);E.fac('emp',8);E.susp(5);return 'Se corta la cinta y también un par de árboles.'}},
     {l:'Negarla',s:'Ganas ecologistas',f:()=>{E.fac('emp',-7);E.fac('eco',5);return 'El empresario amenaza con irse a "la ciudad vecina".'}}]},
 {id:'apagon',w:1.5,min:100,c:()=>S.pRatio<.97,t:'Apagón en plena final',x:'Se fue la luz durante el partido de la selección. La ciudad entera te culpa con razón.',
  o:[{l:'Culpar al alcalde anterior',s:'Siempre funciona un poco',f:()=>{E.fac('vec',-3);E.cap(-2);return 'Tu antecesor, desde su finca, niega todo.'}},
     {l:'Disculparte y comprar generadores',s:'Costoso',f:()=>{E.money(-$$(2500));E.fac('vec',3);return 'La gente valora que por una vez no hables de herencias.'}}]},
 {id:'concierto',w:1,min:150,t:'Concierto de reguetón en la plaza',x:'Un cantante famoso quiere hacer un concierto gratis en la plaza principal. Los patrocinadores sonríen. Los vecinos, menos.',
  o:[{l:'Autorizarlo',s:'Ruido, fiesta, caja',f:()=>{E.money($$(2500));E.fac('vec',7);E.fac('emp',3);E.buzz(2);return 'Tres días de fiesta y 1.200 quejas por ruido.'}},
     {l:'Prohibirlo',s:'Aguafiestas oficial',f:()=>{E.fac('vec',-6);E.fac('emp',-3);return 'Tu foto aparece en memes con el título "Paco, el aburrido".'}}]},
 {id:'cinta',w:1,min:150,t:'Inauguración de la obra inconclusa',x:'La obra faraónica no está terminada pero las elecciones se acercan. ¿Cortas la cinta frente a las cámaras?',
  o:[{l:'Cortar la cinta igual',s:'Foto con casco',f:()=>{E.buzz(5);E.fac('vec',5);if(Math.random()<.4){E.fac('vec',-9);E.susp(4);return 'Se cae un pedazo de andamio. Entre risas, claro.'}return 'La obra queda "operativa". Es un decir.'}},
     {l:'Esperar a que esté lista',s:'Prudente',f:()=>{E.fac('vec',-3);return 'La oposición se burla de tu lentitud.'}}]},
 {id:'contraloria',w:1.5,min:100,c:()=>G.susp>=25,t:'Auditoría de la Contraloría',x:'Llega una comisión a revisar las cuentas del municipio. Tu contador suda frío.',
  o:[{l:'Maquillar los libros',s:'Contador creativo',f:()=>{E.money(-$$(3000));if(Math.random()<.65){E.susp(-15);return 'Todo cuadra al centavo. Qué casualidad.'}E.susp(16);E.fac('vec',-4);return 'Los números no cuadran y se nota.'}},
     {l:'Colaborar con la auditoría',s:'Riesgoso pero limpio',f:()=>{E.susp(-6);E.fac('fun',-2);E.cap(-3);return 'Salen hallazgos menores. Prometes "revisarlos".'}}]},
 {id:'pan',w:1,min:200,t:'Protesta por el precio del pan',x:'Los panaderos suben precios y la gente sale con ollas a la calle.',
  o:[{l:'Subsidiar el pan',s:'Cuesta caja',f:()=>{E.money(-$$(2500));E.fac('vec',9);return 'El pan cuesta lo mismo y tu popularidad sube un poco.'}},
     {l:'"Que coman pastel"',s:'Frase desafortunada',f:()=>{E.fac('vec',-10);E.buzz(-3);return 'Se hace tendencia. No como esperabas.'}},
     {l:'Culpar al clima',s:'Meteorología política',f:()=>{E.fac('vec',-3);return 'Nadie te cree, pero al menos nadie te responsabiliza oficialmente.'}}]},
 {id:'lluvia',w:1,min:200,t:'Lluvias torrenciales',x:'Se desbordan las alcantarillas. Los "estudios" que prometiste el año pasado nunca se hicieron.',
  o:[{l:'Limpiar alcantarillas ya',s:'Gasto de emergencia',f:()=>{E.money(-$$(2000));E.fac('vec',2);return 'La ciudad aguanta con ayuda del cielo.'}},
     {l:'Improvisar con sacos de arena',s:'Barato',f:()=>{const n=damage(4,[T.R,T.C]);E.fac('vec',-5);return `Se inundan ${n} edificios. Dices que fue "un evento atípico".`}}]},
 {id:'fiesta',w:.9,min:100,t:'Fiesta patronal',x:'Llega la fiesta del santo patrón. Hay que pagar tarima, pólvora y reina de belleza.',
  o:[{l:'Hacerla por todo lo alto',s:'Caja y alegría',f:()=>{E.money(-$$(1500));E.fac('vec',8);E.buzz(2);return 'Bailas hasta las 4. Los medios lo grababan todo.'}},
     {l:'Cancelarla por austeridad',s:'Ahorras, pierdes cariño',f:()=>{E.money($$(1000));E.fac('vec',-5);return 'El cura te excomulga en la homilía.'}}]},
 {id:'ong',w:1,min:150,c:()=>S.cnt[T.COAL]>0||S.capI>40,t:'Ecologistas encadenados a un árbol',x:'Un grupo de activistas se ha encadenado a un árbol que iba a talarse para ampliar una calle.',
  o:[{l:'Reunirte con ellos',s:'Gasta capital político',f:()=>{E.cap(-4);E.fac('eco',8);E.fac('emp',-2);return 'Te toman una foto abrazando un roble. Funciona.'}},
     {l:'Mandar al ESMAD',s:'Fuerza bruta',f:()=>{E.fac('eco',-12);E.fac('vec',-3);E.susp(3);return 'Un video te hace quedar como villano de película.'}},
     {l:'Plantar un arbolito y hacer foto',s:'Barato, tibio',f:()=>{E.money(-$$(300));E.fac('eco',3);return 'El árbol muere a las dos semanas.'}}]},
 {id:'palomas',w:.8,min:80,t:'Plaga de palomas',x:'Miles de palomas toman la plaza principal. Hay un caballero que insiste en alimentarlas.',
  o:[{l:'Contratar halcones',s:'Elegante, costoso',f:()=>{E.money(-$$(900));E.fac('vec',3);E.fac('eco',-2);return 'Los halcones cumplen. Los ecologistas, indignados.'}},
     {l:'Ignorarlas',s:'Ya pasará',f:()=>{E.fac('vec',-3);return 'Una paloma anida en tu despacho.'}},
     {l:'Erigir una estatua a la paloma',s:'Gasto de moda',f:()=>{E.money(-$$(1500));E.fac('vec',4);E.fac('eco',2);return 'Se convierte en atracción turística. Y en baño de palomas.'}}]},
 {id:'cumbre',w:.9,min:200,t:'Cumbre internacional de alcaldes',x:'Te invitan a una cumbre sobre "ciudades resilientes" en una playa lejana. Todo pago por el municipio.',
  o:[{l:'Viajar "por trabajo"',s:'Con acompañante',f:()=>{E.cap(10);E.susp(5);E.fac('vec',-3);return 'Vuelves bronceado, con contactos útiles y cero propuestas.'}},
     {l:'Enviar un video',s:'Austero',f:()=>{E.cap(-2);E.fac('fun',2);return 'Dices cosas muy bonitas en 4K desde tu despacho.'}}]},
 {id:'donacion',w:1,min:150,t:'Donación a la campaña',x:'Un magnate de la región ofrece financiarte la reelección. "Sin condiciones", dice... en voz baja.',
  o:[{l:'Aceptarla',s:'Con "condiciones"',f:()=>{E.own($$(3500));E.money($$(2500));E.fac('emp',8);E.susp(9);return 'El señor ya pidió que le cambien la norma de usos del suelo.'}},
     {l:'Rechazarla',s:'Ético y pobre',f:()=>{E.fac('vec',3);E.cap(2);return 'Nadie lo notó, salvo tu tesorero.'}}]},
 {id:'rival',w:.8,min:200,t:'El rival se lanza',x:`${'__OPP__'} anuncia una campaña "por una ciudad distinta". Su único programa es tu fotografía con cara de susto.`,
  o:[{l:'Contraatacar con videos',s:'Cuesta capital político',f:()=>{E.cap(-6);E.fac('vec',3);E.buzz(2);return 'Tus videos tienen 400 vistas, 380 de tu equipo.'}},
     {l:'Ignorarlo con elegancia',s:'Prudencia',f:()=>{E.fac('vec',-2);return 'El rival sube en las encuestas. Un poquito.'}}]},
 {id:'banco',w:.9,min:100,c:()=>G.debt<30000,t:'El banco te ofrece plata fácil',x:'"Préstamos Hermanos & Asociados" te propone $15.000 sin papeleo. La letra pequeña es muy pequeña.',
  o:[{l:'Aceptar el crédito',s:'Caja ya, deuda después',f:()=>{E.money(15000);G.debt+=15000;E.susp(2);return 'El interés mensual del 1,2% ya te saluda.'}},
     {l:'Declinar',s:'Sensato',f:()=>{return 'Los hermanos se van a ofrecérselo al pueblo vecino.'}}]},
 {id:'smart',w:.8,min:300,t:'Consultoría "Ciudad Inteligente"',x:'Una consultora extranjera te vende un plan de "ciudad inteligente" con muchas diapositivas y ningún sensor.',
  o:[{l:'Contratar el plan',s:'Humo premium',f:()=>{E.money(-$$(4000));E.fac('emp',6);E.fac('vec',3);E.buzz(2);E.own($$(500));return 'Aparecen en tu escritorio tres pendones y una app que no abre.'}},
     {l:'Decir que no hace falta',s:'Aburrido',f:()=>{E.fac('emp',-2);return 'Ahorras. Nadie te lo reconoce.'}}]},
 {id:'ratas',w:.7,min:200,t:'Ratas en la plaza de mercado',x:'Los vendedores denuncian que hay ratas del tamaño de gatos. Algunos juran que ya hay gatos del tamaño de ratas.',
  o:[{l:'Fumigar',s:'Barato y efectivo',f:()=>{E.money(-$$(700));E.fac('vec',3);return 'La plaza queda impecable por tres semanas.'}},
     {l:'Declarar que son "fauna local"',s:'Creativo',f:()=>{E.fac('eco',3);E.fac('vec',-5);return 'Una ONG te nombra "defensor honorario de los roedores".'}}]},
];
function eventFor(){
  const el=EVENTS.filter(e=>(!e.min||G.pop>=e.min)&&(!e.c||e.c())&&!G.recent.includes(e.id));
  if(!el.length)return null;
  let tot=el.reduce((a,e)=>a+e.w,0),r=Math.random()*tot;
  for(const e of el){r-=e.w;if(r<=0)return e}
  return el[0];
}

/* ---------- simulación mensual ---------- */
function grow(){
  const types=[[T.R,S.dR,CAPR],[T.C,S.dC,CAPC],[T.I,S.dI,CAPI]];
  const power=S.pCap>0&&S.wCap>0&&S.pRatio>=.9&&S.wRatio>=.9;
  for(const [t,dem] of types){
    const tiles=[];
    for(let k=0;k<N*N;k++)if(grid.typ[k]===t)tiles.push(k);
    if(!tiles.length)continue;
    const tries=Math.max(2,Math.ceil(tiles.length*.35));
    for(let a=0;a<tries;a++){
      const k=pick(tiles),i=k%N,j=(k/N)|0,l=grid.lvl[k];
      if(!roadAccess(i,j))continue;
      if(dem<-.15&&l>0&&Math.random()<-dem*.3){grid.lvl[k]=l-1;continue}
      if(!power)continue;
      if(l===0){ if(dem>0&&Math.random()<dem*.85+.08)grid.lvl[k]=1 }
      else if(l<3){
        const lv=cov.lv[k],thr=t===T.I?[0,.25,.35]:[0,.46,.62];
        if(dem>.08&&lv>thr[l]&&Math.random()<dem*.45)grid.lvl[k]=l+1;
      }
    }
  }
}
function finance(){
  const infl=1+.02*Math.floor(G.month/12);
  let up=0;
  for(let k=0;k<N*N;k++){const t=BYTYPE[grid.typ[k]];if(t&&t.up)up+=t.up}
  const eff=S.employed*G.tax.R*.58;
  let incR=eff,incC=S.capC*G.tax.C*1.0*(.6+.4*S.h),incI=S.capI*G.tax.I*1.05;
  if(G.decrees.exencion)incI*=.6;
  let inc=incR+incC+incI;
  const admin=(110+G.pop*.55);
  let dec=0;
  if(G.decrees.vivienda)dec+=300+G.pop*.08;
  if(G.decrees.propaganda)dec+=500+G.pop*.04;
  if(G.decrees.ciclovia)dec+=200+G.pop*.04;
  if(G.decrees.recorte)dec-=G.pop*.12+80;
  const interest=G.debt*.012;
  const exp=(up+admin+dec)*infl+interest;
  G.hist={inc,exp,incR,incC,incI,up:up*infl,admin:admin*infl,dec:dec*infl,interest};
  G.money+=inc-exp;
}
function politics(){
  const targ={};
  // vecinos
  targ.vec=S.h*100-(G.tax.R-9)*1.2+(G.decrees.vivienda?8:0)-(G.decrees.seca?6:0)+(G.decrees.ciclovia?2:0)-(G.decrees.recorte?5:0)-(S.crime>.5?10:0);
  // empresarios
  targ.emp=62-(G.tax.C+G.tax.I-18)*2.3+(S.jobs>S.workers?6:-4)-(S.pRatio<.95?12:0)-(S.wRatio<.95?8:0)+(G.decrees.exencion?16:0)-(G.decrees.seca?6:0)-(G.decrees.ciclovia?4:0)+(G.decrees.alumbrado?4:0)+(G.decrees.vivienda?-4:0);
  // ecologistas
  targ.eco=72-S.aPoll*140+S.aPark*30+S.cnt[T.SOLAR]*5-S.cnt[T.COAL]*7-(G.decrees.exencion?12:0)+(G.decrees.ciclovia?16:0)-(S.statue?6:0)-(S.capI>S.capR?6:0);
  // funcionarios
  targ.fun=45+(S.aPol+S.aFir+S.aCli+S.aSch)*13-(G.money<0?25:0)-(G.decrees.recorte?18:0)+(G.decrees.propaganda?3:0);
  for(const k in targ){G.fac[k]=clamp(G.fac[k]+(clamp(targ[k],0,100)-G.fac[k])*.14,0,100)}
  if(S.statue){G.fac.vec=clamp(G.fac.vec+.3,0,100)}
  G.buzz*=.9;
  G.susp=clamp(G.susp-.7-(G.decrees.propaganda?-.5:0),0,120);
  if(G.decrees.alumbrado)G.susp=clamp(G.susp+.2,0,120);
  G.cap=clamp(G.cap+.5+(S.approval-50)*.02,0,100);
  S.approval=approval();
}
function popUpdate(){
  G.pop+=(S.target-G.pop)*.28;
  if(Math.abs(S.target-G.pop)<.5)G.pop=S.target;
}
function milestones(){
  const M=[[100,'Aldea','Tu aldea ya merece un letrero con tu nombre.'],[600,'Pueblo','Pueblo de 600 almas y al menos 2.000 opiniones.'],[2000,'Ciudad','¡Ya eres alcalde de una ciudad! El presupuesto crece, y las tentaciones también.'],[5000,'Gran ciudad','Gran ciudad: ya hay tráfico, protestas y un concejal que te odia.'],[10000,'Metrópoli','Una metrópoli. Tu retrato oficial ya merece marco dorado.']];
  for(const [p,n,m] of M){ if(G.pop>=p&&!G.milestones[p]){G.milestones[p]=1;E.cap(8);addLog('🏙️ '+m);queueModal({kick:'Hito urbano',title:`${G.name} es ya una ${n.toLowerCase()}`,text:m+' (+8 capital político)',opts:[{l:'Seguir gobernando'}]}) } }
}
function addLog(m){G.log.unshift(`${MESES[G.month%12]} ${2027+Math.floor(G.month/12)}: ${m}`);G.log.length=Math.min(G.log.length,40);$('#tickerTxt').textContent=m}
function disasters(){
  if(Math.random()<.04&&S.units>25){
    const cover=(S.aFir||0);
    if(Math.random()>cover*.8){
      const n=damage(2+((Math.random()*3)|0),[T.R,T.C,T.I]);
      if(n)addLog(`🔥 Incendio: se queman ${n} edificios${S.cnt[T.FIRE]?'':' (¡ni un solo cuartel de bomberos!)'}.`);
      if(n)E.fac('vec',-4);
    }else addLog('🚒 Un incendio fue controlado a tiempo por tus bomberos.');
  }
}
function newsLine(){
  const L=[];
  const a=S.approval;
  if(S.crime>.55)L.push('Alcalde asegura que la inseguridad es "una percepción".');
  if(S.aPoll>.35)L.push('Vecinos usan mascarilla desde antes de que se pusiera de moda.');
  if(S.pRatio<.95)L.push('Racionamiento de energía: "Aprovechen para leer a la luz de las velas", sugiere alcalde.');
  if(S.wRatio<.95)L.push('Cortes de agua: el alcalde propone "bañarse en equipo".');
  if(S.unemp>.2)L.push('Desempleo en aumento; alcalde lanza el programa "Emprende tú mismo".');
  if(G.money<0)L.push('Caja en rojo: tesorero pide que "no se hagan ruidos fuertes cerca de los bancos".');
  if(G.susp>30)L.push('Concejal pregunta de dónde salió la nueva camioneta del alcalde.');
  if(G.susp>55)L.push('Fiscalía "solo pide unos papelitos" a la alcaldía. Cuarenta cajas de papelitos.');
  if(a>70)L.push('Encuesta: alcalde con 70% de aprobación. Su mamá estaba entre los encuestados.');
  if(a<40)L.push('Alcalde dice que las encuestas "son como los termómetros: miden, pero no mandan".');
  if(G.decrees.propaganda)L.push('Insólito: el 100% de los editoriales de hoy elogian la gestión municipal.');
  if(S.statue)L.push('La estatua del alcalde ya tiene su propio grupo de Facebook (con 3 miembros: ella misma, él y su hijo).');
  if(G.pop>1000)L.push('Alcalde inaugura rotonda. La anterior, también.');
  if(S.cnt[T.PARK]>=3)L.push('Perros felices: la ciudad estrena parques... y bolsas para sus necesidades, por ahora no.');
  if(S.cnt[T.COAL]>0)L.push('Chimenea de la termoeléctrica es declarada "monumento al progreso" por el alcalde.');
  L.push('Concejo aprueba por unanimidad cambiar el nombre de una calle. De nuevo.');
  L.push('Se inaugura la calle 14, la tercera con ese nombre.');
  L.push('Alcalde promete "mano firme con corazón grande" y deja confusos a los gestores de campaña.');
  L.push('Los semáforos municipales por fin funcionan: en verde para todos, a la vez.');
  L.push('Una paloma se posa sobre la cabeza del alcalde durante el discurso. Fotos virales.');
  return pick(L);
}
function step(){
  G.month++;
  recalc();
  grow();
  finance();
  politics();
  popUpdate();
  recalc();
  disasters();
  milestones();
  if(G.month%2===0)addLog(newsLine());
  // eventos
  if(!modalOpen&&G.month-G.lastEvent>=3&&Math.random()<.26){
    const ev=eventFor();
    if(ev){G.lastEvent=G.month;G.recent.push(ev.id);if(G.recent.length>9)G.recent.shift();showEvent(ev)}
  }
  // fiscalía
  if(G.susp>=70&&G.month-G.lastFiscalia>=6){G.lastFiscalia=G.month;showFiscalia()}
  if(G.susp>=100)return endGame('destituido');
  if(G.money<-30000)return endGame('quiebra');
  if(G.month>=G.nextElection)return election();
  if(G.month%12===0){save();toast('💾 Partida guardada')}
  refreshUI();
}

/* ---------- elecciones ---------- */
function election(){
  recalc();
  const a=approval();
  const share=clamp(a*.93+4+rnd(-5,5),15,85);
  const win=share>=50;
  G.speed=0;
  const bar=`<div class="vote"><i style="width:${share}%"></i><u></u></div><small>Tú ${share.toFixed(1)}% · ${G.opp} ${(100-share).toFixed(1)}%</small>`;
  if(win){
    G.terms++;G.nextElection+=48;E.cap(18);E.buzz(0);
    G.fac.vec=clamp(G.fac.vec+4,0,100);
    addLog(`🗳️ Reelegido con ${share.toFixed(1)}%.`);
    queueModal({kick:`Elecciones · Año ${Math.floor(G.month/12)}`,title:'¡Reelegido, señor alcalde!',html:`<div class="big">${share.toFixed(1)}%</div>${bar}<p>${G.opp} reconoce su derrota "con las reservas del caso". Obtienes +18 de capital político y otros cuatro años para gobernar.</p>`,opts:[{l:'Otros cuatro años'}]});
    refreshUI();
  }else{
    endGame('elecciones',bar,share);
  }
}
function endGame(kind,bar,share){
  G.over=kind;G.speed=0;
  try{localStorage.removeItem(SAVE_KEY)}catch(e){}
  const fort=G.personal,nm=G.mayor;
  const T_={
    elecciones:{t:'Perdiste las elecciones',x:`${G.opp} gana con ${(100-(share||40)).toFixed(1)}%. Te vas con ${fmt(fort)} en tu cuenta personal y una oficina en la esquina que "no tiene nada que ver con tu gestión".`},
    destituido:{t:'Destituido e inhabilitado',x:`La Procuraduría concluye que las "cajas menores" eran cajas mayores. Te inhabilitan por 12 años. Tu cuñado Wilmer asume como alcalde encargado. Tu fortuna: ${fmt(fort)} (pendiente de embargo).`},
    quiebra:{t:'Quiebra municipal',x:`La ciudad no puede pagar sus deudas y el gobierno central interviene la alcaldía. Sales con la dignidad intacta y ${fmt(fort)} a salvo. En otra cuenta.`}}[kind];
  const q=Math.round(G.terms*100+G.pop/10+Math.max(0,fort)/500);
  queueModal({kick:'Fin del mandato',title:T_.t,html:(bar||'')+`<p>${T_.x}</p><p><b>Balance:</b> ${num(G.pop)} habitantes · ${G.terms} reelecciones · ${Math.floor(G.month/12)} años en el cargo<br><b>Puntaje de gestión:</b> ${q}</p>`,opts:[{l:'Nueva partida',f:()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}startScreen()}}],final:true});
  refreshUI();
}

/* ---------- modales ---------- */
function queueModal(m){modalQueue.push(m);if(!modalOpen)nextModal()}
function nextModal(){
  const m=modalQueue.shift();
  if(!m){modalOpen=false;$('#modal').classList.add('hidden');return}
  modalOpen=true;
  const card=$('#modalCard');
  card.innerHTML=`<div class="kick">${m.kick||''}</div><h2>${m.title}</h2>${m.html||`<p>${m.text||''}</p>`}${m.result?`<p class="res">${m.result}</p>`:''}<div id="mopts"></div>`;
  const box=$('#mopts');
  (m.opts||[]).forEach(o=>{
    const b=document.createElement('button');b.className=(m.final||!o.s)?'go':'opt';
    b.innerHTML=o.l+(o.s?`<small>${o.s}</small>`:'');
    b.onclick=()=>{
      let res='';
      if(o.f)res=o.f()||'';
      if(m.event){addLog(res||m.event.t);
        card.innerHTML=`<div class="kick">${m.kick}</div><h2>${m.title}</h2><p class="res">${res}</p><button class="go">Continuar</button>`;
        card.querySelector('.go').onclick=()=>{refreshUI();nextModal()};refreshUI();return}
      refreshUI();nextModal();
    };
    box.appendChild(b);
  });
  $('#modal').classList.remove('hidden');
}
function showEvent(ev){
  queueModal({kick:'Despacho del alcalde',title:ev.t,text:ev.x.replace('__OPP__',G.opp),event:ev,opts:ev.o.map(o=>({l:o.l,s:o.s,f:o.f}))});
}
function showFiscalia(){
  queueModal({kick:'¡Alerta judicial!',title:'La Fiscalía toca la puerta',text:'Un fiscal con cara de pocos amigos te entrega una citación. Preguntan por "ciertos contratos", "ciertas cuentas" y "cierto cuñado".',event:{t:'Fiscalía'},
   opts:[{l:'Contratar al mejor abogado',s:'$6.000 · reduce las sospechas',f:()=>{E.money(-6000);E.susp(-25);return 'El abogado llega con una sonrisa y una factura de seis cifras.'}},
         {l:'Entregar a tu secretario como chivo expiatorio',s:'Sin costo, con culpa',f:()=>{E.susp(-30);E.fac('fun',-12);E.cap(-8);return 'Tu secretario renuncia llorando. Tú también. Por televisión.'}},
         {l:'No responder y esperar',s:'Una decisión audaz',f:()=>{E.susp(12);return 'La Fiscalía toma tu silencio como un "sí, claro".'}}]});
}

/* ---------- acciones del jugador (panel) ---------- */
function act(a,arg){
  if(G.over)return;
  if(a==='lunch'){ if(G.money<1500)return toast('Sin fondos',1); E.money(-1500);E.loy(12);E.susp(1);toast('Los concejales salen de buen humor (y con docena de empanadas)') }
  if(a==='press'){ if(G.cap<5)return toast('Falta capital político',1); if(G.money<800)return toast('Sin fondos',1); E.cap(-5);E.money(-800);E.buzz(6);toast('Rueda de prensa exitosa: nadie preguntó lo importante') }
  if(a==='skim'){ if(G.money<4000)return toast('No hay caja que desviar',1); const x=Math.round(G.money*.1);E.money(-x);E.own(x);E.susp(12);toast(`Desvías ${fmt(x)} a una cuenta lejana`) }
  if(a==='loan'){ if(G.debt>=90000)return toast('El banco ya no te presta más',1);G.money+=10000;G.debt+=10000;toast('Préstamo recibido: +$10.000') }
  if(a==='pay'){ const x=Math.min(10000,G.debt); if(G.money<x||x<=0)return toast(x<=0?'No debes nada':'Sin fondos',1);G.money-=x;G.debt-=x;toast('Abonas a la deuda') }
  if(a==='decree'){
    const d=DEC[arg];
    if(G.decrees[arg]&&d.once)return toast('Esa concesión es irrevocable (30 años)',1);
    if(G.decrees[arg]){delete G.decrees[arg];toast(`Derogado: ${d.n}`);recalc();refreshUI();return}
    if(G.cap<d.cap)return toast(`Necesitas ${d.cap} de capital político`,1);
    // votación del concejo
    const p=clamp(.3+G.loyalty/220+(S.approval-50)/220,.1,.9);
    let yes=0;for(let k=0;k<15;k++)if(Math.random()<p)yes++;
    if(yes<8){E.cap(-Math.ceil(d.cap/2));toast(`Concejo rechaza "${d.n}" (${yes}–${15-yes})`,1);addLog(`🗳️ El concejo hunde tu decreto «${d.n}» ${yes}–${15-yes}.`);refreshUI();return}
    E.cap(-d.cap);G.decrees[arg]=1;
    if(arg==='alumbrado'){E.money(9000);E.susp(10)}
    toast(`Aprobado (${yes}–${15-yes}): ${d.n}`);addLog(`📜 ${d.pro}`);
  }
  recalc();refreshUI();
}

/* ---------- render ---------- */
const cv=$('#map'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1;
const cam={x:0,y:0,z:1};
let night=0,TNOW=0,OX=0,OY=0,lights=[],curIdx=0;
const X=(u,v)=>OX+(u-v)*HW,Y=(u,v)=>OY+(u+v)*HH;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR}
const shade=(c,f)=>`rgb(${Math.min(255,c[0]*f)|0},${Math.min(255,c[1]*f)|0},${Math.min(255,c[2]*f)|0})`;
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function poly(fill,...p){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let k=2;k<p.length;k+=2)ctx.lineTo(p[k],p[k+1]);ctx.closePath();ctx.fill()}
function prism(u0,v0,u1,v1,h,c,z=0){
  const ax=X(u0,v0),ay=Y(u0,v0)-z,bx=X(u1,v0),by=Y(u1,v0)-z,cx=X(u1,v1),cy=Y(u1,v1)-z,dx=X(u0,v1),dy=Y(u0,v1)-z;
  poly(shade(c,.88),dx,dy,cx,cy,cx,cy-h,dx,dy-h);
  poly(shade(c,.6),cx,cy,bx,by,bx,by-h,cx,cy-h);
  poly(shade(c,1.1),ax,ay-h,bx,by-h,cx,cy-h,dx,dy-h);
}
function pyr(u0,v0,u1,v1,z,rh,c){
  const um=(u0+u1)/2,vm=(v0+v1)/2,tx=X(um,vm),ty=Y(um,vm)-z-rh;
  const bx=X(u1,v0),by=Y(u1,v0)-z,cx=X(u1,v1),cy=Y(u1,v1)-z,dx=X(u0,v1),dy=Y(u0,v1)-z;
  poly(shade(c,.85),dx,dy,cx,cy,tx,ty);poly(shade(c,.58),cx,cy,bx,by,tx,ty);
}
function flat(u0,v0,u1,v1,z,col){poly(col,X(u0,v0),Y(u0,v0)-z,X(u1,v0),Y(u1,v0)-z,X(u1,v1),Y(u1,v1)-z,X(u0,v1),Y(u0,v1)-z)}
function cyl(u,v,r,h,c,z=0){
  const x=X(u,v),y=Y(u,v)-z;
  ctx.fillStyle=shade(c,.75);ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r,y-h);ctx.lineTo(x+r,y-h);ctx.lineTo(x+r,y);
  ctx.ellipse(x,y,r,r*.5,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=shade(c,.6);ctx.beginPath();ctx.moveTo(x+r*.2,y+r*.48);ctx.lineTo(x+r*.2,y-h);ctx.lineTo(x+r,y-h);ctx.lineTo(x+r,y);ctx.ellipse(x,y,r,r*.5,0,0,Math.PI*.4);ctx.fill();
  ctx.fillStyle=shade(c,1.1);ctx.beginPath();ctx.ellipse(x,y-h,r,r*.5,0,0,7);ctx.fill();
}
function windows(uA,vA,uB,vB,z,h,rows,cols,tone,seed){
  const idx=curIdx;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const f0=(c+.2)/cols,f1=(c+.8)/cols,g0=z+h*(r+.25)/rows,g1=z+h*(r+.7)/rows;
    const x0=X(uA+(uB-uA)*f0,vA+(vB-vA)*f0),y0=Y(uA+(uB-uA)*f0,vA+(vB-vA)*f0);
    const x1=X(uA+(uB-uA)*f1,vA+(vB-vA)*f1),y1=Y(uA+(uB-uA)*f1,vA+(vB-vA)*f1);
    const lit=night>.15&&hsh(idx,r*9+c,seed)<.5;
    if(lit)lights.push(x0,y0-g1,x1,y1-g1,x1,y1-g0,x0,y0-g0);
    else poly(tone,x0,y0-g1,x1,y1-g1,x1,y1-g0,x0,y0-g0);
  }
}
function tree(u,v,s=1,c=[70,150,80]){
  const x=X(u,v),y=Y(u,v);
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x+2,y+1,6*s,3*s,0,0,7);ctx.fill();
  ctx.fillStyle='#5b4030';ctx.fillRect(x-1,y-6*s,2,6*s);
  ctx.fillStyle=shade(c,.85);ctx.beginPath();ctx.arc(x,y-9*s,6.5*s,0,7);ctx.fill();
  ctx.fillStyle=shade(c,1.15);ctx.beginPath();ctx.arc(x-1.5*s,y-11*s,4.5*s,0,7);ctx.fill();
}
function smoke(x,y,s=1,n=3){
  for(let k=0;k<n;k++){
    const ph=((TNOW/2200+k/n+hsh(curIdx,k,5))%1),a=(1-ph)*.55;
    ctx.fillStyle=`rgba(${190-ph*50|0},${190-ph*50|0},${195-ph*40|0},${a})`;
    ctx.beginPath();ctx.arc(x+ph*14+Math.sin(TNOW/700+k)*2,y-ph*38*s,(3+ph*7)*s,0,7);ctx.fill();
  }
}
const WALL_R=[[236,214,178],[220,170,140],[200,205,215],[240,226,160],[190,150,140],[170,200,190]];
const ROOF=[[190,86,66],[168,98,70],[120,110,130],[150,70,60]];
const GLASS_C=[[96,150,196],[110,170,190],[86,130,180]];
const WALL_I=[[190,160,120],[170,170,175],[200,140,100]];

function drawBuilding(t,l,i,j,sx,sy){
  const sub=grid.sub[j*N+i],hv=sub/256;
  const nearly=night>.15;
  if(t===T.R){
    if(l===0)return;
    const w=WALL_R[sub%WALL_R.length],rf=ROOF[(sub>>2)%ROOF.length];
    if(l===1){
      const two=hv>.5;
      if(two){prism(.12,.12,.45,.45,11,w);pyr(.12,.12,.45,.45,11,8,rf);prism(.55,.5,.88,.84,10,WALL_R[(sub+1)%6]);pyr(.55,.5,.88,.84,10,7,ROOF[(sub+1)%4]);
        windows(.45,.12,.45,.45,0,11,1,1,'#3a4a58',1);}
      else{prism(.2,.2,.8,.8,13,w);pyr(.2,.2,.8,.8,13,11,rf);windows(.8,.2,.8,.8,0,13,1,2,'#35475a',2);windows(.2,.8,.8,.8,0,13,1,2,'#35475a',3)}
      tree(.9,.12,.7);
    }else if(l===2){
      prism(.12,.12,.88,.88,30,w);flat(.12,.12,.88,.88,30,shade(w,1.05));prism(.4,.4,.6,.6,6,[120,120,130],30);
      windows(.88,.12,.88,.88,0,30,3,3,'#3a4d60',4);windows(.12,.88,.88,.88,0,30,3,3,'#3a4d60',5);
    }else{
      prism(.1,.1,.9,.9,16,[120,120,135]);prism(.18,.18,.82,.82,56,w,16);
      windows(.82,.18,.82,.82,16,56,6,4,'#36485c',6);windows(.18,.82,.82,.82,16,56,6,4,'#36485c',7);
      windows(.9,.1,.9,.9,0,16,1,4,'#2e3d4c',8);
      prism(.4,.4,.6,.6,6,[110,110,120],72);
    }
  }else if(t===T.C){
    if(l===0)return;
    const g=GLASS_C[sub%3];
    if(l===1){
      prism(.12,.15,.88,.85,14,[225,205,170]);
      // toldo
      const aw=hv>.5?[210,80,70]:[70,150,120];
      poly(shade(aw,.8),X(.88,.15),Y(.88,.15)-12,X(.88,.85),Y(.88,.85)-12,X(1,.85),Y(1,.85)-8,X(1,.15),Y(1,.15)-8);
      windows(.88,.15,.88,.85,0,10,1,3,'#3b5568',9);
      flat(.12,.15,.88,.85,14,'#b9b4a8');
    }else if(l===2){
      prism(.1,.1,.9,.9,34,g);
      windows(.9,.1,.9,.9,2,32,4,4,'#294a66',10);windows(.1,.9,.9,.9,2,32,4,4,'#294a66',11);
      prism(.3,.3,.7,.7,5,[150,160,170],34);
    }else{
      prism(.1,.1,.9,.9,22,[140,150,160]);prism(.2,.2,.8,.8,50,g,22);prism(.35,.35,.65,.65,26,shade(g,1.1),72);
      windows(.8,.2,.8,.8,22,50,5,4,'#27455f',12);windows(.2,.8,.8,.8,22,50,5,4,'#27455f',13);
      windows(.65,.35,.65,.65,72,26,3,3,'#27455f',14);windows(.35,.65,.65,.65,72,26,3,3,'#27455f',15);
      const x=X(.5,.5),y=Y(.5,.5)-98;ctx.strokeStyle='#ccc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-12);ctx.stroke();
      if(night>.15){const bl=(TNOW%1400)<700;if(bl)lights.push(x-1,y-14,x+1,y-14,x+1,y-12,x-1,y-12)}
    }
  }else if(t===T.I){
    if(l===0)return;
    const w=WALL_I[sub%3];
    prism(.08,.1,.92,.9,l===1?14:l===2?20:24,w);
    windows(.92,.1,.92,.9,3,9,1,4,'#2f3a44',16);
    // dientes de sierra
    const h=l===1?14:l===2?20:24;
    for(let k=0;k<3;k++){const a=.1+k*.28;poly(shade(w,.7),X(.92,a),Y(.92,a)-h,X(.92,a+.28),Y(.92,a+.28)-h,X(.92,a+.28),Y(.92,a+.28)-h-7);}
    cyl(.25,.3,4,l===1?24:34,[130,130,135],0);smoke(X(.25,.3),Y(.25,.3)-(l===1?24:34),.9,3);
    if(l>=2){cyl(.5,.2,3.5,40,[120,120,125]);smoke(X(.5,.2),Y(.5,.2)-40,1,3);cyl(.78,.86,6,16,[200,200,205],h);}
    if(l===3){cyl(.12,.62,6,22,[200,200,210],h);cyl(.4,.68,3.5,44,[120,120,125]);smoke(X(.4,.68),Y(.4,.68)-44,1.2,3)}
  }else if(t===T.PARK){
    flat(.05,.05,.95,.95,0,'#7bc47a');
    flat(.44,.05,.56,.95,0,'#d9cfa8');flat(.05,.44,.95,.56,0,'#d9cfa8');
    ctx.fillStyle='#5aa7d8';ctx.beginPath();ctx.ellipse(X(.5,.5),Y(.5,.5),9,4.5,0,0,7);ctx.fill();
    ctx.fillStyle='#b8e2f5';ctx.beginPath();ctx.ellipse(X(.5,.5),Y(.5,.5)-1,6,2.8,0,0,7);ctx.fill();
    tree(.2,.2,1,[60,140,70]);tree(.8,.2,.9,[90,160,70]);tree(.2,.8,1,[50,130,80]);tree(.8,.82,.8,[210,120,140]);
  }else if(t===T.POLICE){
    prism(.1,.1,.9,.9,22,[88,120,190]);flat(.1,.1,.9,.9,22,'#6d8fcf');
    prism(.1,.1,.9,.2,24,[230,230,240]);
    windows(.9,.1,.9,.9,4,14,1,3,'#cfe4ff',17);
    const b=(TNOW%600)<300;cyl(.5,.5,3,5,b?[230,60,60]:[60,90,230],22);
    if(night>.15)lights.push(X(.5,.5)-3,Y(.5,.5)-30,X(.5,.5)+3,Y(.5,.5)-30,X(.5,.5)+3,Y(.5,.5)-24,X(.5,.5)-3,Y(.5,.5)-24);
    // placa
    poly('#f3ebda',X(.9,.4),Y(.9,.4)-18,X(.9,.6),Y(.9,.6)-18,X(.9,.6),Y(.9,.6)-10,X(.9,.4),Y(.9,.4)-10);
  }else if(t===T.FIRE){
    prism(.1,.12,.9,.88,20,[200,70,60]);flat(.1,.12,.9,.88,20,'#d98075');
    poly('#2e2a2a',X(.9,.2),Y(.9,.2),X(.9,.5),Y(.9,.5),X(.9,.5),Y(.9,.5)-12,X(.9,.2),Y(.9,.2)-12);
    poly('#f0c040',X(.9,.55),Y(.9,.55),X(.9,.8),Y(.9,.8),X(.9,.8),Y(.9,.8)-12,X(.9,.55),Y(.9,.55)-12);
    prism(.15,.15,.32,.32,16,[230,230,230],20);
  }else if(t===T.CLINIC){
    prism(.1,.1,.9,.9,28,[236,238,240]);flat(.1,.1,.9,.9,28,'#f4f6f7');
    windows(.9,.1,.9,.9,3,22,2,3,'#7fb4d8',18);windows(.1,.9,.9,.9,3,22,2,3,'#7fb4d8',19);
    flat(.4,.25,.6,.75,28.2,'#e0443c');flat(.25,.4,.75,.6,28.2,'#e0443c');
  }else if(t===T.SCHOOL){
    prism(.1,.12,.9,.88,18,[230,200,110]);pyr(.1,.12,.9,.88,18,8,[170,80,60]);
    windows(.9,.12,.9,.88,3,12,1,4,'#46647f',20);
    prism(.4,.4,.6,.6,10,[235,215,150],18);
    const x=X(.5,.5),y=Y(.5,.5)-46;ctx.strokeStyle='#ddd';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-14);ctx.stroke();
    poly('#4aa3df',x,y-14,x+9+Math.sin(TNOW/300)*1.5,y-11,x,y-8);
  }else if(t===T.COAL){
    prism(.05,.1,.95,.9,18,[96,96,104]);windows(.95,.1,.95,.9,4,10,1,5,'#252a30',21);
    cyl(.28,.28,7,50,[110,106,104]);cyl(.62,.22,7,60,[110,106,104]);
    ctx.fillStyle='#c0392b';ctx.fillRect(X(.28,.28)-7,Y(.28,.28)-44,14,3);ctx.fillRect(X(.62,.22)-7,Y(.62,.22)-54,14,3);
    smoke(X(.28,.28),Y(.28,.28)-50,1.5,4);smoke(X(.62,.22),Y(.62,.22)-60,1.7,4);
    prism(.55,.55,.85,.85,10,[130,130,140],18);
  }else if(t===T.SOLAR){
    flat(.05,.05,.95,.95,0,'#8ea68a');
    for(let k=0;k<3;k++){
      const a=.1+k*.3;
      const b=[40,76+((TNOW/60)%1)*0,150];
      poly('#1f3d78',X(a,.1),Y(a,.1)-10,X(a+.22,.1),Y(a+.22,.1)-10,X(a+.22,.9),Y(a+.22,.9)-4,X(a,.9),Y(a,.9)-4);
      poly('#4a78c8',X(a+.02,.14),Y(a+.02,.14)-10,X(a+.2,.14),Y(a+.2,.14)-10,X(a+.2,.86),Y(a+.2,.86)-4,X(a+.02,.86),Y(a+.02,.86)-4);
    }
    const g=(TNOW/9000)%1;ctx.fillStyle=`rgba(255,255,255,${.35*(Math.sin(g*6.28)*.5+.5)})`;ctx.beginPath();ctx.arc(X(.5,.5),Y(.5,.5)-8,5,0,7);ctx.fill();
  }else if(t===T.WATER){
    for(const [u,v] of [[.3,.3],[.7,.3],[.3,.7],[.7,.7]]){ctx.strokeStyle='#4d5a66';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(u,v),Y(u,v));ctx.lineTo(X(.5,.5),Y(.5,.5)-26);ctx.stroke()}
    cyl(.5,.5,13,18,[90,150,200],26);
    ctx.fillStyle='#35607f';ctx.beginPath();ctx.moveTo(X(.5,.5)-13,Y(.5,.5)-44);ctx.lineTo(X(.5,.5),Y(.5,.5)-60);ctx.lineTo(X(.5,.5)+13,Y(.5,.5)-44);ctx.fill();
  }else if(t===T.STATUE){
    flat(.05,.05,.95,.95,0,'#cfc9b6');
    prism(.25,.25,.75,.75,8,[180,175,160]);prism(.35,.35,.65,.65,10,[170,165,150],8);
    const x=X(.5,.5),y=Y(.5,.5)-18;
    const g=night>.1?[255,225,120]:[225,180,70];
    ctx.fillStyle=shade(g,.8);ctx.fillRect(x-4,y-18,8,18);ctx.fillStyle=shade(g,1);ctx.beginPath();ctx.arc(x,y-22,4.5,0,7);ctx.fill();
    ctx.fillRect(x+4,y-26,3,12); // brazo en alto
    if(night>.1)lights.push(x-6,y-28,x+6,y-28,x+6,y,x-6,y);
  }else if(t===T.HALL){
    prism(.06,.1,.94,.9,26,[238,228,205]);
    for(let k=0;k<6;k++){const v=.16+k*.13;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X(.96,v),Y(.96,v));ctx.lineTo(X(.96,v),Y(.96,v)-24);ctx.stroke()}
    poly('#cdbf9c',X(.96,.1),Y(.96,.1)-26,X(.96,.9),Y(.96,.9)-26,X(.96,.5),Y(.96,.5)-40);
    prism(.04,.08,.1,.92,2,[200,190,170]);
    const x=X(.5,.5),y=Y(.5,.5)-30;ctx.strokeStyle='#ddd';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-24);ctx.stroke();
    poly('#e0b45a',x,y-24,x+12+Math.sin(TNOW/260)*2,y-20,x,y-15);
    windows(.94,.1,.94,.9,6,14,1,5,'#415a6e',22);
  }
}

function drawRoad(i,j,sx,sy){
  const n=[typeAt(i+1,j)===T.ROAD,typeAt(i-1,j)===T.ROAD,typeAt(i,j+1)===T.ROAD,typeAt(i,j-1)===T.ROAD];
  flat(0,0,1,1,0,'#b9bcb3');
  const a=.18,b=.82,asp='#3c424b';
  flat(a,a,b,b,0,asp);
  if(n[0])flat(b,a,1,b,0,asp);if(n[1])flat(0,a,a,b,0,asp);
  if(n[2])flat(a,b,b,1,0,asp);if(n[3])flat(a,0,b,a,0,asp);
  ctx.strokeStyle='rgba(235,210,120,.8)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();
  if(n[0]){ctx.moveTo(X(.5,.5),Y(.5,.5));ctx.lineTo(X(1,.5),Y(1,.5))}
  if(n[1]){ctx.moveTo(X(.5,.5),Y(.5,.5));ctx.lineTo(X(0,.5),Y(0,.5))}
  if(n[2]){ctx.moveTo(X(.5,.5),Y(.5,.5));ctx.lineTo(X(.5,1),Y(.5,1))}
  if(n[3]){ctx.moveTo(X(.5,.5),Y(.5,.5));ctx.lineTo(X(.5,0),Y(.5,0))}
  ctx.stroke();ctx.setLineDash([]);
  if(night>.15&&hsh(i,j,2)<.5){const x=X(.15,.15),y=Y(.15,.15);ctx.fillStyle='#555';ctx.fillRect(x-.5,y-10,1,10);lights.push(x-2,y-12,x+2,y-12,x+2,y-8,x-2,y-8)}
}
const ZCOL={[T.R]:'rgba(100,200,120,.55)',[T.C]:'rgba(90,160,235,.55)',[T.I]:'rgba(235,185,80,.55)'};
function drawTerrain(i,j,idx){
  const ter=grid.ter[idx];
  if(ter===1){
    const w=Math.sin(TNOW/900+i*.8+j*.55)*.5+.5;
    flat(0,0,1,1,0,`rgb(${40+w*12|0},${112+w*16|0},${160+w*14|0})`);
    if(hsh(i,j,9)<.12&&night<.5){ctx.strokeStyle=`rgba(255,255,255,${.12+w*.2})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.3,.5),Y(.3,.5));ctx.lineTo(X(.55,.5),Y(.55,.5)-0);ctx.stroke()}
  }else{
    const v=hsh(i,j,1);
    flat(0,0,1,1,0,`rgb(${96+v*14|0},${170+v*16|0},${96+v*10|0})`);
  }
}
function drawSides(i,j,idx){
  const ter=grid.ter[idx],c=ter===1?[38,92,128]:[120,88,60],th=16;
  if(i===N-1){const x1=X(1,0),y1=Y(1,0),x2=X(1,1),y2=Y(1,1);poly(shade(c,.62),x1,y1,x2,y2,x2,y2+th,x1,y1+th)}
  if(j===N-1){const x1=X(0,1),y1=Y(0,1),x2=X(1,1),y2=Y(1,1);poly(shade(c,.85),x1,y1,x2,y2,x2,y2+th,x1,y1+th)}
}
let hover=null,drag=null,painting=false,tool=TOOL.pan;
function render(now){
  TNOW=now;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#1d4a5e');sky.addColorStop(1,'#10303f');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  if(!G)return;
  const t=(now/1000/110)%1;
  night=clamp(Math.sin(t*6.2832)*1.7-.35,0,1);
  if(window.__night!=null)night=window.__night;
  ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
  const x0=cam.x-W/2/cam.z-70,x1=cam.x+W/2/cam.z+70,y0=cam.y-H/2/cam.z-110,y1=cam.y+H/2/cam.z+30;
  lights=[];
  // autos
  const bucket=new Map();
  for(const c of cars){
    const ci=Math.round(c.i+(c.ni-c.i)*c.t),cj=Math.round(c.j+(c.nj-c.j)*c.t);
    const k=cj*N+ci;let b=bucket.get(k);if(!b)bucket.set(k,b=[]);b.push(c);
  }
  for(let s=0;s<=2*N-2;s++){
    for(let j=Math.max(0,s-N+1);j<=Math.min(N-1,s);j++){
      const i=s-j,sx=(i-j)*HW,sy=(i+j)*HH;
      if(sx<x0||sx>x1||sy<y0||sy>y1)continue;
      OX=sx;OY=sy;const idx=j*N+i;curIdx=idx;
      const typ=grid.typ[idx],lvl=grid.lvl[idx];
      drawSides(i,j,idx);
      drawTerrain(i,j,idx);
      if(typ===T.NONE&&grid.ter[idx]===2){
        const v=hsh(i,j,4);tree(.3+v*.2,.35,1.1,[56+v*30,130+v*20,70]);tree(.7,.65-v*.2,.9,[70,140,76]);
      }
      if(typ===T.ROAD)drawRoad(i,j,sx,sy);
      else if(typ===T.R||typ===T.C||typ===T.I){
        flat(.04,.04,.96,.96,0,ZCOL[typ]);
        if(lvl===0){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.04,.04),Y(.04,.04));ctx.lineTo(X(.96,.04),Y(.96,.04));ctx.lineTo(X(.96,.96),Y(.96,.96));ctx.lineTo(X(.04,.96),Y(.04,.96));ctx.closePath();ctx.stroke()}
        else flat(.04,.04,.96,.96,0,'rgba(150,150,140,.7)');
        drawBuilding(typ,lvl,i,j,sx,sy);
      }else if(typ!==T.NONE){
        flat(0,0,1,1,0,typ===T.PARK?'#7bc47a':'#b2b3a8');
        drawBuilding(typ,lvl,i,j,sx,sy);
      }
      const b=bucket.get(idx);
      if(b)for(const c of b)drawCar(c);
    }
  }
  drawCursor();
  // noche
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(night>0){ctx.fillStyle=`rgba(8,14,46,${night*.5})`;ctx.fillRect(0,0,W,H)}
  if(night>.1&&lights.length){
    ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,214,120,${night*.9})`;ctx.beginPath();
    for(let k=0;k<lights.length;k+=8){ctx.moveTo(lights[k],lights[k+1]);ctx.lineTo(lights[k+2],lights[k+3]);ctx.lineTo(lights[k+4],lights[k+5]);ctx.lineTo(lights[k+6],lights[k+7]);ctx.closePath()}
    ctx.fill();ctx.globalCompositeOperation='source-over';
  }
}
function drawCar(c){
  const di=c.ni-c.i,dj=c.nj-c.j;
  const ci=c.i+di*c.t-dj*.13,cj=c.j+dj*c.t+di*.13;
  OX=(ci-cj)*HW;OY=(ci+cj+1)*HH;
  prism(-.07,-.04,.07,.04,3,c.c,0);
}
function drawCursor(){
  if(!hover)return;
  const [i,j]=hover;if(!inb(i,j))return;
  OX=(i-j)*HW;OY=(i+j)*HH;
  const cost=tool.id==='pan'?0:applyTool(tool,i,j,true);
  const ok=tool.id==='pan'?true:(cost>0||(cost===0&&tool.id==='bull'&&false))&&G.money>=cost;
  let col='rgba(255,255,255,.28)';
  if(tool.id!=='pan')col=cost>0&&G.money>=cost?'rgba(120,230,150,.45)':'rgba(230,90,80,.45)';
  flat(0,0,1,1,0,col);
  if(tool.r&&cost>0){
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();
    for(let k=0;k<=48;k++){const a=k/48*6.2832,u=.5+Math.cos(a)*tool.r,v=.5+Math.sin(a)*tool.r;const x=X(u,v),y=Y(u,v);k?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();ctx.setLineDash([]);
  }
}

/* ---------- autos ---------- */
function roadNeighbors(i,j){const o=[];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(typeAt(i+a,j+b)===T.ROAD)o.push([i+a,j+b]);return o}
function updateCars(dt){
  const roads=[];for(let k=0;k<N*N;k++)if(grid.typ[k]===T.ROAD)roads.push(k);
  const want=roads.length>3?Math.min(140,Math.floor(G.pop/25+roads.length/6)):0;
  while(cars.length<want){const k=pick(roads);const i=k%N,j=(k/N)|0;const nb=roadNeighbors(i,j);if(!nb.length)break;const n=pick(nb);cars.push({i,j,ni:n[0],nj:n[1],pi:-1,pj:-1,t:Math.random(),sp:rnd(.9,1.6),c:pick([[210,70,60],[240,200,70],[70,130,200],[230,230,230],[60,160,110],[150,90,180]])})}
  while(cars.length>want)cars.pop();
  for(const c of cars){
    if(typeAt(c.i,c.j)!==T.ROAD||typeAt(c.ni,c.nj)!==T.ROAD){const k=pick(roads);if(k==null){cars.length=0;return}c.i=k%N;c.j=(k/N)|0;const nb=roadNeighbors(c.i,c.j);if(nb.length){c.ni=nb[0][0];c.nj=nb[0][1]}else{c.ni=c.i;c.nj=c.j}c.t=0;continue}
    c.t+=dt*c.sp*(S.units?1:.4)*1.3;
    if(c.t>=1){
      c.t=0;const oi=c.i,oj=c.j;c.i=c.ni;c.j=c.nj;
      let nb=roadNeighbors(c.i,c.j).filter(n=>!(n[0]===oi&&n[1]===oj));
      if(!nb.length)nb=[[oi,oj]];
      const n=pick(nb);c.ni=n[0];c.nj=n[1];
    }
  }
}

/* ---------- entrada ---------- */
function toTile(px,py){
  const wx=(px-W/2)/cam.z+cam.x,wy=(py-H/2)/cam.z+cam.y;
  const u=(wy/HH+wx/HW)/2,v=(wy/HH-wx/HW)/2;
  return [Math.floor(u),Math.floor(v)];
}
const ptrs=new Map();let pinch=null,lastTile=null,moved=0,panStart=null;
function clampCam(){
  const lim=N*HW*.55;cam.x=clamp(cam.x,-lim,lim);cam.y=clamp(cam.y,-HH*4,N*TH+HH*4);
}
function paintAt(px,py){
  const [i,j]=toTile(px,py);
  hover=[i,j];
  if(!inb(i,j))return;
  const key=i+','+j;if(lastTile===key)return;lastTile=key;
  const r=applyTool(tool,i,j);
  if(r===-1){toast('Sin fondos: pide un préstamo en Finanzas',1);return}
  if(r>0){recalc();refreshUI(true)}
}
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  if(!G||modalOpen)return;
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  moved=0;
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};painting=false;drag=null;return}
  const pan=tool.id==='pan'||e.button===1||e.button===2;
  if(pan){drag={x:e.clientX,y:e.clientY};cv.style.cursor='grabbing'}
  else{painting=true;lastTile=null;paintAt(e.clientX,e.clientY)}
});
cv.addEventListener('pointermove',e=>{
  if(!G)return;
  if(ptrs.has(e.pointerId)){const p=ptrs.get(e.pointerId);const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);
    if(pinch&&ptrs.size===2){
      const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);
      cam.z=clamp(pinch.z*d/pinch.d,.45,2.2);
      cam.x-=dx/2/cam.z;cam.y-=dy/2/cam.z;clampCam();return}
  }
  if(drag){cam.x-=(e.clientX-drag.x)/cam.z;cam.y-=(e.clientY-drag.y)/cam.z;drag.x=e.clientX;drag.y=e.clientY;clampCam();return}
  if(painting){paintAt(e.clientX,e.clientY);return}
  hover=toTile(e.clientX,e.clientY);
  if(e.pointerType==='mouse')showTip(e.clientX,e.clientY);
});
function up(e){ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){drag=null;painting=false;cv.style.cursor=tool.id==='pan'?'grab':'crosshair';if(e.pointerType!=='mouse')hover=null}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hover=null;$('#tip').style.display='none'}});
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const before=[(e.clientX-W/2)/cam.z+cam.x,(e.clientY-H/2)/cam.z+cam.y];
  cam.z=clamp(cam.z*(e.deltaY<0?1.12:.89),.45,2.2);
  cam.x=before[0]-(e.clientX-W/2)/cam.z;cam.y=before[1]-(e.clientY-H/2)/cam.z;clampCam();
},{passive:false});
addEventListener('keydown',e=>{
  if(modalOpen||!G)return;
  const k=e.key;
  if(k===' '){e.preventDefault();setSpeed(G.speed===0?1:0)}
  const map={'1':'pan','2':'road','3':'R','4':'C','5':'I','6':'park','7':'bull'};
  if(map[k])selectTool(map[k]);
  if(k==='Escape')selectTool('pan');
  const s=40/cam.z;
  if(k==='ArrowLeft'||k==='a'){cam.x-=s}if(k==='ArrowRight'||k==='d'){cam.x+=s}if(k==='ArrowUp'||k==='w'){cam.y-=s}if(k==='ArrowDown'||k==='s'){cam.y+=s}
  clampCam();
});
function showTip(px,py){
  const tip=$('#tip');
  if(!hover||!inb(hover[0],hover[1])||tool.id!=='pan'&&false){tip.style.display='none';return}
  const [i,j]=hover,idx=j*N+i,t=grid.typ[idx],l=grid.lvl[idx];
  let name='Terreno';
  if(grid.ter[idx]===1)name='Agua';else if(t===T.ROAD)name='Calle';else if(t===T.HALL)name='Alcaldía';
  else if(ZNAME[t])name=`${ZNAME[t]} · nivel ${l}${l===0?' (sin construir)':''}`;
  else if(BYTYPE[t])name=BYTYPE[t].n;else if(grid.ter[idx]===2)name='Bosque';
  let h=`<b>${name}</b>`;
  if(ZNAME[t]){
    h+=`<br>Valor del suelo: ${(cov.lv[idx]*100)|0}% · Aire: ${((1-cov.poll[idx])*100)|0}%`;
    if(!roadAccess(i,j))h+='<br>⚠️ Sin acceso a calle';
    else if(S.pCap===0)h+='<br>⚠️ Falta planta de energía';
    else if(S.wCap===0)h+='<br>⚠️ Falta torre de agua';
    else if(S.pRatio<.9||S.wRatio<.9)h+='<br>⚠️ Energía o agua insuficientes';
  }
  tip.innerHTML=h;tip.style.display='block';tip.style.left=Math.min(W-240,px+14)+'px';tip.style.top=(py+16)+'px';
}

/* ---------- interfaz ---------- */
function selectTool(id){
  tool=TOOL[id];
  document.querySelectorAll('#tools button').forEach(b=>b.classList.toggle('on',b.dataset.id===id));
  cv.style.cursor=id==='pan'?'grab':'crosshair';
}
function buildTools(){
  const box=$('#tools');box.innerHTML='';let g='';
  TOOLS.forEach(t=>{
    if(t.g!==g){g=t.g;const d=document.createElement('div');d.className='grp';d.textContent=g;box.appendChild(d)}
    const b=document.createElement('button');b.dataset.id=t.id;b.title=t.d+(t.cost?` · ${fmt(t.cost)}`:'');
    b.innerHTML=`<span class="e">${t.e}</span><span class="n">${t.n}<span class="c">${t.cost?fmt(t.cost)+(t.up?' · '+fmt(t.up)+'/mes':''):'gratis'}</span></span>`;
    b.onclick=()=>selectTool(t.id);box.appendChild(b);
  });
  selectTool(tool.id);
}
let curTab='city';
function bar(v,max=100,inv){const p=clamp(v/max*100,0,100);const cls=inv?(p>66?'bad':p>40?'warn':''):(p<33?'bad':p<55?'warn':'');return `<div class="bar ${cls}"><i style="width:${p}%"></i></div>`}
function panelCity(){
  const s=S;
  const pu=s.units?`${Math.min(999,Math.round(s.pCap))}/${s.units}`:'—';
  const wu=s.zoneTiles?`${s.wCap}/${s.zunits}`:'—';
  let h=`<h4>${G.name} · ${G.mayor}</h4>
  <div class="row"><span>Población</span><b>${num(G.pop)}</b></div>
  <div class="row"><span>Empleo disponible</span><b>${num(s.jobs)} puestos</b></div>
  <div class="row"><span>Desempleo</span><b>${(s.unemp*100).toFixed(0)}%</b></div>
  <div class="row"><span>Energía (oferta/consumo)</span><b>${pu}</b></div>
  <div class="row"><span>Agua (oferta/consumo)</span><b>${wu}</b></div>
  <h4>Estado de ánimo</h4>
  <div class="row"><span>Felicidad</span><b>${(s.h*100)|0}%</b></div>${bar(s.h*100)}
  <div class="row"><span>Criminalidad</span><b>${(s.crime*100)|0}%</b></div>${bar(s.crime*100,100,true)}
  <div class="row"><span>Contaminación media</span><b>${(s.aPoll*100)|0}%</b></div>${bar(s.aPoll*100,100,true)}
  <h4>Demanda de zonas</h4>
  <div class="row"><span>🏠 Residencial</span><b>${s.dR>0?'+':''}${(s.dR*100)|0}</b></div>
  <div class="row"><span>🏬 Comercial</span><b>${s.dC>0?'+':''}${(s.dC*100)|0}</b></div>
  <div class="row"><span>🏭 Industrial</span><b>${s.dI>0?'+':''}${(s.dI*100)|0}</b></div>`;
  if(s.pCap===0||s.wCap===0)h+=`<div class="hist" style="border-color:#e0604f;color:#f3c0b8">⚠️ Sin ${s.pCap===0?'energía':''}${s.pCap===0&&s.wCap===0?' ni ':''}${s.wCap===0?'agua':''}: nada crecerá. Construye una planta y una torre de agua.</div>`;
  h+='<h4>Prensa y crónica</h4>'+G.log.slice(0,9).map(l=>`<div class="hist">${l}</div>`).join('');
  return h;
}
function panelPol(){
  let h=`<h4>Aprobación: ${S.approval.toFixed(0)}%</h4>${bar(S.approval)}
  <div class="row"><span>Próximas elecciones</span><b>en ${G.nextElection-G.month} meses</b></div>
  <div class="row"><span>Oponente</span><b>${G.opp}</b></div>
  <div class="row"><span>🏛️ Capital político</span><b>${G.cap.toFixed(0)}</b></div>${bar(G.cap)}
  <div class="row"><span>🕵️ Sospecha (Fiscalía)</span><b>${G.susp.toFixed(0)}%</b></div>${bar(G.susp,100,true)}
  <div class="row"><span>🤝 Lealtad del concejo</span><b>${G.loyalty.toFixed(0)}%</b></div>${bar(G.loyalty)}
  <h4>Facciones</h4>`;
  for(const k in FACS){const f=FACS[k];h+=`<div class="fac"><div class="t"><span>${f.e} ${f.n}</span><b>${G.fac[k].toFixed(0)}%</b></div>${bar(G.fac[k])}<small>${f.d}</small></div>`}
  h+=`<h4>Despacho</h4>
  <button class="btn" data-a="lunch">🥘 Almuerzo con el concejo<small>$1.500 · +lealtad del concejo</small></button>
  <button class="btn" data-a="press">🎤 Rueda de prensa<small>$800 · 5 de capital político · +aprobación temporal</small></button>
  <button class="btn dang" data-a="skim">🧳 Desviar el 10% de la caja<small>Va a tu fortuna personal · +12 de sospecha</small></button>
  <h4>Decretos (el concejo vota)</h4>`;
  DECREES.forEach(d=>{const on=G.decrees[d.id];h+=`<button class="btn ${on?'on':''}" data-a="decree" data-x="${d.id}">${on?'✅ ':''}${d.n}<small>${d.d}${on?'':` · <b>${d.cap}</b> de capital político`}</small></button>`});
  return h;
}
function panelFin(){
  const hh=G.hist||{inc:0,exp:0,incR:0,incC:0,incI:0,up:0,admin:0,dec:0,interest:0};
  const bal=hh.inc-hh.exp;
  let h=`<h4>Impuestos</h4>`;
  [['R','🏠 Residencial'],['C','🏬 Comercial'],['I','🏭 Industrial']].forEach(([k,n])=>{h+=`<div class="sl"><div class="t"><span>${n}</span><b>${G.tax[k]}%</b></div><input type="range" min="0" max="25" step="1" value="${G.tax[k]}" data-tax="${k}"></div>`});
  h+=`<h4>Balance mensual (último mes)</h4>
  <div class="row"><span>Ingresos residenciales</span><b>${fmt(hh.incR||0)}</b></div>
  <div class="row"><span>Ingresos comerciales</span><b>${fmt(hh.incC||0)}</b></div>
  <div class="row"><span>Ingresos industriales</span><b>${fmt(hh.incI||0)}</b></div>
  <div class="row"><span>Mantenimiento de obras</span><b>-${fmt(hh.up||0).slice(1)}</b></div>
  <div class="row"><span>Burocracia y servicios</span><b>-${fmt(hh.admin||0).slice(1)}</b></div>
  <div class="row"><span>Decretos</span><b>${hh.dec>0?'-':''}${fmt(Math.abs(hh.dec||0)).slice(1)}</b></div>
  <div class="row"><span>Intereses</span><b>-${fmt(hh.interest||0).slice(1)}</b></div>
  <div class="row"><span><b>Saldo</b></span><b style="color:${bal>=0?'var(--jade)':'var(--lacre)'}">${fmt(bal)}</b></div>
  <h4>Deuda</h4>
  <div class="row"><span>Deuda actual</span><b>${fmt(G.debt)}</b></div>
  <div class="row"><span>Interés mensual</span><b>1,2%</b></div>
  <button class="btn" data-a="loan">🏦 Pedir préstamo de $10.000</button>
  <button class="btn" data-a="pay">💵 Abonar $10.000 a la deuda</button>
  <h4>Tu fortuna</h4><div class="row"><span>Cuenta personal</span><b>${fmt(G.personal)}</b></div>
  <small style="color:var(--humo2)">Es lo único que te llevas al terminar el mandato.</small>`;
  return h;
}
function refreshUI(light){
  if(!G)return;
  $('#cityName').textContent=G.name;
  $('#dateLbl').textContent=`${MESES[G.month%12]} ${2027+Math.floor(G.month/12)} · ${G.mayor}`;
  const m=$('#hMoney');m.textContent=fmt(G.money);m.parentNode.className='chip '+(G.money<0?'bad':'');
  $('#hPop').textContent=num(G.pop);
  const a=S.approval||0;const ap=$('#hAppr');ap.textContent=a.toFixed(0)+'%';ap.parentNode.className='chip '+(a<45?'bad':a>62?'good':'');
  $('#hCap').textContent=G.cap.toFixed(0);$('#hOwn').textContent=fmt(G.personal);
  for(const [id,v] of [['dR',S.dR],['dC',S.dC],['dI',S.dI]]){const e=$('#'+id);e.style.height=Math.abs(v)*50+'%';e.style.bottom=v>=0?'50%':(50-Math.abs(v)*50)+'%';e.style.opacity=v<0?.55:1}
  document.querySelectorAll('.speed button').forEach(b=>b.classList.toggle('on',+b.dataset.sp===G.speed));
  if(light&&curTab==='fin')return;
  const body=$('#panelBody'),sc0=body.scrollTop;
  if(document.activeElement&&document.activeElement.type==='range')return;
  body.innerHTML=curTab==='city'?panelCity():curTab==='pol'?panelPol():panelFin();
  body.scrollTop=sc0;
}
$('#panelBody').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b)act(b.dataset.a,b.dataset.x)});
$('#panelBody').addEventListener('input',e=>{const r=e.target;if(r.dataset.tax){G.tax[r.dataset.tax]=+r.value;r.parentNode.querySelector('b').textContent=r.value+'%';recalc();const m=document.getElementById('hAppr');if(m)m.textContent=S.approval.toFixed(0)+'%'}});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{curTab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));refreshUI()});
function setSpeed(s){if(!G)return;G.speed=s;refreshUI(true)}
document.querySelectorAll('.speed button').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.sp));
$('#btnPanel').onclick=()=>$('#panel').classList.toggle('open');
$('#btnMenu').onclick=()=>menu();

/* ---------- guardado y menú ---------- */
function save(){
  if(!G||G.over)return;
  try{
    const o={G,grid:{ter:[...grid.ter],typ:[...grid.typ],lvl:[...grid.lvl],sub:[...grid.sub]},cam};
    localStorage.setItem(SAVE_KEY,JSON.stringify(o));
  }catch(e){}
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;
    const o=JSON.parse(raw);
    allocGrid();for(const k of ['ter','typ','lvl','sub'])grid[k].set(o.grid[k]);
    G=o.G;G.speed=1;Object.assign(cam,o.cam||{});cam.z=cam.z||1;
    recalc();refreshUI();buildTools();return true;
  }catch(e){return false}
}
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function help(){
  queueModal({kick:'Manual del alcalde',title:'Cómo gobernar (y sobrevivir)',html:`<p><b>1.</b> Traza <b>calles</b> y pinta zonas <b>residencial, comercial e industrial</b> a su lado.<br>
  <b>2.</b> Construye una <b>planta de energía</b> y una <b>torre de agua</b>: sin ellas nada crece.<br>
  <b>3.</b> Mira la <b>demanda</b> (barras arriba) y balancea la ciudad. Pon servicios: policía, clínica, colegio, bomberos, parques.<br>
  <b>4.</b> Cuida a las <b>cuatro facciones</b>: vecinos, empresarios, ecologistas y funcionarios. Su opinión decide si te reeligen cada 4 años.<br>
  <b>5.</b> Gasta <b>capital político</b> en decretos que el concejo debe votar.<br>
  <b>6.</b> Tienes tentaciones: desviar caja, aceptar sobres, estatuas... Cada sospecha sube el riesgo de la <b>Fiscalía</b>. Tu fortuna personal es lo que te llevas al final.<br><br>
  <b>Controles:</b> arrastra para pintar o mover (herramienta ✋); rueda/pellizco para zoom; clic derecho para mover; espacio = pausa; teclas 1–7 para herramientas.</p>`,opts:[{l:'Entendido'}]});
}
function menu(){
  if(modalOpen)return;
  queueModal({kick:'Menú',title:G?G.name:'Alcalde',html:'<p>¿Qué hacemos, señor alcalde?</p>',opts:[
    {l:'Guardar partida',f:()=>{save();toast('💾 Partida guardada')}},
    {l:'Ayuda',f:()=>{setTimeout(help,0)}},
    {l:'Nueva partida',f:()=>{setTimeout(startScreen,0)}},
    {l:'Volver al juego'}]});
}
function startScreen(){
  modalQueue.length=0;modalOpen=false;
  const cont=hasSave();
  queueModal({kick:'Una crónica satírica del poder local',title:'ALCALDE',html:`<p>Construye una ciudad, reparte favores, cuida tu imagen... y no olvides cuánto aguanta el concejo. Tienes cuatro años antes de enfrentar a las urnas.</p>
   <label>Nombre de la ciudad</label><input type="text" id="inCity" value="Villa Anónima" maxlength="24">
   <label>Tu nombre</label><input type="text" id="inMayor" value="Don Ernesto Paredes" maxlength="28">
   <label>Perfil político</label><div class="prof">
    <label><input type="radio" name="pf" value="tec" checked>Tecnócrata<small>+$15.000 de caja, funcionarios a favor. Pocos amigos entre el pueblo.</small></label>
    <label><input type="radio" name="pf" value="pop">Populista<small>Vecinos a tu favor y capital político. Arrancas con menos plata.</small></label>
    <label><input type="radio" name="pf" value="emp">Hombre de empresa<small>Empresarios a favor y $12.000 propios. Pero ya tienes un par de sospechas.</small></label></div>`,
   opts:[{l:'Empezar mandato',f:()=>{
     const city=($('#inCity').value||'Villa Anónima').trim(),mayor=($('#inMayor').value||'El Alcalde').trim();
     const pf=document.querySelector('input[name=pf]:checked').value;
     G=newState({city,mayor,profile:pf});cars=[];genMap(G.seed);
     const c=(N-1)/2;cam.x=0;cam.y=(c+c)*HH+HH;cam.z=1.05;
     S={};recalc();addLog('Bienvenido, señor alcalde. Construya energía, agua, calles y zonas.');refreshUI();buildTools();selectTool('road');save();
     setTimeout(help,0);
   }}].concat(cont?[{l:'Continuar partida guardada',f:()=>{if(!load())toast('No se pudo cargar',1)}}]:[]),final:true});
}

/* ---------- bucle ---------- */
let acc=0,lastT=performance.now();
setInterval(()=>{
  const now=performance.now(),dt=now-lastT;lastT=now;
  if(!G||modalOpen||G.over||G.speed===0)return;
  acc+=dt*[0,1,2,4.5][G.speed];
  if(acc>=5000){acc=0;step()}
},100);
let lastR=performance.now();
function loop(now){const dt=Math.min(.1,(now-lastR)/1000);lastR=now;if(G&&!modalOpen&&!G.over&&G.speed>0)updateCars(dt);render(now);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
addEventListener('resize',resize);resize();
// render() se auto-programa; evitamos doble programación
window.__alcalde={get G(){return G},get S(){return S},grid,cov,step,applyTool,TOOL,recalc,act,cam,selectTool,startScreen,setSpeed,load,save,T,N,queueModal,election,endGame};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
startScreen();
})();

