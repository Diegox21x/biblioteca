// misPrestamos.js - muestra los préstamos del usuario actual

document.addEventListener("DOMContentLoaded", function() {
  const sesion  = getSesion();
  const usuario = getUsuarioPorId(sesion.id);

  // si el usuario está penalizado muestra hasta cuándo dura la penalización
  if (usuario.penalizado) {
    const fecha = new Date(usuario.fechaFinPenalizacion).toLocaleDateString("es-ES");
    const alerta = document.getElementById("alertPenalizado");
    alerta.textContent = "Tienes una penalización activa hasta el " + fecha + ". No puedes solicitar nuevos préstamos.";
    alerta.classList.remove("hidden");
  }

  mostrarPrestamos();
});


// ─── Mostrar préstamos ────────────────────────────────────────────────────────

function mostrarPrestamos() {
  const sesion    = getSesion();
  const prestamos = getPrestamos();

  // separa los préstamos del usuario en activos y ya devueltos
  const activos   = [];
  const historial = [];

  for (let i = 0; i < prestamos.length; i++) {
    const p = prestamos[i];
    if (p.idUsuario !== sesion.id) continue; // salta los préstamos de otros usuarios

    if (p.devuelto) {
      historial.push(p);
    } else {
      activos.push(p);
    }
  }

  mostrarActivos(activos);
  mostrarHistorial(historial);
}

function mostrarActivos(activos) {
  const div = document.getElementById("prestamosActivos");
  div.innerHTML = "";

  // título de sección
  const titulo = document.createElement("h3");
  titulo.textContent = "Préstamos activos (" + activos.length + ")";
  div.appendChild(titulo);

  if (activos.length === 0) {
    const msg = document.createElement("p");
    msg.className = "empty-msg";
    msg.textContent = "No tienes préstamos activos.";
    div.appendChild(msg);
    return;
  }

  for (let i = 0; i < activos.length; i++) {
    div.appendChild(crearTarjetaActivo(activos[i]));
  }
}

function crearTarjetaActivo(p) {
  const vencido   = estaVencido(p);
  const fechaPres = new Date(p.fechaPrestamo).toLocaleDateString("es-ES");
  const fechaDev  = new Date(p.fechaDevolucion).toLocaleDateString("es-ES");

  const tarjeta = document.createElement("div");
  // si está vencido añade el borde rojo
  tarjeta.className = "prestamo-card" + (vencido ? " prestamo-vencido" : "");

  // información del préstamo
  const info = document.createElement("div");
  info.className = "prestamo-info";

  const nombre = document.createElement("strong");
  nombre.textContent = p.tituloLibro;
  info.appendChild(nombre);

  const fechaInicio = document.createElement("span");
  fechaInicio.textContent = "Prestado: " + fechaPres;
  info.appendChild(fechaInicio);

  const fechaLimite = document.createElement("span");
  fechaLimite.innerHTML = "Devolver antes de: <strong>" + fechaDev + "</strong>";
  info.appendChild(fechaLimite);

  // badge de vencido si corresponde
  if (vencido) {
    const badge = document.createElement("span");
    badge.className = "badge badge-error";
    badge.textContent = "VENCIDO";
    info.appendChild(badge);
  }

  // botón para devolver el libro
  const btnDevolver = document.createElement("button");
  btnDevolver.className = "btn btn-warn btn-sm";
  btnDevolver.textContent = "Devolver";
  btnDevolver.addEventListener("click", function() {
    devolverPrestamo(p.id);
  });

  tarjeta.appendChild(info);
  tarjeta.appendChild(btnDevolver);

  return tarjeta;
}

function mostrarHistorial(historial) {
  const div = document.getElementById("prestamosHistorial");
  div.innerHTML = "";

  const titulo = document.createElement("h3");
  titulo.textContent = "Historial (" + historial.length + ")";
  div.appendChild(titulo);

  if (historial.length === 0) {
    const msg = document.createElement("p");
    msg.className = "empty-msg";
    msg.textContent = "Sin historial todavía.";
    div.appendChild(msg);
    return;
  }

  for (let i = 0; i < historial.length; i++) {
    div.appendChild(crearTarjetaHistorial(historial[i]));
  }
}

function crearTarjetaHistorial(p) {
  const fechaDev  = new Date(p.fechaDevolucion).toLocaleDateString("es-ES");
  const fechaReal = p.fechaDevolucionReal ? new Date(p.fechaDevolucionReal).toLocaleDateString("es-ES") : "-";

  const tarjeta = document.createElement("div");
  tarjeta.className = "prestamo-card prestamo-devuelto";

  const info = document.createElement("div");
  info.className = "prestamo-info";

  const nombre = document.createElement("strong");
  nombre.textContent = p.tituloLibro;
  info.appendChild(nombre);

  const limite = document.createElement("span");
  limite.textContent = "Fecha límite: " + fechaDev;
  info.appendChild(limite);

  const devuelto = document.createElement("span");
  devuelto.textContent = "Devuelto: " + fechaReal;
  info.appendChild(devuelto);

  const badge = document.createElement("span");
  badge.className = "badge badge-ok";
  badge.textContent = "Devuelto";

  tarjeta.appendChild(info);
  tarjeta.appendChild(badge);

  return tarjeta;
}

// ─── Devolver lubros ─────────────────────────────────────────────────────────────────

function devolverPrestamo(idPrestamo) {
  const prestamos = getPrestamos();
  let prestamo = null;

  for (let i = 0; i < prestamos.length; i++) {
    if (prestamos[i].id === idPrestamo) { prestamo = prestamos[i]; break; }
  }
  if (!prestamo) return;

  prestamo.devuelto            = true;
  prestamo.fechaDevolucionReal = new Date().toISOString();

  // marca el libro como disponible de nuevo
  const libros = getLibros();
  for (let i = 0; i < libros.length; i++) {
    if (libros[i].id === prestamo.idLibro) {
      libros[i].disponible = true;
      break;
    }
  }

  setLibros(libros);
  setPrestamos(prestamos);

  // recarga la lista para mostrar el cambio
  mostrarPrestamos();
}