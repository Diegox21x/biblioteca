// datos.js - aqui estan todas las funciones para manejar el localStorage

// claves que uso para guardar cada cosa en el localStorage
const KEYS = {
  usuarios: "bib_usuarios",
  libros: "bib_libros",
  prestamos: "bib_prestamos",
  config: "bib_config",
  sesion: "bib_sesion"
};

// devuelve la configuracion del sistema, si no existe la crea con valores por defecto
function getConfig() {
  const cfg = localStorage.getItem(KEYS.config);
  if (cfg) return JSON.parse(cfg);
  const defecto = { maxLibros: 3, maxDias: 14 };
  localStorage.setItem(KEYS.config, JSON.stringify(defecto));
  return defecto;
}

// guarda la configuracion en el localStorage
function setConfig(cfg) {
  localStorage.setItem(KEYS.config, JSON.stringify(cfg));
}

// devuelve el array de usuarios, si no existe lo crea con tres usuarios de prueba
function getUsuarios() {
  const data = localStorage.getItem(KEYS.usuarios);
  if (data) return JSON.parse(data);

  // usuarios iniciales para poder probar la aplicacion
  const inicial = [
    { id: 1, nombre: "admin", password: "admin", rol: "admin", penalizado: false, fechaFinPenalizacion: null },
    { id: 2, nombre: "user1", password: "1234", rol: "user", penalizado: false, fechaFinPenalizacion: null },
    { id: 3, nombre: "user2", password: "1234", rol: "user", penalizado: false, fechaFinPenalizacion: null }
  ];
  localStorage.setItem(KEYS.usuarios, JSON.stringify(inicial));
  return inicial;
}

// guarda el array de usuarios actualizado
function setUsuarios(lista) {
  localStorage.setItem(KEYS.usuarios, JSON.stringify(lista));
}

// busca un usuario por su id
function getUsuarioById(id) {
  return getUsuarios().find(u => u.id === id);
}

// devuelve el array de libros, si no existe lo crea con libros de ejemplo
function getLibros() {
  const data = localStorage.getItem(KEYS.libros);
  if (data) return JSON.parse(data);

  // libros iniciales para que la app no este vacia al abrirla
  const inicial = [
    { id: 1, titulo: "El Quijote", autor: "Cervantes", genero: "Clasico", disponible: true },
    { id: 2, titulo: "1984", autor: "George Orwell", genero: "Distopia", disponible: true },
    { id: 3, titulo: "La Odisea", autor: "Homero", genero: "Epica", disponible: true },
    { id: 4, titulo: "Cien años de soledad", autor: "Gabriel Garcia Marquez", genero: "Realismo magico", disponible: true },
    { id: 5, titulo: "El señor de los anillos", autor: "J.R.R. Tolkien", genero: "Fantasia", disponible: true },
    { id: 6, titulo: "Crimen y castigo", autor: "Dostoyevski", genero: "Clasico", disponible: true }
  ];
  localStorage.setItem(KEYS.libros, JSON.stringify(inicial));
  return inicial;
}

// guarda el array de libros actualizado
function setLibros(lista) {
  localStorage.setItem(KEYS.libros, JSON.stringify(lista));
}

// devuelve todos los prestamos o un array vacio si no hay ninguno
function getPrestamos() {
  const data = localStorage.getItem(KEYS.prestamos);
  return data ? JSON.parse(data) : [];
}

// guarda el array de prestamos
function setPrestamos(lista) {
  localStorage.setItem(KEYS.prestamos, JSON.stringify(lista));
}

// devuelve el usuario que tiene la sesion activa o null si no hay sesion
function getSesion() {
  const data = localStorage.getItem(KEYS.sesion);
  return data ? JSON.parse(data) : null;
}

// guarda el usuario en sesion
function setSesion(usuario) {
  localStorage.setItem(KEYS.sesion, JSON.stringify(usuario));
}

// borra la sesion y manda al login
function cerrarSesion() {
  localStorage.removeItem(KEYS.sesion);
  window.location.href = "login.html";
}

// devuelve solo los prestamos activos de un usuario concreto
function getPrestamosActivos(idUsuario) {
  return getPrestamos().filter(p => p.idUsuario === idUsuario && !p.devuelto);
}

// comprueba si un prestamo ha pasado su fecha limite y no se ha devuelto
function isVencido(prestamo) {
  return new Date() > new Date(prestamo.fechaDevolucion) && !prestamo.devuelto;
}

// genera el siguiente id disponible para un array
function nextId(lista) {
  return lista.length === 0 ? 1 : Math.max(...lista.map(x => x.id)) + 1;
}

// revisa todos los prestamos y aplica o levanta penalizaciones automaticamente
function verificarPenalizaciones() {
  const prestamos = getPrestamos();
  const usuarios = getUsuarios();
  const config = getConfig();
  let cambio = false;

  // si un prestamo esta vencido y no tiene penalizacion aplicada, penalizo al usuario
  prestamos.forEach(p => {
    if (!p.devuelto && isVencido(p) && !p.penalizacionAplicada) {
      const u = usuarios.find(u => u.id === p.idUsuario);
      if (u && !u.penalizado) {
        const hasta = new Date();
        hasta.setDate(hasta.getDate() + config.maxDias);
        u.penalizado = true;
        u.fechaFinPenalizacion = hasta.toISOString();
        p.penalizacionAplicada = true;
        cambio = true;
      }
    }
  });

  // si la penalizacion ya expiro la quito automaticamente
  usuarios.forEach(u => {
    if (u.penalizado && u.fechaFinPenalizacion) {
      if (new Date() > new Date(u.fechaFinPenalizacion)) {
        u.penalizado = false;
        u.fechaFinPenalizacion = null;
        cambio = true;
      }
    }
  });

  // solo guardo si hubo algun cambio para no escribir en localStorage de mas
  if (cambio) {
    setUsuarios(usuarios);
    setPrestamos(prestamos);
  }
}