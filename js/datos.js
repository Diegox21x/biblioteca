// datos.js - guardar y leer datos del navegador (localStorage)
// localStorage es como una "memoria" del navegador que no se borra al cerrar la página


// ─── Configuración ────────────────────────────────────────────────────────────

function getConfig() {
  // intenta leer la configuración guardada, si no existe devuelve los valores por defecto
  const guardado = localStorage.getItem("config");
  if (guardado) 
    return JSON.parse(guardado);
  return { maxLibros: 3, maxDias: 14 };
}

function setConfig(datos) {
  // JSON.stringify convierte el objeto a texto para poder guardarlo
  localStorage.setItem("config", JSON.stringify(datos));
}


// ─── Usuarios ─────────────────────────────────────────────────────────────────

function getUsuarios() {
  const guardado = localStorage.getItem("usuarios");
  if (guardado) return JSON.parse(guardado);

  // si no hay usuarios guardados, crea los de prueba la primera vez
  const usuariosPrueba = [
    { id: 1, nombre: "admin", password: "admin", rol: "admin", penalizado: false, fechaFinPenalizacion: null },
    { id: 2, nombre: "user1", password: "1234",  rol: "user", penalizado: false, fechaFinPenalizacion: null },
    { id: 3, nombre: "user2", password: "1234",  rol: "user", penalizado: false, fechaFinPenalizacion: null }
  ];
  localStorage.setItem("usuarios", JSON.stringify(usuariosPrueba));
  return usuariosPrueba;
}

function setUsuarios(lista) {
  localStorage.setItem("usuarios", JSON.stringify(lista));
}

function getUsuarioPorId(id) {
  // find recorre el array y devuelve el primer elemento que cumpla la condición
  return getUsuarios().find(function(u) { return u.id === id; });
}


// ─── Libros ───────────────────────────────────────────────────────────────────

function getLibros() {
  const guardado = localStorage.getItem("libros");
  if (guardado) return JSON.parse(guardado);

  // libros de ejemplo para que la app no esté vacía al abrirla
  const librosPrueba = [
    { id: 1, titulo: "El Quijote", autor: "Cervantes", genero: "Clasico", disponible: true },
    { id: 2, titulo: "1984", autor: "George Orwell", genero: "Distopia", disponible: true },
    { id: 3, titulo: "La Odisea", autor: "Homero", genero: "Epica", disponible: true },
    { id: 4, titulo: "Cien años de soledad", autor: "Gabriel Garcia Marquez", genero: "Realismo magico", disponible: true },
    { id: 5, titulo: "El señor de los anillos", autor: "J.R.R. Tolkien", genero: "Fantasia", disponible: true },
    { id: 6, titulo: "Crimen y castigo", autor: "Dostoyevski", genero: "Clasico", disponible: true }
  ];
  localStorage.setItem("libros", JSON.stringify(librosPrueba));
  return librosPrueba;
}

function setLibros(lista) {
  localStorage.setItem("libros", JSON.stringify(lista));
}


// ─── Préstamos ────────────────────────────────────────────────────────────────

function getPrestamos() {
  const guardado = localStorage.getItem("prestamos");
  if (guardado) return JSON.parse(guardado);
  return []; // si no hay prestamos devuelve un array vacio
}

function setPrestamos(lista) {
  localStorage.setItem("prestamos", JSON.stringify(lista));
}

function getPrestamosActivos(idUsuario) {
  // devuelve solo los préstamos que no han sido devueltos todavia
  return getPrestamos().filter(function(p) {
    return p.idUsuario === idUsuario && p.devuelto === false;
  });
}


// ─── Sesión ───────────────────────────────────────────────────────────────────

function getSesion() {
  const guardado = localStorage.getItem("sesion");
  if (guardado)
    return JSON.parse(guardado);

    return null; // null si no hay nadie logeado
}

function setSesion(usuario) {
  localStorage.setItem("sesion", JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem("sesion");
  window.location.href = "login.html";
}


// ─── Utilidades ───────────────────────────────────────────────────────────────

function siguienteId(lista) {
  // genera un id nuevo sumando 1 al id más alto que exista en el array
  if (lista.length === 0) return 1;
  let maxId = 0;
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id > maxId) maxId = lista[i].id;
  }
  return maxId + 1;
}

function estaVencido(prestamo) {
  // compara la fecha de hoy con la fecha límite del préstamo
  const hoy = new Date();
  const limite = new Date(prestamo.fechaDevolucion);
  return hoy > limite && prestamo.devuelto === false;
}

function emojiGenero(genero) {
  // devuelve un emoji según el género del libro
  if (genero === "Clasico")         
    return "🏛️";
  if (genero === "Distopia")        
    return "🌑";
  if (genero === "Epica")           
    return "⚔️";
  if (genero === "Fantasia")        
    return "🧙";
  if (genero === "Realismo magico") 
    return "🌀";
  if (genero === "Terror")          
    return "👻";
  if (genero === "Ciencia ficcion") 
    return "🚀";
  if (genero === "Romance")         
    return "💕";
  if (genero === "Historia")        
    return "📜";
  return "📖";
}

// ─── Penalizaciones automáticas ───────────────────────────────────────────────

function verificarPenalizaciones() {
  const prestamos = getPrestamos();
  const usuarios  = getUsuarios();
  const config    = getConfig();
  let huboCambios = false;

  // recorre todos los préstamos buscando los vencidos sin penalizar
  for (let i = 0; i < prestamos.length; i++) {
    const p = prestamos[i];
    if (p.devuelto === false && estaVencido(p) && p.penalizacionAplicada === false) {

      // busca al usuario dueño del préstamo
      let usuario = null;
      for (let j = 0; j < usuarios.length; j++) {
        if (usuarios[j].id === p.idUsuario) { usuario = usuarios[j]; break; }
      }

      if (usuario && usuario.penalizado === false) {
        // calcula hasta cuándo dura la penalización
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + config.maxDias);

        usuario.penalizado           = true;
        usuario.fechaFinPenalizacion = hasta.toISOString();
        p.penalizacionAplicada       = true;
        huboCambios = true;
      }
    }
  }

  // levanta las penalizaciones que ya han expirado
  for (let i = 0; i < usuarios.length; i++) {
    const u = usuarios[i];
    if (u.penalizado && u.fechaFinPenalizacion) {
      const hoy   = new Date();
      const hasta = new Date(u.fechaFinPenalizacion);
      if (hoy > hasta) {
        u.penalizado           = false;
        u.fechaFinPenalizacion = null;
        huboCambios = true;
      }
    }
  }

  // solo guarda si hubo algún cambio para no escribir innecesariamente
  if (huboCambios) {
    setUsuarios(usuarios);
    setPrestamos(prestamos);
  }
}