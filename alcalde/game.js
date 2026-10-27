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
const T={NONE:0,ROAD:1,R:2,C:3,I:4,PARK:5,POLICE:6,FIRE:7,CLINIC:8,SCHOOL:9,COAL:10,SOLAR:11,WATER:12,STATUE:13,HALL:14,AVE:15,BUS:16,METRO:17,LIB:18,UNI:19,HOSP:20,STAD:21,WIND:22,RECY:23,PLAZA:24,JAIL:25,ROUND:26,TOLL:27};
const TOOLS=[
 {id:'pan',n:'Mover',e:'✋',cost:0,g:'Mapa',d:'Arrastra para mover el mapa. Rueda o pellizco para acercar.'},
 {id:'bull',n:'Demoler',e:'🧨',cost:5,g:'Mapa',d:'Derriba edificios, calles y zonas.'},
 {id:'road',n:'Calle',e:'🛣️',cost:15,up:.35,t:T.ROAD,g:'Urbanismo',d:'Las zonas necesitan una calle al lado para crecer. Arrastra para trazar.'},
 {id:'R',n:'Residencial',e:'🏠',cost:8,t:T.R,den:0,g:'Urbanismo',d:'Vivienda de baja y media densidad (hasta nivel 3).'},
 {id:'Rd',n:'Resid. densa',e:'🏢',cost:22,t:T.R,den:1,g:'Urbanismo',d:'Alta densidad: torres de hasta nivel 5. Exige buen suelo y transporte público; si no, se atasca todo.'},
 {id:'C',n:'Comercial',e:'🏬',cost:8,t:T.C,den:0,g:'Urbanismo',d:'Comercio y oficinas de baja y media densidad.'},
 {id:'Cd',n:'Comer. denso',e:'🏙️',cost:22,t:T.C,den:1,g:'Urbanismo',d:'Rascacielos de oficinas y centros comerciales hasta nivel 5. Necesitan transporte público.'},
 {id:'I',n:'Industrial',e:'🏭',cost:8,t:T.I,den:0,g:'Urbanismo',d:'Zona industrial. Mucho empleo, mucha contaminación.'},
 {id:'park',n:'Parque',e:'🌳',cost:60,up:6,t:T.PARK,r:5,g:'Urbanismo',d:'Alegra a los vecinos y limpia el aire. Los ecologistas lo adoran.'},
 {id:'plaza',n:'Plaza pública',e:'⛲',cost:250,up:18,t:T.PLAZA,r:4,g:'Urbanismo',d:'Plaza con fuente y bancas: felicidad, valor del suelo y más clientes al comercio. También es el lugar favorito para protestar.'},
 {id:'ave',n:'Avenida',e:'🛤️',cost:45,up:.9,t:T.AVE,g:'Transporte',d:'Doble calzada: aguanta más del doble de tráfico. Se puede pintar sobre una calle.'},
 {id:'round',n:'Glorieta',e:'🔄',cost:180,up:1,t:T.ROUND,g:'Transporte',d:'Rotonda sobre una calle o avenida: +60% de capacidad en el cruce y +25% en las calles pegadas. Con isla central.'},
 {id:'toll',n:'Peaje',e:'🚧',cost:600,up:40,t:T.TOLL,g:'Transporte',d:'Caseta de cobro sobre una calle o avenida. Cobra por cada vehículo que pasa (tarifa en Finanzas), frena el tráfico y enoja a la gente.'},
 {id:'bus',n:'Parada de bus',e:'🚌',cost:350,up:35,t:T.BUS,r:6,g:'Transporte',d:'Cobertura de bus en radio 6: baja el tráfico y sube el valor del suelo. Pon varias.'},
 {id:'metro',n:'Estación de metro',e:'🚇',cost:3200,up:260,t:T.METRO,r:10,big:1,g:'Transporte',d:'Cobertura enorme (radio 10). Permite densidades altas. Obra faraónica: espera sobrecostos.'},
 {id:'rail',n:'Vía elevada',e:'🚝',cost:120,up:3,lay:'elev',lv:1,g:'Transporte',d:'Viaducto de metro elevado: va sobre calles, terreno libre y hasta sobre el agua. Se une a otras vías por los lados.'},
 {id:'tram',n:'Vía de tranvía',e:'🚊',cost:70,up:2.5,lay:'tram',lv:1,g:'Transporte',d:'Rieles de tranvía sobre una calle o avenida. Dos paradas conectadas hacen una línea.'},
 {id:'tramst',n:'Parada de tranvía',e:'🚋',cost:800,up:90,lay:'tram',lv:2,r:6,g:'Transporte',d:'Se pone sobre un riel de tranvía. La línea necesita al menos dos paradas conectadas.'},
 {id:'brt',n:'Troncal BRT',e:'🛑',cost:110,up:2,lay:'brt',lv:1,g:'Transporte',d:'Carril exclusivo rojo sobre una AVENIDA, estilo TransMilenio. Mueve multitudes, pero le quita capacidad al tráfico general.'},
 {id:'brtst',n:'Estación BRT',e:'🚍',cost:1100,up:130,lay:'brt',lv:2,r:8,g:'Transporte',d:'Estación de troncal. Una línea necesita al menos dos estaciones conectadas. Se llena hasta reventar.'},
 {id:'estel',n:'Estación elevada',e:'🚉',cost:2200,up:180,lay:'elev',lv:2,r:11,big:1,g:'Transporte',d:'Se construye sobre una vía elevada. La línea solo funciona a pleno si conecta al menos DOS estaciones; con una sola rinde como un bus.'},
 {id:'coal',n:'Planta de carbón',e:'⚡',cost:2200,up:220,t:T.COAL,r:9,g:'Servicios',d:'Produce 120 unidades de energía. Barata y sucia.'},
 {id:'solar',n:'Planta solar',e:'☀️',cost:2600,up:60,t:T.SOLAR,g:'Servicios',d:'Produce 45 unidades de energía. Limpia pero cara por vatio.'},
 {id:'wind',n:'Parque eólico',e:'🌬️',cost:3000,up:70,t:T.WIND,g:'Servicios',d:'Produce 70 unidades de energía limpia. Los ecologistas aplauden.'},
 {id:'water',n:'Torre de agua',e:'🚰',cost:900,up:70,t:T.WATER,g:'Servicios',d:'Abastece 100 unidades de consumo de agua.'},
 {id:'recy',n:'Reciclaje',e:'♻️',cost:1500,up:120,t:T.RECY,r:8,g:'Servicios',d:'Planta de reciclaje: limpia el aire y contenta a los ecologistas.'},
 {id:'jail',n:'Cárcel',e:'⛓️',cost:2800,up:280,t:T.JAIL,r:12,g:'Servicios',d:'Baja el crimen en un radio de 12. Es un servicio... que alguien querrá privatizar.'},
 {id:'police',n:'Policía',e:'🚓',cost:700,up:130,t:T.POLICE,r:10,g:'Servicios',d:'Reduce el crimen en su radio.'},
 {id:'fire',n:'Bomberos',e:'🚒',cost:600,up:110,t:T.FIRE,r:10,g:'Servicios',d:'Protege de incendios.'},
 {id:'clinic',n:'Clínica',e:'🏥',cost:900,up:150,t:T.CLINIC,r:10,g:'Servicios',d:'Salud pública: sube la felicidad.'},
 {id:'hosp',n:'Hospital',e:'🚑',cost:3400,up:340,t:T.HOSP,r:14,big:1,g:'Servicios',d:'Salud de alto nivel en radio 14. Cuesta, pero cubre media ciudad.'},
 {id:'school',n:'Colegio',e:'🏫',cost:800,up:130,t:T.SCHOOL,r:9,g:'Servicios',d:'Educación: sube la felicidad y el valor del suelo.'},
 {id:'lib',n:'Biblioteca',e:'📚',cost:600,up:55,t:T.LIB,r:8,g:'Servicios',d:'Educación barata en radio 8. Nadie la usa, pero queda lindo.'},
 {id:'uni',n:'Universidad',e:'🎓',cost:4600,up:390,t:T.UNI,r:14,big:1,g:'Servicios',d:'Educación superior en radio 14: empuja el valor del suelo y las densidades altas.'},
 {id:'stad',n:'Estadio',e:'🏟️',cost:7000,up:420,t:T.STAD,r:8,big:1,g:'Vanidad',d:'Felicidad enorme alrededor. Cuesta lo del estadio... más el sobrecosto.'},
 {id:'statue',n:'Estatua del alcalde',e:'🗿',cost:3500,up:15,t:T.STATUE,g:'Vanidad',d:'Un monumento a tu persona. Sube tu aprobación... y las sospechas de los ecologistas y la prensa.'},
 {id:'ov_traf',n:'Tráfico',e:'🚦',ov:'traf',cost:0,g:'Capas',d:'Verde: fluido. Rojo: trancón.'},
 {id:'ov_trn',n:'Transporte',e:'🚏',ov:'trn',cost:0,g:'Capas',d:'Cobertura de bus y metro.'},
 {id:'ov_poll',n:'Contaminación',e:'🌫️',ov:'poll',cost:0,g:'Capas',d:'Calidad del aire por zonas.'},
 {id:'ov_lv',n:'Valor del suelo',e:'💰',ov:'lv',cost:0,g:'Capas',d:'Cuanto más verde, más caro el suelo.'},
 {id:'ov_crime',n:'Crimen',e:'🚨',ov:'crime',cost:0,g:'Capas',d:'Riesgo de delincuencia por zonas.'},
];
const TOOL=Object.fromEntries(TOOLS.map(t=>[t.id,t]));
const BYTYPE={};TOOLS.forEach(t=>{if(t.t)BYTYPE[t.t]=t});
const CAPR=[0,8,22,55,110,190],CAPC=[0,5,14,34,70,120],CAPI=[0,8,20,45],UNITS=[0,1,2,4,7,11];
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
    lastFiscalia:-99,over:null,priv:{},cronies:{},privOp:{},bonus:{cr:0},hist:{inc:0,exp:0}};
  if(opts.profile==='tec'){st.money+=15000;st.fac.fun=65;st.cap=30}
  if(opts.profile==='pop'){st.fac.vec=70;st.cap=60;st.money-=8000}
  if(opts.profile==='emp'){st.fac.emp=72;st.personal=12000;st.susp=8;st.fac.eco=45}
  return st;
}
function allocGrid(){
  ['ter','typ','lvl','sub','den','elev','tram','brt'].forEach(k=>grid[k]=new Uint8Array(N*N));
  ['police','fire','clinic','school','park','poll','crime','lv','transit','traf','clean'].forEach(k=>cov[k]=new Float32Array(N*N));
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
  terrainMeta();
}
function setRoad(i,j){const idx=j*N+i;if(grid.ter[idx]===1)return;grid.ter[idx]=0;grid.typ[idx]=T.ROAD;grid.lvl[idx]=0}

