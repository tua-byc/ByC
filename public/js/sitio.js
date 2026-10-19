// B&C — comportamiento común a todas las páginas

// Cabecera: fondo sólido al bajar
const cabecera = document.getElementById('cabecera');
function marcarScroll() { cabecera.classList.toggle('scrolled', window.scrollY > 40); }
window.addEventListener('scroll', marcarScroll, { passive: true });
marcarScroll();

// Menú en celular
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
    const abierto = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', abierto);
    if (abierto) cabecera.classList.add('scrolled');
    else marcarScroll();
});

// Aparición suave de bloques al hacer scroll
const observador = new IntersectionObserver(entradas => {
    entradas.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            observador.unobserve(e.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observador.observe(el));

// Barra de indicadores (datos que el deploy deja en /data/indicadores.json)
const ticker = document.getElementById('ticker');
const FORMATOS = {
    pesos: v => '$' + v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    pesos0: v => '$' + v.toLocaleString('es-CL', { maximumFractionDigits: 0 }),
    porcentaje: v => v.toLocaleString('es-CL', { maximumFractionDigits: 2 }) + '%',
    dolarLibra: v => 'US$' + v.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '/lb',
};
if (ticker) {
    fetch('/data/indicadores.json', { cache: 'no-cache' })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(({ items }) => {
            if (!items || !items.length) return;
            const grupo = document.createElement('div');
            grupo.className = 'ticker-grupo';
            items.forEach(i => {
                const formato = FORMATOS[i.formato] || FORMATOS.pesos;
                const item = document.createElement('span');
                item.className = 'ticker-item';
                item.innerHTML = `<b></b><span></span>`;
                item.querySelector('b').textContent = i.etiqueta;
                item.querySelector('span').textContent = formato(i.valor);
                grupo.appendChild(item);
            });
            const pista = ticker.querySelector('.ticker-pista');
            // Se repite el grupo hasta llenar el ancho y luego se duplica para el bucle sin salto
            pista.appendChild(grupo);
            ticker.hidden = false; // visible antes de medir
            const anchoGrupo = grupo.scrollWidth || 1;
            const repeticiones = Math.min(6, Math.ceil((window.innerWidth * 1.2) / anchoGrupo));
            for (let i = 1; i < repeticiones; i++) pista.appendChild(grupo.cloneNode(true));
            [...pista.children].forEach(g => {
                const copia = g.cloneNode(true);
                copia.setAttribute('aria-hidden', 'true');
                pista.appendChild(copia);
            });
        })
        .catch(() => {});
}

// Transacciones: mostrar todos los logos
const botonLogos = document.getElementById('showMoreBtn');
if (botonLogos) {
    botonLogos.addEventListener('click', () => {
        const visibles = document.getElementById('logosMore').classList.toggle('visible');
        botonLogos.setAttribute('aria-expanded', visibles);
        botonLogos.textContent = visibles ? 'Ver menos' : 'Ver todas las transacciones';
    });
}
