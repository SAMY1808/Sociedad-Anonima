
/* ==========================================================================
   v219 · TELECOMUNICACIONES COMO CLASE DE NEGOCIO
   Entra por la misma puerta que las demás, en «Tecnología y medios», y
   funciona como una red de unidades por época:
   - 1865: el TELÉGRAFO (oficinas y líneas; declina desde la radio y el
     teléfono, y desaparece hacia 1975).
   - 1884: la TELEFONÍA local (centrales y redes de líneas) y, desde 1925, la
     LARGA DISTANCIA y los enlaces (el Estado entra en 1947 con Telecom).
   - 1992: la TELEVISIÓN POR CABLE y satelital; 1994: la red CELULAR (con la
     licitación de la telefonía móvil) y, desde 1996, el INTERNET y la banda
     ancha; 2008: la FIBRA ÓPTICA al hogar.
   - Apoyos: cuadrillas de instalación y mantenimiento (1865), centro de
     operaciones y conmutación (1920), torres y antenas propias (1994) y
     cable submarino y enlaces internacionales (2000). Bajan los costos y
     las caídas de las unidades que cubren.
   - Sucesos: la red que se cae, los cables y las torres robados o
     volados (la guerra), los topes de tarifas de la regulación, las
     licitaciones de espectro (celular 1994, 4G en 2013, 5G en 2023), las
     guerras de precios, la clonación de celulares y los ciberataques, la
     migración a la siguiente tecnología y la competencia de la empresa
     estatal Telecom (1947-2003).
   La compañía queda en el sector «Software y datos», con las regulaciones
   de cada época: el Gobierno, el Ministerio de Comunicaciones (1967), la
   Comisión de Regulación de Telecomunicaciones (1994) y el MinTIC y la CRC
   (2009).
   ========================================================================== */