/* ---------- utilidades de grilla ---------- */
const inb=(i,j)=>i>=0&&j>=0&&i<N&&j<N;
const typeAt=(i,j)=>inb(i,j)?grid.typ[j*N+i]:-1;
const isRoad=t=>t===T.ROAD||t===T.AVE||t===T.ROUND||t===T.TOLL;
const isAveIdx=k=>grid.typ[k]===T.AVE||((grid.typ[k]===T.ROUND||grid.typ[k]===T.TOLL)&&grid.den[k]===1);
let lastToll={rev:0,count:0};
const toolCost=t=>Math.round(t.cost*((G&&G.corp&&G.corp.cons&&G.corp.cons.q>=50)?.88:1));
function roadAccess(i,j){
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){ if(!di&&!dj)continue; if(isRoad(typeAt(i+di,j+dj)))return true; }
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
/* ---------- sectores privatizables ---------- */
const SECTORS={
 seg:{n:'Seguridad y cárceles',e:'⛓️',types:[T.POLICE,T.JAIL],fx:{vec:-3,emp:5,eco:0,fun:-8},d:'Policía y cárceles. El contratista cobra por preso; tú, por no preguntar.'},
 ene:{n:'Energía',e:'⚡',types:[T.COAL,T.SOLAR,T.WIND],fx:{vec:-4,emp:8,eco:-4,fun:-5},d:'Las plantas rinden 15% más, pero las tarifas también suben.'},
 sal:{n:'Salud',e:'🏥',types:[T.CLINIC,T.HOSP],fx:{vec:-8,emp:6,eco:0,fun:-9},d:'Clínicas y hospitales. Cobertura algo menor; las filas, algo mayores.'},
 edu:{n:'Educación',e:'🎓',types:[T.SCHOOL,T.LIB,T.UNI],fx:{vec:-5,emp:4,eco:0,fun:-9},d:'Colegios, bibliotecas y universidad "con enfoque de mercado".'},
 agua:{n:'Agua y aseo',e:'🚰',types:[T.WATER,T.RECY],fx:{vec:-6,emp:5,eco:-3,fun:-5},d:'Torres de agua y reciclaje. Hay pérdidas en la red... y en la caja.'},
 peaje:{n:'Peajes y concesiones viales',e:'🚧',types:[T.TOLL],fx:{vec:-5,emp:6,eco:0,fun:-3},d:'Un operador cobra los peajes: tú recibes la mitad y todo el odio.'},
 trn:{n:'Transporte público',e:'🚇',types:[T.BUS,T.METRO],fx:{vec:-4,emp:5,eco:-2,fun:-6},d:'Buses, metro y metro elevado. El pasaje sube al doble.'},
};
const SECOF={};for(const k in SECTORS)for(const t of SECTORS[k].types)SECOF[t]=k;
const OPS=['Consorcio Hermanos Cemento','Inversiones El Cuñado S.A.','Fondo Buitre Capital','Servicios Integrales Paredes','Grupo Los Mismos de Siempre','Concesiones Andorra Ltda.'];
function sectorStats(sec){
  let cost=0,n=0;
  for(let k=0;k<N*N;k++){const t=grid.typ[k];if(SECTORS[sec].types.includes(t)){cost+=BYTYPE[t].cost;n++}}
  if(sec==='trn')for(let k=0;k<N*N;k++){const e=grid.elev[k];if(e===1){cost+=120;n++}else if(e===2){cost+=2200+120;n++}
    const tr=grid.tram[k];if(tr===1){cost+=70;n++}else if(tr===2){cost+=870;n++}
    const br=grid.brt[k];if(br===1){cost+=110;n++}else if(br===2){cost+=1210;n++}}
  return {n,value:n?Math.round(1500+cost*.9):0};
}
const privCount=()=>Object.keys(G.priv||{}).filter(k=>G.priv[k]).length;
function privPick(){const ks=Object.keys(G.priv||{}).filter(k=>G.priv[k]);if(!ks.length)return null;const k=pick(ks);return {sec:k,name:SECTORS[k].n,op:G.privOp[k]||'el operador'}}
function lineNet(arr){
  const comp=new Int16Array(N*N).fill(-1),comps=[];let rails=0,stations=0;
  for(let k0=0;k0<N*N;k0++){
    if(!arr[k0])continue;
    rails++;if(arr[k0]===2)stations++;
    if(comp[k0]>=0)continue;
    const id=comps.length,c={tiles:[],st:[]};comp[k0]=id;const stack=[k0];
    while(stack.length){
      const k=stack.pop();c.tiles.push(k);if(arr[k]===2)c.st.push(k);
      const i=k%N,j=(k/N)|0;
      for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const x=i+a,y=j+b;if(!inb(x,y))continue;const kk=y*N+x;
        if(arr[kk]&&comp[kk]<0){comp[kk]=id;stack.push(kk)}
      }
    }
    comps.push(c);
  }
  return {rails,stations,comps};
}
function computeTraffic(){
  const load=new Float32Array(N*N),roads=[];
  for(let k=0;k<N*N;k++)if(isRoad(grid.typ[k]))roads.push(k);
  const near=[];
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const idx=j*N+i,t=grid.typ[idx],l=grid.lvl[idx];
    let w=0;
    if(t===T.R)w=UNITS[l];else if(t===T.C)w=UNITS[l]*1.5;else if(t===T.I)w=UNITS[l]*1.2;
    else if(t===T.STAD)w=6;else if(t===T.UNI||t===T.HOSP)w=3;
    if(!w)continue;
    near.length=0;
    for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++){const x=i+di,y=j+dj;if(inb(x,y)&&isRoad(grid.typ[y*N+x]))near.push(y*N+x)}
    if(!near.length)continue;
    const sh=w/near.length;
    for(const r of near)load[r]+=sh;
  }
  // el flujo se reparte a lo largo de la red vial
  for(let pass=0;pass<2;pass++){
    const nl=new Float32Array(load);
    for(const k of roads){
      const i=k%N,j=(k/N)|0;let sum=0,c=0;
      for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){if(isRoad(typeAt(i+a,j+b))){sum+=load[(j+b)*N+i+a];c++}}
      if(c)nl[k]=load[k]*.6+(sum/c)*.4;
    }
    load.set(nl);
  }
  const boost=new Float32Array(N*N).fill(1);
  for(const k of roads){
    if(grid.typ[k]!==T.ROUND)continue;
    boost[k]=Math.max(boost[k],1.6);
    const i=k%N,j=(k/N)|0;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(inb(x,y)&&isRoad(grid.typ[y*N+x]))boost[y*N+x]=Math.max(boost[y*N+x],1.25)}
  }
  const price=G.tollPrice==null?3:G.tollPrice;let rev=0,tc=0;
  for(const k of roads){if(grid.typ[k]!==T.TOLL)continue;tc++;rev+=load[k]*price*22*(1-.04*price);load[k]*=1-.04*price}
  lastToll={rev,count:tc};
  cov.traf.fill(0);
  let tot=0,w=0;
  for(const k of roads){
    const cap=(isAveIdx(k)?22:9)*boost[k]*(grid.brt[k]?.75:grid.tram[k]?.92:1);
    const relief=1-Math.min(.65,cov.transit[k]*.5)-(G.decrees.picoplaca?.22:0);
    const v=load[k]*Math.max(.2,relief)/cap+(grid.typ[k]===T.TOLL?.22:0);
    cov.traf[k]=v;tot+=v*load[k];w+=load[k];
  }
  return w>0?clamp(tot/w,0,2):0;
}
function recalc(){
  const cnt=new Array(32).fill(0);
  let capR=0,capC=0,capI=0,units=0,zunits=0,zoneTiles=0;
  const src={police:[],fire:[],clinic:[],school:[],park:[],poll:[],lib:[],uni:[],hosp:[],stad:[],bus:[],metro:[],recy:[],plaza:[],jail:[]};
  const pv=G.priv||{};
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
    else if(t===T.LIB){src.lib.push([i,j,1]);units++}
    else if(t===T.UNI){src.uni.push([i,j,1]);units+=3}
    else if(t===T.HOSP){src.hosp.push([i,j,1]);units+=3}
    else if(t===T.STAD){src.stad.push([i,j,1]);units+=4}
    else if(t===T.BUS){src.bus.push([i,j,1]);units++}
    else if(t===T.METRO){src.metro.push([i,j,1]);units+=3}
    else if(t===T.RECY){src.recy.push([i,j,1]);units+=2}
    else if(t===T.PLAZA){src.plaza.push([i,j,1]);units++}
    else if(t===T.JAIL){src.jail.push([i,j,1]);units+=3}
    else if(t===T.HALL){units+=2}
    if((t===T.R||t===T.C||t===T.I))zoneTiles++;
  }
  const net=lineNet(grid.elev),netT=lineNet(grid.tram),netB=lineNet(grid.brt);units+=net.stations*2+Math.floor(net.rails/6)+netT.stations+netB.stations;
  const pCap=Math.round((cnt[T.COAL]*120+cnt[T.SOLAR]*45+cnt[T.WIND]*70)*(pv.ene?1.15:1)),wCap=Math.round(cnt[T.WATER]*100*(pv.agua?.92:1));
  const pRatio=units===0?1:Math.min(1,pCap/units),wRatio=zunits===0?1:Math.min(1,wCap/zunits);
  const eff=(G.money<0?.6:1)*(G.decrees.recorte?.9:1);
  const trEff=G.decrees.tarifa?1.3:1;
  for(const k of ['police','fire','clinic','school','park','poll','crime','lv','transit','clean'])cov[k].fill(0);
  const ePol=eff*(pv.seg?.9:1),eCli=eff*(pv.sal?.85:1),eSch=eff*(pv.edu?.9:1),trP=pv.trn?.9:1;
  spread(cov.police,src.police,10,.9*ePol);spread(cov.police,src.jail,12,.7*ePol);spread(cov.fire,src.fire,10,.9*eff);
  spread(cov.clinic,src.clinic,10,.9*eCli);spread(cov.clinic,src.hosp,14,1.2*eCli);
  spread(cov.school,src.school,9,.9*eSch);spread(cov.school,src.lib,8,.5*eSch);spread(cov.school,src.uni,14,.9*eSch);
  spread(cov.park,src.park,5,1.1);spread(cov.park,src.stad,8,.7);spread(cov.park,src.plaza,4,.9);
  spread(cov.poll,src.poll,8,.7);spread(cov.clean,src.recy,8,.8);
  spread(cov.transit,src.bus,6,.75*trEff*trP);spread(cov.transit,src.metro,10,1.1*trEff*trP);
  // metro elevado: una línea solo rinde a pleno si une dos o más estaciones
  const addLine=(n,ra,ma,rw,mw)=>{const A=[],W=[];for(const c of n.comps)for(const k of c.st)(c.st.length>=2?A:W).push([k%N,(k/N)|0,1]);spread(cov.transit,A,ra,ma*trEff*trP);spread(cov.transit,W,rw,mw*trEff*trP)};
  addLine(net,11,1.25,5,.5);addLine(netT,6,.95,3,.4);addLine(netB,8,1.15,4,.45);
  // parques y reciclaje limpian el aire
  for(let k=0;k<N*N;k++){cov.poll[k]=clamp(cov.poll[k]-cov.park[k]*.35-cov.clean[k]*.3,0,1)}
  const cong=computeTraffic();

  const pop=G.pop,workers=pop*.5,jobs=capC+capI;
  const employed=Math.min(workers,jobs),unemp=workers>1?clamp(1-employed/workers,0,1):0;
  let nR=0,aPol=0,aFir=0,aCli=0,aSch=0,aPark=0,aPoll=0,aTrn=0;
  for(let k=0;k<N*N;k++){ if(grid.typ[k]===T.R&&grid.lvl[k]>0){nR++;aPol+=Math.min(1,cov.police[k]);aFir+=Math.min(1,cov.fire[k]);aCli+=Math.min(1,cov.clinic[k]);aSch+=Math.min(1,cov.school[k]);aPark+=Math.min(1,cov.park[k]);aPoll+=cov.poll[k];aTrn+=Math.min(1,cov.transit[k])} }
  if(nR){aPol/=nR;aFir/=nR;aCli/=nR;aSch/=nR;aPark/=nR;aPoll/=nR;aTrn/=nR}else{aPol=aFir=aCli=aSch=aPark=0.3;aTrn=0}
  const decCrime=(G.decrees.seca?-.1:0)+(G.decrees.alumbrado?.07:0);
  const crime=clamp(.42+unemp*.5-aPol*.75+decCrime+(pop>3000?.04:0),0,1);
  const statue=cnt[T.STATUE]>0;
  const jam=clamp(cong-.5,0,1.2);
  let h=.5+.14*aCli+.12*aSch+.08*aFir+.2*aPark-.32*aPoll-.3*crime-.4*unemp-(G.tax.R-9)*.02
        -(1-pRatio)*.5-(1-wRatio)*.4+(statue?.03:0)+(G.decrees.vivienda?.03:0)+(G.decrees.ciclovia?.03:0)+G.buzz*.004
        +.05*aTrn-.2*jam+(G.decrees.tarifa?.02:0)+Math.min(.06,cnt[T.STAD]*.04)+Math.min(.06,cnt[T.PLAZA]*.015)-privCount()*.012;
  if(G.decrees.recorte)h-=.03;
  h=clamp(h,0,1);
  const tx=t=>(G.tax[t]-9)*.03;
  let dR=.28+clamp((jobs-workers)/(jobs+workers+20),-1,1)*.7-tx('R')-(unemp>.12?.3:0)+(G.decrees.vivienda?.15:0)+(h-.5)*.4;
  let dC=clamp((pop*.2-capC)/(pop*.2+10),-1,1)*.8+(pop<20?.15:0)-tx('C');
  let dI=clamp((workers*.45-capI)/(workers*.45+12),-1,1)*.8+.12-tx('I')+(G.decrees.exencion?.2:0);
  const target=capR*(.4+.6*h);
  S={cnt,capR,capC,capI,units,zunits,pCap,wCap,pRatio,wRatio,workers,jobs,employed,unemp,crime,h,aPol,aFir,aCli,aSch,aPark,aPoll,aTrn,cong,net,netT,netB,pv,toll:lastToll,
     dR:clamp(dR,-1,1),dC:clamp(dC,-1,1),dI:clamp(dI,-1,1),target,statue,zoneTiles};
  for(let k=0;k<N*N;k++){
    cov.lv[k]=clamp(.38+cov.park[k]*.28+cov.school[k]*.16+cov.clinic[k]*.1+cov.police[k]*.1+Math.min(1,cov.transit[k])*.12-cov.poll[k]*.5,0,1);
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
function applyLayer(tool,i,j,sim){
  if(!inb(i,j))return 0;
  const idx=j*N+i,cur=grid.typ[idx],arr=grid[tool.lay];
  if(tool.lay==='elev'){if(cur!==T.NONE&&!isRoad(cur))return 0}
  else if(tool.lay==='tram'){if(!isRoad(cur)||grid.brt[idx])return 0}
  else if(tool.lay==='brt'){if(cur!==T.AVE||grid.tram[idx])return 0}
  if(tool.lv===1){if(arr[idx])return 0}else if(arr[idx]!==1)return 0;
  if(!sim){
    if(G.money<toolCost(tool))return -1;
    G.money-=toolCost(tool);arr[idx]=tool.lv;
    if(tool.big)G.bigBuilds=(G.bigBuilds||0)+1;
  }
  return toolCost(tool);
}
function applyTool(tool,i,j,sim){
  if(tool.lay)return applyLayer(tool,i,j,sim);
  if(!inb(i,j))return 0;
  const idx=j*N+i;
  if(tool.id==='bull'&&(grid.elev[idx]||grid.tram[idx]||grid.brt[idx])){
    if(!sim){if(G.money<toolCost(tool))return -1;G.money-=toolCost(tool);if(grid.elev[idx])grid.elev[idx]=0;else if(grid.tram[idx])grid.tram[idx]=0;else grid.brt[idx]=0}
    return toolCost(tool);
  }
  if(grid.ter[idx]===1)return 0;
  const cur=grid.typ[idx];
  if(cur===T.HALL)return 0;
  if(tool.id==='bull'){
    if(cur===T.NONE&&grid.ter[idx]!==2)return 0;
    if(!sim){ if(G.money<toolCost(tool)){return -1} G.money-=toolCost(tool); grid.typ[idx]=T.NONE;grid.lvl[idx]=0;grid.den[idx]=0;grid.ter[idx]=0; }
    return toolCost(tool);
  }
  if(!tool.t)return 0;
  const isZone=tool.t===T.R||tool.t===T.C||tool.t===T.I;
  const curZone=cur===T.R||cur===T.C||cur===T.I;
  const road=tool.t===T.ROAD||tool.t===T.AVE;
  const onRoad=tool.t===T.ROUND||tool.t===T.TOLL;
  const den=tool.den||0;
  if(isZone&&cur===tool.t&&grid.den[idx]===den)return 0;
  if((road||onRoad)&&cur===tool.t)return 0;
  if(cur!==T.NONE&&!(isZone&&curZone)&&!(tool.t===T.AVE&&cur===T.ROAD)&&!(onRoad&&(cur===T.ROAD||cur===T.AVE||cur===T.ROUND||cur===T.TOLL)))return 0;
  if(onRoad&&cur===T.NONE)return 0;
  if(!sim){
    if(G.money<toolCost(tool))return -1;
    G.money-=toolCost(tool);
    if(isZone&&curZone){
      if(cur!==tool.t)grid.lvl[idx]=0;
      grid.typ[idx]=tool.t;grid.den[idx]=den;
      if(!den||tool.t===T.I)grid.lvl[idx]=Math.min(grid.lvl[idx],3);
    }else if(onRoad){
      const ave=cur===T.AVE||((cur===T.ROUND||cur===T.TOLL)&&grid.den[idx]===1);
      grid.typ[idx]=tool.t;grid.lvl[idx]=0;grid.den[idx]=ave?1:0;
    }else{
      grid.typ[idx]=tool.t;grid.lvl[idx]=0;grid.den[idx]=den;grid.ter[idx]=0;grid.sub[idx]=(Math.random()*256)|0;
    }
    if(tool.big)G.bigBuilds=(G.bigBuilds||0)+1;
  }
  return toolCost(tool);
}

/* ---------- decretos ---------- */
const DECREES=[
 {id:'vivienda',n:'Subsidio de vivienda',cap:12,d:'Más demanda residencial y vecinos contentos. Cuesta caja cada mes.',pro:'Los vecinos aplauden; los empresarios hablan de "populismo".'},
 {id:'exencion',n:'Exenciones a la industria',cap:14,d:'Más demanda industrial; empresarios felices, ecologistas furiosos. Reduce el recaudo.',pro:'"Es inversión, no regalo", aclara tu secretario de hacienda.'},
 {id:'seca',n:'Ley seca nocturna',cap:10,d:'Baja el crimen. A nadie le gusta y a los empresarios menos.',pro:'La ciudad duerme más temprano. Y de mal humor.'},
 {id:'propaganda',n:'Pauta oficial en medios',cap:8,d:'+Aprobación constante. Cuesta caja y levanta sospechas.',pro:'Curiosamente, todos los periódicos te adoran.'},
 {id:'recorte',n:'Plan de austeridad',cap:12,d:'Ahorra caja cada mes. Funcionarios y vecinos sufren; los servicios rinden menos.',pro:'"Hacer más con menos", dices sin sonrojarte.'},
 {id:'ciclovia',n:'Ciclovías y peatonalización',cap:12,d:'Ecologistas felices y vecinos algo más. Cuesta caja; a los comerciantes no les gusta.',pro:'Los ciclistas te dedican un himno. Los taxistas, otro.'},
 {id:'picoplaca',n:'Pico y placa',cap:10,d:'Reduce el tráfico un 22%. A vecinos y empresarios les arruina el día.',pro:'Los dueños de dos carros compran un segundo carro con otra placa.'},
 {id:'tarifa',n:'Transporte público gratuito',cap:12,d:'Más pasajeros: el transporte rinde un 30% más y los vecinos aplauden. Cuesta caja cada mes.',pro:'Los buses van llenos. Y los puestos de empanadas en las estaciones, también.'},
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
 {id:'trancon',w:2,min:300,c:()=>S.cong>.85,t:'Trancón histórico',x:'Una ambulancia, un camión de mudanzas y tu propia caravana oficial quedaron atascados en la misma esquina durante tres horas. Hay un hashtag.',
  o:[{l:'Decretar pico y placa de emergencia',s:'Medida impopular',f:()=>{E.fac('vec',-4);E.fac('emp',-3);E.cap(4);return 'Por tres días, la ciudad respira. Luego todos compran un segundo carro.'}},
     {l:'Prometer un metro "para el 2040"',s:'Humo bien empacado',f:()=>{E.buzz(4);E.fac('vec',3);E.susp(1);return 'Nadie recuerda que prometiste lo mismo hace tres años.'}},
     {l:'Ir en bicicleta a la alcaldía',s:'Foto con casco',f:()=>{E.fac('eco',5);E.fac('vec',3);E.buzz(2);return 'Llegas sudado, pero los diarios te llaman "alcalde pedalista". Tu escolta te sigue en tres SUV.'}}]},
 {id:'sobrecosto',w:3,min:100,c:()=>(G.bigBuilds||0)>0,t:'Sobrecostos en la obra',x:'La obra faraónica va por el doble del presupuesto y una tercera parte del avance. El contratista pide una "adición" y te guiña un ojo.',
  o:[{l:'Firmar la adición al contrato',s:'La obra sigue y tú también',f:()=>{E.money(-$$(3500));E.own($$(1500));E.susp(7);E.fac('emp',5);return 'Aparece una nueva "partida de imprevistos" y una nueva camioneta en tu garaje.'}},
     {l:'Exigir cuentas claras',s:'Lento y legal',f:()=>{E.cap(-4);E.susp(-2);E.fac('fun',3);return 'El contratista te mira con odio profesional.'}},
     {l:'Inaugurar a medias, con globos',s:'Cámaras y casco',f:()=>{E.buzz(4);E.fac('vec',4);E.susp(2);return 'La cinta se corta. El techo, sin terminar, queda "para la segunda etapa".'}}]},
 {id:'buseros',w:1.3,min:300,c:()=>S.cnt[T.BUS]+S.cnt[T.METRO]>0,t:'Paro de transportadores',x:'Los dueños de las busetas amenazan con bloquear la ciudad: dicen que el transporte público "les quita el pan".',
  o:[{l:'Subsidiarles el combustible',s:'Costoso',f:()=>{E.money(-$$(2500));E.fac('emp',3);E.fac('eco',-2);return 'Vuelven a rodar. Con humo y con gratitud.'}},
     {l:'Plantarte firme',s:'Un día de caos',f:()=>{E.fac('vec',-5);E.cap(5);return 'La ciudad pasa un día a pie. Tu foto sale con cara de mártir.'}},
     {l:'Ofrecerles el negocio de las rutas',s:'Todos ganan (menos la ciudad)',f:()=>{E.own($$(1200));E.susp(5);E.fac('emp',4);return 'Los ex-amenazantes ahora son tus socios. Qué casualidad.'}}]},
 {id:'metroinaug',w:1.2,min:400,c:()=>S.cnt[T.METRO]>0,t:'Se inaugura el metro',x:'Tu estación de metro, la única, funciona. Hay una fila de cuatro cuadras para ver un torniquete. Los medios piden declaraciones.',
  o:[{l:'Decir que es "solo el comienzo"',s:'Optimismo oficial',f:()=>{E.buzz(5);E.fac('vec',5);return 'Lo único que empezó fue la fila.'}},
     {l:'Montarte con las cámaras',s:'Foto con la gente',f:()=>{E.fac('vec',3);E.fac('eco',3);E.buzz(3);return 'Te bajas en la misma estación. Es la única.'}}]},
 {id:'estadio',w:1.1,min:300,c:()=>S.cnt[T.STAD]>0,t:'Final en el estadio nuevo',x:'La final se juega en tu estadio... con goteras, sin baños y con dos columnas donde antes iba la tribuna. El estadio es un éxito. El contratista, también.',
  o:[{l:'Culpar a la lluvia',s:'Meteorología política',f:()=>{E.fac('vec',-2);E.buzz(1);return 'Dices que "en otros países también llueve".'}},
     {l:'Prometer una reparación gratuita',s:'Costosa',f:()=>{E.money(-$$(2200));E.fac('vec',5);return 'La reparación sale por la mitad del estadio original.'}}]},
 {id:'matricula',w:1,min:300,c:()=>S.cnt[T.UNI]>0,t:'Estudiantes en la plaza',x:'Los estudiantes de tu universidad pública marchan por la matrícula, la cafetería y que las pizarras no sean de 1994.',
  o:[{l:'Aumentar el presupuesto',s:'Educación primero',f:()=>{E.money(-$$(2200));E.fac('fun',5);E.fac('vec',4);return 'Cantan tu nombre con una rima poco halagadora.'}},
     {l:'Ofrecerles pizza y diálogo',s:'Barato y efímero',f:()=>{E.money(-$$(400));E.cap(-3);return 'La pizza se acaba. La protesta sigue, pero más calmada.'}}]},
 {id:'priv_tarifa',w:1.8,min:200,c:()=>privCount()>0,t:'El operador sube las tarifas',x:'El consorcio que administra __PRIV__ anuncia un "ajuste técnico" del 40%. Dice que lo exige el contrato. El contrato lo firmaste tú.',
  o:[{l:'Autorizar el alza',s:'El operador te lo agradece',f:()=>{E.fac('vec',-6);E.fac('emp',3);E.own($$(900));E.susp(3);return 'Los vecinos te mandan una factura enmarcada. El operador, un detalle navideño.'}},
     {l:'Frenar el alza por decreto',s:'Choque con el concesionario',f:()=>{E.fac('emp',-5);E.cap(-4);E.fac('vec',4);return 'El operador amenaza con demandarte ante un tribunal internacional.'}},
     {l:'Renegociar el contrato',s:'Costoso pero serio',f:()=>{E.money(-$$(1500));E.fac('vec',2);E.susp(-2);return 'Salvas una parte. La letra pequeña salva el resto... para ellos.'}}]},
 {id:'priv_carcel',w:1.5,min:300,c:()=>G.priv.seg,t:'El cupo de presos',x:'La cárcel privada exige que la ciudad garantice una "ocupación mínima del 95%". Si baja el crimen, el contrato te multa. Un fiscal levanta una ceja.',
  o:[{l:'Aceptar el cupo',s:'Conveniencia mutua',f:()=>{E.susp(6);E.own($$(1000));E.fac('vec',-3);return 'Por primera vez la policía tiene meta de detenciones. Qué casualidad.'}},
     {l:'Denunciar la cláusula',s:'Escándalo útil',f:()=>{E.fac('vec',4);E.fac('emp',-4);E.cap(-3);E.buzz(2);return 'El operador se retira indignado. Los diarios te llaman "alcalde garantista".'}}]},
 {id:'priv_apagon',w:1.5,min:300,c:()=>G.priv.ene,t:'Apagón del operador privado',x:'La empresa que administra la energía dice que el apagón fue "un evento de fuerza mayor". La fuerza mayor, al parecer, es no invertir en mantenimiento.',
  o:[{l:'Multar al operador',s:'Juego duro',f:()=>{E.money($$(1800));E.fac('emp',-4);E.fac('vec',3);return 'Pagan la multa y suben la tarifa para compensarla.'}},
     {l:'Pedir disculpas en su nombre',s:'Vocero involuntario',f:()=>{E.fac('vec',-5);E.cap(-2);return 'Dices "lamentamos" con un acento extrañamente corporativo.'}}]},
 {id:'priv_salud',w:1.5,min:300,c:()=>G.priv.sal,t:'La clínica cobra por la ambulancia',x:'Un paciente recibió una factura por la ambulancia, la camilla y "el uso del pasillo". Se hace viral con el hashtag #PasilloPremium.',
  o:[{l:'Exigir tarifas reguladas',s:'Choque con el operador',f:()=>{E.fac('vec',5);E.fac('emp',-4);E.cap(-4);return 'El operador cierra una sala "por remodelación". Indefinida.'}},
     {l:'Decir que es un "servicio de valor agregado"',s:'Eufemismo oficial',f:()=>{E.fac('vec',-7);E.buzz(-2);return 'La frase queda grabada en una camiseta de protesta.'}}]},
 {id:'priv_agua',w:1.4,min:300,c:()=>G.priv.agua,t:'Agua cortada por mora',x:'El operador del agua le cortó el servicio a un colegio, una clínica y a tu primo. Los dos primeros son noticia.',
  o:[{l:'Obligarlo a reconectar',s:'Mano dura',f:()=>{E.fac('emp',-4);E.fac('vec',4);E.cap(-3);return 'Reconectan. Con factura de reconexión incluida.'}},
     {l:'Pagar la deuda con fondos públicos',s:'Gasta caja',f:()=>{E.money(-$$(1200));E.fac('vec',3);E.fac('fun',-3);return 'Privatizar las ganancias y socializar las deudas: nada nuevo.'}}]},
 {id:'contraloria_priv',w:1.6,min:300,c:()=>Object.keys(G.cronies||{}).some(k=>G.cronies[k]&&G.priv[k]),t:'La Contraloría mira las concesiones',x:'Alguien se dio cuenta de que "Inversiones El Cuñado S.A." ganó tres licitaciones con la misma propuesta... incluida la errata.',
  o:[{l:'Perder los documentos',s:'Eficacia administrativa',f:()=>{E.money(-$$(2000));if(Math.random()<.6){E.susp(-12);return 'Un incendio "accidental" en el archivo. Qué lástima.'}E.susp(14);E.fac('vec',-4);return 'Los documentos aparecen. En la prensa.'}},
     {l:'Pedir una auditoría "independiente"',s:'Arriesgado',f:()=>{E.susp(-4);E.cap(-5);return 'La auditoría la hace una firma de tu cuñado. Parece independiente.'}}]},
 {id:'plaza_marcha',w:1.4,min:250,c:()=>S.cnt[T.PLAZA]>0,t:'Marcha en la plaza',x:'Una multitud se concentra en tu plaza nueva. Hay pancartas, tambores y alguien con un megáfono que dice cosas sobre tu madre.',
  o:[{l:'Salir a hablar con ellos',s:'Valentía televisada',f:()=>{E.cap(-3);E.fac('vec',5);E.buzz(3);return 'Te lanzan una naranja. Fallan. Sales en todos los noticieros.'}},
     {l:'Cerrar la plaza "por mantenimiento"',s:'Autoritario',f:()=>{E.fac('vec',-6);E.susp(2);return 'La cinta de seguridad dura menos que el mantenimiento anunciado.'}},
     {l:'Mandar a vender empanadas',s:'Solución logística',f:()=>{E.money($$(500));E.fac('vec',2);return 'Terminan hablando de la sal de las empanadas. Gran éxito.'}}]},
 {id:'elevado_ruido',w:1.4,min:300,c:()=>S.net.rails>=8,t:'Vecinos contra el metro elevado',x:'Los vecinos de un edificio con "vista" se quejan: el metro elevado pasa a dos metros de sus ventanas y les quitó el atardecer.',
  o:[{l:'Compensarlos',s:'Pagas el atardecer',f:()=>{E.money(-$$(1500));E.fac('vec',4);return 'Les pagas una vista que nunca existió. Aceptan.'}},
     {l:'Decir que es "el sonido del progreso"',s:'Consigna oficial',f:()=>{E.fac('vec',-5);E.buzz(-1);E.fac('emp',2);return 'Te regalan tapones para los oídos. Los usas en las reuniones del concejo.'}}]},
 {id:'brt_colados',w:1.5,min:300,c:()=>S.netB.stations>=2,t:'Colados en el troncal',x:'Cientos de personas se cuelan por las puertas del troncal masivo. El sistema pierde plata, un youtuber lo graba y el hashtag #ColadoDeHonor se vuelve tendencia.',
  o:[{l:'Reforzar la vigilancia',s:'Costoso y antipático',f:()=>{E.money(-$$(1800));E.fac('vec',-4);E.fac('emp',2);return 'Ahora hay más guardias que pasajeros. Los colados se vuelven más creativos.'}},
     {l:'Mirar hacia otro lado',s:'Es un subsidio informal',f:()=>{E.fac('vec',3);E.fac('fun',-2);return 'El sistema pierde plata, la gente llega a tiempo. Un empate técnico.'}},
     {l:'Campaña "El respeto se paga"',s:'Eslogan costoso',f:()=>{E.money(-$$(900));E.buzz(1);return 'El afiche sale con un error de ortografía en "respeto". Se vuelve viral.'}}]},
 {id:'brt_lleno',w:1.5,min:300,c:()=>S.netB.stations>=2&&G.pop>600,t:'Sardinas en el troncal',x:'Las estaciones del troncal rojo están a reventar. Un pasajero viajó seis estaciones sin tocar el piso. La prensa lo llama "el récord municipal de apretujamiento".',
  o:[{l:'Comprar más buses articulados',s:'Costoso',f:()=>{E.money(-$$(2800));E.fac('vec',5);E.fac('eco',-1);return 'Llegan buses nuevos, con aire acondicionado... en el letrero.'}},
     {l:'Decir que es "señal de éxito"',s:'Optimismo oficial',f:()=>{E.fac('vec',-4);E.buzz(-1);return 'Alguien te manda una foto de una lata de atún con tu cara.'}}]},
 {id:'tram_obras',w:1.4,min:250,c:()=>S.netT.rails>=8,t:'Obras del tranvía eternas',x:'La calle del tranvía lleva tres meses abierta. Un comerciante instaló una pequeña pesquería en el hueco y dice que le va mejor que antes.',
  o:[{l:'Acelerar con doble turno',s:'Costoso',f:()=>{E.money(-$$(1600));E.fac('emp',4);E.fac('vec',2);return 'Las obras terminan antes. La calle queda con un hueco nuevo, esta vez pintado.'}},
     {l:'Pedir paciencia',s:'Un clásico',f:()=>{E.fac('emp',-5);E.fac('vec',-2);return 'Los comerciantes te regalan un cubo de pintura y una pala.'}}]},
 {id:'tram_tilin',w:1.1,min:250,c:()=>S.netT.stations>=2,t:'El tranvía y el tilín',x:'El tranvía recorre la ciudad haciendo "tilín" cada cinco segundos. Los vecinos piden silencio; los turistas piden bis.',
  o:[{l:'Mantener el tilín',s:'Es parte del encanto',f:()=>{E.fac('vec',-2);E.buzz(2);E.fac('eco',2);return 'La campanita se vuelve símbolo de la ciudad. Y de tu insomnio.'}},
     {l:'Silenciar la campana',s:'Menos encanto',f:()=>{E.fac('vec',3);E.buzz(-1);return 'Los turistas lloran. Los vecinos, de alegría.'}}]},
 {id:'peaje_protesta',w:1.6,min:250,c:()=>S.toll&&S.toll.count>0&&(G.tollPrice==null?3:G.tollPrice)>=4,t:'Caravana contra el peaje',x:'Cientos de conductores bloquean la caseta con pitos, banderas y algún asado. Dicen que pagan peaje "hasta por ir a la esquina".',
  o:[{l:'Bajar la tarifa a $2',s:'La plata baja, la rabia también',f:()=>{G.tollPrice=2;E.fac('vec',5);E.cap(-2);recalc();return 'Tarifa reducida. Los pitos se convierten en aplausos de cortesía.'}},
     {l:'Mantener la tarifa',s:'Mano firme',f:()=>{E.fac('vec',-5);E.cap(3);return 'Las casetas siguen cobrando. Los asados, también.'}},
     {l:'Culpar al concesionario',s:'Eficaz si no lo contrataste tú',f:()=>{E.fac('vec',-1);E.fac('emp',-3);return 'El concesionario responde con un comunicado de cuatro páginas. Nadie lo lee.'}}]},
 {id:'peaje_fantasma',w:1.2,min:250,c:()=>S.toll&&S.toll.count>0,t:'El peaje de la vía que no existe',x:'Un periodista descubre que cobras peaje en una vía "en construcción" desde hace dos años. La vía es una trocha. La caseta, de lujo.',
  o:[{l:'Prometer terminarla "pronto"',s:'Palabra de alcalde',f:()=>{E.fac('vec',-2);E.buzz(-1);return 'La promesa se suma a las otras diecisiete.'}},
     {l:'Devolver lo recaudado',s:'Gesto costoso',f:()=>{E.money(-$$(2000));E.fac('vec',5);E.susp(-3);return 'Los diarios lo llaman "el peaje más honrado de la historia".'}}]},
 {id:'glorieta_estatua',w:1.1,min:250,c:()=>S.cnt[T.ROUND]>0,t:'Una estatua para la glorieta',x:'Un concejal propone un monumento al "pollo asado" en la glorieta central. Casualmente, su familia tiene un asadero.',
  o:[{l:'Aprobar el monumento',s:'Cultura gastronómica',f:()=>{E.money(-$$(1200));E.loy(6);E.fac('vec',2);E.susp(2);return 'El pollo mide cinco metros. Los pájaros reales lo adoptan de inmediato.'}},
     {l:'Rechazarlo',s:'Sin estatuas',f:()=>{E.loy(-4);E.cap(-1);return 'El concejal jura vengarse en la próxima votación.'}}]},
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
      else{
        const maxL=(t===T.I||!grid.den[k])?3:5;
        if(l<maxL){
          const lv=cov.lv[k],thr=t===T.I?[0,.25,.35]:[0,.46,.62,.7,.8];
          const ok=l<3||(cov.transit[k]>=.2&&S.cong<1.3&&S.zunits>0);
          if(ok&&dem>.08&&lv>thr[l]&&Math.random()<dem*(l<3?.45:.3))grid.lvl[k]=l+1;
        }
      }
    }
  }
}
function finance(){
  const infl=1+.02*Math.floor(G.month/12);
  let up=0;const pv=G.priv||{};
  for(let k=0;k<N*N;k++){const ty=grid.typ[k],t=BYTYPE[ty];if(t&&t.up){const sc=SECOF[ty];up+=t.up*(sc&&pv[sc]?.4:1)}}
  up+=(S.net.rails*3+S.net.stations*180+S.netT.rails*2.5+S.netT.stations*90+S.netB.rails*2+S.netB.stations*130)*(pv.trn?.4:1);
  let canon=0;for(const k in pv)if(pv[k])canon+=sectorStats(k).value*.012;
  const eff=S.employed*G.tax.R*.58;
  let incR=eff,incC=S.capC*G.tax.C*1.0*(.6+.4*S.h),incI=S.capI*G.tax.I*1.05;
  if(G.decrees.exencion)incI*=.6;
  incC*=1-.15*clamp(S.cong-.6,0,1);
  incC*=1+Math.min(.1,S.cnt[T.PLAZA]*.015);
  const incT=G.decrees.tarifa?0:G.pop*S.aTrn*.05*(pv.trn?2:1)*(1+Math.min(.6,S.net.stations*.06+(S.netT.stations+S.netB.stations)*.04));
  const incToll=(S.toll?S.toll.rev:0)*(pv.peaje?.5:1);
  let inc=incR+incC+incI+incT+canon+incToll;
  const admin=(110+G.pop*.55);
  let dec=0;
  if(G.decrees.vivienda)dec+=300+G.pop*.08;
  if(G.decrees.propaganda)dec+=500+G.pop*.04;
  if(G.decrees.ciclovia)dec+=200+G.pop*.04;
  if(G.decrees.tarifa)dec+=350+G.pop*.07;
  if(G.decrees.recorte)dec-=G.pop*.12+80;
  const interest=G.debt*.012;
  const exp=(up+admin+dec)*infl+interest;
  G.hist={inc,exp,incR,incC,incI,incT,incToll,canon,up:up*infl,admin:admin*infl,dec:dec*infl,interest};
  G.money+=inc-exp;
}
function politics(){
  const targ={};
  // vecinos
  targ.vec=S.h*100-(G.tax.R-9)*1.2+(G.decrees.vivienda?8:0)-(G.decrees.seca?6:0)+(G.decrees.ciclovia?2:0)-(G.decrees.recorte?5:0)-(S.crime>.5?10:0)-clamp(S.cong-.6,0,1)*14+S.aTrn*5-(G.decrees.picoplaca?5:0)+(G.decrees.tarifa?4:0);
  // empresarios
  targ.emp=62-(G.tax.C+G.tax.I-18)*2.3+(S.jobs>S.workers?6:-4)-(S.pRatio<.95?12:0)-(S.wRatio<.95?8:0)+(G.decrees.exencion?16:0)-(G.decrees.seca?6:0)-(G.decrees.ciclovia?4:0)+(G.decrees.alumbrado?4:0)-clamp(S.cong-.6,0,1)*10-(G.decrees.picoplaca?5:0)+(G.decrees.vivienda?-4:0);
  // ecologistas
  targ.eco=72-S.aPoll*140+S.aPark*30+S.cnt[T.SOLAR]*5-S.cnt[T.COAL]*7-(G.decrees.exencion?12:0)+(G.decrees.ciclovia?16:0)-(S.statue?6:0)+S.cnt[T.WIND]*5+S.cnt[T.RECY]*4+S.aTrn*10-(G.decrees.picoplaca?-3:0)-(S.capI>S.capR?6:0);
  // funcionarios
  targ.fun=45+(S.aPol+S.aFir+S.aCli+S.aSch)*13-(G.money<0?25:0)-(G.decrees.recorte?18:0)+(G.decrees.propaganda?3:0);
  {const tl=S.toll?S.toll.count:0,tp=G.tollPrice==null?3:G.tollPrice;targ.vec-=Math.min(10,tl*tp*.4);targ.emp-=Math.min(8,tl*tp*.3)}
  for(const sec in SECTORS){if(G.priv&&G.priv[sec]){const f=SECTORS[sec].fx;targ.vec+=f.vec;targ.emp+=f.emp;targ.eco+=f.eco;targ.fun+=f.fun}}
  for(const sec in G.cronies){if(G.cronies[sec]&&G.priv[sec]){const c=sectorStats(sec).value*.012;G.personal+=c*.4;G.susp=clamp(G.susp+.25,0,120)}}
  targ.vec+=Math.min(6,S.cnt[T.PLAZA]*1.5);
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
  if(S.cong>.8)L.push('Trancón de tres horas para avanzar dos cuadras: "es el precio del progreso", dice el alcalde (en helicóptero).');
  if(privCount())L.push('Alcalde: "Privatizar no es vender, es compartir". El contrato adjunto, en cambio, es de venta total.');
  if(S.cnt[T.PLAZA])L.push('Inauguran plaza con fuente: la fuente ya tiene su primer grafiti.');
  if(S.netB.stations>=2)L.push('Pasajeros del troncal rojo viajan como sardinas, pero "a tiempo", dice el alcalde.');
  if(S.netT.stations>=2)L.push('El tranvía hace "tilín" y bloquea el tráfico dos veces por hora. "Es parte de su encanto", dicen.');
  if(S.net.stations>=2)L.push('El metro elevado inaugura su segunda estación: ahora sí es una línea y no una escultura.');
  if(S.net.stations===1)L.push('Metro elevado de una sola estación: "Un metro que va de aquí a aquí", ironiza la oposición.');
  if(S.cnt[T.METRO])L.push('Alcalde se sube al metro para la foto. Se baja en la siguiente estación... que no existe.');
  if(S.cnt[T.STAD])L.push('El estadio se llena para ver al equipo local perder 5-0. El sobrecosto, en cambio, gana por goleada.');
  if(S.aTrn>.5)L.push('Buses llenos: ciudadanos descubren que se puede llegar tarde en transporte público también.');
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
function evText(ev){let t=ev.x.replace('__OPP__',G.opp);if(t.includes('__PRIV__')){const p=privPick();t=t.replace('__PRIV__',p?`${p.name.toLowerCase()} (${p.op})`:'un servicio')}return t}
function showEvent(ev){
  if(ev.id==='sobrecosto')G.bigBuilds=0;
  queueModal({kick:'Despacho del alcalde',title:ev.t,text:evText(ev),event:ev,opts:ev.o.map(o=>({l:o.l,s:o.s,f:o.f}))});
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
  if(a==='buscolor'){
    const b=BUSCOLS.find(x=>x.id===arg);if(!b)return;
    G.busColor=arg;
    for(const c of cars)if(c.bus)c.c=busColorOf();
    toast(`Flota de buses: ${b.n}`);addLog(`🚌 Repintas la flota de buses: ahora es ${b.n.toLowerCase()}. Los pasajeros no notan la diferencia, pero tú sí.`);
    refreshUI();return;
  }
  if(a==='priv'){
    const sec=SECTORS[arg],st=sectorStats(arg);
    if(G.priv[arg]){
      const cost=st.value;
      if(G.cap<6)return toast('Necesitas 6 de capital político',1);
      if(G.money<cost)return toast(`Reestatizar cuesta ${fmt(cost)} de indemnización`,1);
      E.money(-cost);E.cap(-6);delete G.priv[arg];delete G.cronies[arg];E.fac('fun',6);E.fac('vec',4);E.fac('emp',-5);
      addLog(`🏛️ Reestatizas ${sec.n.toLowerCase()}: el operador se va con una indemnización y mala cara.`);toast(`Reestatizado: ${sec.n}`);
      recalc();refreshUI();return;
    }
    if(!st.n)return toast(`Aún no tienes nada de ${sec.n.toLowerCase()} que privatizar`,1);
    if(G.cap<6)return toast('Necesitas 6 de capital político',1);
    const p=clamp(.3+G.loyalty/220+(S.approval-50)/220,.1,.9);
    let yes=0;for(let k=0;k<15;k++)if(Math.random()<p)yes++;
    if(yes<8){E.cap(-3);toast(`Concejo rechaza privatizar (${yes}–${15-yes})`,1);addLog(`🗳️ El concejo frena la privatización de ${sec.n.toLowerCase()} ${yes}–${15-yes}.`);refreshUI();return}
    const op=pick(OPS),v=st.value;
    const done=(mult,own,susp,crony,txt,fx)=>()=>{
      E.cap(-6);E.money(Math.round(v*mult));E.own(Math.round(v*own));E.susp(susp);
      G.priv[arg]=1;G.privOp[arg]=op;if(crony)G.cronies[arg]=1;
      if(fx)for(const k in fx)E.fac(k,fx[k]);
      addLog(`🏷️ ${sec.n} pasa a manos de ${op}.`);recalc();return txt;
    };
    queueModal({kick:`Concejo aprueba ${yes}–${15-yes}`,title:`Privatizar: ${sec.n}`,
      html:`<p>El concejo da luz verde. Tu secretario de hacienda estima la concesión en <b>${fmt(v)}</b>. El operador ahorra al municipio el 60% del mantenimiento, pero el servicio será peor y los ${arg==='trn'?'pasajes':'precios'} subirán. ¿Cómo la adjudicas?</p>`,
      event:{t:'Privatización'},
      opts:[
       {l:'Licitación pública abierta',s:`Recibes ~${fmt(v*1.15)}. Transparente y lenta.`,f:done(1.15,0,-1,false,`${op} gana la licitación, sin trampas visibles. Casi.`)},
       {l:`Adjudicar directo a ${op}`,s:`Recibes ~${fmt(v*.9)} y una tajada de ${fmt(v*.25)}. Sospechas y comisiones mensuales.`,f:done(.9,.25,9,true,`${op} "ganó" con una propuesta idéntica a la tuya. Los papeles están en orden. Los sobres también.`)},
       {l:'Vender al mejor postor extranjero',s:`Recibes ~${fmt(v*1.3)}. El pueblo no lo perdonará.`,f:done(1.3,0,2,false,`Un fondo con sede en un paraíso fiscal se lleva el activo. Nadie sabe quién firma.`,{vec:-4,fun:-4})},
       {l:'Mejor no',s:'No se firma nada',f:()=>'Rompes el borrador. Tu secretario lo había impreso a color.'}]});
    return;
  }
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
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;shCv.width=cv.width;shCv.height=cv.height}
const shade=(c,f)=>`rgb(${Math.min(255,c[0]*f)|0},${Math.min(255,c[1]*f)|0},${Math.min(255,c[2]*f)|0})`;
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function poly(fill,...p){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let k=2;k<p.length;k+=2)ctx.lineTo(p[k],p[k+1]);ctx.closePath();ctx.fill()}
/* --- sol y luz --- */
const SUN={cos:.6,dx:.5,dy:.18,low:.6,FL:.88,FR:.6,FT:1.1,alpha:.28};
function updateSun(t){
  let p=((t-.467+1)%1)/.566;
  if(window.__p!=null)p=window.__p;
  const day=p<=1;
  const a=Math.PI*clamp(p,0,1),c=Math.cos(a),sn=Math.sin(a);
  SUN.cos=c;SUN.dx=c*.85;SUN.dy=.16+.1*sn;SUN.low=Math.abs(c);
  SUN.FL=day?.8+.12*c:.62;SUN.FR=day?.66-.1*c:.55;SUN.FT=day?1.12-.1*SUN.low:.95;
  SUN.alpha=day?(.3+.16*SUN.low):0;
}
let SHEEN=0,DETAIL=true;
function prism(u0,v0,u1,v1,h,c,z=0){
  const ax=X(u0,v0),ay=Y(u0,v0)-z,bx=X(u1,v0),by=Y(u1,v0)-z,cx=X(u1,v1),cy=Y(u1,v1)-z,dx=X(u0,v1),dy=Y(u0,v1)-z;
  poly(shade(c,SUN.FL),dx,dy,cx,cy,cx,cy-h,dx,dy-h);
  poly(shade(c,SUN.FR),cx,cy,bx,by,bx,by-h,cx,cy-h);
  poly(shade(c,SUN.FT),ax,ay-h,bx,by-h,cx,cy-h,dx,dy-h);
  if(h<=5)return;
  const ao=Math.min(6,h*.3);
  poly('rgba(0,0,0,.15)',dx,dy,cx,cy,cx,cy-ao,dx,dy-ao);
  poly('rgba(0,0,0,.2)',cx,cy,bx,by,bx,by-ao,cx,cy-ao);
  if(DETAIL&&h>18){
    ctx.strokeStyle='rgba(0,0,0,.075)';ctx.lineWidth=.7;ctx.beginPath();
    for(let g=8;g<h-2;g+=8){ctx.moveTo(dx,dy-g);ctx.lineTo(cx,cy-g);ctx.lineTo(bx,by-g)}
    ctx.stroke();
  }
  if(SHEEN){
    const P=(f,g)=>[dx+(cx-dx)*f,dy+(cy-dy)*f-h*g];
    for(const [f0,f1,al] of [[.08,.3,.16],[.4,.5,.1]]){
      const q=[P(f0,1),P(f1,1),P(f1+.28,0),P(f0+.28,0)];
      poly(`rgba(255,255,255,${al*(1-night*.8)})`,q[0][0],q[0][1],q[1][0],q[1][1],q[2][0],q[2][1],q[3][0],q[3][1]);
    }
  }
  ctx.lineWidth=.8;ctx.strokeStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.moveTo(dx,dy-h);ctx.lineTo(cx,cy-h);ctx.lineTo(bx,by-h);ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-h);ctx.stroke();
}
function pyr(u0,v0,u1,v1,z,rh,c){
  const um=(u0+u1)/2,vm=(v0+v1)/2,tx=X(um,vm),ty=Y(um,vm)-z-rh;
  const bx=X(u1,v0),by=Y(u1,v0)-z,cx=X(u1,v1),cy=Y(u1,v1)-z,dx=X(u0,v1),dy=Y(u0,v1)-z;
  poly(shade(c,SUN.FL*.98),dx,dy,cx,cy,tx,ty);poly(shade(c,SUN.FR*.96),cx,cy,bx,by,tx,ty);
  if(DETAIL){
    ctx.strokeStyle='rgba(0,0,0,.14)';ctx.lineWidth=.7;ctx.beginPath();
    for(const f of [.33,.66]){
      ctx.moveTo(dx+(tx-dx)*f,dy+(ty-dy)*f);ctx.lineTo(cx+(tx-cx)*f,cy+(ty-cy)*f);ctx.lineTo(bx+(tx-bx)*f,by+(ty-by)*f);
    }
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(dx,dy);ctx.lineTo(tx,ty);ctx.lineTo(bx,by);ctx.stroke();
}
function flat(u0,v0,u1,v1,z,col){poly(col,X(u0,v0),Y(u0,v0)-z,X(u1,v0),Y(u1,v0)-z,X(u1,v1),Y(u1,v1)-z,X(u0,v1),Y(u0,v1)-z)}
function cyl(u,v,r,h,c,z=0){
  const x=X(u,v),y=Y(u,v)-z;
  ctx.fillStyle=shade(c,SUN.FL*.92);ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r,y-h);ctx.lineTo(x+r,y-h);ctx.lineTo(x+r,y);
  ctx.ellipse(x,y,r,r*.5,0,0,Math.PI);ctx.fill();
  ctx.fillStyle=shade(c,SUN.FR*.95);ctx.beginPath();ctx.moveTo(x+r*.2,y+r*.48);ctx.lineTo(x+r*.2,y-h);ctx.lineTo(x+r,y-h);ctx.lineTo(x+r,y);ctx.ellipse(x,y,r,r*.5,0,0,Math.PI*.4);ctx.fill();
  ctx.fillStyle=shade(c,SUN.FT);ctx.beginPath();ctx.ellipse(x,y-h,r,r*.5,0,0,7);ctx.fill();
  if(h>8){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(x,y-h,r,r*.5,0,0,7);ctx.stroke()}
}
const WTC={};
function winTone(tone,r,c,seed){
  let a=WTC[tone];
  if(!a){const rgb=hex(tone);a=WTC[tone]=[tone,shade(rgb,1.4),shade(rgb,.78),`rgb(${Math.min(255,rgb[0]*1.6+40)|0},${Math.min(255,rgb[1]*1.5+30)|0},${rgb[2]*1.1|0})`]}
  const h=hsh(curIdx,r*9+c,seed+40);
  return h<.6?a[0]:h<.8?a[1]:h<.92?a[2]:a[3];
}
function windows(uA,vA,uB,vB,z,h,rows,cols,tone,seed){
  const idx=curIdx;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const f0=(c+.2)/cols,f1=(c+.8)/cols,g0=z+h*(r+.25)/rows,g1=z+h*(r+.7)/rows;
    const x0=X(uA+(uB-uA)*f0,vA+(vB-vA)*f0),y0=Y(uA+(uB-uA)*f0,vA+(vB-vA)*f0);
    const x1=X(uA+(uB-uA)*f1,vA+(vB-vA)*f1),y1=Y(uA+(uB-uA)*f1,vA+(vB-vA)*f1);
    const lit=night>.15&&hsh(idx,r*9+c,seed)<.5;
    if(lit)lights.push(x0,y0-g1,x1,y1-g1,x1,y1-g0,x0,y0-g0);
    else{
      poly(winTone(tone,r,c,seed),x0,y0-g1,x1,y1-g1,x1,y1-g0,x0,y0-g0);
      if(DETAIL&&(r+c)%2===0){ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x0,y0-g0);ctx.lineTo(x1,y1-g1);ctx.stroke()}
    }
  }
}
function tree(u,v,s=1,c=[70,150,80],kind=0){
  const x=X(u,v),y=Y(u,v);
  ctx.fillStyle='rgba(10,20,30,.2)';ctx.beginPath();ctx.ellipse(x+SUN.dx*9*s,y+1+SUN.dy*5*s,6.5*s,3.1*s,0,0,7);ctx.fill();
  if(kind===1){
    ctx.fillStyle='#5b4030';ctx.fillRect(x-1,y-4*s,2,4*s);
    for(let k=0;k<3;k++){
      const w=(7-k*1.9)*s,yy=y-(4+k*5)*s;
      poly(shade(c,.72+k*.08),x,yy-8*s,x+w,yy,x-w,yy);
      poly(shade(c,.95+k*.1),x,yy-8*s,x,yy,x-w,yy);
    }
  }else if(kind===2){
    ctx.fillStyle=shade(c,.8);ctx.beginPath();ctx.arc(x+2*s,y-3*s,4*s,0,7);ctx.fill();
    ctx.fillStyle=shade(c,1.05);ctx.beginPath();ctx.arc(x-1.5*s,y-4*s,4.2*s,0,7);ctx.fill();
  }else{
    ctx.fillStyle='#5b4030';ctx.fillRect(x-1,y-6*s,2,6*s);
    ctx.fillStyle=shade(c,.72);ctx.beginPath();ctx.arc(x+1.5*s,y-8*s,6.2*s,0,7);ctx.fill();
    ctx.fillStyle=shade(c,.95);ctx.beginPath();ctx.arc(x-.5*s,y-10*s,5.8*s,0,7);ctx.fill();
    ctx.fillStyle=shade(c,1.2);ctx.beginPath();ctx.arc(x-2.4*s,y-12*s,3.4*s,0,7);ctx.fill();
  }
}
function forestTile(i,j){
  const tone=meta.tone?meta.tone[j*N+i]:.5,dry=G&&G.dry?G.dry:0;
  const list=[];
  for(let k=0;k<4;k++)list.push([.12+.76*hsh(i,j,20+k),.12+.76*hsh(i,j,30+k),k]);
  list.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
  for(const [u,v,k] of list){
    const h=hsh(i,j,40+k),kind=h<.55?0:h<.88?1:2;
    const base=[62+tone*30+dry*40,132+tone*26-dry*30,70-dry*20];
    tree(u,v,.85+hsh(i,j,50+k)*.35,base,kind);
  }
}
function hull(pts){
  pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[];for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  const up=[];for(let k=pts.length-1;k>=0;k--){const p=pts[k];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
  up.pop();lo.pop();return lo.concat(up);
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
  SHEEN=((t===T.C&&l>=2)||(t===T.R&&l>=4)||t===T.HOSP||t===T.METRO)?1:0;
  drawBuilding0(t,l,i,j,sx,sy);SHEEN=0;
}
function roofDeco(u0,v0,u1,v1,z,seed){
  const n=1+((hsh(curIdx,seed,7)*3)|0);
  for(let k=0;k<n;k++){
    const u=u0+(u1-u0-.16)*hsh(curIdx,k,8),v=v0+(v1-v0-.14)*hsh(curIdx,k,9);
    prism(u,v,u+.14,v+.11,3.5,[176,178,182],z);
    const x=X(u+.07,v+.055),y=Y(u+.07,v+.055)-z-3.5;ctx.fillStyle='#4a4f56';ctx.beginPath();ctx.ellipse(x,y,2.6,1.3,0,0,7);ctx.fill();
  }
}
function drawBuilding0(t,l,i,j,sx,sy){
  const sub=grid.sub[j*N+i],hv=sub/256;
  const nearly=night>.15;
  if(t===T.R){
    if(l===0)return;
    const w=WALL_R[sub%WALL_R.length],rf=ROOF[(sub>>2)%ROOF.length];
    if(l===1){
      const two=hv>.5;
      if(two){prism(.12,.12,.45,.45,11,w);pyr(.12,.12,.45,.45,11,8,rf);prism(.55,.5,.88,.84,10,WALL_R[(sub+1)%6]);pyr(.55,.5,.88,.84,10,7,ROOF[(sub+1)%4]);
        windows(.45,.12,.45,.45,0,11,1,1,'#3a4a58',1);}
      else{prism(.2,.2,.8,.8,13,w);pyr(.2,.2,.8,.8,13,11,rf);prism(.6,.3,.68,.38,7,[150,104,90],14);windows(.8,.2,.8,.8,0,13,1,2,'#35475a',2);windows(.2,.8,.8,.8,0,13,1,2,'#35475a',3);poly('#5a3b2a',X(.8,.46),Y(.8,.46),X(.8,.54),Y(.8,.54),X(.8,.54),Y(.8,.54)-7,X(.8,.46),Y(.8,.46)-7)}
      tree(.9,.12,.7);
    }else if(l===2){
      prism(.12,.12,.88,.88,30,w);flat(.12,.12,.88,.88,30,shade(w,1.05));prism(.4,.4,.6,.6,6,[120,120,130],30);roofDeco(.15,.15,.85,.85,30,3);
      windows(.88,.12,.88,.88,0,30,3,3,'#3a4d60',4);windows(.12,.88,.88,.88,0,30,3,3,'#3a4d60',5);
    }else if(l===3){
      prism(.1,.1,.9,.9,16,[120,120,135]);prism(.18,.18,.82,.82,56,w,16);
      windows(.82,.18,.82,.82,16,56,6,4,'#36485c',6);windows(.18,.82,.82,.82,16,56,6,4,'#36485c',7);
      windows(.9,.1,.9,.9,0,16,1,4,'#2e3d4c',8);
      prism(.4,.4,.6,.6,6,[110,110,120],72);
    }else{
      const hh=l===4?92:132;
      prism(.06,.06,.94,.94,20,[110,112,128]);
      windows(.94,.06,.94,.94,0,20,2,5,'#2e3d4c',23);windows(.06,.94,.94,.94,0,20,2,5,'#2e3d4c',24);
      prism(.2,.2,.8,.8,hh,w,20);
      windows(.8,.2,.8,.8,20,hh,Math.round(hh/9),4,'#36485c',25);windows(.2,.8,.8,.8,20,hh,Math.round(hh/9),4,'#36485c',26);
      prism(.32,.32,.68,.68,10,[100,104,118],20+hh);
      if(l===5){prism(.4,.4,.6,.6,16,[90,94,108],30+hh);const x=X(.5,.5),y=Y(.5,.5)-46-hh;ctx.strokeStyle='#ddd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-14);ctx.stroke();if(night>.15&&(TNOW%1600)<800)lights.push(x-1,y-16,x+1,y-16,x+1,y-13,x-1,y-13)}
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
      prism(.3,.3,.7,.7,5,[150,160,170],34);roofDeco(.12,.12,.88,.88,34,4);
    }else if(l===3){
      prism(.1,.1,.9,.9,22,[140,150,160]);prism(.2,.2,.8,.8,50,g,22);prism(.35,.35,.65,.65,26,g.map(v=>v*1.1),72);
      windows(.8,.2,.8,.8,22,50,5,4,'#27455f',12);windows(.2,.8,.8,.8,22,50,5,4,'#27455f',13);
      windows(.65,.35,.65,.65,72,26,3,3,'#27455f',14);windows(.35,.65,.65,.65,72,26,3,3,'#27455f',15);
      const x=X(.5,.5),y=Y(.5,.5)-98;ctx.strokeStyle='#ccc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-12);ctx.stroke();
      if(night>.15){const bl=(TNOW%1400)<700;if(bl)lights.push(x-1,y-14,x+1,y-14,x+1,y-12,x-1,y-12)}
    }else{
      const hh=l===4?100:142;
      prism(.06,.06,.94,.94,24,[140,150,160]);
      windows(.94,.06,.94,.94,2,22,2,5,'#27455f',27);windows(.06,.94,.94,.94,2,22,2,5,'#27455f',28);
      prism(.18,.18,.82,.82,hh,g,24);
      windows(.82,.18,.82,.82,24,hh,Math.round(hh/8),4,'#27455f',29);windows(.18,.82,.82,.82,24,hh,Math.round(hh/8),4,'#27455f',30);
      prism(.3,.3,.7,.7,14,g.map(v=>v*1.15),24+hh);
      windows(.7,.3,.7,.7,24+hh,14,1,3,'#27455f',31);
      if(l===5){prism(.42,.42,.58,.58,20,g.map(v=>v*1.25),38+hh);const x=X(.5,.5),y=Y(.5,.5)-58-hh;ctx.strokeStyle='#ddd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-16);ctx.stroke();if(night>.15&&(TNOW%1400)<700)lights.push(x-1.5,y-18,x+1.5,y-18,x+1.5,y-14,x-1.5,y-14)}
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
  }else if(t===T.BUS){
    flat(.05,.05,.95,.95,0,'#b9bcb3');
    ctx.strokeStyle='#4d5a66';ctx.lineWidth=1.6;
    for(const [u,v] of [[.3,.35],[.7,.35]]){ctx.beginPath();ctx.moveTo(X(u,v),Y(u,v));ctx.lineTo(X(u,v),Y(u,v)-14);ctx.stroke()}
    prism(.25,.3,.75,.45,2,[60,150,200],14);
    poly('rgba(160,210,240,.7)',X(.75,.3),Y(.75,.3)-12,X(.75,.45),Y(.75,.45)-12,X(.75,.45),Y(.75,.45)-2,X(.75,.3),Y(.75,.3)-2);
    ctx.fillStyle='#2e6fb5';ctx.beginPath();ctx.arc(X(.85,.75),Y(.85,.75)-22,5,0,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('B',X(.85,.75),Y(.85,.75)-19.5);
    ctx.strokeStyle='#666';ctx.beginPath();ctx.moveTo(X(.85,.75),Y(.85,.75));ctx.lineTo(X(.85,.75),Y(.85,.75)-18);ctx.stroke();
  }else if(t===T.METRO){
    flat(.03,.03,.97,.97,0,'#c9ccd1');
    prism(.15,.15,.85,.85,14,[90,98,112]);flat(.15,.15,.85,.85,14,'#aab4c4');
    poly('rgba(120,190,230,.75)',X(.85,.25),Y(.85,.25)-12,X(.85,.75),Y(.85,.75)-12,X(.85,.75),Y(.85,.75)-3,X(.85,.25),Y(.85,.25)-3);
    const cx=X(.5,.5),cy=Y(.5,.5)-26;
    ctx.strokeStyle='#555';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,Y(.5,.5)-14);ctx.lineTo(cx,cy+6);ctx.stroke();
    ctx.fillStyle='#d6322b';ctx.beginPath();ctx.arc(cx,cy,9,0,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('M',cx,cy+4);
  }else if(t===T.LIB){
    prism(.1,.14,.9,.86,18,[214,196,160]);flat(.1,.14,.9,.86,18,'#e7dcc2');
    for(let k=0;k<5;k++){const v=.2+k*.14;ctx.strokeStyle='#f5eedd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X(.92,v),Y(.92,v));ctx.lineTo(X(.92,v),Y(.92,v)-17);ctx.stroke()}
    poly('#b4a273',X(.93,.12),Y(.93,.12)-18,X(.93,.88),Y(.93,.88)-18,X(.93,.5),Y(.93,.5)-27);
    windows(.9,.14,.9,.86,3,12,1,3,'#6b5a3e',32);
  }else if(t===T.UNI){
    prism(.06,.1,.94,.4,20,[170,92,72]);prism(.06,.6,.94,.9,20,[170,92,72]);
    flat(.06,.1,.94,.4,20,'#c9856e');flat(.06,.6,.94,.9,20,'#c9856e');
    windows(.94,.1,.94,.4,3,14,1,4,'#e8d8a0',33);windows(.94,.6,.94,.9,3,14,1,4,'#e8d8a0',34);
    prism(.3,.38,.7,.62,12,[190,120,96],8);
    prism(.4,.4,.6,.6,26,[210,190,150],20);
    const x=X(.5,.5),y=Y(.5,.5)-46;
    ctx.fillStyle='#4a8f7a';ctx.beginPath();ctx.ellipse(x,y,9,6,0,Math.PI,0);ctx.fill();
    ctx.strokeStyle='#ddd';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x,y-14);ctx.stroke();
    poly('#e0b45a',x,y-14,x+8,y-11,x,y-8);
  }else if(t===T.HOSP){
    prism(.08,.1,.92,.9,40,[238,240,242]);flat(.08,.1,.92,.9,40,'#f6f8f9');
    windows(.92,.1,.92,.9,4,34,4,4,'#7fb4d8',35);windows(.08,.9,.92,.9,4,34,4,4,'#7fb4d8',36);
    flat(.3,.3,.7,.7,40.2,'#d8dde0');
    ctx.fillStyle='#e0443c';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('H',X(.5,.5),Y(.5,.5)-37);
    poly('#e0443c',X(.92,.38),Y(.92,.38)-30,X(.92,.62),Y(.92,.62)-30,X(.92,.62),Y(.92,.62)-22,X(.92,.38),Y(.92,.38)-22);
    flat(.38,.46,.62,.54,.3,'#fff');
  }else if(t===T.STAD){
    flat(.02,.02,.98,.98,0,'#b2b3a8');
    const cx=X(.5,.5),cy=Y(.5,.5);
    ctx.fillStyle='#8a8d96';ctx.beginPath();ctx.ellipse(cx,cy+3,31,15,0,0,7);ctx.fill();
    ctx.fillStyle='#c8ccd3';ctx.beginPath();ctx.ellipse(cx,cy-9,31,15,0,0,7);ctx.fill();
    ctx.fillStyle='#9aa0aa';ctx.beginPath();ctx.ellipse(cx,cy-9,25,11.5,0,0,7);ctx.fill();
    ctx.fillStyle='#4f9d5a';ctx.beginPath();ctx.ellipse(cx,cy-8,19,8,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy-8,19,8,0,0,7);ctx.moveTo(cx,cy-16);ctx.lineTo(cx,cy);ctx.stroke();
    for(const [dx,dy] of [[-27,-4],[27,-4],[-14,10],[14,10]]){ctx.strokeStyle='#666';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx+dx,cy+dy);ctx.lineTo(cx+dx,cy+dy-28);ctx.stroke();ctx.fillStyle='#f3efd0';ctx.fillRect(cx+dx-4,cy+dy-32,8,4);if(night>.1)lights.push(cx+dx-5,cy+dy-33,cx+dx+5,cy+dy-33,cx+dx+5,cy+dy-27,cx+dx-5,cy+dy-27)}
  }else if(t===T.WIND){
    flat(.05,.05,.95,.95,0,'#8fb98a');
    const cx=X(.5,.5),cy=Y(.5,.5);
    ctx.fillStyle='#e8eaed';ctx.beginPath();ctx.moveTo(cx-2.5,cy);ctx.lineTo(cx+2.5,cy);ctx.lineTo(cx+1,cy-46);ctx.lineTo(cx-1,cy-46);ctx.fill();
    const a=TNOW/420+hsh(curIdx,0,6)*6;
    ctx.strokeStyle='#f2f4f6';ctx.lineWidth=2.2;ctx.lineCap='round';
    for(let k=0;k<3;k++){const an=a+k*2.0944;ctx.beginPath();ctx.moveTo(cx,cy-46);ctx.lineTo(cx+Math.cos(an)*20,cy-46+Math.sin(an)*20);ctx.stroke()}
    ctx.lineCap='butt';ctx.fillStyle='#c9cdd3';ctx.beginPath();ctx.arc(cx,cy-46,2.4,0,7);ctx.fill();
  }else if(t===T.RECY){
    prism(.1,.12,.9,.88,16,[110,170,120]);flat(.1,.12,.9,.88,16,'#7fc18a');
    windows(.9,.12,.9,.88,3,10,1,4,'#2f4a38',37);
    cyl(.28,.3,5,8,[80,150,100],16);
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    const sx2=X(.9,.5),sy2=Y(.9,.5)-8;ctx.fillText('♻',sx2,sy2+3);
    for(const [u,v,c] of [[.2,.82,[70,130,200]],[.34,.88,[230,190,60]],[.48,.92,[90,170,90]]])prism(u,v,u+.1,v+.07,4,c,0);
  }else if(t===T.PLAZA){
    flat(.02,.02,.98,.98,0,'#dcd2b6');
    for(let a=0;a<4;a++)for(let b=0;b<4;b++)if((a+b)%2)flat(.06+a*.22,.06+b*.22,.06+(a+1)*.22,.06+(b+1)*.22,.1,'#cdbf9c');
    cyl(.5,.5,9,4,[170,176,186]);
    const fx=X(.5,.5),fy=Y(.5,.5)-4;
    ctx.fillStyle='#6fb8e0';ctx.beginPath();ctx.ellipse(fx,fy,7,3.3,0,0,7);ctx.fill();
    const jet=Math.sin(TNOW/260)*1.5;ctx.strokeStyle='rgba(220,240,255,.85)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy-9-jet);ctx.stroke();
    ctx.fillStyle='rgba(220,240,255,.7)';ctx.beginPath();ctx.arc(fx-2,fy-7-jet,1.2,0,7);ctx.arc(fx+2,fy-6-jet,1.2,0,7);ctx.fill();
    prism(.1,.3,.2,.5,3,[130,88,56]);prism(.8,.5,.9,.7,3,[130,88,56]);prism(.3,.82,.5,.9,3,[130,88,56]);
    tree(.12,.12,.95,[70,150,80]);tree(.88,.14,.85,[210,130,150]);tree(.86,.88,.9,[80,150,80]);
    for(let k=0;k<5;k++){const an=TNOW/1800*(k%2?1:-1)+k*1.3,px=X(.5+Math.cos(an)*.3,.5+Math.sin(an)*.3),py=Y(.5+Math.cos(an)*.3,.5+Math.sin(an)*.3);ctx.fillStyle=['#d9534f','#4a90d9','#f0c040','#5cb85c','#9b59b6'][k];ctx.fillRect(px-1,py-5,2,4);ctx.fillStyle='#f1c9a0';ctx.fillRect(px-.8,py-7,1.6,1.8)}
    const lx=X(.12,.88),ly=Y(.12,.88);ctx.fillStyle='#555';ctx.fillRect(lx-.5,ly-12,1,12);if(night>.15)lights.push(lx-3,ly-15,lx+3,ly-15,lx+3,ly-10,lx-3,ly-10);
  }else if(t===T.JAIL){
    prism(.06,.1,.94,.9,20,[140,140,148]);flat(.06,.1,.94,.9,20,'#9aa0a8');
    flat(.2,.25,.8,.75,20.3,'#7e848c');
    for(let k=0;k<5;k++){const v=.16+k*.15;ctx.strokeStyle='#2c3036';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(X(.94,v),Y(.94,v)-4);ctx.lineTo(X(.94,v),Y(.94,v)-14);ctx.stroke()}
    cyl(.1,.14,4.5,38,[150,150,158]);cyl(.9,.86,4.5,38,[150,150,158]);
    ctx.fillStyle='#454a52';ctx.beginPath();ctx.ellipse(X(.1,.14),Y(.1,.14)-38,6,3.4,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(X(.9,.86),Y(.9,.86)-38,6,3.4,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(60,64,70,.85)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.02,.98),Y(.02,.98));ctx.lineTo(X(.98,.98),Y(.98,.98));ctx.lineTo(X(.98,.02),Y(.98,.02));ctx.stroke();
    if(night>.15)lights.push(X(.9,.86)-4,Y(.9,.86)-42,X(.9,.86)+4,Y(.9,.86)-42,X(.9,.86)+4,Y(.9,.86)-38,X(.9,.86)-4,Y(.9,.86)-38);
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

const elevAt=(i,j)=>inb(i,j)?grid.elev[j*N+i]:0;
function drawElev(i,j,idx){
  const e=grid.elev[idx],z=34;
  const n=[elevAt(i+1,j),elevAt(i-1,j),elevAt(i,j+1),elevAt(i,j-1)];
  const dc=[196,200,208];
  prism(.44,.44,.56,.56,z,[158,160,168]);
  if(e===2){
    prism(.18,.18,.82,.82,3,[184,190,202],z);
    for(const [u,v] of [[.22,.22],[.78,.22],[.22,.78],[.78,.78]]){ctx.strokeStyle='#8a8f99';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X(u,v),Y(u,v)-z-3);ctx.lineTo(X(u,v),Y(u,v)-z-18);ctx.stroke()}
    prism(.16,.16,.84,.84,2.5,[205,70,62],z+18);
    flat(.16,.16,.84,.84,z+20.5,'#e2574d');
    const cx=X(.5,.5),cy=Y(.5,.5)-z-30;
    ctx.fillStyle='#d6322b';ctx.beginPath();ctx.arc(cx,cy,7,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText('M',cx,cy+3.3);
    if(night>.15)lights.push(cx-5,cy-5,cx+5,cy-5,cx+5,cy+5,cx-5,cy+5);
  }
  prism(.36,.36,.64,.64,3,dc,z);
  if(n[0])prism(.64,.36,1,.64,3,dc,z);if(n[1])prism(0,.36,.36,.64,3,dc,z);
  if(n[2])prism(.36,.64,.64,1,3,dc,z);if(n[3])prism(.36,0,.64,.36,3,dc,z);
  ctx.strokeStyle='#3a3e46';ctx.lineWidth=1;ctx.beginPath();
  const seg=(u0,v0,u1,v1)=>{ctx.moveTo(X(u0,v0),Y(u0,v0)-z-3);ctx.lineTo(X(u1,v1),Y(u1,v1)-z-3)};
  for(const o of [.45,.55]){
    if(n[0]||n[1]){seg(n[1]?0:.5,o,n[0]?1:.5,o)}
    if(n[2]||n[3]){seg(o,n[3]?0:.5,o,n[2]?1:.5)}
  }
  ctx.stroke();
}
function drawTramBrt(i,j,idx){
  const tr=grid.tram[idx],br=grid.brt[idx];
  const arr=tr?grid.tram:grid.brt;
  const nb=[inb(i+1,j)&&arr[j*N+i+1],inb(i-1,j)&&arr[j*N+i-1],inb(i,j+1)&&arr[(j+1)*N+i],inb(i,j-1)&&arr[(j-1)*N+i]];
  const any=nb[0]||nb[1]||nb[2]||nb[3];
  const segs=[];
  if(nb[0]||nb[1]||!any)segs.push([nb[1]||!any?0:.5,nb[0]||!any?1:.5,0]);
  if(nb[2]||nb[3])segs.push([nb[3]?0:.5,nb[2]?1:.5,1]);
  if(br){
    const lane=shade(brtColor(),.82);
    for(const [a,b,ax] of segs){ax?flat(.34,a,.66,b,.15,lane):flat(a,.34,b,.66,.15,lane)}
    flat(.34,.34,.66,.66,.15,lane);
    ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();
    for(const [a,b,ax] of segs)for(const o of [.34,.66]){if(ax){ctx.moveTo(X(o,a),Y(o,a)-.15);ctx.lineTo(X(o,b),Y(o,b)-.15)}else{ctx.moveTo(X(a,o),Y(a,o)-.15);ctx.lineTo(X(b,o),Y(b,o)-.15)}}
    ctx.stroke();
    if(br===2){
      prism(.22,.28,.78,.72,2,[196,200,208]);
      prism(.24,.3,.76,.7,13,[150,200,225]);
      flat(.22,.28,.78,.72,16,shade(brtColor(),1.05));prism(.22,.28,.78,.72,2.5,brtColor(),13.5);
      ctx.fillStyle='#fff';ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.fillText('BRT',X(.5,.5),Y(.5,.5)-18.5);
      if(night>.15)lights.push(X(.78,.5)-6,Y(.78,.5)-12,X(.78,.5)+6,Y(.78,.5)-12,X(.78,.5)+6,Y(.78,.5)-4,X(.78,.5)-6,Y(.78,.5)-4);
    }
  }else{
    ctx.strokeStyle='rgba(215,220,228,.95)';ctx.lineWidth=1.1;ctx.beginPath();
    for(const o of [.44,.56])for(const [a,b,ax] of segs){if(ax){ctx.moveTo(X(o,a),Y(o,a)-.15);ctx.lineTo(X(o,b),Y(o,b)-.15)}else{ctx.moveTo(X(a,o),Y(a,o)-.15);ctx.lineTo(X(b,o),Y(b,o)-.15)}}
    ctx.stroke();
    if(tr===2){
      flat(.1,.02,.62,.2,.3,'#d0cfc4');
      for(const u of [.14,.58]){ctx.strokeStyle='#4d5a66';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(X(u,.08),Y(u,.08));ctx.lineTo(X(u,.08),Y(u,.08)-13);ctx.stroke()}
      prism(.1,.02,.62,.2,2,[84,168,120],13);
      ctx.fillStyle='#2f8f55';ctx.beginPath();ctx.arc(X(.78,.1),Y(.78,.1)-18,4.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 6px sans-serif';ctx.textAlign='center';ctx.fillText('T',X(.78,.1),Y(.78,.1)-16);
      ctx.strokeStyle='#666';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.78,.1),Y(.78,.1));ctx.lineTo(X(.78,.1),Y(.78,.1)-13.5);ctx.stroke();
    }
  }
}
function drawRoad(i,j,sx,sy){
  const n=[isRoad(typeAt(i+1,j)),isRoad(typeAt(i-1,j)),isRoad(typeAt(i,j+1)),isRoad(typeAt(i,j-1))];
  const ave=isAveIdx(j*N+i);
  const cnt=n.filter(Boolean).length;
  flat(0,0,1,1,0,'#c2c4bb');
  const a=ave?.06:.18,b=1-a,v=hsh(i,j,2);
  const asp=ave?`rgb(${50+v*6|0},${56+v*6|0},${66+v*6|0})`:`rgb(${58+v*8|0},${64+v*8|0},${74+v*8|0})`;
  flat(a,a,b,b,0,asp);
  if(n[0])flat(b,a,1,b,0,asp);if(n[1])flat(0,a,a,b,0,asp);
  if(n[2])flat(a,b,b,1,0,asp);if(n[3])flat(a,0,b,a,0,asp);
  // bordillo
  ctx.strokeStyle='rgba(235,235,228,.55)';ctx.lineWidth=.9;ctx.beginPath();
  const seg=(u0,v0,u1,v1)=>{ctx.moveTo(X(u0,v0),Y(u0,v0));ctx.lineTo(X(u1,v1),Y(u1,v1))};
  for(const [nn,u0,v0,u1,v1] of [[n[0],b,a,b,b],[n[1],a,a,a,b],[n[2],a,b,b,b],[n[3],a,a,b,a]])if(!nn)seg(u0,v0,u1,v1);
  ctx.stroke();
  // lineas de carril
  ctx.strokeStyle=ave?'rgba(245,215,110,.95)':'rgba(235,210,120,.8)';ctx.lineWidth=ave?1.4:1;ctx.setLineDash(ave?[]:[3,3]);
  ctx.beginPath();
  const d=ave?.025:0;
  for(const o of (ave?[-d,d]:[0])){
    if(n[0])seg(.5,.5+o,1,.5+o);if(n[1])seg(0,.5+o,.5,.5+o);
    if(n[2])seg(.5+o,.5,.5+o,1);if(n[3])seg(.5+o,0,.5+o,.5);
  }
  ctx.stroke();ctx.setLineDash([]);
  if(ave){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=.8;ctx.beginPath();for(const o of [.14,.86]){if(n[0])seg(.5,o,1,o);if(n[1])seg(0,o,.5,o);if(n[2])seg(o,.5,o,1);if(n[3])seg(o,0,o,.5)}ctx.stroke()}
  if(grid.typ[j*N+i]===T.ROUND){
    const cx=X(.5,.5),cy=Y(.5,.5),k2=Math.SQRT2;
    ctx.fillStyle='#c2c4bb';ctx.beginPath();ctx.ellipse(cx,cy,k2*.47*HW,k2*.47*HH,0,0,7);ctx.fill();
    ctx.fillStyle=asp;ctx.beginPath();ctx.ellipse(cx,cy,k2*.44*HW,k2*.44*HH,0,0,7);ctx.fill();
    if(DETAIL){ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=.9;ctx.setLineDash([3,3]);ctx.beginPath();ctx.ellipse(cx,cy,k2*.34*HW,k2*.34*HH,0,0,7);ctx.stroke();ctx.setLineDash([])}
    ctx.fillStyle='#d6d6cc';ctx.beginPath();ctx.ellipse(cx,cy,k2*.26*HW,k2*.26*HH,0,0,7);ctx.fill();
    ctx.fillStyle='#78bc70';ctx.beginPath();ctx.ellipse(cx,cy,k2*.22*HW,k2*.22*HH,0,0,7);ctx.fill();
  }
  // pasos peatonales y semaforos en cruces
  if(cnt>=3&&DETAIL&&grid.typ[j*N+i]!==T.ROUND){
    ctx.fillStyle='rgba(255,255,255,.78)';
    const zebra=(arm)=>{
      for(let k=0;k<5;k++){
        const o=a+(b-a)*(k+.3)/5,w=(b-a)/12;
        if(arm===0)flat(b+.03,o,b+.1,o+w*2,0,'rgba(255,255,255,.75)');
        if(arm===1)flat(a-.1,o,a-.03,o+w*2,0,'rgba(255,255,255,.75)');
        if(arm===2)flat(o,b+.03,o+w*2,b+.1,0,'rgba(255,255,255,.75)');
        if(arm===3)flat(o,a-.1,o+w*2,a-.03,0,'rgba(255,255,255,.75)');
      }
    };
    for(let k=0;k<4;k++)if(n[k])zebra(k);
    const ph=Math.floor(TNOW/3500+(i*7+j*3)%4)%2;
    const x=X(a-.02,a-.02),y=Y(a-.02,a-.02);
    ctx.fillStyle='#454a52';ctx.fillRect(x-.6,y-11,1.2,11);
    ctx.fillStyle=ph?'#58d66e':'#e5463e';ctx.beginPath();ctx.arc(x,y-12,1.8,0,7);ctx.fill();
    if(night>.15)lights.push(x-2.5,y-14.5,x+2.5,y-14.5,x+2.5,y-9.5,x-2.5,y-9.5);
  }
  if(night>.15&&hsh(i,j,2)<.5){const x=X(.12,.12),y=Y(.12,.12);ctx.fillStyle='#555';ctx.fillRect(x-.5,y-10,1,10);lights.push(x-2,y-12,x+2,y-12,x+2,y-8,x-2,y-8)}
}
const ZCOL={[T.R]:'rgba(100,200,120,.55)',[T.C]:'rgba(90,160,235,.55)',[T.I]:'rgba(235,185,80,.55)'};
const meta={};
function terrainMeta(){
  const sd=G?G.seed:1,n=N*N;
  meta.shore=new Uint8Array(n);meta.wd=new Uint8Array(n);meta.wf=new Float32Array(n);meta.tone=new Float32Array(n);meta.lite=new Float32Array(n);
  const water=(i,j)=>inb(i,j)&&grid.ter[j*N+i]===1;
  const land=(i,j)=>inb(i,j)&&grid.ter[j*N+i]!==1;
  const hf=(x,y)=>vnoise(x*.1,y*.1,sd+3)*.8+vnoise(x*.25,y*.25,sd+4)*.2;
  const q=[];
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const k=j*N+i,w=grid.ter[k]===1;
    let bits=0;
    if(w){if(land(i+1,j))bits|=1;if(land(i-1,j))bits|=2;if(land(i,j+1))bits|=4;if(land(i,j-1))bits|=8;if(bits){meta.wd[k]=1;q.push(k)}}
    else{if(water(i+1,j))bits|=1;if(water(i-1,j))bits|=2;if(water(i,j+1))bits|=4;if(water(i,j-1))bits|=8}
    meta.shore[k]=bits;
    meta.tone[k]=vnoise(i*.08+9,j*.08,sd+11);
    meta.lite[k]=clamp((hf(i-1,j)-hf(i+1,j)+(hf(i,j-1)-hf(i,j+1))*.5)*1.5,-.13,.13);
  }
  // distancia a la costa para dar profundidad al agua
  for(let h=0;h<q.length;h++){
    const k=q[h],i=k%N,j=(k/N)|0,d=meta.wd[k];
    if(d>=4)continue;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b;if(!inb(x,y))continue;const kk=y*N+x;if(grid.ter[kk]===1&&!meta.wd[kk]){meta.wd[kk]=d+1;q.push(kk)}}
  }
  for(let k=0;k<n;k++)if(grid.ter[k]===1&&!meta.wd[k])meta.wd[k]=4;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const k=j*N+i;if(grid.ter[k]!==1)continue;
    let sum=0,c=0;
    for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const x=i+di,y=j+dj;if(!inb(x,y)){sum+=4;c++;continue}const kk=y*N+x;sum+=grid.ter[kk]===1?meta.wd[kk]:0;c++}
    meta.wf[k]=clamp((sum/c-1)/3,0,1);
  }
}
function drawTerrain(i,j,idx){
  const ter=grid.ter[idx];
  const t=TNOW/1000,sh=meta.shore?meta.shore[idx]:0;
  if(ter===1){
    const f=meta.wf?meta.wf[idx]:.7;
    const wv=Math.sin(t*1.1+(i+j)*.35)*.5+.5,wv2=Math.sin(t*.7-(i-j)*.3)*.5+.5;
    const lt=1+(wv*.03+wv2*.025)-.03;
    flat(-.012,-.012,1.012,1.012,0,`rgb(${(92-58*f)*lt|0},${(184-96*f)*lt|0},${(196-56*f)*lt|0})`);
    if(DETAIL&&night<.7){
      ctx.strokeStyle=`rgba(255,255,255,${.1+wv*.14})`;ctx.lineWidth=.9;ctx.beginPath();
      const o=(Math.sin(t*.8+hsh(i,j,2)*6)*.5+.5)*.3;
      ctx.moveTo(X(.15+o,.3),Y(.15+o,.3));ctx.lineTo(X(.4+o,.34),Y(.4+o,.34));
      if(hsh(i,j,3)<.5){ctx.moveTo(X(.5,.65+o*.4),Y(.5,.65+o*.4));ctx.lineTo(X(.8,.7+o*.4),Y(.8,.7+o*.4))}
      ctx.stroke();
      const g=Math.sin(t*2.1+hsh(i,j,5)*40);
      if(g>.93&&SUN.alpha>.1){ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(X(.5,.5)-1,Y(.5,.5)-1,2,2)}
    }
    if(sh){
      ctx.lineCap='round';
      const foam=(u0,v0,u1,v1)=>{
        ctx.strokeStyle=`rgba(255,255,255,${.34+wv*.3})`;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(X(u0,v0),Y(u0,v0));ctx.lineTo(X(u1,v1),Y(u1,v1));ctx.stroke();
        ctx.strokeStyle=`rgba(255,255,255,${.14+wv2*.2})`;ctx.lineWidth=1.2;ctx.setLineDash([3,4]);
        const dd=.12+wv*.06;
        ctx.beginPath();
        if(u0===u1){const uu=u0>.5?u0-dd:u0+dd;ctx.moveTo(X(uu,v0),Y(uu,v0));ctx.lineTo(X(uu,v1),Y(uu,v1))}
        else{const vv=v0>.5?v0-dd:v0+dd;ctx.moveTo(X(u0,vv),Y(u0,vv));ctx.lineTo(X(u1,vv),Y(u1,vv))}
        ctx.stroke();ctx.setLineDash([]);
      };
      if(sh&1)foam(1,0,1,1);if(sh&2)foam(0,0,0,1);if(sh&4)foam(0,1,1,1);if(sh&8)foam(0,0,1,0);
      ctx.lineCap='butt';
    }
  }else{
    const tone=meta.tone?meta.tone[idx]:.5,lite=meta.lite?meta.lite[idx]:0,mic=hsh(i,j,1),dry=G&&G.dry?G.dry:0;
    let r=84+tone*34+mic*8,g=150+tone*30+mic*10,b=78+tone*14;
    r+=dry*70;g-=dry*30;b-=dry*20;
    const f=1+lite;
    flat(-.012,-.012,1.012,1.012,0,`rgb(${r*f|0},${g*f|0},${b*f|0})`);
    if(sh){
      const sand=`rgb(${(224+mic*10)*f|0},${(208+mic*10)*f|0},${(152+mic*8)*f|0})`;
      if(sh&1)flat(.5,0,1,1,0,sand);if(sh&2)flat(0,0,.5,1,0,sand);if(sh&4)flat(0,.5,1,1,0,sand);if(sh&8)flat(0,0,1,.5,0,sand);
    }
    if(DETAIL&&!sh){
      ctx.strokeStyle='rgba(30,70,30,.22)';ctx.lineWidth=.8;ctx.beginPath();
      for(let k=0;k<3;k++){const u=.12+.76*hsh(i,j,60+k),v=.12+.76*hsh(i,j,70+k);const x=X(u,v),y=Y(u,v);ctx.moveTo(x,y);ctx.lineTo(x-1,y-3);ctx.moveTo(x+1,y);ctx.lineTo(x+1.5,y-2.5)}
      ctx.stroke();
      ctx.strokeStyle='rgba(200,240,150,.2)';ctx.beginPath();
      for(let k=0;k<2;k++){const u=.12+.76*hsh(i,j,80+k),v=.12+.76*hsh(i,j,90+k);const x=X(u,v),y=Y(u,v);ctx.moveTo(x,y);ctx.lineTo(x+1,y-3)}
      ctx.stroke();
    }
  }
}
function drawSides(i,j,idx){
  const water=grid.ter[idx]===1,th=22;
  const band=(x1,y1,x2,y2,k)=>{
    const lip=3;
    if(water){poly(shade([34,86,120],k),x1,y1,x2,y2,x2,y2+th,x1,y1+th);return}
    poly(shade([96,150,70],k),x1,y1,x2,y2,x2,y2+lip,x1,y1+lip);
    poly(shade([126,92,62],k),x1,y1+lip,x2,y2+lip,x2,y2+th*.6,x1,y1+th*.6);
    poly(shade([92,84,80],k),x1,y1+th*.6,x2,y2+th*.6,x2,y2+th,x1,y1+th);
  };
  if(i===N-1)band(X(1,0),Y(1,0),X(1,1),Y(1,1),SUN.FR*.95);
  if(j===N-1)band(X(0,1),Y(0,1),X(1,1),Y(1,1),SUN.FL);
}
const PADC={[T.R]:'rgba(118,186,108,.9)',[T.C]:'#b3b5b0',[T.I]:'#b9b09c'};
let hover=null,drag=null,painting=false,tool=TOOL.pan,overlay=null;
function ovTint(idx,typ){
  if(!overlay)return null;
  let v,hue,al=.5;
  if(overlay==='traf'){if(!isRoad(typ))return null;v=clamp(cov.traf[idx]/1.4,0,1);hue=120-120*v;al=.62}
  else if(overlay==='trn'){v=Math.min(1,cov.transit[idx]);if(v<.03)return null;return `hsla(205,85%,55%,${.18+v*.45})`}
  else if(overlay==='poll'){v=clamp(cov.poll[idx]*1.3,0,1);hue=120-120*v}
  else if(overlay==='lv'){v=cov.lv[idx];hue=120*v}
  else if(overlay==='crime'){v=clamp(cov.crime[idx]*1.2,0,1);hue=120-120*v}
  else return null;
  return `hsla(${hue|0},80%,50%,${al*.8})`;
}
const OVNAME={traf:'Tráfico (verde fluido, rojo trancón)',trn:'Cobertura de transporte público',poll:'Contaminación',lv:'Valor del suelo',crime:'Riesgo de crimen'};
const shCv=document.createElement('canvas'),shCtx=shCv.getContext('2d');
function objH(t,l){
  switch(t){
    case T.R:return [0,24,32,72,112,152][l]||0;case T.C:return [0,16,34,72,100,142][l]||0;case T.I:return [0,26,36,44][l]||0;
    case T.POLICE:return 24;case T.FIRE:return 26;case T.CLINIC:return 28;case T.SCHOOL:return 30;case T.COAL:return 60;case T.WATER:return 60;
    case T.STATUE:return 36;case T.HALL:return 40;case T.LIB:return 26;case T.UNI:return 46;case T.HOSP:return 42;case T.STAD:return 30;
    case T.WIND:return 46;case T.RECY:return 22;case T.JAIL:return 38;case T.METRO:return 28;case T.BUS:return 14;case T.TOLL:return 24;default:return 0;
  }
}
function drawShadows(vis){
  const al=SUN.alpha*(1-night);
  if(al<.02)return;
  const c=shCtx;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,shCv.width,shCv.height);
  c.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
  c.fillStyle='#0a1420';
  const fill=pts=>{const hl=hull(pts);if(hl.length<3)return;c.beginPath();c.moveTo(hl[0][0],hl[0][1]);for(let k=1;k<hl.length;k++)c.lineTo(hl[k][0],hl[k][1]);c.closePath();c.fill()};
  for(const idx of vis){
    const i=idx%N,j=(idx/N)|0,ox=(i-j)*HW,oy=(i+j)*HH;
    const t=grid.typ[idx];
    let h=objH(t,grid.lvl[idx]);
    if(h>0){
      const m=t===T.STAD?.02:.1;
      const sx=SUN.dx*h*1.9,sy=SUN.dy*h*1.3-h*.12;
      const pts=[];
      for(const [u,v] of [[m,m],[1-m,m],[1-m,1-m],[m,1-m]]){
        const x=ox+(u-v)*HW,y=oy+(u+v)*HH;
        pts.push([x,y]);pts.push([x+sx,y+sy]);
      }
      fill(pts);
    }
    if(grid.elev[idx]){
      const z=34,sx=SUN.dx*z*1.9,sy=SUN.dy*z*1.3;
      const n=[elevAt(i+1,j),elevAt(i-1,j),elevAt(i,j+1),elevAt(i,j-1)];
      const rects=[[.36,.36,.64,.64]];
      if(n[0])rects.push([.64,.36,1,.64]);if(n[1])rects.push([0,.36,.36,.64]);if(n[2])rects.push([.36,.64,.64,1]);if(n[3])rects.push([.36,0,.64,.36]);
      for(const [u0,v0,u1,v1] of rects){
        const pts=[];
        for(const [u,v] of [[u0,v0],[u1,v0],[u1,v1],[u0,v1]])pts.push([ox+(u-v)*HW+sx,oy+(u+v)*HH+sy]);
        fill(pts);
      }
    }
  }
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=al;ctx.drawImage(shCv,0,0);ctx.globalAlpha=1;
}
function groundTile(i,j,idx){
  OX=(i-j)*HW;OY=(i+j)*HH;curIdx=idx;
  const typ=grid.typ[idx],lvl=grid.lvl[idx];
  drawSides(i,j,idx);
  drawTerrain(i,j,idx);
  if(overlay&&grid.ter[idx]!==1&&!isRoad(typ)){const tn=ovTint(idx,typ);if(tn)flat(0,0,1,1,0,tn)}
  if(isRoad(typ)){drawRoad(i,j,OX,OY);if(grid.tram[idx]||grid.brt[idx])drawTramBrt(i,j,idx);const tn=ovTint(idx,typ);if(tn)flat(0,0,1,1,0,tn)}
  else if(typ===T.R||typ===T.C||typ===T.I){
    flat(.04,.04,.96,.96,0,ZCOL[typ]);
    if(grid.den[idx]&&lvl===0){ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.3,.3),Y(.3,.3));ctx.lineTo(X(.7,.7),Y(.7,.7));ctx.moveTo(X(.7,.3),Y(.7,.3));ctx.lineTo(X(.3,.7),Y(.3,.7));ctx.stroke()}
    if(lvl===0){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(.04,.04),Y(.04,.04));ctx.lineTo(X(.96,.04),Y(.96,.04));ctx.lineTo(X(.96,.96),Y(.96,.96));ctx.lineTo(X(.04,.96),Y(.04,.96));ctx.closePath();ctx.stroke()}
    else{
      const lawn=typ===T.R&&lvl<=2;
      flat(.04,.04,.96,.96,0,lawn?PADC[T.R]:PADC[typ]);
      if(lawn&&DETAIL){ctx.strokeStyle='rgba(60,110,60,.35)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(X(.04,.5),Y(.04,.5));ctx.lineTo(X(.2,.5),Y(.2,.5));ctx.stroke()}
      if(!lawn&&typ!==T.I&&DETAIL){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=.7;ctx.beginPath();for(const u of [.2,.4,.6,.8]){ctx.moveTo(X(u,.96),Y(u,.96));ctx.lineTo(X(u,.9),Y(u,.9))}ctx.stroke()}
    }
  }else if(typ!==T.NONE){
    flat(0,0,1,1,0,(typ===T.PARK||typ===T.WIND)?'#7bc47a':'#b9bab0');
  }
}
function drawToll(i,j,idx){
  const n=[isRoad(typeAt(i+1,j)),isRoad(typeAt(i-1,j)),isRoad(typeAt(i,j+1)),isRoad(typeAt(i,j-1))];
  const alongU=(n[0]||n[1])||!(n[2]||n[3]);
  const P=(a0,b0,a1,b1,h,c,z=0)=>alongU?prism(a0,b0,a1,b1,h,c,z):prism(b0,a0,b1,a1,h,c,z);
  const XY=(a,b)=>alongU?[X(a,b),Y(a,b)]:[X(b,a),Y(b,a)];
  P(.4,.04,.6,.17,11,[236,232,220]);P(.4,.83,.6,.96,11,[236,232,220]);
  P(.4,.04,.6,.17,2,[210,60,50],11);P(.4,.83,.6,.96,2,[210,60,50],11);
  P(.44,.03,.56,.97,2.6,[222,214,196],23);
  P(.45,.15,.55,.22,23,[200,200,196]);P(.45,.78,.55,.85,23,[200,200,196]);
  const [x,y]=XY(.5,.5);
  ctx.fillStyle='#1f5fa8';ctx.fillRect(x-14,y-38,28,10);ctx.strokeStyle='#e8eef5';ctx.lineWidth=.8;ctx.strokeRect(x-14,y-38,28,10);
  ctx.fillStyle='#fff';ctx.font='bold 6.5px sans-serif';ctx.textAlign='center';ctx.fillText('PEAJE $'+(G.tollPrice==null?3:G.tollPrice),x,y-31);
  ctx.strokeStyle='#666';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-9,y-28);ctx.lineTo(x-9,y-23);ctx.moveTo(x+9,y-28);ctx.lineTo(x+9,y-23);ctx.stroke();
  if(night>.15){lights.push(x-14,y-38,x+14,y-38,x+14,y-28,x-14,y-28)}
}
function drawRoundDeco(i,j,idx){
  const h=hsh(i,j,12);
  if(h<.5)tree(.5,.5,1.05,[70,150,80],0);
  else if(h<.8){cyl(.5,.5,6,3,[190,190,184]);const fx=X(.5,.5),fy=Y(.5,.5)-3;ctx.fillStyle='#6fb8e0';ctx.beginPath();ctx.ellipse(fx,fy,4.6,2.2,0,0,7);ctx.fill();ctx.strokeStyle='rgba(220,240,255,.85)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy-8-Math.sin(TNOW/260));ctx.stroke()}
  else{prism(.42,.42,.58,.58,5,[190,186,176]);prism(.46,.46,.54,.54,13,[230,190,80],5)}
}
function objectTile(i,j,idx,bucket,tbucket){
  OX=(i-j)*HW;OY=(i+j)*HH;curIdx=idx;
  const typ=grid.typ[idx],lvl=grid.lvl[idx];
  if(typ===T.NONE&&grid.ter[idx]===2)forestTile(i,j);
  if(typ===T.TOLL)drawToll(i,j,idx);
  if(typ===T.ROUND)drawRoundDeco(i,j,idx);
  if(typ===T.R||typ===T.C||typ===T.I||(typ!==T.NONE&&!isRoad(typ))){
    if(overlay==='traf')ctx.globalAlpha=.35;
    drawBuilding(typ,lvl,i,j,OX,OY);ctx.globalAlpha=1;
  }
  const b=bucket.get(idx);
  if(b)for(const c of b)drawCar(c);
  const tb=tbucket.get(idx);
  if(tb)for(const tr of tb)if(tr.kind!=='elev')drawVeh(tr);
  if(grid.elev[idx]){drawElev(i,j,idx);if(tb)for(const tr of tb)if(tr.kind==='elev')drawVeh(tr)}
}
function atmosphere(now){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const day=1-night;
  // luz calida al amanecer y al atardecer
  const low=SUN.low*day;
  if(low>.5){ctx.fillStyle=`rgba(255,150,70,${(low-.5)*.26})`;ctx.fillRect(0,0,W,H)}
  // sombras de nubes
  if(day>.25){
    for(let k=0;k<5;k++){
      const x=((now/1000*(5+k*2.2)+k*437)%(W+700))-350,y=(k*211+120)%H;
      const r=170+k*40;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(10,20,35,${.11*day})`);g.addColorStop(1,'rgba(10,20,35,0)');
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
  }
  // viñeta
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.78);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,10,18,.34)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}
function render(now){
  TNOW=now;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#2a6076');sky.addColorStop(1,'#123446');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  if(!G)return;
  const t=(now/1000/110)%1;
  night=clamp(Math.sin(t*6.2832)*1.7-.35,0,1);
  if(window.__night!=null)night=window.__night;
  updateSun(t);
  DETAIL=cam.z>.72;
  ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
  const x0=cam.x-W/2/cam.z-70,x1=cam.x+W/2/cam.z+70,y0=cam.y-H/2/cam.z-40,y1=cam.y+H/2/cam.z+190;
  lights=[];
  const bucket=new Map();
  for(const c of cars){
    const ci=Math.round(c.i+(c.ni-c.i)*c.t),cj=Math.round(c.j+(c.nj-c.j)*c.t);
    const k=cj*N+ci;let b=bucket.get(k);if(!b)bucket.set(k,b=[]);b.push(c);
  }
  const tbucket=new Map();
  for(const tr of vehs){const ci=Math.round(tr.i+(tr.ni-tr.i)*tr.t),cj=Math.round(tr.j+(tr.nj-tr.j)*tr.t);const k=cj*N+ci;let b=tbucket.get(k);if(!b)tbucket.set(k,b=[]);b.push(tr)}
  const vis=[];
  for(let s=0;s<=2*N-2;s++){
    for(let j=Math.max(0,s-N+1);j<=Math.min(N-1,s);j++){
      const i=s-j,sx=(i-j)*HW,sy=(i+j)*HH;
      if(sx<x0||sx>x1||sy<y0||sy>y1)continue;
      vis.push(j*N+i);
    }
  }
  for(const idx of vis)groundTile(idx%N,(idx/N)|0,idx);
  drawShadows(vis);
  ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
  for(const idx of vis)objectTile(idx%N,(idx/N)|0,idx,bucket,tbucket);
  drawCursor();
  atmosphere(now);
  if(night>0){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=`rgba(8,14,46,${night*.5})`;ctx.fillRect(0,0,W,H)}
  if(night>.1&&lights.length){
    ctx.setTransform(DPR*cam.z,0,0,DPR*cam.z,DPR*(W/2-cam.x*cam.z),DPR*(H/2-cam.y*cam.z));
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,214,120,${night*.9})`;ctx.beginPath();
    for(let k=0;k<lights.length;k+=8){ctx.moveTo(lights[k],lights[k+1]);ctx.lineTo(lights[k+2],lights[k+3]);ctx.lineTo(lights[k+4],lights[k+5]);ctx.lineTo(lights[k+6],lights[k+7]);ctx.closePath()}
    ctx.fill();ctx.globalCompositeOperation='source-over';
  }
}
function drawCar(c){
  const di=c.ni-c.i,dj=c.nj-c.j;
  const off=isAveIdx(c.nj*N+c.ni)?.2:.13;
  const ci=c.i+di*c.t-dj*off,cj=c.j+dj*c.t+di*off;
  OX=(ci-cj)*HW;OY=(ci+cj+1)*HH;
  const L=c.bus?.17:.09,Wd=c.bus?.06:.045,h=c.bus?7:3.5;
  ctx.fillStyle='rgba(10,20,30,.28)';ctx.beginPath();ctx.ellipse(X(0,0)+SUN.dx*3,Y(0,0)+1.5,c.bus?9:5.5,c.bus?3.2:2.2,0,0,7);ctx.fill();
  if(night>.15){const fx=X(di*L,dj*L),fy=Y(di*L,dj*L)-2;lights.push(fx-1.6,fy-1.2,fx+1.6,fy-1.2,fx+1.6,fy+1.2,fx-1.6,fy+1.2)}
  if(di!==0)prism(-L,-Wd,L,Wd,h,c.c,0);else prism(-Wd,-L,Wd,L,h,c.c,0);
  if(c.bus){ctx.fillStyle='rgba(20,30,40,.55)';if(di!==0)flat(-L*.8,-Wd,L*.8,Wd,h+.1,'rgba(150,200,230,.5)');else flat(-Wd,-L*.8,Wd,L*.8,h+.1,'rgba(150,200,230,.5)')}
}
function drawCursor(){
  if(!hover)return;
  const [i,j]=hover;if(!inb(i,j))return;
  OX=(i-j)*HW;OY=(i+j)*HH;
  const cost=tool.id==='pan'?0:applyTool(tool,i,j,true);
  let col='rgba(255,255,255,.28)';
  if(tool.id!=='pan')col=cost>0&&G.money>=cost?'rgba(120,230,150,.45)':'rgba(230,90,80,.45)';
  flat(0,0,1,1,0,col);
  if(tool.r&&cost>0){
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();
    for(let k=0;k<=48;k++){const a=k/48*6.2832,u=.5+Math.cos(a)*tool.r,v=.5+Math.sin(a)*tool.r;const x=X(u,v),y=Y(u,v);k?ctx.lineTo(x,y):ctx.moveTo(x,y)}
    ctx.stroke();ctx.setLineDash([]);
  }
}

/* ---------- vehículos de línea: metro elevado, tranvía y BRT ---------- */
let vehs=[];
const LINES={
  elev:{arr:'elev',z:37,L:.15,Wd:.085,h:9,cars:[0,.3],cols:[[240,242,246],[236,238,242]],maxv:10,sp:[1.3,1.8],win:'rgba(90,150,200,.7)'},
  tram:{arr:'tram',z:1.5,L:.1,Wd:.06,h:6,cars:[0,.25],cols:[[84,168,120],[236,226,196]],maxv:8,sp:[.8,1.1],win:'rgba(180,220,240,.7)'},
  brt:{arr:'brt',z:1.5,L:.15,Wd:.062,h:7,cars:[0,.32],cols:[[212,48,44],[198,42,40]],maxv:12,sp:[1.2,1.6],win:'rgba(250,235,235,.65)'},
};
function lineNeighbors(arr,i,j){const o=[];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(inb(i+a,j+b)&&arr[(j+b)*N+i+a])o.push([i+a,j+b]);return o}
function updateLines(dt){
  if(!S.net)return;
  vehs=vehs.filter(v=>{const a=grid[LINES[v.kind].arr];return a[v.j*N+v.i]&&a[v.nj*N+v.ni]});
  for(const [kind,net] of [['elev',S.net],['tram',S.netT],['brt',S.netB]]){
    const L=LINES[kind],arr=grid[L.arr],comps=net.comps.filter(c=>c.st.length>=2);
    const want=Math.min(L.maxv,comps.reduce((a,c)=>a+Math.min(3,1+Math.floor(c.tiles.length/10)),0));
    let have=vehs.filter(v=>v.kind===kind).length;
    while(have<want){
      const c=pick(comps),k=pick(c.st),i=k%N,j=(k/N)|0,nb=lineNeighbors(arr,i,j);if(!nb.length)break;
      const n=pick(nb);vehs.push({kind,i,j,ni:n[0],nj:n[1],t:0,sp:rnd(L.sp[0],L.sp[1]),dwell:rnd(0,1.5)});have++;
    }
    while(have>want){vehs.splice(vehs.findIndex(v=>v.kind===kind),1);have--}
  }
  for(const v of vehs){
    const arr=grid[LINES[v.kind].arr];
    if(v.dwell>0){v.dwell-=dt;continue}
    v.t+=dt*v.sp;
    if(v.t>=1){
      v.t=0;const oi=v.i,oj=v.j;v.i=v.ni;v.j=v.nj;
      if(arr[v.j*N+v.i]===2)v.dwell=1.1;
      let nb=lineNeighbors(arr,v.i,v.j).filter(n=>!(n[0]===oi&&n[1]===oj));
      if(!nb.length)nb=[[oi,oj]];
      const n=pick(nb);v.ni=n[0];v.nj=n[1];
    }
  }
}
function drawVeh(v){
  const L=LINES[v.kind],di=v.ni-v.i,dj=v.nj-v.j;
  L.cars.forEach((lag,idx)=>{
    const t=v.t-lag,ci=v.i+di*t,cj=v.j+dj*t;
    OX=(ci-cj)*HW;OY=(ci+cj+1)*HH;
    const col=v.kind==='brt'?brtColor():L.cols[idx%L.cols.length];
    if(di!==0)prism(-L.L,-L.Wd,L.L,L.Wd,L.h,col,L.z);else prism(-L.Wd,-L.L,L.Wd,L.L,L.h,col,L.z);
    if(di!==0)flat(-L.L*.9,-L.Wd,L.L*.9,L.Wd,L.z+L.h+.2,L.win);else flat(-L.Wd,-L.L*.9,L.Wd,L.L*.9,L.z+L.h+.2,L.win);
    if(v.kind==='tram'){ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X(0,0),Y(0,0)-L.z-L.h);ctx.lineTo(X(0,0),Y(0,0)-L.z-L.h-5);ctx.stroke()}
  });
}
/* ---------- autos y buses ---------- */
const BUSCOLS=[
 {id:'mix',n:'Multicolor',c:null},{id:'amarillo',n:'Amarillo',c:[240,190,40]},{id:'azul',n:'Azul',c:[60,130,210]},{id:'rojo',n:'Rojo',c:[212,48,44]},
 {id:'verde',n:'Verde',c:[60,160,100]},{id:'naranja',n:'Naranja',c:[236,130,40]},{id:'morado',n:'Morado',c:[150,90,180]},{id:'turquesa',n:'Turquesa',c:[50,180,180]},
 {id:'rosa',n:'Rosa',c:[235,120,170]},{id:'blanco',n:'Blanco',c:[236,236,240]},{id:'negro',n:'Negro',c:[60,62,70]},
];
function busColorOf(){const b=BUSCOLS.find(x=>x.id===(G.busColor||'mix'));return b&&b.c?b.c:(Math.random()<.5?[240,190,40]:[60,150,210])}
function brtColor(){const b=BUSCOLS.find(x=>x.id===G.busColor);return b&&b.c?b.c:[212,48,44]}
const CARCOL=[[210,70,60],[240,200,70],[70,130,200],[230,230,230],[60,160,110],[150,90,180]];
function roadNeighbors(i,j){const o=[];for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(isRoad(typeAt(i+a,j+b)))o.push([i+a,j+b]);return o}
function spawn(roads,bus){const k=pick(roads);const i=k%N,j=(k/N)|0;const nb=roadNeighbors(i,j);if(!nb.length)return null;const n=pick(nb);return {i,j,ni:n[0],nj:n[1],t:Math.random(),sp:bus?rnd(.7,.95):rnd(.9,1.6),c:bus?busColorOf():pick(CARCOL),bus}}
function updateCars(dt){
  const roads=[];for(let k=0;k<N*N;k++)if(isRoad(grid.typ[k]))roads.push(k);
  const stops=S.cnt?S.cnt[T.BUS]+S.cnt[T.METRO]*2:0;
  const wantCars=roads.length>3?Math.min(200,Math.floor(G.pop/22+roads.length/6)*(1-Math.min(.3,(S.aTrn||0)*.3))):0;
  const wantBus=roads.length>3?Math.min(24,stops*2):0;
  let nc=0,nb=0;for(const c of cars)c.bus?nb++:nc++;
  while(nc<wantCars){const c=spawn(roads,false);if(!c)break;cars.push(c);nc++}
  while(nb<wantBus){const c=spawn(roads,true);if(!c)break;cars.push(c);nb++}
  if(nc>wantCars+3||nb>wantBus){for(let k=cars.length-1;k>=0&&(nc>wantCars+3||nb>wantBus);k--){if(cars[k].bus&&nb>wantBus){cars.splice(k,1);nb--}else if(!cars[k].bus&&nc>wantCars+3){cars.splice(k,1);nc--}}}
  for(const c of cars){
    if(!isRoad(typeAt(c.i,c.j))||!isRoad(typeAt(c.ni,c.nj))){const k=pick(roads);if(k==null){cars.length=0;return}c.i=k%N;c.j=(k/N)|0;const nb2=roadNeighbors(c.i,c.j);if(nb2.length){c.ni=nb2[0][0];c.nj=nb2[0][1]}else{c.ni=c.i;c.nj=c.j}c.t=0;continue}
    const cg=cov.traf[c.nj*N+c.ni]||0,fast=(isAveIdx(c.nj*N+c.ni)?1.25:1)*(grid.typ[c.nj*N+c.ni]===T.TOLL?.45:1);
    c.t+=dt*c.sp*(S.units?1:.4)*1.3*fast/(1+cg*1.6);
    if(c.t>=1){
      c.t=0;const oi=c.i,oj=c.j;c.i=c.ni;c.j=c.nj;
      let nb2=roadNeighbors(c.i,c.j).filter(n=>!(n[0]===oi&&n[1]===oj));
      if(!nb2.length)nb2=[[oi,oj]];
      const n=pick(nb2);c.ni=n[0];c.nj=n[1];
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
  const map={'1':'pan','2':'road','3':'R','4':'C','5':'I','6':'park','7':'bull','8':'ave','9':'bus'};
  if(k==='t'||k==='T')toggleOverlay('traf');
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
  if(grid.ter[idx]===1)name='Agua';else if(t===T.ROAD)name='Calle';else if(t===T.AVE)name='Avenida';else if(t===T.ROUND)name='Glorieta';else if(t===T.TOLL)name='Peaje';else if(t===T.HALL)name='Alcaldía';
  else if(ZNAME[t])name=`${ZNAME[t]}${grid.den[idx]&&t!==T.I?' densa':''} · nivel ${l}${l===0?' (sin construir)':''}`;
  else if(BYTYPE[t])name=BYTYPE[t].n;else if(grid.ter[idx]===2)name='Bosque';
  let h=`<b>${name}</b>`;
  if(ZNAME[t]){
    h+=`<br>Valor del suelo: ${(cov.lv[idx]*100)|0}% · Aire: ${((1-cov.poll[idx])*100)|0}%`;
    if(!roadAccess(i,j))h+='<br>⚠️ Sin acceso a calle';
    else if(S.pCap===0)h+='<br>⚠️ Falta planta de energía';
    else if(S.wCap===0)h+='<br>⚠️ Falta torre de agua';
    else if(S.pRatio<.9||S.wRatio<.9)h+='<br>⚠️ Energía o agua insuficientes';
  }
  if(grid.elev[idx]){const comp=S.net.comps.find(c=>c.tiles.includes(idx));h+=grid.elev[idx]===2?`<br>🚉 Estación elevada · ${comp&&comp.st.length>=2?'<b>línea activa</b>':'⚠️ sola: necesita otra estación conectada'}`:'<br>🚝 Vía elevada'}
  if(grid.tram[idx]){const comp=S.netT.comps.find(c=>c.tiles.includes(idx));h+=grid.tram[idx]===2?`<br>🚋 Parada de tranvía · ${comp&&comp.st.length>=2?'<b>línea activa</b>':'⚠️ sola: necesita otra parada conectada'}`:'<br>🚊 Riel de tranvía'}
  if(grid.brt[idx]){const comp=S.netB.comps.find(c=>c.tiles.includes(idx));h+=grid.brt[idx]===2?`<br>🚍 Estación BRT · ${comp&&comp.st.length>=2?'<b>línea activa</b>':'⚠️ sola: necesita otra estación conectada'}`:'<br>🛑 Carril exclusivo BRT (menos espacio para carros)'}
  if(isRoad(t))h+=`<br>Tráfico: ${Math.round(clamp(cov.traf[idx]/1.4,0,1)*100)}%${cov.traf[idx]>1?' 🚨 trancón':''}`;
  if(ZNAME[t]&&grid.den[idx]&&t!==T.I&&l>=3&&cov.transit[idx]<.2)h+='<br>🚌 Necesita transporte público para crecer más';
  if(ZNAME[t]||BYTYPE[t]&&t!==T.PARK)h+=`<br>Transporte: ${Math.round(Math.min(1,cov.transit[idx])*100)}%`;
  tip.innerHTML=h;tip.style.display='block';tip.style.left=Math.min(W-240,px+14)+'px';tip.style.top=(py+16)+'px';
}

/* ---------- interfaz ---------- */
function selectTool(id){
  tool=TOOL[id];
  document.querySelectorAll('#tools button:not([data-ov])').forEach(b=>b.classList.toggle('on',b.dataset.id===id));
  cv.style.cursor=id==='pan'?'grab':'crosshair';
}
function buildTools(){
  const box=$('#tools');box.innerHTML='';let g='';
  TOOLS.forEach(t=>{
    if(t.g!==g){g=t.g;const d=document.createElement('div');d.className='grp';d.textContent=g;box.appendChild(d)}
    const b=document.createElement('button');b.dataset.id=t.id;b.title=t.d+(t.cost?` · ${fmt(t.cost)}`:'');
    b.innerHTML=`<span class="e">${t.e}</span><span class="n">${t.n}<span class="c">${t.ov?'ver capa':t.cost?fmt(t.cost)+(t.up?' · '+fmt(t.up)+'/mes':''):'gratis'}</span></span>`;
    if(t.ov){b.dataset.ov=t.ov;if(overlay===t.ov)b.classList.add('on');b.onclick=()=>toggleOverlay(t.ov)}else b.onclick=()=>selectTool(t.id);box.appendChild(b);
  });
  selectTool(tool.id);
}
function toggleOverlay(ov){
  overlay=overlay===ov?null:ov;
  document.querySelectorAll('#tools button[data-ov]').forEach(b=>b.classList.toggle('on',b.dataset.ov===overlay));
  toast(overlay?'Capa: '+OVNAME[overlay]:'Capa desactivada');
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
  <div class="row"><span>🚦 Congestión</span><b>${Math.round(clamp(s.cong/1.4,0,1)*100)}%</b></div>${bar(s.cong/1.4*100,100,true)}
  <div class="row"><span>🚌 Cobertura de transporte</span><b>${Math.round(s.aTrn*100)}%</b></div>${bar(s.aTrn*100)}
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
  <h4>Privatizaciones (el concejo vota · 6 de capital)</h4>`;
  for(const k in SECTORS){const sec=SECTORS[k],st=sectorStats(k),on=G.priv[k];
    h+=`<button class="btn ${on?'on':''}" data-a="priv" data-x="${k}">${sec.e} ${sec.n}${on?` <span class="tag">privado${G.cronies[k]?' · amigo':''}</span>`:''}<small>${on?`Operador: ${G.privOp[k]}. Reestatizar cuesta ${fmt(st.value)}.`:(st.n?`${sec.d} Vale ~${fmt(st.value)}.`:`${sec.d} (aún no tienes nada)`)}</small></button>`}
  h+=`<h4>Decretos (el concejo vota)</h4>`;
  DECREES.forEach(d=>{const on=G.decrees[d.id];h+=`<button class="btn ${on?'on':''}" data-a="decree" data-x="${d.id}">${on?'✅ ':''}${d.n}<small>${d.d}${on?'':` · <b>${d.cap}</b> de capital político`}</small></button>`});
  return h;
}
function panelFin(){
  const hh=G.hist||{inc:0,exp:0,incR:0,incC:0,incI:0,up:0,admin:0,dec:0,interest:0};
  const bal=hh.inc-hh.exp;
  let h=`<h4>Impuestos</h4>`;
  [['R','🏠 Residencial'],['C','🏬 Comercial'],['I','🏭 Industrial']].forEach(([k,n])=>{h+=`<div class="sl"><div class="t"><span>${n}</span><b>${G.tax[k]}%</b></div><input type="range" min="0" max="25" step="1" value="${G.tax[k]}" data-tax="${k}"></div>`});
  h+=`<div class="sl"><div class="t"><span>🚧 Tarifa de peajes</span><b>$${G.tollPrice==null?3:G.tollPrice}</b></div><input type="range" min="0" max="10" step="1" value="${G.tollPrice==null?3:G.tollPrice}" data-toll="1"><small style="color:var(--humo2)">${S.cnt[T.TOLL]?S.cnt[T.TOLL]+' casetas. Más tarifa: más plata y más rabia.':'Aún no tienes peajes.'}</small></div>
  <h4>Balance mensual (último mes)</h4>
  <div class="row"><span>Ingresos residenciales</span><b>${fmt(hh.incR||0)}</b></div>
  <div class="row"><span>Ingresos comerciales</span><b>${fmt(hh.incC||0)}</b></div>
  <div class="row"><span>Ingresos industriales</span><b>${fmt(hh.incI||0)}</b></div>
  <div class="row"><span>Pasajes de transporte</span><b>${fmt(hh.incT||0)}</b></div>
  <div class="row"><span>Peajes</span><b>${fmt(hh.incToll||0)}</b></div>
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
  <h4>Imagen de la flota</h4>
  <div class="sws">${BUSCOLS.map(b=>`<button class="sw ${(G.busColor||'mix')===b.id?'on':''}" data-a="buscolor" data-x="${b.id}" title="${b.n}" style="background:${b.c?`rgb(${b.c.join(',')})`:'conic-gradient(#f0be28,#3c82d2,#d4302c,#3ca064,#f0be28)'}"></button>`).join('')}</div>
  <small style="color:var(--humo2)">Color de los buses de calle y del troncal BRT. Gratis: es un gusto del alcalde.</small>
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
$('#panelBody').addEventListener('input',e=>{const r=e.target;if(r.dataset.toll){G.tollPrice=+r.value;r.parentNode.querySelector('b').textContent='$'+r.value;recalc();return}if(r.dataset.tax){G.tax[r.dataset.tax]=+r.value;r.parentNode.querySelector('b').textContent=r.value+'%';recalc();const m=document.getElementById('hAppr');if(m)m.textContent=S.approval.toFixed(0)+'%'}});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{curTab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));refreshUI()});
function setSpeed(s){if(!G)return;G.speed=s;refreshUI(true)}
document.querySelectorAll('.speed button').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.sp));
$('#btnPanel').onclick=()=>$('#panel').classList.toggle('open');
$('#btnMenu').onclick=()=>menu();

