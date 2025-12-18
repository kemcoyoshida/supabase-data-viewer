// Todo管理機能

// todos変数はapp.jsで定義されている
// ここでは定義しない（app.jsの変数を使用）

// 通知チェック用のインターバル変数
let todoNotificationCheckInterval = null;

// Todoの読み込み（ローカルストレージから）
function loadTodos() {
    // app.jsのtodos変数を使用
    if (typeof todos === 'undefined') {
        console.error('todos変数が定義されていません');
        return [];
    }
    
    const stored = localStorage.getItem('todos');
    if (stored) {
        try {
            todos = JSON.parse(stored);
        } catch (e) {
            console.error('Todoの読み込みエラー:', e);
            todos = [];
        }
    } else {
        todos = [];
    }
    
    renderTodos();
    updateNotifications();
    // ダッシュボードのTodoリストも更新
    if (typeof updateDashboardTodos === 'function') {
        updateDashboardTodos();
    }
    return todos;
}

// Todoの保存（ローカルストレージへ）
function saveTodos() {
    // window.todosを優先的に使用（saveTodo関数で更新された最新の値を使用）
    let todosToSave;
    
    if (typeof window !== 'undefined' && typeof window.todos !== 'undefined' && Array.isArray(window.todos)) {
        todosToSave = window.todos;
        todos = window.todos; // グローバル変数も更新
    } else if (typeof todos !== 'undefined' && Array.isArray(todos)) {
        todosToSave = todos;
    } else {
        // localStorageから読み込む
        const stored = localStorage.getItem('todos');
        if (stored) {
            try {
                todosToSave = JSON.parse(stored);
                todos = todosToSave;
                if (typeof window !== 'undefined') {
                    window.todos = todosToSave;
                }
            } catch (e) {
                console.error('Todoの読み込みエラー:', e);
                todosToSave = [];
                todos = [];
                if (typeof window !== 'undefined') {
                    window.todos = [];
                }
            }
        } else {
            todosToSave = [];
            todos = [];
            if (typeof window !== 'undefined') {
                window.todos = [];
            }
        }
    }
    
    console.log('saveTodos: todosを保存します:', todosToSave);
    console.log('saveTodos: 保存数:', todosToSave.length);
    
    try {
        localStorage.setItem('todos', JSON.stringify(todosToSave));
        
        // グローバル変数も確実に更新
        if (typeof window !== 'undefined') {
            window.todos = todosToSave;
        }
        todos = todosToSave;
        
        console.log('saveTodos: localStorageに保存しました。保存数:', todosToSave.length);
        
        // 保存後の確認
        const saved = JSON.parse(localStorage.getItem('todos') || '[]');
        console.log('saveTodos: 保存後の確認。保存数:', saved.length);
        
        if (saved.length !== todosToSave.length) {
            console.warn('警告: 保存されたtodos数が一致しません。保存数:', saved.length, '期待値:', todosToSave.length);
        }
    } catch (error) {
        console.error('saveTodos: localStorageへの保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
        throw error;
    }
    
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
    console.log('updateDashboardTodos関数が呼ばれました');
    const dashboardList = document.getElementById('todo-dashboard-list');
    if (!dashboardList) {
        console.error('todo-dashboard-list要素が見つかりません');
        return;
    }
    
    // app.jsのtodos変数を使用
    let todosToUse = [];
    if (typeof todos !== 'undefined' && Array.isArray(todos) && todos.length > 0) {
        todosToUse = todos;
    } else {
        // localStorageから直接読み込む（フォールバック）
        const stored = localStorage.getItem('todos');
        if (stored) {
            try {
                todosToUse = JSON.parse(stored);
                // app.jsのtodos変数にも設定
                if (typeof todos !== 'undefined') {
                    todos = todosToUse;
                }
            } catch (e) {
                console.error('Todoの読み込みエラー:', e);
                todosToUse = [];
            }
        } else {
            // localStorageにデータがない場合は空配列
            todosToUse = [];
            if (typeof todos !== 'undefined') {
                todos = [];
            }
        }
    }
    

    let filteredTodos = todosToUse;
    const dashboardFilter = document.querySelector('.todo-dashboard-filter .filter-btn-small.active');
    if (dashboardFilter) {
        const filter = dashboardFilter.dataset.filter;
        if (filter === 'pending') {
            filteredTodos = todosToUse.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTodos = todosToUse.filter(t => t.completed);
        }
    }

    // すべて表示（制限なし）

    dashboardList.innerHTML = '';
    
    if (!filteredTodos || filteredTodos.length === 0) {
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
            <div class="todo-dashboard-actions">
                <button class="btn-danger btn-small" onclick="event.stopPropagation(); deleteTodo(${todo.id});" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        todoItem.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && !e.target.closest('.todo-dashboard-actions')) {
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
    if (!modal) {
        console.error('todo-modal要素が見つかりません');
        return;
    }
    
    const form = document.getElementById('todo-form');
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const datetimeInput = document.getElementById('todo-datetime');
    const notificationInput = document.getElementById('todo-notification');
    const modalTitle = document.getElementById('todo-modal-title');

    if (!form || !titleInput || !datetimeInput || !modalTitle) {
        console.error('Todoモーダルの要素が見つかりません');
        return;
    }

    // app.jsのtodos変数を使用
    if (typeof todos === 'undefined') {
        if (typeof window !== 'undefined') {
            window.todos = [];
        }
        todos = [];
    }

    if (todoId) {
        // 編集モード
        const todo = todos.find(t => t.id === todoId);
        if (todo) {
            modalTitle.textContent = 'Todoを編集';
            titleInput.value = todo.title || '';
            descriptionInput.value = todo.description || '';
            if (typeof formatDateTimeLocal === 'function') {
                datetimeInput.value = formatDateTimeLocal(todo.scheduledDateTime);
            } else {
                // フォールバック: datetime-local形式に変換
                const date = new Date(todo.scheduledDateTime);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
            if (notificationInput) {
                notificationInput.checked = todo.notification !== false;
            }
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
        if (typeof formatDateTimeLocal === 'function') {
            datetimeInput.value = formatDateTimeLocal(defaultDate);
        } else {
            // フォールバック: datetime-local形式に変換
            const year = defaultDate.getFullYear();
            const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const day = String(defaultDate.getDate()).padStart(2, '0');
            const hours = String(defaultDate.getHours()).padStart(2, '0');
            const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
            datetimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        if (notificationInput) {
            notificationInput.checked = true;
        }
    }

    // インラインスタイルを確実に上書き
    modal.removeAttribute('style');
    
    // モーダルを確実に表示
    modal.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 10000 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.6) !important;
    `;
    
    // モーダルコンテナも確認
    const modalContainer = modal.querySelector('.modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'flex';
        modalContainer.style.visibility = 'visible';
        modalContainer.style.opacity = '1';
    }
    
    // フォーカスをタイトル入力欄に設定
    setTimeout(() => {
        if (titleInput) {
            titleInput.focus();
        }
    }, 100);
}

// Todoモーダルを閉じる
function closeTodoModal() {
    console.log('closeTodoModal関数が呼ばれました');
    const modal = document.getElementById('todo-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
    }
    const form = document.getElementById('todo-form');
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
}

// Todoを保存
function saveTodo() {
    alert('saveTodo関数が呼ばれました'); // デバッグ用
    
    const form = document.getElementById('todo-form');
    if (!form) {
        alert('フォームが見つかりません');
        return;
    }
    
    const titleInput = document.getElementById('todo-title');
    const descriptionInput = document.getElementById('todo-description');
    const datetimeInput = document.getElementById('todo-datetime');
    const notificationInput = document.getElementById('todo-notification');

    if (!titleInput || !datetimeInput) {
        alert('入力要素が見つかりません');
        return;
    }

    const title = titleInput.value.trim() || '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const datetimeValue = datetimeInput.value || '';
    const notification = notificationInput ? notificationInput.checked : true;

    // datetime-localの値をISO形式に変換
    let scheduledDateTime = datetimeValue;
    if (datetimeValue) {
        const date = new Date(datetimeValue);
        if (!isNaN(date.getTime())) {
            scheduledDateTime = date.toISOString();
        }
    }

    // todos変数を取得（確実に）
    let currentTodos = [];
    if (typeof window !== 'undefined' && window.todos && Array.isArray(window.todos)) {
        currentTodos = window.todos;
    } else {
        const stored = localStorage.getItem('todos');
        if (stored) {
            try {
                currentTodos = JSON.parse(stored);
            } catch (e) {
                currentTodos = [];
            }
        }
    }

    const editId = form.dataset.editId;
    if (editId) {
        // 編集
        const todo = currentTodos.find(t => t.id === parseInt(editId));
        if (todo) {
            todo.title = title;
            todo.description = description;
            todo.scheduledDateTime = scheduledDateTime;
            todo.notification = notification;
            todo.updatedAt = new Date().toISOString();
        }
    } else {
        // 新規作成
        const newId = currentTodos.length > 0 ? Math.max(...currentTodos.map(t => t.id || 0)) + 1 : 1;
        const newTodo = {
            id: newId,
            title: title,
            description: description,
            scheduledDateTime: scheduledDateTime,
            notification: notification,
            completed: false,
            createdAt: new Date().toISOString()
        };
        currentTodos.push(newTodo);
        alert('Todoを追加しました。保存数: ' + currentTodos.length); // デバッグ用
    }
    
    // localStorageに保存
    try {
        localStorage.setItem('todos', JSON.stringify(currentTodos));
        alert('localStorageに保存しました。保存数: ' + currentTodos.length); // デバッグ用
        
        // window.todosも更新
        if (typeof window !== 'undefined') {
            window.todos = currentTodos;
        }
        if (typeof todos !== 'undefined') {
            todos = currentTodos;
        }
    } catch (error) {
        alert('保存エラー: ' + error.message);
        return;
    }
    
    // UI更新
    if (typeof renderTodos === 'function') {
        renderTodos();
    }
    if (typeof updateDashboardTodos === 'function') {
        updateDashboardTodos();
    }
    
    // モーダルを閉じる
    const modal = document.getElementById('todo-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
    
    alert('完了しました！'); // デバッグ用
}

// Todoの完了状態を切り替え
function toggleTodoComplete(todoId) {
    // app.jsのtodos変数を使用
    if (typeof todos === 'undefined') {
        console.error('todos変数が定義されていません');
        return;
    }
    
    if (!Array.isArray(todos)) {
        console.error('todos変数が配列ではありません');
        return;
    }
    
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
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    
    const todoTitle = todo.title || 'Todo';
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            'Todoを削除',
            `「${todoTitle}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                todos = todos.filter(t => t.id !== todoId);
                saveTodos();
                showMessage('Todoを削除しました', 'success');
                // ダッシュボードのTodoリストも更新
                if (typeof updateDashboardTodos === 'function') {
                    updateDashboardTodos();
                }
                // Todoページのリストも更新
                if (typeof renderTodos === 'function') {
                    renderTodos();
                }
            }
        );
    } else {
        // フォールバック
        if (confirm(`「${todoTitle}」を削除しますか？`)) {
            todos = todos.filter(t => t.id !== todoId);
            saveTodos();
            showMessage('Todoを削除しました', 'success');
            if (typeof updateDashboardTodos === 'function') {
                updateDashboardTodos();
            }
            // Todoページのリストも更新
            if (typeof renderTodos === 'function') {
                renderTodos();
            }
        }
    }
}

// Todo通知チェックを開始
function startTodoNotificationCheck() {
    // 既存のインターバルをクリア
    if (todoNotificationCheckInterval) {
        clearInterval(todoNotificationCheckInterval);
    }
    
    // 10秒ごとにチェック（30秒から短縮してより頻繁にチェック）
    todoNotificationCheckInterval = setInterval(() => {
        checkTodoNotifications();
    }, 10000); // 10秒
    
    // 初回チェック（即座に実行）
    setTimeout(() => {
        checkTodoNotifications();
    }, 1000); // 1秒後に初回チェック
}

// Todo通知をチェック
function checkTodoNotifications() {
    // todos変数が正しく読み込まれているか確認
    if (typeof todos === 'undefined' || !Array.isArray(todos)) {
        return;
    }
    
    const now = new Date();
    const notifiedIds = JSON.parse(localStorage.getItem('todoNotifiedIds') || '[]');
    
    todos.forEach(todo => {
        if (todo.completed || !todo.notification) return;
        
        const scheduledDate = new Date(todo.scheduledDateTime);
        const timeDiff = scheduledDate - now;
        const minutesDiff = Math.floor(timeDiff / 60000); // ミリ秒を分に変換
        
        // 予定時刻の5分前から通知（既に通知済みでない場合）
        // 時間が過ぎた後も30分間は通知を表示
        if (minutesDiff <= 5 && minutesDiff >= -30 && !notifiedIds.includes(todo.id)) {
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
    
    if (!popup || !titleEl || !messageEl) {
        console.error('Todo通知ポップアップの要素が見つかりません', {
            popup: !!popup,
            titleEl: !!titleEl,
            messageEl: !!messageEl
        });
        return;
    }
    
    titleEl.textContent = todo.title || 'Todo';
    
    // formatDateTime関数が存在するか確認
    const scheduledDate = new Date(todo.scheduledDateTime);
    let timeText = '';
    if (typeof formatDateTime === 'function') {
        timeText = formatDateTime(scheduledDate);
    } else {
        // フォールバック: 日時をフォーマット
        const year = scheduledDate.getFullYear();
        const month = String(scheduledDate.getMonth() + 1).padStart(2, '0');
        const day = String(scheduledDate.getDate()).padStart(2, '0');
        const hours = String(scheduledDate.getHours()).padStart(2, '0');
        const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
        timeText = `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    
    messageEl.textContent = `予定時刻: ${timeText}`;
    
    // モーダルを確実に表示
    popup.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 5000 !important;
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
    `;
    
    // 10秒後に自動で閉じる（5秒から延長）
    setTimeout(() => {
        if (popup) {
            popup.style.display = 'none';
        }
    }, 10000);
    
    // 通知音を再生（オプション）
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTQ8OUKjk8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU0PDlCo5PC2YxwGOJHX8sx5LAUkd8fw3ZBAC');
        audio.play().catch(() => {});
    } catch (e) {
        // 通知音の再生に失敗しても続行
    }
}

// Todo通知ポップアップを閉じる
function closeTodoNotificationPopup() {
    const popup = document.getElementById('todo-notification-popup');
    if (popup) {
        popup.style.display = 'none';
    }
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

// 日時をフォーマット（表示用）
function formatDateTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// グローバルスコープに公開（すべての関数定義の後で実行）
(function() {
    if (typeof window !== 'undefined') {
        // 関数を確実にグローバルスコープに公開
        window.openTodoModal = openTodoModal;
        window.closeTodoModal = closeTodoModal;
        window.saveTodo = saveTodo;
        window.toggleTodoComplete = toggleTodoComplete;
        window.editTodo = editTodo;
        window.deleteTodo = deleteTodo;
        
        // todos変数が未定義の場合は初期化
        if (typeof window.todos === 'undefined') {
            const stored = localStorage.getItem('todos');
            if (stored) {
                try {
                    window.todos = JSON.parse(stored);
                } catch (e) {
                    window.todos = [];
                }
            } else {
                window.todos = [];
            }
        }
        
        // app.jsのtodos変数も同期
        if (typeof todos === 'undefined') {
            todos = window.todos;
        }
        
        console.log('Todo関数をグローバルスコープに公開しました', {
            openTodoModal: typeof window.openTodoModal,
            closeTodoModal: typeof window.closeTodoModal,
            saveTodo: typeof window.saveTodo,
            toggleTodoComplete: typeof window.toggleTodoComplete,
            editTodo: typeof window.editTodo,
            deleteTodo: typeof window.deleteTodo,
            todos: Array.isArray(window.todos) ? window.todos.length + '件' : '未定義'
        });
        
        // 保存ボタンに直接イベントリスナーを追加（念のため）
        const setupSaveButton = () => {
            const saveBtn = document.getElementById('todo-save-btn');
            if (saveBtn) {
                // 既存のイベントリスナーを削除
                const newBtn = saveBtn.cloneNode(true);
                saveBtn.parentNode.replaceChild(newBtn, saveBtn);
                
                const btn = document.getElementById('todo-save-btn');
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('保存ボタンがクリックされました');
                        if (typeof window.saveTodo === 'function') {
                            console.log('window.saveTodoを呼び出します');
                            window.saveTodo();
                        } else {
                            console.error('saveTodo関数が見つかりません');
                            alert('saveTodo関数が見つかりません。ページをリロードしてください。');
                        }
                        return false;
                    });
                    console.log('保存ボタンのイベントリスナーを設定しました');
                }
            }
        };
        
        // DOMContentLoadedまたは即座に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSaveButton);
        } else {
            setupSaveButton();
        }
        
        // 少し遅延してからも実行（念のため）
        setTimeout(setupSaveButton, 100);
        setTimeout(setupSaveButton, 500);
        
        // Todoフォームのイベントリスナーを設定
        const setupTodoForm = () => {
            const todoForm = document.getElementById('todo-form');
            if (todoForm) {
                // 既存のイベントリスナーを削除
                const newForm = todoForm.cloneNode(true);
                todoForm.parentNode.replaceChild(newForm, todoForm);
                
                const form = document.getElementById('todo-form');
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Todoフォームの送信イベントが発生しました');
                    
                    if (typeof window.saveTodo === 'function') {
                        console.log('window.saveTodoを呼び出します');
                        window.saveTodo();
                    } else {
                        console.error('saveTodo関数が見つかりません');
                        alert('saveTodo関数が見つかりません。ページをリロードしてください。');
                    }
                    return false;
                });
                console.log('Todoフォームのイベントリスナーを設定しました');
            }
        };
        
        // DOMContentLoadedまたは即座に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupTodoForm);
        } else {
            setupTodoForm();
        }
        
        // 少し遅延してからも実行（念のため）
        setTimeout(setupTodoForm, 100);
    } else {
        console.error('windowオブジェクトが見つかりません');
    }
})();

