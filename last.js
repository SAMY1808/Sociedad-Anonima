
/* ==========================================================================
   v217 · PARAÍSOS FISCALES Y ESTRUCTURAS EN EL EXTERIOR
   Hasta aquí había un solo fideicomiso afuera, en tres países. Ahora hay un
   panel, «Tus estructuras en el exterior», con varias estructuras a la vez:
   - CUENTAS NUMERADAS (banca privada) y SOCIEDADES OFFSHORE (de papel), en
     los paraísos de cada época: Liechtenstein (1926), Panamá (1927), Suiza
     (1934, el secreto bancario), Luxemburgo (1960), Bahamas (1965), Caimán
     (1966), Islas Vírgenes Británicas (1984), Delaware (1992) y Singapur
     (1995). Cada una tiene su costo anual y su riesgo de destaparse.
   - Lo que está sin declarar no paga el impuesto al patrimonio ni la
     sucesión. Lo declarado (normalizado) sí paga, pero no se destapa.
   - EL CERCO SE CIERRA: el riesgo sube con la época (el control de cambios
     de 1967, la lista de la OCDE en 2000, FATCA en 2010, el intercambio
     automático de información desde 2017), con los gobiernos reformistas y
     con las filtraciones (SwissLeaks 2015, Panama Papers 2016, Paradise
     Papers 2017 y Pandora Papers 2021), que te preguntan qué escondías.
   - LA NORMALIZACIÓN TRIBUTARIA (2015, 2019 y 2022): una ventana para
     declarar lo escondido pagando una tarifa menor; fuera de ella sale más
     caro, y si te destapan pagas multa, escándalo y delito de evasión.
   - Las estructuras pasan a los herederos. Lo declarado paga sucesión.
   El fideicomiso de siempre sigue donde estaba y aparece en el panel.
   ========================================================================== */