(function(){
  const V219='v219';
  const A=()=>(typeof S!=='undefined'&&S&&isFinite(S.anio))?S.anio:2026;
  const fm=x=>fmt(Math.round(x));
  const E=x=>{ try{ return typeof esc==='function'?esc(x):String(x==null?'':x); }catch(e){ return String(x==null?'':x); } };
  const cl=(x,a,b)=>Math.max(a,Math.min(b,x));
  const RP=(r,u)=>window.reposUnidad176(r,u);
  const ING=(r,u)=>Math.round(Math.max(1,u.rev||RP(r,u)*((window.tipoDe176(r.clase,u.tipo)||{rc:.5}).rc)));
  const X=(t,o)=>window.evento176(t,o), G=(e,m)=>window.gastoRed176(e,m);
  const R=e=>window.redNegocio176(e);
  const TEL_DESDE=1865;

  const TEL={n:'Telecomunicaciones',sector:'tech',grupo:'Tecnología y medios',desde:TEL_DESDE,un:['red o servicio','redes y servicios'],emp:'Telecomunicaciones',
    d:'Telégrafo, teléfono, celular, internet y fibra óptica, según la época: una red que se tiende, se conecta y se cobra por uso o por suscripción. La inversión no termina nunca y los clientes se quejan de lo que no funciona. Con cuadrillas, centro de operaciones y torres propias las caídas bajan; sin ellas, la red se enreda al crecer.',
    cs:.1,el:.35,rs:.6,sp:.8,ts:.15,vol:.1,pand:[1.1,1.15,1.05],kv:8,
    aut:[[1865,'el Gobierno (Correos y Telégrafos)'],[1967,'el Ministerio de Comunicaciones'],[1994,'la Comisión de Regulación de Telecomunicaciones'],[2009,'el MinTIC y la Comisión de Regulación de Comunicaciones']],
    tit:[[1,'Operador local'],[3,'Operador regional'],[8,'Operador nacional'],[18,'Gigante de las telecomunicaciones']],
    tipos:[
      {id:'telegrafo',n:'Oficina y línea de telégrafo',desde:1865,hasta:1975,base:120,rc:1.3,mg:.14,u0:.7,capN:800,capU:'telegramas al día',obra:[0,1,1],princ:true,d:'Un alambre entre dos plazas y un telegrafista: lo único que viaja más rápido que un jinete.'},
      {id:'telefonia',n:'Central telefónica y red local',desde:1884,base:300,rc:1.2,mg:.16,u0:.68,capN:3000,capU:'líneas',obra:[0,1,2],princ:true,d:'Una central, postes, cables y abonados que pagan mensualidad.'},
      {id:'larga',n:'Larga distancia y enlaces',desde:1925,base:500,rc:1.1,mg:.2,u0:.65,capN:1500,capU:'circuitos',obra:[0,1,2],princ:true,vol:.14,d:'Conectar ciudades y países: cada circuito se cobra por minuto.'},
      {id:'cable',n:'Televisión por cable y satelital',desde:1992,base:800,rc:1.15,mg:.18,u0:.62,capN:80000,capU:'suscriptores',obra:[0,1,2],princ:true,vol:.16,d:'Paquetes de canales por suscripción, con la guerra de contenidos de por medio.'},
      {id:'celular',n:'Red celular (telefonía móvil)',desde:1994,base:2500,rc:1.1,mg:.22,u0:.66,capN:200000,capU:'suscriptores',obra:[1,2,2],princ:true,vol:.16,d:'Antenas, espectro y millones de minutos: el negocio de volumen del siglo.'},
      {id:'banda',n:'Internet y banda ancha',desde:1996,base:900,rc:1.2,mg:.2,u0:.64,capN:50000,capU:'suscriptores',obra:[0,1,2],princ:true,vol:.2,d:'Conexiones por línea y por cable: cada año piden más velocidad.'},
      {id:'fibra',n:'Fibra óptica al hogar',desde:2008,base:1500,rc:1.15,mg:.24,u0:.62,capN:100000,capU:'hogares',obra:[1,2,2],ciu:true,princ:true,vol:.2,d:'Tender fibra cuesta una fortuna y lo que se tiende no se va.'},
      {id:'cuadrillas',n:'Cuadrillas de instalación y mantenimiento',desde:1865,base:200,rol:'apoyo',cubre:6,bono:.02,falta:.03,d:'Quien instala, repara y cambia lo que se rompe. Atiende hasta 6 redes.'},
      {id:'central',n:'Centro de operaciones y conmutación',desde:1920,base:600,rol:'apoyo',cubre:8,bono:.025,falta:.03,d:'Vigila la red las veinticuatro horas y enruta el tráfico. Atiende hasta 8 redes.'},
      {id:'torres',n:'Torres y antenas propias',desde:1994,base:1200,rol:'apoyo',cubre:8,bono:.03,falta:0,d:'Dejar de pagar arriendo por cada torre baja los gastos de hasta 8 redes.'},
      {id:'submarino',n:'Cable submarino y enlaces internacionales',desde:2000,base:2000,rol:'apoyo',cubre:10,bono:.02,falta:.01,d:'Tráfico propio hacia el exterior sin pagarle peaje a nadie. Atiende hasta 10 redes.'}]};

  const EV=[
    /* la red se cae */
    (e,r,u)=>()=>{ const x=Math.round(RP(r,u)*.025);
      X('<b>Se cae la red de '+E(u.nom)+'.</b> '+(A()>=1994?'Miles de usuarios quedan sin servicio durante horas y las quejas llegan a la regulación.':'Las líneas quedan mudas un día entero y los clientes protestan en la puerta.'),
        [{t:'Compensar a los clientes ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep+4,5,99); return 'Compensaste a los clientes con '+fm(x)+': se lo reconocieron.'; }},
         {t:'Reparar sin compensar a nadie',f:()=>{ G(e,x*.25); u.rep=cl(u.rep-6,5,99); return 'Repararon rápido y no pagaste nada, pero la reputación sufrió.'; }}]); },
    /* cables y torres: robo, temporal o atentado */
    (e,r,u)=>A()>=1900?()=>{ const x=Math.round(RP(r,u)*.04), guerra=(S.tension||35)>=45&&A()>=1980;
      X('<b>'+(guerra?'Vuelan torres y cables de '+E(u.nom)+'.':A()<1960?'Un temporal derriba los postes y las líneas de '+E(u.nom)+'.':'Se roban los cables de cobre de '+E(u.nom)+'.')+'</b> '+(guerra?'La guerra llegó a la red: hay zonas sin comunicación.':'Reponer el material cuesta y la zona queda incomunicada.'),
        [{t:'Reconstruir de inmediato ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep+2,5,99); return 'Reconstruiste la red en pocos días: costó '+fm(x)+'.'; }},
         {t:guerra?'Pedirle protección a la fuerza pública':'Reponer poco a poco',f:()=>{ G(e,x*.5); u.rep=cl(u.rep-4,5,99); if(guerra) S.tension=cl((S.tension||35)+1,0,100); return guerra?'La fuerza pública cubrió las torres, pero la zona quedó con servicio a medias.':'Repusiste de a poco: la zona sufrió y costó menos.'; }}]); }:null,
    /* la regulación fija un tope */
    (e,r,u)=>A()>=1947?()=>{ const x=Math.round(ING(r,u)*.06), aut=(CL_aut()||'la autoridad');
      X('<b>'+E(aut.charAt(0).toUpperCase()+aut.slice(1))+' fija un tope a las tarifas de '+E(u.nom)+'.</b> Dice que el servicio es esencial y no puede cobrarse a cualquier precio.',
        [{t:'Acatar el tope',f:()=>{ G(e,x); return 'Acataste el tope: dejaste de ganar '+fm(x)+' este año.'; }},
         {t:'Demandarlo ('+fm(x*.4)+')',f:()=>{ G(e,x*.4); if(chance(.5)){ return 'Ganaste la demanda: el tope se anuló.'; } G(e,x); u.rep=cl(u.rep-2,5,99); return 'Perdiste la demanda: pagaste el abogado y acataste el tope.'; }}]); }:null,
    /* el espectro: la licitación celular (1994), 4G (2013) y 5G (2023) */
    (e,r,u)=>(u.tipo==='celular'&&((A()>=1994&&A()<=1996)||(A()>=2011&&A()<=2013)||(A()>=2022&&A()<=2024)))?()=>{ const gen=A()<=1996?'la telefonía celular':A()<=2013?'el 4G':'el 5G', x=Math.round(RP(r,u)*.12);
      X('<b>El Gobierno licita el espectro de '+gen+'.</b> Quien no tenga una porción no podrá ofrecer el servicio en '+E(u.ciudad)+'.',
        [{t:'Pujar fuerte ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep+5,5,99); u.cons=cl(u.cons+8,5,99); return 'Ganaste el espectro por '+fm(x)+': tu red se prepara para '+gen+'.'; }},
         {t:'Pujar con prudencia ('+fm(x*.5)+')',f:()=>{ G(e,x*.5); if(chance(.5)){ u.rep=cl(u.rep+3,5,99); return 'Ganaste una porción pequeña por '+fm(x*.5)+'.'; } u.cons=cl(u.cons-6,5,99); return 'Perdiste la puja: tus clientes se van con quien sí tiene el espectro.'; }},
         {t:'No participar',f:()=>{ u.cons=cl(u.cons-9,5,99); u.rep=cl(u.rep-2,5,99); return 'No participaste: te quedaste con la tecnología de antes.'; }}]); }:null,
    /* guerra de precios */
    (e,r,u)=>(['celular','banda','cable','larga'].includes(u.tipo)&&A()>=1992)?()=>{ const x=Math.round(ING(r,u)*.06);
      X('<b>Estalla una guerra de precios por '+E(u.nom)+'.</b> Los competidores regalan minutos y megas para quitarte clientes.',
        [{t:'Igualar los precios ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep+1,5,99); return 'Igualaste los precios: perdiste '+fm(x)+' de margen pero conservaste a tus clientes.'; }},
         {t:'Competir con servicio ('+fm(x*.5)+')',f:()=>{ G(e,x*.5); if(chance(.55)){ u.rep=cl(u.rep+5,5,99); return 'El servicio ganó: tus clientes se quedaron.'; } u.cons=cl(u.cons-5,5,99); return 'Perdiste clientes con el servicio caro: no alcanzó.'; }}]); }:null,
    /* fraude y ciberataques */
    (e,r,u)=>(u.tipo==='celular'&&A()>=1995&&A()<=2008)?()=>{ const x=Math.round(ING(r,u)*.05);
      X('<b>Clonan celulares de '+E(u.nom)+'.</b> Llegan facturas de llamadas que nadie hizo y los clientes pelean la cuenta.',
        [{t:'Asumir el fraude y blindar la red ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep+3,5,99); return 'Asumiste el fraude y blindaste la red: costó '+fm(x)+'.'; }},
         {t:'Cobrarles a los clientes',f:()=>{ u.rep=cl(u.rep-8,5,99); return 'Les cobraste a los clientes lo que no hablaron: la reputación se fue al suelo.'; }}]); }:(A()>=2010&&['banda','fibra','celular'].includes(u.tipo))?()=>{ const x=Math.round(ING(r,u)*.06);
      X('<b>Un ciberataque tumba los sistemas de '+E(u.nom)+'.</b> Piden un rescate para devolver los datos de los clientes.',
        [{t:'Pagar el rescate ('+fm(x)+')',f:()=>{ G(e,x); u.rep=cl(u.rep-2,5,99); return 'Pagaste '+fm(x)+': los datos volvieron, la fama de segura no.'; }},
         {t:'No pagar y reconstruir ('+fm(x*.6)+')',f:()=>{ G(e,x*.6); u.rep=cl(u.rep-5,5,99); return 'Reconstruiste los sistemas sin pagar: costó '+fm(x*.6)+' y tardó semanas.'; }}]); }:null,
    /* migrar a la siguiente tecnología */
    (e,r,u)=>(u.tipo==='celular'&&A()>=2010)||(u.tipo==='telefonia'&&A()>=1990&&A()<=2008)?()=>{ const x=Math.round(RP(r,u)*.08), cel=u.tipo==='celular';
      X('<b>Los clientes de '+E(u.nom)+' piden '+(cel?'más velocidad: ya no les alcanza la red que tienes.':'líneas modernas: les resulta lenta y anticuada.')+'</b> Cada año que pasa pierdes frente a quien actualizó.',
        [{t:'Invertir en la nueva tecnología ('+fm(x)+')',f:()=>{ G(e,x); u.cons=cl(u.cons+8,5,99); u.rep=cl(u.rep+3,5,99); return 'Actualizaste la red por '+fm(x)+': los clientes lo notaron.'; }},
         {t:'Esperar un año más',f:()=>{ u.cons=cl(u.cons-6,5,99); return 'Esperaste: ahorraste plata y perdiste clientes.'; }}]); }:null,
    /* la empresa estatal Telecom compite */
    (e,r,u)=>(['telefonia','larga'].includes(u.tipo)&&A()>=1947&&A()<=2003)?()=>{ const x=Math.round(ING(r,u)*.05);
      X('<b>Telecom, la empresa del Estado, baja las tarifas en '+E(u.ciudad)+'.</b> Con el subsidio del presupuesto puede cobrar menos que tú.',
        [{t:'Bajar tus tarifas ('+fm(x)+')',f:()=>{ G(e,x); return 'Bajaste las tarifas: perdiste '+fm(x)+' de margen.'; }},
         {t:'Quejarte ante la regulación',f:()=>{ if(chance(.4)){ u.rep=cl(u.rep+3,5,99); return 'La regulación te dio la razón y Telecom subió sus tarifas.'; } u.cons=cl(u.cons-5,5,99); return 'No te hicieron caso: perdiste clientes.'; }}]); }:null,
    /* el declive del telégrafo */
    (e,r,u)=>(u.tipo==='telegrafo'&&A()>=1935)?()=>{ const x=Math.round(RP(r,u)*.05);
      X('<b>El telégrafo pierde clientes frente al teléfono y la radio.</b> La oficina de '+E(u.ciudad)+' recibe cada año menos telegramas.',
        [{t:'Reconvertir la oficina ('+fm(x)+')',f:()=>{ G(e,x); u.cons=cl(u.cons+4,5,99); return 'Reconvertiste la oficina a giros y correo: se sostiene.'; }},
         {t:'Dejarla morir',f:()=>{ u.cons=cl(u.cons-7,5,99); u.rep=cl(u.rep-2,5,99); return 'La dejaste como estaba: cada año valdrá menos.'; }}]); }:null];
  function CL_aut(){ const a=A(); let n=null; TEL.aut.forEach(x=>{ if(a>=x[0]) n=x[1]; }); return n; }

  /* ---------- instalación en la puerta ---------- */
  function instalarClase(){ const CLs=window.CLASES_176, OR=window.ORDEN_176, GR=window.GRUPOS_PUERTA_176, EVc=window.EVC_176; if(!CLs||!OR) return false;
    if(!CLs.telecom) CLs.telecom=TEL; if(!OR.includes('telecom')) OR.push('telecom');
    if(Array.isArray(GR)){ const g=GR.find(x=>x.n==='Tecnología y medios'); if(g){ if(!g.ids.includes('telecom')) g.ids.push('telecom'); if(!g.__v219){ g.__v219=true; const base=g.d; try{ Object.defineProperty(g,'d',{configurable:true,enumerable:true,get(){ return A()>=TEL_DESDE?base.replace(' y televisión.',', televisión y telecomunicaciones.'):base; }}); }catch(e){} } } }
    if(EVc&&!EVc.telecom) EVc.telecom=EV; return true; }
  function init219(){ try{ instalarClase(); }catch(e){ console.error(e); }
    Object.assign(window,{CLASE_TELECOM_219:TEL,EVENTOS_TELECOM_219:EV,autoridadTelecom219:CL_aut}); }
  init219(); setTimeout(init219,40); setTimeout(init219,220); setTimeout(init219,650); setTimeout(init219,950); setTimeout(init219,1500);
  window.__SA219={version:V219};
})();
