/* Sustituye en el navegador a window.claude de claude.ai: expone use('db' | 'user' | 'downloads' | 'sample').
 * Lo inyecta el servidor local antes de la aplicación; no forma parte del HTML que se publica. */
(function () {
  const app = new URL(document.currentScript.src).searchParams.get('app');
  const base = '/api/' + encodeURIComponent(app);
  const json = async (url, opciones) => {
    const r = await fetch(url, opciones);
    if (!r.ok) { const e = new Error('Error ' + r.status); e.code = 'error'; throw e; }
    return r.json();
  };
  const enviar = (metodo, cuerpo) => ({ method: metodo, headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo === undefined ? {} : cuerpo) });

  /* cambios en vivo: el servidor avisa por SSE y cada suscripción vuelve a leer su colección */
  const oyentes = {};
  const flujo = new EventSource(base + '/events');
  flujo.onmessage = (ev) => { try { (oyentes[JSON.parse(ev.data).coll] || []).forEach((f) => f()); } catch (e) { /* se ignora */ } };

  const db = {
    collection(nombre) {
      return {
        onSnapshot(cb, errCb) {
          const cargar = async () => {
            try {
              const r = await json(`${base}/db/${nombre}`);
              cb({ docs: r.docs.map((d) => ({ id: d.id, data: () => d.data })), size: r.docs.length });
            } catch (e) { if (errCb) errCb(e); }
          };
          (oyentes[nombre] = oyentes[nombre] || []).push(cargar);
          cargar();
          return () => { oyentes[nombre] = (oyentes[nombre] || []).filter((f) => f !== cargar); };
        },
      };
    },
    doc(ruta) {
      const [coleccion, id] = ruta.split('/');
      const url = `${base}/db/${coleccion}/${encodeURIComponent(id)}`;
      return {
        async get() {
          const r = await fetch(url);
          if (r.status === 404) return { exists: false, id, data: () => undefined };
          const d = await r.json();
          return { exists: true, id, data: () => d.data };
        },
        async set(datos) { await json(url, enviar('PUT', datos)); },
        async update(datos) { await json(url, enviar('PATCH', datos)); },
        async delete() { await json(url, { method: 'DELETE' }); },
        async acquire(o) { return json(url + '/acquire', enviar('POST', o)); },
      };
    },
  };

  const listo = Promise.all([json('/api/usuario'), json('/api/capacidades')]);
  const usuarioDe = (info) => ({
    id: async () => info.id,
    me: async () => ({ name: info.nombre }),
    can: async () => true,
    profiles: async (ids) => Object.fromEntries(ids.map((i) => [i, { name: i === info.id ? info.nombre : 'Capturista' }])),
  });
  const descargas = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return { status: 'saved' };
    },
  };
  const interpretar = async (prompt, modo) => {
    const r = await fetch('/api/sample', enviar('POST', { prompt, modo }));
    const j = await r.json();
    if (j.codigo) { const e = new Error(j.mensaje || j.codigo); e.code = j.codigo; throw e; }
    return j.resultado;
  };
  const muestra = async (prompt) => interpretar(prompt, 'text');
  muestra.json = (prompt) => interpretar(prompt, 'json');

  listo.then(([, caps]) => { window.claude.iaLocal = caps.proveedor === 'local'; }, () => {});
  window.claude = {
    local: true,
    iaLocal: false,
    use: async (nombre) => {
      const [info, caps] = await listo;
      if (nombre === 'db') return db;
      if (nombre === 'user') return usuarioDe(info);
      if (nombre === 'downloads') return descargas;
      if (nombre === 'sample') return caps.sample ? muestra : null;
      return null;
    },
  };
})();
