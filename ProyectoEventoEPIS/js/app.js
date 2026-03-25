
/**
 * Aplicación de Eventos Estudiantiles
 * Maneja: renderizado, filtros, búsqueda y countdown
 */

// Estado de la aplicación
const appState = {
    eventos: [],
    filtros: {
        categoria: 'all',
        modalidad: 'all',
        estado: 'all'
    },
    busqueda: '',
    orden: 'fechaAsc'
};

// Elementos del DOM
const DOM = {
    grid: document.getElementById('eventsGrid'),
    searchInput: document.getElementById('searchInput'),
    filterCategory: document.getElementById('filterCategory'),
    filterModality: document.getElementById('filterModality'),
    filterStatus: document.getElementById('filterStatus'),
    filterSort: document.getElementById('filterSort'),
    clearFilters: document.getElementById('clearFilters'),
    eventsCount: document.getElementById('eventsCount'),
    statTotalEvents: document.getElementById('statTotalEvents'),
    statUpcoming: document.getElementById('statUpcoming'),
    statHackathons: document.getElementById('statHackathons'),
    noResults: document.getElementById('noResults'),
    resetSearch: document.getElementById('resetSearch'),
    openUpcomingAlert: document.getElementById('openUpcomingAlert'),
    closeUpcomingPanel: document.getElementById('closeUpcomingPanel'),
    upcomingPanel: document.getElementById('upcomingPanel'),
    upcomingList: document.getElementById('upcomingList')
};

// =========================================
// INICIALIZACIÓN
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos
    appState.eventos = Array.isArray(eventosData) ? [...eventosData] : [];
    
    // Renderizar eventos
    renderEventos(filtrarEventos());
    
    // Configurar event listeners
    setupEventListeners();

    // Actualizar bloque visual de impacto
    actualizarEstadisticasHero();
    
    // Actualizar contador
    actualizarContador();
});

// =========================================
// EVENT LISTENERS
// =========================================
function setupEventListeners() {
    // Búsqueda en tiempo real
    DOM.searchInput.addEventListener('input', (e) => {
        appState.busqueda = e.target.value.toLowerCase().trim();
        renderEventos(filtrarEventos());
    });
    
    // Filtros
    DOM.filterCategory.addEventListener('change', (e) => {
        appState.filtros.categoria = e.target.value;
        renderEventos(filtrarEventos());
    });
    
    DOM.filterModality.addEventListener('change', (e) => {
        appState.filtros.modalidad = e.target.value;
        renderEventos(filtrarEventos());
    });
    
    DOM.filterStatus.addEventListener('change', (e) => {
        appState.filtros.estado = e.target.value;
        renderEventos(filtrarEventos());
    });

    DOM.filterSort?.addEventListener('change', (e) => {
        appState.orden = e.target.value;
        renderEventos(filtrarEventos());
    });
    
    // Limpiar filtros
    DOM.clearFilters.addEventListener('click', () => {
        appState.filtros = { categoria: 'all', modalidad: 'all', estado: 'all' };
        appState.busqueda = '';
        appState.orden = 'fechaAsc';
        DOM.searchInput.value = '';
        DOM.filterCategory.value = 'all';
        DOM.filterModality.value = 'all';
        DOM.filterStatus.value = 'all';
        if (DOM.filterSort) DOM.filterSort.value = 'fechaAsc';
        renderEventos(filtrarEventos());
    });
    
    // Resetear búsqueda desde "no results"
    DOM.resetSearch?.addEventListener('click', () => {
        appState.busqueda = '';
        DOM.searchInput.value = '';
        renderEventos(filtrarEventos());
    });

    // Acciones de cards y panel de proximos
    DOM.grid?.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-action="launch-whatsapp"]');
        if (!boton) return;

        const evento = obtenerEventoPorId(boton.dataset.eventId);
        if (!evento) return;

        reproducirEfectoArranque();
        enviarEventoWhatsApp(evento);
    });

    DOM.openUpcomingAlert?.addEventListener('click', () => {
        actualizarPanelProximos();
        DOM.upcomingPanel?.classList.remove('hidden');
        DOM.upcomingPanel?.setAttribute('aria-hidden', 'false');
    });

    DOM.closeUpcomingPanel?.addEventListener('click', cerrarPanelProximos);

    DOM.upcomingPanel?.addEventListener('click', (e) => {
        if (e.target === DOM.upcomingPanel) {
            cerrarPanelProximos();
            return;
        }

        const boton = e.target.closest('[data-action="upcoming-whatsapp"]');
        if (!boton) return;

        const evento = obtenerEventoPorId(boton.dataset.eventId);
        if (!evento) return;

        reproducirEfectoArranque();
        enviarEventoWhatsApp(evento);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarPanelProximos();
        }
    });
}