/* ---------- guardado y menú ---------- */
function save(){
  if(!G||G.over)return;
  try{
    const o={G,grid:{ter:[...grid.ter],typ:[...grid.typ],lvl:[...grid.lvl],sub:[...grid.sub],den:[...grid.den],elev:[...grid.elev],tram:[...grid.tram],brt:[...grid.brt]},cam};
    localStorage.setItem(SAVE_KEY,JSON.stringify(o));
  }catch(e){}
}
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;
    const o=JSON.parse(raw);
    allocGrid();for(const k of ['ter','typ','lvl','sub','den','elev','tram','brt'])if(o.grid[k])grid[k].set(o.grid[k]);
    G=o.G;G.speed=1;G.priv=G.priv||{};G.cronies=G.cronies||{};G.privOp=G.privOp||{};Object.assign(cam,o.cam||{});cam.z=cam.z||1;
    terrainMeta();recalc();refreshUI();buildTools();return true;
  }catch(e){return false}
}
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY)}catch(e){return false}}
function help(){
  queueModal({kick:'Manual del alcalde',title:'Cómo gobernar (y sobrevivir)',html:`<p><b>1.</b> Traza <b>calles</b> y pinta zonas <b>residencial, comercial e industrial</b> a su lado.<br>
  <b>2.</b> Construye una <b>planta de energía</b> y una <b>torre de agua</b>: sin ellas nada crece.<br>
  <b>3.</b> Mira la <b>demanda</b> (barras arriba) y balancea la ciudad. Pon servicios: policía, clínica, hospital, colegio, biblioteca, universidad, bomberos, parques, reciclaje.<br>
  <b>3b.</b> <b>Densidad y transporte:</b> las zonas densas llegan a torres de nivel 5, pero necesitan buen suelo y <b>transporte público</b> (paradas de bus, metro). Vigila la capa 🚦 <b>Tráfico</b> (tecla T): las <b>avenidas</b>, el transporte y el pico y placa evitan el trancón. El <b>metro elevado</b>, el <b>tranvía</b> (sobre calles) y el <b>troncal BRT</b> estilo TransMilenio (carril rojo sobre avenidas) solo rinden a pleno si conectan dos estaciones o paradas. El BRT mueve multitudes pero le quita espacio a los carros. Las <b>plazas</b> suben el ánimo y el comercio.<br>
  <b>3b2.</b> En <b>Finanzas</b> puedes escoger el <b>color de la flota de buses</b>.<br>
  <b>3c.</b> <b>Privatizaciones</b> (panel Política): venden la gestión de un servicio por plata inmediata y ahorro mensual, a costa de calidad y de la opinión de vecinos y funcionarios. Puedes licitar limpio... o adjudicar a un amigo.<br>
  <b>4.</b> Cuida a las <b>cuatro facciones</b>: vecinos, empresarios, ecologistas y funcionarios. Su opinión decide si te reeligen cada 4 años.<br>
  <b>5.</b> Gasta <b>capital político</b> en decretos que el concejo debe votar.<br>
  <b>6.</b> Tienes tentaciones: desviar caja, aceptar sobres, estatuas... Cada sospecha sube el riesgo de la <b>Fiscalía</b>. Tu fortuna personal es lo que te llevas al final.<br><br>
  <b>Controles:</b> arrastra para pintar o mover (herramienta ✋); rueda/pellizco para zoom; clic derecho para mover; espacio = pausa; teclas 1–9 para herramientas, T para la capa de tráfico.</p>`,opts:[{l:'Entendido'}]});
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
function loop(now){const dt=Math.min(.1,(now-lastR)/1000);lastR=now;if(G&&!modalOpen&&!G.over&&G.speed>0){updateCars(dt);updateLines(dt)}render(now);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
addEventListener('resize',resize);resize();
// render() se auto-programa; evitamos doble programación
window.__alcalde={get shCv(){return shCv},get SUN(){return SUN},get G(){return G},get S(){return S},grid,cov,step,applyTool,TOOL,recalc,act,cam,selectTool,startScreen,setSpeed,load,save,T,N,queueModal,election,endGame};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
startScreen();
})();

