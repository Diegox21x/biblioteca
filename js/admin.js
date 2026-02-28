// admin.js - Panel de administración

document.addEventListener("DOMContentLoaded", () => {
  // cuando carga la pagina cargo todo
  cargarConfig();
  renderEstadisticas();
  renderTablaLibros();
  renderTablaUsuarios();
  renderTablaPrestamos();

  // boton para guardar la configuracion del sistema
  document.getElementById("btnGuardarConfig").addEventListener("click", () => {
    const maxLibros = parseInt(document.getElementById("cfgMaxLibros").value);
    const maxDias = parseInt(document.getElementById("cfgMaxDias").value);

    // compruebo que los valores sean correctos antes de guardar
    if (isNaN(maxLibros) || isNaN(maxDias) || maxLibros < 1 || maxDias < 1) {
      alert("Valores de configuración inválidos.");
      return;
    }
    setConfig({ maxLibros, maxDias });
    alert("✅ Configuración guardada.");
  });

  // boton añadir libro nuevo
  document.getElementById("btnAddLibro").addEventListener("click", () => {
    const titulo = document.getElementById("nuevoTitulo").value.trim();
    const autor = document.getElementById("nuevoAutor").value.trim();
    const genero = document.getElementById("nuevoGenero").value.trim();

    // titulo y autor son obligatorios
    if (!titulo || !autor) return alert("Título y autor obligatorios.");

    // añado el libro al array y lo guardo
    const libros = getLibros();
    libros.push({ id: nextId(libros), titulo, autor, genero, disponible: true });
    setLibros(libros);

    // limpio los inputs
    document.getElementById("nuevoTitulo").value = "";
    document.getElementById("nuevoAutor").value = "";
    document.getElementById("nuevoGenero").value = "";

    renderTablaLibros();
    renderEstadisticas();
  });

  // boton añadir usuario nuevo
  document.getElementById("btnAddUsuario").addEventListener("click", () => {
    const nombre = document.getElementById("nuevoUsuario").value.trim();
    const password = document.getElementById("nuevoPassword").value.trim();
    const rol = document.getElementById("nuevoRol").value;

    if (!nombre || !password) return alert("Nombre y contraseña obligatorios.");

    const usuarios = getUsuarios();

    // no puede haber dos usuarios con el mismo nombre
    if (usuarios.find(u => u.nombre === nombre)) return alert("Ya existe un usuario con ese nombre.");

    usuarios.push({ id: nextId(usuarios), nombre, password, rol, penalizado: false, fechaFinPenalizacion: null });
    setUsuarios(usuarios);

    document.getElementById("nuevoUsuario").value = "";
    document.getElementById("nuevoPassword").value = "";

    renderTablaUsuarios();
    renderEstadisticas();
  });
});

// cargo los valores de configuracion en los inputs
function cargarConfig() {
  const cfg = getConfig();
  document.getElementById("cfgMaxLibros").value = cfg.maxLibros;
  document.getElementById("cfgMaxDias").value = cfg.maxDias;
}

// calculo y muestro las estadisticas del sistema
function renderEstadisticas() {
  const libros = getLibros();
  const usuarios = getUsuarios();
  const prestamos = getPrestamos();

  // cuento cuantas veces se ha prestado cada libro
  const conteo = {};
  prestamos.forEach(p => {
    conteo[p.tituloLibro] = (conteo[p.tituloLibro] || 0) + 1;
  });
  // el primero del array ordenado es el mas prestado
  const masP = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  // cuento retrasos por usuario (los que tienen penalizacionAplicada)
  const retrasos = {};
  prestamos.filter(p => p.penalizacionAplicada).forEach(p => {
    const u = getUsuarioById(p.idUsuario);
    const nombre = u ? u.nombre : `#${p.idUsuario}`;
    retrasos[nombre] = (retrasos[nombre] || 0) + 1;
  });
  const masRetraso = Object.entries(retrasos).sort((a, b) => b[1] - a[1])[0];

  // tiempo medio de devolucion en dias
  const devueltos = prestamos.filter(p => p.devuelto && p.fechaDevolucionReal);
  let tiempoMedio = 0;
  if (devueltos.length > 0) {
    const total = devueltos.reduce((acc, p) => {
      // diferencia entre fecha real de devolucion y fecha de prestamo
      const dias = (new Date(p.fechaDevolucionReal) - new Date(p.fechaPrestamo)) / (1000 * 60 * 60 * 24);
      return acc + dias;
    }, 0);
    tiempoMedio = (total / devueltos.length).toFixed(1);
  }

  // pinto las tarjetas de estadisticas
  document.getElementById("estadisticas").innerHTML = `
    <div class="stat-card"><span class="stat-num">${libros.length}</span><span>Libros totales</span></div>
    <div class="stat-card"><span class="stat-num">${usuarios.length}</span><span>Usuarios</span></div>
    <div class="stat-card"><span class="stat-num">${prestamos.filter(p => !p.devuelto).length}</span><span>Préstamos activos</span></div>
    <div class="stat-card"><span class="stat-num">${prestamos.length}</span><span>Préstamos histórico</span></div>
    <div class="stat-card"><span class="stat-num">${masP ? masP[0] : "—"}</span><span>Libro más prestado</span></div>
    <div class="stat-card"><span class="stat-num">${masRetraso ? masRetraso[0] : "—"}</span><span>Más retrasos</span></div>
    <div class="stat-card"><span class="stat-num">${tiempoMedio} días</span><span>Tiempo medio devolución</span></div>
    <div class="stat-card"><span class="stat-num">${usuarios.filter(u => u.penalizado).length}</span><span>Penalizados ahora</span></div>
  `;
}

