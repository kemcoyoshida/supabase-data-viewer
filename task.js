// タスク管理機能

// タスクデータ
let tasks = [];

// タスクの読み込み（ローカルストレージから）
function loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('タスクの読み込みエラー:', e);
            tasks = [];
        }
    } else {
        tasks = [];
    }
    renderTasks();
    return tasks;
}

// タスクの保存（ローカルストレージへ）
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

// タスクの表示（Kanbanボード式）
function renderTasks() {
    const kanbanPending = document.getElementById('kanban-pending');
    const kanbanInProgress = document.getElementById('kanban-in-progress');
    const kanbanCompleted = document.getElementById('kanban-completed');
    
    if (!kanbanPending || !kanbanInProgress || !kanbanCompleted) return;

    // 各列をクリア
    kanbanPending.innerHTML = '';
    kanbanInProgress.innerHTML = '';
    kanbanCompleted.innerHTML = '';
    
    if (tasks.length === 0) {
        kanbanPending.innerHTML = '<div class="kanban-empty">タスクがありません</div>';
        return;
    }

    const priorityLabels = {
        low: '低',
        medium: '中',
        high: '高'
    };

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    tasks.forEach((task) => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}`;
        taskCard.draggable = true;
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDateOnly = dueDate ? new Date(dueDate) : null;
        if (dueDateOnly) {
            dueDateOnly.setHours(0, 0, 0, 0);
        }
        const isOverdue = !task.completed && dueDateOnly && dueDateOnly < now;
        const isDueToday = !task.completed && dueDateOnly && dueDateOnly.getTime() === now.getTime();
        
        // 優先度アイコン
        const priorityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        
        // ステータスアイコン
        const statusIcon = task.completed ? '✅' : (task.status === 'in-progress' ? '🔄' : '📝');
        
        taskCard.innerHTML = `
            <div class="task-card-header">
                <div class="task-card-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleTaskComplete(${task.id})">
                </div>
                <div class="task-card-status-icon">${statusIcon}</div>
                <div class="task-card-priority priority-${task.priority || 'medium'}">
                    ${priorityIcons[task.priority || 'medium']} ${priorityLabels[task.priority || 'medium']}
                </div>
            </div>
            <div class="task-card-body">
                <div class="task-card-title">${escapeHtml(task.title || '')}</div>
                ${task.description ? `<div class="task-card-description">${escapeHtml(task.description)}</div>` : ''}
            </div>
            <div class="task-card-footer">
                ${dueDate ? `<div class="task-card-due-date ${isOverdue ? 'overdue' : ''} ${isDueToday ? 'due-today' : ''}">
                    <i class="fas fa-calendar-alt"></i> ${formatDate(dueDate)}
                </div>` : ''}
                <div class="task-card-actions">
                    <button class="task-action-btn" onclick="event.stopPropagation(); editTask(${task.id})" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="event.stopPropagation(); deleteTask(${task.id})" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        taskCard.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox' && !e.target.closest('.task-card-actions')) {
                editTask(task.id);
            }
        });

        // ステータスに応じて列に追加
        if (task.completed) {
            kanbanCompleted.appendChild(taskCard);
            completedCount++;
        } else if (task.status === 'in-progress') {
            kanbanInProgress.appendChild(taskCard);
            inProgressCount++;
        } else {
            kanbanPending.appendChild(taskCard);
            pendingCount++;
        }
    });

    // カウントを更新（先に更新してから空メッセージを表示）
    const countPending = document.getElementById('count-pending');
    const countInProgress = document.getElementById('count-in-progress');
    const countCompleted = document.getElementById('count-completed');
    
    if (countPending) countPending.textContent = pendingCount;
    if (countInProgress) countInProgress.textContent = inProgressCount;
    if (countCompleted) countCompleted.textContent = completedCount;
    
    // 右サイドバーの状態も更新
    updateRightSidebarStatus(pendingCount, inProgressCount, completedCount);
    
    // 右サイドバーの期限タスクも更新
    if (typeof updateDueTasks === 'function') {
        updateDueTasks();
    }

    // 空の場合はメッセージを表示（カウントは表示したまま）
    if (pendingCount === 0 && kanbanPending.children.length === 0) {
        kanbanPending.innerHTML = '<div class="kanban-empty">✨ タスクがありません</div>';
    }
    if (inProgressCount === 0 && kanbanInProgress.children.length === 0) {
        kanbanInProgress.innerHTML = '<div class="kanban-empty">✨ タスクがありません</div>';
    }
    if (completedCount === 0 && kanbanCompleted.children.length === 0) {
        kanbanCompleted.innerHTML = '<div class="kanban-empty">✨ タスクがありません</div>';
    }
}

