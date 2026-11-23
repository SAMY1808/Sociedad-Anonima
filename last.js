
/* ==========================================================================
   v220 · LA PLATA CALIENTE: EL NARCOTRÁFICO VISTO DESDE LA CASA
   El juego ya tenía los carteles como grupos armados (v91), los delitos de
   lavado y de prestar camiones, la extradición (v157) y el control de lavado
   de los bancos (v151). Faltaba lo que le pasa a una familia de negocios que
   toca esa plata sin ser parte del cartel:
   - TRATOS: entre 1975 y 2020 llegan ofertas de plata de dudoso origen: un
     comprador que paga en efectivo y muy por encima del precio por una
     propiedad, y un «socio capitalista» que quiere entrar a una compañía.
     Cada trato aceptado paga bien y sube tu EXPOSICIÓN (0 a 100). Las
     compañías con ese socio quedan marcadas.
   - LA ÉPOCA: la ventanilla siniestra y la bonanza (1975-83), la guerra de
     Lara Bonilla a Galán y los Extraditables (1984-90), la Constitución del 91
     (no extradita) y la caída de Escobar (1993), el Proceso 8000 y la lista
     Clinton (1995), la extinción de dominio (1996 y 2002) y la extradición
     que vuelve (1997): el clima cambia lo que cada trato cuesta.
   - CONSECUENCIAS: allanamientos, extinción de dominio sobre las compañías
     marcadas, la lista Clinton (te cierran las cuentas y el crédito) y la
     justicia de Estados Unidos. La exposición baja sola con los años si no
     sigues metido, y la reciben tus herederos rebajada.
   - SALIDAS: auditoría forense, separarte de los socios, colaborar con la
     Fiscalía o gastar en abogados para salir de la lista. Cada una tiene su
     precio y sus riesgos de retaliación.
   El panel «La plata caliente» aparece cuando hay exposición.
   ========================================================================== */
