// Базовый URL API
// Для локальной разработки используйте прокси: '/api'
// Для продакшена: 'http://exam-api-courses.std-900.ist.mospolytech.ru/api'
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? '/api' 
    : 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

// API ключ для аутентификации (передается как query параметр api_key)
const API_KEY = '0f2152ae-2c33-46cc-94d9-51656c675b81';

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Функция для выполнения HTTP запросов
async function apiRequest(url, method = 'GET', data = null) {
    try {
        // Добавляем API ключ как query параметр
        const separator = url.includes('?') ? '&' : '?';
        const fullUrl = `${API_BASE_URL}${url}${separator}api_key=${API_KEY}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            credentials: 'omit'
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        console.log(`[API Request] ${method} ${fullUrl}`, data ? { data } : '');
        const response = await fetch(fullUrl, options);
        
        if (!response.ok) {
            // Пытаемся получить детали ошибки из ответа
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('Error details:', errorData);
                if (errorData.message || errorData.error) {
                    errorMessage += ` - ${errorData.message || errorData.error}`;
                }
            } catch (e) {
                // Если не удалось распарсить JSON, используем стандартное сообщение
            }
            throw new Error(errorMessage);
        }

        const jsonData = await response.json();
        console.log(`[API Response]`, jsonData);
        return jsonData;
    } catch (error) {
        console.error('API request error:', error);
        
        // More detailed CORS error handling
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            const errorMsg = 'CORS Error: Server does not allow requests from this domain. ' +
                           'For local development, use a proxy server or browser extension to bypass CORS.';
            showNotification(errorMsg, 'error');
        } else {
            showNotification(`Request error: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

// Маппинг русских названий уровней на английские
const levelMapping = {
    'начальный': 'Beginner',
    'средний': 'Intermediate',
    'продвинутый': 'Advanced'
};

// API для работы с курсами
const coursesAPI = {
    // Получить список курсов
    async getCourses(page = 1, limit = 6, name = '', level = '') {
        try {
            let url = `/courses?page=${page}&limit=${limit}`;
            if (name) url += `&name=${encodeURIComponent(name)}`;
            
            // Преобразуем русский уровень в английский для API
            let apiLevel = level;
            if (level && levelMapping[level.toLowerCase()]) {
                apiLevel = levelMapping[level.toLowerCase()];
            }
            if (apiLevel) url += `&level=${encodeURIComponent(apiLevel)}`;
            
            const response = await apiRequest(url);
            let courses = [];
            
            // API возвращает массив напрямую, а не объект с items
            if (Array.isArray(response)) {
                courses = response;
            } else if (response.items && Array.isArray(response.items)) {
                courses = response.items;
            }
            
            // Фильтрация на клиенте, если API не фильтрует
            if (name || level) {
                courses = courses.filter(course => {
                    let matches = true;
                    
                    // Фильтр по названию (регистронезависимый поиск)
                    if (name) {
                        const courseName = (course.name || '').toLowerCase();
                        const searchName = name.toLowerCase();
                        matches = matches && courseName.includes(searchName);
                    }
                    
                    // Фильтр по уровню
                    if (level) {
                        const apiLevel = levelMapping[level.toLowerCase()] || level;
                        matches = matches && course.level === apiLevel;
                    }
                    
                    return matches;
                });
            }
            
            // Применяем пагинацию к отфильтрованным результатам
            const total = courses.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedCourses = courses.slice(startIndex, endIndex);
            
            return {
                items: paginatedCourses,
                total: total,
                page: page,
                limit: limit
            };
        } catch (error) {
            console.error('Error fetching courses:', error);
            return { items: [], total: 0, page: 1, limit: 6 };
        }
    },

    // Получить информацию о курсе
    async getCourse(courseId) {
        try {
            // Согласно заданию: api/course/{course-id}
            // Но список курсов - /courses, поэтому пробуем /courses/{id}
            return await apiRequest(`/courses/${courseId}`);
        } catch (error) {
            console.error('Error fetching course:', error);
            return null;
        }
    }
};

// API для работы с репетиторами
const tutorsAPI = {
    // Получить список репетиторов
    async getTutors() {
        try {
            const response = await apiRequest('/tutors');
            // API может возвращать массив напрямую или объект с items
            if (Array.isArray(response)) {
                return response;
            }
            return response.items || [];
        } catch (error) {
            console.error('Error fetching tutors:', error);
            return [];
        }
    },

    // Получить информацию о репетиторе
    async getTutor(tutorId) {
        try {
            return await apiRequest(`/tutors/${tutorId}`);
        } catch (error) {
            console.error('Error fetching tutor:', error);
            return null;
        }
    }
};

// API для работы с заявками
const ordersAPI = {
    // Получить список заявок
    async getOrders() {
        try {
            const response = await apiRequest('/orders');
            // API возвращает массив напрямую, а не объект с items
            if (Array.isArray(response)) {
                return response;
            }
            return response.items || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    },

    // Добавить заявку
    async createOrder(orderData) {
        try {
            const response = await apiRequest('/orders', 'POST', orderData);
            showNotification('Order successfully created!', 'success');
            return response;
        } catch (error) {
            showNotification('Error creating order', 'error');
            throw error;
        }
    },

    // Редактировать заявку
    async updateOrder(orderId, orderData) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
            showNotification('Order successfully updated!', 'success');
            return response;
        } catch (error) {
            showNotification('Error updating order', 'error');
            throw error;
        }
    },

    // Удалить заявку
    async deleteOrder(orderId) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'DELETE');
            showNotification('Order successfully deleted!', 'success');
            return response;
        } catch (error) {
            showNotification('Error deleting order', 'error');
            throw error;
        }
    },

    // Посмотреть заявку
    async getOrder(orderId) {
        try {
            return await apiRequest(`/orders/${orderId}`);
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { coursesAPI, tutorsAPI, ordersAPI, showNotification };
}

