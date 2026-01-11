// Pagination variables
let currentOrdersPage = 1;
const ordersPerPage = 10;
let allOrders = [];
let coursesCache = {};
let tutorsCache = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCoursesForSelect();
    loadTutorsForSelect();
    loadOrders();
    setupOrderForm();
    setupEditOrderForm();
    setupDeleteConfirmation();
});

// Load courses for dropdown
async function loadCoursesForSelect() {
    try {
        const response = await coursesAPI.getCourses(1, 100);
        const courses = response.items || [];
        
        // Cache courses for later use
        courses.forEach(course => {
            coursesCache[course.id] = course;
        });
        
        const orderCourseSelect = document.getElementById('orderCourse');
        const editOrderCourseSelect = document.getElementById('editOrderCourse');
        
        const options = courses.map(course => 
            `<option value="${course.id}">${course.name || 'Course without name'}</option>`
        ).join('');
        
        if (orderCourseSelect) {
            orderCourseSelect.innerHTML = '<option value="">Select a course</option>' + options;
        }
        
        if (editOrderCourseSelect) {
            editOrderCourseSelect.innerHTML = '<option value="">Select a course</option>' + options;
        }
    } catch (error) {
        console.error('Error loading courses for select:', error);
    }
}

// Load tutors for dropdown
async function loadTutorsForSelect() {
    try {
        const tutors = await tutorsAPI.getTutors();
        
        // Cache tutors for later use
        tutors.forEach(tutor => {
            tutorsCache[tutor.id] = tutor;
        });
        
        const orderTutorSelect = document.getElementById('orderTutor');
        const editOrderTutorSelect = document.getElementById('editOrderTutor');
        
        const options = tutors.map(tutor => 
            `<option value="${tutor.id}">${tutor.name || 'Tutor without name'}</option>`
        ).join('');
        
        if (orderTutorSelect) {
            orderTutorSelect.innerHTML = '<option value="">Select a tutor (optional)</option>' + options;
        }
        
        if (editOrderTutorSelect) {
            editOrderTutorSelect.innerHTML = '<option value="">Select a tutor</option>' + options;
        }
    } catch (error) {
        console.error('Error loading tutors for select:', error);
    }
}

