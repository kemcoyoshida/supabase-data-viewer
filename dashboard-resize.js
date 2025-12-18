// ダッシュボードのリサイズ機能

let dashboardLayout = {
    calendarWidth: null,
    calendarHeight: null,
    taskListHeight: null
};

// レイアウト設定を読み込み
function loadDashboardLayout() {
    const saved = localStorage.getItem('dashboard_layout');
    if (saved) {
        try {
            dashboardLayout = JSON.parse(saved);
            applyDashboardLayout();
        } catch (e) {
            console.error('レイアウト設定の読み込みエラー:', e);
        }
    }
}

// レイアウト設定を保存
function saveDashboardLayout() {
    try {
        localStorage.setItem('dashboard_layout', JSON.stringify(dashboardLayout));
    } catch (e) {
        console.error('レイアウト設定の保存エラー:', e);
    }
}

// レイアウト設定を適用
function applyDashboardLayout() {
    const calendarCard = document.querySelector('.calendar-card');
    const taskListCard = document.querySelector('.task-list-card');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (calendarCard && dashboardLayout.calendarWidth) {
        calendarCard.style.width = dashboardLayout.calendarWidth + 'px';
        calendarCard.style.flexShrink = '0';
    }
    
    // 高さは両方とも同じにする
    const height = dashboardLayout.calendarHeight || dashboardLayout.taskListHeight;
    if (height) {
        if (calendarCard) {
            calendarCard.style.height = height + 'px';
            calendarCard.style.flexShrink = '0';
            
            // カレンダーグリッドの高さを調整
            if (calendarGrid) {
                const headerHeight = 120;
                const gridHeight = Math.max(200, height - headerHeight - 60);
                calendarGrid.style.minHeight = gridHeight + 'px';
            }
        }
        if (taskListCard) {
            taskListCard.style.height = height + 'px';
            taskListCard.style.flexShrink = '0';
        }
        
        dashboardLayout.calendarHeight = height;
        dashboardLayout.taskListHeight = height;
    }
}

