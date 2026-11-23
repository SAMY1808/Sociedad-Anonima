
/* ==========================================================================
   v216 · TRES CARRERAS NUEVAS: DEPORTE, ARTE Y MÚSICA, PERIODISMO
   Se buscan donde se busca empleo («Buscar empleo», cada una en su sección)
   y funcionan como la vida militar o la eclesiástica: un panel con sus
   indicadores, decisiones que cuestan movida y plata, ascensos por años y
   desempeño, un sueldo (el del núcleo) y sucesos propios de cada oficio.
   - DEPORTE: boxeo, tenis, golf, atletismo, natación, fútbol, ciclismo y
     automovilismo, cada uno desde su época (y las mujeres, desde la suya).
     Forma, técnica, fama, disciplina y apoyo; el riesgo es de lesión. La
     forma cae con la edad, así que la carrera es corta: lesiones (con la
     cobertura de salud de la v209/v215), dopaje, partidos arreglados,
     contrato en el exterior, las grandes citas (Mundial, Olimpiadas, Tour,
     títulos) y el retiro.
   - ARTE Y MÚSICA: pintura, música, literatura, teatro, fotografía y cine.
     Talento, obra, fama, crítica y mecenas; el riesgo es la bohemia. Obras,
     exposiciones, giras, mecenas, representante, regalías, éxitos y
     críticas feroces, plagio, censura, excesos y encargos oficiales.
   - PERIODISMO: política, judiciales, economía, deportes, cultura y
     corresponsalía, en los medios de cada época. Credibilidad, fuentes,
     audiencia e independencia; el riesgo son las amenazas. Investigar,
     denunciar, columnas, pauta y «sobres», esquema de seguridad, demandas
     por calumnia, la censura, el 9 de abril de 1948, el cierre de los
     diarios en 1955-56 y el asesinato de Guillermo Cano en 1986.
   Al terminar la carrera queda un registro (S.legado216) con los logros.
   ========================================================================== */