// Setup order creation form
function setupOrderForm() {
    const orderForm = document.getElementById('orderForm');
    const resetButton = document.getElementById('resetOrderForm');

    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Level mapping from Russian to English
            const levelMapping = {
                'начальный': 'Beginner',
                'средний': 'Intermediate',
                'продвинутый': 'Advanced'
            };
            
            const rawLevel = document.getElementById('orderLevel').value;
            const apiLevel = levelMapping[rawLevel.toLowerCase()] || rawLevel;
            
            const courseIdValue = document.getElementById('orderCourse').value;
            const tutorIdValue = document.getElementById('orderTutor').value;
            
            // API requires either course_id or tutor_id (but not both)
            const orderData = {
                name: document.getElementById('orderName').value.trim(),
                email: document.getElementById('orderEmail').value.trim(),
                phone: document.getElementById('orderPhone').value.trim(),
                date_start: document.getElementById('orderDateStart').value,
                time_start: document.getElementById('orderTimeStart').value,
                duration: parseFloat(document.getElementById('orderDuration').value),
                persons: parseInt(document.getElementById('orderPersons').value),
                price: parseFloat(document.getElementById('orderPrice').value),
                level: apiLevel
            };
            
            // Add either course_id or tutor_id
            if (courseIdValue) {
                orderData.course_id = parseInt(courseIdValue);
            } else if (tutorIdValue) {
                orderData.tutor_id = parseInt(tutorIdValue);
            }
            
            // Add comment if exists
            const comment = document.getElementById('orderComment').value.trim();
            if (comment) {
                orderData.comment = comment;
            }
            
            console.log('Sending order:', orderData);

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

// Load orders
async function loadOrders(page = 1) {
    const ordersTableBody = document.getElementById('ordersTableBody');
    if (!ordersTableBody) return;

    ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

    try {
        allOrders = await ordersAPI.getOrders();

        if (allOrders.length === 0) {
            ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">You have no orders yet</td></tr>';
            createOrdersPagination(1, 0);
            return;
        }

        // Apply pagination
        const totalPages = Math.ceil(allOrders.length / ordersPerPage);
        const startIndex = (page - 1) * ordersPerPage;
        const endIndex = startIndex + ordersPerPage;
        const paginatedOrders = allOrders.slice(startIndex, endIndex);

        // Load course/tutor names for display
        await loadOrderDetails(paginatedOrders);

        ordersTableBody.innerHTML = paginatedOrders.map((order, index) => {
            const orderNumber = startIndex + index + 1;
            const courseName = getCourseName(order);
            const classDate = order.date_start ? new Date(order.date_start).toLocaleDateString('en-US') : 'Not specified';
            const totalCost = order.price ? `${order.price} RUB` : 'Not specified';

            return `
                <tr>
                    <td>${orderNumber}</td>
                    <td>${courseName}</td>
                    <td>${classDate}</td>
                    <td>${totalCost}</td>
                    <td>
                        <button class="btn btn-sm btn-info me-1" onclick="showOrderDetails(${order.id})" title="Details">
                            Details
                        </button>
                        <button class="btn btn-sm btn-warning me-1" onclick="editOrder(${order.id})" title="Edit">
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation(${order.id})" title="Delete">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        createOrdersPagination(page, totalPages);
        currentOrdersPage = page;

    } catch (error) {
        ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading orders</td></tr>';
        console.error('Error loading orders:', error);
    }
}

// Load course/tutor details for orders
async function loadOrderDetails(orders) {
    for (const order of orders) {
        if (order.course_id && !coursesCache[order.course_id]) {
            try {
                const course = await coursesAPI.getCourse(order.course_id);
                if (course) {
                    coursesCache[course.id] = course;
                }
            } catch (error) {
                console.error(`Error loading course ${order.course_id}:`, error);
            }
        }
        if (order.tutor_id && !tutorsCache[order.tutor_id]) {
            try {
                const tutor = await tutorsAPI.getTutor(order.tutor_id);
                if (tutor) {
                    tutorsCache[tutor.id] = tutor;
                }
            } catch (error) {
                console.error(`Error loading tutor ${order.tutor_id}:`, error);
            }
        }
    }
}

// Get course name for order
function getCourseName(order) {
    if (order.course_id && coursesCache[order.course_id]) {
        return coursesCache[order.course_id].name || `Course #${order.course_id}`;
    }
    if (order.tutor_id && tutorsCache[order.tutor_id]) {
        return `Tutor: ${tutorsCache[order.tutor_id].name || `Tutor #${order.tutor_id}`}`;
    }
    return order.course_id ? `Course #${order.course_id}` : (order.tutor_id ? `Tutor #${order.tutor_id}` : 'Not specified');
}

// Create pagination for orders
function createOrdersPagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('ordersPagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrders(${currentPage - 1}); return false;">Previous</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadOrders(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrders(${currentPage + 1}); return false;">Next</a>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Show order details in modal
async function showOrderDetails(orderId) {
    try {
        const order = await ordersAPI.getOrder(orderId);
        if (!order) {
            showNotification('Failed to load order information', 'error');
            return;
        }

        // Load course/tutor details if not cached
        if (order.course_id && !coursesCache[order.course_id]) {
            const course = await coursesAPI.getCourse(order.course_id);
            if (course) coursesCache[course.id] = course;
        }
        if (order.tutor_id && !tutorsCache[order.tutor_id]) {
            const tutor = await tutorsAPI.getTutor(order.tutor_id);
            if (tutor) tutorsCache[tutor.id] = tutor;
        }

        const course = order.course_id ? coursesCache[order.course_id] : null;
        const tutor = order.tutor_id ? tutorsCache[order.tutor_id] : null;

        // Calculate discounts/surcharges (example calculation)
        const basePrice = order.price || 0;
        const orderPersons = order.persons || 1;
        const discount = orderPersons > 1 ? (orderPersons - 1) * 0.1 : 0; // 10% discount per additional person
        const finalPrice = basePrice * (1 - discount);

        const detailsHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Order #:</strong> ${order.id || 'Not specified'}</p>
                    <p><strong>Student ID:</strong> ${order.student_id || 'Not specified'}</p>
                    <p><strong>Created:</strong> ${order.created_at ? new Date(order.created_at).toLocaleString('en-US') : 'Not specified'}</p>
                    <p><strong>Updated:</strong> ${order.updated_at ? new Date(order.updated_at).toLocaleString('en-US') : 'Not specified'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Course/Tutor Information</h6>
                    ${course ? `
                        <p><strong>Course:</strong> ${course.name || 'Not specified'}</p>
                        <p><strong>Description:</strong> ${course.description || 'No description'}</p>
                        <p><strong>Teacher:</strong> ${course.teacher || 'Not specified'}</p>
                        <p><strong>Level:</strong> ${course.level || 'Not specified'}</p>
                        <p><strong>Course Duration:</strong> ${course.total_length || 'Not specified'} ${course.total_length ? 'weeks' : ''}</p>
                        <p><strong>Classes per Week:</strong> ${course.week_length || 'Not specified'}</p>
                    ` : ''}
                    ${tutor ? `
                        <p><strong>Tutor:</strong> ${tutor.name || 'Not specified'}</p>
                        <p><strong>Languages:</strong> ${tutor.languages_offered ? tutor.languages_offered.join(', ') : (tutor.languages_spoken ? tutor.languages_spoken.join(', ') : 'Not specified')}</p>
                        <p><strong>Experience:</strong> ${tutor.work_experience || tutor.experience || 'Not specified'} ${tutor.work_experience ? 'years' : ''}</p>
                        <p><strong>Language Level:</strong> ${tutor.language_level || 'Not specified'}</p>
                        <p><strong>Price per Hour:</strong> ${tutor.price_per_hour || 'Not specified'} ${tutor.price_per_hour ? 'RUB' : ''}</p>
                    ` : ''}
                    ${!course && !tutor ? '<p class="text-muted">No course or tutor information available</p>' : ''}
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h6>Schedule</h6>
                    <p><strong>Start Date:</strong> ${order.date_start ? new Date(order.date_start).toLocaleDateString('en-US') : 'Not specified'}</p>
                    <p><strong>Start Time:</strong> ${order.time_start || 'Not specified'}</p>
                    <p><strong>Duration:</strong> ${order.duration || 'Not specified'} ${order.duration ? 'hours' : ''}</p>
                    <p><strong>Number of Persons:</strong> ${orderPersons || 'Not specified'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Pricing</h6>
                    <p><strong>Base Price:</strong> ${basePrice} RUB</p>
                    ${discount > 0 ? `<p><strong>Discount:</strong> ${(discount * 100).toFixed(0)}% (${orderPersons - 1} additional person(s))</p>` : ''}
                    <p><strong>Final Price:</strong> <strong class="text-success">${finalPrice.toFixed(2)} RUB</strong></p>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-12">
                    <h6>Additional Options</h6>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Supplementary Services:</strong> ${order.supplementary !== undefined ? (order.supplementary ? 'Yes' : 'No') : 'Not specified'}</p>
                            <p><strong>Early Registration:</strong> ${order.earlyRegistration !== undefined ? (order.earlyRegistration ? 'Yes' : 'No') : (order.early_registration !== undefined ? (order.early_registration ? 'Yes' : 'No') : 'Not specified')}</p>
                            <p><strong>Group Enrollment:</strong> ${order.groupEnrollment !== undefined ? (order.groupEnrollment ? 'Yes' : 'No') : (order.group_enrollment !== undefined ? (order.group_enrollment ? 'Yes' : 'No') : 'Not specified')}</p>
                            <p><strong>Intensive Course:</strong> ${order.intensiveCourse !== undefined ? (order.intensiveCourse ? 'Yes' : 'No') : (order.intensive_course !== undefined ? (order.intensive_course ? 'Yes' : 'No') : 'Not specified')}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Personalized:</strong> ${order.personalized !== undefined ? (order.personalized ? 'Yes' : 'No') : 'Not specified'}</p>
                            <p><strong>Excursions:</strong> ${order.excursions !== undefined ? (order.excursions ? 'Yes' : 'No') : 'Not specified'}</p>
                            <p><strong>Assessment:</strong> ${order.assessment !== undefined ? (order.assessment ? 'Yes' : 'No') : 'Not specified'}</p>
                            <p><strong>Interactive:</strong> ${order.interactive !== undefined ? (order.interactive ? 'Yes' : 'No') : 'Not specified'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('orderDetailsContent').innerHTML = detailsHTML;
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();

    } catch (error) {
        showNotification('Error loading order details', 'error');
        console.error('Error loading order details:', error);
    }
}

// Edit order
async function editOrder(orderId) {
    try {
        const order = await ordersAPI.getOrder(orderId);
        if (!order) {
            showNotification('Failed to load order information', 'error');
            return;
        }

        // Fill edit form
        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editOrderCourse').value = order.course_id || order.courseId || '';
        document.getElementById('editOrderTutor').value = order.tutor_id || order.tutorId || '';
        document.getElementById('editOrderDateStart').value = order.date_start || '';
        document.getElementById('editOrderTimeStart').value = order.time_start || '';
        document.getElementById('editOrderDuration').value = order.duration || '';
        document.getElementById('editOrderPersons').value = order.persons || '';
        document.getElementById('editOrderPrice').value = order.price || '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();

    } catch (error) {
        showNotification('Error loading order for editing', 'error');
        console.error('Error loading order for edit:', error);
    }
}

// Setup edit order form
function setupEditOrderForm() {
    const saveButton = document.getElementById('saveEditOrder');

    if (saveButton) {
        saveButton.addEventListener('click', async function() {
            const orderId = document.getElementById('editOrderId').value;
            if (!orderId) return;

            const orderData = {};
            
            const courseId = document.getElementById('editOrderCourse').value;
            const tutorId = document.getElementById('editOrderTutor').value;
            const dateStart = document.getElementById('editOrderDateStart').value;
            const timeStart = document.getElementById('editOrderTimeStart').value;
            const duration = document.getElementById('editOrderDuration').value;
            const persons = document.getElementById('editOrderPersons').value;
            const price = document.getElementById('editOrderPrice').value;

            if (courseId) orderData.course_id = parseInt(courseId);
            if (tutorId) orderData.tutor_id = parseInt(tutorId);
            if (dateStart) orderData.date_start = dateStart;
            if (timeStart) orderData.time_start = timeStart;
            if (duration) orderData.duration = parseFloat(duration);
            if (persons) orderData.persons = parseInt(persons);
            if (price) orderData.price = parseFloat(price);

            try {
                await ordersAPI.updateOrder(orderId, orderData);
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
                modal.hide();
                loadOrders(currentOrdersPage);
            } catch (error) {
                console.error('Error updating order:', error);
            }
        });
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(orderId) {
    document.getElementById('deleteOrderId').textContent = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    modal.show();
    
    // Setup confirm button
    const confirmButton = document.getElementById('confirmDeleteOrder');
    confirmButton.onclick = async function() {
        try {
            await ordersAPI.deleteOrder(orderId);
            modal.hide();
            loadOrders(currentOrdersPage);
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };
}

// Setup delete confirmation
function setupDeleteConfirmation() {
    // Already handled in showDeleteConfirmation
}
