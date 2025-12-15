// Supabaseクライアントの初期化
let supabase;
let availableTables = [];
let currentTable = null;
let tableData = [];
let filteredData = [];
let selectedRows = new Set();
let currentPage = 1;
let itemsPerPage = 20;
let todos = [];
let todoNotificationCheckInterval = null;
let currentTodoFilter = 'all';

// テーブル名の日本語マッピング
const TABLE_NAME_MAP = {
    'machines': '機械コード',
    'machine_codes': '機械コード',
    'MachineCode': '機械コード',
    'machineCode': '機械コード',
    'machine_code': '機械コード',
    'items': '商品管理',
    'products': '商品管理',
    'orders': '注文管理',
    'customers': '顧客管理',
    'suppliers': '仕入先管理',
    'projects': 'プロジェクト管理',
    'employees': '社員管理',
    'users': 'ユーザー管理'
};

// テーブル名を日本語に変換する関数
function getTableDisplayName(tableName) {
    if (TABLE_NAME_MAP[tableName]) {
        return TABLE_NAME_MAP[tableName];
    }
    // カメルケースやスネークケースを日本語っぽく変換
    const camelToJapanese = tableName
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .trim();
    return camelToJapanese || tableName;
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        await loadTables();
        setupEventListeners();
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        
        // Todoの読み込みと通知チェック開始
        setTimeout(() => {
            if (typeof loadTodos === 'function') {
                loadTodos();
            }
            if (typeof startTodoNotificationCheck === 'function') {
                startTodoNotificationCheck();
            }
        }, 100);
        
        // 初期表示はダッシュボードページ
        showPage('dashboard');
        
        // テーブル検索のイベントリスナー
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                updateTableList();
            });
            searchInput.addEventListener('keyup', (e) => {
                updateTableList();
            });
        } else {
            console.warn('table-search-input要素が見つかりません');
        }
    } catch (error) {
        showMessage('エラー: ' + error.message, 'error');
    }
});

// 現在時刻の更新
function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = `現在時刻: ${timeStr}`;
}

// イベントリスナーの設定
function setupEventListeners() {
    // メニューアイテム
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            showPage(page);
        });
    });

    // 検索実行
    document.getElementById('execute-search').addEventListener('click', () => {
        applyFilters();
    });

    // 検索クリア
    document.getElementById('clear-search').addEventListener('click', () => {
        clearFilters();
    });

    // 全体検索のEnterキー対応
    document.getElementById('filter-global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // カラム選択プルダウンの変更イベント対応
    const columnSelect = document.getElementById('filter-column-select');
    if (columnSelect) {
        columnSelect.addEventListener('change', () => {
            // プルダウン変更時は自動検索しない（検索実行ボタンで実行）
        });
    }

    // 新規登録
    document.getElementById('new-register').addEventListener('click', () => {
        openRegisterModal('新規登録', null);
    });

    // ページネーション
    document.getElementById('first-page').addEventListener('click', () => {
        currentPage = 1;
        displayTable();
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayTable();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            displayTable();
        }
    });

    document.getElementById('last-page').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / itemsPerPage);
        currentPage = maxPage;
        displayTable();
    });

    // CSV出力
    document.getElementById('csv-export').addEventListener('click', () => {
        exportToCSV();
    });

    // CSVインポート
    document.getElementById('csv-import').addEventListener('click', () => {
        document.getElementById('csv-file-input').click();
    });

    document.getElementById('csv-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await importFromCSV(file);
        }
        // 同じファイルを再度選択できるようにリセット
        e.target.value = '';
    });

    // 登録ボタン
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            openRegisterModal(type, null);
        });
    });

    // モーダル
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('cancel-register').addEventListener('click', closeModal);
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRecord();
    });

    // 削除確認モーダル
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', confirmDelete);

    // 全選択/全解除ボタン
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            selectAllRows();
        });
    }
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            deselectAllRows();
        });
    }

    // 通知アイコンボタン
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationCloseBtn = document.getElementById('notification-close-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationDropdown();
        });
    }
    
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeNotificationDropdown();
        });
    }

    // 通知ドロップダウン外をクリックで閉じる
    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && 
            notificationBtn && !notificationBtn.contains(e.target)) {
            closeNotificationDropdown();
        }
    });

    // タブボタンのイベントリスナー
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabContainer = e.target.closest('.card-header-with-tabs');
            if (tabContainer) {
                tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // タブ切り替え時の処理をここに追加可能
            }
        });
    });

    // ダッシュボードのTodo追加ボタン
    const addTodoDashboardBtn = document.getElementById('add-todo-dashboard-btn');
    if (addTodoDashboardBtn) {
        addTodoDashboardBtn.addEventListener('click', () => {
            if (typeof openTodoModal === 'function') {
                openTodoModal();
            }
        });
    }

    // ダッシュボードのTodoフィルターボタン
    setTimeout(() => {
        document.querySelectorAll('.todo-dashboard-filter .filter-btn-small').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.todo-dashboard-filter .filter-btn-small').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (typeof updateDashboardTodos === 'function') {
                    updateDashboardTodos();
                }
            });
        });
    }, 100);
}

