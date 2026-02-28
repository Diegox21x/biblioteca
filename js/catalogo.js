// catalogo.js - logica del catalogo de libros

document.addEventListener("DOMContentLoaded", () => {
  const sesion = getSesion();
  const config = getConfig();

  // pinto el catalogo al cargar la pagina
  renderCatalogo();

  // cada vez que escribo en el buscador filtro los libros
  document.getElementById("buscador").addEventListener("input", renderCatalogo);

  function renderCatalogo() {
    // cojo el texto del buscador y filtro por titulo o autor
    const filtro = document.getElementById("buscador").value.toLowerCase();
    const libros = getLibros().filter(l =>
      l.titulo.toLowerCase().includes(filtro) ||
      l.autor.toLowerCase().includes(filtro)
    );

    const prestamosActivos = getPrestamosActivos(sesion.id);
    const usuarioActual = getUsuarioById(sesion.id);

    // muestro u oculto las alertas segun el estado del usuario
    const alertPen = document.getElementById("alertPenalizado");
    const alertMax = document.getElementById("alertMaxLibros");
    alertPen.classList.toggle("hidden", !usuarioActual.penalizado);
    alertMax.classList.toggle("hidden", usuarioActual.penalizado || prestamosActivos.length < config.maxLibros);

    const lista = document.getElementById("listaLibros");

    // si no hay resultados muestro un mensaje
    if (libros.length === 0) {
      lista.innerHTML = '<p class="empty-msg">No se encontraron libros.</p>';
      return;
    }

    // genero una tarjeta por cada libro
    lista.innerHTML = libros.map(libro => {
      // compruebo si el usuario ya tiene este libro prestado
      const prestado = prestamosActivos.find(p => p.idLibro === libro.id);

      // el usuario esta bloqueado si tiene penalizacion o llego al maximo de prestamos
      const bloqueado = usuarioActual.penalizado || (!prestado && prestamosActivos.length >= config.maxLibros);

      return `
        <div class="libro-card" data-id="${libro.id}">
          <div class="libro-emoji">${generoEmoji(libro.genero)}</div>
          <div class="libro-info">
            <h3 class="libro-titulo">${libro.titulo}</h3>
            <p class="libro-autor">${libro.autor}</p>
            <span class="libro-genero">${libro.genero || ""}</span>
          </div>
          <div class="libro-actions">
            <span class="badge ${libro.disponible ? "badge-ok" : "badge-off"}">
              ${libro.disponible ? "Disponible" : "No disponible"}
            </span>
            ${prestado
              ? `<button class="btn btn-warn btn-sm" onclick="devolverLibro(${prestado.id})">Devolver</button>`
              : libro.disponible && !bloqueado
                ? `<button class="btn btn-primary btn-sm" onclick="pedirLibro(${libro.id})">Pedir</button>`
                : ""
            }
            <button class="btn btn-outline btn-sm" onclick="verDetalle(${libro.id})">Ver</button>
          </div>
        </div>
      `;
    }).join("");
  }

  // funcion para pedir un libro prestado
  window.pedirLibro = function(idLibro) {
    const sesion = getSesion();
    const config = getConfig();
    const usuario = getUsuarioById(sesion.id);
    const activos = getPrestamosActivos(sesion.id);

    // compruebo que no este penalizado ni haya llegado al limite
    if (usuario.penalizado) return alert("Tienes una penalización activa.");
    if (activos.length >= config.maxLibros) return alert(`Máximo ${config.maxLibros} préstamos activos.`);

    const libros = getLibros();
    const libro = libros.find(l => l.id === idLibro);
    if (!libro || !libro.disponible) return alert("Libro no disponible.");

    // calculo la fecha limite sumando los dias configurados
    const prestamos = getPrestamos();
    const hoy = new Date();
    const devolucion = new Date();
    devolucion.setDate(hoy.getDate() + config.maxDias);

    // creo el objeto prestamo y lo guardo
    prestamos.push({
      id: nextId(prestamos),
      idUsuario: sesion.id,
      idLibro: libro.id,
      tituloLibro: libro.titulo,
      fechaPrestamo: hoy.toISOString(),
      fechaDevolucion: devolucion.toISOString(),
      devuelto: false,
      penalizacionAplicada: false
    });

    // marco el libro como no disponible
    libro.disponible = false;
    setLibros(libros);
    setPrestamos(prestamos);
    renderCatalogo();
  };

  // funcion para devolver un libro desde el catalogo
  window.devolverLibro = function(idPrestamo) {
    const prestamos = getPrestamos();
    const prestamo = prestamos.find(p => p.id === idPrestamo);
    if (!prestamo) return;

    // marco como devuelto y guardo la fecha real de devolucion
    prestamo.devuelto = true;
    prestamo.fechaDevolucionReal = new Date().toISOString();

    // el libro vuelve a estar disponible
    const libros = getLibros();
    const libro = libros.find(l => l.id === prestamo.idLibro);
    if (libro) libro.disponible = true;

    setLibros(libros);
    setPrestamos(prestamos);
    renderCatalogo();
  };

  // abre el modal con el detalle del libro
  window.verDetalle = function(idLibro) {
    const libro = getLibros().find(l => l.id === idLibro);

    // cuento cuantas veces se ha prestado ese libro en total
    const prestamos = getPrestamos().filter(p => p.idLibro === idLibro);
    const vecesPrestado = prestamos.length;

    document.getElementById("modalContenido").innerHTML = `
      <div class="detalle-libro">
        <div class="detalle-emoji">${generoEmoji(libro.genero)}</div>
        <h2>${libro.titulo}</h2>
        <p><strong>Autor:</strong> ${libro.autor}</p>
        <p><strong>Género:</strong> ${libro.genero || "Sin clasificar"}</p>
        <p><strong>Estado:</strong> ${libro.disponible ? "Disponible" : "Prestado"}</p>
        <p><strong>Veces prestado:</strong> ${vecesPrestado}</p>
      </div>
    `;
    document.getElementById("modalLibro").classList.remove("hidden");
  };

  // cierro el modal con el boton de cerrar
  document.getElementById("cerrarModal").addEventListener("click", () => {
    document.getElementById("modalLibro").classList.add("hidden");
  });

  // tambien se cierra haciendo clic fuera del modal
  document.getElementById("modalLibro").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalLibro")) {
      document.getElementById("modalLibro").classList.add("hidden");
    }
  });
});

// devuelve un emoji segun el genero del libro
function generoEmoji(genero) {
  const map = {
    "Clasico": "🏛️", "Distopia": "🌑", "Epica": "⚔️",
    "Fantasia": "🧙", "Realismo magico": "🌀", "Terror": "👻",
    "Ciencia ficcion": "🚀", "Romance": "💕", "Historia": "📜"
  };
  return map[genero] || "📖";
}