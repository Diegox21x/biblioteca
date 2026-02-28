// admin.js - panel de administración

document.addEventListener("DOMContentLoaded", function() {
  cargarConfig();
  mostrarEstadisticas();
  mostrarTablaLibros();
  mostrarTablaUsuarios();
  mostrarTablaPrestamos();

  document.getElementById("btnGuardarConfig").addEventListener("click", guardarConfig);
  document.getElementById("btnAddLibro").addEventListener("click",    agregarLibro);
  document.getElementById("btnAddUsuario").addEventListener("click",  agregarUsuario);
});


// ─── Configuración ────────────────────────────────────────────────────────────

function cargarConfig() {
  const cfg = getConfig();
  document.getElementById("cfgMaxLibros").value = cfg.maxLibros;
  document.getElementById("cfgMaxDias").value   = cfg.maxDias;
}

function guardarConfig() {
  const maxLibros = parseInt(document.getElementById("cfgMaxLibros").value);
  const maxDias   = parseInt(document.getElementById("cfgMaxDias").value);

  // parseInt devuelve NaN si el campo está vacío o tiene letras
  if (isNaN(maxLibros) || isNaN(maxDias) || maxLibros < 1 || maxDias < 1) {
    alert("Los valores de configuración no son válidos.");
    return;
  }

  setConfig({ maxLibros: maxLibros, maxDias: maxDias });
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
  libros.push({ id: siguienteId(libros), titulo: titulo, autor: autor, genero: genero, disponible: true });
  setLibros(libros);

  document.getElementById("nuevoTitulo").value = "";
  document.getElementById("nuevoAutor").value  = "";
  document.getElementById("nuevoGenero").value = "";

  mostrarTablaLibros();
  mostrarEstadisticas();
}

function eliminarLibro(id) {
  if (!confirm("¿Seguro que quieres eliminar este libro?")) return;

  const libros = getLibros();
  const nuevaLista = [];
  for (let i = 0; i < libros.length; i++) {
    if (libros[i].id !== id) nuevaLista.push(libros[i]);
  }
  setLibros(nuevaLista);

  mostrarTablaLibros();
  mostrarEstadisticas();
}

function mostrarTablaLibros() {
  const libros = getLibros();
  const tabla  = document.getElementById("tablaLibros");
  tabla.innerHTML = "";

  // crea la tabla con cabecera
  const t = document.createElement("table");
  t.className = "tabla";
  t.innerHTML = "<thead><tr>" +
    "<th>ID</th><th>Título</th><th>Autor</th><th>Género</th><th>Estado</th><th>Acciones</th>" +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  for (let i = 0; i < libros.length; i++) {
    const l  = libros[i];
    const tr = document.createElement("tr");

    tr.innerHTML = "<td>" + l.id + "</td>" +
      "<td>" + l.titulo + "</td>" +
      "<td>" + l.autor  + "</td>" +
      "<td>" + (l.genero || "—") + "</td>" +
      "<td><span class='badge " + (l.disponible ? "badge-ok" : "badge-off") + "'>" +
        (l.disponible ? "Disponible" : "Prestado") +
      "</span></td>";

    // celda con botón eliminar
    const tdAccion = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn btn-danger btn-xs";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", function() { eliminarLibro(l.id); });
    tdAccion.appendChild(btnEliminar);
    tr.appendChild(tdAccion);

    tbody.appendChild(tr);
  }

  t.appendChild(tbody);
  tabla.appendChild(t);
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

  // comprueba que no exista otro usuario con el mismo nombre
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].nombre === nombre) {
      alert("Ya existe un usuario con ese nombre.");
      return;
    }
  }

  usuarios.push({
    id: siguienteId(usuarios),
    nombre: nombre,
    password: password,
    rol: rol,
    penalizado: false,
    fechaFinPenalizacion: null
  });
  setUsuarios(usuarios);

  document.getElementById("nuevoUsuario").value  = "";
  document.getElementById("nuevoPassword").value = "";

  mostrarTablaUsuarios();
  mostrarEstadisticas();
}

function eliminarUsuario(id) {
  const sesion = getSesion();
  if (id === sesion.id) {
    alert("No puedes eliminar tu propia cuenta.");
    return;
  }
  if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;

  const usuarios = getUsuarios();
  const nuevaLista = [];
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].id !== id) nuevaLista.push(usuarios[i]);
  }
  setUsuarios(nuevaLista);

  mostrarTablaUsuarios();
  mostrarEstadisticas();
}