// =========================================
// FILTRADO DE EVENTOS
// =========================================
function filtrarEventos() {
    const filtrados = appState.eventos.filter(evento => {
        // Filtro por búsqueda
        if (appState.busqueda) {
            const textoBusqueda = 
                `${evento.nombre} ${evento.categoria} ${evento.institucion} ${evento.lugar}`;
            if (!normalizarTexto(textoBusqueda).includes(normalizarTexto(appState.busqueda))) return false;
        }
        
        // Filtro por categoría
        if (
            appState.filtros.categoria !== 'all' &&
            normalizarTexto(evento.categoria) !== normalizarTexto(appState.filtros.categoria)
        ) {
            return false;
        }
        
        // Filtro por modalidad
        if (
            appState.filtros.modalidad !== 'all' &&
            normalizarTexto(evento.modalidad) !== normalizarTexto(appState.filtros.modalidad)
        ) {
            return false;
        }
        
        // Filtro por estado
        if (
            appState.filtros.estado !== 'all' &&
            normalizarTexto(obtenerEstadoEfectivo(evento)) !== normalizarTexto(appState.filtros.estado)
        ) {
            return false;
        }
        
        return true;
    });

    return ordenarEventos(filtrados);
}

function ordenarEventos(eventos) {
    const copia = [...eventos];

    if (appState.orden === 'nombreAsc') {
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }

    if (appState.orden === 'fechaDesc') {
        return copia.sort((a, b) => parseFechaSeguroEvento(b) - parseFechaSeguroEvento(a));
    }

    return copia.sort((a, b) => compararPorCercaniaFecha(a, b));
}

function compararPorCercaniaFecha(a, b) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaA = obtenerFechaEventoEfectiva(a);
    const fechaB = obtenerFechaEventoEfectiva(b);

    const aValida = !Number.isNaN(fechaA.getTime());
    const bValida = !Number.isNaN(fechaB.getTime());

    // Si una fecha no es valida, se manda al final.
    if (!aValida && !bValida) return 0;
    if (!aValida) return 1;
    if (!bValida) return -1;

    const deltaA = fechaA.getTime() - hoy.getTime();
    const deltaB = fechaB.getTime() - hoy.getTime();

    const aFuturo = deltaA >= 0;
    const bFuturo = deltaB >= 0;

    // Se priorizan eventos de hoy y futuros.
    if (aFuturo && !bFuturo) return -1;
    if (!aFuturo && bFuturo) return 1;

    if (aFuturo && bFuturo) {
        // Entre futuros: primero el que llega antes.
        return fechaA.getTime() - fechaB.getTime();
    }

    // Entre pasados: primero el mas reciente.
    return fechaB.getTime() - fechaA.getTime();
}

// =========================================
// RENDERIZADO DE EVENTOS
// =========================================
function renderEventos(eventos) {
    DOM.grid.innerHTML = '';
    
    if (eventos.length === 0) {
        DOM.noResults.classList.remove('hidden');
        if (DOM.eventsCount) DOM.eventsCount.textContent = '0';
        return;
    }
    
    DOM.noResults.classList.add('hidden');
    
    eventos.forEach((evento, index) => {
        const card = crearCardEvento(evento, index);
        DOM.grid.appendChild(card);
    });
    
    actualizarContador(eventos.length);
    actualizarEstadisticasHero(eventos.length);
}

