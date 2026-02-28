// admin.js - Panel de administración

document.addEventListener("DOMContentLoaded", () => {
  cargarConfig();
  renderEstadisticas();
  renderTablaLibros();
  renderTablaUsuarios();
  renderTablaPrestamos();

  document.getElementById("btnGuardarConfig").addEventListener("click", guardarConfig);
  document.getElementById("btnAddLibro").addEventListener("click", agregarLibro);
  document.getElementById("btnAddUsuario").addEventListener("click", agregarUsuario);
});


// ─── Configuración ────────────────────────────────────────────────────────────

function cargarConfig() {
  const cfg = getConfig();
  document.getElementById("cfgMaxLibros").value = cfg.maxLibros;
  document.getElementById("cfgMaxDias").value = cfg.maxDias;
}

function guardarConfig() {
  const maxLibros = parseInt(document.getElementById("cfgMaxLibros").value);
  const maxDias   = parseInt(document.getElementById("cfgMaxDias").value);

  if (isNaN(maxLibros) || isNaN(maxDias) || maxLibros < 1 || maxDias < 1) {
    alert("Los valores de configuración no son válidos.");
    return;
  }

  setConfig({ maxLibros, maxDias });
  alert("Configuración guardada.");
}


// ─── Libros ───────────────────────────────────────────────────────────────────

function agregarLibro() {
  const titulo = document.getElementById("nuevoTitulo").value.trim();
  const autor  = document.getElementById("nuevoAutor").value.trim();
  const genero = document.getElementById("nuevoGenero").value.trim();

  if (!titulo || !autor) {
    alert("El título y el autor son obligatorios.");
    return;
  }

  const libros = getLibros();
  libros.push({ id: nextId(libros), titulo, autor, genero, disponible: true });
  setLibros(libros);

  document.getElementById("nuevoTitulo").value = "";
  document.getElementById("nuevoAutor").value  = "";
  document.getElementById("nuevoGenero").value = "";

  renderTablaLibros();
  renderEstadisticas();
}

window.eliminarLibro = function(id) {
  if (!confirm("¿Seguro que quieres eliminar este libro?")) return;
  setLibros(getLibros().filter(l => l.id !== id));
  renderTablaLibros();
  renderEstadisticas();
};

function renderTablaLibros() {
  const libros = getLibros();

  document.getElementById("tablaLibros").innerHTML = `
    <table class="tabla">
      <thead>
        <tr>
          <th>ID</th><th>Título</th><th>Autor</th><th>Género</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${libros.map(l => `
          <tr>
            <td>${l.id}</td>
            <td>${l.titulo}</td>
            <td>${l.autor}</td>
            <td>${l.genero || "—"}</td>
            <td>
              <span class="badge ${l.disponible ? "badge-ok" : "badge-off"}">
                ${l.disponible ? "Disponible" : "Prestado"}
              </span>
            </td>
            <td>
              <button class="btn btn-danger btn-xs" onclick="eliminarLibro(${l.id})">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}


// ─── Usuarios ─────────────────────────────────────────────────────────────────

function agregarUsuario() {
  const nombre   = document.getElementById("nuevoUsuario").value.trim();
  const password = document.getElementById("nuevoPassword").value.trim();
  const rol      = document.getElementById("nuevoRol").value;

  if (!nombre || !password) {
    alert("El nombre y la contraseña son obligatorios.");
    return;
  }

  const usuarios = getUsuarios();

  if (usuarios.find(u => u.nombre === nombre)) {
    alert("Ya existe un usuario con ese nombre.");
    return;
  }

  usuarios.push({
    id: nextId(usuarios),
    nombre,
    password,
    rol,
    penalizado: false,
    fechaFinPenalizacion: null
  });
  setUsuarios(usuarios);

  document.getElementById("nuevoUsuario").value  = "";
  document.getElementById("nuevoPassword").value = "";

  renderTablaUsuarios();
  renderEstadisticas();
}

window.eliminarUsuario = function(id) {
  if (id === getSesion().id) {
    alert("No puedes eliminar tu propia cuenta.");
    return;
  }
  if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;
  setUsuarios(getUsuarios().filter(u => u.id !== id));
  renderTablaUsuarios();
  renderEstadisticas();
};

window.ponerPenalizacion = function(id) {
  const usuarios = getUsuarios();
  const usuario  = usuarios.find(u => u.id === id);
  if (!usuario) return;

  const hasta = new Date();
  hasta.setDate(hasta.getDate() + getConfig().maxDias);

  usuario.penalizado            = true;
  usuario.fechaFinPenalizacion  = hasta.toISOString();

  setUsuarios(usuarios);
  renderTablaUsuarios();
};

window.quitarPenalizacion = function(id) {
  const usuarios = getUsuarios();
  const usuario  = usuarios.find(u => u.id === id);
  if (!usuario) return;

  usuario.penalizado            = false;
  usuario.fechaFinPenalizacion  = null;

  setUsuarios(usuarios);
  renderTablaUsuarios();
};

