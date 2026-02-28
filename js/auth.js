// auth.js - controla el login y protege las páginas

document.addEventListener("DOMContentLoaded", function() {
  verificarPenalizaciones();

  const sesion = getSesion();

  configurarNavbar(sesion);

  // comprueba si estamos en la página de login mirando si existe el botón de entrar
  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    manejarLogin(sesion);
  } else {
    protegerPagina(sesion);
  }
});


// ─── Navbar ───────────────────────────────────────────────────────────────────

function configurarNavbar(sesion) {
  const navUser   = document.getElementById("navUser");
  const navAdmin  = document.getElementById("navAdmin");
  const btnLogout = document.getElementById("btnLogout");

  // muestra el nombre del usuario en la barra de navegación
  if (navUser && sesion) {
    navUser.textContent = sesion.nombre;
  }

  // muestra el enlace de admin solo si el usuario tiene rol admin
  if (navAdmin && sesion && sesion.rol === "admin") {
    navAdmin.classList.remove("hidden");
  }

  // engancha el botón de salir
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }
}


// ─── Login ────────────────────────────────────────────────────────────────────

function manejarLogin(sesion) {
  // si ya tiene sesión activa no necesita estar en el login
  if (sesion) {
    window.location.href = "catalogo.html";
    return;
  }

  const errorDiv = document.getElementById("loginError");

  document.getElementById("btnLogin").addEventListener("click", function() {
    intentarLogin(errorDiv);
  });

  // permite hacer login pulsando Enter en el campo de contraseña
  document.getElementById("password").addEventListener("keydown", function(e) {
    if (e.key === "Enter") intentarLogin(errorDiv);
  });
}

function intentarLogin(errorDiv) {
  const nombre  = document.getElementById("usuario").value.trim();
  const pass    = document.getElementById("password").value.trim();
  const usuarios = getUsuarios();

  // busca un usuario que tenga ese nombre y esa contraseña
  let usuarioEncontrado = null;
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].nombre === nombre && usuarios[i].password === pass) {
      usuarioEncontrado = usuarios[i];
      break;
    }
  }

  if (!usuarioEncontrado) {
    errorDiv.textContent = "Usuario o contraseña incorrectos.";
    errorDiv.classList.remove("hidden");
    return;
  }

  setSesion(usuarioEncontrado);
  window.location.href = "catalogo.html";
}


// ─── Protección de páginas ────────────────────────────────────────────────────

function protegerPagina(sesion) {
  // si no hay sesión manda al login
  if (!sesion) {
    window.location.href = "login.html";
    return;
  }

  // si un usuario normal intenta entrar al panel de admin, lo manda al catálogo
  const enPaginaAdmin = window.location.pathname.includes("admin.html");
  if (enPaginaAdmin && sesion.rol !== "admin") {
    window.location.href = "catalogo.html";
  }
}