// Инициализация карты
let map;
let placemarks = [];

// Данные учебных ресурсов (примерные данные)
const resourcesData = [
    {
        name: 'Языковой клуб "Полиглот"',
        address: 'г. Москва, ул. Тверская, д. 10',
        coordinates: [55.7558, 37.6173],
        category: 'cafe',
        hours: 'Пн-Вс: 10:00 - 22:00',
        phone: '+7 (495) 123-45-67',
        description: 'Языковой клуб для практики разговорной речи. Проводятся встречи с носителями языка.'
    },
    {
        name: 'Библиотека иностранной литературы',
        address: 'г. Москва, ул. Николоямская, д. 1',
        coordinates: [55.7500, 37.6500],
        category: 'library',
        hours: 'Пн-Сб: 9:00 - 20:00',
        phone: '+7 (495) 915-36-27',
        description: 'Большая коллекция книг на иностранных языках, аудио и видео материалы.'
    },
    {
        name: 'Центр изучения языков "Лингва"',
        address: 'г. Москва, ул. Арбат, д. 25',
        coordinates: [55.7520, 37.5920],
        category: 'private',
        hours: 'Пн-Пт: 9:00 - 21:00',
        phone: '+7 (495) 234-56-78',
        description: 'Частная языковая школа с индивидуальным подходом к каждому студенту.'
    },
    {
        name: 'Культурный центр "Диалог"',
        address: 'г. Москва, ул. Новый Арбат, д. 15',
        coordinates: [55.7550, 37.6000],
        category: 'community',
        hours: 'Вт-Вс: 11:00 - 19:00',
        phone: '+7 (495) 345-67-89',
        description: 'Культурный центр с программами изучения языков через культуру и искусство.'
    },
    {
        name: 'Университетский центр языков',
        address: 'г. Москва, Ленинские горы, д. 1',
        coordinates: [55.7030, 37.5300],
        category: 'educational',
        hours: 'Пн-Пт: 8:00 - 20:00',
        phone: '+7 (495) 939-00-00',
        description: 'Образовательное учреждение с широким выбором языковых программ.'
    },
    {
        name: 'Кафе языкового обмена "Speak Easy"',
        address: 'г. Москва, ул. Пятницкая, д. 12',
        coordinates: [55.7400, 37.6300],
        category: 'cafe',
        hours: 'Пн-Вс: 12:00 - 24:00',
        phone: '+7 (495) 456-78-90',
        description: 'Кафе, где можно практиковать языки в неформальной обстановке за чашкой кофе.'
    }
];

// Инициализация карты при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (typeof ymaps !== 'undefined') {
        ymaps.ready(initMap);
    } else {
        console.error('Yandex Maps API не загружен');
    }
    
    setupMapSearch();
    setupMapFilter();
});

// Инициализация карты
function initMap() {
    map = new ymaps.Map('map', {
        center: [55.7558, 37.6173], // Москва
        zoom: 11,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector', 'geolocationControl']
    });

    // Добавление всех ресурсов на карту
    addResourcesToMap(resourcesData);
}

// Добавление ресурсов на карту
function addResourcesToMap(resources) {
    // Очистка предыдущих меток
    placemarks.forEach(pm => map.geoObjects.remove(pm));
    placemarks = [];

    resources.forEach(resource => {
        const placemark = new ymaps.Placemark(
            resource.coordinates,
            {
                balloonContentHeader: `<strong>${resource.name}</strong>`,
                balloonContentBody: `
                    <p><strong>Адрес:</strong> ${resource.address}</p>
                    <p><strong>Часы работы:</strong> ${resource.hours}</p>
                    <p><strong>Телефон:</strong> ${resource.phone}</p>
                    <p><strong>Описание:</strong> ${resource.description}</p>
                `,
                balloonContentFooter: `<small>Категория: ${getCategoryName(resource.category)}</small>`,
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

// Получение названия категории
function getCategoryName(category) {
    const categories = {
        'educational': 'Образовательные учреждения',
        'community': 'Общественные центры',
        'library': 'Публичные библиотеки',
        'private': 'Частные языковые курсы',
        'cafe': 'Языковые кафе или клубы'
    };
    return categories[category] || 'Неизвестная категория';
}

// Настройка поиска на карте
function setupMapSearch() {
    const searchInput = document.getElementById('mapSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        if (!searchTerm) {
            addResourcesToMap(resourcesData);
            return;
        }

        const filtered = resourcesData.filter(resource => {
            const searchFields = [
                resource.name,
                resource.address,
                resource.description,
                getCategoryName(resource.category)
            ].join(' ').toLowerCase();

            return searchFields.includes(searchTerm);
        });

        addResourcesToMap(filtered);
    });
}

// Настройка фильтра на карте
function setupMapFilter() {
    const filterSelect = document.getElementById('mapFilter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        if (!selectedCategory) {
            addResourcesToMap(resourcesData);
            return;
        }

        const filtered = resourcesData.filter(resource => resource.category === selectedCategory);
        addResourcesToMap(filtered);
    });
}