// タスクモーダルを開く
function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    if (!modal) {
        console.error('task-modal要素が見つかりません');
        return;
    }
    
    const form = document.getElementById('task-form');
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('task-due-date');
    const priorityInput = document.getElementById('task-priority');
    const statusInput = document.getElementById('task-status');
    const modalTitle = document.getElementById('task-modal-title');

    if (!form || !titleInput || !dueDateInput || !priorityInput || !statusInput || !modalTitle) {
        console.error('タスクモーダルの要素が見つかりません');
        return;
    }

    if (taskId) {
        // 編集モード
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            modalTitle.textContent = 'タスクを編集';
            titleInput.value = task.title || '';
            descriptionInput.value = task.description || '';
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                dueDateInput.value = date.toISOString().split('T')[0];
            } else {
                dueDateInput.value = '';
            }
            priorityInput.value = task.priority || 'medium';
            // ステータスを設定（完了済みの場合はcompleted、それ以外はstatusフィールドの値）
            if (task.completed) {
                statusInput.value = 'completed';
            } else {
                statusInput.value = task.status || 'pending';
            }
            form.dataset.editId = taskId;
        }
    } else {
        // 新規作成モード
        modalTitle.textContent = '新しいタスクを追加';
        form.reset();
        delete form.dataset.editId;
        priorityInput.value = 'medium';
        statusInput.value = 'pending';
    }

    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    setTimeout(() => {
        if (titleInput) {
            titleInput.focus();
        }
    }, 100);
}

// タスクモーダルを閉じる
function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('task-form');
    if (form) {
        form.reset();
        delete form.dataset.editId;
    }
}

// タスクを保存
function saveTask() {
    const form = document.getElementById('task-form');
    if (!form) {
        alert('フォームが見つかりません');
        return;
    }
    
    const titleInput = document.getElementById('task-title');
    const descriptionInput = document.getElementById('task-description');
    const dueDateInput = document.getElementById('task-due-date');
    const priorityInput = document.getElementById('task-priority');
    const statusInput = document.getElementById('task-status');

    if (!titleInput || !dueDateInput || !priorityInput || !statusInput) {
        alert('入力要素が見つかりません');
        return;
    }

    const title = titleInput.value.trim() || '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const dueDate = dueDateInput.value || '';
    const priority = priorityInput.value || 'medium';
    const status = statusInput.value || 'pending';

    const editId = form.dataset.editId;
    if (editId) {
        // 編集
        const task = tasks.find(t => t.id === parseInt(editId));
        if (task) {
            task.title = title;
            task.description = description;
            task.dueDate = dueDate;
            task.priority = priority;
            // ステータスに応じてcompletedとstatusを設定
            if (status === 'completed') {
                task.completed = true;
                task.status = 'completed';
            } else {
                task.completed = false;
                task.status = status;
            }
            task.updatedAt = new Date().toISOString();
        }
    } else {
        // 新規作成
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id || 0)) + 1 : 1;
        const newTask = {
            id: newId,
            title: title,
            description: description,
            dueDate: dueDate,
            priority: priority,
            status: status,
            completed: status === 'completed',
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }
    
    // 保存
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
        alert('保存に失敗しました: ' + error.message);
        return;
    }
    
    saveTasks();
    
    // 右サイドバーの期限タスクを更新
    if (typeof updateDueTasks === 'function') {
        updateDueTasks();
    }
    
    // 成功メッセージを表示
    const message = editId ? 'タスクを更新しました' : 'タスクを追加しました';
    if (typeof showMessage === 'function') {
        showMessage(message, 'success');
    } else {
        alert(message);
    }
    
    // モーダルを閉じる
    closeTaskModal();
}