function crearCardEvento(evento, index) {
    const article = document.createElement('article');
    article.className = 'evento-card';
    if (esEventoFinalizado(evento)) article.classList.add('evento-finalizado');
    article.style.setProperty('--i', index);
    
    // Determinar clase de ícono según categoría
    const categoriaClass = evento.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Badge de estado
    const estadoEfectivo = obtenerEstadoEfectivo(evento);
    const estadoBadge = obtenerEstadoBadge(estadoEfectivo);
    // Duración del evento
    const duracionHTML = evento.duracion ? `
        <span class="card-duration ${obtenerClaseDuracion(evento.duracion)}">
            <i class="fas fa-clock"></i> ${evento.duracion}
        </span>
    ` : '';
    // Badge de modalidad
    const modalidadBadge = obtenerModalidadBadge(evento.modalidad);

    // Imagen del evento con fallback por categoria
    const imagenEvento = evento.imagen || obtenerImagenCategoria(evento.categoria);
    
    // Countdown (solo si es proximo o confirmado con fecha efectiva futura)
    const fechaEfectiva = obtenerFechaEventoEfectiva(evento);
    const countdownHTML = generarCountdown(fechaEfectiva, estadoEfectivo);
    
    // Formatear fecha para mostrar (considerando repeticion anual opcional)
    const fechaFormateada = formatearFechaEvento(evento);
    const cierreFormateado = evento.cierreInscripcion ? formatearFecha(evento.cierreInscripcion) : 'Por definir';
    
    // Limpiar lugar muy largo
    const lugarCorto = evento.lugar.length > 40 ? evento.lugar.substring(0, 40) + '...' : evento.lugar;
    
    article.innerHTML = `
    <span class="card-status ${estadoBadge.class}">
        ${estadoBadge.icon} ${estadoBadge.label}
    </span>
    ${esEventoFinalizado(evento) ? '<span class="card-watermark">CERRADO</span>' : ''}
    
    <div class="card-media">
        <img
            src="${imagenEvento}"
            alt="Afiche o foto del evento ${evento.nombre}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${obtenerImagenCategoria(evento.categoria)}';"
        />
        <div class="card-icon ${categoriaClass}">
            <i class="fas ${obtenerIconoCategoria(evento.categoria)}"></i>
        </div>
        <span class="card-media-label">${evento.categoria}</span>
    </div>

    <div class="card-hover-preview" aria-hidden="true">
        <img
            src="${imagenEvento}"
            alt="Vista previa ${evento.nombre}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${obtenerImagenCategoria(evento.categoria)}';"
        />
    </div>
    
    <div class="card-content">
        <span class="card-category">
            <i class="fas fa-tag"></i> ${evento.categoria}
        </span>
        
        <h3 class="card-title">${evento.nombre}</h3>
        
        ${evento.institucion ? `
        <p class="card-institution">
            <i class="fas fa-university"></i> ${evento.institucion}
        </p>` : ''}
        
        ${duracionHTML}  
                                    
            <div class="card-info">
                <div class="info-item">
                    <span class="info-label">Fecha</span>
                    <span class="info-value">📅 ${fechaFormateada}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Inscripciones</span>
                    <span class="info-value">⏰ ${cierreFormateado}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Modalidad</span>
                    <span class="info-value modalidad-badge ${modalidadBadge.class}">${modalidadBadge.icon} ${evento.modalidad}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Lugar</span>
                    <span class="info-value">📍 ${lugarCorto}</span>
                </div>
            </div>
            
            ${countdownHTML}
            
            <div class="card-footer">
                <span class="card-location">
                    <i class="fas fa-map-marker-alt"></i> ${evento.lugar.split('/')[0].trim()}
                </span>

                <div class="card-actions">
                    ${esEventoFinalizado(evento) ? `
                    <button class="btn-event secondary" type="button" disabled>
                        Archivado
                    </button>` : `
                    <button
                        class="btn-event btn-event-launch"
                        type="button"
                        data-action="launch-whatsapp"
                        data-event-id="${evento.id}"
                    >
                        Arrancar
                    </button>`}
                    ${evento.link ? `
                    <a href="${evento.link}" target="_blank" rel="noopener noreferrer" class="btn-event">
                        ${esEventoFinalizado(evento) ? 'Ver cierre' : 'Ver más'} <i class="fas fa-external-link-alt"></i>
                    </a>` : `
                    <button class="btn-event secondary" disabled>
                        Próximamente
                    </button>`}
                </div>
            </div>
        </div>
    `;
    
    return article;
}

// =========================================
// UTILIDADES VISUALES
// =========================================
function obtenerEstadoBadge(estado) {
    const estados = {
        'Confirmado': { class: 'confirmado', icon: '✅', label: 'Confirmado' },
        'Próximo': { class: 'proximo', icon: '🔜', label: 'Próximo' },
        'Pendiente': { class: 'pendiente', icon: '⏳', label: 'Pendiente' },
        'Realizado': { class: 'realizado', icon: '✨', label: 'Realizado' },
        'Finalizado': { class: 'finalizado', icon: '📚', label: 'Finalizado' }
    };
    return estados[estado] || { class: 'pendiente', icon: '⏳', label: 'Pendiente' };
}