// tabla con todos los libros y boton para eliminar
function renderTablaLibros() {
  const libros = getLibros();
  const div = document.getElementById("tablaLibros");

  div.innerHTML = `
    <table class="tabla">
      <thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Género</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${libros.map(l => `
          <tr>
            <td>${l.id}</td>
            <td>${l.titulo}</td>
            <td>${l.autor}</td>
            <td>${l.genero || "—"}</td>
            <td><span class="badge ${l.disponible ? "badge-ok" : "badge-off"}">${l.disponible ? "Disponible" : "Prestado"}</span></td>
            <td>
              <button class="btn btn-danger btn-xs" onclick="eliminarLibro(${l.id})">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// tabla de usuarios con opciones de penalizar y eliminar
function renderTablaUsuarios() {
  const usuarios = getUsuarios();
  const div = document.getElementById("tablaUsuarios");

  div.innerHTML = `
    <table class="tabla">
      <thead><tr><th>ID</th><th>Nombre</th><th>Rol</th><th>Penalizado</th><th>Acciones</th></tr></thead>
      <tbody>
        ${usuarios.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td><span class="badge ${u.rol === "admin" ? "badge-admin" : "badge-user"}">${u.rol}</span></td>
            <td>${u.penalizado ? `<span class="badge badge-error">Sí</span>` : `<span class="badge badge-ok">No</span>`}</td>
            <td>
              ${u.penalizado
                ? `<button class="btn btn-sm btn-primary" onclick="quitarPenalizacion(${u.id})">Quitar penal.</button>`
                : `<button class="btn btn-sm btn-warn" onclick="ponerPenalizacion(${u.id})">Penalizar</button>`
              }
              <button class="btn btn-danger btn-xs" onclick="eliminarUsuario(${u.id})">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// tabla con el historial de todos los prestamos
function renderTablaPrestamos() {
  const prestamos = getPrestamos();
  const div = document.getElementById("tablaPrestamos");

  if (prestamos.length === 0) {
    div.innerHTML = `<p class="empty-msg">No hay préstamos registrados.</p>`;
    return;
  }

  div.innerHTML = `
    <table class="tabla">
      <thead><tr><th>ID</th><th>Usuario</th><th>Libro</th><th>F. Préstamo</th><th>F. Devolución</th><th>Estado</th></tr></thead>
      <tbody>
        ${prestamos.map(p => {
          const u = getUsuarioById(p.idUsuario);
          const vencido = isVencido(p);
          return `
            <tr>
              <td>${p.id}</td>
              <td>${u ? u.nombre : `#${p.idUsuario}`}</td>
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

// elimina un libro por id
window.eliminarLibro = function(id) {
  if (!confirm("¿Eliminar este libro?")) return;
  setLibros(getLibros().filter(l => l.id !== id));
  renderTablaLibros();
  renderEstadisticas();
};

// elimina un usuario, no puedes eliminarte a ti mismo
window.eliminarUsuario = function(id) {
  const sesion = getSesion();
  if (id === sesion.id) return alert("No puedes eliminar tu propio usuario.");
  if (!confirm("¿Eliminar este usuario?")) return;
  setUsuarios(getUsuarios().filter(u => u.id !== id));
  renderTablaUsuarios();
  renderEstadisticas();
};

// pone penalizacion al usuario durante los dias configurados
window.ponerPenalizacion = function(id) {
  const usuarios = getUsuarios();
  const u = usuarios.find(u => u.id === id);
  if (!u) return;
  const hasta = new Date();
  hasta.setDate(hasta.getDate() + getConfig().maxDias);
  u.penalizado = true;
  u.fechaFinPenalizacion = hasta.toISOString();
  setUsuarios(usuarios);
  renderTablaUsuarios();
};

// quita la penalizacion manualmente
window.quitarPenalizacion = function(id) {
  const usuarios = getUsuarios();
  const u = usuarios.find(u => u.id === id);
  if (!u) return;
  u.penalizado = false;
  u.fechaFinPenalizacion = null;
  setUsuarios(usuarios);
  renderTablaUsuarios();
};