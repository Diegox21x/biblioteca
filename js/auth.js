// auth.js - autenticacion y control de sesion

document.addEventListener("DOMContentLoaded", () => {
  // compruebo si hay penalizaciones al cargar cualquier pagina
  verificarPenalizaciones();

  // si existe el boton de logout lo engancho al cerrar sesion
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }

  // muestro el nombre del usuario en la navbar si hay sesion activa
  const navUser = document.getElementById("navUser");
  const sesion = getSesion();
  if (navUser && sesion) {
    navUser.textContent = `👤 ${sesion.nombre}`;
  }

  // si el usuario es admin muestro el enlace al panel de admin
  const navAdmin = document.getElementById("navAdmin");
  if (navAdmin && sesion && sesion.rol === "admin") {
    navAdmin.classList.remove("hidden");
  }

  // esto solo se ejecuta en la pagina de login
  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    // si ya tiene sesion no tiene sentido estar en el login, lo mando al catalogo
    if (sesion) {
      window.location.href = "catalogo.html";
      return;
    }

    // cuando pulsa el boton de entrar compruebo usuario y contraseña
    btnLogin.addEventListener("click", () => {
      const nombre = document.getElementById("usuario").value.trim();
      const pass = document.getElementById("password").value.trim();
      const errorDiv = document.getElementById("loginError");

      // busco el usuario en el array que coincida con nombre y password
      const usuarios = getUsuarios();
      const usuario = usuarios.find(u => u.nombre === nombre && u.password === pass);

      // si no existe muestro el error
      if (!usuario) {
        errorDiv.textContent = "❌ Usuario o contraseña incorrectos.";
        errorDiv.classList.remove("hidden");
        return;
      }

      // si existe guardo la sesion y voy al catalogo
      setSesion(usuario);
      window.location.href = "catalogo.html";
    });

    // tambien funciona pulsando enter en el campo de contraseña
    document.getElementById("password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("btnLogin").click();
    });

    return;
  }

  // si no hay sesion y no estamos en login, mando al login
  if (!sesion) {
    window.location.href = "login.html";
    return;
  }

  // si un usuario normal intenta entrar al admin lo mando al catalogo
  if (window.location.pathname.includes("admin.html") && sesion.rol !== "admin") {
    window.location.href = "catalogo.html";
  }
});