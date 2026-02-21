document.addEventListener('DOMContentLoaded', () => {

    const user = JSON.parse(localStorage.getItem('user'));

    // --- Logic for Login Page (login.html) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const messageDiv = document.getElementById('message');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role })
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    messageDiv.className = 'mt-3 text-center text-success';
                    messageDiv.textContent = 'Login successful!';
                    if (data.user.Role === 'Student') {
                        window.location.href = 'student.html';
                    } else if (data.user.Role === 'Admin') {
                        window.location.href = 'admin.html';
                    }
                } else {
                    messageDiv.className = 'mt-3 text-center text-danger';
                    messageDiv.textContent = data.message;
                }
            } catch (error) {
                console.error('Login error:', error);
                messageDiv.className = 'mt-3 text-center text-danger';
                messageDiv.textContent = 'Network error. Please try again.';
            }
        });
    }

    // --- Logic for Registration Page (register.html) ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');

            try {
                const response = await fetch('/api/auth/register/student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await response.json();
                if (data.success) {
                    messageDiv.className = 'mt-3 text-center text-success';
                    messageDiv.textContent = data.message;
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.className = 'mt-3 text-center text-danger';
                    messageDiv.textContent = data.message;
                }
            } catch (error) {
                console.error('Registration error:', error);
                messageDiv.className = 'mt-3 text-center text-danger';
                messageDiv.textContent = 'Network error. Please try again.';
            }
        });
    }

    // --- Logic for Student Dashboard (student.html) ---
    if (window.location.pathname.endsWith('student.html')) {
        if (!user || user.Role !== 'Student') {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('userName').textContent = user.Name;

        function displayMenu(menu, containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            if (menu.length === 0) {
                container.innerHTML = '<p class="text-center">No menu available.</p>';
                return;
            }
            menu.forEach(item => {
                const card = `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-body">
                                <h5 class="card-title">${item.MealType}</h5>
                                <h4 class="card-subtitle mb-2 text-muted">${item.DishName}</h4>
                                <p class="card-text">${item.Description}</p>
                                <span class="badge bg-primary">${item.DietaryType}</span>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
        }

        async function fetchBothMenus() {
            const today = new Date().toISOString().slice(0, 10);
            const tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrow = tomorrowDate.toISOString().slice(0, 10);
            try {
                const todayResponse = await fetch(`/api/menu?date=${today}`);
                const todayMenu = await todayResponse.json();
                displayMenu(todayMenu, 'today-menu-container');

                const tomorrowResponse = await fetch(`/api/menu?date=${tomorrow}`);
                const tomorrowMenu = await tomorrowResponse.json();
                displayMenu(tomorrowMenu, 'tomorrow-menu-container');
            } catch (error) {
                console.error('Failed to fetch menus:', error);
                document.getElementById('today-menu-container').innerHTML = '<p class="text-center text-danger">Failed to load menu data.</p>';
                document.getElementById('tomorrow-menu-container').innerHTML = '<p class="text-center text-danger">Failed to load menu data.</p>';
            }
        }

        async function fetchNotifications() {
            try {
                const response = await fetch('/api/notifications');
                const notifications = await response.json();
                const notificationArea = document.getElementById('notification-area');
                notificationArea.innerHTML = '';
                if (notifications.length === 0) {
                    notificationArea.innerHTML = '<p class="mb-0">No new notifications.</p>';
                } else {
                    notifications.forEach(note => {
                        const noteElement = document.createElement('div');
                        noteElement.className = 'my-2';
                        noteElement.innerHTML = `<p class="mb-0"><strong>${new Date(note.Date).toLocaleString()}</strong>: ${note.Message}</p>`;
                        notificationArea.appendChild(noteElement);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                document.getElementById('notification-area').innerHTML = '<p class="text-danger">Failed to load notifications.</p>';
            }
        }

        document.getElementById('checkInBtn').addEventListener('click', async () => {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.UserID, mealType: 'Lunch' })
            });
            const result = await response.json();
            document.getElementById('checkInMessage').textContent = result.message;
        });

        document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const menuId = document.getElementById('feedbackMenuId').value;
            const rating = document.getElementById('rating').value;
            const comment = document.getElementById('comment').value;
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.UserID, menuId, rating, comment })
            });
            const result = await response.json();
            document.getElementById('feedbackMessage').textContent = result.message;
        });

        const recipeForm = document.getElementById('recipeForm');
        if (recipeForm) {
            recipeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const dishName = document.getElementById('dishName').value;
                const description = document.getElementById('description').value;
                const recipeMessage = document.getElementById('recipeMessage');
                const response = await fetch('/api/recipes/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.UserID, dishName, description })
                });
                const result = await response.json();
                recipeMessage.textContent = result.message;
                if (result.success) {
                    recipeMessage.className = 'mt-2 text-success';
                    recipeForm.reset();
                } else {
                    recipeMessage.className = 'mt-2 text-danger';
                }
            });
        }
        
        fetchBothMenus();
        fetchNotifications();
    }

    // --- Logic for Admin Dashboard (admin.html) ---
    else if (window.location.pathname.endsWith('admin.html')) {
        if (!user || user.Role !== 'Admin') {
            window.location.href = 'login.html';
            return;
        }

        let myChart;
        function createAttendanceChart(labels, data) {
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            if (myChart) {
                myChart.destroy();
            }
            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '# of Attendees',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        async function fetchAttendanceReport() {
            const endDate = new Date().toISOString().slice(0, 10);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const formattedStartDate = startDate.toISOString().slice(0, 10);
            const response = await fetch(`/api/admin/attendance/report?startDate=${formattedStartDate}&endDate=${endDate}`);
            const reportData = await response.json();
            const tableBody = document.getElementById('attendance-report-body');
            tableBody.innerHTML = '';
            const chartLabels = reportData.map(row => `${row.Date.slice(0, 10)}`);
            const chartData = reportData.map(row => row.TotalAttendance);
            createAttendanceChart(chartLabels, chartData);
            reportData.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.Date.slice(0, 10)}</td>
                    <td>-</td>
                    <td>${row.TotalAttendance}</td>
                `;
                tableBody.appendChild(tr);
            });
        }

        const addMenuForm = document.getElementById('addMenuForm');
        const menuManagementBody = document.getElementById('menu-management-body');
        const editMenuForm = document.getElementById('editMenuForm');

        function formatDateForDisplay(dateString) {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        async function fetchMenuManagement() {
            try {
                const response = await fetch('/api/admin/menu');
                const menuItems = await response.json();
                menuManagementBody.innerHTML = '';
                menuItems.forEach(item => {
                    const formattedDate = formatDateForDisplay(item.Date);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.MenuID}</td>
                        <td>${formattedDate}</td>
                        <td>${item.MealType}</td>
                        <td>${item.DishName}</td>
                        <td>
                            <button class="btn btn-warning btn-sm edit-btn" data-bs-toggle="modal" data-bs-target="#editMenuModal" data-id="${item.MenuID}" data-date="${formattedDate}" data-mealtype="${item.MealType}" data-dishname="${item.DishName}" data-dietarytype="${item.DietaryType}" data-description="${item.Description}">Edit</button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${item.MenuID}">Delete</button>
                        </td>
                    `;
                    menuManagementBody.appendChild(row);
                });
            } catch (error) {
                console.error('Failed to fetch menu:', error);
            }
        }

        addMenuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const menuData = {
                Date: document.getElementById('menuDate').value,
                MealType: document.getElementById('mealType').value,
                DishName: document.getElementById('dishName').value,
                DietaryType: document.getElementById('dietaryType').value,
                Description: document.getElementById('description').value
            };
            const response = await fetch('/api/admin/menu/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(menuData)
            });
            const result = await response.json();
            document.getElementById('addMenuMessage').textContent = result.message;
            if (result.success) fetchMenuManagement();
        });

        menuManagementBody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const menuId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this menu item?')) {
                    const response = await fetch(`/api/admin/menu/delete/${menuId}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (result.success) fetchMenuManagement();
                }
            }
        });

        menuManagementBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const btn = e.target;
                document.getElementById('editMenuId').value = btn.dataset.id;
                document.getElementById('editMenuDate').value = btn.dataset.date;
                document.getElementById('editMealType').value = btn.dataset.mealtype;
                document.getElementById('editDishName').value = btn.dataset.dishname;
                document.getElementById('editDietaryType').value = btn.dataset.dietarytype;
                document.getElementById('editDescription').value = btn.dataset.description;
            }
        });

        editMenuForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const menuId = document.getElementById('editMenuId').value;
            const menuData = {
                Date: document.getElementById('editMenuDate').value,
                MealType: document.getElementById('editMealType').value,
                DishName: document.getElementById('editDishName').value,
                DietaryType: document.getElementById('editDietaryType').value,
                Description: document.getElementById('editDescription').value
            };
            const response = await fetch(`/api/admin/menu/update/${menuId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(menuData)
            });
            const result = await response.json();
            if (result.success) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editMenuModal'));
                modal.hide();
                fetchMenuManagement();
            }
        });

        const recipeSuggestionsBody = document.getElementById('recipe-suggestions-body');
        async function fetchRecipeSuggestions() {
            try {
                const response = await fetch('/api/admin/recipes/pending');
                const suggestions = await response.json();
                recipeSuggestionsBody.innerHTML = '';
                suggestions.forEach(suggestion => {
                    const row = document.createElement('tr');
                    const statusColor = suggestion.Status === 'Approved' ? 'success' : suggestion.Status === 'Rejected' ? 'danger' : 'warning';
                    row.innerHTML = `
                        <td>${suggestion.SuggestionID}</td>
                        <td>${suggestion.DishName}</td>
                        <td>${suggestion.Description}</td>
                        <td><span class="badge bg-${statusColor}">${suggestion.Status}</span></td>
                        <td>
                            <button class="btn btn-success btn-sm approve-btn" data-id="${suggestion.SuggestionID}">Approve</button>
                            <button class="btn btn-danger btn-sm reject-btn" data-id="${suggestion.SuggestionID}">Reject</button>
                        </td>
                    `;
                    recipeSuggestionsBody.appendChild(row);
                });
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        }
        
        recipeSuggestionsBody.addEventListener('click', async (e) => {
            const btn = e.target;
            if (btn.classList.contains('approve-btn') || btn.classList.contains('reject-btn')) {
                const suggestionId = btn.dataset.id;
                const status = btn.classList.contains('approve-btn') ? 'Approved' : 'Rejected';
                const response = await fetch(`/api/admin/recipes/update/status/${suggestionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                const result = await response.json();
                if (result.success) {
                    fetchRecipeSuggestions();
                } else {
                    console.error(result.message);
                }
            }
        });

        document.getElementById('notificationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = document.getElementById('notificationMessage').value;
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, targetUserId: null })
            });
            const result = await response.json();
            document.getElementById('notificationMessageArea').textContent = result.message;
        });

        fetchMenuManagement();
        fetchAttendanceReport();
        fetchRecipeSuggestions();
    }
});