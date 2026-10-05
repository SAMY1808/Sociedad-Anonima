/* Utilidades generales: RNG con semilla, matemáticas, formato, fechas. */
window.ESP = window.ESP || {};
(function (C) {
  const U = {};

  /* ── RNG reproducible (mulberry32). El estado vive en ESP.E.meta.rng para que se guarde. ── */
  let rngLocal = 123456789;
  U.sembrar = s => { rngLocal = s >>> 0; if (C.E) C.E.meta.rng = rngLocal; };
  U.r = () => {
    let t = (C.E ? C.E.meta.rng : rngLocal);
    t = (t + 0x6D2B79F5) >>> 0;
    if (C.E) C.E.meta.rng = t; else rngLocal = t;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  U.ri = (a, b) => Math.floor(a + U.r() * (b - a + 1));
  U.rf = (a, b) => a + U.r() * (b - a);
  U.chance = p => U.r() < p;
  U.pick = arr => arr[Math.floor(U.r() * arr.length)];
  U.gauss = (m = 0, s = 1) => { let u = 0, v = 0; while (!u) u = U.r(); while (!v) v = U.r(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  U.pesado = (items, fPeso) => {
    let tot = 0; const w = items.map(i => { const p = Math.max(0, fPeso(i)); tot += p; return p; });
    if (tot <= 0) return null;
    let x = U.r() * tot;
    for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; }
    return items[items.length - 1];
  };
  U.barajar = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(U.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ── Matemáticas ── */
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.sig = x => 1 / (1 + Math.exp(-x));
  U.suma = arr => arr.reduce((s, x) => s + x, 0);
  U.prom = arr => arr.length ? U.suma(arr) / arr.length : 0;
  U.agrupar = (arr, f) => arr.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
  U.contar = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
  /* Distancia ideológica normalizada 0..1 entre dos posiciones {eco,soc} */
  U.distIdeo = (a, b) => {
    let d2 = Math.pow((a.eco - b.eco) * 1.0, 2) + Math.pow((a.soc - b.soc) * 0.8, 2) + Math.pow(((a.eu || 0) - (b.eu || 0)) * 0.6, 2), den = 230;
    if (a.ter != null && b.ter != null) { d2 += Math.pow((a.ter - b.ter) * 0.75, 2); den = 250; }   // eje territorial (sólo España)
    return Math.min(1, Math.sqrt(d2) / den);
  };

  /* ── Identificadores ── */
  U.id = pref => { const E = C.E; E.meta.sigId = (E.meta.sigId || 0) + 1; return pref + E.meta.sigId.toString(36); };

  /* ── Formato ── */
  const nf = new Intl.NumberFormat('es-ES');
  U.n = x => nf.format(Math.round(x));
  U.d1 = x => (Math.round(x * 10) / 10).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  U.d2 = x => (Math.round(x * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  U.pct = (x, d = 1) => (d ? U.d1(x) : U.n(x)) + ' %';
  U.signo = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '−' : '±') + (d ? U.d1(Math.abs(x)) : U.n(Math.abs(x)));
  U.eur = mm => {                     // cantidades en miles de millones de euros
    const a = Math.abs(mm), s = mm < 0 ? '−' : '';
    if (a >= 1000) return s + U.d1(a / 1000) + ' billones €';
    return s + U.d1(a) + ' mm €';
  };
  U.mill = m => m >= 1 ? U.d1(m) + ' M' : U.n(m * 1000) + ' mil';
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.plural = (n, s, p) => n === 1 ? s : (p || s + 's');
  U.iniciales = nombre => nombre.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();

  /* ── Fechas: 1 turno = 1 semana desde la fecha de inicio ── */
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  U.MESES = MESES;
  U.fechaDe = t => { const d = new Date(C.E.meta.inicio); d.setUTCDate(d.getUTCDate() + 7 * t); return d; };
  U.hoy = () => U.fechaDe(C.E.fecha.t);
  U.fmtFecha = (d, corta) => corta ? d.getUTCDate() + ' ' + MESES[d.getUTCMonth()].slice(0, 3) + ' ' + d.getUTCFullYear()
                                   : d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()] + ' de ' + d.getUTCFullYear();
  U.fmtT = (t, corta = true) => U.fmtFecha(U.fechaDe(t), corta);
  U.anio = () => U.hoy().getUTCFullYear();
  /* n-ésimo domingo de un mes (UTC) */
  U.domingo = (anio, mes, n) => { const d = new Date(Date.UTC(anio, mes, 1)); while (d.getUTCDay() !== 0) d.setUTCDate(d.getUTCDate() + 1); d.setUTCDate(d.getUTCDate() + 7 * (n - 1)); return d; };
  /* Turno en el que cae una fecha */
  U.turnoDe = fecha => Math.floor((fecha - new Date(C.E.meta.inicio)) / (7 * 864e5));
  U.edadEn = (nacAnio) => U.anio() - nacAnio;

  /* ── Series temporales para gráficos ── */
  U.serie = (clave, valor, max = 520) => {
    const S = C.E.series; (S[clave] = S[clave] || []).push([C.E.fecha.t, Math.round(valor * 100) / 100]);
    if (S[clave].length > max) S[clave].shift();
  };

  C.U = U;
})(window.ESP);
