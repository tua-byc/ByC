// B&C — página de inicio

// Enlaces antiguos de la web de una sola página (byc.cl/#servicios, etc.)
const PAGINAS = {
    acerca: '/quienes-somos',
    equipo: '/quienes-somos#equipo',
    servicios: '/servicios',
    transacciones: '/transacciones',
    contacto: '/contacto',
};
const ancla = location.hash.slice(1);
if (PAGINAS[ancla]) location.replace(PAGINAS[ancla]);

// Intro con el logo: se quita al terminar o con un clic/tecla
const raiz = document.documentElement;
const intro = document.getElementById('intro');
function terminarIntro(saltada) {
    if (!raiz.classList.contains('intro-activa')) return;
    try { sessionStorage.setItem('byc-intro', '1'); } catch (e) {}
    raiz.classList.remove('intro-activa');
    // Si se salta antes de tiempo, el texto del hero entra de inmediato
    if (saltada) raiz.classList.remove('con-intro');
    intro.remove();
}
if (raiz.classList.contains('intro-activa')) {
    intro.addEventListener('animationend', e => { if (e.animationName === 'introSale') terminarIntro(false); });
    intro.addEventListener('click', () => terminarIntro(true));
    window.addEventListener('keydown', () => terminarIntro(true), { once: true });
    setTimeout(() => terminarIntro(false), 4500);
} else {
    intro.remove();
}

// Video del mar: solo se descarga en pantallas anchas y sin "reducir movimiento"
const video = document.querySelector('.hero-mar video');
const pantallaAncha = window.matchMedia('(min-width: 861px)');
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
function cargarVideo() {
    if (!video || video.src || sinMovimiento.matches) return;
    video.src = video.dataset.src;
    video.play().catch(() => {});
}
if (pantallaAncha.matches) cargarVideo();
else pantallaAncha.addEventListener('change', e => { if (e.matches) cargarVideo(); });
