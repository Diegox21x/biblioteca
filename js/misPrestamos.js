// misPrestamos.js - pagina donde el usuario ve sus prestamos

document.addEventListener("DOMContentLoaded", () => {
  const sesion = getSesion();
  const usuario = getUsuarioById(sesion.id);

  // si el usuario tiene penalizacion activa muestro hasta cuando dura
  const alertPen = document.getElementById("alertPenalizado");
  if (usuario.penalizado) {
    const fecha = new Date(usuario.fechaFinPenalizacion).toLocaleDateString("es-ES");
    alertPen.textContent = `Tienes una penalizacion activa hasta el ${fecha}. No puedes solicitar nuevos prestamos.`;
    alertPen.classList.remove("hidden");
  }

  // pinto los prestamos al cargar
  renderPrestamos();

  function renderPrestamos() {
    // separo los prestamos del usuario en activos e historial
    const prestamos = getPrestamos().filter(p => p.idUsuario === sesion.id);
    const activos = prestamos.filter(p => !p.devuelto);
    const historial = prestamos.filter(p => p.devuelto);

    const divActivos = document.getElementById("prestamosActivos");
    const divHistorial = document.getElementById("prestamosHistorial");

    // seccion de prestamos activos
    divActivos.innerHTML = `<h3>Prestamos activos (${activos.length})</h3>`;
    if (activos.length === 0) {
      divActivos.innerHTML += `<p class="empty-msg">No tienes prestamos activos.</p>`;
    } else {
      divActivos.innerHTML += activos.map(p => {
        const vencido = isVencido(p);
        const fechaDev = new Date(p.fechaDevolucion).toLocaleDateString("es-ES");
        const fechaPres = new Date(p.fechaPrestamo).toLocaleDateString("es-ES");

        // si esta vencido le añado la clase de color rojo
        return `
          <div class="prestamo-card ${vencido ? "prestamo-vencido" : ""}">
            <div class="prestamo-info">
              <strong>${p.tituloLibro}</strong>
              <span>Prestado: ${fechaPres}</span>
              <span>Devolver antes de: <strong>${fechaDev}</strong></span>
              ${vencido ? `<span class="badge badge-error">VENCIDO</span>` : ""}
            </div>
            <button class="btn btn-warn btn-sm" onclick="devolver(${p.id})">Devolver</button>
          </div>
        `;
      }).join("");
    }

    // seccion de historial de prestamos ya devueltos
    divHistorial.innerHTML = `<h3>Historial (${historial.length})</h3>`;
    if (historial.length === 0) {
      divHistorial.innerHTML += `<p class="empty-msg">Sin historial todavia.</p>`;
    } else {
      divHistorial.innerHTML += historial.map(p => {
        const fechaDev = new Date(p.fechaDevolucion).toLocaleDateString("es-ES");

        // si no tiene fecha real de devolucion muestro un guion
        const fechaReal = p.fechaDevolucionReal
          ? new Date(p.fechaDevolucionReal).toLocaleDateString("es-ES")
          : "-";

        return `
          <div class="prestamo-card prestamo-devuelto">
            <div class="prestamo-info">
              <strong>${p.tituloLibro}</strong>
              <span>Fecha limite: ${fechaDev}</span>
              <span>Devuelto: ${fechaReal}</span>
            </div>
            <span class="badge badge-ok">Devuelto</span>
          </div>
        `;
      }).join("");
    }
  }

  // funcion para devolver un libro desde esta pagina
  window.devolver = function(idPrestamo) {
    const prestamos = getPrestamos();
    const prestamo = prestamos.find(p => p.id === idPrestamo);
    if (!prestamo) return;

    // marco como devuelto y guardo la fecha real
    prestamo.devuelto = true;
    prestamo.fechaDevolucionReal = new Date().toISOString();

    // el libro vuelve a estar disponible en el catalogo
    const libros = getLibros();
    const libro = libros.find(l => l.id === prestamo.idLibro);
    if (libro) libro.disponible = true;

    setLibros(libros);
    setPrestamos(prestamos);

    // recargo la lista para que se vea el cambio
    renderPrestamos();
  };
});