// タスクの完了状態を切り替え
function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        // 完了状態に応じてステータスを更新
        if (task.completed) {
            task.status = 'completed';
        } else {
            // 完了を解除する場合は、元のステータスに戻すか、pendingにする
            if (task.status === 'completed') {
                task.status = 'pending';
            }
        }
        task.updatedAt = new Date().toISOString();
        saveTasks();
        
        // 右サイドバーの期限タスクを更新
        if (typeof updateDueTasks === 'function') {
            updateDueTasks();
        }
    }
}

// タスクを編集
function editTask(taskId) {
    openTaskModal(taskId);
}

// タスクを削除
function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const taskTitle = task.title || 'タスク';
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            'タスクを削除',
            `「${taskTitle}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                if (typeof showMessage === 'function') {
                    showMessage('タスクを削除しました', 'success');
                } else {
                    alert('タスクを削除しました');
                }
            }
        );
    } else {
        // フォールバック
        if (confirm(`「${taskTitle}」を削除しますか？`)) {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            
            // 右サイドバーの期限タスクを更新
            if (typeof updateDueTasks === 'function') {
                updateDueTasks();
            }
            
            if (typeof showMessage === 'function') {
                showMessage('タスクを削除しました', 'success');
            } else {
                alert('タスクを削除しました');
            }
        }
    }
}

// 日付をフォーマット（表示用）
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 右サイドバーの状態を更新
function updateRightSidebarStatus(pendingCount, inProgressCount, completedCount) {
    const statusPending = document.getElementById('status-pending');
    const statusInProgress = document.getElementById('status-in-progress');
    const statusCompleted = document.getElementById('status-completed');
    
    if (statusPending) statusPending.textContent = pendingCount;
    if (statusInProgress) statusInProgress.textContent = inProgressCount;
    if (statusCompleted) statusCompleted.textContent = completedCount;
}

// グローバルスコープに公開
(function() {
    if (typeof window !== 'undefined') {
        window.openTaskModal = openTaskModal;
        window.closeTaskModal = closeTaskModal;
        window.saveTask = saveTask;
        window.toggleTaskComplete = toggleTaskComplete;
        window.editTask = editTask;
        window.deleteTask = deleteTask;
        window.loadTasks = loadTasks;
        window.renderTasks = renderTasks;
        window.updateRightSidebarStatus = updateRightSidebarStatus;
        
        // タスクフィルターのイベントリスナー
        const setupTaskFilters = () => {
            const filterButtons = document.querySelectorAll('.task-filter .filter-btn-small');
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    const filter = this.dataset.filter;
                    filterTasks(filter);
                });
            });
        };
        
        // タスクをフィルター
        function filterTasks(filter) {
            const taskCards = document.querySelectorAll('.task-card');
            taskCards.forEach(card => {
                const isCompleted = card.classList.contains('completed');
                if (filter === 'all') {
                    card.style.display = '';
                } else if (filter === 'pending' && !isCompleted) {
                    card.style.display = '';
                } else if (filter === 'completed' && isCompleted) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // DOMContentLoadedまたは即座に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                loadTasks();
                setupTaskFilters();
            });
        } else {
            loadTasks();
            setupTaskFilters();
        }
        
        // 保存ボタンのイベントリスナー
        const setupSaveButton = () => {
            const saveBtn = document.getElementById('task-save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window.saveTask === 'function') {
                        window.saveTask();
                    }
                    return false;
                });
            }
        };
        
        setTimeout(setupSaveButton, 100);
    }
})();

