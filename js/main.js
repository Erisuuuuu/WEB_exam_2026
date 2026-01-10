// Текущая страница пагинации
let currentPage = 1;
const coursesPerPage = 6;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadTutors();
    setupSearchForm();
});

// Загрузка курсов
async function loadCourses(page = 1, name = '', level = '') {
    const coursesContainer = document.getElementById('coursesContainer');
    if (!coursesContainer) return;

    coursesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Загрузка...</span></div></div>';

    try {
        const response = await coursesAPI.getCourses(page, coursesPerPage, name, level);
        const courses = response.items || [];
        const total = response.total || 0;

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Курсы не найдены</p></div>';
            return;
        }

        coursesContainer.innerHTML = courses.map(course => `
            <div class="col-md-6 col-lg-4">
                <div class="card course-card shadow-sm h-100">
                    <div class="position-relative">
                        <img src="${course.image || 'https://via.placeholder.com/300x200?text=Курс'}" 
                             class="card-img-top" 
                             alt="${course.name || 'Курс'}">
                        <span class="badge bg-primary course-badge">${course.level || 'Уровень'}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${course.name || 'Название курса'}</h5>
                        <p class="card-text flex-grow-1">${course.description || 'Описание курса отсутствует'}</p>
                        <div class="mt-auto">
                            <p class="text-muted mb-2">
                                <small>Язык: ${course.language || 'Не указан'}</small>
                            </p>
                            <button class="btn btn-primary w-100" onclick="showCourseDetails(${course.id})">
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Создание пагинации
        createPagination(page, Math.ceil(total / coursesPerPage));
        currentPage = page;

    } catch (error) {
        coursesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Ошибка при загрузке курсов</p></div>';
        console.error('Error loading courses:', error);
    }
}

// Создание пагинации
function createPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Кнопка "Предыдущая"
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadCourses(${currentPage - 1}); return false;">Предыдущая</a>
        </li>
    `;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadCourses(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Кнопка "Следующая"
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadCourses(${currentPage + 1}); return false;">Следующая</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Показать детали курса
async function showCourseDetails(courseId) {
    try {
        const course = await coursesAPI.getCourse(courseId);
        if (course) {
            alert(`Курс: ${course.name || 'Название не указано'}\n\nОписание: ${course.description || 'Описание отсутствует'}\n\nУровень: ${course.level || 'Не указан'}\n\nЯзык: ${course.language || 'Не указан'}`);
        } else {
            showNotification('Не удалось загрузить информацию о курсе', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при загрузке информации о курсе', 'error');
    }
}

// Загрузка репетиторов
async function loadTutors() {
    const tutorsContainer = document.getElementById('tutorsContainer');
    if (!tutorsContainer) return;

    tutorsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Загрузка...</span></div></div>';

    try {
        const tutors = await tutorsAPI.getTutors();

        if (tutors.length === 0) {
            tutorsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Репетиторы не найдены</p></div>';
            return;
        }

        tutorsContainer.innerHTML = tutors.map(tutor => `
            <div class="col-md-6 col-lg-4">
                <div class="card tutor-card shadow-sm h-100">
                    <img src="${tutor.photo || 'https://via.placeholder.com/300x250?text=Репетитор'}" 
                         class="card-img-top" 
                         alt="${tutor.name || 'Репетитор'}">
                    <div class="card-body">
                        <h5 class="card-title">${tutor.name || 'Имя не указано'}</h5>
                        <p class="card-text">
                            <strong>Языки:</strong> ${tutor.languages ? tutor.languages.join(', ') : 'Не указаны'}<br>
                            <strong>Опыт:</strong> ${tutor.experience || 'Не указан'}<br>
                            <strong>Рейтинг:</strong> ${tutor.rating ? '⭐'.repeat(Math.round(tutor.rating)) : 'Не указан'}
                        </p>
                        ${tutor.description ? `<p class="card-text"><small class="text-muted">${tutor.description}</small></p>` : ''}
                        <button class="btn btn-outline-primary" onclick="showTutorDetails(${tutor.id})">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        tutorsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Ошибка при загрузке репетиторов</p></div>';
        console.error('Error loading tutors:', error);
    }
}

// Показать детали репетитора
async function showTutorDetails(tutorId) {
    try {
        const tutor = await tutorsAPI.getTutor(tutorId);
        if (tutor) {
            alert(`Репетитор: ${tutor.name || 'Имя не указано'}\n\nЯзыки: ${tutor.languages ? tutor.languages.join(', ') : 'Не указаны'}\n\nОпыт: ${tutor.experience || 'Не указан'}\n\nОписание: ${tutor.description || 'Описание отсутствует'}`);
        } else {
            showNotification('Не удалось загрузить информацию о репетиторе', 'error');
        }
    } catch (error) {
        showNotification('Ошибка при загрузке информации о репетиторе', 'error');
    }
}

// Настройка формы поиска
function setupSearchForm() {
    const searchForm = document.getElementById('searchForm');
    const resetButton = document.getElementById('resetSearch');

    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('searchName').value.trim();
            const level = document.getElementById('searchLevel').value;
            currentPage = 1;
            loadCourses(currentPage, name, level);
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            document.getElementById('searchName').value = '';
            document.getElementById('searchLevel').value = '';
            currentPage = 1;
            loadCourses(currentPage);
        });
    }
}

// Плавная прокрутка к якорям
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

