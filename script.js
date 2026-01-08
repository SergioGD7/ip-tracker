// Variables globales
let map;
let marker;

// Inicializar el mapa al cargar la página (vista por defecto)
function initMap() {
    // Coordenadas por defecto (Centro del mundo o 0,0)
    map = L.map('map').setView([20, 0], 2);

    // Capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Manejar tecla Enter en el input
document.getElementById('ipInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        buscarIP();
    }
});

// Listener para el botón de búsqueda
document.getElementById('btnBuscar').addEventListener('click', buscarIP);

// Función principal de búsqueda
async function buscarIP() {
    const ipInput = document.getElementById('ipInput').value.trim();
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('errorMsg');
    const resultsArea = document.getElementById('resultsArea');
    const errorText = document.getElementById('errorText');

    // UI: Estado de carga
    btnText.textContent = 'Buscando...';
    loader.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    
    // Construir URL (si está vacío usa la API root para obtener la IP del usuario)
    const url = ipInput ? `https://ip.guide/${ipInput}` : 'https://ip.guide/';

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('No se pudo encontrar la información para esa IP.');
        }

        const data = await response.json();

        // Validar si la respuesta tiene la estructura esperada
        if (!data.location) {
            throw new Error('Datos de localización no disponibles para esta IP.');
        }

        // UI: Mostrar resultados
        renderResults(data);
        resultsArea.classList.remove('hidden');
        
        // Pequeño delay para la animación de opacidad
        setTimeout(() => {
            resultsArea.classList.remove('opacity-0');
        }, 50);

    } catch (error) {
        console.error(error);
        errorText.textContent = error.message || "Error de conexión o IP inválida.";
        errorMsg.classList.remove('hidden');
    } finally {
        // UI: Restaurar estado botón
        btnText.textContent = 'Rastrear';
        loader.classList.add('hidden');
    }
}

// Renderizar los datos en el DOM
function renderResults(data) {
    // Llenar datos de texto
    document.getElementById('displayIP').textContent = data.ip || 'N/A';
    
    // Datos de Red
    const asn = data.network?.autonomous_system?.asn || '---';
    const org = data.network?.autonomous_system?.organization || '---';
    const isp = data.network?.organization || org || '---'; // A veces viene en organization, a veces en AS

    document.getElementById('displayASN').textContent = `AS${asn}`;
    document.getElementById('displayOrg').textContent = org;
    document.getElementById('displayISP').textContent = isp;

    // Datos de Ubicación
    const city = data.location.city || 'Desconocida';
    const country = data.location.country || 'Desconocido';
    const timezone = data.location.timezone || 'UTC';
    const lat = data.location.latitude;
    const lon = data.location.longitude;

    document.getElementById('displayCity').textContent = city;
    document.getElementById('displayCountry').textContent = country;
    document.getElementById('displayTimezone').textContent = timezone;
    document.getElementById('displayCoords').textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    // Actualizar Mapa
    updateMap(lat, lon, city, country);
}

// Actualizar vista del mapa y marcador
function updateMap(lat, lng, city, country) {
    if (map) {
        // Mover vista
        map.setView([lat, lng], 13);

        // Si ya existe marcador, moverlo. Si no, crear uno nuevo.
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }

        // Añadir popup
        marker.bindPopup(`<b>${city}, ${country}</b><br>Lat: ${lat}<br>Lon: ${lng}`).openPopup();
        
        // Invalidar tamaño para asegurar que se renderiza bien si estaba oculto
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
}

// Iniciar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    // Disparar búsqueda automática al cargar (busca IP propia)
    buscarIP();
});