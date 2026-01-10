// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCoursesForSelect();
    loadTutorsForSelect();
    loadOrders();
    setupOrderForm();
    setupEditOrderForm();
});

// Загрузка курсов для выпадающего списка
async function loadCoursesForSelect() {
    try {
        const response = await coursesAPI.getCourses(1, 100);
        const courses = response.items || [];
        
        const orderCourseSelect = document.getElementById('orderCourse');
        const editOrderCourseSelect = document.getElementById('editOrderCourse');
        
        const options = courses.map(course => 
            `<option value="${course.id}">${course.name || 'Курс без названия'}</option>`
        ).join('');
        
        if (orderCourseSelect) {
            orderCourseSelect.innerHTML = '<option value="">Выберите курс</option>' + options;
        }
        
        if (editOrderCourseSelect) {
            editOrderCourseSelect.innerHTML = '<option value="">Выберите курс</option>' + options;
        }
    } catch (error) {
        console.error('Error loading courses for select:', error);
    }
}

// Загрузка репетиторов для выпадающего списка
async function loadTutorsForSelect() {
    try {
        const tutors = await tutorsAPI.getTutors();
        
        const orderTutorSelect = document.getElementById('orderTutor');
        const editOrderTutorSelect = document.getElementById('editOrderTutor');
        
        const options = tutors.map(tutor => 
            `<option value="${tutor.id}">${tutor.name || 'Репетитор без имени'}</option>`
        ).join('');
        
        if (orderTutorSelect) {
            orderTutorSelect.innerHTML = '<option value="">Выберите репетитора (необязательно)</option>' + options;
        }
        
        if (editOrderTutorSelect) {
            editOrderTutorSelect.innerHTML = '<option value="">Выберите репетитора</option>' + options;
        }
    } catch (error) {
        console.error('Error loading tutors for select:', error);
    }
}

// Настройка формы создания заявки
function setupOrderForm() {
    const orderForm = document.getElementById('orderForm');
    const resetButton = document.getElementById('resetOrderForm');

    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const orderData = {
                name: document.getElementById('orderName').value.trim(),
                email: document.getElementById('orderEmail').value.trim(),
                phone: document.getElementById('orderPhone').value.trim(),
                courseId: parseInt(document.getElementById('orderCourse').value),
                tutorId: document.getElementById('orderTutor').value ? parseInt(document.getElementById('orderTutor').value) : null,
                level: document.getElementById('orderLevel').value,
                comment: document.getElementById('orderComment').value.trim()
            };

            try {
                await ordersAPI.createOrder(orderData);
                orderForm.reset();
                loadOrders();
            } catch (error) {
                console.error('Error creating order:', error);
            }
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            if (orderForm) {
                orderForm.reset();
            }
        });
    }
}

// Загрузка заявок
async function loadOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;

    ordersContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Загрузка...</span></div></div>';

    try {
        const orders = await ordersAPI.getOrders();

        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="text-muted text-center">У вас пока нет заявок</p>';
            return;
        }

        ordersContainer.innerHTML = orders.map(order => {
            const statusClass = order.status === 'approved' ? 'approved' : 
                               order.status === 'rejected' ? 'rejected' : 'pending';
            const statusText = order.status === 'approved' ? 'Одобрена' : 
                             order.status === 'rejected' ? 'Отклонена' : 'В обработке';

            return `
                <div class="card order-card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title">Заявка #${order.id}</h5>
                                <span class="order-status ${statusClass}">${statusText}</span>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-2" onclick="editOrder(${order.id})">
                                    Редактировать
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})">
                                    Удалить
                                </button>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Имя:</strong> ${order.name || 'Не указано'}</p>
                                <p><strong>Email:</strong> ${order.email || 'Не указано'}</p>
                                <p><strong>Телефон:</strong> ${order.phone || 'Не указано'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Курс ID:</strong> ${order.courseId || 'Не указан'}</p>
                                <p><strong>Репетитор ID:</strong> ${order.tutorId || 'Не указан'}</p>
                                <p><strong>Уровень:</strong> ${order.level || 'Не указан'}</p>
                            </div>
                            ${order.comment ? `<div class="col-12"><p><strong>Комментарий:</strong> ${order.comment}</p></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        ordersContainer.innerHTML = '<p class="text-danger text-center">Ошибка при загрузке заявок</p>';
        console.error('Error loading orders:', error);
    }
}

// Редактировать заявку
async function editOrder(orderId) {
    try {
        const order = await ordersAPI.getOrder(orderId);
        if (!order) {
            showNotification('Не удалось загрузить информацию о заявке', 'error');
            return;
        }

        // Заполнение формы редактирования
        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editOrderName').value = order.name || '';
        document.getElementById('editOrderEmail').value = order.email || '';
        document.getElementById('editOrderPhone').value = order.phone || '';
        document.getElementById('editOrderCourse').value = order.courseId || '';
        document.getElementById('editOrderTutor').value = order.tutorId || '';
        document.getElementById('editOrderLevel').value = order.level || '';
        document.getElementById('editOrderComment').value = order.comment || '';

        // Показ модального окна
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();

    } catch (error) {
        showNotification('Ошибка при загрузке заявки для редактирования', 'error');
        console.error('Error loading order for edit:', error);
    }
}

// Настройка формы редактирования заявки
function setupEditOrderForm() {
    const saveButton = document.getElementById('saveEditOrder');

    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const orderId = document.getElementById('editOrderId').value;
            if (!orderId) return;

            const orderData = {};
            
            const name = document.getElementById('editOrderName').value.trim();
            const email = document.getElementById('editOrderEmail').value.trim();
            const phone = document.getElementById('editOrderPhone').value.trim();
            const courseId = document.getElementById('editOrderCourse').value;
            const tutorId = document.getElementById('editOrderTutor').value;
            const level = document.getElementById('editOrderLevel').value;
            const comment = document.getElementById('editOrderComment').value.trim();

            if (name) orderData.name = name;
            if (email) orderData.email = email;
            if (phone) orderData.phone = phone;
            if (courseId) orderData.courseId = parseInt(courseId);
            if (tutorId) orderData.tutorId = parseInt(tutorId);
            if (level) orderData.level = level;
            if (comment) orderData.comment = comment;

            try {
                await ordersAPI.updateOrder(orderId, orderData);
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
                modal.hide();
                loadOrders();
            } catch (error) {
                console.error('Error updating order:', error);
            }
        });
    }
}

// Удалить заявку
async function deleteOrder(orderId) {
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
        return;
    }

    try {
        await ordersAPI.deleteOrder(orderId);
        loadOrders();
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

