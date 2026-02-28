// catalogo.js - muestra los libros y gestiona pedir/devolver

document.addEventListener("DOMContentLoaded", function() {
  mostrarCatalogo();

  // cada vez que el usuario escribe en el buscador, actualiza la lista
  document.getElementById("buscador").addEventListener("input", mostrarCatalogo);

  // cierra el popup al pulsar el botón de cerrar
  document.getElementById("cerrarPopup").addEventListener("click", cerrarPopup);

  // cierra el popup al hacer clic fuera del recuadro
  document.getElementById("popupLibro").addEventListener("click", function(e) {
    if (e.target === document.getElementById("popupLibro")) cerrarPopup();
  });
});


// ─── Catálogo ─────────────────────────────────────────────────────────────────

function mostrarCatalogo() {
  const sesion   = getSesion();
  const config   = getConfig();
  const usuario  = getUsuarioPorId(sesion.id);
  const activos  = getPrestamosActivos(sesion.id);
  const filtro   = document.getElementById("buscador").value.toLowerCase();
  const todos    = getLibros();

  // filtra los libros por título o autor según lo que escribió el usuario
  const libros = [];
  for (let i = 0; i < todos.length; i++) {
    const l = todos[i];
    if (l.titulo.toLowerCase().includes(filtro) || l.autor.toLowerCase().includes(filtro)) {
      libros.push(l);
    }
  }

  // muestra u oculta las alertas según el estado del usuario
  const alertPenalizado = document.getElementById("alertPenalizado");
  const alertMaxLibros  = document.getElementById("alertMaxLibros");

  if (usuario.penalizado) {
    alertPenalizado.classList.remove("hidden");
  } else {
    alertPenalizado.classList.add("hidden");
  }

  if (!usuario.penalizado && activos.length >= config.maxLibros) {
    alertMaxLibros.classList.remove("hidden");
  } else {
    alertMaxLibros.classList.add("hidden");
  }

  const lista = document.getElementById("listaLibros");

  if (libros.length === 0) {
    lista.innerHTML = "<p class='empty-msg'>No se encontraron libros.</p>";
    return;
  }

  // vacía la lista y añade una tarjeta por cada libro
  lista.innerHTML = "";
  for (let i = 0; i < libros.length; i++) {
    const libro = libros[i];
    lista.appendChild(crearTarjetaLibro(libro, activos, usuario, config));
  }
}

function crearTarjetaLibro(libro, activos, usuario, config) {
  // busca si el usuario ya tiene este libro prestado
  let prestadoActual = null;
  for (let i = 0; i < activos.length; i++) {
    if (activos[i].idLibro === libro.id) { prestadoActual = activos[i]; break; }
  }

  // el usuario no puede pedir más libros si está penalizado o alcanzó el límite
  const bloqueado = usuario.penalizado || (!prestadoActual && activos.length >= config.maxLibros);

  // crea el contenedor de la tarjeta
  const tarjeta = document.createElement("div");
  tarjeta.className = "libro-card";

  // emoji del género
  const emoji = document.createElement("div");
  emoji.className = "libro-emoji";
  emoji.textContent = emojiGenero(libro.genero);

  // información del libro
  const info = document.createElement("div");
  info.className = "libro-info";
  info.innerHTML = "<h3 class='libro-titulo'>" + libro.titulo + "</h3>" +
                   "<p class='libro-autor'>" + libro.autor + "</p>" +
                   "<span class='libro-genero'>" + (libro.genero || "") + "</span>";

  // sección de acciones (badge de estado + botones)
  const acciones = document.createElement("div");
  acciones.className = "libro-actions";

  // badge que indica si el libro está disponible o no
  const badge = document.createElement("span");
  if (libro.disponible) {
    badge.className = "badge badge-ok";
    badge.textContent = "Disponible";
  } else {
    badge.className = "badge badge-off";
    badge.textContent = "No disponible";
  }
  acciones.appendChild(badge);

  // botón de acción: devolver si lo tiene, pedir si está libre, nada si está bloqueado
  if (prestadoActual) {
    const btnDevolver = document.createElement("button");
    btnDevolver.className = "btn btn-warn btn-sm";
    btnDevolver.textContent = "Devolver";
    btnDevolver.addEventListener("click", function() { devolverLibro(prestadoActual.id); });
    acciones.appendChild(btnDevolver);
  } else if (libro.disponible && !bloqueado) {
    const btnPedir = document.createElement("button");
    btnPedir.className = "btn btn-primary btn-sm";
    btnPedir.textContent = "Pedir";
    btnPedir.addEventListener("click", function() { pedirLibro(libro.id); });
    acciones.appendChild(btnPedir);
  }

  // botón ver detalle siempre visible
  const btnVer = document.createElement("button");
  btnVer.className = "btn btn-outline btn-sm";
  btnVer.textContent = "Ver";
  btnVer.addEventListener("click", function() { verDetalle(libro.id); });
  acciones.appendChild(btnVer);

  tarjeta.appendChild(emoji);
  tarjeta.appendChild(info);
  tarjeta.appendChild(acciones);

  return tarjeta;
}


