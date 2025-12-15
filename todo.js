// Todo管理機能

// Todoの読み込み（ローカルストレージから）
function loadTodos() {
    const stored = localStorage.getItem('todos');
    if (stored) {
        todos = JSON.parse(stored);
    } else {
        todos = [];
    }
    renderTodos();
    updateNotifications();
}

// Todoの保存（ローカルストレージへ）
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
    updateNotifications();
    // ダッシュボードのTodoリストも更新
    if (typeof updateDashboardTodos === 'function') {
        updateDashboardTodos();
    }
    // イベントリストも更新
    if (typeof updateEvents === 'function') {
        updateEvents();
    }
}

// ダッシュボード用Todoリストの更新
function updateDashboardTodos() {
    const dashboardList = document.getElementById('todo-dashboard-list');
    if (!dashboardList) return;

    let filteredTodos = todos;
    const dashboardFilter = document.querySelector('.todo-dashboard-filter .filter-btn-small.active');
    if (dashboardFilter) {
        const filter = dashboardFilter.dataset.filter;
        if (filter === 'pending') {
            filteredTodos = todos.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTodos = todos.filter(t => t.completed);
        }
    }

    // すべて表示（制限なし）

    dashboardList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
        dashboardList.innerHTML = '<div class="todo-dashboard-empty">Todoがありません</div>';
        return;
    }

    filteredTodos.forEach((todo) => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-dashboard-item ${todo.completed ? 'completed' : ''}`;
        
        const scheduledDate = new Date(todo.scheduledDateTime);
        const now = new Date();
        const isOverdue = !todo.completed && scheduledDate < now;
        
        todoItem.innerHTML = `
            <div class="todo-dashboard-checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="toggleTodoComplete(${todo.id}); updateDashboardTodos();">
            </div>
            <div class="todo-dashboard-content">
                <div class="todo-dashboard-title">${escapeHtml(todo.title)}</div>
                <div class="todo-dashboard-time ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-clock"></i> ${formatDateTime(scheduledDate)}
                </div>
            </div>
        `;
        
        todoItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                editTodo(todo.id);
            }
        });
        
        dashboardList.appendChild(todoItem);
    });
}

// Todoの表示
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;

    let filteredTodos = todos;
    if (currentTodoFilter === 'pending') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentTodoFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }

    todoList.innerHTML = '';
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<div class="todo-empty">Todoがありません</div>';
        return;
    }

    filteredTodos.forEach((todo, index) => {
        const todoItem = document.createElement('div');
        todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        const scheduledDate = new Date(todo.scheduledDateTime);
        const now = new Date();
        const isOverdue = !todo.completed && scheduledDate < now;
        
        todoItem.innerHTML = `
            <div class="todo-item-checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="toggleTodoComplete(${todo.id})">
            </div>
            <div class="todo-item-content">
                <div class="todo-item-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-item-description">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-item-meta">
                    <i class="fas fa-clock"></i>
                    <span class="${isOverdue ? 'overdue' : ''}">${formatDateTime(scheduledDate)}</span>
                </div>
            </div>
            <div class="todo-item-actions">
                <button class="todo-action-btn" onclick="editTodo(${todo.id})" title="編集">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="todo-action-btn delete" onclick="deleteTodo(${todo.id})" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        todoList.appendChild(todoItem);
    });
}

// Todoモーダルを開く
function openTodoModal(todoId = null) {
    const modal = document.getElementById('todo-modal');
    const form = document.getElementById('todo-form');
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const datetimeInput = document.getElementById('todo-datetime');
    const notificationInput = document.getElementById('todo-notification');
    const modalTitle = document.getElementById('todo-modal-title');

    if (todoId) {
        // 編集モード
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            modalTitle.textContent = 'Todoを編集';
            titleInput.value = todo.title;
            descriptionInput.value = todo.description || '';
            datetimeInput.value = formatDateTimeLocal(todo.scheduledDateTime);
            notificationInput.checked = todo.notification !== false;
            form.dataset.editId = todoId;
        }
    } else {
        // 新規作成モード
        modalTitle.textContent = '新しいTodoを追加';
        form.reset();
        delete form.dataset.editId;
        // デフォルトで1時間後を設定
        const defaultDate = new Date();
        defaultDate.setHours(defaultDate.getHours() + 1);
        datetimeInput.value = formatDateTimeLocal(defaultDate);
        notificationInput.checked = true;
    }

    modal.style.display = 'flex';
}

// Todoモーダルを閉じる
function closeTodoModal() {
    const modal = document.getElementById('todo-modal');
    modal.style.display = 'none';
    const form = document.getElementById('todo-form');
    form.reset();
    delete form.dataset.editId;
}