function ponerPenalizacion(id) {
  const usuarios = getUsuarios();
  let usuario = null;
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].id === id) { usuario = usuarios[i]; break; }
  }
  if (!usuario) return;

  const hasta = new Date();
  hasta.setDate(hasta.getDate() + getConfig().maxDias);

  usuario.penalizado           = true;
  usuario.fechaFinPenalizacion = hasta.toISOString();

  setUsuarios(usuarios);
  mostrarTablaUsuarios();
}

function quitarPenalizacion(id) {
  const usuarios = getUsuarios();
  let usuario = null;
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].id === id) { usuario = usuarios[i]; break; }
  }
  if (!usuario) return;

  usuario.penalizado           = false;
  usuario.fechaFinPenalizacion = null;

  setUsuarios(usuarios);
  mostrarTablaUsuarios();
}

function mostrarTablaUsuarios() {
  const usuarios = getUsuarios();
  const tabla    = document.getElementById("tablaUsuarios");
  tabla.innerHTML = "";

  const t = document.createElement("table");
  t.className = "tabla";
  t.innerHTML = "<thead><tr>" +
    "<th>ID</th><th>Nombre</th><th>Rol</th><th>Penalizado</th><th>Acciones</th>" +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  for (let i = 0; i < usuarios.length; i++) {
    const u  = usuarios[i];
    const tr = document.createElement("tr");

    // badge del rol
    const badgeRol = "<span class='badge " + (u.rol === "admin" ? "badge-admin" : "badge-user") + "'>" + u.rol + "</span>";

    // badge de penalización
    const badgePen = u.penalizado
      ? "<span class='badge badge-error'>Sí</span>"
      : "<span class='badge badge-ok'>No</span>";

    tr.innerHTML = "<td>" + u.id + "</td>" +
      "<td>" + u.nombre + "</td>" +
      "<td>" + badgeRol + "</td>" +
      "<td>" + badgePen + "</td>";

    // celda con los botones de acción
    const tdAccion = document.createElement("td");

    if (u.penalizado) {
      const btnQuitar = document.createElement("button");
      btnQuitar.className = "btn btn-sm btn-primary";
      btnQuitar.textContent = "Quitar penal.";
      btnQuitar.addEventListener("click", function() { quitarPenalizacion(u.id); });
      tdAccion.appendChild(btnQuitar);
    } else {
      const btnPenalizar = document.createElement("button");
      btnPenalizar.className = "btn btn-sm btn-warn";
      btnPenalizar.textContent = "Penalizar";
      btnPenalizar.addEventListener("click", function() { ponerPenalizacion(u.id); });
      tdAccion.appendChild(btnPenalizar);
    }

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn btn-danger btn-xs";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", function() { eliminarUsuario(u.id); });
    tdAccion.appendChild(btnEliminar);

    tr.appendChild(tdAccion);
    tbody.appendChild(tr);
  }

  t.appendChild(tbody);
  tabla.appendChild(t);
}


// ─── Préstamos ────────────────────────────────────────────────────────────────