// ─── Pedir y devolver ─────────────────────────────────────────────────────────

function pedirLibro(idLibro) {
  const sesion  = getSesion();
  const config  = getConfig();
  const usuario = getUsuarioPorId(sesion.id);
  const activos = getPrestamosActivos(sesion.id);

  if (usuario.penalizado) {
    alert("Tienes una penalización activa.");
    return;
  }
  if (activos.length >= config.maxLibros) {
    alert("Has alcanzado el máximo de préstamos activos (" + config.maxLibros + ").");
    return;
  }

  const libros = getLibros();
  let libro = null;
  for (let i = 0; i < libros.length; i++) {
    if (libros[i].id === idLibro) { libro = libros[i]; break; }
  }

  if (!libro || !libro.disponible) {
    alert("Este libro no está disponible.");
    return;
  }

  // calcula la fecha límite de devolución
  const hoy    = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + config.maxDias);

  const prestamos = getPrestamos();
  prestamos.push({
    id:                   siguienteId(prestamos),
    idUsuario:            sesion.id,
    idLibro:              libro.id,
    tituloLibro:          libro.titulo,
    fechaPrestamo:        hoy.toISOString(),
    fechaDevolucion:      limite.toISOString(),
    devuelto:             false,
    penalizacionAplicada: false
  });

  libro.disponible = false;
  setLibros(libros);
  setPrestamos(prestamos);
  mostrarCatalogo();
}

function devolverLibro(idPrestamo) {
  const prestamos = getPrestamos();
  let prestamo = null;
  for (let i = 0; i < prestamos.length; i++) {
    if (prestamos[i].id === idPrestamo) { prestamo = prestamos[i]; break; }
  }
  if (!prestamo) return;

  prestamo.devuelto            = true;
  prestamo.fechaDevolucionReal = new Date().toISOString();

  // marca el libro como disponible de nuevo en el catálogo
  const libros = getLibros();
  for (let i = 0; i < libros.length; i++) {
    if (libros[i].id === prestamo.idLibro) {
      libros[i].disponible = true;
      break;
    }
  }

  setLibros(libros);
  setPrestamos(prestamos);
  mostrarCatalogo();
}


// ─── Popup detalle ────────────────────────────────────────────────────────────

function verDetalle(idLibro) {
  const libros = getLibros();
  let libro = null;
  for (let i = 0; i < libros.length; i++) {
    if (libros[i].id === idLibro) { libro = libros[i]; break; }
  }
  if (!libro) return;

  // cuenta cuántas veces se ha prestado este libro en total
  const prestamos = getPrestamos();
  let vecesPrestado = 0;
  for (let i = 0; i < prestamos.length; i++) {
    if (prestamos[i].idLibro === idLibro) vecesPrestado++;
  }

  const contenido = document.getElementById("popupContenido");
  contenido.innerHTML = "<div class='detalle-libro'>" +
    "<div class='detalle-emoji'>" + emojiGenero(libro.genero) + "</div>" +
    "<h2>" + libro.titulo + "</h2>" +
    "<p><strong>Autor:</strong> " + libro.autor + "</p>" +
    "<p><strong>Género:</strong> " + (libro.genero || "Sin clasificar") + "</p>" +
    "<p><strong>Estado:</strong> " + (libro.disponible ? "Disponible" : "Prestado") + "</p>" +
    "<p><strong>Veces prestado:</strong> " + vecesPrestado + "</p>" +
    "</div>";

  document.getElementById("popupLibro").classList.remove("hidden");
}

function cerrarPopup() {
  document.getElementById("popupLibro").classList.add("hidden");
}