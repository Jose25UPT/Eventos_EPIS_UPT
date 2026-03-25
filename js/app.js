
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
        estado: 'all',
        semestre: 'all',
        anio: 'all'
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
    filterSemester: document.getElementById('filterSemester'),
    filterYear: document.getElementById('filterYear'),
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
    upcomingList: document.getElementById('upcomingList'),
    eventDetailModal: document.getElementById('eventDetailModal'),
    eventDetailBody: document.getElementById('eventDetailBody'),
    closeEventDetail: document.getElementById('closeEventDetail')
};

// =========================================
// INICIALIZACIÓN
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos
    appState.eventos = Array.isArray(eventosData) ? [...eventosData] : [];
    poblarFiltroSemestre();
    poblarFiltroAnio();
    
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

    DOM.filterSemester?.addEventListener('change', (e) => {
        appState.filtros.semestre = e.target.value;
        renderEventos(filtrarEventos());
    });

    DOM.filterYear?.addEventListener('change', (e) => {
        appState.filtros.anio = e.target.value;
        renderEventos(filtrarEventos());
    });

    DOM.filterSort?.addEventListener('change', (e) => {
        appState.orden = e.target.value;
        renderEventos(filtrarEventos());
    });
    
    // Limpiar filtros
    DOM.clearFilters.addEventListener('click', () => {
        appState.filtros = { categoria: 'all', modalidad: 'all', estado: 'all', semestre: 'all', anio: 'all' };
        appState.busqueda = '';
        appState.orden = 'fechaAsc';
        DOM.searchInput.value = '';
        DOM.filterCategory.value = 'all';
        DOM.filterModality.value = 'all';
        DOM.filterStatus.value = 'all';
        if (DOM.filterSemester) DOM.filterSemester.value = 'all';
        if (DOM.filterYear) DOM.filterYear.value = 'all';
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
        const botonDetalles = e.target.closest('[data-action="open-details"]');
        if (botonDetalles) {
            const eventoDetalle = obtenerEventoPorId(botonDetalles.dataset.eventId);
            if (eventoDetalle) abrirDetalleEvento(eventoDetalle);
            return;
        }

        const boton = e.target.closest('[data-action="launch-whatsapp"]');
        if (!boton) return;

        const evento = obtenerEventoPorId(boton.dataset.eventId);
        if (!evento) return;

        reproducirEfectoArranque();
        enviarEventoWhatsApp(evento, 'recordatorio');
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
        enviarEventoWhatsApp(evento, 'recordatorio');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarPanelProximos();
            cerrarDetalleEvento();
        }
    });

    DOM.closeEventDetail?.addEventListener('click', cerrarDetalleEvento);

    DOM.eventDetailModal?.addEventListener('click', (e) => {
        if (e.target === DOM.eventDetailModal) {
            cerrarDetalleEvento();
            return;
        }

        const botonReminder = e.target.closest('[data-action="detail-whatsapp-reminder"]');
        if (botonReminder) {
            const evento = obtenerEventoPorId(botonReminder.dataset.eventId);
            if (!evento) return;

            reproducirEfectoArranque();
            enviarEventoWhatsApp(evento, 'recordatorio');
            return;
        }

        const botonShare = e.target.closest('[data-action="detail-whatsapp-share"]');
        if (!botonShare) return;

        const evento = obtenerEventoPorId(botonShare.dataset.eventId);
        if (!evento) return;

        reproducirEfectoArranque();
        enviarEventoWhatsApp(evento, 'compartir');
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

        // Filtro por semestre academico
        if (appState.filtros.semestre !== 'all') {
            const semestreEvento = obtenerSemestreAcademico(evento);
            if (semestreEvento !== appState.filtros.semestre) return false;
        }

        // Filtro por año
        if (appState.filtros.anio !== 'all') {
            const anioEvento = obtenerAnioEvento(evento);
            if (anioEvento !== appState.filtros.anio) return false;
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

    // Badge de estado
    const estadoEfectivo = obtenerEstadoEfectivo(evento);
    const estadoBadge = obtenerEstadoBadge(estadoEfectivo);

    // Imagen del evento con fallback por categoria
    const imagenEvento = evento.imagen || obtenerImagenCategoria(evento.categoria);

    const semestre = obtenerSemestreAcademico(evento);
    const fechaFormateada = formatearFechaEvento(evento);

    article.innerHTML = `
    <div class="card-media poster-media">
        <img
            src="${imagenEvento}"
            alt="Afiche o foto del evento ${evento.nombre}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${obtenerImagenCategoria(evento.categoria)}';"
        />
        ${esEventoFinalizado(evento) ? '<span class="card-watermark">CERRADO</span>' : ''}

        <span class="poster-ribbon">${estadoEfectivo === 'Próximo' ? 'Estreno' : 'Evento'}</span>
        <span class="card-status ${estadoBadge.class}">
            ${estadoBadge.icon} ${estadoBadge.label}
        </span>
    </div>

    <div class="poster-overlay">
        <span class="poster-category">${evento.categoria}</span>
        <h3 class="poster-title">${evento.nombre}</h3>

        <div class="poster-meta">
            <span>${fechaFormateada}</span>
            <span>${semestre}</span>
        </div>

        <button
            class="btn-event btn-poster-detail"
            type="button"
            data-action="open-details"
            data-event-id="${evento.id}"
        >
            Detalles
        </button>
    </div>
    `;
    
    return article;
}

function poblarFiltroSemestre() {
    if (!DOM.filterSemester) return;

    const semestres = [...new Set(appState.eventos.map(obtenerSemestreAcademico))]
        .filter(Boolean)
        .sort((a, b) => b.localeCompare(a));

    DOM.filterSemester.innerHTML = '<option value="all">Todos</option>';

    semestres.forEach((semestre) => {
        const opcion = document.createElement('option');
        opcion.value = semestre;
        opcion.textContent = semestre;
        DOM.filterSemester.appendChild(opcion);
    });
}

function poblarFiltroAnio() {
    if (!DOM.filterYear) return;

    const anios = [...new Set(appState.eventos.map(obtenerAnioEvento))]
        .filter((anio) => anio !== 'Sin año')
        .sort((a, b) => Number(b) - Number(a));

    DOM.filterYear.innerHTML = '<option value="all">Todos</option>';

    anios.forEach((anio) => {
        const opcion = document.createElement('option');
        opcion.value = anio;
        opcion.textContent = anio;
        DOM.filterYear.appendChild(opcion);
    });
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

function obtenerSemestreAcademico(evento) {
    const fecha = new Date(`${evento?.fechaEvento || ''}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return 'Sin semestre';

    const anio = fecha.getFullYear();
    const semestre = fecha.getMonth() + 1 <= 6 ? 'I' : 'II';
    return `${anio}-${semestre}`;
}

function obtenerAnioEvento(evento) {
    const fecha = new Date(`${evento?.fechaEvento || ''}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return 'Sin año';
    return String(fecha.getFullYear());
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
                    Recordatorio
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

function abrirDetalleEvento(evento) {
    if (!DOM.eventDetailBody || !DOM.eventDetailModal) return;

    const imagenEvento = evento.imagen || obtenerImagenCategoria(evento.categoria);
    const estado = obtenerEstadoBadge(obtenerEstadoEfectivo(evento));
    const fecha = formatearFechaEvento(evento);
    const modalidad = evento.modalidad || 'Por definir';
    const modalidadBadge = obtenerModalidadBadge(modalidad);
    const institucion = evento.institucion || 'Por definir';
    const lugar = evento.lugar || 'Por definir';
    const cierreInscripcion = evento.cierreInscripcion ? formatearFecha(evento.cierreInscripcion) : 'Por definir';
    const duracion = evento.duracion || 'Por definir';
    const semestre = obtenerSemestreAcademico(evento);
    const categoria = evento.categoria || 'General';
    const repetible = esEventoRepetible(evento) ? 'Si' : 'No';
    const notas = evento.notas || 'Evento activo en cartelera. Revisa el enlace principal para ver toda la informacion.';

    DOM.eventDetailBody.innerHTML = `
        <div class="event-detail-layout">
            <figure class="event-detail-poster">
                <img
                    src="${imagenEvento}"
                    alt="Afiche principal de ${evento.nombre}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${obtenerImagenCategoria(evento.categoria)}';"
                />
            </figure>

            <section class="event-detail-side">
                <span class="event-detail-state ${estado.class}">${estado.icon} ${estado.label}</span>
                <h3 id="eventDetailTitle">${evento.nombre}</h3>

                <div class="event-detail-kpis">
                    <div class="event-detail-kpi">
                        <span>Fecha</span>
                        <strong>${fecha}</strong>
                    </div>
                    <div class="event-detail-kpi">
                        <span>Modalidad</span>
                        <strong class="modalidad-badge ${modalidadBadge.class}">${modalidadBadge.icon} ${modalidad}</strong>
                    </div>
                </div>

                <div class="event-detail-facts">
                    <div class="event-detail-fact">
                        <span>Categoria</span>
                        <strong>${categoria}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Semestre</span>
                        <strong>${semestre}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Institucion</span>
                        <strong>${institucion}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Lugar</span>
                        <strong>${lugar}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Cierre inscripcion</span>
                        <strong>${cierreInscripcion}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Duracion</span>
                        <strong>${duracion}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Evento anual</span>
                        <strong>${repetible}</strong>
                    </div>
                    <div class="event-detail-fact">
                        <span>Responsable</span>
                        <strong>${evento.responsable || 'Por definir'}</strong>
                    </div>
                </div>

                <p class="event-detail-notes">${notas}</p>

                <div class="event-detail-actions">
                    ${evento.link ? `
                    <a href="${evento.link}" target="_blank" rel="noopener noreferrer" class="btn-event-detail-main">
                        Ir al evento
                    </a>` : `
                    <button class="btn-event-detail-main secondary" type="button" disabled>
                        Link por confirmar
                    </button>`}

                    <button class="btn-event-detail-main secondary" type="button" data-action="detail-whatsapp-reminder" data-event-id="${evento.id}">
                        Recordatorio
                    </button>

                    <button class="btn-event-detail-main secondary" type="button" data-action="detail-whatsapp-share" data-event-id="${evento.id}">
                        Compartir
                    </button>
                </div>
            </section>
        </div>
    `;

    DOM.eventDetailModal.classList.remove('hidden');
    DOM.eventDetailModal.setAttribute('aria-hidden', 'false');
}

function cerrarDetalleEvento() {
    DOM.eventDetailModal?.classList.add('hidden');
    DOM.eventDetailModal?.setAttribute('aria-hidden', 'true');
}

function enviarEventoWhatsApp(evento, tipo = 'recordatorio') {
    const mensaje = tipo === 'compartir'
        ? [
            'Te interesaria asistir a este evento?',
            `*${evento.nombre}*`,
            `Fecha: ${formatearFechaEvento(evento)}`,
            `Modalidad: ${evento.modalidad || 'Por definir'}`,
            evento.link ? `Link: ${evento.link}` : 'Link: Por definir'
        ].join('\n')
        : [
            'Deseo ir a este evento (recordatorio):',
            `*${evento.nombre}*`,
            `Fecha: ${formatearFechaEvento(evento)}`,
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