// カレンダーのリサイズハンドルを追加
function setupCalendarResize() {
    const calendarCard = document.querySelector('.calendar-card');
    if (!calendarCard) return;
    
    // 既にリサイズハンドルが追加されている場合はスキップ
    if (calendarCard.querySelector('.resize-handle')) return;
    
    // リサイズハンドルを作成
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle calendar-resize-handle';
    resizeHandle.innerHTML = '<i class="fas fa-grip-lines-vertical"></i>';
    calendarCard.appendChild(resizeHandle);
    
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = calendarCard.offsetWidth;
        startHeight = calendarCard.offsetHeight;
        document.body.style.cursor = 'nwse-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(300, Math.min(800, startWidth + deltaX));
        const newHeight = Math.max(400, Math.min(800, startHeight + deltaY));
        
        calendarCard.style.width = newWidth + 'px';
        calendarCard.style.height = newHeight + 'px';
        calendarCard.style.flexShrink = '0';
        
        // タスクリストも同じ高さに合わせる
        const taskListCard = document.querySelector('.task-list-card');
        if (taskListCard) {
            taskListCard.style.height = newHeight + 'px';
            taskListCard.style.flexShrink = '0';
            dashboardLayout.taskListHeight = newHeight;
        }
        
        // カレンダーグリッドの高さを調整
        const calendarGrid = document.getElementById('calendar-grid');
        if (calendarGrid) {
            const headerHeight = 120; // ヘッダーとアクションボタンの高さ
            const gridHeight = Math.max(200, newHeight - headerHeight - 60);
            calendarGrid.style.minHeight = gridHeight + 'px';
            
            // カレンダーが小さくなったときの調整
            const dayCells = calendarGrid.querySelectorAll('.calendar-day');
            if (dayCells.length > 0) {
                const cellHeight = Math.max(30, (gridHeight - 10) / 5);
                dayCells.forEach(cell => {
                    cell.style.minHeight = cellHeight + 'px';
                });
            }
        }
        
        dashboardLayout.calendarWidth = newWidth;
        dashboardLayout.calendarHeight = newHeight;
        saveDashboardLayout();
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// タスクリストのリサイズハンドルを追加
function setupTaskListResize() {
    const taskListCard = document.querySelector('.task-list-card');
    if (!taskListCard) return;
    
    // 既にリサイズハンドルが追加されている場合はスキップ
    if (taskListCard.querySelector('.resize-handle')) return;
    
    // リサイズハンドルを作成
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle task-resize-handle';
    resizeHandle.innerHTML = '<i class="fas fa-grip-lines-vertical"></i>';
    taskListCard.appendChild(resizeHandle);
    
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startHeight = taskListCard.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaY = e.clientY - startY;
        const newHeight = Math.max(300, Math.min(800, startHeight + deltaY));
        
        taskListCard.style.height = newHeight + 'px';
        taskListCard.style.flexShrink = '0';
        
        // カレンダーも同じ高さに合わせる
        const calendarCard = document.querySelector('.calendar-card');
        if (calendarCard) {
            calendarCard.style.height = newHeight + 'px';
            calendarCard.style.flexShrink = '0';
            
            // カレンダーグリッドの高さを調整
            const calendarGrid = document.getElementById('calendar-grid');
            if (calendarGrid) {
                const headerHeight = 120;
                const gridHeight = Math.max(200, newHeight - headerHeight - 60);
                calendarGrid.style.minHeight = gridHeight + 'px';
            }
            
            dashboardLayout.calendarHeight = newHeight;
        }
        
        dashboardLayout.taskListHeight = newHeight;
        saveDashboardLayout();
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// レイアウト設定モーダルを開く
function openLayoutSettingsModal() {
    const modal = document.getElementById('layout-settings-modal');
    if (!modal) return;
    
    const calendarWidthInput = document.getElementById('layout-calendar-width');
    const calendarHeightInput = document.getElementById('layout-calendar-height');
    
    if (calendarWidthInput) {
        calendarWidthInput.value = dashboardLayout.calendarWidth || '';
    }
    if (calendarHeightInput) {
        // カレンダーまたはタスクリストの高さを表示（同じ値）
        calendarHeightInput.value = dashboardLayout.calendarHeight || dashboardLayout.taskListHeight || '';
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
}

// レイアウト設定モーダルを閉じる
function closeLayoutSettingsModal() {
    const modal = document.getElementById('layout-settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// レイアウト設定を保存
function saveLayoutSettings() {
    const calendarWidthInput = document.getElementById('layout-calendar-width');
    const calendarHeightInput = document.getElementById('layout-calendar-height');
    
    // 幅の設定
    if (calendarWidthInput && calendarWidthInput.value.trim()) {
        dashboardLayout.calendarWidth = parseInt(calendarWidthInput.value);
    } else {
        dashboardLayout.calendarWidth = null;
    }
    
    // 高さの設定（カレンダーとタスクリストは同じ）
    if (calendarHeightInput && calendarHeightInput.value.trim()) {
        const height = parseInt(calendarHeightInput.value);
        dashboardLayout.calendarHeight = height;
        dashboardLayout.taskListHeight = height;
    } else {
        dashboardLayout.calendarHeight = null;
        dashboardLayout.taskListHeight = null;
    }
    
    applyDashboardLayout();
    saveDashboardLayout();
    closeLayoutSettingsModal();
    
    if (typeof showMessage === 'function') {
        showMessage('レイアウト設定を保存しました', 'success');
    }
}

// レイアウト設定をリセット
function resetLayoutSettings() {
    dashboardLayout = {
        calendarWidth: null,
        calendarHeight: null,
        taskListHeight: null
    };
    
    const calendarCard = document.querySelector('.calendar-card');
    const taskListCard = document.querySelector('.task-list-card');
    
    if (calendarCard) {
        calendarCard.style.width = '';
        calendarCard.style.height = '';
        calendarCard.style.flexShrink = '';
    }
    if (taskListCard) {
        taskListCard.style.height = '';
        taskListCard.style.flexShrink = '';
    }
    
    // カレンダーグリッドの高さもリセット
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.style.minHeight = '';
    }
    
    saveDashboardLayout();
    closeLayoutSettingsModal();
    
    if (typeof showMessage === 'function') {
        showMessage('レイアウト設定をデフォルトに戻しました', 'success');
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        loadDashboardLayout();
        setupCalendarResize();
        setupTaskListResize();
    }, 1000);
});

// グローバルに公開
if (typeof window !== 'undefined') {
    window.resetLayoutSettings = resetLayoutSettings;
    window.adjustCalendarGridAfterUpdate = adjustCalendarGridAfterUpdate;
}

