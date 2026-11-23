
/* ==========================================================================
   v218 · PREMIOS Y RECONOCIMIENTOS DE LA DINASTÍA
   Un registro de lo que la casa recibe, y los sucesos que lo traen, cada uno
   desde su época:
   - PREMIOS NOBEL (desde 1901): Literatura (para el escritor de la casa que
     llega a la cima de las letras), Paz (altos cargos políticos y
     diplomáticos), y Medicina, Física, Química o Economía (desde 1969) para
     la cima de la academia. Son rarísimos y valen mucho: el diploma, el
     dinero y un lugar en la historia.
   - REINADOS: la hija (o tú, si eres mujer) entre los 17 y los 26 años
     puede ser reina de su ciudad (el Carnaval de Barranquilla, la Feria de
     las Flores, la Feria de Cali...), del Reinado Nacional de la Belleza
     (desde 1934) y de Miss Universo (desde 1952), con campaña de lujo o sin
     ella.
   - CONDECORACIONES: la Orden de Boyacá (1819), la Cruz de Boyacá (1919),
     la Orden de San Carlos (1948) y las extranjeras (la Legión de Honor, la
     Orden de Isabel la Católica...), para quien tiene nombre y servicios.
   - PREMIOS DEL OFICIO: el deportista del año, los premios nacionales de
     artes, letras y música, el Grammy Latino (2000), los de periodismo
     (Cabot 1939, Simón Bolívar 1975) y el empresario del año, según tu
     carrera (v216) y tus compañías.
   - DOCTORADOS HONORIS CAUSA de las universidades de la época.
   Todo se guarda en el «Salón de honor de la casa», pasa a los herederos y
   suma prestigio. Cada premio tiene decisiones (viajar o donar el dinero,
   campaña de lujo o sencilla, aceptar o rechazar por principios).
   ========================================================================== */