function obtenerEstadoEfectivo(evento) {
    if (esEventoFinalizado(evento)) return 'Finalizado';

    // Si se repite cada año, se vuelve a considerar próximo si ya estaba marcado como realizado.
    if (esEventoRepetible(evento) && normalizarTexto(evento.estado) === 'realizado') {
        return 'Próximo';
    }

    return evento.estado || 'Pendiente';
}

function esEventoFinalizado(evento) {
    const fecha = obtenerFechaEventoEfectiva(evento);
    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fecha < hoy;
}

function esEventoRepetible(evento) {
    return evento.repetirProximoAnio === true || normalizarTexto(evento.repetible) === 'si';
}

function obtenerFechaEventoEfectiva(evento) {
    const fechaBase = new Date(`${evento.fechaEvento || ''}T00:00:00`);
    if (Number.isNaN(fechaBase.getTime())) return fechaBase;

    if (!esEventoRepetible(evento)) return fechaBase;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fecha = new Date(fechaBase);
    fecha.setHours(0, 0, 0, 0);

    while (fecha < hoy) {
        fecha.setFullYear(fecha.getFullYear() + 1);
    }

    return fecha;
}

function obtenerModalidadBadge(modalidad) {
    const modalidades = {
        'Presencial': { class: 'presencial', icon: '🏢' },
        'Virtual': { class: 'virtual', icon: '💻' },
        'Híbrido': { class: 'hibrido', icon: '🔄' }
    };
    return modalidades[modalidad] || { class: 'presencial', icon: '🏢' };
}

function obtenerIconoCategoria(categoria) {
    const iconos = {
        'Hackathon': 'fa-code',
        'Congreso': 'fa-microphone-alt',
        'Feria': 'fa-store',
        'Foro': 'fa-comments',
        'Seminario': 'fa-chalkboard-teacher',
        'Exposición': 'fa-image'
    };
    return iconos[categoria] || 'fa-calendar-alt';
}

function obtenerImagenCategoria(categoria) {
    const imagenes = {
        Hackathon: 'img/evento-hackathon.svg',
        Congreso: 'img/evento-congreso.svg',
        Feria: 'img/evento-feria.svg',
        Foro: 'img/evento-foro.svg',
        Seminario: 'img/evento-seminario.svg',
        Exposición: 'img/evento-exposicion.svg'
    };
    return imagenes[categoria] || 'img/evento-default.svg';
}

function obtenerClaseDuracion(duracion) {
    const texto = normalizarTexto(duracion);
    const dias = Number.parseInt(texto, 10);

    if (texto.includes('hora')) return 'corta';
    if (!Number.isNaN(dias) && dias >= 2) return 'larga';

    return '';
}

function formatearFecha(fechaString) {
    if (!fechaString) return 'Por definir';
    
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    const fecha = new Date(fechaString + 'T00:00:00'); // Fix timezone
    
    if (isNaN(fecha.getTime())) return fechaString;
    
    return fecha.toLocaleDateString('es-PE', opciones);
}

function formatearFechaEvento(evento) {
    const fecha = obtenerFechaEventoEfectiva(evento);
    if (Number.isNaN(fecha.getTime())) return 'Por definir';

    return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function parseFechaSeguroEvento(evento) {
    const fecha = obtenerFechaEventoEfectiva(evento);
    return Number.isNaN(fecha.getTime()) ? Number.MAX_SAFE_INTEGER : fecha.getTime();
}

function parseFechaSeguro(fechaString) {
    const fecha = new Date(`${fechaString || ''}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? Number.MAX_SAFE_INTEGER : fecha.getTime();
}

function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function generarCountdown(fechaEvento, estado) {
    // Solo mostrar countdown para eventos próximos o confirmados con fecha futura
    if (estado !== 'Próximo' && estado !== 'Confirmado') return '';

    const fecha = fechaEvento instanceof Date
        ? new Date(fechaEvento)
        : new Date(`${fechaEvento || ''}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fecha < hoy) return '';
    
    const diffTime = fecha - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) return ''; // No mostrar si falta mucho
    
    return `
        <div class="countdown">
            <div class="countdown-item">
                <span class="countdown-value">${String(diffDays).padStart(2, '0')}</span>
                <span class="countdown-label">días</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-value">${String(Math.floor((diffTime % (1000*60*60*24)) / (1000*60*60))).padStart(2, '0')}</span>
                <span class="countdown-label">hrs</span>
            </div>
        </div>
    `;
}

function actualizarContador(cantidad = null) {
    const total = cantidad !== null ? cantidad : filtrarEventos().length;
    if (DOM.eventsCount) DOM.eventsCount.textContent = total;
}

