
/* ==========================================================================
   v222 · LOS HIJOS Y LOS NIETOS CON LAS CARRERAS NUEVAS
   Al orientar a un hijo o a un nieto (v44, v203) se pueden escoger también
   la carrera DEPORTIVA, la ARTÍSTICA y la PERIODÍSTICA de la v216:
   - LA ÉPOCA Y EL SEXO FILTRAN LA OFERTA: la deportiva entre los 14 y los 32
     años, la artística desde los 16 y la periodística desde los 18, y solo
     si hay una disciplina o una sección abierta para esa persona en esa
     época (las mujeres llegaron más tarde a muchas). La disciplina se sortea
     entre las disponibles y queda en su título («Estrella (fútbol)»).
   - EL DEPORTISTA TIENE CARRERA CORTA: se retira a los 36 (o antes si no
     despegó), y queda como «Exdeportista» con el título que alcanzó.
   - APORTAN A LA CASA desde la mitad de la escalera: la figura del deporte y
     el artista le dan nombre; el periodista, oído en las redacciones.
   - PREMIOS: con los años reciben los premios de su oficio (los mismos de la
     v218: deportista del año, premios nacionales, Grammy Latino, Cabot...) y
     quedan en el «Salón de honor de la casa».
   - SUCESOS QUE TE PIDEN UNA DECISIÓN: la lesión del deportista (el mejor
     especialista, con la cobertura de salud) y la convocatoria a las
     grandes citas; la primera exposición del artista, la crítica que lo
     destroza y la bohemia; las amenazas al periodista, la chiva contra un
     amigo de la casa y la demanda por calumnia.
   ========================================================================== */
