// Базовый URL API
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

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

        const response = await fetch(`${API_BASE_URL}${url}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        
        // Более детальная обработка ошибок CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            const errorMsg = 'Ошибка CORS: Сервер не разрешает запросы с этого домена. ' +
                           'Для локальной разработки используйте прокси-сервер или расширение браузера для обхода CORS.';
            showNotification(errorMsg, 'error');
        } else {
            showNotification(`Ошибка при выполнении запроса: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

// API для работы с курсами
const coursesAPI = {
    // Получить список курсов
    async getCourses(page = 1, limit = 6, name = '', level = '') {
        try {
            let url = `/courses?page=${page}&limit=${limit}`;
            if (name) url += `&name=${encodeURIComponent(name)}`;
            if (level) url += `&level=${encodeURIComponent(level)}`;
            
            const response = await apiRequest(url);
            return response;
        } catch (error) {
            console.error('Error fetching courses:', error);
            return { items: [], total: 0, page: 1, limit: 6 };
        }
    },

    // Получить информацию о курсе
    async getCourse(courseId) {
        try {
            return await apiRequest(`/course/${courseId}`);
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
            showNotification('Заявка успешно создана!', 'success');
            return response;
        } catch (error) {
            showNotification('Ошибка при создании заявки', 'error');
            throw error;
        }
    },

    // Редактировать заявку
    async updateOrder(orderId, orderData) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
            showNotification('Заявка успешно обновлена!', 'success');
            return response;
        } catch (error) {
            showNotification('Ошибка при обновлении заявки', 'error');
            throw error;
        }
    },

    // Удалить заявку
    async deleteOrder(orderId) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'DELETE');
            showNotification('Заявка успешно удалена!', 'success');
            return response;
        } catch (error) {
            showNotification('Ошибка при удалении заявки', 'error');
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