function mostrarTablaPrestamos() {
  const prestamos = getPrestamos();
  const div       = document.getElementById("tablaPrestamos");
  div.innerHTML   = "";

  if (prestamos.length === 0) {
    const msg = document.createElement("p");
    msg.className   = "empty-msg";
    msg.textContent = "No hay préstamos registrados.";
    div.appendChild(msg);
    return;
  }

  const t = document.createElement("table");
  t.className = "tabla";
  t.innerHTML = "<thead><tr>" +
    "<th>ID</th><th>Usuario</th><th>Libro</th><th>F. Préstamo</th><th>F. Devolución</th><th>Estado</th>" +
    "</tr></thead>";

  const tbody = document.createElement("tbody");

  for (let i = 0; i < prestamos.length; i++) {
    const p       = prestamos[i];
    const usuario = getUsuarioPorId(p.idUsuario);
    const nombre  = usuario ? usuario.nombre : "#" + p.idUsuario;
    const vencido = estaVencido(p);

    let badgeEstado = "";
    if (p.devuelto) {
      badgeEstado = "<span class='badge badge-ok'>Devuelto</span>";
    } else if (vencido) {
      badgeEstado = "<span class='badge badge-error'>Vencido</span>";
    } else {
      badgeEstado = "<span class='badge badge-warn'>Activo</span>";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + p.id + "</td>" +
      "<td>" + nombre + "</td>" +
      "<td>" + p.tituloLibro + "</td>" +
      "<td>" + new Date(p.fechaPrestamo).toLocaleDateString("es-ES")   + "</td>" +
      "<td>" + new Date(p.fechaDevolucion).toLocaleDateString("es-ES") + "</td>" +
      "<td>" + badgeEstado + "</td>";

    tbody.appendChild(tr);
  }

  t.appendChild(tbody);
  div.appendChild(t);
}


// ─── Estadísticas ─────────────────────────────────────────────────────────────

function mostrarEstadisticas() {
  const libros    = getLibros();
  const usuarios  = getUsuarios();
  const prestamos = getPrestamos();

  const div = document.getElementById("estadisticas");
  div.innerHTML = "";

  // cuenta préstamos activos
  let prestamosActivos = 0;
  for (let i = 0; i < prestamos.length; i++) {
    if (!prestamos[i].devuelto) prestamosActivos++;
  }

  // cuenta usuarios penalizados
  let penalizados = 0;
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].penalizado) penalizados++;
  }

  const libroTop   = libroMasPrestado(prestamos);
  const usuarioTop = usuarioConMasRetrasos(prestamos);
  const tiempoMed  = tiempoMedioDevolucion(prestamos);

  // array con los datos de cada tarjeta [número, etiqueta]
  const tarjetas = [
    [libros.length,       "Libros totales"],
    [usuarios.length,     "Usuarios"],
    [prestamosActivos,    "Préstamos activos"],
    [prestamos.length,    "Préstamos histórico"],
    [libroTop,            "Libro más prestado"],
    [usuarioTop,          "Más retrasos"],
    [tiempoMed + " días", "Tiempo medio devolución"],
    [penalizados,         "Penalizados ahora"]
  ];

  for (let i = 0; i < tarjetas.length; i++) {
    const card = document.createElement("div");
    card.className = "stat-card";

    const num = document.createElement("span");
    num.className   = "stat-num";
    num.textContent = tarjetas[i][0];

    const label = document.createElement("span");
    label.textContent = tarjetas[i][1];

    card.appendChild(num);
    card.appendChild(label);
    div.appendChild(card);
  }
}

function libroMasPrestado(prestamos) {
  // cuenta cuántas veces se prestó cada libro
  const conteo = {};
  for (let i = 0; i < prestamos.length; i++) {
    const titulo = prestamos[i].tituloLibro;
    conteo[titulo] = (conteo[titulo] || 0) + 1;
  }

  let masVeces = 0;
  let libroTop = "—";
  for (const titulo in conteo) {
    if (conteo[titulo] > masVeces) {
      masVeces = conteo[titulo];
      libroTop = titulo;
    }
  }
  return libroTop;
}

function usuarioConMasRetrasos(prestamos) {
  // cuenta los retrasos por usuario (solo los préstamos con penalización aplicada)
  const retrasos = {};
  for (let i = 0; i < prestamos.length; i++) {
    if (prestamos[i].penalizacionAplicada) {
      const usuario = getUsuarioPorId(prestamos[i].idUsuario);
      const nombre  = usuario ? usuario.nombre : "#" + prestamos[i].idUsuario;
      retrasos[nombre] = (retrasos[nombre] || 0) + 1;
    }
  }

  let masRetrasos  = 0;
  let usuarioTop   = "—";
  for (const nombre in retrasos) {
    if (retrasos[nombre] > masRetrasos) {
      masRetrasos = retrasos[nombre];
      usuarioTop  = nombre;
    }
  }
  return usuarioTop;
}

function tiempoMedioDevolucion(prestamos) {
  // calcula el promedio de días entre que se prestó y se devolvió
  let total    = 0;
  let cantidad = 0;

  for (let i = 0; i < prestamos.length; i++) {
    const p = prestamos[i];
    if (p.devuelto && p.fechaDevolucionReal) {
      const inicio = new Date(p.fechaPrestamo);
      const fin    = new Date(p.fechaDevolucionReal);
      const dias   = (fin - inicio) / (1000 * 60 * 60 * 24); // convierte milisegundos a días
      total += dias;
      cantidad++;
    }
  }

  if (cantidad === 0) return 0;
  return (total / cantidad).toFixed(1); // toFixed(1) deja un decimal
}