(function(){
  const V222='v222';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const ACTIVO=()=>!!(typeof S!=='undefined'&&S&&S.p&&!S.muerto);
  const pago=b=>Math.round((b||0)*(1+(A()-1900)*.004));
  const cob=()=>{ try{ return typeof window.factorRehab215==='function'?window.factorRehab215():1; }catch(e){ return 1; } };
  const tomar=x=>{ const u=Math.min(Math.max(0,x),Math.max(0,S.efectivo)); S.efectivo-=u; return u; };
  const TIPOS=['deportiva','artistica','periodistica'];
  const MAPA={deportiva:'deportista',artistica:'artista',periodistica:'periodista'};
  const TIT={deportiva:['Promesa del deporte','Deportista profesional','Figura del deporte','Leyenda del deporte'],
    artistica:['Aprendiz de artista','Artista profesional','Artista reconocido','Maestro de las artes'],
    periodistica:['Reportero','Redactor','Columnista o corresponsal','Gran firma o director']};
  const NOMBRE=h=>(h.nombre||'')+' '+(h.apellido||(S.p&&S.p.apellido)||'');
  const hijoA=h=>h.sexo==='m'?'hija':'hijo';
  const C216=()=>window.CARRERAS_216||null;

  /* ---------- quién puede y con qué disciplina ---------- */
  function discDe(k,h){ const c=C216()&&C216()[MAPA[k]]; if(!c) return []; return c.disc.filter(d=>A()>=(h.sexo==='m'?d.m:d.d)); }
  function disponible(k,h){ if(!TIPOS.includes(k)) return true; const e=(h&&h.edad)||0;
    if(k==='deportiva'&&(e<14||e>32||A()<1900)) return false; if(k==='artistica'&&(e<16||A()<1800)) return false; if(k==='periodistica'&&(e<18||e>60||A()<1810)) return false;
    return discDe(k,h).length>0; }
  function rotulo(c){ const t=TIT[c.tipo]; if(!t||!c.discN222) return; const base=t[clamp(c.nivel||0,0,3)]; c.titulo=c.retirada222?('Exdeportista ('+base.toLowerCase()+', '+c.discN222.toLowerCase()+')'):base+' ('+c.discN222.toLowerCase()+')'; }
  function asignar(h,k){ const c=h.casa43&&h.casa43.carreraPublica; if(!c||c.tipo!==k||c.disc222) return; const L=discDe(k,h); if(!L.length) return; const d=L[ri(0,L.length-1)]; c.disc222=d.id; c.discN222=d.n; rotulo(c); }
  function alOrientar(h,k){ if(!TIPOS.includes(k)) return; asignar(h,k); const c=h.casa43.carreraPublica; if(c&&c.discN222) log('La disciplina de <b>'+E(NOMBRE(h))+'</b> será '+E(c.discN222.toLowerCase())+'.'); }

  /* ---------- las ramas con carrera nueva ---------- */
  function ramas(){ const out=[]; const rec=(arr,g)=>{ (arr||[]).forEach(h=>{ if(!h) return; const c=h.casa43&&h.casa43.carreraPublica; if(c&&TIPOS.includes(c.tipo)) out.push({h,c,gen:g}); rec(h.hijos,g+1); }); }; rec(S.familia&&S.familia.hijos,1); return out; }
  const rel=(h,g)=>g>=2?(h.sexo==='m'?'nieta':'nieto'):hijoA(h);

  /* ---------- retiro, aportes y premios ---------- */
  function retirar(h,motivo){ const c=h.casa43&&h.casa43.carreraPublica; if(!c||c.retirada222) return; c.retirada222=A(); rotulo(c);
    log('<b>'+E(NOMBRE(h))+'</b> se retiró del deporte '+E(motivo)+': '+E(c.titulo)+'.','bien'); if(c.nivel>=2){ try{ moverPrestigio(1,'una carrera deportiva en la casa'); }catch(e){} } if(c.nivel>=3){ try{ hito(NOMBRE(h)+' se retiró del deporte como leyenda'); }catch(e){} } }
  function aporte(h,c,g){ if(c.retirada222&&c.tipo==='deportiva') return; if((c.nivel||0)<2||c.exilio222>0) return; const n=c.nivel;
    if(c.tipo==='periodistica') S.p.redes=clamp((S.p.redes||0)+(n>=3?2:1),0,100); else { S.p.reputacion=clamp(S.p.reputacion+(n>=3?2:1),0,100); if(n>=3) S.p.redes=clamp((S.p.redes||0)+1,0,100); } }
  const EQ=n=>n>=3?5:n===2?3:n===1?1:0;
  function premios(h,c,g){ if(typeof window.otorgarPremio218!=='function'||(h.edad||0)<18) return; const OF=window.OFICIO_218; if(!OF) return; const key=c.tipo==='deportiva'?'deportista':c.tipo==='artistica'?c.disc222:'periodista'; const T=OF[key]; if(!T) return; const eq=EQ(c.nivel||0);
    T.forEach(p=>{ if(A()<p[1]||eq<p[2]) return; const hk='ofh:'+(h.fid||h.nombre)+':'+p[0]; const P=S.premios218; if(P&&P.hechos&&P.hechos[hk]) return; let pr=clamp(.04+(eq-p[2])*.06,.04,.2); if(p[0]==='Premio Pulitzer') pr=.015; if(!chance(pr)) return;
      const x=window.otorgarPremio218({id:hk,n:p[0],cat:'oficio',quienN:NOMBRE(h),rel:rel(h,g),pres:Math.max(1,p[3]-1),hito:p[3]>=5,nota:E(NOMBRE(h))+' ('+E(c.titulo||'')+') recibió el premio.'}); S.premios218.hechos[hk]=1; }); }

  /* ---------- los sucesos ---------- */
  const vive=(h,c)=>ACTIVO()&&ramas().some(x=>x.h===h&&x.c===c);
  function evLesion(h,c){ const costo=Math.round(pago(30)*cob());
    return {p:8,c:()=>vive(h,c)&&!c.retirada222,t:()=>'<b>'+E(NOMBRE(h))+' se lesiona.</b> Una rotura seria que lo saca de las canchas meses. El médico del club dice que depende de cómo lo trates.',
      o:[{t:'Pagarle el mejor especialista ('+fm(costo)+')',f:()=>{ tomar(costo); h.vinculo=clamp((h.vinculo||60)+3,0,100); return 'Se operó con el mejor especialista'+(cob()<1?' (tu cobertura de salud pagó parte)':'')+' y volvió a entrenar.'; }},
         {t:'Dejar que el club se encargue',f:()=>{ if(chance(clamp(.5-(c.nivel||0)*.1,.15,.5))){ retirar(h,'por una lesión mal curada'); return 'La lesión se complicó y tuvo que dejar el deporte.'; } return 'Se recuperó con lo que el club le dio, sin mayores secuelas.'; }},
         {t:'Pedirle que se retire',f:()=>{ h.vinculo=clamp((h.vinculo||60)-6,0,100); retirar(h,'por decisión de la familia'); return 'Se retiró, algo resentido con la casa.'; }}]}; }
  function evDopaje(h,c){ const costo=pago(40);
    return {p:8,c:()=>vive(h,c)&&!c.retirada222,t:()=>'<b>A '+E(NOMBRE(h))+' le sale positivo un control antidopaje.</b> Dice que no sabía lo que le dieron. La federación abre un proceso y la prensa ya lo sabe.',
      o:[{t:'Pagar abogados ('+fm(costo)+')',f:()=>{ tomar(costo); if(chance(.6)){ return 'Los abogados demostraron la contaminación: lo exoneraron.'; } try{ moverPrestigio(-3,'un escándalo de dopaje en la familia'); }catch(e){} retirar(h,'sancionado por dopaje'); return 'Lo sancionaron de por vida: el escándalo salpicó a la casa.'; }},
         {t:'Aceptar la sanción de un año',f:()=>{ try{ moverPrestigio(-2,'una sanción por dopaje'); }catch(e){} c.nivel=Math.max(0,(c.nivel||0)-1); rotulo(c); return 'Lo suspendieron un año y bajó de categoría.'; }}]}; }
  function evConvocatoria(h,c){ const d=((C216()||{}).deportista||{disc:[]}).disc.find(x=>x.id===c.disc222); const cita=d&&d.cita; if(!cita||!(cita[1](A())>0)) return evLesion(h,c); const costo=pago(25);
    const resolver=lujo=>{ const r=ri(0,100)+(c.nivel||0)*12+(lujo?15:0)+((h.casa43&&h.casa43.prestigio)||30)/5; if(r>=95){ if(typeof window.otorgarPremio218==='function'){ window.otorgarPremio218({id:'cita:'+(h.fid||h.nombre)+':'+A(),n:'Triunfo en '+cita[0],cat:'oficio',quienN:NOMBRE(h),rel:'descendiente',pres:3,hito:true,nota:E(NOMBRE(h))+' triunfó.'}); } return E(NOMBRE(h))+' triunfó en '+cita[0]+': el país entero lo vio.'; } if(r>=70){ try{ moverPrestigio(1,'un buen papel en '+cita[0]); }catch(e){} return 'Hizo un buen papel en '+cita[0]+'.'; } return 'No le fue bien en '+cita[0]+': la prensa fue dura.'; };
    return {p:8,c:()=>vive(h,c)&&!c.retirada222,t:()=>'<b>Convocan a '+E(NOMBRE(h))+' a '+E(cita[0])+'.</b> Es la oportunidad de su vida y la familia entera está pendiente.',
      o:[{t:'Pagarle la preparación ('+fm(costo)+')',f:()=>{ tomar(costo); return resolver(true); }},{t:'Dejarlo ir con lo que tiene',f:()=>resolver(false)}]}; }
  function evExposicion(h,c){ const costo=pago(20);
    return {p:7,c:()=>vive(h,c),t:()=>'<b>'+E(NOMBRE(h))+' va a presentar su obra por primera vez.</b> Necesita una sala, invitaciones y quien pague el montaje: sin plata, la obra se queda en el taller.',
      o:[{t:'Financiarle la presentación ('+fm(costo)+')',f:()=>{ tomar(costo); if(chance(.65)){ c.anios=(c.anios||0)+2; try{ moverPrestigio(1,'el éxito de un artista de la casa'); }catch(e){} return 'La presentación fue un éxito: la crítica lo notó.'; } return 'La presentación pasó sin pena ni gloria.'; }},
         {t:'Que se las arregle solo',f:()=>{ if(chance(.35)){ c.anios=(c.anios||0)+1; return 'Contra todo pronóstico, su obra llamó la atención.'; } h.vinculo=clamp((h.vinculo||60)-3,0,100); return 'No consiguió sala: la obra se quedó en el taller.'; }}]}; }
  function evCritica(h,c){ return {p:6,c:()=>vive(h,c),t:()=>'<b>Un crítico destroza a '+E(NOMBRE(h))+'.</b> Una reseña dura con su apellido en el titular. Llega a la casa destrozado.',
      o:[{t:'Consolarlo y animarlo a seguir',f:()=>{ h.vinculo=clamp((h.vinculo||60)+5,0,100); return 'Lo animaste: siguió con más ganas.'; }},
         {t:'Decirle que busque algo serio',f:()=>{ h.vinculo=clamp((h.vinculo||60)-10,0,100); if(chance(.4)){ h.casa43.carreraPublica=null; log('<b>'+E(NOMBRE(h))+'</b> dejó el arte por consejo de la familia.'); return 'Hizo caso y dejó el arte: la casa se quedó sin artista.'; } return 'Te oyó, pero no te hizo caso: sigue con su obra, algo distanciado.'; }}]}; }
  function evBohemia(h,c){ const costo=Math.round(pago(15)*cob());
    return {p:7,c:()=>vive(h,c),t:()=>'<b>La bohemia pasa factura a '+E(NOMBRE(h))+'.</b> Noches largas, licor y mala compañía: los amigos de la casa lo comentan.',
      o:[{t:'Internarlo unas semanas ('+fm(costo)+')',f:()=>{ tomar(costo); h.vinculo=clamp((h.vinculo||60)+4,0,100); return 'Salió mejor de la clínica'+(cob()<1?' (tu cobertura pagó parte)':'')+'.'; }},
         {t:'Dejarlo que aprenda solo',f:()=>{ try{ moverPrestigio(-1,'un escándalo bohemio en la familia'); }catch(e){} h.vinculo=clamp((h.vinculo||60)-6,0,100); return 'Siguió igual: el escándalo se comentó en los salones.'; }}]}; }
  function evAmenaza(h,c){ const costo=pago(25);
    return {p:9,c:()=>vive(h,c),t:()=>'<b>Amenazan a '+E(NOMBRE(h))+' por lo que publicó.</b> '+(A()>=1980?'Una llamada anónima, un panfleto y un carro que lo sigue.':'Una carta sin firma y alguien que lo vigila a la salida.')+' El miedo es real.',
      o:[{t:'Pagarle un esquema de seguridad ('+fm(costo)+')',f:()=>{ tomar(costo); h.vinculo=clamp((h.vinculo||60)+3,0,100); return 'Le pusiste escoltas: duerme mejor, aunque lo siguen a todas partes.'; }},
         {t:'Pedirle que se vaya del país un tiempo',f:()=>{ c.exilio222=3; return 'Se fue al exterior unos años: vivo, pero lejos de sus fuentes.'; }},
         {t:'Respaldarlo en público',f:()=>{ try{ moverPrestigio(1,'la casa respaldó a su periodista'); }catch(e){} if(chance(.25)){ try{ S.p.estres=clamp((S.p.estres||30)+10,0,100); }catch(e){} c.exilio222=2; return 'Hubo un atentado: sobrevivió, pero tuvo que salir del país un par de años.'; } return 'La casa lo respaldó y el asunto se enfrió.'; }}]}; }
  function evChiva(h,c){ return {p:7,c:()=>vive(h,c),t:()=>'<b>'+E(NOMBRE(h))+' investiga a un amigo de la casa.</b> Tiene los documentos y la noticia lo haría famoso, pero salpica a alguien que te ha hecho favores.',
      o:[{t:'Pedirle que no la publique',f:()=>{ S.p.redes=clamp((S.p.redes||0)+3,0,100); h.vinculo=clamp((h.vinculo||60)-10,0,100); return 'No la publicó, y a tu amigo le quedó un favor contigo; a ti, un hijo resentido.'; }},
         {t:'Dejar que la publique',f:()=>{ try{ moverPrestigio(1,'la independencia de un periodista de la casa'); }catch(e){} S.p.redes=clamp((S.p.redes||0)-3,0,100); return 'La publicó: el periodista se hizo famoso y tu amigo se volvió enemigo.'; }}]}; }
  function evCalumnia(h,c){ const costo=pago(20);
    return {p:6,c:()=>vive(h,c),t:()=>'<b>Demandan a '+E(NOMBRE(h))+' por calumnia.</b> Alguien nombrado en su último texto dice que lo difamó y pide cárcel y rectificación.',
      o:[{t:'Pagarle los abogados ('+fm(costo)+')',f:()=>{ tomar(costo); if(chance(.7)){ return 'Ganaron el pleito: tenía con qué probarlo.'; } return 'Perdieron el pleito y tuvo que rectificar.'; }},
         {t:'Que rectifique y cierre el asunto',f:()=>{ h.vinculo=clamp((h.vinculo||60)-4,0,100); return 'Rectificó: el asunto se cerró, pero el orgullo quedó herido.'; }}]}; }
  function evento(h,c){ const k=c.tipo, L=[]; if(k==='deportiva'){ L.push(()=>evLesion(h,c)); if(A()>=1968) L.push(()=>evDopaje(h,c)); if((c.nivel||0)>=1) L.push(()=>evConvocatoria(h,c)); }
    if(k==='artistica'){ L.push(()=>evExposicion(h,c)); L.push(()=>evCritica(h,c)); if((c.nivel||0)>=1) L.push(()=>evBohemia(h,c)); }
    if(k==='periodistica'){ L.push(()=>evAmenaza(h,c)); if((c.nivel||0)>=1) L.push(()=>evChiva(h,c)); L.push(()=>evCalumnia(h,c)); }
    return L.length?L[ri(0,L.length-1)]():null; }

  /* ---------- el año ---------- */
  function anual(){ if(!ACTIVO()) return; const R=ramas(); if(!R.length) return;
    R.forEach(x=>{ const {h,c,gen}=x; if(!c.disc222) asignar(h,c.tipo); if(c.exilio222>0) c.exilio222--; rotulo(c);
      if(c.tipo==='deportiva'&&!c.retirada222){ const e=h.edad||0; if(e>=36||(c.nivel<2&&e>=32&&chance(.3))) retirar(h,e>=36?'por la edad':'sin haber despegado'); }
      aporte(h,c,gen); try{ premios(h,c,gen); }catch(e){ console.error(e); } });
    const act=R.filter(x=>!(x.c.retirada222)&&!(x.c.exilio222>0)); if(act.length&&chance(.2)){ const x=act[ri(0,act.length-1)]; try{ const ev=evento(x.h,x.c); if(ev) cola.push(ev); }catch(e){ console.error(e); } }
    if(act.length&&chance(.2)){ const x=act[ri(0,act.length-1)], c=x.c; if((c.nivel||0)>=2) log(E(NOMBRE(x.h))+', '+E((c.titulo||'').toLowerCase())+', le da nombre a la casa'+(c.tipo==='periodistica'?' en las redacciones.':c.tipo==='deportiva'?' en los estadios.':' en los salones.')); } }

  /* ---------- enganches ---------- */
  function wrapPaso(){ const old=window.pasarAnio; if(typeof old!=='function'||window.__SA222_PASO) return; window.__SA222_PASO=true; window.pasarAnio=function(){ const r=old.apply(this,arguments); try{ if(S&&S.p&&!S.muerto) anual(); }catch(e){ console.error(e); } return r; }; }
  function init222(){ wrapPaso();
    Object.assign(window,{carreraDisponible222:disponible,alOrientar222:alOrientar,anualHijos222:anual,ramasCarreras222:ramas,retirarHijo222:retirar,premiosHijo222:premios,aporteHijo222:aporte,discDeHijo222:discDe,rotuloHijo222:rotulo,TITULOS_222:TIT,
      eventosHijos222:{lesion:evLesion,dopaje:evDopaje,convocatoria:evConvocatoria,exposicion:evExposicion,critica:evCritica,bohemia:evBohemia,amenaza:evAmenaza,chiva:evChiva,calumnia:evCalumnia},eventoHijo222:evento}); }
  init222(); setTimeout(init222,40); setTimeout(init222,220); setTimeout(init222,650); setTimeout(init222,950); setTimeout(init222,1500);
  window.__SA222={version:V222};
})();
