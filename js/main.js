// Текущая страница пагинации
let currentPage = 1;
const coursesPerPage = 6;
// Параметры поиска
let currentSearchName = '';
let currentSearchLevel = '';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadTutors();
    setupSearchForm();
});

// Загрузка курсов
async function loadCourses(page = 1, name = null, level = null) {
    // Сохраняем параметры поиска
    if (name !== null) currentSearchName = name;
    if (level !== null) currentSearchLevel = level;
    
    // Используем сохраненные параметры, если новые не переданы
    const searchName = name !== null ? name : currentSearchName;
    const searchLevel = level !== null ? level : currentSearchLevel;
    
    const coursesContainer = document.getElementById('coursesContainer');
    if (!coursesContainer) return;

    coursesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        const response = await coursesAPI.getCourses(page, coursesPerPage, searchName, searchLevel);
        const courses = response.items || [];
        const total = response.total || 0;

        if (courses.length === 0) {
            coursesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No courses found</p></div>';
            return;
        }

        coursesContainer.innerHTML = courses.map(course => `
            <div class="col-md-6 col-lg-4">
                <div class="card course-card shadow-sm h-100">
                    <div class="position-relative">
                        <div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height: 200px; color: white; font-size: 1.5rem;">
                            ${course.image ? `<img src="${course.image}" class="w-100 h-100" style="object-fit: cover;" alt="${course.name || 'Course'}">` : '📚 Course'}
                        </div>
                        <span class="badge bg-primary course-badge">${course.level || 'Level'}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${course.name || 'Course Name'}</h5>
                        <p class="card-text flex-grow-1">${course.description || 'No description available'}</p>
                        <div class="mt-auto">
                            <p class="text-muted mb-2">
                                <small>Teacher: ${course.teacher || 'Not specified'}</small><br>
                                <small>Duration: ${course.total_length || 'Not specified'} weeks</small><br>
                                <small>Price: ${course.course_fee_per_hour || 'Not specified'} RUB/hour</small>
                            </p>
                            <button class="btn btn-primary w-100" onclick="showCourseDetails(${course.id})">
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Create pagination
        createPagination(page, Math.ceil(total / coursesPerPage));
        currentPage = page;

    } catch (error) {
        coursesContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error loading courses</p></div>';
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

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadCourses(${currentPage - 1}, null, null); return false;">Previous</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadCourses(${i}, null, null); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadCourses(${currentPage + 1}, null, null); return false;">Next</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Show course details
async function showCourseDetails(courseId) {
    try {
        const course = await coursesAPI.getCourse(courseId);
        if (course) {
            const startDates = course.start_dates && course.start_dates.length > 0 
                ? course.start_dates.slice(0, 3).map(d => new Date(d).toLocaleDateString('en-US')).join(', ') 
                : 'Not specified';
            alert(`Course: ${course.name || 'Name not specified'}\n\nDescription: ${course.description || 'No description'}\n\nTeacher: ${course.teacher || 'Not specified'}\n\nLevel: ${course.level || 'Not specified'}\n\nDuration: ${course.total_length || 'Not specified'} weeks\n\nClasses per week: ${course.week_length || 'Not specified'}\n\nPrice: ${course.course_fee_per_hour || 'Not specified'} RUB/hour\n\nUpcoming start dates: ${startDates}`);
        } else {
            showNotification('Failed to load course information', 'error');
        }
    } catch (error) {
        showNotification('Error loading course information', 'error');
    }
}

// Загрузка репетиторов
async function loadTutors() {
    const tutorsContainer = document.getElementById('tutorsContainer');
    if (!tutorsContainer) return;

    tutorsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        const tutors = await tutorsAPI.getTutors();

        if (tutors.length === 0) {
            tutorsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No tutors found</p></div>';
            return;
        }

        tutorsContainer.innerHTML = tutors.map(tutor => `
            <div class="col-md-6 col-lg-4">
                <div class="card tutor-card shadow-sm h-100">
                    <div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height: 250px; color: white; font-size: 2rem;">
                        ${tutor.photo ? `<img src="${tutor.photo}" class="w-100 h-100" style="object-fit: cover;" alt="${tutor.name || 'Tutor'}">` : '👨‍🏫'}
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${tutor.name || 'Name not specified'}</h5>
                        <p class="card-text">
                            <strong>Languages:</strong> ${tutor.languages_offered ? tutor.languages_offered.join(', ') : (tutor.languages_spoken ? tutor.languages_spoken.join(', ') : 'Not specified')}<br>
                            <strong>Experience:</strong> ${tutor.work_experience || tutor.experience || 'Not specified'} ${tutor.work_experience ? 'years' : ''}<br>
                            <strong>Level:</strong> ${tutor.language_level || 'Not specified'}<br>
                            <strong>Price:</strong> ${tutor.price_per_hour || 'Not specified'} ${tutor.price_per_hour ? 'RUB/hour' : ''}
                        </p>
                        ${tutor.description ? `<p class="card-text"><small class="text-muted">${tutor.description}</small></p>` : ''}
                        <button class="btn btn-outline-primary" onclick="showTutorDetails(${tutor.id})">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        tutorsContainer.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Error loading tutors</p></div>';
        console.error('Error loading tutors:', error);
    }
}

// Show tutor details
async function showTutorDetails(tutorId) {
    try {
        const tutor = await tutorsAPI.getTutor(tutorId);
        if (tutor) {
            const languages = tutor.languages_offered ? tutor.languages_offered.join(', ') : 
                            (tutor.languages_spoken ? tutor.languages_spoken.join(', ') : 'Not specified');
            alert(`Tutor: ${tutor.name || 'Name not specified'}\n\nLanguages (teaches): ${languages}\n\nWork Experience: ${tutor.work_experience || tutor.experience || 'Not specified'} ${tutor.work_experience ? 'years' : ''}\n\nLevel: ${tutor.language_level || 'Not specified'}\n\nPrice: ${tutor.price_per_hour || 'Not specified'} ${tutor.price_per_hour ? 'RUB/hour' : ''}`);
        } else {
            showNotification('Failed to load tutor information', 'error');
        }
    } catch (error) {
        showNotification('Error loading tutor information', 'error');
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

