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