(function(){
  const V216='v216';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(x);
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const nino=()=>{ try{ return typeof window.esNino94==='function'&&!!window.esNino94(); }catch(e){ return false; } };
  const Q=()=>(typeof S!=='undefined'&&S&&S.carr216)||null;
  const pago=b=>Math.round((b||0)*(1+(A()-1900)*.004));
  const tomar=x=>{ const u=Math.min(Math.max(0,x),Math.max(0,S.efectivo)); S.efectivo-=u; return u; };
  const sub=(q,k,d)=>{ q.ind[k]=clamp((q.ind[k]||0)+d,0,100); };
  const rie=(q,d)=>{ q.riesgo=clamp(q.riesgo+d,0,100); };
  const feli=d=>{ try{ S.p.felicidad=clamp(S.p.felicidad+d,0,100); }catch(e){} };
  const salud=d=>{ try{ if(S.p.salud!=null) S.p.salud=clamp(S.p.salud+d,0,100); }catch(e){} };
  const prest=(n,t)=>{ try{ moverPrestigio(n,t); }catch(e){} };
  const cob=()=>{ try{ return typeof window.factorRehab215==='function'?window.factorRehab215():1; }catch(e){ return 1; } };
  const mujer=()=>S.p.sexo==='m';
  const ciudad=()=>(S.hogar&&S.hogar.ciudad)||'Bogotá';
  const nv=(q)=>{ const c=CAR[q.id]; return {n:c.niv[clamp(q.nivel,0,5)],s:c.sal[clamp(q.nivel,0,5)]}; };
  const logro=(q,t)=>{ q.logros.push({a:A(),t}); if(q.logros.length>30) q.logros.shift(); };

  /* ====================== LOS TRES OFICIOS ====================== */
  const CAR={};
  const GRANDES=[1962,1990,1994,1998,2014,2018,2022];
  const CLUBES=[['Millonarios',1946],['Independiente Santa Fe',1941],['Atlético Nacional',1947],['Deportivo Cali',1912],['América de Cali',1927],['Junior de Barranquilla',1924],['Once Caldas',1961],['Deportes Tolima',1954]];
  const MEDIOS=[['La Gaceta de Colombia',1821],['El Neogranadino',1848],['El Espectador',1887],['El Nuevo Tiempo',1902],['El Tiempo',1911],['El Colombiano',1912],['El Heraldo',1933],['El Siglo',1936],['Caracol Radio',1948],['RCN Radio',1948],['El País de Cali',1950],['Telediario',1954],['Revista Semana',1982],['Noticiero CM&',1992],['Noticias RCN',1998],['un portal de noticias',2005]];

  /* ----- DEPORTE ----- */
  const DISC_D=[
    {id:'boxeo',n:'Boxeo',d:1900,m:1990,cita:['una pelea por el título mundial',a=>a>=1965?.3:0],emp:q=>'el gimnasio de boxeo de '+q.ciudad},
    {id:'tenis',n:'Tenis',d:1910,m:1920,cita:['un torneo del Grand Slam o la Copa Davis',a=>a>=1960?.3:0],emp:q=>'el Club de Tenis de '+q.ciudad},
    {id:'golf',n:'Golf',d:1910,m:1930,cita:['un torneo grande del circuito',a=>a>=1960?.25:0],emp:q=>'el Country Club de '+q.ciudad},
    {id:'atletismo',n:'Atletismo',d:1920,m:1932,cita:['los Juegos Olímpicos',a=>(a>=1948&&a%4===0)?.85:0],emp:q=>'la liga de atletismo de '+q.ciudad},
    {id:'natacion',n:'Natación',d:1920,m:1928,cita:['los Juegos Olímpicos',a=>(a>=1948&&a%4===0)?.85:0],emp:q=>'el club de natación de '+q.ciudad},
    {id:'futbol',n:'Fútbol',d:1948,m:1990,cita:['la Selección Colombia en el Mundial',a=>GRANDES.includes(a)?.85:((a>=1948&&a%4===0)?.15:0)],emp:q=>{ const L=CLUBES.filter(c=>A()>=c[1]); return L.length?L[ri(0,L.length-1)][0]:'un club de '+q.ciudad; }},
    {id:'ciclismo',n:'Ciclismo',d:1951,m:1975,cita:['una gran vuelta: la Vuelta a Colombia o el Tour de Francia',a=>a>=1951?.35:0],emp:q=>A()>=1983?'el equipo Café de Colombia':'el club ciclista de '+q.ciudad},
    {id:'automovilismo',n:'Automovilismo',d:1955,m:1970,cita:['una carrera internacional',a=>a>=1960?.3:0],emp:q=>'la escudería de '+q.ciudad}];
  CAR.deportista={ruta:'deportista',nombre:'Deporte profesional',seccion:'Deporte',titulo:'Tu carrera deportiva',entrada:'Hacerte deportista profesional',
    desde:1900,edad:[18,34],disc:DISC_D,sal:[4,12,36,95,260,520],min:[1,2,3,3,4,0],clave:'fama',
    niv:['Aficionado','Promesa','Profesional','Figura del equipo','Estrella','Leyenda del deporte'],
    ind:[['forma','Forma física'],['tecnica','Técnica'],['fama','Fama'],['disciplina','Disciplina'],['apoyo','Apoyo del club y el representante']],riesgoN:'Riesgo de lesión',
    ini:()=>({forma:ri(55,70),tecnica:ri(35,50),fama:ri(4,14),disciplina:ri(45,60),apoyo:ri(35,50)}),
    decae:{fama:1.5,apoyo:1},
    des:q=>q.ind.forma*.35+q.ind.tecnica*.3+q.ind.fama*.1+q.ind.disciplina*.15+q.ind.apoyo*.1-q.riesgo*.15-(q.ban>0?25:0)+8,
    paso:q=>{ const e=S.p.edad||25; if(e>27) q.ind.forma=clamp(q.ind.forma-(e-27)*1.1,0,100); if(q.ban>0) q.ban--; },
    extra:q=>{ const s=nv(q).s; const pat=Math.round(q.ind.fama/100*s*.6*(q.agente?1.25:1)*(q.exterior?1.8:1)*(q.ban>0?.2:1)); return {m:pat+(q.exterior?Math.round(s*.8):0),t:'patrocinios y premios'+(q.exterior?' y el contrato del exterior':'')}; },
    empleador:q=>{ const d=DISC_D.find(x=>x.id===q.disc); return d?d.emp(q):'un club'; },
    resumen:q=>'forma '+Math.round(q.ind.forma)+', técnica '+Math.round(q.ind.tecnica)+', fama '+Math.round(q.ind.fama),
    decs:[
      ['entrenar','Entrenar a doble jornada','Sube la forma y la técnica, pero te expones a lesiones.',0,q=>{ sub(q,'forma',8); sub(q,'tecnica',3); rie(q,7); return 'Entrenaste a doble jornada: más fuerte y más cansado.'; }],
      ['tecnica','Trabajar la técnica con un entrenador especializado','Sube la técnica y la disciplina.',6,q=>{ sub(q,'tecnica',9); sub(q,'disciplina',2); return 'Pulíste los detalles con un buen técnico.'; }],
      ['fisico','Preparación física, fisioterapia y nutrición','Sube la forma y baja el riesgo de lesión.',8,q=>{ sub(q,'forma',6); rie(q,-7); return 'Cuidaste el cuerpo con ciencia: menos riesgo de lesión.'; }],
      ['agente','Contratar un representante','Mejores contratos y patrocinios para siempre.',4,q=>{ q.agente=true; sub(q,'apoyo',10); return 'Un representante negocia por ti: mejores contratos y patrocinios.'; },q=>!q.agente],
      ['prensa',null,'Sube tu fama.',0,q=>{ sub(q,'fama',6); feli(1); return 'Saliste en los medios y la gente empezó a reconocerte.'; }],
      ['descanso','Descansar y recuperarte','Baja el riesgo de lesión y recupera algo de forma.',0,q=>{ rie(q,-13); sub(q,'forma',3); feli(2); return 'Descansaste: el cuerpo lo agradeció.'; }],
      ['exterior','Buscar un contrato en el exterior','Fichar en Europa o Estados Unidos: más plata y más fama, pero cuesta adaptarse.',12,q=>{ q.exterior=true; sub(q,'fama',8); sub(q,'forma',-3); rie(q,4); logro(q,'Fichó en el exterior'); return 'Conseguiste un contrato en el exterior: más plata, más fama y un país nuevo por aprender.'; },q=>!q.exterior&&q.nivel>=2&&(S.p.edad||0)<=32]],
    eventos:q=>{ const L=[], e=S.p.edad||25, a=A(), d=DISC_D.find(x=>x.id===q.disc)||DISC_D[0];
      if(chance(clamp(q.riesgo/100*.55+(q.ind.forma<35?.1:0),0,.7))) L.push(evLesion(q));
      if(a>=1968&&q.nivel>=2&&chance(.06)) L.push(evDopaje(q));
      if(a>=1985&&['futbol','boxeo','ciclismo','tenis'].includes(q.disc)&&q.nivel>=2&&chance(.05)) L.push(evAmano(q));
      if(q.nivel>=2&&e<=31&&!q.exterior&&q.ind.fama>=45&&chance(.18)) L.push(evOferta(q));
      const pc=d.cita[1](a); if(q.nivel>=2&&q.ban<=0&&pc&&chance(pc)) L.push(evCita(q,d));
      if((e>=36&&q.ind.forma<45)||e>=41||q.ind.forma<15) L.push(evRetiro(q));
      return L; }};

  /* ----- ARTE Y MÚSICA ----- */
  const DISC_A=[
    {id:'pintura',n:'Pintura y escultura',d:1800,m:1800,emp:q=>'tu taller en '+q.ciudad},
    {id:'musica',n:'Música',d:1800,m:1800,emp:q=>A()>=1930?'una orquesta y una casa disquera':'las veladas y los salones de '+q.ciudad},
    {id:'literatura',n:'Literatura',d:1800,m:1800,emp:q=>A()>=1900?'una editorial de '+q.ciudad:'los periódicos y las tertulias de '+q.ciudad},
    {id:'teatro',n:'Teatro',d:1800,m:1800,emp:q=>'una compañía de teatro de '+q.ciudad},
    {id:'fotografia',n:'Fotografía',d:1860,m:1880,emp:q=>'tu estudio fotográfico en '+q.ciudad},
    {id:'cine',n:'Cine y televisión',d:1920,m:1920,emp:q=>A()>=1954?'un canal de televisión y una productora':'una productora de cine'}];
  CAR.artista={ruta:'artista',nombre:'Arte y música',seccion:'Arte y música',titulo:'Tu vida artística',entrada:'Dedicarte al arte o a la música',
    desde:1800,edad:[18,65],disc:DISC_A,sal:[3,8,24,70,190,420],min:[1,2,3,4,5,0],clave:'fama',
    niv:['Aprendiz','Aficionado con obra','Profesional','Artista reconocido','Artista consagrado','Maestro'],
    ind:[['talento','Talento y oficio'],['obra','Obra'],['fama','Fama'],['critica','Crítica'],['mecenas','Mecenas y contactos']],riesgoN:'Bohemia y excesos',
    ini:()=>({talento:ri(40,60),obra:ri(10,25),fama:ri(2,10),critica:ri(30,45),mecenas:ri(15,30)}),
    decae:{obra:3,fama:2},
    des:q=>q.ind.talento*.3+q.ind.obra*.2+q.ind.fama*.2+q.ind.critica*.15+q.ind.mecenas*.15-q.riesgo*.1+6,
    paso:q=>{ if(q.censura>0) q.censura--; },
    extra:q=>{ const s=nv(q).s; return {m:Math.round((q.ind.obra*.4+q.ind.fama*.6)/100*s*.55*(q.agente?1.25:1)*(1+(q.regalias||0)*.25)),t:'ventas, funciones y regalías'}; },
    empleador:q=>{ const d=DISC_A.find(x=>x.id===q.disc); return d?d.emp(q):'tu taller'; },
    resumen:q=>'talento '+Math.round(q.ind.talento)+', obra '+Math.round(q.ind.obra)+', fama '+Math.round(q.ind.fama),
    decs:[
      ['crear','Dedicar el año a una obra grande','Sube la obra y el talento.',8,q=>{ sub(q,'obra',12); sub(q,'talento',3); rie(q,2); return 'Pasaste el año encerrado con tu obra: quedó algo de lo que te sientes orgulloso.'; }],
      ['exponer',null,'Sube la fama y mueve la crítica.',10,q=>{ sub(q,'fama',7); sub(q,'critica',q.ind.talento>=55?5:-4); sub(q,'mecenas',3); return 'El público vio tu obra: '+(q.ind.talento>=55?'la crítica fue amable.':'la crítica fue tibia.'); }],
      ['mecenas','Buscar un mecenas o un patrocinador','Dinero y contactos para trabajar sin afán.',0,q=>{ sub(q,'mecenas',9); sub(q,'fama',1); return 'Una casa rica te abrió sus puertas y su bolsillo.'; },q=>q.nivel<=3],
      ['estudiar','Estudiar en el exterior','Un año en París, Madrid o Nueva York: sube mucho el talento.',40,q=>{ sub(q,'talento',11); sub(q,'critica',3); q.estudio=A(); return 'Pasaste un año estudiando en el exterior: volviste con otra mirada.'; },q=>(S.p.edad||30)<=50&&(!q.estudio||A()-q.estudio>=5)],
      ['gira','Salir de gira o presentarte en la capital','Fama y contactos, a cambio de cansancio.',14,q=>{ sub(q,'fama',8); sub(q,'mecenas',3); rie(q,3); return 'La gira te llevó a otras ciudades: más público y más cansancio.'; }],
      ['colaborar','Colaborar con otro artista','Un poco de fama, de obra y de crítica.',0,q=>{ sub(q,'fama',4); sub(q,'obra',4); sub(q,'critica',2); return 'Trabajaste con otro artista: salió algo mejor de lo que esperabas.'; }],
      ['agente','Firmar con un representante o una casa editorial o disquera','Mejores contratos y distribución para siempre.',5,q=>{ q.agente=true; sub(q,'mecenas',6); sub(q,'fama',3); return 'Firmaste con quien te represente: tu obra llega más lejos.'; },q=>!q.agente&&q.nivel>=1],
      ['retiro','Retirarte a crear sin prisa','Baja la bohemia y sube el talento, aunque se enfríe la fama.',0,q=>{ rie(q,-11); sub(q,'talento',4); sub(q,'obra',3); sub(q,'fama',-3); feli(2); return 'Te retiraste a trabajar con calma: la obra ganó y la fama se enfrió.'; }]],
    eventos:q=>{ const L=[], a=A();
      if(q.ind.obra>=30&&q.ind.talento>=45&&chance(clamp((q.ind.obra*.3+q.ind.talento*.3+q.ind.fama*.1)/260,.05,.35))) L.push(evExito(q));
      if(chance(.12)) L.push(evCritica(q));
      if(q.ind.obra>=30&&q.nivel>=2&&chance(.05)) L.push(evPlagio(q));
      if(((a>=1886&&a<=1904)||(a>=1949&&a<=1958)||(a>=1978&&a<=1982))&&q.censura<=0&&['literatura','teatro','cine','musica'].includes(q.disc)&&chance(.3)) L.push(evCensuraArte(q));
      if(q.riesgo>=40&&chance(q.riesgo/150)) L.push(evExcesos(q));
      if(q.nivel>=2&&chance(.1)) L.push(evEncargo(q));
      return L; }};

  /* ----- PERIODISMO ----- */
  const DISC_P=[
    {id:'politica',n:'Política',d:1810,m:1930,emp:null},{id:'judicial',n:'Judiciales y orden público',d:1900,m:1950,emp:null},
    {id:'economia',n:'Economía',d:1900,m:1950,emp:null},{id:'deportes',n:'Deportes',d:1930,m:1960,emp:null},
    {id:'cultura',n:'Cultura',d:1850,m:1880,emp:null},{id:'internacional',n:'Corresponsalía en el exterior',d:1930,m:1950,emp:null}];
  const medioNuevo=()=>{ const L=MEDIOS.filter(m=>A()>=m[1]); return (L.length?L[ri(0,L.length-1)]:MEDIOS[0])[0]; };
  CAR.periodista={ruta:'periodista',nombre:'Periodismo',seccion:'Periodismo',titulo:'Tu carrera de periodista',entrada:'Empezar en el periodismo',
    desde:1810,edad:[18,55],disc:DISC_P,sal:[6,16,40,85,170,320],min:[1,2,3,4,5,0],clave:'audiencia',
    niv:['Reportero practicante','Reportero','Redactor','Corresponsal o jefe de sección','Columnista o jefe de redacción','Director o gran firma'],
    ind:[['credibilidad','Credibilidad'],['fuentes','Fuentes'],['audiencia','Audiencia'],['independencia','Independencia']],riesgoN:'Amenazas',
    ini:()=>({credibilidad:ri(45,60),fuentes:ri(20,35),audiencia:ri(5,15),independencia:ri(55,75)}),
    decae:{fuentes:2,audiencia:1.5},
    des:q=>q.ind.credibilidad*.3+q.ind.fuentes*.25+q.ind.audiencia*.2+q.ind.independencia*.15-q.riesgo*.1+8,
    paso:q=>{ if(q.exilio>0) q.exilio--; },
    extra:q=>({m:Math.round(q.ind.audiencia/100*nv(q).s*.25),t:'columnas y honorarios'}),
    empleador:q=>medioNuevo(),
    resumen:q=>'credibilidad '+Math.round(q.ind.credibilidad)+', fuentes '+Math.round(q.ind.fuentes)+', audiencia '+Math.round(q.ind.audiencia),
    decs:[
      ['investigar','Investigar un tema a fondo','Más fuentes y credibilidad, y un poco más de riesgo.',6,q=>{ sub(q,'fuentes',8); sub(q,'credibilidad',5); rie(q,5); return 'Pasaste semanas investigando: ya tienes de qué escribir.'; }],
      ['denuncia','Publicar una denuncia contra un poderoso','Sube la audiencia y la credibilidad, pero te señala.',0,q=>{ sub(q,'audiencia',10); sub(q,'credibilidad',7); sub(q,'independencia',3); rie(q,12); try{ S.p.redes=clamp((S.p.redes||0)-3,0,100); }catch(e){} return 'Tu denuncia sacudió a más de uno: la gente te lee y los señalados te recuerdan.'; }],
      ['columna','Escribir una columna de opinión','Audiencia y un par de enemigos.',0,q=>{ sub(q,'audiencia',5); sub(q,'independencia',-1); rie(q,3); return 'Tu columna dio de qué hablar.'; }],
      ['cubrir','Cubrir un hecho en el terreno','Fuentes y audiencia a cambio de riesgo: una guerra, un paro, un derrumbe.',0,q=>{ sub(q,'fuentes',4); sub(q,'audiencia',6); rie(q,8); return 'Estuviste donde pasaban las cosas y lo contaste de primera mano.'; }],
      ['fuentes','Cultivar tus fuentes','Cenas, favores y llamadas: más fuentes.',5,q=>{ sub(q,'fuentes',9); return 'Cultivaste tus fuentes: te contestan el teléfono.'; }],
      ['pauta','Aceptar pauta oficial o un «sobre»','Plata a cambio de tu independencia y de tu credibilidad.',0,q=>{ sub(q,'independencia',-12); sub(q,'credibilidad',-5); rie(q,-3); const m=pago(8+nv(q).s*.4); S.efectivo+=m; q.pauta=(q.pauta||0)+1; return 'Aceptaste el sobre y recibiste '+fm(m)+'. Quien te lo dio espera algo a cambio.'; }],
      ['libro','Publicar un libro de crónicas','Audiencia y credibilidad.',5,q=>{ sub(q,'audiencia',6); sub(q,'credibilidad',4); return 'Tu libro de crónicas se vendió y te dio nombre.'; },q=>q.nivel>=2],
      ['seguridad','Pedir un esquema de seguridad','Baja mucho el riesgo de amenazas.',20,q=>{ rie(q,-18); return 'Te asignaron escoltas: duermes mejor, aunque te siguen a todas partes.'; },q=>q.riesgo>=25||A()>=1985]],
    eventos:q=>{ const L=[], a=A();
      if(q.riesgo>=30&&chance(q.riesgo/170)) L.push(evAmenaza(q));
      if(q.ind.audiencia>=25&&chance(.09)) L.push(evCalumnia(q));
      if(q.ind.fuentes>=50&&q.ind.credibilidad>=50&&chance(.12)) L.push(evChiva(q));
      if(((a>=1949&&a<=1958)||(a>=1978&&a<=1982))&&q.censura<=0&&chance(.35)) { q.censura=3; L.push(evCensuraPrensa(q)); }
      if(q.ind.independencia<30&&chance(.15)) L.push(evVocero(q));
      if(a===1948&&!q.hitos[1948]) { q.hitos[1948]=1; L.push(evBogotazo(q)); }
      if(a===1955&&!q.hitos[1955]) { q.hitos[1955]=1; L.push(evCierre(q)); }
      if(a===1986&&!q.hitos[1986]) { q.hitos[1986]=1; L.push(evCano(q)); }
      return L; }};

  /* ====================== SUCESOS DEL DEPORTE ====================== */
  function evLesion(q){ const grave=chance(.35), costo=Math.round(pago(grave?30:12)*cob());
    return {p:9,c:()=>Q()===q,t:()=>'<b>Te lesionaste.</b> '+(grave?'Es una lesión seria: ligamentos y meses de recuperación.':'Una lesión molesta que te saca de las canchas unas semanas.')+' El médico del club dice que depende de cómo la trates.',
      o:[{t:'Operarte con el mejor especialista ('+fm(costo)+')',f:()=>{ if(S.efectivo<costo) return 'No te alcanza para el especialista.'; tomar(costo); rie(q,-22); sub(q,'forma',grave?-4:-1); return 'Te operaron bien y recuperaste el ritmo.'+(cob()<1?' Tu cobertura de salud pagó parte.':''); }},
         {t:'Recuperación rápida para volver ya',f:()=>{ rie(q,6); if(chance(grave?.5:.25)){ sub(q,'forma',-13); q.malos++; return 'Volviste antes de tiempo y recaíste: perdiste forma para siempre.'; } sub(q,'forma',-2); return 'Volviste pronto y saliste bien librado.'; }},
         {t:'Dejar el deporte',f:()=>{ salirSilencio('una lesión',true); return 'La lesión te sacó de las canchas para siempre.'; }}]}; }
  function evDopaje(q){ return {p:8,c:()=>Q()===q,t:()=>'<b>Te ofrecen una "ayuda".</b> El médico del equipo te propone una sustancia que no sale en los controles... casi siempre. Todos dicen que los rivales ya lo hacen.',
      o:[{t:'Aceptarla',f:()=>{ sub(q,'forma',12); if(chance(.35)){ q.ban=2; sub(q,'fama',-14); rie(q,10); prest(-8,'un escándalo de dopaje'); logro(q,'Sancionado por dopaje'); return 'Dio positivo: dos años de suspensión y tu nombre por el suelo.'; } return 'Funcionó: rendiste como nunca... y nadie sospechó.'; }},
         {t:'Negarte',f:()=>{ sub(q,'disciplina',3); sub(q,'apoyo',-3); return 'Dijiste que no: el médico no volvió a mirarte igual, pero dormiste tranquilo.'; }},
         {t:'Denunciarlo',f:()=>{ sub(q,'fama',5); sub(q,'apoyo',-10); prest(1,'denunció el dopaje'); return 'Denunciaste el dopaje: la prensa te aplaudió y en el club te dieron la espalda.'; }}]}; }
  function evAmano(q){ const m=pago(25+nv(q).s*.6);
    return {p:8,c:()=>Q()===q,t:()=>'<b>Te proponen arreglar un resultado.</b> Un desconocido ofrece '+fm(m)+' por "perder bien" en un partido que mueve apuestas.',
      o:[{t:'Aceptar el arreglo',f:()=>{ S.efectivo+=m; rie(q,14); if(chance(.3)){ q.ban=3; sub(q,'fama',-20); prest(-10,'un partido arreglado'); logro(q,'Sancionado por arreglar un partido'); return 'Lo descubrieron: suspensión de tres años y la vergüenza pública.'; } return 'Cobraste '+fm(m)+' y nadie se enteró... por ahora.'; }},
         {t:'Rechazarlo',f:()=>{ sub(q,'disciplina',3); return 'Dijiste que no y te quedaste con la conciencia limpia.'; }},
         {t:'Contárselo a las autoridades',f:()=>{ sub(q,'fama',4); prest(1,'denunció un arreglo'); rie(q,5); return 'Denunciaste el intento: la gente te lo reconoce, y a los que están detrás, no les gustó.'; }}]}; }
  function evOferta(q){ return {p:8,c:()=>Q()===q&&!q.exterior,t:()=>'<b>Llega una oferta del exterior.</b> Un equipo de Europa o de Estados Unidos te quiere: mucha más plata y un idioma que no hablas.',
      o:[{t:'Aceptar y mudarte',f:()=>{ q.exterior=true; sub(q,'fama',8); sub(q,'forma',-3); rie(q,4); logro(q,'Fichó en el exterior'); return 'Te fuiste al exterior: más plata y más fama, y un país entero por aprender.'; }},
         {t:'Quedarte en casa',f:()=>{ sub(q,'apoyo',4); feli(2); return 'Preferiste quedarte: tu gente lo agradeció.'; }}]}; }
  function evCita(q,d){ const nombre=d.cita[0], a=A();
    return {p:9,c:()=>Q()===q,t:()=>'<b>Llega '+E(nombre)+'.</b> Es la oportunidad de tu vida: el país entero te va a mirar.',
      o:[{t:'Ir con todo',f:()=>resultadoCita(q,nombre,0)},{t:'Cuidarte y no arriesgar',f:()=>{ rie(q,-8); return resultadoCita(q,nombre,-.3); }},{t:'Declinar',f:()=>{ sub(q,'apoyo',-4); sub(q,'fama',-2); return 'Declinaste la cita: nadie entendió por qué.'; }}]}; }
  function resultadoCita(q,nombre,pen){ const r=clamp((q.ind.tecnica*.4+q.ind.forma*.4+q.ind.fama*.05+ri(-22,22)-q.riesgo*.1)*(1+pen),0,100);
    if(r>=72){ sub(q,'fama',16); prest(q.nivel>=4?6:3,'un triunfo deportivo'); logro(q,'Triunfo en '+nombre); log('<b>Triunfaste en '+E(nombre)+'.</b>','hito'); try{ hito('Triunfo deportivo: '+nombre); }catch(e){} return 'Una actuación histórica: tu nombre quedó en los libros.'; }
    if(r>=50){ sub(q,'fama',5); return 'Hiciste un buen papel en '+nombre+': el público quedó satisfecho.'; }
    sub(q,'fama',-3); return 'Te fue mal en '+nombre+': la prensa fue dura.'; }
  function evRetiro(q){ return {p:9,c:()=>Q()===q,t:()=>'<b>El cuerpo ya no responde como antes.</b> A tu edad, cada partido cuesta más y los años buenos quedaron atrás. Es la hora de decidir.',
      o:[{t:'Colgar los guantes con honores',f:()=>{ const c=CAR.deportista, m=Math.round(q.ind.fama/100*nv(q).s*3); S.efectivo+=m; if(q.nivel>=3) prest(q.nivel>=4?4:2,'una gran carrera deportiva'); logro(q,'Se retiró con honores'); salirSilencio('se retiró con honores',false); return 'Te retiraste con un homenaje y un contrato de imagen por '+fm(m)+'.'; }},
         {t:'Un año más en un club menor',c:()=>(q.prorroga||0)<1,f:()=>{ q.prorroga=(q.prorroga||0)+1; q.nivel=Math.max(0,q.nivel-1); S.carrera.nivel=q.nivel; sub(q,'forma',3); return 'Aceptaste un año más en un club menor, con menos sueldo.'; }}].filter(o=>!o.c||o.c())}; }

  /* ====================== SUCESOS DEL ARTE ====================== */
  function evExito(q){ const m=Math.round(pago(12+nv(q).s*1.4));
    return {p:8,c:()=>Q()===q,t:()=>'<b>Una de tus obras pega.</b> Se habla de ella en todas partes y te llegan ofertas por los derechos.',
      o:[{t:'Vender los derechos de una vez ('+fm(m)+')',f:()=>{ S.efectivo+=m; sub(q,'fama',9); logro(q,'Un gran éxito de obra'); return 'Vendiste los derechos y cobraste '+fm(m)+'.'; }},
         {t:'Conservar los derechos y vivir de las regalías',f:()=>{ q.regalias=(q.regalias||0)+1; sub(q,'fama',11); sub(q,'critica',4); logro(q,'Un gran éxito de obra'); return 'Conservaste los derechos: cada año te dejarán regalías.'; }}]}; }
  function evCritica(q){ return {p:6,c:()=>Q()===q,t:()=>'<b>Un crítico te destroza.</b> Una reseña dura, con tu nombre en el titular, dice que eres un impostor.',
      o:[{t:'Responderle por la prensa',f:()=>{ if(chance(clamp(q.ind.talento/120,.2,.7))){ sub(q,'fama',6); sub(q,'critica',3); return 'Tu respuesta fue ingeniosa: el público tomó tu lado.'; } sub(q,'critica',-6); sub(q,'fama',-2); return 'La polémica te salió mal: quedaste peor.'; }},
         {t:'Ignorarlo',f:()=>{ sub(q,'critica',-2); return 'Lo ignoraste: se olvidó en una semana.'; }},
         {t:'Aprender de la crítica',f:()=>{ sub(q,'talento',4); sub(q,'critica',1); return 'Algo de razón tenía: trabajaste en tus defectos.'; }}]}; }
  function evPlagio(q){ const m=Math.round(pago(10+nv(q).s*.4));
    return {p:7,c:()=>Q()===q,t:()=>'<b>Te acusan de plagio.</b> Otro artista dice que tu obra más conocida es una copia de la suya.',
      o:[{t:'Demandar por difamación ('+fm(m)+')',f:()=>{ if(S.efectivo<m) return 'No te alcanza para el abogado.'; tomar(m); if(chance(.65)){ sub(q,'critica',5); sub(q,'fama',4); return 'Ganaste el pleito: tu nombre quedó limpio.'; } sub(q,'critica',-8); sub(q,'fama',-5); return 'Perdiste el pleito: quedó la duda.'; }},
         {t:'Responder con tu obra',f:()=>{ sub(q,'obra',5); return 'Respondiste trabajando: la polémica se apagó.'; }},
         {t:'Pagar un arreglo para que callen ('+fm(m)+')',f:()=>{ if(S.efectivo<m) return 'No te alcanza.'; tomar(m); sub(q,'critica',-2); return 'Pagaste para que callaran.'; }}]}; }
  function evCensuraArte(q){ q.censura=4; return {p:8,c:()=>Q()===q,t:()=>'<b>La censura toca tu obra.</b> Los censores del régimen exigen cambios en lo que escribes, montas o cantas.',
      o:[{t:'Acatar y suavizar',f:()=>{ sub(q,'mecenas',4); sub(q,'critica',-4); return 'Suavizaste la obra: pasó, pero te sientes vendido.'; }},
         {t:'Desafiar a los censores',f:()=>{ sub(q,'fama',9); sub(q,'critica',6); rie(q,12); return 'Desafiaste la censura: te hiciste un nombre... y un enemigo.'; }},
         {t:'Salir del país una temporada',f:()=>{ sub(q,'fama',-6); sub(q,'talento',4); rie(q,-10); return 'Te fuiste un tiempo: volverás cuando pase la tormenta.'; }}]}; }
  function evExcesos(q){ return {p:8,c:()=>Q()===q,t:()=>'<b>La bohemia pasa factura.</b> Noches largas, licor y mala compañía: tus amigos se preocupan.',
      o:[{t:'Pasar un tiempo en una clínica de reposo',f:()=>{ const m=Math.round(pago(15)*cob()); tomar(m); rie(q,-25); salud(5); return 'Te internaste unas semanas'+(cob()<1?' (tu cobertura pagó parte)':'')+' y saliste mejor.'; }},
         {t:'Seguir como si nada',f:()=>{ rie(q,6); salud(-9); sub(q,'obra',4); feli(-3); return 'Seguiste igual: la obra rindió, la salud no.'; }},
         {t:'Cambiar de vida',f:()=>{ rie(q,-16); sub(q,'fama',-4); feli(2); return 'Cambiaste de vida: más sano, menos legendario.'; }}]}; }
  function evEncargo(q){ const m=Math.round(pago(14+nv(q).s*.9));
    return {p:7,c:()=>Q()===q,t:()=>'<b>Te hacen un encargo.</b> Un poderoso (el gobierno, la Iglesia o una familia rica) te ofrece '+fm(m)+' por una obra a su gusto.',
      o:[{t:'Aceptar el encargo',f:()=>{ S.efectivo+=m; sub(q,'mecenas',7); sub(q,'critica',-3); return 'Cumpliste el encargo y cobraste '+fm(m)+'.'; }},
         {t:'Rechazarlo por independencia',f:()=>{ sub(q,'critica',4); sub(q,'mecenas',-3); return 'Rechazaste el encargo: tu independencia te hace respetar, no cobrar.'; }}]}; }

  /* ====================== SUCESOS DEL PERIODISMO ====================== */
  function evAmenaza(q){ const m=Math.round(pago(10)*1);
    return {p:9,c:()=>Q()===q,t:()=>'<b>Te amenazan por lo que publicaste.</b> '+(A()>=1980?'Una llamada anónima, un panfleto y un carro que te sigue.':'Una carta sin firma y alguien que te vigila a la salida.')+' El miedo es real.',
      o:[{t:'Ignorarla y seguir trabajando',f:()=>{ sub(q,'credibilidad',3); rie(q,7); if(q.riesgo>=70&&chance(.3)){ salud(-20); rie(q,-30); return 'Hubo un atentado: sobreviviste, pero quedaste herido.'; } return 'Seguiste escribiendo: tu coraje se comenta.'; }},
         {t:'Denunciar y pedir protección ('+fm(m)+')',f:()=>{ if(S.efectivo>=m) tomar(m); rie(q,-14); sub(q,'audiencia',2); return 'Denunciaste las amenazas y te dieron protección.'; }},
         {t:'Salir al exilio una temporada',f:()=>{ q.exilio=3; rie(q,-30); sub(q,'fuentes',-15); sub(q,'audiencia',-5); return 'Te fuiste del país un tiempo: vivo, pero lejos de tus fuentes.'; }}]}; }
  function evCalumnia(q){ const m=Math.round(pago(12+nv(q).s*.2));
    return {p:7,c:()=>Q()===q,t:()=>'<b>Te demandan por calumnia.</b> Alguien a quien nombraste en tu último texto dice que lo difamaste y pide cárcel y una rectificación.',
      o:[{t:'Rectificar',f:()=>{ sub(q,'credibilidad',-5); sub(q,'independencia',-2); return 'Rectificaste: el asunto se cerró, pero la credibilidad se resintió.'; }},
         {t:'Sostener lo publicado con un abogado ('+fm(m)+')',f:()=>{ if(S.efectivo<m) return 'No te alcanza para el abogado.'; tomar(m); if(chance(clamp(q.ind.credibilidad/110+q.ind.fuentes/400,.3,.85))){ sub(q,'credibilidad',7); sub(q,'audiencia',5); return 'Ganaste el pleito: tenías con qué probarlo.'; } sub(q,'credibilidad',-8); return 'Perdiste el pleito y tuviste que rectificar.'; }}]}; }
  function evChiva(q){ return {p:8,c:()=>Q()===q,t:()=>'<b>Tienes una chiva.</b> Una fuente de confianza te da un documento que lo cambia todo: tiene fecha y firma.',
      o:[{t:'Publicarla ya',f:()=>{ sub(q,'audiencia',12); sub(q,'credibilidad',5); rie(q,8); logro(q,'Una gran chiva periodística'); prest(1,'una gran noticia'); return 'Tu chiva abrió todos los noticieros.'; }},
         {t:'Verificarla dos semanas más',f:()=>{ if(chance(.6)){ sub(q,'audiencia',9); sub(q,'credibilidad',8); rie(q,4); logro(q,'Una gran chiva periodística'); return 'La verificaste y la publicaste sin un solo error.'; } sub(q,'audiencia',-2); return 'Mientras verificabas, otro medio la publicó antes.'; }},
         {t:'Venderla a quien salía perjudicado',f:()=>{ const m=pago(20+nv(q).s); S.efectivo+=m; sub(q,'independencia',-15); sub(q,'credibilidad',-8); return 'Cobraste '+fm(m)+' por callar: es un precio que se paga después.'; }}]}; }
  function evCensuraPrensa(q){ return {p:8,c:()=>Q()===q,t:()=>'<b>Llega la censura de prensa.</b> Un oficial se instala en la sala de redacción y revisa cada página antes de que salga.',
      o:[{t:'Autocensurarte',f:()=>{ sub(q,'independencia',-8); rie(q,-8); return 'Te autocensuraste: nadie te molestó, pero tampoco dijiste nada.'; }},
         {t:'Desafiarla',f:()=>{ sub(q,'credibilidad',8); sub(q,'audiencia',5); rie(q,14); return 'Desafiaste la censura: los lectores te lo agradecen y el gobierno te anota.'; }},
         {t:'Publicar desde la clandestinidad',f:()=>{ sub(q,'credibilidad',5); sub(q,'fuentes',-5); rie(q,10); return 'Publicaste clandestino: poco público, mucho respeto.'; }}]}; }
  function evVocero(q){ return {p:6,c:()=>Q()===q,t:()=>'<b>Dicen que eres vocero de alguien.</b> Tantos favores y tanta pauta empiezan a notarse: en los cafés te llaman "el de los sobres".',
      o:[{t:'Salir a defender tu independencia',f:()=>{ sub(q,'independencia',9); sub(q,'credibilidad',3); sub(q,'audiencia',-2); return 'Defendiste tu independencia: algunos te creyeron.'; }},
         {t:'Seguir como estás',f:()=>{ sub(q,'credibilidad',-6); return 'Seguiste igual: la credibilidad se erosiona.'; }}]}; }
  function evBogotazo(q){ return {p:9,c:()=>Q()===q,t:()=>'<b>El 9 de abril de 1948 asesinan a Jorge Eliécer Gaitán.</b> Bogotá arde y tú estás con una libreta en la mano en medio de la ciudad.',
      o:[{t:'Salir a cubrir los hechos',f:()=>{ sub(q,'audiencia',12); sub(q,'fuentes',6); rie(q,14); logro(q,'Cubrió el Bogotazo'); return 'Cubriste el Bogotazo desde la calle: tus crónicas hicieron historia.'; }},
         {t:'Encerrarte a escribir con lo que oyes',f:()=>{ sub(q,'audiencia',4); sub(q,'credibilidad',-3); return 'Escribiste con lo que te contaban: salió un texto flojo.'; }}]}; }
  function evCierre(q){ return {p:9,c:()=>Q()===q,t:()=>'<b>El gobierno de Rojas Pinilla cierra diarios.</b> En 1955 clausuran El Tiempo y en 1956 a El Espectador: los periodistas quedan en la calle.',
      o:[{t:'Escribir para otro medio o en la clandestinidad',f:()=>{ sub(q,'credibilidad',7); rie(q,10); return 'Seguiste escribiendo donde se pudo: tu credibilidad creció.'; }},
         {t:'Esperar a que reabran',f:()=>{ sub(q,'audiencia',-6); sub(q,'fuentes',-4); return 'Esperaste en la casa: perdiste el hilo.'; }},
         {t:'Irte a escribir al exterior',f:()=>{ q.exilio=3; sub(q,'fuentes',-8); rie(q,-15); return 'Te fuiste a escribir desde el exterior.'; }}]}; }
  function evCano(q){ return {p:9,c:()=>Q()===q,t:()=>'<b>Asesinan al director de El Espectador, don Guillermo Cano.</b> Es diciembre de 1986: el narcotráfico le declaró la guerra a la prensa. En todas las redacciones hay duelo y miedo.',
      o:[{t:'Marchar y escribir sin callarte',f:()=>{ sub(q,'credibilidad',9); sub(q,'audiencia',7); rie(q,16); logro(q,'Se la jugó tras el asesinato de Cano'); return 'Seguiste escribiendo contra el miedo: tu coraje inspiró a muchos.'; }},
         {t:'Callar por miedo',f:()=>{ rie(q,-10); sub(q,'credibilidad',-6); return 'Bajaste el tono: sobrevivir también es una decisión.'; }},
         {t:'Pedir un esquema de seguridad',f:()=>{ const m=Math.round(pago(20)); tomar(m); rie(q,-18); return 'Pediste esquema de seguridad ('+fm(m)+').'; }}]}; }

  /* ====================== EL MOTOR COMÚN ====================== */
  function tituloDec(c,d){ if(d[1]) return d[1]; if(d[0]==='prensa') return A()>=2010?'Entrevistas y redes sociales':'Entrevistas y apariciones públicas'; if(d[0]==='exponer'){ const q=Q(); const x={pintura:'Exponer en una galería',musica:'Dar un concierto',literatura:'Publicar un libro',teatro:'Estrenar una obra',fotografia:'Montar una exposición',cine:'Estrenar una película o una novela'}; return (q&&x[q.disc])||'Presentar tu obra'; } return d[0]; }
  const decs=q=>CAR[q.id].decs.filter(d=>!d[5]||d[5](q));
  function registrar(){ if(typeof RUTAS==='undefined') return; Object.keys(CAR).forEach(k=>{ const c=CAR[k]; if(RUTAS[c.ruta]) return; RUTAS[c.ruta]={n:c.nombre,niveles:c.sal.map((s,i)=>({n:c.niv[i],s,edu:0}))}; }); }
  function puede(id){ const c=CAR[id], q=Q(), e=S.p.edad||0, r=(S.carrera&&S.carrera.ruta)||'desempleado';
    if(!c||!S||!S.p||S.muerto) return 'No disponible'; if(nino()||e<18) return 'Hace falta ser mayor de edad';
    if(A()<c.desde) return 'Todavía no existe en esta época';
    if(q) return 'Ya tienes una carrera ('+CAR[q.id].nombre.toLowerCase()+')';
    if(r!=='desempleado'&&r!==null) return 'Ya tienes otro camino';
    if(e<c.edad[0]||e>c.edad[1]) return 'Se empieza entre los '+c.edad[0]+' y los '+c.edad[1]+' años';
    if(!discDisp(c).length) return 'En esta época no hay cabida para ti en este oficio';
    return null; }
  const discDisp=c=>c.disc.filter(d=>A()>=(mujer()?d.m:d.d));
  function ingresar(id,d){ const c=CAR[id]; if(Q()||!c) return 'No';
    registrar(); const q={id,disc:d.id,discN:d.n,nivel:0,anios:0,aniosNivel:0,ind:c.ini(),riesgo:ri(0,6),desde:A(),dec:0,hist:[],logros:[],ban:0,censura:0,exilio:0,malos:0,hitos:{},ciudad:ciudad()};
    S.carr216=q; S.carrera=S.carrera||{}; S.carrera.ruta=c.ruta; S.carrera.nivel=0; S.carrera.anios=0; S.carrera.desempeno=60; S.carrera.empleador=c.empleador(q);
    log('Empezaste en <b>'+E(c.nombre.toLowerCase())+'</b> ('+E(d.n.toLowerCase())+') como '+E(c.niv[0].toLowerCase())+' en '+E(S.carrera.empleador)+'. Se activó el panel de tu carrera.','hito'); try{ hito('Empezó en '+c.nombre.toLowerCase()+': '+d.n.toLowerCase()); }catch(x){}
    return 'Empezaste.'; }
  function legado(q,motivo){ const c=CAR[q.id], L=(S.legado216||(S.legado216=[])); L.push({car:q.id,carN:c.nombre,disc:q.discN,nivel:c.niv[clamp(q.nivel,0,5)],cumbre:Math.max(q.cumbre||0,q.nivel),desde:q.desde,hasta:A(),logros:q.logros.slice(),motivo}); }
  function salirSilencio(motivo,mal){ const q=Q(); if(!q) return; q.cumbre=Math.max(q.cumbre||0,q.nivel); legado(q,motivo); const c=CAR[q.id]; S.carr216=null; if(S.carrera&&S.carrera.ruta===c.ruta){ S.carrera.ruta='desempleado'; S.carrera.empleador=null; }
    log('Terminó tu carrera en '+E(c.nombre.toLowerCase())+' ('+E(motivo)+').',mal?'mal':'bien'); }
  function hacer(i){ const q=Q(); if(!q) return; const c=CAR[q.id], d=decs(q)[i]; if(!d) return; const p=pago(d[3]); if(S.mov<1||S.efectivo<p) return; S.mov=Math.max(0,S.mov-1); if(p) tomar(p);
    const m=d[4](q); Object.keys(q.ind).forEach(k=>{ q.ind[k]=clamp(q.ind[k],0,100); }); q.riesgo=clamp(q.riesgo,0,100); q.dec++; log(m+(p?' Costó '+fm(p)+'.':'')); escenaCarrera(); }
  function anual(){ if(!S||!S.p||S.muerto) return; const q=Q(); if(!q) return; registrar(); const c=CAR[q.id];
    if(!S.carrera||S.carrera.ruta!==c.ruta){ salirSilencio('cambió de camino',false); return; }
    q.anios++; q.aniosNivel++;
    Object.keys(q.ind).forEach(k=>{ q.ind[k]=clamp(q.ind[k]-((c.decae&&c.decae[k])||1)+ri(-2,2),0,100); }); rie(q,-2);
    if(c.paso) c.paso(q);
    const des=clamp(Math.round(c.des(q)),0,100); q.ultimoDes=des; q.hist.push({a:A(),des}); if(q.hist.length>12) q.hist.shift();
    S.carrera.nivel=q.nivel; S.carrera.desempeno=clamp(45+des*.55,45,100);
    q.malos=des<38?q.malos+1:(des>=50?0:q.malos);
    if(q.nivel<5&&q.aniosNivel>=c.min[q.nivel]){ const p=clamp((des-42)/75+((q.ind[c.clave]||50)-50)/350,.06,.75);
      if(chance(p)){ q.nivel++; q.aniosNivel=0; q.malos=0; q.cumbre=Math.max(q.cumbre||0,q.nivel); S.carrera.nivel=q.nivel; if(q.id!=='deportista') S.carrera.empleador=c.empleador(q); const nm=c.niv[q.nivel];
        prest(q.nivel>=4?5:q.nivel>=3?2:1,'ascendió a '+nm.toLowerCase()); S.p.reputacion=clamp(S.p.reputacion+(q.nivel>=3?2:1),0,100); log('<b>Subiste a '+E(nm.toLowerCase())+'</b> ('+E(S.carrera.empleador||'')+').','bien'); logro(q,'Llegó a '+nm.toLowerCase()); if(q.nivel===5){ try{ hito('Llegó a '+nm.toLowerCase()+' ('+c.nombre.toLowerCase()+')'); }catch(x){} } } }
    if(q.malos>=2&&q.nivel>0){ q.nivel--; q.malos=0; q.aniosNivel=0; S.carrera.nivel=q.nivel; log('Te bajaron a <b>'+E(c.niv[q.nivel].toLowerCase())+'</b> por tus malos resultados.','mal'); }
    else if(q.malos>=3&&q.nivel===0){ salirSilencio('no cuajó',true); return; }
    const x=c.extra(q); if(x&&x.m>0){ S.efectivo+=x.m; }
    log('Balance del año ('+E(c.niv[q.nivel].toLowerCase())+'): desempeño '+des+'/100, '+c.resumen(q)+(x&&x.m>0?'. Entraron '+fm(x.m)+' por '+x.t:'')+'.',des>=62?'bien':des<42?'mal':'');
    if(q.ban>0) log('Sigues suspendido: '+q.ban+' año(s) más.','mal');
    try{ c.eventos(q).sort((a,b)=>b.p-a.p).slice(0,2).forEach(ev=>cola.push(ev)); }catch(e){ console.error(e); } }

  /* ====================== PANELES ====================== */
  const barra=v=>'<span style="display:inline-block;width:96px;height:8px;background:rgba(255,255,255,.12);border-radius:4px;vertical-align:middle;margin-right:6px"><i style="display:block;height:8px;width:'+Math.round(clamp(v,0,100))+'%;background:'+(v>=65?'#79C897':v>=45?'#D8AB4F':'#D06A60')+';border-radius:4px"></i></span>'+Math.round(v);
  const barraRiesgo=v=>'<span style="display:inline-block;width:96px;height:8px;background:rgba(255,255,255,.12);border-radius:4px;vertical-align:middle;margin-right:6px"><i style="display:block;height:8px;width:'+Math.round(clamp(v,0,100))+'%;background:'+(v<=30?'#79C897':v<=55?'#D8AB4F':'#D06A60')+';border-radius:4px"></i></span>'+Math.round(v);
  function escenaCarrera(){ const q=Q(); if(!q) return; registrar(); const c=CAR[q.id], sig=q.nivel<5?c.niv[q.nivel+1]:null;
    const filas=c.ind.map(k=>'<tr><td>'+E(k[1])+'</td><td>'+barra(q.ind[k[0]])+'</td></tr>').join('');
    const t='<table class="libro"><tr><td>Estado</td><td>'+E(c.niv[q.nivel])+' · '+E(q.discN)+' · '+q.anios+' año'+(q.anios===1?'':'s')+'</td></tr><tr><td>Dónde</td><td>'+E((S.carrera&&S.carrera.empleador)||'')+'</td></tr>'+filas+'<tr><td>'+E(c.riesgoN)+'</td><td>'+barraRiesgo(q.riesgo)+'</td></tr><tr><td>Siguiente paso</td><td>'+(sig?E(sig.toLowerCase())+': '+Math.max(0,c.min[q.nivel]-q.aniosNivel)+' año(s) mínimo':'cúspide')+'</td></tr>'+(q.logros.length?'<tr><td>Logros</td><td>'+q.logros.slice(-4).map(l=>E(l.t)+' ('+l.a+')').join(' · ')+'</td></tr>':'')+'</table>';
    const ops=decs(q).map((d,i)=>{ const p=pago(d[3]); return {t:tituloDec(c,d)+(p?' ('+fm(p)+')':''),cat:'legado',cerrar:false,d:d[2],dis:S.mov<1?'Sin movidas':(S.efectivo<p?'No te alcanza':null),run:()=>hacer(i)}; });
    ops.push({t:q.id==='deportista'?'Retirarte del deporte':'Dejar esta carrera',cat:'riesgo',cerrar:false,d:'Vuelves a la vida civil con lo que acumulaste.',run:()=>{ salirSilencio(q.id==='deportista'?'se retiró':'dejó la carrera',false); cerrarModal(); render(); }});
    escena({rubro:E(c.seccion),titulo:E(c.niv[q.nivel])+' · '+E(c.titulo.toLowerCase()),ancho:true,cerrable:true,cuerpo:'Año '+(q.anios+1)+' en '+E(q.discN.toLowerCase())+'.<br><span style="color:var(--laton-op)">Desempeño del último balance: '+(q.ultimoDes==null?'aún sin balance':q.ultimoDes+'/100')+'.</span>',html:t,opciones:ops}); }
  function escenaEntrada(id){ const c=CAR[id], why=puede(id); registrar();
    const ops=discDisp(c).map(d=>({t:d.n,cat:'empleo',cerrar:false,d:id==='deportista'?'Empiezas como aficionado: la forma, la técnica y la fama dependen de lo que entrenes.':id==='artista'?'Empiezas como aprendiz: el talento y la obra hay que cultivarlos.':'Empiezas como reportero practicante en un medio de la época.',dis:why?why:(S.mov<1?'Sin movidas':null),run:()=>{ S.mov=Math.max(0,S.mov-1); ingresar(id,d); cerrarModal(); render(); }}));
    const cuerpo={deportista:'Los años buenos del deportista son pocos: la forma se acaba. Escoge tu disciplina; algunas solo existen desde cierta época y las mujeres llegaron a ellas más tarde.',artista:'El arte da fama, a veces plata y casi siempre problemas. Escoge tu oficio y vive de él... o intenta.',periodista:'El periodista cuenta lo que pasa y a veces paga por contarlo. Escoge tu sección y el medio te recibirá como practicante.'}[id];
    escena({rubro:E(c.seccion),titulo:E(c.nombre),ancho:true,cerrable:true,cuerpo:cuerpo+(why?'<br><span style="color:var(--laton-op)">'+E(why)+'.</span>':''),opciones:ops}); }

  /* ====================== ENGANCHES ====================== */
  function wrapPaso(){ const old=window.pasarAnio; if(typeof old!=='function'||window.__SA216_PASO) return; window.__SA216_PASO=true; window.pasarAnio=function(){ const r=old.apply(this,arguments); try{ if(S&&S.p&&!S.muerto) anual(); }catch(e){ console.error(e); } return r; }; }
  const TITULOS=['Hacerte deportista profesional','Dedicarte al arte o a la música','Empezar en el periodismo','Tu carrera deportiva','Tu vida artística','Tu carrera de periodista'];
  function grupo(){ const Gp=window.GRUPOS_91; if(!Array.isArray(Gp)) return; const e=Gp.find(x=>x.id==='empleo'); if(!e) return; e.miembros=e.miembros||[];
    Object.keys(CAR).forEach(k=>{ const c=CAR[k]; [c.entrada,c.titulo].forEach(t=>{ if(!e.miembros.some(m=>m[1]===t)) e.miembros.push([c.seccion,t]); }); });
    try{ if(Array.isArray(window.SECCIONES_EMPLEO_211)) Object.keys(CAR).forEach(k=>{ if(!window.SECCIONES_EMPLEO_211.includes(CAR[k].seccion)) window.SECCIONES_EMPLEO_211.push(CAR[k].seccion); }); }catch(x){}
  }
  function wrapAcciones(){ const old=window.listaAcciones; if(typeof old!=='function'||window.__SA216_ACC) return; window.__SA216_ACC=true;
    window.listaAcciones=function(){ try{ grupo(); registrar(); }catch(e){} const L=old.apply(this,arguments);
      try{ if(Array.isArray(L)&&S&&S.p){ const q=Q(); const nombres=Object.keys(CAR).map(k=>'Emplearte: '+CAR[k].nombre);
        for(let i=L.length-1;i>=0;i--){ const t=L[i]&&L[i].t; if(typeof t!=='string') continue; if(nombres.includes(t)) L.splice(i,1); else if(q&&/^(Pedir el ascenso a|Trabajar duro este año|Negociar salario|Renunciar$)/.test(t)) L.splice(i,1); }
        if(!nino()) Object.keys(CAR).forEach(k=>{ const c=CAR[k];
          if(q&&q.id===k&&!L.some(x=>x.t===c.titulo)) L.push({t:c.titulo,cat:'empleo',d:c.niv[q.nivel]+' · '+q.discN+': '+c.ind.map(z=>z[1].toLowerCase()).join(', ')+'.',mov:0,modal:false,run:()=>escenaCarrera()});
          if(!q&&puede(k)===null&&!L.some(x=>x.t===c.entrada)) L.push({t:c.entrada,cat:'empleo',d:k==='deportista'?'Boxeo, fútbol, ciclismo, tenis y más: pocos años buenos, mucha fama.':k==='artista'?'Pintura, música, literatura, teatro, fotografía o cine.':'Reportero, columnista y, algún día, director de un medio.',mov:1,modal:true,run:()=>escenaEntrada(k)}); }); } }catch(x){ console.error(x); }
      try{ if(typeof window.replegarAcciones192==='function') window.replegarAcciones192(L); }catch(e){}
      return L; }; window.listaAcciones.__v216=true; }
  function wrapCat(){ const old=window.catDe; if(typeof old!=='function'||window.__SA216_CAT) return; window.__SA216_CAT=true; window.catDe=function(t){ if(TITULOS.includes(t)) return 'empleo'; return old.apply(this,arguments); }; }
  function init216(){ registrar(); wrapPaso(); wrapAcciones(); wrapCat(); grupo();
    Object.assign(window,{carrera216:Q,CARRERAS_216:CAR,registrarCarreras216:registrar,puedeCarrera216:puede,ingresarCarrera216:ingresar,salirCarrera216:salirSilencio,anualCarrera216:anual,escenaCarrera216:escenaCarrera,escenaEntradaCarrera216:escenaEntrada,hacerCarrera216:hacer,decisionesCarrera216:decs,discDispCarrera216:discDisp,tituloDecCarrera216:tituloDec,pagoCarrera216:pago,
      eventosCarrera216:{lesion:evLesion,dopaje:evDopaje,amano:evAmano,oferta:evOferta,cita:evCita,retiro:evRetiro,exito:evExito,critica:evCritica,plagio:evPlagio,censuraArte:evCensuraArte,excesos:evExcesos,encargo:evEncargo,amenaza:evAmenaza,calumnia:evCalumnia,chiva:evChiva,censuraPrensa:evCensuraPrensa,vocero:evVocero,bogotazo:evBogotazo,cierre:evCierre,cano:evCano}}); }
  init216(); setTimeout(init216,40); setTimeout(init216,220); setTimeout(init216,650); setTimeout(init216,950); setTimeout(init216,1500);
  window.__SA216={version:V216};
})();