(function(){
  const V217='v217';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const nino=()=>{ try{ return typeof window.esNino94==='function'&&!!window.esNino94(); }catch(e){ return false; } };
  const ACTIVO=()=>!!(typeof S!=='undefined'&&S&&S.p&&!S.muerto);
  const O=()=>{ if(!S.offshore217) S.offshore217={estructuras:[],ahorro:0,seq:1,hechos:{}}; return S.offshore217; };
  const lista=()=>((typeof S!=='undefined'&&S&&S.offshore217&&S.offshore217.estructuras)||[]);
  const valor=()=>lista().reduce((a,s)=>a+(s.valor||0),0);
  const oculto=()=>lista().filter(s=>!s.declarada).reduce((a,s)=>a+(s.valor||0),0);

  const JUR=[
    {id:'liechtenstein',n:'Liechtenstein',d:1926,costo:.020,riesgo:.016,tipos:['cuenta','sociedad'],ds:'Fundaciones y "anstalts" para fortunas europeas: caro y discreto.'},
    {id:'panama',n:'Panamá',d:1927,costo:.012,riesgo:.045,tipos:['sociedad','cuenta'],ds:'Al lado, barato y con mala fama: nadie se sorprende de encontrarte ahí.'},
    {id:'suiza',n:'Suiza',d:1934,costo:.022,riesgo:.018,tipos:['cuenta'],ds:'El secreto bancario manda desde 1934: caro, serio y callado.'},
    {id:'luxemburgo',n:'Luxemburgo',d:1960,costo:.020,riesgo:.022,tipos:['cuenta','sociedad'],ds:'Fondos y holdings europeos, con buena reputación.'},
    {id:'bahamas',n:'Bahamas',d:1965,costo:.014,riesgo:.038,tipos:['cuenta','sociedad'],ds:'Sol, bancos privados y poca pregunta.'},
    {id:'caiman',n:'Islas Caimán',d:1966,costo:.015,riesgo:.034,tipos:['cuenta','sociedad'],ds:'Fondos y bancos sin impuestos directos.'},
    {id:'bvi',n:'Islas Vírgenes Británicas',d:1984,costo:.011,riesgo:.042,tipos:['sociedad'],ds:'Una sociedad de papel en un día y con poca papelería.'},
    {id:'delaware',n:'Delaware',d:1992,costo:.016,riesgo:.028,tipos:['sociedad'],ds:'Perfectamente legal, perfectamente opaco, y en inglés.'},
    {id:'singapur',n:'Singapur',d:1995,costo:.024,riesgo:.016,tipos:['cuenta','sociedad'],ds:'Banca privada de primera y reglas claras.'}];
  const TIPO={cuenta:{n:'Cuenta numerada',pl:'cuentas numeradas',costo:.6,riesgo:.8,d:'Banca privada: un número en vez de tu nombre.'},sociedad:{n:'Sociedad offshore',pl:'sociedades offshore',costo:1,riesgo:1,d:'Una empresa de papel que figura como dueña de la plata.'}};
  const jur=id=>JUR.find(x=>x.id===id)||JUR[0];
  const disp=tipo=>JUR.filter(j=>A()>=j.d&&j.tipos.includes(tipo));

  /* ---------- el cerco: riesgo según la época ---------- */
  function trans(a){ return a<1967?.7:a<1990?1:a<2001?1.2:a<2010?1.5:a<2014?2:a<2017?2.6:3.2; }
  function riesgoAnual(s){ if(s.declarada) return 0; const j=jur(s.jur); let r=j.riesgo*trans(A())*(TIPO[s.tipo]||TIPO.sociedad).riesgo;
    if(j.id==='suiza'&&A()>=2009) r*=1.5; if(A()>=1967&&A()<=1990) r*=1.3;
    try{ const g=gob().id; if(g==='reformista'||g==='populista') r*=1.8; }catch(e){} return Math.min(.4,r); }
  const NORM=[[2015,2016,.10],[2019,2020,.13],[2022,2023,.17]];
  function ventana(){ const a=A(); const v=NORM.find(x=>a>=x[0]&&a<=x[1]); return v?v[2]:null; }
  function tasaNorm(){ const v=ventana(); if(v!=null) return v; let t=.3; try{ t=Math.min(.5,tarifaRenta()+.12); }catch(e){} return t; }

  /* ---------- abrir, mover y normalizar ---------- */
  function crear(tipo,j,x){ const o=O(); const fee=Math.max(6,x*.015); if(S.efectivo<x+fee) return null; S.efectivo-=x+fee;
    const s={id:'o'+(o.seq++),tipo,jur:j.id,valor:x,desde:A(),declarada:false,normalizada:null};
    o.estructuras.push(s); log('Abriste una <b>'+E(TIPO[tipo].n.toLowerCase())+'</b> en <b>'+E(j.n)+'</b> con '+fm(x)+' (honorarios y trámites: '+fm(fee)+'). Nadie lo ve desde aquí.','hito'); return s; }
  function meter(s){ const x=Math.max(0,S.efectivo*.3); if(x<=0) return; S.efectivo-=x; s.valor+=x*.995; log('Pasaste '+fm(x)+' a la estructura de '+E(jur(s.jur).n)+'.'); }
  function repatriar(s,fr){ const x=s.valor*fr, c=s.declarada?.02:.06; s.valor-=x; S.efectivo+=x*(1-c);
    if(!s.declarada&&chance(.3)){ try{ S.p.escandalos++; moverPrestigio(-4,'la plata que volvió del exterior'); }catch(e){} log('Repatriaste '+fm(x*(1-c))+' y la operación levantó preguntas.','mal'); }
    else log('Repatriaste '+fm(x*(1-c))+(s.declarada?' (declarados).':' sin ruido.'));
    if(s.valor<1) quitar(s); }
  function quitar(s){ const o=O(); o.estructuras=o.estructuras.filter(z=>z!==s); }
  function normalizar(s,silencioso){ const t=tasaNorm(), c=s.valor*t; s.valor-=c; s.declarada=true; s.normalizada=A();
    if(!silencioso) log('Normalizaste la estructura de <b>'+E(jur(s.jur).n)+'</b>: pagaste '+fm(c)+' ('+Math.round(t*100)+'%) y quedó declarada. Ya no te la pueden destapar.','bien'); return c; }
  function tarifaAhorro(){ let w=0,r=0; try{ w=fisco().patrimonio||0; r=tarifaRenta(); }catch(e){} return {w,r}; }

  /* ---------- el año de las estructuras ---------- */
  function anual(res,m){ if(!ACTIVO()||nino()) return; const L=lista(); if(!L.length) return; const o=O(), ta=tarifaAhorro(); let ahorro=0;
    L.slice().forEach(s=>{ const j=jur(s.jur), tp=TIPO[s.tipo]||TIPO.sociedad;
      const r=clamp(((m&&m.ciclo)||0)*.5+rnd(-.04,.08)+(s.tipo==='sociedad'?.01:0),-.2,.25); const antes=s.valor; s.valor*=1+r; const costo=s.valor*j.costo*tp.costo; s.valor-=costo; const neto=s.valor-antes;
      if(res) res.push([tp.n+' en '+j.n,neto,neto>=0?'pos':'neg']);
      if(!s.declarada){ ahorro+=s.valor*ta.w+Math.max(0,r*s.valor)*ta.r; }
      else { const imp=Math.max(0,r*s.valor)*ta.r; if(imp>0){ s.valor-=imp; } }
      if(!s.declarada&&chance(riesgoAnual(s))) destapar(s,'solo'); });
    o.ahorro=(o.ahorro||0)+ahorro;
    if(lista().length) hitos(); }
  function destapar(s,como){ const j=jur(s.jur), mu=s.valor*rnd(.2,.45); s.valor-=mu; s.declarada=true; s.destapada=A();
    try{ S.p.escandalos++; moverPrestigio(s.tipo==='cuenta'?-6:-9,'la estructura en '+j.n+' salió a la luz'); }catch(e){}
    try{ if(typeof registrarDelito==='function') registrarDelito('evasión fiscal',3,'estructura en '+j.n); }catch(e){}
    log('Se destapó la '+E(TIPO[s.tipo].n.toLowerCase())+' de <b>'+E(j.n)+'</b>'+(como==='filtracion'?' en una filtración internacional':'')+'. Multa de '+fm(mu)+', el nombre en los periódicos y, desde hoy, queda declarada.','mal'); }
  function hitos(){ const o=O(), a=A(); const H={2000:'La OCDE publica su lista de paraísos fiscales: el mundo empieza a mirar.',2010:'Estados Unidos aprueba FATCA: los bancos del mundo tendrán que reportar cuentas.',2017:'Empieza el intercambio automático de información entre países: lo escondido se vuelve difícil.'};
    if(H[a]&&!o.hechos[a]&&oculto()>0){ o.hechos[a]=1; log('<b>'+E(H[a])+'</b> Tus estructuras sin declarar corren más riesgo.','mal'); }
    const F={2015:['SwissLeaks (las cuentas del HSBC en Suiza)',['suiza']],2016:['los Panama Papers',['panama','bvi','bahamas']],2017:['los Paradise Papers',['caiman','bahamas','bvi','luxemburgo']],2021:['los Pandora Papers',null]};
    const f=F[a]; if(f&&!o.hechos['f'+a]){ const afect=lista().filter(s=>!s.declarada&&(!f[1]||f[1].includes(s.jur))); if(afect.length){ o.hechos['f'+a]=1; try{ cola.push(evFiltracion(f[0],afect)); }catch(e){ console.error(e); } } }
    const w=NORM.find(x=>x[0]===a); if(w&&!o.hechos['n'+a]&&oculto()>0){ o.hechos['n'+a]=1; try{ cola.push(evNormalizacion(w[2])); }catch(e){ console.error(e); } } }
  function evFiltracion(nombre,afect){ const costo=afect.reduce((x,s)=>x+s.valor*tasaNorm(),0);
    return {p:9,c:()=>afect.some(s=>lista().includes(s)&&!s.declarada),t:()=>'<b>Una filtración internacional: '+E(nombre)+'.</b> Aparece el apellido '+E(S.p.apellido)+' entre los dueños de '+afect.length+' estructura(s) en el exterior. La DIAN ya pidió información y los periodistas llaman a tu casa.',
      o:[{t:'Normalizar ahora y pagar ('+fm(costo)+')',f:()=>{ let c=0; afect.forEach(s=>{ if(lista().includes(s)&&!s.declarada) c+=normalizar(s,true); }); try{ moverPrestigio(-2,'la plata del exterior salió a la luz'); }catch(e){} return 'Pagaste '+fm(c)+' y declaraste todo: te salvaste de la cárcel, no de las críticas.'; }},
         {t:'«Todo era legal»',f:()=>{ if(chance(.5)){ try{ moverPrestigio(-2,'una filtración'); }catch(e){} return 'Las estructuras eran legales... pero feas. La prensa se aburrió.'; } afect.forEach(s=>{ if(lista().includes(s)&&!s.declarada) destapar(s,'filtracion'); }); return 'La DIAN no te creyó: abrieron una investigación y te cobraron multas.'; }},
         {t:'Repatriar todo en silencio',f:()=>{ let x=0; afect.forEach(s=>{ if(lista().includes(s)){ x+=s.valor*.9; S.efectivo+=s.valor*.9; quitar(s); } }); try{ S.p.escandalos++; moverPrestigio(-6,'una repatriación forzada'); }catch(e){} return 'Trajiste todo de vuelta ('+fm(x)+'): pagaste el costo y la sospecha quedó.'; }}]}; }
  function evNormalizacion(t){ return {p:7,c:()=>oculto()>0,t:()=>'<b>La DIAN abre una normalización tributaria.</b> Quien declare ahora los bienes que tiene escondidos en el exterior paga solo el '+Math.round(t*100)+'% de su valor y queda en paz. Es una ventana corta.',
      o:[{t:'Normalizar todo ('+fm(lista().filter(s=>!s.declarada).reduce((x,s)=>x+s.valor*t,0))+')',f:()=>{ let c=0; lista().filter(s=>!s.declarada).forEach(s=>{ c+=normalizar(s,true); }); return 'Declaraste todo pagando '+fm(c)+': ya nadie puede destaparte.'; }},
         {t:'Dejarlo escondido',f:()=>'Dejaste la plata donde estaba: la ventana se cerrará y el cerco también.'}]}; }

  /* ---------- paneles ---------- */
  function filas(){ return lista().map(s=>{ const j=jur(s.jur); return '<tr><td>'+E(TIPO[s.tipo].n)+' · '+E(j.n)+'</td><td>'+fm(s.valor)+' · '+(s.declarada?'declarada':'<span style="color:#D06A60">sin declarar · riesgo '+Math.round(riesgoAnual(s)*100)+'% al año</span>')+'</td></tr>'; }).join(''); }
  function filasUI(){ return lista().filter(s=>!s.declarada).map(s=>'<tr><td>'+E(TIPO[s.tipo].n)+' en '+E(jur(s.jur).n)+'</td><td>'+fm(s.valor)+'</td></tr>').join(''); }
  function escenaPanel(){ const L=lista(), fid=S.fideicomiso, o=O(); const sinMov=S.mov<1?'Sin movidas':null;
    let t='<table class="libro">'+(L.length?filas():'<tr><td>Estructuras</td><td>Ninguna todavía</td></tr>')+(fid?'<tr><td>Fideicomiso en '+E((jur(fid.jur)||{}).n||'')+'</td><td>'+fm(fid.valor)+' (aparte)</td></tr>':'')
      +'<tr class="suma"><td>Total fuera del país</td><td>'+fm(valor()+((fid&&fid.valor)||0))+'</td></tr><tr><td>Impuestos que no pagaste (acumulado)</td><td>'+fm(o.ahorro||0)+'</td></tr><tr><td>Control de las autoridades</td><td>'+E(A()<1967?'casi nulo':A()<1990?'bajo (hay control de cambios)':A()<2001?'medio':A()<2010?'alto':A()<2017?'muy alto':'intercambio automático')+'</td></tr>'+(ventana()!=null?'<tr><td>Normalización tributaria</td><td><b>Abierta: '+Math.round(ventana()*100)+'% del valor</b></td></tr>':'')+'</table>';
    const ops=[];
    ['cuenta','sociedad'].forEach(tp=>{ const J=disp(tp); ops.push({t:'Abrir '+(tp==='cuenta'?'una cuenta numerada':'una sociedad offshore'),cat:'capital',cerrar:false,d:TIPO[tp].d+(J.length?' Disponibles: '+J.map(j=>j.n).join(', ')+'.':''),dis:!J.length?'Todavía no hay dónde':(S.efectivo<150?'Se necesitan al menos '+fm(150):sinMov),run:()=>escenaAbrir(tp)}); });
    L.forEach(s=>{ const j=jur(s.jur), n=TIPO[s.tipo].n+' de '+j.n;
      ops.push({t:'Meter más plata en la '+(s.tipo==='cuenta'?'cuenta':'sociedad')+' de '+j.n,cat:'capital',cerrar:false,d:'Pasarías '+fm(S.efectivo*.3)+'.',dis:S.efectivo<60?'No tienes qué mover':sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); meter(s); escenaPanel(); }});
      ops.push({t:'Repatriar la mitad de '+n,cat:'capital',cerrar:false,d:'Vuelve a tu caja con un costo del '+(s.declarada?2:6)+'%.'+(s.declarada?'':' Sin declarar, levanta preguntas.'),dis:sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); repatriar(s,.5); escenaPanel(); }});
      if(!s.declarada) ops.push({t:'Normalizar '+n+' ('+fm(s.valor*tasaNorm())+')',cat:'legado',cerrar:false,d:(ventana()!=null?'Estás en la ventana de normalización: ':'Fuera de ventana sale más caro: ')+Math.round(tasaNorm()*100)+'% del valor. Después ya no corres riesgo, pero pagas patrimonio y sucesión.',dis:sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); normalizar(s); escenaPanel(); }}); });
    if(fid) ops.push({t:'Administrar el fideicomiso',cat:'capital',cerrar:false,d:'El fideicomiso de siempre, aparte de estas estructuras.',run:()=>escenaFideicomiso()});
    escena({rubro:'Estructuras en el exterior',titulo:'Tus estructuras en el exterior',ancho:true,cerrable:true,cuerpo:'Lo que está en el exterior sin declarar no paga impuesto al patrimonio ni sucesión, pero cuesta mantenerlo y, si se destapa, el apellido lo paga.'+(A()>=1967&&A()<=1990?' Ojo: sacar divisas sin permiso está prohibido por el control de cambios.':''),html:t,opciones:ops}); }
  function escenaAbrir(tp){ const J=disp(tp);
    const ops=J.map(j=>({t:j.n,cat:'capital',cerrar:false,d:j.ds+' Cuesta '+(j.costo*TIPO[tp].costo*100).toFixed(1)+'% al año; riesgo base '+(j.riesgo*TIPO[tp].riesgo*100).toFixed(1)+'% (sube con la época).',run:()=>escenaMonto(tp,j)}));
    ops.push({t:'Volver',cat:'legado',cerrar:false,run:()=>escenaPanel()});
    escena({rubro:'Estructuras en el exterior',titulo:tp==='cuenta'?'Abrir una cuenta numerada':'Constituir una sociedad offshore',ancho:true,cerrable:true,cuerpo:'Escoge el país. En esta época hay '+J.length+' disponible'+(J.length===1?'':'s')+'.',opciones:ops}); }
  function escenaMonto(tp,j){ const base=S.efectivo;
    const ops=[[.25,'un cuarto'],[.5,'la mitad'],[.75,'tres cuartos']].map(([f,n])=>{ const x=base*f; return {t:'Mover '+n+' de tu caja ('+fm(x)+')',cat:'capital',cerrar:false,d:'Honorarios y trámites: '+fm(Math.max(6,x*.015))+'.',dis:S.mov<1?'Sin movidas':null,run:()=>{ S.mov=Math.max(0,S.mov-1); crear(tp,j,x); escenaPanel(); }}; });
    ops.push({t:'Volver',cat:'legado',cerrar:false,run:()=>escenaAbrir(tp)});
    escena({rubro:'Estructuras en el exterior',titulo:TIPO[tp].n+' en '+j.n,ancho:true,cerrable:true,cuerpo:j.ds+' Tienes '+fm(base)+' en tu caja.',opciones:ops}); }

  /* ---------- enganches ---------- */
  function wrapFid(){ const old=window.correrFideicomiso; if(typeof old!=='function'||old.__v217) return; const f=function(res,m){ const r=old.apply(this,arguments); try{ anual(res,m); }catch(e){ console.error(e); } return r; }; f.__v217=true; window.correrFideicomiso=f; }
  const TIT='Tus estructuras en el exterior';
  function grupo(){ const Gp=window.GRUPOS_91; if(!Array.isArray(Gp)) return; const g=Gp.find(x=>x.id==='instituciones'); if(g&&Array.isArray(g.miembros)&&!g.miembros.some(m=>m[1]===TIT)) g.miembros.push(['Crear',TIT]); }
  function wrapAcciones(){ const old=window.listaAcciones; if(typeof old!=='function'||window.__SA217_ACC) return; window.__SA217_ACC=true;
    window.listaAcciones=function(){ try{ grupo(); }catch(e){} const L=old.apply(this,arguments);
      try{ if(Array.isArray(L)&&ACTIVO()&&!nino()&&A()>=1926&&(S.p.edad||0)>=18&&!L.some(x=>x&&x.t===TIT)&&(S.efectivo>=150||lista().length||S.fideicomiso)){ const n=lista().length;
        L.push({t:TIT,cat:'capital',d:n?'Tienes '+n+' estructura(s) con '+fm(valor())+'. Mover plata, normalizar o abrir otra.':'Cuentas numeradas y sociedades offshore en los paraísos de tu época: no pagan patrimonio ni sucesión mientras no se destapen.',mov:1,modal:true,run:()=>escenaPanel()}); } }catch(x){ console.error(x); }
      try{ if(typeof window.replegarAcciones192==='function') window.replegarAcciones192(L); }catch(e){}
      return L; }; window.listaAcciones.__v217=true; }
  function legado(tarifa){ const L=lista(); if(!L.length) return null; const c=JSON.parse(JSON.stringify(S.offshore217)); c.estructuras.forEach(s=>{ if(s.declarada) s.valor*=(1-(tarifa||0)); }); return c; }
  function init217(){ wrapFid(); wrapAcciones(); try{ grupo(); }catch(e){}
    Object.assign(window,{valorOffshore217:valor,valorOffshoreOculto217:oculto,filasOffshore217:filasUI,legadoOffshore217:legado,estructurasOffshore217:lista,escenaOffshore217:escenaPanel,abrirOffshore217:crear,normalizarOffshore217:normalizar,repatriarOffshore217:repatriar,meterOffshore217:meter,destaparOffshore217:destapar,anualOffshore217:anual,riesgoOffshore217:riesgoAnual,transOffshore217:trans,tasaNormOffshore217:tasaNorm,ventanaOffshore217:ventana,JURISDICCIONES_217:JUR,TIPOS_OFFSHORE_217:TIPO,disponiblesOffshore217:disp,eventosOffshore217:{filtracion:evFiltracion,normalizacion:evNormalizacion},hitosOffshore217:hitos}); }
  init217(); setTimeout(init217,40); setTimeout(init217,220); setTimeout(init217,650); setTimeout(init217,950); setTimeout(init217,1500);
  window.__SA217={version:V217};
})();
