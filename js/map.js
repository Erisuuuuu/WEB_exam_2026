// Инициализация карты
let map;
let placemarks = [];

// Learning resources data (sample data)
const resourcesData = [
    {
        name: 'Language Club "Polyglot"',
        address: 'Moscow, Tverskaya St., 10',
        coordinates: [55.7558, 37.6173],
        category: 'cafe',
        hours: 'Mon-Sun: 10:00 - 22:00',
        phone: '+7 (495) 123-45-67',
        description: 'Language club for conversational practice. Meetings with native speakers are held.'
    },
    {
        name: 'Foreign Literature Library',
        address: 'Moscow, Nikoloyamskaya St., 1',
        coordinates: [55.7500, 37.6500],
        category: 'library',
        hours: 'Mon-Sat: 9:00 - 20:00',
        phone: '+7 (495) 915-36-27',
        description: 'Large collection of books in foreign languages, audio and video materials.'
    },
    {
        name: 'Language Learning Center "Lingua"',
        address: 'Moscow, Arbat St., 25',
        coordinates: [55.7520, 37.5920],
        category: 'private',
        hours: 'Mon-Fri: 9:00 - 21:00',
        phone: '+7 (495) 234-56-78',
        description: 'Private language school with individual approach to each student.'
    },
    {
        name: 'Cultural Center "Dialogue"',
        address: 'Moscow, Novy Arbat St., 15',
        coordinates: [55.7550, 37.6000],
        category: 'community',
        hours: 'Tue-Sun: 11:00 - 19:00',
        phone: '+7 (495) 345-67-89',
        description: 'Cultural center with language learning programs through culture and art.'
    },
    {
        name: 'University Language Center',
        address: 'Moscow, Leninskie Gory, 1',
        coordinates: [55.7030, 37.5300],
        category: 'educational',
        hours: 'Mon-Fri: 8:00 - 20:00',
        phone: '+7 (495) 939-00-00',
        description: 'Educational institution with a wide selection of language programs.'
    },
    {
        name: 'Language Exchange Cafe "Speak Easy"',
        address: 'Moscow, Pyatnitskaya St., 12',
        coordinates: [55.7400, 37.6300],
        category: 'cafe',
        hours: 'Mon-Sun: 12:00 - 24:00',
        phone: '+7 (495) 456-78-90',
        description: 'Cafe where you can practice languages in an informal setting over a cup of coffee.'
    }
];

// Инициализация карты при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(initMap);
    } else {
        console.error('Yandex Maps API not loaded');
    }
});

// Инициализация карты
function initMap() {
    map = new ymaps.Map('map', {
        center: [55.7558, 37.6173], // Moscow
        zoom: 11,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector', 'geolocationControl']
    });

    // Добавление всех ресурсов на карту
    addResourcesToMap(resourcesData);
    
    // Настройка поиска и фильтра после инициализации карты
    setupMapSearch();
    setupMapFilter();
}

// Добавление ресурсов на карту
function addResourcesToMap(resources) {
    // Очистка предыдущих меток
    placemarks.forEach(pm => {
        if (pm.placemark && map.geoObjects) {
            map.geoObjects.remove(pm.placemark);
        }
    });
    placemarks = [];

    resources.forEach(resource => {
        const placemark = new ymaps.Placemark(
            resource.coordinates,
            {
                balloonContentHeader: `<strong>${resource.name}</strong>`,
                balloonContentBody: `
                    <p><strong>Address:</strong> ${resource.address}</p>
                    <p><strong>Working Hours:</strong> ${resource.hours}</p>
                    <p><strong>Phone:</strong> ${resource.phone}</p>
                    <p><strong>Description:</strong> ${resource.description}</p>
                `,
                balloonContentFooter: `<small>Category: ${getCategoryName(resource.category)}</small>`,
                hintContent: resource.name
            },
            {
                preset: 'islands#blueIcon'
            }
        );

        map.geoObjects.add(placemark);
        placemarks.push({ placemark, resource });
    });
}

// Get category name
function getCategoryName(category) {
    const categories = {
        'educational': 'Educational Institutions',
        'community': 'Community Centers',
        'library': 'Public Libraries',
        'private': 'Private Language Courses',
        'cafe': 'Language Cafes or Clubs'
    };
    return categories[category] || 'Unknown Category';
}

// Применить фильтры (поиск + категория)
function applyFilters() {
    if (!map) {
        console.warn('Map not initialized yet');
        return;
    }

    const searchInput = document.getElementById('mapSearch');
    const filterSelect = document.getElementById('mapFilter');
    
    if (!searchInput || !filterSelect) {
        console.warn('Search input or filter select not found');
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCategory = filterSelect.value;

    console.log('Applying filters:', { searchTerm, selectedCategory });

    // Фильтрация по категории
    let filtered = [...resourcesData];
    if (selectedCategory) {
        filtered = filtered.filter(resource => {
            const matches = resource.category === selectedCategory;
            console.log(`Resource "${resource.name}" category: ${resource.category}, matches: ${matches}`);
            return matches;
        });
    }

    // Фильтрация по поисковому запросу
    if (searchTerm) {
        filtered = filtered.filter(resource => {
            const searchFields = [
                resource.name,
                resource.address,
                resource.description,
                getCategoryName(resource.category)
            ].join(' ').toLowerCase();

            return searchFields.includes(searchTerm);
        });
    }

    console.log(`Filtered ${filtered.length} resources from ${resourcesData.length}`);
    addResourcesToMap(filtered);
}

// Настройка поиска на карте
function setupMapSearch() {
    const searchInput = document.getElementById('mapSearch');
    if (!searchInput) {
        console.warn('mapSearch element not found');
        return;
    }

    searchInput.addEventListener('input', function() {
        applyFilters();
    });
}

// Настройка фильтра на карте
function setupMapFilter() {
    const filterSelect = document.getElementById('mapFilter');
    if (!filterSelect) {
        console.warn('mapFilter element not found');
        return;
    }

    console.log('Setting up map filter');
    
    // Удаляем старые обработчики, если они есть
    const newFilterSelect = filterSelect.cloneNode(true);
    filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);

    newFilterSelect.addEventListener('change', function() {
        console.log('Filter changed to:', this.value);
        applyFilters();
    });
    
    console.log('Map filter setup complete');
}

