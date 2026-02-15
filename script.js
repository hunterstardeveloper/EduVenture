<<<<<<< HEAD
const Duration_time = 4200;
document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splash-screen");

  setTimeout(() => {
    if (splashScreen) splashScreen.classList.add("fade-out");

    setTimeout(() => {
      // ✅ Also make redirect safe for subfolder deployments
      window.location.href = new URL("./pages/auth/reg.html", window.location.href).pathname;
    }, 600);
  }, Duration_time);
});
=======
const Duration_time = 4200;
document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splash-screen");

  setTimeout(() => {
    if (splashScreen) splashScreen.classList.add("fade-out");

    setTimeout(() => {
      // ✅ Also make redirect safe for subfolder deployments
      window.location.href = new URL("./pages/auth/reg.html", window.location.href).pathname;
    }, 600);
  }, Duration_time);
});
>>>>>>> 5190efbbfc004e7f2b1521b7378bb9023f978c2c
