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
overlay.addEventListener('click', toggleMenu);