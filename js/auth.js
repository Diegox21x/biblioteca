// auth.js - autenticación y control de sesión

document.addEventListener("DOMContentLoaded", () => {
  verificarPenalizaciones();

  const sesion = getSesion();

  configurarNavbar(sesion);

  if (document.getElementById("btnLogin")) {
    iniciarPaginaLogin(sesion);
  } else {
    protegerPagina(sesion);
  }
});


// ─── Navbar ───────────────────────────────────────────────────────────────────

function configurarNavbar(sesion) {
  const navUser  = document.getElementById("navUser");
  const navAdmin = document.getElementById("navAdmin");
  const btnLogout = document.getElementById("btnLogout");

  if (navUser && sesion)    navUser.textContent = sesion.nombre;
  if (navAdmin && sesion?.rol === "admin") navAdmin.classList.remove("hidden");
  if (btnLogout)            btnLogout.addEventListener("click", cerrarSesion);
}


// ─── Login ────────────────────────────────────────────────────────────────────

function iniciarPaginaLogin(sesion) {
  // si ya tiene sesión no necesita estar aquí
  if (sesion) {
    window.location.href = "catalogo.html";
    return;
  }

  const btnLogin  = document.getElementById("btnLogin");
  const errorDiv  = document.getElementById("loginError");

  btnLogin.addEventListener("click", () => intentarLogin(errorDiv));

  // también funciona pulsando Enter desde el campo de contraseña
  document.getElementById("password").addEventListener("keydown", e => {
    if (e.key === "Enter") intentarLogin(errorDiv);
  });
}

function intentarLogin(errorDiv) {
  const nombre = document.getElementById("usuario").value.trim();
  const pass   = document.getElementById("password").value.trim();

  const usuario = getUsuarios().find(u => u.nombre === nombre && u.password === pass);

  if (!usuario) {
    errorDiv.textContent = "Usuario o contraseña incorrectos.";
    errorDiv.classList.remove("hidden");
    return;
  }

  setSesion(usuario);
  window.location.href = "catalogo.html";
}


// ─── Protección de páginas ────────────────────────────────────────────────────

function protegerPagina(sesion) {
  if (!sesion) {
    window.location.href = "login.html";
    return;
  }

  const esAdmin = sesion.rol === "admin";
  const enAdmin = window.location.pathname.includes("admin.html");

  if (enAdmin && !esAdmin) {
    window.location.href = "catalogo.html";
  }
}