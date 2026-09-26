/* Bus de eventos: los sistemas publican, la interfaz escucha. */
window.CURUL = window.CURUL || {};
(function (C) {
  const oyentes = {};
  C.Bus = {
    on(ev, fn) { (oyentes[ev] = oyentes[ev] || []).push(fn); return () => C.Bus.off(ev, fn); },
    off(ev, fn) { oyentes[ev] = (oyentes[ev] || []).filter(f => f !== fn); },
    emit(ev, datos) {
      (oyentes[ev] || []).forEach(f => { try { f(datos); } catch (e) { console.error('[Bus]', ev, e); } });
      (oyentes['*'] || []).forEach(f => { try { f(ev, datos); } catch (e) { console.error(e); } });
    }
  };
})(window.CURUL);