// ページ表示切り替え
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'dashboard') {
        updateDashboard();
    } else if (pageName === 'todo') {
        if (typeof renderTodos === 'function') {
            renderTodos();
        }
    } else if (pageName === 'list' && currentTable) {
            loadTableData(currentTable);
        }
    }

// ダッシュボードの更新
async function updateDashboard() {
    let totalRecords = 0;
    for (const table of availableTables) {
        try {
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            totalRecords += count || 0;
        } catch (e) {
            // エラーは無視
        }
    }

    // KPIカードの更新
    updateKPICards(totalRecords);
    
    // グラフの更新
    updateCharts();

    // 通知の更新
    updateNotifications();

    // カレンダーの更新
    updateCalendar();

    // イベントリストの更新（Todoの通知時刻）
    updateEvents();

    // Todoリストの更新
    updateDashboardTodos();

    // 最近使用したテーブル（最初の5つ）
    const recentContainer = document.getElementById('recent-tables');
    recentContainer.innerHTML = '';
    const recentTables = availableTables.slice(0, 5);
    recentTables.forEach(table => {
        const item = document.createElement('div');
        item.className = 'recent-table-item';
        const displayName = getTableDisplayName(table);
        item.textContent = displayName;
        item.addEventListener('click', () => {
            currentTable = table;
            loadTableData(table);
            showPage('list');
        });
        recentContainer.appendChild(item);
    });
}

// KPIカードの更新
function updateKPICards(totalRecords) {
    // 実際のデータに基づいて更新（現在は総レコード数を表示）
    const productionEl = document.getElementById('kpi-production');
    const operatingRateEl = document.getElementById('kpi-operating-rate');
    const inventoryEl = document.getElementById('kpi-inventory');
    const deliveryRateEl = document.getElementById('kpi-delivery-rate');
    
    if (productionEl) productionEl.textContent = totalRecords.toLocaleString();
    if (operatingRateEl) operatingRateEl.textContent = '-';
    if (inventoryEl) inventoryEl.textContent = '-';
    if (deliveryRateEl) deliveryRateEl.textContent = '-';
}

// 通知の更新（Todoを含む）
function updateNotifications() {
    if (typeof updateNotificationsWithTodos === 'function') {
        updateNotificationsWithTodos();
    } else {
        // フォールバック（todo.jsが読み込まれていない場合）
        const notifications = [
            { type: 'danger', title: '在庫不足アラート', message: '部品Aの在庫が10個以下です', time: '5分前', unread: true },
            { type: 'warning', title: '納期遅延警告', message: '注文ID #12345の納期が迫っています', time: '15分前', unread: true }
        ];
        updateNotificationBadge(notifications);
    }
}

// 通知ドロップダウンの開閉
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display !== 'none';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    }
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// グラフの更新
let productionChart = null;
let operatingRateChart = null;
let defectRateChart = null;

