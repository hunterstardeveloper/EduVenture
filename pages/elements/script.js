<<<<<<< HEAD
lucide.createIcons();
const openBtn = document.getElementById('openMenu');
const closeBtn = document.getElementById('closeMenu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}
openBtn.addEventListener('click', toggleMenu);
closeBtn.addEventListener('click', toggleMenu);
=======
lucide.createIcons();
const openBtn = document.getElementById('openMenu');
const closeBtn = document.getElementById('closeMenu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
function toggleMenu() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}
openBtn.addEventListener('click', toggleMenu);
closeBtn.addEventListener('click', toggleMenu);
>>>>>>> 5190efbbfc004e7f2b1521b7378bb9023f978c2c
overlay.addEventListener('click', toggleMenu);