function renderTablaUsuarios() {
  const usuarios = getUsuarios();

  document.getElementById("tablaUsuarios").innerHTML = `
    <table class="tabla">
      <thead>
        <tr>
          <th>ID</th><th>Nombre</th><th>Rol</th><th>Penalizado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${usuarios.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>
              <span class="badge ${u.rol === "admin" ? "badge-admin" : "badge-user"}">${u.rol}</span>
            </td>
            <td>
              ${u.penalizado
                ? `<span class="badge badge-error">Sí</span>`
                : `<span class="badge badge-ok">No</span>`
              }
            </td>
            <td>
              ${u.penalizado
                ? `<button class="btn btn-sm btn-primary" onclick="quitarPenalizacion(${u.id})">Quitar penal.</button>`
                : `<button class="btn btn-sm btn-warn"    onclick="ponerPenalizacion(${u.id})">Penalizar</button>`
              }
              <button class="btn btn-danger btn-xs" onclick="eliminarUsuario(${u.id})">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}


// ─── Préstamos ────────────────────────────────────────────────────────────────

function renderTablaPrestamos() {
  const prestamos = getPrestamos();
  const div       = document.getElementById("tablaPrestamos");

  if (prestamos.length === 0) {
    div.innerHTML = `<p class="empty-msg">No hay préstamos registrados.</p>`;
    return;
  }

  div.innerHTML = `
    <table class="tabla">
      <thead>
        <tr>
          <th>ID</th><th>Usuario</th><th>Libro</th><th>F. Préstamo</th><th>F. Devolución</th><th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${prestamos.map(p => {
          const usuario  = getUsuarioById(p.idUsuario);
          const nombreU  = usuario ? usuario.nombre : `#${p.idUsuario}`;
          const vencido  = isVencido(p);

          return `
            <tr>
              <td>${p.id}</td>
              <td>${nombreU}</td>
              <td>${p.tituloLibro}</td>
              <td>${new Date(p.fechaPrestamo).toLocaleDateString("es-ES")}</td>
              <td>${new Date(p.fechaDevolucion).toLocaleDateString("es-ES")}</td>
              <td>
                ${p.devuelto
                  ? `<span class="badge badge-ok">Devuelto</span>`
                  : vencido
                    ? `<span class="badge badge-error">Vencido</span>`
                    : `<span class="badge badge-warn">Activo</span>`
                }
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}


// ─── Estadísticas ─────────────────────────────────────────────────────────────

function renderEstadisticas() {
  const libros    = getLibros();
  const usuarios  = getUsuarios();
  const prestamos = getPrestamos();

  const libroMasPrestado  = calcularMasPrestado(prestamos);
  const usuarioMasRetraso = calcularMasRetrasos(prestamos);
  const tiempoMedio       = calcularTiempoMedio(prestamos);

  document.getElementById("estadisticas").innerHTML = `
    <div class="stat-card"><span class="stat-num">${libros.length}</span><span>Libros totales</span></div>
    <div class="stat-card"><span class="stat-num">${usuarios.length}</span><span>Usuarios</span></div>
    <div class="stat-card"><span class="stat-num">${prestamos.filter(p => !p.devuelto).length}</span><span>Préstamos activos</span></div>
    <div class="stat-card"><span class="stat-num">${prestamos.length}</span><span>Préstamos histórico</span></div>
    <div class="stat-card"><span class="stat-num">${libroMasPrestado}</span><span>Libro más prestado</span></div>
    <div class="stat-card"><span class="stat-num">${usuarioMasRetraso}</span><span>Más retrasos</span></div>
    <div class="stat-card"><span class="stat-num">${tiempoMedio} días</span><span>Tiempo medio devolución</span></div>
    <div class="stat-card"><span class="stat-num">${usuarios.filter(u => u.penalizado).length}</span><span>Penalizados ahora</span></div>
  `;
}

function calcularMasPrestado(prestamos) {
  const conteo = {};
  prestamos.forEach(p => {
    conteo[p.tituloLibro] = (conteo[p.tituloLibro] || 0) + 1;
  });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "—";
}

function calcularMasRetrasos(prestamos) {
  const retrasos = {};
  prestamos
    .filter(p => p.penalizacionAplicada)
    .forEach(p => {
      const u      = getUsuarioById(p.idUsuario);
      const nombre = u ? u.nombre : `#${p.idUsuario}`;
      retrasos[nombre] = (retrasos[nombre] || 0) + 1;
    });
  const top = Object.entries(retrasos).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "—";
}

function calcularTiempoMedio(prestamos) {
  const devueltos = prestamos.filter(p => p.devuelto && p.fechaDevolucionReal);
  if (devueltos.length === 0) return 0;

  const totalDias = devueltos.reduce((acc, p) => {
    const dias = (new Date(p.fechaDevolucionReal) - new Date(p.fechaPrestamo)) / (1000 * 60 * 60 * 24);
    return acc + dias;
  }, 0);

  return (totalDias / devueltos.length).toFixed(1);
}