function updateCharts() {
    // 月別生産量の折れ線グラフ
    const productionCtx = document.getElementById('production-chart');
    if (productionCtx && !productionChart) {
        productionChart = new Chart(productionCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
                datasets: [{
                    label: '生産量',
                    data: [1200, 1350, 1400, 1320, 1500, 1450, 1600, 1580, 1650, 1700, 1750, 1800],
                    borderColor: 'rgb(107, 143, 163)',
                    backgroundColor: 'rgba(107, 143, 163, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 工場別稼働率の円グラフ
    const operatingRateCtx = document.getElementById('operating-rate-chart');
    if (operatingRateCtx && !operatingRateChart) {
        operatingRateChart = new Chart(operatingRateCtx, {
            type: 'doughnut',
            data: {
                labels: ['工場A', '工場B', '工場C', '工場D'],
                datasets: [{
                    data: [35, 30, 20, 15],
                    backgroundColor: [
                        'rgba(107, 143, 163, 0.8)',
                        'rgba(90, 122, 143, 0.8)',
                        'rgba(125, 160, 181, 0.8)',
                        'rgba(107, 143, 163, 0.5)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 不良率の棒グラフ
    const defectRateCtx = document.getElementById('defect-rate-chart');
    if (defectRateCtx && !defectRateChart) {
        defectRateChart = new Chart(defectRateCtx, {
            type: 'bar',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '不良率 (%)',
                    data: [2.5, 2.1, 1.8, 2.0, 1.5, 1.2],
                    backgroundColor: 'rgba(201, 125, 125, 0.8)',
                    borderColor: 'rgba(201, 125, 125, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    // アクティビティ棒グラフ
    const activityBarCtx = document.getElementById('activity-bar-chart');
    if (activityBarCtx) {
        const activityBarChart = new Chart(activityBarCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Activity',
                    data: [320, 450, 380, 420, 480, 350, 400],
                    backgroundColor: 'rgba(107, 143, 163, 0.8)',
                    borderColor: 'rgba(107, 143, 163, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 500
                    }
                }
            }
        });
    }

    // アクティビティ折れ線グラフ
    const activityLineCtx = document.getElementById('activity-line-chart');
    if (activityLineCtx) {
        const activityLineChart = new Chart(activityLineCtx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
                datasets: [{
                    label: '2018',
                    data: [320, 380, 350, 400, 420, 450, 480, 500],
                    borderColor: 'rgba(201, 125, 125, 1)',
                    backgroundColor: 'rgba(201, 125, 125, 0.1)',
                    tension: 0.4
                }, {
                    label: '2017',
                    data: [280, 320, 300, 350, 380, 400, 420, 450],
                    borderColor: 'rgba(107, 143, 163, 1)',
                    backgroundColor: 'rgba(107, 143, 163, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// カレンダーの更新
function updateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearEl = document.getElementById('calendar-month-year');
    if (!calendarGrid || !monthYearEl) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    monthYearEl.textContent = `${year}/${String(month + 1).padStart(2, '0')} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month]}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダー
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day';
        dayHeader.style.fontWeight = '600';
        dayHeader.style.color = 'var(--text-secondary)';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // カレンダー日付
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dayMonth = currentDate.getMonth();
        const dayDate = currentDate.getDate();
        
        if (dayMonth !== month) {
            dayEl.classList.add('other-month');
        }
        
        if (dayMonth === month && dayDate === now.getDate()) {
            dayEl.classList.add('today');
        }
        
        // サンプル：20日以降を選択状態に
        if (dayMonth === month && dayDate >= 20 && dayDate <= 31) {
            dayEl.classList.add('selected');
        }
        
        dayEl.textContent = dayDate;
        calendarGrid.appendChild(dayEl);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// イベントリストの更新（Todoの通知時刻を表示）
function updateEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    // Todoから通知時刻があるものを取得
    const todos = typeof loadTodos === 'function' ? loadTodos() : [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 通知時刻がある未完了のTodoを取得し、日付順にソート
    const events = todos
        .filter(todo => !todo.completed && todo.notificationTime)
        .map(todo => {
            const notificationDate = new Date(todo.notificationTime);
            return {
                date: notificationDate,
                time: notificationDate,
                description: todo.title
            };
        })
        .filter(event => event.date >= today) // 今日以降のもののみ
        .sort((a, b) => a.date - b.date)
        .slice(0, 5) // 最新5件
        .map(event => {
            const date = event.date;
            const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
            const dayName = dayNames[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            
            return {
                date: `${dayName} ${month}/${day}`,
                time: `${displayHours}:${displayMinutes} ${ampm}`,
                description: event.description
            };
        });

    eventsList.innerHTML = '';
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="event-item" style="text-align: center; color: var(--text-tertiary); padding: 20px;">通知予定のTodoがありません</div>';
        return;
    }

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.innerHTML = `
            <div class="event-date">${event.date}</div>
            <div class="event-time">${event.time}</div>
            <div class="event-description">${event.description}</div>
        `;
        eventsList.appendChild(eventItem);
    });
}

// 進捗インジケーターの更新
function updateProgressIndicators() {
    const progressContainer = document.getElementById('progress-indicators');
    if (!progressContainer) return;

    const progressData = [
        { number: '01', value: 25, color: 'blue', description: 'Lorem ipsum dolor sit amet' },
        { number: '02', value: 58, color: 'green', description: 'Lorem ipsum dolor sit amet' },
        { number: '03', value: 15, color: 'red', description: 'Lorem ipsum dolor sit amet' },
        { number: '04', value: 100, color: 'green', description: 'Lorem ipsum dolor sit amet' }
    ];

    progressContainer.innerHTML = '';
    progressData.forEach(item => {
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (item.value / 100) * circumference;
        
        progressItem.innerHTML = `
            <div class="progress-circle-wrapper">
                <svg class="progress-circle" width="120" height="120">
                    <circle class="progress-circle-bg" cx="60" cy="60" r="${radius}" />
                    <circle class="progress-circle-fill ${item.color}" 
                            cx="60" cy="60" r="${radius}" 
                            stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}" />
                </svg>
                <div class="progress-circle-value">${item.value}%</div>
            </div>
            <div class="progress-item-number">${item.number}</div>
            <div class="progress-item-description">${item.description}</div>
        `;
        progressContainer.appendChild(progressItem);
    });
}

// アクティビティグラフの更新
function updateActivityCharts() {
    // この関数はupdateCharts()内で既に実装されているため、ここでは空にしておく
    // 必要に応じて追加の処理をここに記述
}

// テーブル一覧の読み込み
async function loadTables() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_CONFIG.key,
                'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.paths) {
                const tables = [];
                for (const path in data.paths) {
                    if (path.startsWith('/') && !path.startsWith('/rpc') && !path.startsWith('/$')) {
                        const tableName = path.slice(1).split('?')[0];
                        if (tableName && !tables.includes(tableName)) {
                            tables.push(tableName);
                        }
                    }
                }
                availableTables = tables.sort();
            }
        }

        if (availableTables.length === 0) {
            const commonTables = ['machines', 'machine_codes', 'items', 'products', 'orders'];
            for (const tableName of commonTables) {
                try {
                    const { error } = await supabase.from(tableName).select('id').limit(1);
                    if (!error) {
                        availableTables.push(tableName);
                    }
                } catch (e) {}
            }
        }

        updateTableList();
        if (availableTables.length > 0 && !currentTable) {
            currentTable = availableTables[0];
            loadTableData(currentTable);
        }
    } catch (error) {
        console.error('テーブル読み込みエラー:', error);
        showMessage('テーブル一覧の取得に失敗しました', 'error');
    }
}

// テーブル一覧の更新
let filteredTables = [];

function updateTableList() {
    const container = document.getElementById('table-list-content');
    const searchInput = document.getElementById('table-search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    if (!container) {
        console.error('table-list-content要素が見つかりません');
        return;
    }
    
    if (availableTables.length === 0) {
        container.innerHTML = '<p class="info">テーブルが見つかりません</p>';
        return;
    }

    // あいまい検索フィルター（大文字小文字を区別しない、部分一致）
    if (searchTerm === '') {
        filteredTables = [...availableTables];
    } else {
        const searchLower = searchTerm.toLowerCase().trim();
        
        filteredTables = availableTables.filter(table => {
            const displayName = getTableDisplayName(table);
            
            // テーブル名と表示名の両方を検索対象にする
            const tableLower = table.toLowerCase();
            const displayLower = displayName.toLowerCase();
            
            // 部分一致で検索（スペースを除去したバージョンも検索対象に含める）
            const tableNoSpaces = tableLower.replace(/\s+/g, '');
            const displayNoSpaces = displayLower.replace(/\s+/g, '');
            
            // 検索語が含まれているかチェック（複数のパターンでマッチング）
            // より確実な検索のため、すべてのバリエーションをチェック
            const searchPatterns = [
                tableLower,
                displayLower,
                tableNoSpaces,
                displayNoSpaces
            ];
            
            // いずれかのパターンに検索語が含まれているかチェック
            const matches = searchPatterns.some(pattern => pattern.includes(searchLower));
            
            return matches;
        });
    }

    container.innerHTML = '';
    if (filteredTables.length === 0) {
        container.innerHTML = '<p class="info">該当するテーブルがありません</p>';
        return;
    }

    filteredTables.forEach(table => {
        const item = document.createElement('div');
        item.className = 'table-list-item';
        const displayName = getTableDisplayName(table);
        item.textContent = displayName;
        item.addEventListener('click', () => {
            currentTable = table;
            document.querySelectorAll('.table-list-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadTableData(table);
            showPage('list');
        });
        if (table === currentTable) {
            item.classList.add('active');
        }
        container.appendChild(item);
    });
}


// テーブルデータの読み込み
async function loadTableData(tableName) {
    if (!tableName) return;

    try {
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(10000);

        if (error) throw error;

        tableData = data || [];
        filteredData = [...tableData];
        currentPage = 1;
        selectedRows.clear();
        
        updateTableTitle(tableName);
        updateSearchFields(tableData);
        displayTable();
        updateSelectionInfo();
    } catch (error) {
        showMessage('データの取得に失敗しました: ' + error.message, 'error');
    }
}

// 検索フィールドの更新（テーブルのカラムに基づいてプルダウンを生成）
function updateSearchFields(data) {
    const select = document.getElementById('filter-column-select');
    if (!select) {
        console.error('filter-column-select要素が見つかりません');
        return;
    }
    
    // 既存のオプションをクリア（「すべての項目を検索」以外）
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    if (!data || data.length === 0) {
        return;
    }

    const columns = Object.keys(data[0]);
    const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
    const searchColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

    // カラムをソートして追加
    const sortedColumns = [...searchColumns].sort((a, b) => {
        return a.localeCompare(b, 'ja');
    });

    sortedColumns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        select.appendChild(option);
    });
}

// テーブルタイトルの更新
function updateTableTitle(tableName) {
    const displayName = getTableDisplayName(tableName);
    document.getElementById('current-table-title').textContent = `${displayName} - 一覧表示`;
}

// テーブルの表示
function displayTable() {
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');

    if (filteredData.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px;">データがありません</td></tr>';
        updatePaginationInfo();
        return;
    }

    const columns = Object.keys(filteredData[0]);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredData.slice(start, end);

    // ヘッダー
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    const selectTh = document.createElement('th');
    selectTh.style.cssText = 'width: 80px; min-width: 80px; max-width: 80px; box-sizing: border-box;';
    selectTh.textContent = '選択';
    headerRow.appendChild(selectTh);
    
    const detailTh = document.createElement('th');
    detailTh.style.cssText = 'width: 70px; min-width: 70px; max-width: 70px; box-sizing: border-box;';
    detailTh.textContent = '詳細';
    headerRow.appendChild(detailTh);
    
    // データ列を先に追加
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        th.style.cssText = 'box-sizing: border-box;';
        headerRow.appendChild(th);
    });
    
    // 操作列を最後（右端）に追加
    const actionTh = document.createElement('th');
    actionTh.style.cssText = 'width: 120px; min-width: 120px; max-width: 120px; box-sizing: border-box;';
    actionTh.textContent = '操作';
    headerRow.appendChild(actionTh);
    
    thead.appendChild(headerRow);

    // ボディ
    tbody.innerHTML = '';
    pageData.forEach((row, index) => {
        const tr = document.createElement('tr');
        const globalIndex = start + index;
        
        // 選択チェックボックス
        const selectCell = document.createElement('td');
        selectCell.style.cssText = 'width: 80px; min-width: 80px; max-width: 80px; padding: 8px; text-align: center; box-sizing: border-box;';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = selectedRows.has(globalIndex);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedRows.add(globalIndex);
            } else {
                selectedRows.delete(globalIndex);
            }
            updateSelectionInfo();
            tr.classList.toggle('selected', e.target.checked);
        });
        selectCell.appendChild(checkbox);
        tr.appendChild(selectCell);

        // 詳細ボタン
        const detailCell = document.createElement('td');
        detailCell.style.cssText = 'padding: 4px; width: 70px; min-width: 70px; max-width: 70px; box-sizing: border-box;';
        const detailBtn = document.createElement('button');
        detailBtn.className = 'btn-secondary detail-btn';
        detailBtn.style.cssText = 'padding: 8px 12px; font-size: 13px; width: 100%; white-space: nowrap; border-radius: 4px; box-sizing: border-box; font-weight: 500;';
        detailBtn.textContent = '詳細';
        detailBtn.addEventListener('click', () => {
            openRegisterModal('編集', row);
        });
        detailCell.appendChild(detailBtn);
        tr.appendChild(detailCell);

        // データセルを先に追加
        columns.forEach(col => {
            const td = document.createElement('td');
            td.style.cssText = 'box-sizing: border-box;';
            td.textContent = row[col] !== null && row[col] !== undefined ? row[col] : '';
            tr.appendChild(td);
        });

        // 操作ボタン（削除・複製）を最後（右端）に追加
        const actionCell = document.createElement('td');
        actionCell.className = 'action-buttons-cell';
        actionCell.style.cssText = 'width: 120px; min-width: 120px; max-width: 120px; box-sizing: border-box; vertical-align: middle;';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn action-btn-delete';
        deleteBtn.title = '削除';
        deleteBtn.setAttribute('aria-label', '削除');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRow(row);
        });
        const duplicateBtn = document.createElement('button');
        duplicateBtn.className = 'action-btn action-btn-duplicate';
        duplicateBtn.textContent = '複製';
        duplicateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 複製データを準備（IDとタイムスタンプを除外）
            const duplicateData = { ...row };
            if (duplicateData.id !== undefined) delete duplicateData.id;
            if (duplicateData.created_at !== undefined) delete duplicateData.created_at;
            if (duplicateData.updated_at !== undefined) delete duplicateData.updated_at;
            if (duplicateData.deleted_at !== undefined) delete duplicateData.deleted_at;
            // 複製モーダルを開く（データを自動入力）
            openRegisterModal('複製', duplicateData);
        });
        actionCell.appendChild(deleteBtn);
        actionCell.appendChild(duplicateBtn);
        tr.appendChild(actionCell);

        if (selectedRows.has(globalIndex)) {
            tr.classList.add('selected');
        }

        tbody.appendChild(tr);
    });

    updatePaginationInfo();
}

// ページネーション情報の更新
function updatePaginationInfo() {
    const total = filteredData.length;
    const maxPage = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    
    document.getElementById('page-info').textContent = 
        `${currentPage}/${maxPage}ページ (${start}-${end}/該当レコード数: ${total} / 全レコード数: ${tableData.length})`;
}

// フィルターの適用
function applyFilters() {
    const globalSearch = document.getElementById('filter-global-search').value.trim();
    const columnSelect = document.getElementById('filter-column-select');
    const selectedColumn = columnSelect ? columnSelect.value : '';

    filteredData = tableData.filter(row => {
        // 検索キーワードが入力されていない場合はすべて表示
        if (!globalSearch) {
            return true;
        }

        const searchLower = globalSearch.toLowerCase();
        
        // カラムが選択されていない場合は全体検索（すべてのカラムを対象）
        if (!selectedColumn) {
            let found = false;
            // すべてのカラムの値を確認
            for (const key in row) {
                const value = String(row[key] || '').toLowerCase();
                if (value.includes(searchLower)) {
                    found = true;
                    break;
                }
            }
            return found;
        } else {
            // 選択されたカラムのみで検索
            const cellValue = String(row[selectedColumn] || '').toLowerCase();
            return cellValue.includes(searchLower);
        }
    });

    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// フィルターのクリア
function clearFilters() {
    document.getElementById('filter-global-search').value = '';
    const columnSelect = document.getElementById('filter-column-select');
    if (columnSelect) {
        columnSelect.value = '';
    }
    filteredData = [...tableData];
    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// 全選択（フィルタリングされたすべての行を選択）
function selectAllRows() {
    // フィルタリングされたすべての行を選択
    for (let i = 0; i < filteredData.length; i++) {
        selectedRows.add(i);
    }
    displayTable();
    updateSelectionInfo();
}

// 選択解除
function deselectAllRows() {
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// 選択情報の更新
function updateSelectionInfo() {
    document.getElementById('selection-count').textContent = `選択数: ${selectedRows.size}`;
}

// 削除対象の行を保持
let deleteTargetRow = null;

// 行の削除
function deleteRow(row) {
    deleteTargetRow = row;
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'flex';
}

// 削除の確定
async function confirmDelete() {
    if (!deleteTargetRow) return;

    try {
        const id = deleteTargetRow.id;
        if (!id) {
            showMessage('IDが存在しないため削除できません', 'error');
            closeDeleteModal();
            return;
        }

        const { error } = await supabase
            .from(currentTable)
            .delete()
            .eq('id', id);

        if (error) throw error;

        showMessage('データを削除しました', 'success');
        closeDeleteModal();
        await loadTableData(currentTable);
    } catch (error) {
        showMessage('削除に失敗しました: ' + error.message, 'error');
        closeDeleteModal();
    }
}

// 削除モーダルを閉じる
function closeDeleteModal() {
    const modal = document.getElementById('delete-confirm-modal');
    modal.style.display = 'none';
    deleteTargetRow = null;
}

// 行の複製（旧関数 - 現在は使用していません。複製ボタンはモーダルを開く方式に変更）
// この関数は削除しても問題ありませんが、互換性のため残しています
async function duplicateRow(row) {
    // 複製ボタンは新規登録モーダルを開く方式に変更されました
    // この関数は直接Supabaseに挿入する方式でしたが、エラーが発生しやすいため
    // モーダルで確認・編集してから登録する方式に変更しました
    const duplicateData = { ...row };
    if (duplicateData.id !== undefined) delete duplicateData.id;
    if (duplicateData.created_at !== undefined) delete duplicateData.created_at;
    if (duplicateData.updated_at !== undefined) delete duplicateData.updated_at;
    if (duplicateData.deleted_at !== undefined) delete duplicateData.deleted_at;
    openRegisterModal('複製', duplicateData);
}

// CSV出力（現在のテーブルデータを出力）
function exportToCSV() {
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    if (filteredData.length === 0) {
        showMessage('出力するデータがありません', 'warning');
        return;
    }
    
    const columns = Object.keys(filteredData[0]);
    const tableDisplayName = getTableDisplayName(currentTable);
    
    // CSVデータの生成
    const csv = [
        columns.join(','),
        ...filteredData.map(row => 
            columns.map(col => {
                const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `${tableDisplayName}_${dateStr}.csv`;
    link.click();
    showMessage(`${tableDisplayName}のCSVファイルをダウンロードしました`, 'success');
}

// CSVインポート
async function importFromCSV(file) {
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    try {
        showMessage('CSVファイルを読み込み中...', 'info');
        
        // ファイルを読み込む
        const text = await file.text();
        
        // BOMを除去（UTF-8 BOM対応）
        const csvText = text.replace(/^\uFEFF/, '');
        
        // CSVをパース
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            showMessage('CSVファイルにデータがありません', 'error');
            return;
        }

        // ヘッダー行を取得
        const headers = parseCSVLine(lines[0]);
        if (headers.length === 0) {
            showMessage('CSVファイルのヘッダーが無効です', 'error');
            return;
        }

        // データ行をパース
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            const row = {};
            headers.forEach((header, index) => {
                const value = values[index] || '';
                // 空文字列はnullに変換
                row[header] = value.trim() === '' ? null : value.trim();
            });
            rows.push(row);
        }

        if (rows.length === 0) {
            showMessage('インポートするデータがありません', 'warning');
            return;
        }

        // 確認ダイアログ
        if (!confirm(`${rows.length}件のデータをインポートしますか？\n既存のデータは上書きされません。`)) {
            return;
        }

        showMessage(`${rows.length}件のデータをインポート中...`, 'info');

        // Supabaseに一括挿入
        // 大量データの場合はバッチ処理
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const { data, error } = await supabase
                .from(currentTable)
                .insert(batch)
                .select();

            if (error) {
                console.error('インポートエラー:', error);
                errorCount += batch.length;
                // エラーが発生しても続行
            } else {
                successCount += data ? data.length : batch.length;
            }
        }

        if (errorCount > 0) {
            showMessage(`${successCount}件のインポートに成功しました。${errorCount}件でエラーが発生しました。`, 'warning');
        } else {
            showMessage(`${successCount}件のデータをインポートしました`, 'success');
        }

        // テーブルデータを再読み込み
        await loadTableData(currentTable);

    } catch (error) {
        console.error('CSVインポートエラー:', error);
        showMessage('CSVインポートに失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// CSV行をパース（クォート対応）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // エスケープされたクォート
                current += '"';
                i++; // 次の文字をスキップ
            } else {
                // クォートの開始/終了
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // カンマで区切る
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // 最後のフィールドを追加
    result.push(current);

    return result;
}

// 登録・編集モーダルを開く
function openRegisterModal(title, data) {
    document.getElementById('modal-title').textContent = title;
    const modal = document.getElementById('register-modal');
    modal.style.display = 'flex';
    
    if (!currentTable) {
        showMessage('テーブルを選択してください', 'warning');
        return;
    }

    // フォームフィールドの生成
    const container = document.getElementById('register-form-fields');
    container.innerHTML = '';

    if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
        const formColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

        formColumns.forEach(col => {
            const field = document.createElement('div');
            field.className = 'form-field';
            // データがある場合は値を設定、ない場合は空文字
            const value = data && data[col] !== undefined && data[col] !== null ? String(data[col]) : '';
            field.innerHTML = `
                <label>${col}</label>
                <input type="text" name="${col}" value="${value.replace(/"/g, '&quot;')}" class="form-input" required="false">
            `;
            container.appendChild(field);
        });
    }

    // 編集モードかどうかを判定（dataにidがある場合は編集）
    if (data && data.id !== undefined) {
        document.getElementById('register-form').dataset.editId = data.id;
    } else {
        delete document.getElementById('register-form').dataset.editId;
    }
}

// モーダルを閉じる
function closeModal() {
    const modal = document.getElementById('register-modal');
    modal.style.display = 'none';
    document.getElementById('register-form').reset();
}

// レコードの保存
async function saveRecord() {
    if (!currentTable) {
        showMessage('テーブルが選択されていません', 'error');
        return;
    }

    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const data = {};
    const editId = form.dataset.editId;

    // フォームのすべての入力フィールドからデータを取得
    const inputs = form.querySelectorAll('input[name], select[name], textarea[name]');
    inputs.forEach(input => {
        const key = input.name;
        const value = input.value;
        // すべてのフィールドをデータに追加（空文字列も含む）
        // required属性を削除して必須チェックを無効化
        input.removeAttribute('required');
        if (value !== null && value !== undefined) {
            // 空文字列の場合はnullに変換（データベースの制約に対応）
            // ただし、明示的に空文字列を送信したい場合は value.trim() を使用
            data[key] = value.trim() === '' ? null : value.trim();
        }
    });

    // データが空でも登録を許可（すべてのフィールドが空でもOK）
    // ただし、テーブルに必須項目がある場合はデータベース側でエラーになる可能性がある

    try {
        if (editId) {
            // 更新
            const { data: updatedData, error } = await supabase
                .from(currentTable)
                .update(data)
                .eq('id', editId)
                .select();
            
            if (error) {
                console.error('更新エラー詳細:', error);
                let errorMessage = 'データの更新に失敗しました';
                if (error.message) {
                    errorMessage += ': ' + error.message;
                }
                if (error.details) {
                    errorMessage += ' (' + error.details + ')';
                }
                if (error.hint) {
                    errorMessage += ' - ' + error.hint;
                }
                showMessage(errorMessage, 'error');
                return;
            }
            showMessage('データを更新しました', 'success');
        } else {
            // 新規登録
            const { data: insertedData, error } = await supabase
                .from(currentTable)
                .insert(data)
                .select();
            
            if (error) {
                console.error('登録エラー詳細:', error);
                console.error('登録しようとしたデータ:', data);
                let errorMessage = 'データの登録に失敗しました';
                if (error.message) {
                    errorMessage += ': ' + error.message;
                }
                if (error.details) {
                    errorMessage += ' (' + error.details + ')';
                }
                if (error.hint) {
                    errorMessage += ' - ' + error.hint;
                }
                // よくあるエラーの原因を追加で表示
                if (error.code === '23505') {
                    errorMessage += '\n（重複エラー: 既に存在する値が含まれています）';
                } else if (error.code === '23502') {
                    errorMessage += '\n（必須項目エラー: 必須項目が入力されていません）';
                } else if (error.code === '23503') {
                    errorMessage += '\n（外部キーエラー: 参照先が存在しません）';
                } else if (error.code === '22P02' || error.code === '42804') {
                    errorMessage += '\n（データ型エラー: データ型が一致しません）';
                }
                showMessage(errorMessage, 'error');
                return;
            }
            showMessage('データを登録しました', 'success');
        }

        closeModal();
        await loadTableData(currentTable);
    } catch (error) {
        console.error('保存処理エラー:', error);
        showMessage('保存に失敗しました: ' + (error.message || '不明なエラー'), 'error');
    }
}

// メッセージ表示
function showMessage(message, type = 'info') {
    const area = document.getElementById('message-area');
    const msg = document.createElement('div');
    msg.className = `message message-${type}`;
    msg.textContent = message;
    area.appendChild(msg);

    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}