(function(){
  const V220='v220';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const nino=()=>{ try{ return typeof window.esNino94==='function'&&!!window.esNino94(); }catch(e){ return false; } };
  const ACTIVO=()=>!!(typeof S!=='undefined'&&S&&S.p&&!S.muerto);
  const C=()=>{ if(!S.caliente220) S.caliente220={expo:0,tratos:[],hechos:{},clinton:null}; return S.caliente220; };
  const expo=()=>((typeof S!=='undefined'&&S&&S.caliente220&&S.caliente220.expo)||0);
  const pago=b=>Math.round((b||0)*(1+(A()-1900)*.004));
  const comps=()=>{ try{ return companias(); }catch(e){ return []; } };
  const pat=()=>{ try{ const x=patrimonio(); return isFinite(x)?Math.max(0,x):0; }catch(e){ return 0; } };
  const sub=n=>{ C().expo=clamp(C().expo+n,0,100); };
  const estres=n=>{ try{ S.p.estres=clamp((S.p.estres||30)+n,0,100); }catch(e){} };
  const prest=(n,t)=>{ try{ moverPrestigio(n,t); }catch(e){} };
  const tomar=x=>{ const u=Math.min(Math.max(0,x),Math.max(0,S.efectivo)); S.efectivo-=u; return u; };
  const marcadas=()=>comps().filter(e=>e&&e.caliente220);

  /* el clima de cada época: cuánto pesa la exposición */
  function clima(a){ a=a||A(); return a<1975?0:a<1984?.6:a<1991?1.6:a<1995?1.1:a<2002?1.5:a<2016?1.3:1; }
  const ventana=a=>(a||A())>=1975&&(a||A())<=2020;
  function textoClima(a){ a=a||A(); return a<1975?'sin narcotráfico organizado en tu entorno':a<1984?'bonanza: la plata entra sin preguntas (la «ventanilla siniestra»)':a<1991?'guerra declarada a los carteles: allanamientos y bombas':a<1995?'la Constitución del 91 no extradita y cae Escobar':a<2002?'Proceso 8000, lista Clinton y extinción de dominio':a<2016?'extinción de dominio y extradición: la justicia aprieta':'vigilancia internacional y plata de minería ilegal'; }
  function trato(t,valor,quien){ const o=C(); o.tratos.push({a:A(),t,valor:Math.round(valor),quien}); if(o.tratos.length>12) o.tratos.shift(); }

  /* ---------- las ofertas ---------- */
  function evComprador(b){ const x=Math.round(b.valor*rnd(1.25,1.4));
    return {p:8,c:()=>ACTIVO()&&(S.bienes||[]).includes(b),t:()=>'<b>Un comprador paga '+fm(x)+' en efectivo por '+E(b.nombre)+'.</b> Es mucho más de lo que vale y no pide rebaja, ni preguntas, ni testigos en la escritura. Nadie sabe de dónde viene la plata.',
      o:[{t:'Vendérsela ('+fm(x)+')',f:()=>{ S.bienes=(S.bienes||[]).filter(z=>z!==b); S.efectivo+=Math.max(0,x-(b.hipoteca||0)); sub(7); trato('venta de '+b.nombre,x,'un comprador en efectivo'); estres(3); log('Vendiste <b>'+E(b.nombre)+'</b> por '+fm(x)+' en efectivo. La plata llegó limpia de papeles, pero no de preguntas.','hito'); return 'Vendiste con un buen sobreprecio ('+fm(x)+'): tu exposición subió.'; }},
         {t:'Exigir transferencia bancaria y revisar su origen',f:()=>{ if(chance(.5)){ return 'El comprador se fue sin decir nada: la oferta nunca existió.'; } const y=Math.round(x*.85); S.bienes=(S.bienes||[]).filter(z=>z!==b); S.efectivo+=Math.max(0,y-(b.hipoteca||0)); sub(2); trato('venta de '+b.nombre,y,'un comprador con papeles'); return 'Los papeles salieron en regla: vendiste por '+fm(y)+' con poco riesgo.'; }},
         {t:'Rechazar la oferta',f:()=>{ if(chance(.2)){ estres(8); return 'Rechazaste: alguien te mandó a decir que fue un error.'; } return 'Rechazaste la oferta y ahí quedó todo.'; }}]}; }
  function evSocio(e){ const x=Math.round(Math.max(30,valuar(e)*rnd(.15,.3)));
    return {p:8,c:()=>ACTIVO()&&comps().includes(e),t:()=>'<b>Un "socio capitalista" quiere poner '+fm(x)+' en '+E(e.nombre)+'.</b> No pide asiento en la junta ni cuentas claras: solo que le dejes "mover unas facturas". Es plata de alguien que no figura.',
      o:[{t:'Aceptar al socio ('+fm(x)+')',f:()=>{ e.caja=(e.caja||0)+x; e.crecimiento=(e.crecimiento||0)+.03; e.caliente220=true; sub(12); trato('capital en '+e.nombre,x,'un socio capitalista'); estres(4); log('<b>'+E(e.nombre)+'</b> recibió '+fm(x)+' de un socio que no figura: queda marcada.','hito'); return 'La compañía recibió '+fm(x)+' y creció: queda marcada por su socio.'; }},
         {t:'Pedirle un crédito a un banco',f:()=>{ const y=Math.round(x*.5); e.caja=(e.caja||0)+y; e.deuda=(e.deuda||0)+y; return 'Conseguiste '+fm(y)+' en un banco, con intereses y sin deberle favores a nadie.'; }},
         {t:'Rechazar a ese socio',f:()=>{ if(chance(.15)){ estres(6); return 'Lo rechazaste: dejó un recado que no te gustó.'; } return 'Rechazaste al socio y la conversación se acabó.'; }}]}; }
  function ofertas(){ const a=A(), k=clima(a), L=[]; if(!ventana(a)||pat()<200||expo()>=90) return L;
    const B=(S.bienes||[]).filter(b=>b&&b.valor>=30&&!b.caliente220); if(B.length&&chance(clamp(.1*k,0,.2))) L.push(evComprador(B[ri(0,B.length-1)]));
    const G=comps().filter(e=>e&&!e.caliente220&&valuar(e)>=60); if(G.length&&a>=1978&&chance(clamp(.06*k,0,.12))) L.push(evSocio(G[ri(0,G.length-1)]));
    return L; }

  /* ---------- las consecuencias ---------- */
  function evAllanamiento(){ const costo=pago(30);
    return {p:9,c:()=>ACTIVO(),t:()=>'<b>Allanan tu oficina.</b> La Fiscalía y la policía se llevan archivos y cuentas buscando el rastro de plata de un cartel. '+(clima()>=1.5?'Los periodistas ya están en la puerta.':'Alguien filtró tu nombre.'),
      o:[{t:'Dar la cara con un penalista ('+fm(costo)+')',f:()=>{ tomar(costo); if(chance(clamp(.7-expo()/150,.2,.8))){ sub(-10); return 'Probaste que no sabías el origen de esa plata: el asunto se enfrió.'; } sub(6); try{ registrarDelito('lavado de activos',4,'tratos con plata de un cartel'); }catch(x){} S.p.escandalos=(S.p.escandalos||0)+1; prest(-4,'un allanamiento por lavado'); return 'Encontraron lo que buscaban: quedó abierto un proceso por lavado.'; }},
         {t:'Colaborar con la Fiscalía',f:()=>{ sub(-18); estres(8); prest(-1,'colaboró con la justicia'); return 'Entregaste lo que tenías: te creyeron, pero ahora hay quien te mira con rencor.'; }},
         {t:'Negarlo todo',f:()=>{ if(chance(.35)){ return 'Negaste todo y se aburrieron de preguntar.'; } sub(10); try{ registrarDelito('lavado de activos',5,'tratos con plata de un cartel'); }catch(x){} prest(-6,'un proceso por lavado'); return 'No te creyeron: te abrieron un proceso.'; }}]}; }
  function evExtincion(e){ const x=Math.round(valuar(e)*(miPct(e)||1)*.5), pelea=pago(60);
    return {p:9,c:()=>ACTIVO()&&comps().includes(e),t:()=>'<b>La Fiscalía abre extinción de dominio sobre '+E(e.nombre)+'.</b> '+(A()>=1996?'Dice que se financió con plata del narcotráfico y pide que pase al Estado.':'La policía incautó sus libros: dicen que se levantó con dinero de un cartel.'),
      o:[{t:'Pelear el proceso ('+fm(pelea)+')',f:()=>{ tomar(pelea); if(chance(clamp(.6-expo()/200,.2,.65))){ e.caliente220=false; sub(-12); return 'Demostraste el origen lícito de '+e.nombre+': te la devolvieron, con mala fama.'; } return perder(e,x); }},
         {t:'Negociar: entregar el socio y quedarte con la compañía',f:()=>{ e.caliente220=false; sub(-20); e.caja=Math.max(0,(e.caja||0)-x*.5); estres(6); return 'Entregaste al socio: te quedaste con la compañía, pero pagaste una multa y te llegó un mensaje.'; }},
         {t:'Dejarla ir',f:()=>perder(e,x)}]}; }
  function perder(e,x){ try{ S.grupo=comps().filter(z=>z!==e); if(S.emp===e) S.emp=S.grupo[0]||null; }catch(z){} sub(-15); prest(-3,'perdió una compañía por extinción de dominio'); try{ hito('Perdió '+e.nombre+' por extinción de dominio'); }catch(z){} return 'El Estado se quedó con '+e.nombre+' (valía '+fm(x*2)+' y tu parte, '+fm(x)+').'; }
  function evClinton(){ const costo=pago(120);
    return {p:9,c:()=>ACTIVO()&&!C().clinton,t:()=>'<b>Tu nombre aparece en la lista Clinton.</b> El Tesoro de Estados Unidos prohíbe a sus bancos y a sus empresas hacer negocios contigo. Los bancos de aquí te cierran las cuentas por precaución.',
      o:[{t:'Pagar abogados en Washington para salir de la lista ('+fm(costo)+')',f:()=>{ tomar(costo); if(chance(.45)){ sub(-25); return 'Los abogados lograron sacarte de la lista: tardó, costó y quedó la cicatriz.'; } C().clinton=A(); return 'No lograron sacarte de la lista: quedaste con las cuentas cerradas.'; }},
         {t:'Vivir con la lista y mover plata en efectivo',f:()=>{ C().clinton=A(); sub(6); return 'Quedaste en la lista: vas a pagar caro por cada operación.'; }}]}; }
  function evExtradicion(){ const costo=pago(80);
    return {p:10,c:()=>ACTIVO(),t:()=>'<b>Estados Unidos pide tu extradición.</b> Una corte federal te acusa de lavar plata del narcotráfico y de ayudar a los traficantes.',
      o:[{t:'Resistir con abogados ('+fm(costo)+')',f:()=>{ tomar(costo); try{ if(typeof window.abrirExtradicion157==='function'&&chance(.5)){ window.abrirExtradicion157(); return 'El proceso de extradición quedó abierto: empieza la batalla en los tribunales.'; } }catch(x){} sub(-8); return 'Tus abogados frenaron la petición, por ahora.'; }},
         {t:'Colaborar con la justicia de Estados Unidos',f:()=>{ sub(-40); prest(-8,'colaboró con la justicia de Estados Unidos'); estres(12); try{ registrarDelito('lavado de activos',5,'tratos con plata del narcotráfico'); }catch(x){} S.p.escandalos=(S.p.escandalos||0)+1; return 'Negociaste: entregaste lo que sabías a cambio de una pena menor y de seguir vivo.'; }}]}; }
  function consecuencias(){ const c=C(), a=A(), k=clima(a), L=[]; if(c.expo<=0||!ACTIVO()) return L;
    if(a>=1984&&chance(clamp(c.expo/260*k,0,.3))) L.push(evAllanamiento());
    const M=marcadas(); if(M.length&&a>=1986&&chance(clamp((c.expo-10)/220*k,0,.3))) L.push(evExtincion(M[ri(0,M.length-1)]));
    if(a>=1995&&!c.clinton&&c.expo>=35&&chance(clamp((c.expo-25)/260*k,0,.25))) L.push(evClinton());
    if(((a>=1984&&a<=1990)||a>=1997)&&c.expo>=60&&chance(clamp((c.expo-50)/300*k,0,.2))) L.push(evExtradicion());
    return L; }

  /* ---------- el año ---------- */
  const HITOS={1984:'Asesinan al ministro de Justicia Rodrigo Lara Bonilla: el Gobierno declara la guerra a los carteles.',1989:'Asesinan a Luis Carlos Galán y los Extraditables llenan las ciudades de bombas.',1991:'La nueva Constitución prohíbe extraditar colombianos.',1993:'Cae abatido Pablo Escobar en Medellín.',1995:'El Proceso 8000 destapa la plata del narcotráfico en la política y EE. UU. publica la lista Clinton.',1996:'Se aprueba la primera ley de extinción de dominio.',1997:'Se restablece la extradición de colombianos.',2002:'Una nueva ley de extinción de dominio permite quitar bienes de origen ilícito sin condena penal.'};
  function anual(){ if(!ACTIVO()||nino()) return; const c=C(), a=A();
    try{ const v=window.conf91&&window.conf91().vinculos; if(v&&v.cartel&&a-v.cartel<=5&&a-v.cartel>=0) sub(5); }catch(e){}
    if(c.clinton){ const x=S.efectivo*.02; if(x>0) S.efectivo-=x; try{ S.p.reputacion=clamp(S.p.reputacion-1,0,100); }catch(e){} if(chance(.1)){ c.clinton=null; log('Te sacaron de la lista Clinton: tras años de trámites te devolvieron las cuentas.','bien'); } }
    if(c.expo>0&&!marcadas().length&&!c.clinton&&!(window.conf91&&window.conf91().vinculos&&window.conf91().vinculos.cartel&&a-window.conf91().vinculos.cartel<=5)) sub(-2);
    if(HITOS[a]&&!c.hechos[a]&&c.expo>=10){ c.hechos[a]=1; log('<b>'+E(HITOS[a])+'</b> Tu exposición hace que lo sientas de cerca.','mal'); if(a===1984||a===1995||a===1996||a===2002) sub(3); }
    let L=[]; try{ L=ofertas().concat(consecuencias()); }catch(e){ console.error(e); }
    L.sort((x,y)=>y.p-x.p).slice(0,2).forEach(ev=>{ try{ cola.push(ev); }catch(e){} }); }

  /* ---------- el panel ---------- */
  const barra=v=>'<span style="display:inline-block;width:96px;height:8px;background:rgba(255,255,255,.12);border-radius:4px;vertical-align:middle;margin-right:6px"><i style="display:block;height:8px;width:'+Math.round(clamp(v,0,100))+'%;background:'+(v<=25?'#79C897':v<=55?'#D8AB4F':'#D06A60')+';border-radius:4px"></i></span>'+Math.round(v);
  function escenaCaliente(){ const c=C(), M=marcadas(), sinMov=S.mov<1?'Sin movidas':null; const f=(n,m)=>m&&S.efectivo<n?'No te alcanza':sinMov;
    let t='<table class="libro"><tr><td>Exposición</td><td>'+barra(c.expo)+'</td></tr><tr><td>El clima de la época</td><td>'+E(textoClima())+'</td></tr><tr><td>Compañías marcadas</td><td>'+(M.length?M.map(e=>E(e.nombre)).join(', '):'ninguna')+'</td></tr>'+(c.clinton?'<tr><td>Lista Clinton</td><td><span style="color:#D06A60">desde '+c.clinton+': cuentas cerradas y crédito negado</span></td></tr>':'')+(c.tratos.length?'<tr><td>Tratos recientes</td><td>'+c.tratos.slice(-4).map(x=>E(x.t)+' ('+x.a+')').join(' · ')+'</td></tr>':'')+'</table>';
    const a1=pago(40), a2=Math.round(M.reduce((s,e)=>s+valuar(e)*(miPct(e)||1)*.08,0))||pago(20), a3=pago(120);
    const ops=[
      {t:'Depurar tus cuentas con una auditoría forense ('+fm(a1)+')',cat:'riesgo',cerrar:false,d:'Revisan cada trato, cada factura y cada socio: baja la exposición.',dis:c.expo<=0?'No tienes exposición':f(a1,true),run:()=>{ S.mov=Math.max(0,S.mov-1); tomar(a1); sub(-15); log('Una auditoría forense depuró tus cuentas ('+fm(a1)+').'); escenaCaliente(); }},
      {t:'Separarte de los socios sospechosos ('+fm(a2)+')',cat:'riesgo',cerrar:false,d:'Les compras su parte o les devuelves lo que pusieron. A veces no lo reciben bien.',dis:!M.length&&c.expo<=0?'No hay con quién':f(a2,true),run:()=>{ S.mov=Math.max(0,S.mov-1); tomar(a2); M.forEach(e=>{ e.caliente220=false; }); sub(-20); if(chance(.25)){ estres(10); log('Los socios se fueron, pero dejaron un recado que no te gustó.','mal'); } else log('Te separaste de los socios sin mayores problemas.'); escenaCaliente(); }},
      {t:'Colaborar con la Fiscalía',cat:'riesgo',cerrar:false,d:'Cuentas lo que sabes a cambio de borrar tu exposición. Pagas con tu tranquilidad y tu prestigio.',dis:c.expo<=0?'No tienes exposición':(A()<1985?'Todavía no hay a quién contarle':sinMov),run:()=>{ S.mov=Math.max(0,S.mov-1); c.expo=0; M.forEach(e=>{ e.caliente220=false; }); estres(10); prest(-3,'colaboró con la Fiscalía'); if(chance(.3)){ log('Después de hablar te llegó un mensaje: ya no eres de confianza para algunos.','mal'); estres(8); } else log('Hablaste con la Fiscalía y limpiaste tu historia.'); escenaCaliente(); }}];
    if(c.clinton) ops.push({t:'Gastar en abogados para salir de la lista Clinton ('+fm(a3)+')',cat:'riesgo',cerrar:false,d:'Un trámite largo, caro y sin garantías.',dis:f(a3,true),run:()=>{ S.mov=Math.max(0,S.mov-1); tomar(a3); if(chance(.45)){ c.clinton=null; sub(-15); log('Saliste de la lista Clinton.','bien'); } else log('El trámite no prosperó: sigues en la lista.','mal'); escenaCaliente(); }});
    escena({rubro:'Riesgo',titulo:'La plata caliente',ancho:true,cerrable:true,cuerpo:'La plata de dudoso origen paga bien y se cobra después. Mientras más tratos aceptes, más te miran los fiscales, los bancos y los que te la trajeron.',html:t,opciones:ops}); }

  /* ---------- enganches ---------- */
  function wrapPaso(){ const old=window.pasarAnio; if(typeof old!=='function'||window.__SA220_PASO) return; window.__SA220_PASO=true; window.pasarAnio=function(){ const r=old.apply(this,arguments); try{ if(S&&S.p&&!S.muerto) anual(); }catch(e){ console.error(e); } return r; }; }
  const TIT='La plata caliente';
  function wrapAcciones(){ const old=window.listaAcciones; if(typeof old!=='function'||window.__SA220_ACC) return; window.__SA220_ACC=true;
    window.listaAcciones=function(){ const L=old.apply(this,arguments);
      try{ if(Array.isArray(L)&&ACTIVO()&&!nino()&&A()>=1975&&(expo()>0||(S.caliente220&&S.caliente220.clinton)||marcadas().length)&&!L.some(x=>x&&x.t===TIT)){ L.push({t:TIT,cat:'riesgo',d:'Exposición '+Math.round(expo())+'/100: lo que has aceptado de plata de dudoso origen y cómo limpiarlo.',mov:0,modal:true,run:()=>escenaCaliente()}); } }catch(x){ console.error(x); }
      try{ if(typeof window.replegarAcciones192==='function') window.replegarAcciones192(L); }catch(e){}
      return L; }; window.listaAcciones.__v220=true; }
  function wrapCat(){ const old=window.catDe; if(typeof old!=='function'||window.__SA220_CAT) return; window.__SA220_CAT=true; window.catDe=function(t){ if(t===TIT) return 'riesgo'; return old.apply(this,arguments); }; }
  function legado(){ const c=S&&S.caliente220; if(!c||(!c.expo&&!c.clinton)) return null; return {expo:Math.round(c.expo*.6),tratos:(c.tratos||[]).slice(-4),hechos:{},clinton:null,herencia:true}; }
  function init220(){ wrapPaso(); wrapAcciones(); wrapCat();
    Object.assign(window,{calienteExpo220:expo,estadoCaliente220:C,climaCaliente220:clima,textoClimaCaliente220:textoClima,ofertasCaliente220:ofertas,consecuenciasCaliente220:consecuencias,anualCaliente220:anual,escenaCaliente220:escenaCaliente,legadoCaliente220:legado,marcadasCaliente220:marcadas,HITOS_CALIENTE_220:HITOS,
      eventosCaliente220:{comprador:evComprador,socio:evSocio,allanamiento:evAllanamiento,extincion:evExtincion,clinton:evClinton,extradicion:evExtradicion}}); }
  init220(); setTimeout(init220,40); setTimeout(init220,220); setTimeout(init220,650); setTimeout(init220,950); setTimeout(init220,1500);
  window.__SA220={version:V220};
})();