// Todoを保存
function saveTodo() {
    const form = document.getElementById('todo-form');
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const datetimeInput = document.getElementById('todo-datetime');
    const notificationInput = document.getElementById('todo-notification');

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const scheduledDateTime = datetimeInput.value;
    const notification = notificationInput.checked;

    if (!title || !scheduledDateTime) {
        showMessage('タイトルと予定日時は必須です', 'error');
        return;
    }

    const editId = form.dataset.editId;
    if (editId) {
        // 編集
        const todo = todos.find(t => t.id === parseInt(editId));
        if (todo) {
            todo.title = title;
            todo.description = description;
            todo.scheduledDateTime = scheduledDateTime;
            todo.notification = notification;
            todo.completed = false; // 編集時は未完了に戻す
        }
    } else {
        // 新規作成
        const newId = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;
        todos.push({
            id: newId,
            title: title,
            description: description,
            scheduledDateTime: scheduledDateTime,
            notification: notification,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }

    saveTodos();
    closeTodoModal();
    showMessage(editId ? 'Todoを更新しました' : 'Todoを追加しました', 'success');
    
    // ダッシュボードのTodoリストも更新
    if (typeof updateDashboardTodos === 'function') {
        updateDashboardTodos();
    }
}

// Todoの完了状態を切り替え
function toggleTodoComplete(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        // ダッシュボードのTodoリストも更新
        if (typeof updateDashboardTodos === 'function') {
            updateDashboardTodos();
        }
    }
}

// Todoを編集
function editTodo(todoId) {
    openTodoModal(todoId);
}

// Todoを削除
function deleteTodo(todoId) {
    if (confirm('このTodoを削除しますか？')) {
        todos = todos.filter(t => t.id !== todoId);
        saveTodos();
        showMessage('Todoを削除しました', 'success');
        // ダッシュボードのTodoリストも更新
        if (typeof updateDashboardTodos === 'function') {
            updateDashboardTodos();
        }
    }
}

// Todo通知チェックを開始
function startTodoNotificationCheck() {
    // 30秒ごとにチェック
    if (todoNotificationCheckInterval) {
        clearInterval(todoNotificationCheckInterval);
    }
    
    todoNotificationCheckInterval = setInterval(() => {
        checkTodoNotifications();
    }, 30000); // 30秒
    
    // 初回チェック
    checkTodoNotifications();
}

// Todo通知をチェック
function checkTodoNotifications() {
    const now = new Date();
    const notifiedIds = JSON.parse(localStorage.getItem('todoNotifiedIds') || '[]');
    
    todos.forEach(todo => {
        if (todo.completed || !todo.notification) return;
        
        const scheduledDate = new Date(todo.scheduledDateTime);
        const timeDiff = scheduledDate - now;
        
        // 予定時刻の5分前から通知（既に通知済みでない場合）
        if (timeDiff <= 300000 && timeDiff >= -600000 && !notifiedIds.includes(todo.id)) {
            showTodoNotification(todo);
            notifiedIds.push(todo.id);
            localStorage.setItem('todoNotifiedIds', JSON.stringify(notifiedIds));
        }
    });
}

// Todo通知を表示
function showTodoNotification(todo) {
    const popup = document.getElementById('todo-notification-popup');
    const titleEl = document.getElementById('todo-notification-title');
    const messageEl = document.getElementById('todo-notification-message');
    
    if (!popup || !titleEl || !messageEl) return;
    
    titleEl.textContent = todo.title;
    messageEl.textContent = `予定時刻: ${formatDateTime(new Date(todo.scheduledDateTime))}`;
    
    popup.style.display = 'flex';
    
    // 5秒後に自動で閉じる
    setTimeout(() => {
        popup.style.display = 'none';
    }, 5000);
    
    // 通知音を再生（オプション）
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTQ8OUKjk8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU0PDlCo5PC2YxwGOJHX8sx5LAUkd8fw3ZBAC');
        audio.play().catch(() => {});
    } catch (e) {}
}

// 通知を更新（Todoを含む）
function updateNotificationsWithTodos() {
    const todoNotifications = todos
        .filter(t => !t.completed && t.notification)
        .map(t => {
            const scheduledDate = new Date(t.scheduledDateTime);
            const now = new Date();
            const timeDiff = scheduledDate - now;
            const minutes = Math.floor(timeDiff / 60000);
            
            let type = 'info';
            let timeText = '';
            if (minutes < 0) {
                type = 'danger';
                timeText = `${Math.abs(minutes)}分前（期限切れ）`;
            } else if (minutes < 60) {
                type = 'warning';
                timeText = `${minutes}分後`;
            } else {
                const hours = Math.floor(minutes / 60);
                timeText = `${hours}時間後`;
            }
            
            return {
                type: type,
                title: `Todo: ${t.title}`,
                message: `予定時刻: ${formatDateTime(scheduledDate)}`,
                time: timeText,
                unread: true,
                todoId: t.id
            };
        });
    
    // 既存の通知と統合
    const allNotifications = [
        ...todoNotifications,
        { type: 'danger', title: '在庫不足アラート', message: '部品Aの在庫が10個以下です', time: '5分前', unread: true },
        { type: 'warning', title: '納期遅延警告', message: '注文ID #12345の納期が迫っています', time: '15分前', unread: true }
    ];
    
    const unreadCount = allNotifications.filter(n => n.unread).length;
    const badge = document.getElementById('header-notification-badge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    const dropdownBody = document.getElementById('notification-dropdown-body');
    if (dropdownBody) {
        dropdownBody.innerHTML = '';
        allNotifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-dropdown-item ${notification.unread ? 'unread' : ''}`;
            
            let iconClass = 'info';
            let icon = 'fa-info-circle';
            if (notification.type === 'warning') {
                iconClass = 'warning';
                icon = 'fa-exclamation-triangle';
            } else if (notification.type === 'danger') {
                iconClass = 'danger';
                icon = 'fa-exclamation-circle';
            }
            
            item.innerHTML = `
                <div class="notification-dropdown-item-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-dropdown-item-content">
                    <div class="notification-dropdown-item-title">${notification.title}</div>
                    <div class="notification-dropdown-item-time">${notification.time}</div>
                </div>
            `;
            
            if (notification.todoId) {
                item.addEventListener('click', () => {
                    showPage('todo');
                    closeNotificationDropdown();
                });
            }
            
            dropdownBody.appendChild(item);
        });
    }
}

// ユーティリティ関数
function formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

