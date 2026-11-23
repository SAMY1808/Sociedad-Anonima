
/* ==========================================================================
   v221 · CRIPTOACTIVOS
   Hasta aquí las criptomonedas solo salían como rescate de un hackeo. Ahora
   hay un panel, «Tus criptoactivos», con lo que se compra, se guarda, se
   mina y se vende, según la época:
   - MONEDAS: Bitcoin (desde 2012, cuando llega la primera plata de verdad),
     tokens y altcoins (2017, la burbuja de las ICO), Ether (2016) y
     stablecoins (2018). Cada una sigue su trayectoria histórica año por año
     (aproximada, y con las subidas de las burbujas de 2013 y 2017 limitadas
     a 5 veces para que el juego no se rompa); desde 2025 se mueven al azar.
   - CUSTODIA: en un exchange (cómodo, pero si el exchange se hunde, se
     hunde tu plata: Mt. Gox 2014, FTX 2022) o en una billetera propia (sin
     intermediarios, pero si pierdes la llave, pierdes todo).
   - MINERÍA: una granja de minería (2013-2024) paga según el precio del
     Bitcoin, gasta electricidad, se deprecia rápido y el pago se parte en
     dos con cada halving (2016, 2020, 2024).
   - IMPUESTOS: las ganancias pagan ganancia ocasional (10%, 15% desde 2019,
     20% desde 2023); desde 2018 la DIAN pide reportarlas.
   - SUCESOS: el exchange hackeado, la quiebra del exchange, el colapso de
     Terra/Luna, la estafa de «duplica tu bitcoin», el reporte a la DIAN y la
     llave perdida.
   Las criptos cuentan en el patrimonio y pasan a los herederos (con la
   sucesión descontada).
   ========================================================================== */