function actualizarEstadisticasHero(totalFiltrados = null) {
    if (!DOM.statTotalEvents || !DOM.statUpcoming || !DOM.statHackathons) return;

    const totalEventos = appState.eventos.length;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximos = appState.eventos.filter((evento) => {
        const fecha = obtenerFechaEventoEfectiva(evento);
        return !Number.isNaN(fecha.getTime()) && fecha >= hoy;
    }).length;

    const hackathons = appState.eventos.filter(
        (evento) => normalizarTexto(evento.categoria) === 'hackathon'
    ).length;

    DOM.statTotalEvents.textContent = String(totalEventos);
    DOM.statUpcoming.textContent = String(proximos);
    DOM.statHackathons.textContent = String(hackathons);

    if (totalFiltrados !== null) {
        DOM.statTotalEvents.title = `Mostrando ${totalFiltrados} segun tus filtros`;
    }
}

function obtenerEventoPorId(id) {
    return appState.eventos.find((evento) => String(evento.id) === String(id));
}

function obtenerEventosProximos() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return [...appState.eventos]
        .filter((evento) => {
            const fecha = obtenerFechaEventoEfectiva(evento);
            const esFutura = !Number.isNaN(fecha.getTime()) && fecha >= hoy;
            const estado = obtenerEstadoEfectivo(evento);
            const esEstadoValido = estado === 'Próximo' || estado === 'Confirmado';
            return esFutura && esEstadoValido;
        })
        .sort((a, b) => parseFechaSeguroEvento(a) - parseFechaSeguroEvento(b))
        .slice(0, 6);
}

function actualizarPanelProximos() {
    if (!DOM.upcomingList) return;

    const proximos = obtenerEventosProximos();

    if (proximos.length === 0) {
        DOM.upcomingList.innerHTML = '<p class="upcoming-empty">No hay eventos proximos por ahora.</p>';
        return;
    }

    DOM.upcomingList.innerHTML = proximos
        .map(
            (evento) => `
            <article class="upcoming-item">
                <div>
                    <h4>${evento.nombre}</h4>
                    <p>${formatearFechaEvento(evento)} · ${evento.modalidad}</p>
                </div>
                <button class="btn-event btn-event-whatsapp" type="button" data-action="upcoming-whatsapp" data-event-id="${evento.id}">
                    WhatsApp
                </button>
            </article>
        `
        )
        .join('');
}

function cerrarPanelProximos() {
    DOM.upcomingPanel?.classList.add('hidden');
    DOM.upcomingPanel?.setAttribute('aria-hidden', 'true');
}

function enviarEventoWhatsApp(evento) {
    const mensaje = [
        'Hola, quiero este evento:',
        `*${evento.nombre}*`,
        `Fecha: ${formatearFechaEvento(evento)}`,
        `Modalidad: ${evento.modalidad}`,
        `Lugar: ${evento.lugar}`,
        evento.link ? `Link: ${evento.link}` : 'Link: Por definir'
    ].join('\n');

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function reproducirEfectoArranque() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
        const context = new AudioCtx();
        const masterGain = context.createGain();
        const filter = context.createBiquadFilter();
        const oscillator = context.createOscillator();
        const layerOscillator = context.createOscillator();
        const duration = 1.2;

        // Timbre mas suave, menos agresivo
        oscillator.type = 'sine';
        layerOscillator.type = 'triangle';

        oscillator.frequency.setValueAtTime(210, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(320, context.currentTime + duration);

        layerOscillator.frequency.setValueAtTime(140, context.currentTime);
        layerOscillator.frequency.exponentialRampToValueAtTime(190, context.currentTime + duration);

        // Filtro para efecto "corte suave"
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, context.currentTime);
        filter.frequency.linearRampToValueAtTime(450, context.currentTime + duration);
        filter.Q.value = 1.2;

        // Menos volumen y envolvente lenta (ASMR-like)
        masterGain.gain.setValueAtTime(0.0001, context.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.35);
        masterGain.gain.linearRampToValueAtTime(0.028, context.currentTime + 0.8);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

        oscillator.connect(filter);
        layerOscillator.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(context.destination);

        oscillator.start();
        layerOscillator.start();

        oscillator.stop(context.currentTime + duration);
        layerOscillator.stop(context.currentTime + duration);

        layerOscillator.onended = () => context.close();
    } catch (error) {
        console.warn('No se pudo reproducir el efecto de arranque.', error);
    }
}