(function(){
  const V218='v218';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const nino=()=>{ try{ return typeof window.esNino94==='function'&&!!window.esNino94(); }catch(e){ return false; } };
  const ACTIVO=()=>!!(typeof S!=='undefined'&&S&&S.p&&!S.muerto);
  const P=()=>{ if(!S.premios218) S.premios218={lista:[],hechos:{}}; return S.premios218; };
  const lista=()=>((typeof S!=='undefined'&&S&&S.premios218&&S.premios218.lista)||[]);
  const pago=b=>Math.round((b||0)*(1+(A()-1900)*.004));
  const pres=()=>{ try{ return prestigio(); }catch(e){ return 40; } };
  const ciudad=()=>(S.hogar&&S.hogar.ciudad)||'Bogotá';
  const C216=()=>{ try{ return typeof window.carrera216==='function'?window.carrera216():null; }catch(e){ return null; } };
  const yo=()=>S.p.nombre||'Tú';

  /* ---------- el registro ---------- */
  function otorgar(r){ const o=P(); const x=Object.assign({anio:A()},r); o.lista.push(x);
    try{ if(x.pres) moverPrestigio(x.pres,x.motivo||('recibió '+x.n)); }catch(e){}
    if(x.propio){ try{ S.p.reputacion=clamp(S.p.reputacion+(x.rep||0),0,100); S.p.redes=clamp((S.p.redes||0)+(x.redes||0),0,100); }catch(e){} }
    if(x.dinero) S.efectivo+=x.dinero;
    if(x.hito){ try{ hito(x.n+(x.quienN&&!x.propio?' ('+x.quienN+')':'')); }catch(e){} }
    log('<b>'+E(x.n)+'</b>'+(x.quienN&&!x.propio?' para '+E(x.quienN):'')+'. '+(x.nota||''),'hito'); return x; }

  /* ---------- Nobel ---------- */
  const NOBEL=[['Literatura','de Literatura',1901],['Paz','de la Paz',1901],['Medicina','de Medicina',1901],['Física','de Física',1901],['Química','de Química',1901],['Economía','de Economía',1969]];
  function polAlto(){ try{ const q=S.carrera&&S.carrera.politica; if(!q) return false; const cg=(typeof cargoPolitico==='function'&&cargoPolitico(q.cargo))||null; const n=(cg&&cg.n)||String(q.cargo||''); return !!((q.activo||q.mandatos>0)&&/Senador|Presidente|Gobernador/i.test(n)); }catch(e){ return false; } }
  function dipAlto(){ try{ const d=S.carrera&&S.carrera.diplomacia; return !!(d&&d.activo&&d.nivel>=5); }catch(e){ return false; } }
  function acadAlto(){ try{ return !!(S.carrera&&(S.carrera.ruta==='academico'||S.carrera.ruta==='docente')&&S.carrera.nivel>=4&&S.p.educacion>=4); }catch(e){ return false; } }
  function nobelPosibles(){ const L=[], a=A(), q=C216(), e=S.p.edad||0; if(e<40) return L;
    if(q&&q.id==='artista'&&q.disc==='literatura'&&q.nivel>=4&&q.ind.fama>=70&&q.ind.critica>=60&&e>=50) L.push([NOBEL[0],q.nivel>=5?.05:.025]);
    if((polAlto()||dipAlto())&&pres()>=70&&a>=1901) L.push([NOBEL[1],.015]);
    if(acadAlto()&&pres()>=55){ const C=NOBEL.slice(2).filter(n=>a>=n[2]); if(C.length) L.push([C[ri(0,C.length-1)],.02]); }
    return L.filter(x=>!P().hechos['nobel:'+x[0][0]]&&a>=x[0][2]); }
  function evNobel(n){ const premio='Premio Nobel '+n[1], dinero=pago(70), q=C216();
    return {p:10,c:()=>ACTIVO(),t:()=>'<b>Suena el teléfono desde Estocolmo.</b> La Academia Sueca te concede el <b>'+E(premio)+'</b>. Es el reconocimiento más alto del mundo y toda la casa lo celebra.',
      o:[{t:'Viajar a Estocolmo a recibirlo ('+fm(dinero)+' en metálico)',f:()=>{ P().hechos['nobel:'+n[0]]=1; otorgar({id:'nobel:'+n[0],n:premio,cat:'nobel',quienN:yo(),propio:true,pres:14,rep:10,redes:12,dinero,hito:true,nota:'Recibiste el diploma, la medalla y '+fm(dinero)+'.'}); if(q&&q.logros) q.logros.push({a:A(),t:premio}); return 'Recibiste el '+premio+' en Estocolmo: tu nombre entra en la historia.'; }},
         {t:'Donar el dinero a una obra social',f:()=>{ P().hechos['nobel:'+n[0]]=1; otorgar({id:'nobel:'+n[0],n:premio,cat:'nobel',quienN:yo(),propio:true,pres:17,rep:12,redes:12,hito:true,nota:'Donaste el dinero a una obra social y el país se emocionó.'}); return 'Donaste el premio en metálico: el gesto pesó casi tanto como la medalla.'; }}]}; }

  /* ---------- reinados ---------- */
  function reinables(){ const L=[]; if(S.p.sexo==='m'&&S.p.edad>=17&&S.p.edad<=26) L.push({p:S.p,nombre:yo(),k:'yo',propia:true,carisma:(S.p.atr&&S.p.atr.carisma)||5});
    ((S.familia&&S.familia.hijos)||[]).forEach(h=>{ if(h&&h.sexo==='m'&&h.edad>=17&&h.edad<=25) L.push({p:h,nombre:h.nombre,k:h.fid||h.nombre,propia:false,carisma:(h.atr&&h.atr.carisma)||5}); });
    return L.filter(c=>!P().hechos['rei:'+c.k]); }
  function reinadoLocal(){ const c=ciudad(), a=A(); if(c==='Barranquilla'&&a>=1918) return 'Reina del Carnaval de Barranquilla'; if(c==='Medellín'&&a>=1957) return 'Reina de la Feria de las Flores'; if(c==='Cali'&&a>=1957) return 'Reina de la Feria de Cali'; return a>=1920?'Reina de las fiestas de '+c:null; }
  function tirada(c,lujo){ const bel=ri(35,85)+(c.carisma-5)*4; return bel+(lujo?15:0)+pres()/8+ri(-18,18); }
  function evReinado(c){ const loc=reinadoLocal(), nac=A()>=1934, costo=pago(25); const quien=c.propia?'tú':c.nombre;
    return {p:6,c:()=>ACTIVO()&&!P().hechos['rei:'+c.k],t:()=>'<b>Invitan a '+(c.propia?'participar':E(c.nombre)+' a participar')+' en el reinado'+(loc?' ('+E(loc.toLowerCase())+')':'')+'.</b> La belleza, el porte y el apellido pesan en el jurado. '+(c.propia?'Tu':'Su')+' familia está dividida entre el orgullo y la prudencia.',
      o:[{t:'Inscribir'+(c.propia?'te':'la')+' sin gastos extra',f:()=>correr(c,false)},{t:'Financiar una campaña de lujo ('+fm(costo)+')',f:()=>{ if(S.efectivo<costo) return 'No te alcanza para la campaña.'; S.efectivo-=costo; return correr(c,true); }},{t:'No dejar'+(c.propia?'te':'la')+' participar',f:()=>{ P().hechos['rei:'+c.k]=1; return 'Decidiste que no: la tradición de la casa es otra.'; }}]}; }
  function correr(c,lujo){ P().hechos['rei:'+c.k]=1; const loc=reinadoLocal(); let nivel=0, txt=[];
    const r1=tirada(c,lujo); if(loc){ if(r1>=105){ nivel=1; txt.push('fue <b>'+E(loc)+'</b>'); } else if(r1>=92) txt.push('fue virreina del reinado local'); else txt.push('no pasó del reinado local'); } else nivel=r1>=92?1:0;
    let reina=nivel>=1&&A()>=1934;
    if(nivel>=1&&A()>=1934){ const r2=tirada(c,lujo)-6; if(r2>=105){ nivel=2; txt.push('ganó el <b>Reinado Nacional de la Belleza</b>'); } else if(r2>=92) { nivel=1.5; txt.push('quedó virreina nacional'); } else { txt.push('no ganó el nacional'); } }
    if(nivel>=2&&A()>=1952){ if(chance(.12)){ nivel=3; txt.push('ganó <b>Miss Universo</b>'); } else txt.push('compitió en Miss Universo y quedó entre las finalistas'); }
    const n=nivel>=3?'Miss Universo':nivel>=2?'Reina Nacional de la Belleza':nivel>=1?(loc||'Reina de la ciudad'):null;
    if(n){ otorgar({id:'rei:'+c.k+':'+A(),n:n,cat:'reinado',quienN:c.nombre,rel:c.propia?'tú':'hija',propio:c.propia,pres:nivel>=3?9:nivel>=2?5:2,rep:nivel>=2?4:2,redes:nivel>=2?6:3,hito:nivel>=2,nota:(c.propia?'Tú':E(c.nombre))+' '+txt.join(', ')+'.'}); return (c.propia?'Tú':c.nombre)+' '+txt.join(', ')+'.'; }
    try{ S.p.felicidad=clamp(S.p.felicidad+(c.propia?-2:0),0,100); }catch(e){} return (c.propia?'Tú':c.nombre)+' '+txt.join(', ')+': quedó la experiencia y las fotos.'; }

  /* ---------- condecoraciones y honoris causa ---------- */
  const ORDENES=[['la Orden de Boyacá',1819,'La más alta distinción del Estado, creada por el Libertador tras la batalla.',6],['la Cruz de Boyacá',1919,'La condecoración suprema de la República por servicios excepcionales.',6],['la Orden de San Carlos',1948,'La Cancillería reconoce los servicios a la nación y a sus relaciones exteriores.',4],
    ['la Legión de Honor de Francia',1802,'El gobierno francés te condecora por tu amistad con Francia.',4],['la Orden de Isabel la Católica',1815,'España reconoce tu aporte a los lazos entre los dos países.',3],['la Orden del Imperio Británico',1917,'Londres te condecora por tus servicios.',3],['la Orden al Mérito de Alemania',1951,'Alemania reconoce tu trabajo con sus empresas.',3]];
  const UNIVS=[['la Universidad Nacional',1867],['la Universidad de Antioquia',1803],['la Universidad del Rosario',1653],['la Universidad Javeriana',1930],['la Universidad de los Andes',1948],['la Universidad del Valle',1945],['EAFIT',1960]];
  function evOrden(o){ return {p:7,c:()=>ACTIVO(),t:()=>'<b>Te ofrecen '+E(o[0])+'.</b> '+E(o[2])+' La ceremonia será con discursos y fotos.',
      o:[{t:'Aceptarla',f:()=>{ P().hechos['orden:'+o[0]]=1; otorgar({id:'orden:'+o[0],n:'Condecoración: '+o[0].replace(/^la /,'La ').replace(/^el /,'El '),cat:'orden',quienN:yo(),propio:true,pres:o[3],rep:3,redes:4,hito:o[3]>=6,nota:'Te la impusieron en una ceremonia solemne.'}); return 'Recibiste '+o[0]+': la casa ganó lustre.'; }},
         {t:'Rechazarla por principios',f:()=>{ P().hechos['orden:'+o[0]]=1; try{ S.p.reputacion=clamp(S.p.reputacion+3,0,100); }catch(e){} return 'La rechazaste: algunos te admiraron, otros no entendieron.'; }}]}; }
  function evHonoris(u){ return {p:6,c:()=>ACTIVO(),t:()=>'<b>'+E(u[0].replace(/^la /,'La '))+' quiere darte el doctorado Honoris Causa.</b> Reconocen tu obra y tu aporte a la educación. Hace falta un discurso.',
      o:[{t:'Aceptarlo y dar el discurso',f:()=>{ P().hechos['hon:'+u[0]]=1; otorgar({id:'hon:'+u[0],n:'Doctor Honoris Causa de '+u[0],cat:'honoris',quienN:yo(),propio:true,pres:3,rep:3,redes:3,nota:'Te lo entregaron en un acto con toga y birrete.'}); return 'Ya eres doctor honoris causa.'; }},{t:'Declinar con modestia',f:()=>{ P().hechos['hon:'+u[0]]=1; return 'Declinaste el título.'; }}]}; }

  /* ---------- premios del oficio y empresarial ---------- */
  const OFICIO={
    deportista:[['Deportista del Año',1950,3,4],['Premio Nacional del Deporte',1960,5,5]],
    pintura:[['Premio del Salón Nacional de Artistas',1940,3,4],['Premio Nacional de Artes Plásticas',1970,5,5]],
    musica:[['Premio Nacional de Música',1960,3,4],['Grammy Latino',2000,5,5]],
    literatura:[['Premio Nacional de Literatura',1950,3,4],['Premio Rómulo Gallegos',1967,5,5]],
    teatro:[['Premio Nacional de Teatro',1950,3,4]],fotografia:[['Premio Nacional de Fotografía',1960,3,4]],cine:[['Premio India Catalina',1985,3,4],['Premio Nacional de Cine',1960,4,4]],
    periodista:[['Premio Maria Moors Cabot',1939,4,5],['Premio Simón Bolívar de Periodismo',1975,3,4],['Premio Pulitzer',1917,5,8]]};
  function oficioPosibles(){ const q=C216(), L=[]; if(!q||(S.p.edad||0)<18) return L; const tabla=q.id==='deportista'?OFICIO.deportista:q.id==='artista'?OFICIO[q.disc]:OFICIO.periodista; (tabla||[]).forEach(p=>{ if(A()>=p[1]&&q.nivel>=p[2]&&!P().hechos['of:'+p[0]]){ let ok=true; if(p[0]==='Premio Pulitzer') ok=q.ind.credibilidad>=85; L.push([p,ok?clamp(.05+(q.nivel-p[2])*.08,.05,.3):0]); } }); return L; }
  function evOficio(p){ const q=C216();
    return {p:7,c:()=>ACTIVO()&&!!C216(),t:()=>'<b>Te otorgan el '+E(p[0].replace(/^Premio /,'premio ').replace(/^Deportista/,'galardón de Deportista'))+'.</b> '+(q?'Es el reconocimiento de tu oficio a tu carrera.':'')+' Hay una ceremonia y una entrevista.',
      o:[{t:'Recibirlo y dar el discurso',f:()=>{ P().hechos['of:'+p[0]]=1; otorgar({id:'of:'+p[0],n:p[0],cat:'oficio',quienN:yo(),propio:true,pres:p[3],rep:3,redes:5,hito:p[3]>=5,nota:'Quedó en tu hoja de vida y en la de la casa.'}); try{ if(q){ q.ind.fama=clamp((q.ind.fama||0)+8,0,100); if(q.logros) q.logros.push({a:A(),t:p[0]}); } }catch(e){} return 'Recibiste el '+p[0]+'.'; }},
         {t:'Agradecerlo sin ceremonia',f:()=>{ P().hechos['of:'+p[0]]=1; otorgar({id:'of:'+p[0],n:p[0],cat:'oficio',quienN:yo(),propio:true,pres:Math.max(1,p[3]-2),rep:2,redes:2,nota:'Lo recibiste con discreción.'}); return 'Recibiste el premio sin ruido.'; }}]}; }
  function evEmpresario(e){ const n=A()>=1990?'Empresario del Año':'Reconocimiento al mérito empresarial de la ANDI';
    return {p:6,c:()=>ACTIVO()&&companias().includes(e),t:()=>'<b>Te eligen "'+E(n)+'" por <b>'+E(e.nombre)+'</b>.</b> Los gremios reconocen su crecimiento, sus empleos y su reputación.',
      o:[{t:'Recibirlo en la cena de gala',f:()=>{ P().hechos['emp:'+e.nombre+':'+A()]=1; otorgar({id:'emp:'+e.nombre+':'+A(),n:n+' ('+e.nombre+')',cat:'empresa',quienN:yo(),propio:true,pres:4,rep:3,redes:5,nota:'La compañía ganó marca.'}); try{ e.marca=clamp((e.marca||50)+4,0,100); }catch(x){} return 'Recibiste el premio: '+e.nombre+' ganó marca.'; }},{t:'Dárselo al equipo de la compañía',f:()=>{ P().hechos['emp:'+e.nombre+':'+A()]=1; otorgar({id:'emp:'+e.nombre+':'+A(),n:n+' ('+e.nombre+')',cat:'empresa',quienN:yo(),propio:true,pres:5,rep:4,redes:4,nota:'Lo compartiste con tus empleados.'}); try{ e.moral=clamp((e.moral||50)+6,0,100); }catch(x){} return 'Se lo diste al equipo: la moral subió.'; }}]}; }

  /* ---------- el año ---------- */
  function candidatos(){ const L=[], a=A(); if(!ACTIVO()||nino()) return L;
    nobelPosibles().forEach(x=>{ if(chance(x[1])) L.push({w:10,ev:evNobel(x[0])}); });
    if(a>=1900&&chance(.4)){ const R=reinables(); if(R.length) L.push({w:6,ev:evReinado(R[ri(0,R.length-1)])}); }
    if((S.p.edad||0)>=30){ const O=ORDENES.filter(o=>a>=o[1]&&!P().hechos['orden:'+o[0]]); const pp=clamp((pres()-50)/450,0,.07); if(O.length&&pp>0&&chance(pp)) L.push({w:7,ev:evOrden(O[ri(0,O.length-1)])});
      const U=UNIVS.filter(u=>a>=u[1]&&!P().hechos['hon:'+u[0]]); if(U.length&&pres()>=55&&chance(.03+(pres()-55)/900)) L.push({w:6,ev:evHonoris(U[ri(0,U.length-1)])}); }
    oficioPosibles().forEach(x=>{ if(x[1]>0&&chance(x[1])) L.push({w:7,ev:evOficio(x[0])}); });
    if(a>=1944&&(S.p.edad||0)>=25){ const g=(typeof companias==='function'?companias():[]).filter(e=>(e.marca||0)>=55&&(e.moral||0)>=45&&!e.quiebra&&!P().hechos['emp:'+e.nombre+':'+a]); if(g.length&&chance(.05)) L.push({w:6,ev:evEmpresario(g.sort((x,y)=>(y.marca||0)-(x.marca||0))[0])}); }
    return L; }
  function anual(){ if(!ACTIVO()) return; let L=[]; try{ L=candidatos(); }catch(e){ console.error(e); } L.sort((x,y)=>y.w-x.w).slice(0,2).forEach(c=>{ try{ cola.push(c.ev); }catch(e){} }); }

  /* ---------- el salón de honor ---------- */
  const CATS=[['nobel','Premios Nobel'],['reinado','Reinados'],['orden','Condecoraciones'],['honoris','Doctorados honoris causa'],['oficio','Premios del oficio'],['empresa','Premios empresariales']];
  function escenaSalon(){ const L=lista(); let t='<table class="libro">';
    if(!L.length) t+='<tr><td>Premios</td><td>Todavía ninguno</td></tr>';
    CATS.forEach(c=>{ const x=L.filter(r=>r.cat===c[0]); if(!x.length) return; t+='<tr><td><b>'+E(c[1])+'</b></td><td>'+x.length+'</td></tr>'+x.map(r=>'<tr><td>'+E(r.n)+'</td><td>'+(r.propio?'tú':E(r.quienN||''))+(r.rel&&!r.propio?' ('+E(r.rel)+')':'')+' · '+r.anio+'</td></tr>').join(''); });
    const suma=L.reduce((a,r)=>a+(r.pres||0),0); t+='<tr class="suma"><td>Peso en prestigio de la casa</td><td>+'+Math.round(suma)+'</td></tr></table>';
    const pist=[]; if(!L.some(r=>r.cat==='nobel')) pist.push('Un Nobel solo le llega a quien toca la cima de las letras, de la academia o de la política y la diplomacia.');
    pist.push('Los reinados llaman a las hijas (y a ti, si eres mujer) entre los 17 y los 26 años; las condecoraciones, a quien tiene nombre y servicios; los premios del oficio, a quien llega alto en el deporte, las artes o el periodismo.');
    escena({rubro:'Legado',titulo:'Salón de honor de la casa',ancho:true,cerrable:true,cuerpo:'Los premios y reconocimientos de la dinastía: de quien los recibió y del año. Pasan a los herederos.'+'<br><span style="color:var(--laton-op)">'+E(pist.join(' '))+'</span>',html:t,opciones:[{t:'Cerrar el salón',cat:'legado',run:()=>{}}]}); }

  /* ---------- enganches ---------- */
  function wrapPaso(){ const old=window.pasarAnio; if(typeof old!=='function'||window.__SA218_PASO) return; window.__SA218_PASO=true; window.pasarAnio=function(){ const r=old.apply(this,arguments); try{ if(S&&S.p&&!S.muerto) anual(); }catch(e){ console.error(e); } return r; }; }
  const TIT='Salón de honor de la casa';
  function wrapAcciones(){ const old=window.listaAcciones; if(typeof old!=='function'||window.__SA218_ACC) return; window.__SA218_ACC=true;
    window.listaAcciones=function(){ const L=old.apply(this,arguments);
      try{ if(Array.isArray(L)&&ACTIVO()&&!nino()&&(S.p.edad||0)>=18&&A()>=1800&&!L.some(x=>x&&x.t===TIT)){ const n=lista().length; L.push({t:TIT,cat:'legado',d:n?'Tienes '+n+' reconocimiento'+(n===1?'':'s')+' de la casa: Nobel, reinados, condecoraciones y premios.':'Nobel, reinados, condecoraciones y premios: lo que la casa recibe y cómo se consigue.',mov:0,modal:true,run:()=>escenaSalon()}); } }catch(x){ console.error(x); }
      try{ if(typeof window.replegarAcciones192==='function') window.replegarAcciones192(L); }catch(e){}
      return L; }; window.listaAcciones.__v218=true; }
  function wrapCat(){ const old=window.catDe; if(typeof old!=='function'||window.__SA218_CAT) return; window.__SA218_CAT=true; window.catDe=function(t){ if(t===TIT) return 'legado'; return old.apply(this,arguments); }; }
  function legado(){ const L=lista(); return L.length?JSON.parse(JSON.stringify(S.premios218)):null; }
  function init218(){ wrapPaso(); wrapAcciones(); wrapCat();
    Object.assign(window,{premios218:lista,otorgarPremio218:otorgar,anualPremios218:anual,candidatosPremios218:candidatos,escenaSalon218:escenaSalon,legadoPremios218:legado,nobelPosibles218:nobelPosibles,oficioPosibles218:oficioPosibles,reinables218:reinables,reinadoLocal218:reinadoLocal,correrReinado218:correr,ORDENES_218:ORDENES,UNIVS_218:UNIVS,OFICIO_218:OFICIO,NOBEL_218:NOBEL,
      eventosPremios218:{nobel:evNobel,reinado:evReinado,orden:evOrden,honoris:evHonoris,oficio:evOficio,empresario:evEmpresario}}); }
  init218(); setTimeout(init218,40); setTimeout(init218,220); setTimeout(init218,650); setTimeout(init218,950); setTimeout(init218,1500);
  window.__SA218={version:V218};
})();