(function(){
  const V221='v221';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const nino=()=>{ try{ return typeof window.esNino94==='function'&&!!window.esNino94(); }catch(e){ return false; } };
  const ACTIVO=()=>!!(typeof S!=='undefined'&&S&&S.p&&!S.muerto);
  const pago=b=>Math.round((b||0)*(1+(A()-1900)*.004));
  const K=()=>{ if(!S.cripto221) S.cripto221={tenencias:[],granja:null,custodia:'exchange',hechos:{},declarada:false,ganado:0,pagado:0}; return S.cripto221; };
  const tens=()=>((typeof S!=='undefined'&&S&&S.cripto221&&S.cripto221.tenencias)||[]);
  const granja=()=>((typeof S!=='undefined'&&S&&S.cripto221&&S.cripto221.granja)||null);
  const valor=()=>tens().reduce((a,t)=>a+(t.valor||0),0)+((granja()&&granja().valor)||0);

  /* ---------- las monedas y su trayectoria (retorno de fin de año a fin de año) ---------- */
  const MON={
    btc:{n:'Bitcoin',desde:2012,vol:.55,mu:.12,fee:.015,d:'La primera y la más conocida: oro digital para unos, humo para otros.',
      r:{2012:1.85,2013:4,2014:-.6,2015:.34,2016:1.24,2017:4,2018:-.73,2019:.92,2020:3.03,2021:.6,2022:-.64,2023:1.56,2024:1.21}},
    eth:{n:'Ether',desde:2016,vol:.7,mu:.12,fee:.015,d:'La red donde se programan contratos: más volátil que el Bitcoin.',
      r:{2016:4,2017:4,2018:-.82,2019:-.03,2020:4,2021:4,2022:-.67,2023:.91,2024:.46}},
    alt:{n:'Tokens y altcoins',desde:2017,vol:.95,mu:0,fee:.02,d:'Cientos de monedas nuevas: algunas se multiplican y casi todas se hunden.',
      r:{2017:4,2018:-.85,2019:-.1,2020:1.2,2021:3,2022:-.85,2023:.6,2024:.8}},
    usdt:{n:'Stablecoins (dólar digital)',desde:2018,vol:.01,mu:0,fee:.01,d:'Una moneda que vale un dólar: no sube ni baja, pero tampoco te hace rico.',r:{}}};
  const IDS=Object.keys(MON);
  const disp=a=>IDS.filter(k=>(a||A())>=MON[k].desde);
  const HALVING=[2012,2016,2020,2024];
  function retorno(id,a){ a=a||A(); const m=MON[id]; if(!m) return 0; if(id==='usdt') return 0;
    if(m.r[a]!==undefined) return m.r[a];
    if(a<m.desde) return 0;
    return clamp(m.mu+m.vol*(rnd(-1,1)+rnd(-1,1)+rnd(-1,1))/1.7,-.8,2.5); }
  const tasaGO=a=>(a||A())>=2023?.2:(a||A())>=2019?.15:.1;

  /* ---------- operar ---------- */
  function buscar(id){ return tens().find(t=>t.coin===id); }
  function comprar(id,x){ const m=MON[id]; if(!m||A()<m.desde||x<=0) return null; const fee=Math.max(2,x*m.fee); if(S.efectivo<x+fee) return null; S.efectivo-=x+fee;
    let t=buscar(id); if(!t){ t={coin:id,valor:0,costo:0,desde:A()}; K().tenencias.push(t); } t.valor+=x; t.costo+=x;
    log('Compraste <b>'+E(m.n)+'</b> por '+fm(x)+' (comisión '+fm(fee)+').'); return t; }
  function vender(id,fr){ const t=buscar(id); if(!t||t.valor<=0) return null; const m=MON[id]; const x=t.valor*fr, costoP=t.costo*fr, fee=x*.01, ganancia=Math.max(0,x-costoP), imp=ganancia*tasaGO();
    t.valor-=x; t.costo-=costoP; S.efectivo+=x-fee-imp; const k=K(); k.ganado+=ganancia; k.pagado+=imp; if(t.valor<1) k.tenencias=k.tenencias.filter(z=>z!==t);
    log('Vendiste '+E(m.n)+' por '+fm(x)+(ganancia>0?': ganancia de '+fm(ganancia)+' y impuesto de ganancia ocasional de '+fm(imp)+' ('+Math.round(tasaGO()*100)+'%).':'.')); return {x,imp,ganancia}; }
  function costoGranja(){ return pago(300); }
  function montarGranja(){ const x=costoGranja(); if(A()<2013||A()>2024||granja()||S.efectivo<x) return null; S.efectivo-=x; K().granja={valor:x,costo:x,desde:A()}; log('Montaste una <b>granja de minería</b> de Bitcoin por '+fm(x)+': máquinas, galpón y un contrato de energía.','hito'); return K().granja; }
  function venderGranja(){ const g=granja(); if(!g) return 0; const x=g.valor*.6; S.efectivo+=x; K().granja=null; log('Vendiste la granja de minería por '+fm(x)+' (las máquinas usadas valen poco).'); return x; }
  const halvings=g=>HALVING.filter(h=>h>=g.desde&&h<=A()).length;

  /* ---------- el año ---------- */
  function anual(res){ if(!ACTIVO()||nino()) return; const k=K(); if(!tens().length&&!granja()) return; const a=A(); let tot=0;
    tens().slice().forEach(t=>{ const r=retorno(t.coin,a); const antes=t.valor; t.valor=Math.max(0,t.valor*(1+r)); tot+=t.valor-antes; if(t.valor<1) k.tenencias=k.tenencias.filter(z=>z!==t); });
    if(res&&tot!==0) res.push(['Criptoactivos',tot,tot>=0?'pos':'neg']);
    const g=granja(); if(g){ const rb=retorno('btc',a), rev=g.valor*clamp(.45+rb*.35,.05,1.2)/Math.pow(2,halvings(g)), gasto=g.valor*.28; g.valor*=.72; S.efectivo+=rev-gasto; if(res) res.push(['Granja de minería',rev-gasto,(rev-gasto)>=0?'pos':'neg']); if(g.valor<costoGranja()*.05) K().granja=null; }
    if(k.custodia==='propia'&&chance(.02)&&tens().length){ const x=valor(); k.tenencias=[]; log('<b>Perdiste la llave de tu billetera.</b> '+fm(x)+' en criptoactivos quedaron para siempre en la red, sin dueño.','mal'); }
    if(HALVING.includes(a)&&granja()) log('Llegó el <b>halving</b> del Bitcoin: tu granja recibe la mitad por cada bloque.','mal');
    let L=[]; try{ L=sucesos(); }catch(e){ console.error(e); } L.slice(0,1).forEach(ev=>{ try{ cola.push(ev); }catch(e){} }); }

  /* ---------- los sucesos ---------- */
  function evHackeo(){ const k=K(), perdida=.2+Math.random()*.2;
    return {p:9,c:()=>ACTIVO()&&tens().length>0,t:()=>'<b>Hackean el exchange donde guardas tus criptoactivos.</b> Desaparecen cientos de miles de monedas y el sitio se queda sin responder. Nadie sabe si volverá a abrir.',
      o:[{t:'Esperar a que el exchange responda',f:()=>{ if(k.custodia!=='exchange') return 'Tu billetera es propia: el hackeo no te tocó.'; let x=0; tens().forEach(t=>{ const p=t.valor*perdida; t.valor-=p; t.costo*=1-perdida; x+=p; }); return 'Perdiste el '+Math.round(perdida*100)+'% de tus criptoactivos ('+fm(x)+'): el exchange repartió lo que quedaba.'; }},
         {t:'Sacar lo que se pueda a una billetera propia',f:()=>{ if(k.custodia==='exchange'){ if(chance(.5)){ k.custodia='propia'; return 'Alcanzaste a sacar tus monedas a una billetera propia: te salvaste y ya no dependes de nadie.'; } let x=0; tens().forEach(t=>{ const p=t.valor*perdida; t.valor-=p; t.costo*=1-perdida; x+=p; }); return 'No alcanzaste: perdiste '+fm(x)+'.'; } return 'Ya estabas en una billetera propia: no te tocó.'; }}]}; }
  function evQuiebra(){ const k=K(), perdida=.25+Math.random()*.35;
    return {p:9,c:()=>ACTIVO()&&tens().length>0,t:()=>'<b>Quiebra el exchange donde tienes tus criptoactivos.</b> Se descubre que usaban la plata de los clientes para apostar. Frenan los retiros y piden la liquidación.',
      o:[{t:'Reclamar en el proceso de quiebra',f:()=>{ if(k.custodia!=='exchange') return 'Tu plata está en una billetera propia: no te tocó.'; let x=0; tens().forEach(t=>{ const p=t.valor*perdida; t.valor-=p; t.costo*=1-perdida; x+=p; }); return 'El proceso reparte centavos: perdiste '+fm(x)+' ('+Math.round(perdida*100)+'%).'; }},
         {t:'Pasarte a billetera propia con lo que quede',f:()=>{ if(k.custodia==='exchange'){ k.custodia='propia'; let x=0; tens().forEach(t=>{ const p=t.valor*perdida*.7; t.valor-=p; t.costo*=1-perdida*.7; x+=p; }); return 'Alcanzaste a sacar parte: perdiste '+fm(x)+' y ahora guardas tú.'; } return 'Ya guardabas tú: no te tocó.'; }}]}; }
  function evTerra(){ const alt=buscar('alt'), usdt=buscar('usdt');
    return {p:8,c:()=>ACTIVO()&&!!(buscar('alt')||buscar('usdt')),t:()=>'<b>Se derrumba Terra/Luna.</b> Una "stablecoin algorítmica" pierde su ancla al dólar y arrastra a medio mercado de tokens. Los precios caen en picada.',
      o:[{t:'Vender los tokens ya, con pérdidas',f:()=>{ const t=buscar('alt'); if(t){ const r=vender('alt',1); return 'Vendiste tus tokens: recuperaste '+fm(r.x)+'.'; } return 'No tenías tokens: te salvaste.'; }},
         {t:'Aguantar a ver qué pasa',f:()=>'Aguantaste: el mercado sigue su curso y verás qué queda.'}]}; }
  function evEstafa(){ const x=Math.round(Math.max(10,S.efectivo*.2));
    return {p:7,c:()=>ACTIVO(),t:()=>'<b>Te ofrecen "duplicar tu bitcoin".</b> Un conocido de un conocido promete rendimientos del 10% mensual con un "algoritmo de arbitraje". Su oficina es hermosa y el video, muy convincente.',
      o:[{t:'Invertir '+fm(x),f:()=>{ if(S.efectivo<x) return 'No te alcanza.'; S.efectivo-=x; if(chance(.1)){ S.efectivo+=x*1.4; return 'Qué suerte: te pagaron '+fm(x*1.4)+' antes de que se cayera el esquema.'; } try{ moverPrestigio(-1,'cayó en una pirámide'); }catch(e){} return 'Era una pirámide: perdiste los '+fm(x)+'.'; }},
         {t:'Rechazar y denunciar',f:()=>{ try{ moverPrestigio(1,'denunció una pirámide'); }catch(e){} return 'Rechazaste y denunciaste: los fiscales te agradecieron.'; }}]}; }
  function evDian(){ const k=K();
    return {p:8,c:()=>ACTIVO()&&tens().length>0&&!k.declarada,t:()=>'<b>La DIAN exige reportar los criptoactivos.</b> Los exchanges le entregan a la autoridad la lista de quienes operan con ellos y pide que declares lo que tienes.',
      o:[{t:'Declararlos y pagar lo que toque',f:()=>{ k.declarada=true; return 'Declaraste tus criptoactivos: quedaste en regla.'; }},
         {t:'Ignorar el requerimiento',f:()=>{ if(chance(.4)){ const mu=valor()*.2; tens().forEach(t=>{ t.valor*=.8; t.costo*=.8; }); try{ S.p.escandalos=(S.p.escandalos||0)+1; moverPrestigio(-3,'una sanción de la DIAN por criptoactivos'); }catch(e){} k.declarada=true; return 'La DIAN cruzó la información: te cobró una multa de '+fm(mu)+' y quedaste declarado.'; } return 'Ignoraste el requerimiento y por ahora nadie te molestó.'; }}]}; }
  function sucesos(){ const a=A(), k=K(), L=[]; if(!tens().length&&a<2016) return L;
    if(a===2014&&!k.hechos[2014]&&tens().some(t=>t.coin==='btc')){ k.hechos[2014]=1; L.push(evHackeo()); }
    if(a===2022&&!k.hechos[2022]){ k.hechos[2022]=1; if(tens().length) L.push(evQuiebra()); if(buscar('alt')||buscar('usdt')) L.push(evTerra()); }
    if(a>=2018&&tens().length&&!k.declarada&&!k.hechos['d'+a]&&chance(.15)){ k.hechos['d'+a]=1; L.push(evDian()); }
    if(a>=2016&&chance(.06)) L.push(evEstafa());
    if(a>=2016&&a!==2014&&a!==2022&&k.custodia==='exchange'&&tens().length&&chance(.03)) L.push(evHackeo());
    return L.sort((x,y)=>y.p-x.p); }

  /* ---------- paneles ---------- */
  function escenaPanel(){ const k=K(), T=tens(), g=granja(), sinMov=S.mov<1?'Sin movidas':null;
    let t='<table class="libro">'+(T.length?T.map(x=>{ const m=MON[x.coin], gan=x.costo>0?Math.round((x.valor/x.costo-1)*100):0; return '<tr><td>'+E(m.n)+'</td><td>'+fm(x.valor)+' · '+(gan>=0?'+':'')+gan+'% sobre lo que pagaste</td></tr>'; }).join(''):'<tr><td>Criptoactivos</td><td>Ninguno todavía</td></tr>')+(g?'<tr><td>Granja de minería</td><td>'+fm(g.valor)+' · se deprecia 28% al año</td></tr>':'')
      +'<tr class="suma"><td>Total en criptoactivos</td><td>'+fm(valor())+'</td></tr><tr><td>Custodia</td><td>'+(k.custodia==='exchange'?'en el exchange (cómoda, con riesgo de quiebra o hackeo)':'billetera propia (sin intermediarios; si pierdes la llave, lo pierdes todo)')+'</td></tr><tr><td>Impuesto a las ganancias</td><td>'+Math.round(tasaGO()*100)+'%'+(A()>=2018?' · '+(k.declarada?'declarados ante la DIAN':'sin reportar'):'')+'</td></tr><tr><td>Ganado y tributado (acumulado)</td><td>'+fm(k.ganado)+' · '+fm(k.pagado)+'</td></tr></table>';
    const ops=[];
    disp().forEach(id=>{ const m=MON[id]; ops.push({t:'Comprar '+m.n,cat:'mercado',cerrar:false,d:m.d+' Comisión '+(m.fee*100).toFixed(1)+'%.',dis:S.efectivo<20?'No tienes con qué':sinMov,run:()=>escenaComprar(id)}); });
    T.forEach(x=>{ const m=MON[x.coin]; ops.push({t:'Vender '+m.n+' ('+fm(x.valor)+')',cat:'mercado',cerrar:false,d:'Comisión del 1% y, si hay ganancia, el impuesto de ganancia ocasional.',dis:sinMov,run:()=>escenaVender(x.coin)}); });
    if(T.length&&k.custodia==='exchange') ops.push({t:'Pasar a una billetera propia ('+fm(pago(5))+')',cat:'capital',cerrar:false,d:'Sin intermediarios: ya no te toca un hackeo ni una quiebra, pero perder la llave cuesta todo (2% al año).',dis:S.efectivo<pago(5)?'No te alcanza':sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); S.efectivo-=pago(5); k.custodia='propia'; log('Pasaste tus criptoactivos a una billetera propia.'); escenaPanel(); }});
    if(T.length&&k.custodia==='propia') ops.push({t:'Volver a guardarlas en un exchange',cat:'capital',cerrar:false,d:'Más cómodo, pero dependes de la empresa.',dis:sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); k.custodia='exchange'; escenaPanel(); }});
    if(A()>=2018&&T.length&&!k.declarada) ops.push({t:'Declarar tus criptoactivos ante la DIAN',cat:'legado',cerrar:false,d:'Quedas en regla: ya no te pueden multar por no reportarlos.',dis:sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); k.declarada=true; log('Declaraste tus criptoactivos ante la DIAN.'); escenaPanel(); }});
    if(A()>=2013&&A()<=2024&&!g) ops.push({t:'Montar una granja de minería ('+fm(costoGranja())+')',cat:'capital',cerrar:false,d:'Máquinas y energía: paga según el precio del Bitcoin, se deprecia rápido y el pago se parte en dos en cada halving.',dis:S.efectivo<costoGranja()?'No te alcanza':sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); montarGranja(); escenaPanel(); }});
    if(g) ops.push({t:'Vender la granja ('+fm(g.valor*.6)+')',cat:'capital',cerrar:false,d:'Las máquinas usadas valen el 60% de lo que se les calcula.',dis:sinMov,run:()=>{ S.mov=Math.max(0,S.mov-1); venderGranja(); escenaPanel(); }});
    escena({rubro:'Inversiones',titulo:'Tus criptoactivos',ancho:true,cerrable:true,cuerpo:'Monedas que solo existen en una red: suben y bajan por ciclos de euforia y pánico. '+(A()<2013?'Todavía casi nadie las conoce.':A()<2018?'Ya hay exchanges en América Latina.':'Los reguladores y los estafadores las miran igual de fijo.'),html:t,opciones:ops}); }
  function escenaComprar(id){ const m=MON[id], base=S.efectivo;
    const ops=[[.1,'una décima parte'],[.25,'un cuarto'],[.5,'la mitad']].map(([f,n])=>{ const x=base*f; return {t:'Comprar '+n+' de tu caja ('+fm(x)+')',cat:'mercado',cerrar:false,d:'Comisión de '+fm(Math.max(2,x*m.fee))+'.',dis:S.mov<1?'Sin movidas':(S.efectivo<x+Math.max(2,x*m.fee)?'No te alcanza':null),run:()=>{ S.mov=Math.max(0,S.mov-1); comprar(id,x); escenaPanel(); }}; });
    ops.push({t:'Volver',cat:'legado',cerrar:false,run:()=>escenaPanel()});
    escena({rubro:'Inversiones',titulo:'Comprar '+m.n,ancho:true,cerrable:true,cuerpo:m.d+' Tienes '+fm(base)+' en tu caja.',opciones:ops}); }
  function escenaVender(id){ const t=buscar(id); if(!t){ escenaPanel(); return; } const m=MON[id];
    const ops=[[.25,'un cuarto'],[.5,'la mitad'],[1,'todo']].map(([f,n])=>{ const x=t.valor*f, gan=Math.max(0,x-t.costo*f); return {t:'Vender '+n+' ('+fm(x)+')',cat:'mercado',cerrar:false,d:gan>0?'Ganancia de '+fm(gan)+' y un impuesto de '+fm(gan*tasaGO())+'.':'Sin ganancia: no pagas impuesto.',dis:S.mov<1?'Sin movidas':null,run:()=>{ S.mov=Math.max(0,S.mov-1); vender(id,f); escenaPanel(); }}; });
    ops.push({t:'Volver',cat:'legado',cerrar:false,run:()=>escenaPanel()});
    escena({rubro:'Inversiones',titulo:'Vender '+m.n,ancho:true,cerrable:true,cuerpo:'Tienes '+fm(t.valor)+' en '+m.n+' (pagaste '+fm(t.costo)+').',opciones:ops}); }

  /* ---------- enganches ---------- */
  function wrapFund(){ const old=window.correrFundacion; if(typeof old!=='function'||old.__v221) return; const f=function(res,m){ const r=old.apply(this,arguments); try{ anual(res); }catch(e){ console.error(e); } return r; }; f.__v221=true; window.correrFundacion=f; }
  const TIT='Tus criptoactivos';
  function wrapAcciones(){ const old=window.listaAcciones; if(typeof old!=='function'||window.__SA221_ACC) return; window.__SA221_ACC=true;
    window.listaAcciones=function(){ const L=old.apply(this,arguments);
      try{ if(Array.isArray(L)&&ACTIVO()&&!nino()&&A()>=2012&&(S.p.edad||0)>=18&&!L.some(x=>x&&x.t===TIT)&&(S.efectivo>=20||tens().length||granja())){ const v=valor(); L.push({t:TIT,cat:'mercado',d:v>0?'Tienes '+fm(v)+' en criptoactivos: comprar, vender, guardar y minar.':'Bitcoin, Ether, stablecoins y tokens: comprar, guardar, minar y pagar impuestos por las ganancias.',mov:0,modal:true,run:()=>escenaPanel()}); } }catch(x){ console.error(x); }
      try{ if(typeof window.replegarAcciones192==='function') window.replegarAcciones192(L); }catch(e){}
      return L; }; window.listaAcciones.__v221=true; }
  function wrapCat(){ const old=window.catDe; if(typeof old!=='function'||window.__SA221_CAT) return; window.__SA221_CAT=true; window.catDe=function(t){ if(t===TIT) return 'mercado'; return old.apply(this,arguments); }; }
  function legado(tarifa){ const T=tens(), g=granja(); if(!T.length&&!g) return null; const c=JSON.parse(JSON.stringify(S.cripto221)); c.tenencias.forEach(t=>{ t.valor*=(1-(tarifa||0)); t.costo=t.valor; }); if(c.granja) c.granja.valor*=(1-(tarifa||0)); c.hechos={}; return c; }
  function init221(){ wrapFund(); wrapAcciones(); wrapCat();
    Object.assign(window,{valorCripto221:valor,tenenciasCripto221:tens,granjaCripto221:granja,legadoCripto221:legado,escenaCripto221:escenaPanel,comprarCripto221:comprar,venderCripto221:vender,montarGranjaCripto221:montarGranja,venderGranjaCripto221:venderGranja,anualCripto221:anual,sucesosCripto221:sucesos,retornoCripto221:retorno,tasaCripto221:tasaGO,disponiblesCripto221:disp,MONEDAS_221:MON,HALVING_221:HALVING,estadoCripto221:K,
      eventosCripto221:{hackeo:evHackeo,quiebra:evQuiebra,terra:evTerra,estafa:evEstafa,dian:evDian}}); }
  init221(); setTimeout(init221,40); setTimeout(init221,220); setTimeout(init221,650); setTimeout(init221,950); setTimeout(init221,1500);
  window.__SA221={version:V221};
})();
