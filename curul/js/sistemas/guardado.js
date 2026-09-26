/* Guardado: múltiples ranuras, autoguardado, exportación e importación.
   Las partidas se guardan en IndexedDB (sin el límite de ~5 MB de localStorage);
   si IndexedDB no está disponible se usa localStorage. El índice de partidas vive en localStorage. */
window.CURUL = window.CURUL || {};
(function (C) {
  const IDX = 'curul:indice', PREF = 'curul:partida:', DB = 'curul', STORE = 'partidas';
  const leerIndice = () => { try { return JSON.parse(localStorage.getItem(IDX)) || []; } catch (e) { return []; } };
  const escribirIndice = arr => { try { localStorage.setItem(IDX, JSON.stringify(arr)); } catch (e) { console.warn(e); } };

  let dbProm = null;
  const abrir = () => {
    if (dbProm) return dbProm;
    dbProm = new Promise((res, rej) => {
      if (typeof indexedDB === 'undefined') return rej(new Error('sin IndexedDB'));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbProm;
  };
  const idb = (modo, fn) => abrir().then(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, modo), st = tx.objectStore(STORE);
    const req = fn(st);
    tx.oncomplete = () => res(req && req.result);
    tx.onerror = () => rej(tx.error);
  }));
  const escribir = (id, txt) => idb('readwrite', st => st.put(txt, id)).catch(() => { localStorage.setItem(PREF + id, txt); });
  const leer = id => idb('readonly', st => st.get(id)).then(v => v || localStorage.getItem(PREF + id)).catch(() => localStorage.getItem(PREF + id));
  const quitar = id => idb('readwrite', st => st.delete(id)).catch(() => {}).then(() => { try { localStorage.removeItem(PREF + id); } catch (e) {} });

  const G = {
    listar: () => leerIndice().sort((a, b) => b.guardado - a.guardado),
    resumen(E, id, nombre) {
      return { id, nombre: nombre || E.meta.nombrePartida, jugador: E.jugador.nombre, cargo: C.DATA.cargos[E.jugador.cargo].nombre,
               fecha: C.U.fmtT(E.fecha.t), guardado: Date.now(), version: E.meta.version, auto: !!E.meta.autoSlot };
    },
    /* Devuelve una promesa {ok, msg, id} */
    guardar(id, nombre) {
      const E = C.E; if (!E) return Promise.resolve({ ok: false, msg: 'No hay partida' });
      id = id || E.meta.slot || ('p' + Date.now().toString(36));
      E.meta.slot = id;
      const txt = JSON.stringify(E);
      const previo = leerIndice().find(x => x.id === id);
      return escribir(id, txt).then(() => {
        const idx = leerIndice().filter(x => x.id !== id);
        idx.push(G.resumen(E, id, nombre || (previo && previo.nombre))); escribirIndice(idx);
        C.Bus.emit('guardado', id);
        return { ok: true, msg: 'Partida guardada', id };
      }).catch(e => ({ ok: false, msg: 'No se pudo guardar: ' + e.message + '. Exporta la partida a un archivo.' }));
    },
    cargar(id) {
      return leer(id).then(txt => txt ? G.desdeTexto(txt, id) : { ok: false, msg: 'Partida no encontrada' });
    },
    desdeTexto(txt, id) {
      let E;
      try { E = JSON.parse(txt); C.Estado.migrar(E); } catch (e) { return { ok: false, msg: 'Archivo de partida inválido: ' + e.message }; }
      if (id) E.meta.slot = id;
      C.E = E;
      C.Bus.emit('partida:cargada', E);
      return { ok: true, msg: 'Partida cargada' };
    },
    borrar(id) {
      escribirIndice(leerIndice().filter(x => x.id !== id));
      return quitar(id);
    },
    exportar() {
      const E = C.E;
      const blob = new Blob([JSON.stringify(E)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'curul-' + E.jugador.nombre.replace(/\s+/g, '_') + '-' + C.U.fechaDe(E.fecha.t).toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    importar(file) {
      return file.text().then(txt => {
        const r = G.desdeTexto(txt, null);
        if (!r.ok) return r;
        C.E.meta.slot = null;
        return G.guardar(null, C.E.meta.nombrePartida + ' (importada)').then(() => r);
      });
    },
    turno(E) {
      if (E.meta.presim || typeof document === 'undefined') return;
      if (E.fecha.t % 4 === 0) G.guardar(E.meta.slot || null);
    }
  };
  C.Guardado = G;
  C.Tiempo.registrar('guardado', G, 99);
})(window.CURUL);
