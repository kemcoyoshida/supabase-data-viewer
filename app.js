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
        
        // KPIカードのイベントリスナーを設定
        setupKPICards();
        
        // 掲示板の読み込み
        loadBulletins();
        
        // task.jsの読み込みを待ってからイベントリスナーを設定
        const setupTaskFormListener = () => {
            const taskForm = document.getElementById('task-form');
            if (taskForm && typeof window.saveTask === 'function') {
                // 既存のイベントリスナーを削除
                const newForm = taskForm.cloneNode(true);
                taskForm.parentNode.replaceChild(newForm, taskForm);
                
                document.getElementById('task-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('タスクフォームの送信イベントが発生しました');
                    
                    if (typeof window.saveTask === 'function') {
                        window.saveTask();
                    } else {
                        console.error('saveTask関数が見つかりません');
                        alert('saveTask関数が見つかりません。ページをリロードしてください。');
                    }
                });
                console.log('タスクフォームのイベントリスナーを設定しました');
                return true;
            }
            return false;
        };
        
        // task.jsの読み込みを待つ（最大5秒）
        let attempts = 0;
        const maxAttempts = 50; // 5秒間（100ms × 50回）
        const checkInterval = setInterval(() => {
            attempts++;
            if (setupTaskFormListener() || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (attempts >= maxAttempts && typeof window.saveTask !== 'function') {
                    console.warn('saveTask関数の読み込みを待ちましたが、見つかりませんでした');
                }
            }
        }, 100);
        
        setupEventListeners();
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        
        // 初期表示はダッシュボードページ（先に表示）
        showPage('dashboard');
        
        // タスクの読み込み
        setTimeout(() => {
            console.log('タスクの読み込みを開始します');
            if (typeof loadTasks === 'function') {
                loadTasks();
            } else {
                console.warn('loadTasks関数が見つかりません');
            }
        }, 500);
        
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
    
    // 設定ボタンのイベントリスナー
    const headerBtns = document.querySelectorAll('.header-btn');
    headerBtns.forEach(btn => {
        if (btn.textContent.trim() === '設定') {
            btn.addEventListener('click', function() {
                openSettingsModal();
            });
        }
    });

    // 検索実行
    const executeSearchBtn = document.getElementById('execute-search');
    if (executeSearchBtn) {
        executeSearchBtn.addEventListener('click', () => {
            applyFilters();
        });
    }

    // 検索クリア
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            clearFilters();
        });
    }

    // 全体検索のEnterキー対応
    const globalSearchInput = document.getElementById('filter-global-search');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // カラム選択プルダウンの変更イベント対応
    const columnSelect = document.getElementById('filter-column-select');
    if (columnSelect) {
        columnSelect.addEventListener('change', () => {
            // プルダウン変更時は自動検索しない（検索実行ボタンで実行）
        });
        }

    // 新規登録
    const newRegisterBtn = document.getElementById('new-register');
    if (newRegisterBtn) {
        newRegisterBtn.addEventListener('click', () => {
            openRegisterModal('新規登録', null);
        });
    }

    // ページネーション
    const firstPageBtn = document.getElementById('first-page');
    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', () => {
            currentPage = 1;
            displayTable();
        });
    }

    const prevPageBtn = document.getElementById('prev-page');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayTable();
            }
        });
    }

    const nextPageBtn = document.getElementById('next-page');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                displayTable();
            }
        });
    }

    const lastPageBtn = document.getElementById('last-page');
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredData.length / itemsPerPage);
            currentPage = maxPage;
            displayTable();
        });
    }

    // CSV出力
    const csvExportBtn = document.getElementById('csv-export');
    if (csvExportBtn) {
        csvExportBtn.addEventListener('click', () => {
            exportToCSV();
        });
    }

    // CSVインポート
    const csvImportBtn = document.getElementById('csv-import');
    if (csvImportBtn) {
        csvImportBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('csv-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    const csvFileInput = document.getElementById('csv-file-input');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await importFromCSV(file);
            }
            // 同じファイルを再度選択できるようにリセット
            e.target.value = '';
        });
    }

    // 登録ボタン
    document.querySelectorAll('.register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            openRegisterModal(type, null);
        });
    });

    // モーダル
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    const cancelRegisterBtn = document.getElementById('cancel-register');
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', closeModal);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveRecord();
        });
    }

    // 削除確認モーダル
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }
    
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

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
        addTodoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 複数の方法でopenTodoModalを呼び出す
            if (typeof window.openTodoModal === 'function') {
                window.openTodoModal();
            } else if (typeof openTodoModal === 'function') {
                openTodoModal();
            } else {
                // 直接モーダルを表示するフォールバック
                const modal = document.getElementById('todo-modal');
                if (modal) {
                    modal.removeAttribute('style');
                    modal.style.display = 'flex';
                    modal.style.zIndex = '10000';
                    modal.style.position = 'fixed';
                    modal.style.top = '0';
                    modal.style.left = '0';
                    modal.style.right = '0';
                    modal.style.bottom = '0';
                }
            }
        });
    } else {
        console.warn('add-todo-dashboard-btn要素が見つかりません');
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
    console.log('showPage関数が呼ばれました:', pageName);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    const pageEl = document.getElementById(`${pageName}-page`);
    const menuEl = document.querySelector(`[data-page="${pageName}"]`);
    
    if (pageEl) {
        pageEl.classList.add('active');
    } else {
        console.error(`${pageName}-page要素が見つかりません`);
    }
    
    if (menuEl) {
        menuEl.classList.add('active');
    } else {
        console.warn(`[data-page="${pageName}"]要素が見つかりません`);
    }

    if (pageName === 'dashboard') {
        console.log('ダッシュボードページを表示します');
        // 少し遅延してからupdateDashboardを呼ぶ（DOMが確実に更新されるまで待つ）
        setTimeout(() => {
            console.log('updateDashboardを呼び出します');
            updateDashboard();
            // カレンダーを確実に表示するためにgoToToday()も呼ぶ
            setTimeout(() => {
                if (typeof goToToday === 'function') {
                    console.log('goToTodayを呼び出してカレンダーを初期化します');
                    goToToday();
                }
            }, 200);
        }, 100);
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
    console.log('updateDashboard関数が呼ばれました');
    
    let totalRecords = 0;
    for (const table of availableTables) {
        try {
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            totalRecords += count || 0;
        } catch (e) {
            // エラーは無視
        }
    }

    // KPIカードの更新（削除済み）
    
    // グラフの更新
    updateCharts();

    // 通知の更新
    updateNotifications();

    // カレンダーの更新
    console.log('カレンダーを更新します');
    if (typeof loadCalendarEvents === 'function') {
        loadCalendarEvents();
    } else {
        console.warn('loadCalendarEvents関数が見つかりません');
    }
    if (typeof loadCompanyCalendarEvents === 'function') {
        loadCompanyCalendarEvents();
    } else {
        console.warn('loadCompanyCalendarEvents関数が見つかりません');
    }
    
    // カレンダーの表示を確実に更新（少し遅延して複数回試行）
    let calendarUpdateAttempts = 0;
    const maxCalendarAttempts = 20; // 試行回数を増やす
    const updateCalendarWithRetry = () => {
        calendarUpdateAttempts++;
        const calendarGrid = document.getElementById('calendar-grid');
        const monthYearEl = document.getElementById('calendar-month-year');
        const weekdayHeader = document.getElementById('calendar-weekday-header');
        
        console.log('カレンダー要素の確認（試行', calendarUpdateAttempts, '）:', {
            calendarGrid: !!calendarGrid,
            monthYearEl: !!monthYearEl,
            weekdayHeader: !!weekdayHeader,
            dashboardPage: !!document.getElementById('dashboard-page'),
            calendarCard: !!document.querySelector('.calendar-card')
        });
        
        if (calendarGrid && monthYearEl) {
            // goToToday()を使って確実にカレンダーを初期化
            if (typeof goToToday === 'function') {
                console.log('goToToday()を呼び出してカレンダーを初期化します（試行回数:', calendarUpdateAttempts, '）');
                goToToday();
            } else if (typeof updateCalendar === 'function') {
                updateCalendar();
                console.log('カレンダーを更新しました（試行回数:', calendarUpdateAttempts, '）');
            } else {
                console.error('updateCalendar関数とgoToToday関数の両方が見つかりません');
            }
        } else if (calendarUpdateAttempts < maxCalendarAttempts) {
            console.log('カレンダー要素が見つかりません。再試行します（', calendarUpdateAttempts, '/', maxCalendarAttempts, '）');
            setTimeout(updateCalendarWithRetry, 300);
        } else {
            console.error('カレンダー要素が見つかりません（最大試行回数に達しました）', {
                calendarGrid: !!calendarGrid,
                monthYearEl: !!monthYearEl,
                weekdayHeader: !!weekdayHeader,
                dashboardPage: !!document.getElementById('dashboard-page'),
                calendarCard: !!document.querySelector('.calendar-card')
            });
            // 最後の試みとして、goToToday()またはupdateCalendar()を呼び出す
            if (typeof goToToday === 'function') {
                console.log('最後の試みとしてgoToToday()を呼び出します');
                goToToday();
            } else if (typeof updateCalendar === 'function') {
                console.log('最後の試みとしてupdateCalendarを呼び出します');
                updateCalendar();
            }
        }
    };
    
    // 即座に1回試行
    updateCalendarWithRetry();
    
    if (typeof updateCompanyCalendarList === 'function') {
        updateCompanyCalendarList();
    } else {
        console.warn('updateCompanyCalendarList関数が見つかりません');
    }

    // Todoリストの更新
    console.log('Todoリストを更新します');
    setTimeout(() => {
        if (typeof updateDashboardTodos === 'function') {
            updateDashboardTodos();
            console.log('Todoリストを更新しました');
        } else {
            console.error('updateDashboardTodos関数が見つかりません');
        }
    }, 200);
    
    // 右サイドバーの更新
    updateTodayEvents();
    updateDueTasks();
    
    // 会社カレンダーフォームのイベントリスナー
    const companyCalendarForm = document.getElementById('company-calendar-form');
    if (companyCalendarForm) {
        companyCalendarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const datesInput = document.getElementById('company-calendar-dates').value.trim();
            
            if (!datesInput) {
                alert('日付を入力してください');
                return;
            }
            
            // スペースまたは改行で分割して日付を取得
            const dateStrings = datesInput.split(/\s+/).map(s => s.trim()).filter(s => s.length > 0);
            const dates = [];
            
            // 日付をパース（YYYY/MM/DD形式またはYYYY-MM-DD形式に対応）
            dateStrings.forEach(dateInput => {
                let dateStr = '';
                // YYYY/MM/DD形式をYYYY-MM-DD形式に変換
                if (dateInput.includes('/')) {
                    const parts = dateInput.split('/');
                    if (parts.length === 3) {
                        dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                } else if (dateInput.includes('-')) {
                    dateStr = dateInput;
                }
                
                if (dateStr) {
                    // 日付の妥当性をチェック
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        dates.push(dateStr);
                    }
                }
            });
            
            if (dates.length === 0) {
                alert('有効な日付が見つかりませんでした。YYYY/MM/DD形式で入力してください。');
                return;
            }
            
            // 既に登録されている日付をチェック
            const existingDates = [];
            const newDates = [];
            
            dates.forEach(date => {
                const dateExists = companyCalendarEvents.some(event => {
                    const eventDate = new Date(event.date).toISOString().split('T')[0];
                    return eventDate === date;
                });
                
                if (dateExists) {
                    existingDates.push(date);
                } else {
                    newDates.push(date);
                }
            });
            
            // 新しい日付を追加
            let addedCount = 0;
            newDates.forEach(date => {
                companyCalendarEvents.push({
                    date: date,
                    title: '会社休日',
                    type: 'holiday',
                    description: '',
                    yearly: false
                });
                addedCount++;
            });
            
            if (addedCount > 0) {
                saveCompanyCalendarEvents();
                updateCompanyCalendarList();
                updateCalendar();
                
                let message = `${addedCount}件の会社カレンダーを登録しました`;
                if (existingDates.length > 0) {
                    message += `\n（${existingDates.length}件は既に登録済みでした）`;
                }
                showMessage(message, 'success');
            } else {
                alert('すべての日付が既に登録されています');
            }
            
            // フォームをリセット
            document.getElementById('company-calendar-dates').value = '';
        });
    }

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

// KPIカードのイベントリスナーを設定
function setupKPICards() {
    // 保存された値を読み込んで表示
    loadKPICards();
}

// KPIモーダルを開く
function openKPIModal(kpiType) {
    const modal = document.getElementById('kpi-modal');
    const titleEl = document.getElementById('kpi-modal-title');
    const labelEl = document.getElementById('kpi-form-label');
    const inputEl = document.getElementById('kpi-form-input');
    const noteEl = document.getElementById('kpi-form-note');
    
    if (!modal) return;
    
    // KPIタイプに応じてタイトルとラベルを設定
    const kpiConfig = {
        'production': { title: '生産量', label: '生産量', key: 'production' },
        'operating-rate': { title: '稼働率', label: '稼働率 (%)', key: 'operating-rate' },
        'delivery-rate': { title: '納期遵守率', label: '納期遵守率 (%)', key: 'delivery-rate' }
    };
    
    const config = kpiConfig[kpiType];
    if (!config) return;
    
    // 現在の値を読み込む
    const currentValue = localStorage.getItem(`kpi-${config.key}`) || '';
    
    titleEl.textContent = config.title;
    labelEl.textContent = config.label;
    inputEl.value = currentValue;
    inputEl.setAttribute('data-kpi-type', kpiType);
    inputEl.setAttribute('data-kpi-key', config.key);
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    // フォーカスを設定
    setTimeout(() => {
        inputEl.focus();
    }, 100);
}

// KPIモーダルを閉じる
function closeKPIModal() {
    const modal = document.getElementById('kpi-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// KPIを保存
function saveKPI() {
    const inputEl = document.getElementById('kpi-form-input');
    if (!inputEl) return;
    
    const kpiType = inputEl.getAttribute('data-kpi-type');
    const kpiKey = inputEl.getAttribute('data-kpi-key');
    const value = inputEl.value.trim();
    
    if (!kpiKey) return;
    
    // localStorageに保存
    if (value) {
        localStorage.setItem(`kpi-${kpiKey}`, value);
    } else {
        localStorage.removeItem(`kpi-${kpiKey}`);
    }
    
    // 表示を更新
    updateKPIDisplay(kpiKey, value);
    
    // モーダルを閉じる
    closeKPIModal();
}

// KPI表示を更新
function updateKPIDisplay(kpiKey, value) {
    const displayEl = document.getElementById(`kpi-${kpiKey}-display`);
    if (displayEl) {
        displayEl.textContent = value || '-';
    }
}

// KPIカードの更新（自動入力しない）
function updateKPICards(totalRecords) {
    // KPIカードはユーザーが手動で入力するため、自動更新しない
    // localStorageから保存された値を読み込む
    loadKPICards();
}

// KPIカードの値をlocalStorageから読み込む
function loadKPICards() {
    const kpiKeys = ['production', 'operating-rate', 'delivery-rate'];
    
    kpiKeys.forEach(key => {
        const savedValue = localStorage.getItem(`kpi-${key}`);
        updateKPIDisplay(key, savedValue);
    });
}

// グローバルに公開
window.openKPIModal = openKPIModal;
window.closeKPIModal = closeKPIModal;
window.saveKPI = saveKPI;

// 掲示板の管理
let bulletins = [];

// 掲示板を読み込む
function loadBulletins() {
    const saved = localStorage.getItem('bulletins');
    if (saved) {
        try {
            bulletins = JSON.parse(saved);
        } catch (e) {
            bulletins = [];
        }
    } else {
        bulletins = [];
    }
    renderBulletins();
}

// 掲示板を保存
function saveBulletins() {
    localStorage.setItem('bulletins', JSON.stringify(bulletins));
    renderBulletins();
}

// 掲示板を表示
function renderBulletins() {
    const listEl = document.getElementById('bulletin-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (bulletins.length === 0) {
        listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">掲示板がありません</div>';
        return;
    }
    
    // 日付でソート（新しい順）
    const sortedBulletins = [...bulletins].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedBulletins.forEach((bulletin, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'bulletin-item';
        itemEl.onclick = () => editBulletin(bulletin.id);
        
        const date = new Date(bulletin.date);
        const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        
        let filesHtml = '';
        if (bulletin.files && bulletin.files.length > 0) {
            filesHtml = `<div class="bulletin-files">
                ${bulletin.files.map((file, fileIndex) => {
                    const fileIcon = getFileIcon(file.type || file.name);
                    return `
                    <a href="#" class="bulletin-file-link" onclick="event.stopPropagation(); viewBulletinFile(${bulletin.id}, ${fileIndex}); return false;" title="表示: ${escapeHtml(file.name)}">
                        <i class="${fileIcon}"></i> ${escapeHtml(file.name)}
                    </a>
                `;
                }).join('')}
            </div>`;
        }
        
        itemEl.innerHTML = `
            <div class="bulletin-item-content">
                <span class="bulletin-date">${dateStr}</span>
                <span class="bulletin-dot">●</span>
                <span class="bulletin-text">${escapeHtml(bulletin.text)}</span>
            </div>
            ${filesHtml}
            <button class="bulletin-action-btn delete" onclick="event.stopPropagation(); deleteBulletin(${bulletin.id})" title="削除">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        listEl.appendChild(itemEl);
    });
}

// 掲示板モーダルを開く
function openBulletinModal(bulletinId = null) {
    const modal = document.getElementById('bulletin-modal');
    const titleEl = document.getElementById('bulletin-modal-title');
    const dateEl = document.getElementById('bulletin-date');
    const textEl = document.getElementById('bulletin-text');
    const fileEl = document.getElementById('bulletin-file');
    const fileListEl = document.getElementById('bulletin-file-list');
    const editIdEl = document.getElementById('bulletin-edit-id');
    
    if (!modal) return;
    
    // ファイルリストをクリア
    if (fileListEl) fileListEl.innerHTML = '';
    if (fileEl) fileEl.value = '';
    
    if (bulletinId) {
        // 編集モード
        const bulletin = bulletins.find(b => b.id === bulletinId);
        if (bulletin) {
            titleEl.textContent = '掲示板を編集';
            dateEl.value = bulletin.date;
            textEl.value = bulletin.text;
            editIdEl.value = bulletinId;
            
            // 既存の添付ファイルを表示
            if (bulletin.files && bulletin.files.length > 0 && fileListEl) {
                bulletin.files.forEach((file, index) => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'bulletin-file-item';
                    fileItem.innerHTML = `
                        <i class="fas fa-file"></i>
                        <span>${escapeHtml(file.name)}</span>
                        <button type="button" class="bulletin-file-remove" onclick="removeBulletinFile(${bulletinId}, ${index})" title="削除">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    fileListEl.appendChild(fileItem);
                });
            }
        }
    } else {
        // 新規追加モード
        titleEl.textContent = '掲示板を追加';
        dateEl.value = new Date().toISOString().split('T')[0];
        textEl.value = '';
        editIdEl.value = '';
    }
    
    // ファイル選択時の処理
    if (fileEl) {
        fileEl.onchange = function(e) {
            handleBulletinFileSelect(e, fileListEl);
        };
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    setTimeout(() => {
        textEl.focus();
    }, 100);
}

// ファイル選択時の処理
let selectedFiles = [];

function handleBulletinFileSelect(event, fileListEl) {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    files.forEach(file => {
        if (file.size > maxSize) {
            alert(`ファイル「${file.name}」は5MBを超えています。`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result // Base64エンコードされたデータ
            };
            
            selectedFiles.push(fileData);
            
            // ファイルリストに追加
            if (fileListEl) {
                const fileItem = document.createElement('div');
                fileItem.className = 'bulletin-file-item new';
                fileItem.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>${escapeHtml(file.name)}</span>
                    <button type="button" class="bulletin-file-remove" onclick="removeSelectedFile(${selectedFiles.length - 1})" title="削除">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                fileListEl.appendChild(fileItem);
            }
        };
        reader.readAsDataURL(file);
    });
}

// 選択中のファイルを削除
function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    const fileListEl = document.getElementById('bulletin-file-list');
    if (fileListEl) {
        const items = fileListEl.querySelectorAll('.bulletin-file-item.new');
        if (items[index]) {
            items[index].remove();
        }
    }
}

// 既存の添付ファイルを削除
function removeBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files) return;
    
    bulletin.files.splice(fileIndex, 1);
    saveBulletins();
    openBulletinModal(bulletinId); // モーダルを再表示
}

// 掲示板モーダルを閉じる
function closeBulletinModal() {
    const modal = document.getElementById('bulletin-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // 選択ファイルをクリア
    selectedFiles = [];
    const fileEl = document.getElementById('bulletin-file');
    const fileListEl = document.getElementById('bulletin-file-list');
    if (fileEl) fileEl.value = '';
    if (fileListEl) fileListEl.innerHTML = '';
}

// 掲示板を編集
function editBulletin(bulletinId) {
    openBulletinModal(bulletinId);
}

// 掲示板を保存
function saveBulletin() {
    const dateEl = document.getElementById('bulletin-date');
    const textEl = document.getElementById('bulletin-text');
    const editIdEl = document.getElementById('bulletin-edit-id');
    
    if (!dateEl || !textEl) return;
    
    const date = dateEl.value;
    const text = textEl.value.trim();
    
    if (!date || !text) {
        alert('日付と内容を入力してください');
        return;
    }
    
    const editId = editIdEl.value;
    
    if (editId) {
        // 編集
        const index = bulletins.findIndex(b => b.id === parseInt(editId));
        if (index !== -1) {
            bulletins[index].date = date;
            bulletins[index].text = text;
            
            // 新しいファイルを追加
            if (selectedFiles.length > 0) {
                if (!bulletins[index].files) {
                    bulletins[index].files = [];
                }
                bulletins[index].files.push(...selectedFiles);
            }
        }
    } else {
        // 新規追加
        const newId = bulletins.length > 0 ? Math.max(...bulletins.map(b => b.id)) + 1 : 1;
        bulletins.push({
            id: newId,
            date: date,
            text: text,
            files: selectedFiles.length > 0 ? [...selectedFiles] : []
        });
    }
    
    selectedFiles = []; // 選択ファイルをクリア
    saveBulletins();
    closeBulletinModal();
}

// 掲示板を削除
function deleteBulletin(bulletinId) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin) return;
    
    const bulletinText = bulletin.text || '掲示板';
    const date = new Date(bulletin.date);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            '掲示板を削除',
            `${dateStr}の掲示板「${bulletinText}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                bulletins = bulletins.filter(b => b.id !== bulletinId);
                saveBulletins();
                if (typeof showMessage === 'function') {
                    showMessage('掲示板を削除しました', 'success');
                } else {
                    alert('掲示板を削除しました');
                }
            }
        );
    } else {
        // フォールバック
        if (confirm(`${dateStr}の掲示板「${bulletinText}」を削除しますか？`)) {
            bulletins = bulletins.filter(b => b.id !== bulletinId);
            saveBulletins();
            if (typeof showMessage === 'function') {
                showMessage('掲示板を削除しました', 'success');
            } else {
                alert('掲示板を削除しました');
            }
        }
    }
}

// ファイルアイコンを取得
function getFileIcon(fileTypeOrName) {
    const type = fileTypeOrName.toLowerCase();
    const name = fileTypeOrName.toLowerCase();
    
    // 画像ファイル
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) {
        return 'fas fa-image';
    }
    // PDFファイル
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return 'fas fa-file-pdf';
    }
    // テキストファイル
    if (type.startsWith('text/') || /\.(txt|md|csv|json|xml|html|css|js)$/i.test(name)) {
        return 'fas fa-file-alt';
    }
    // Wordファイル
    if (type.includes('word') || /\.(doc|docx)$/i.test(name)) {
        return 'fas fa-file-word';
    }
    // Excelファイル
    if (type.includes('excel') || type.includes('spreadsheet') || /\.(xls|xlsx)$/i.test(name)) {
        return 'fas fa-file-excel';
    }
    // 動画ファイル
    if (type.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/i.test(name)) {
        return 'fas fa-file-video';
    }
    // 音声ファイル
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) {
        return 'fas fa-file-audio';
    }
    // その他
    return 'fas fa-file';
}

// ファイルタイプを判別
function getFileType(file) {
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    
    // 画像ファイル
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name)) {
        return 'image';
    }
    // PDFファイル
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
        return 'pdf';
    }
    // テキストファイル
    if (type.startsWith('text/') || /\.(txt|md|csv|json|xml|html|css|js)$/i.test(name)) {
        return 'text';
    }
    // その他（ダウンロードのみ）
    return 'other';
}

// 添付ファイルを表示
function viewBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files || !bulletin.files[fileIndex]) return;
    
    const file = bulletin.files[fileIndex];
    const fileType = getFileType(file);
    
    const modal = document.getElementById('file-viewer-modal');
    if (!modal) {
        // モーダルが存在しない場合はダウンロード
        downloadBulletinFile(bulletinId, fileIndex);
        return;
    }
    
    const titleEl = document.getElementById('file-viewer-title');
    const contentEl = document.getElementById('file-viewer-content');
    const downloadBtn = document.getElementById('file-viewer-download');
    
    if (titleEl) titleEl.textContent = file.name;
    
    // コンテンツをクリア
    if (contentEl) contentEl.innerHTML = '';
    
    // ダウンロードボタンの設定
    if (downloadBtn) {
        downloadBtn.onclick = () => downloadBulletinFile(bulletinId, fileIndex);
    }
    
    // ファイルタイプに応じて表示
    if (fileType === 'image') {
        // 画像を表示
        const img = document.createElement('img');
        img.src = file.data;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '70vh';
        img.style.objectFit = 'contain';
        img.style.margin = '0 auto';
        img.style.display = 'block';
        if (contentEl) contentEl.appendChild(img);
    } else if (fileType === 'pdf') {
        // PDFを表示
        const iframe = document.createElement('iframe');
        iframe.src = file.data;
        iframe.style.width = '100%';
        iframe.style.height = '70vh';
        iframe.style.border = 'none';
        if (contentEl) contentEl.appendChild(iframe);
    } else if (fileType === 'text') {
        // テキストを表示
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.maxHeight = '70vh';
        pre.style.overflow = 'auto';
        pre.style.padding = '16px';
        pre.style.background = 'var(--bg-secondary)';
        pre.style.borderRadius = '8px';
        pre.style.margin = '0';
        
        // Base64からテキストをデコード
        try {
            const base64Data = file.data.split(',')[1] || file.data;
            const text = atob(base64Data);
            pre.textContent = text;
        } catch (e) {
            pre.textContent = 'テキストの読み込みに失敗しました';
        }
        
        if (contentEl) contentEl.appendChild(pre);
    } else {
        // その他のファイルはダウンロードのみ
        downloadBulletinFile(bulletinId, fileIndex);
        return;
    }
    
    modal.style.display = 'flex';
    modal.style.zIndex = '10001';
}

// ファイルビューアモーダルを閉じる
function closeFileViewerModal() {
    const modal = document.getElementById('file-viewer-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 添付ファイルをダウンロード
function downloadBulletinFile(bulletinId, fileIndex) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin || !bulletin.files || !bulletin.files[fileIndex]) return;
    
    const file = bulletin.files[fileIndex];
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// グローバルに公開
window.openBulletinModal = openBulletinModal;
window.closeBulletinModal = closeBulletinModal;
window.saveBulletin = saveBulletin;
window.editBulletin = editBulletin;
window.deleteBulletin = deleteBulletin;
window.removeSelectedFile = removeSelectedFile;
window.removeBulletinFile = removeBulletinFile;
window.viewBulletinFile = viewBulletinFile;
window.closeFileViewerModal = closeFileViewerModal;
window.downloadBulletinFile = downloadBulletinFile;

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
    // グラフは削除されました
}

// カレンダー表示用の変数
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let calendarEvents = []; // カレンダーの予定
let companyCalendarEvents = []; // 会社カレンダーの予定（休日・イベント）

// 今日の予定を右サイドバーに表示
function updateTodayEvents() {
    const todayEventsList = document.getElementById('today-events-list');
    if (!todayEventsList) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
    });
    
    todayEventsList.innerHTML = '';
    
    if (todayEvents.length === 0) {
        todayEventsList.innerHTML = '<div class="sidebar-empty">予定はありません</div>';
        return;
    }
    
    todayEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'sidebar-event-item';
        eventItem.innerHTML = `
            <div class="sidebar-event-time">${event.time || ''}</div>
            <div class="sidebar-event-content">
                <div class="sidebar-event-title">${escapeHtml(event.title || '')}</div>
                ${event.description ? `<div class="sidebar-event-description">${escapeHtml(event.description)}</div>` : ''}
            </div>
        `;
        todayEventsList.appendChild(eventItem);
    });
}

// 期限のタスクを右サイドバーに表示
function updateDueTasks() {
    const dueTasksList = document.getElementById('due-tasks-list');
    if (!dueTasksList) return;
    
    if (typeof window.tasks === 'undefined' || !Array.isArray(window.tasks)) {
        dueTasksList.innerHTML = '<div class="sidebar-empty">期限のタスクはありません</div>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueTasks = window.tasks.filter(task => {
        if (task.completed) return false;
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
    });
    
    dueTasksList.innerHTML = '';
    
    if (dueTasks.length === 0) {
        dueTasksList.innerHTML = '<div class="sidebar-empty">期限のタスクはありません</div>';
        return;
    }
    
    dueTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'sidebar-task-item';
        const priorityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🔴'
        };
        const priorityLabels = {
            low: '低',
            medium: '中',
            high: '高'
        };
        taskItem.innerHTML = `
            <div class="sidebar-task-priority priority-${task.priority || 'medium'}">
                ${priorityIcons[task.priority || 'medium']} ${priorityLabels[task.priority || 'medium']}
            </div>
            <div class="sidebar-task-content">
                <div class="sidebar-task-title">${escapeHtml(task.title || '')}</div>
                ${task.description ? `<div class="sidebar-task-description">${escapeHtml(task.description)}</div>` : ''}
            </div>
        `;
        taskItem.onclick = () => {
            if (typeof window.editTask === 'function') {
                window.editTask(task.id);
            }
        };
        dueTasksList.appendChild(taskItem);
    });
}

// カレンダーの更新
function updateCalendar() {
    console.log('updateCalendar関数が呼ばれました');
    
    // 会社カレンダーを確実に読み込む
    if (typeof loadCompanyCalendarEvents === 'function') {
        loadCompanyCalendarEvents();
    }
    
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearEl = document.getElementById('calendar-month-year');
    
    console.log('カレンダー要素の確認:', {
        calendarGrid: !!calendarGrid,
        monthYearEl: !!monthYearEl
    });
    
    if (!calendarGrid || !monthYearEl) {
        console.error('カレンダー要素が見つかりません', {
            calendarGrid: !!calendarGrid,
            monthYearEl: !!monthYearEl
        });
        // 要素が見つからない場合は少し待ってから再試行
        setTimeout(() => {
            console.log('カレンダー要素を再確認します');
            const retryGrid = document.getElementById('calendar-grid');
            const retryMonthYear = document.getElementById('calendar-month-year');
            if (retryGrid && retryMonthYear) {
                console.log('カレンダー要素が見つかりました。再描画します');
                updateCalendar();
            } else {
                console.error('カレンダー要素が見つかりません（再試行後）');
            }
        }, 500);
        return;
    }

    const now = new Date();
    const year = currentCalendarYear;
    const month = currentCalendarMonth;
    
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    monthYearEl.textContent = `${year}年${monthNames[month]}`;

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weekdayHeader = document.getElementById('calendar-weekday-header');
    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダー
    if (weekdayHeader) {
        weekdayHeader.innerHTML = '';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day calendar-weekday';
            dayHeader.textContent = day;
            weekdayHeader.appendChild(dayHeader);
        });
    }

    // カレンダー日付（6週分 = 42日）
    const currentDate = new Date(startDate);
    for (let i = 0; i < 42; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dayMonth = currentDate.getMonth();
        const dayDate = currentDate.getDate();
        const dayYear = currentDate.getFullYear();
        const dayOfWeek = currentDate.getDay(); // 0=日曜日, 6=土曜日
        
        if (dayMonth !== month) {
            dayEl.classList.add('other-month');
        }
        
        // 曜日に応じたクラスを追加
        if (dayOfWeek === 0) {
            dayEl.classList.add('sunday');
        } else if (dayOfWeek === 6) {
            dayEl.classList.add('saturday');
        }
        
        // 今日の日付をハイライト
        if (dayYear === now.getFullYear() && dayMonth === now.getMonth() && dayDate === now.getDate()) {
            dayEl.classList.add('today');
        }
        
        // 休日判定（土日または会社カレンダーの休日）
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isCompanyHoliday = companyCalendarEvents.some(event => {
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(dayYear, dayMonth, dayDate);
            checkDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === checkDate.getTime() &&
                   (event.type === 'holiday' || !event.type);
        });
        
        if (isWeekend || isCompanyHoliday) {
            dayEl.classList.add('holiday');
        }
        
        // 予定がある日をマーク（個人予定のみ、会社カレンダーの休日は除外）
        const hasPersonalEvent = hasEventOnDate(dayYear, dayMonth, dayDate);
        // 会社カレンダーの休日は除外（休日マークだけで表示）
        const hasCompanyEvent = hasCompanyEventOnDate(dayYear, dayMonth, dayDate) && !isCompanyHoliday;
        
        if (hasPersonalEvent || hasCompanyEvent) {
            dayEl.classList.add('has-event');
            
            // その日の予定を取得（個人予定）
            const dayEvents = calendarEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === dayYear && 
                       eventDate.getMonth() === dayMonth && 
                       eventDate.getDate() === dayDate;
            });
            
            // その日の会社カレンダー予定を取得（休日を除く）
            const dayCompanyEvents = companyCalendarEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === dayYear && 
                       eventDate.getMonth() === dayMonth && 
                       eventDate.getDate() === dayDate &&
                       event.type !== 'holiday';
            });
            
            // 個人予定を表示
            if (dayEvents.length > 0) {
                const eventTitle = document.createElement('div');
                eventTitle.className = 'calendar-event-title';
                eventTitle.textContent = dayEvents[0].title;
                dayEl.appendChild(eventTitle);
            }
            
            // 予定が複数ある場合はバッジを表示
            const totalEvents = dayEvents.length + dayCompanyEvents.length;
            if (totalEvents > 1) {
                const badge = document.createElement('div');
                badge.className = 'calendar-event-badge';
                badge.textContent = `+${totalEvents - 1}`;
                dayEl.appendChild(badge);
            }
        }
        
        // 日付をクリックして予定を追加/表示
        dayEl.addEventListener('click', () => {
            if (!dayEl.classList.contains('other-month') && !dayEl.classList.contains('calendar-weekday')) {
                openCalendarEventModal(dayYear, dayMonth, dayDate);
            }
        });
        
        const dateText = document.createElement('div');
        dateText.className = 'calendar-date-number';
        dateText.textContent = dayDate;
        dayEl.appendChild(dateText);
        
        // 休日マークを追加
        if (isCompanyHoliday) {
            // 会社カレンダーの休日は「休」と表示
            const holidayMark = document.createElement('div');
            holidayMark.className = 'holiday-mark company-holiday-mark';
            holidayMark.textContent = '休';
            holidayMark.title = '会社休日';
            dayEl.appendChild(holidayMark);
        }
        
        calendarGrid.appendChild(dayEl);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // カレンダー更新後にグリッドの高さを調整
    if (typeof window.adjustCalendarGridAfterUpdate === 'function') {
        setTimeout(() => {
            window.adjustCalendarGridAfterUpdate();
        }, 100);
    }
}

// 指定した日付に予定があるかチェック
function hasEventOnDate(year, month, date) {
    const checkDate = new Date(year, month, date);
    checkDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return calendarEvents.some(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= checkDate && eventDate < nextDate;
    });
}

// 指定した日付に会社カレンダー予定があるかチェック
function hasCompanyEventOnDate(year, month, date) {
    const checkDate = new Date(year, month, date);
    checkDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(checkDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    return companyCalendarEvents.some(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= checkDate && eventDate < nextDate;
    });
}

// カレンダー予定を読み込み
function loadCalendarEvents() {
    console.log('loadCalendarEvents関数が呼ばれました');
    const saved = localStorage.getItem('calendar_events');
    if (saved) {
        try {
            calendarEvents = JSON.parse(saved);
            // 日付文字列をDateオブジェクトに変換
            calendarEvents = calendarEvents.map(event => ({
                ...event,
                date: new Date(event.date).toISOString().split('T')[0]
            }));
        } catch (e) {
            console.error('予定の読み込みエラー:', e);
            calendarEvents = [];
        }
    } else {
        calendarEvents = [];
    }
    
    // 会社カレンダーも読み込む
    if (typeof loadCompanyCalendarEvents === 'function') {
        loadCompanyCalendarEvents();
    }
    
    // updateCalendarはupdateDashboardから呼ばれるので、ここでは呼ばない（重複を避ける）
    // updateCalendar();
}

// 会社カレンダーの読み込み
function loadCompanyCalendarEvents() {
    const saved = localStorage.getItem('company_calendar_events');
    if (saved) {
        try {
            companyCalendarEvents = JSON.parse(saved);
            companyCalendarEvents = companyCalendarEvents.map(event => ({
                ...event,
                date: new Date(event.date).toISOString().split('T')[0]
            }));
            // 毎年繰り返す予定を処理
            processYearlyEvents();
        } catch (e) {
            console.error('会社カレンダーの読み込みエラー:', e);
            companyCalendarEvents = [];
        }
    } else {
        companyCalendarEvents = [];
    }
}

// 毎年繰り返す予定を処理
function processYearlyEvents() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    companyCalendarEvents.forEach(event => {
        if (event.yearly) {
            const eventDate = new Date(event.date);
            const eventMonth = eventDate.getMonth();
            const eventDay = eventDate.getDate();
            
            // 今年の日付が存在するかチェック
            const thisYearDate = new Date(currentYear, eventMonth, eventDay);
            const dateStr = thisYearDate.toISOString().split('T')[0];
            const existsThisYear = companyCalendarEvents.some(e => {
                const eDate = new Date(e.date);
                return eDate.getFullYear() === currentYear && 
                       eDate.getMonth() === eventMonth && 
                       eDate.getDate() === eventDay;
            });
            
            // 今年の日付が存在しない場合は追加
            if (!existsThisYear && eventDate.getFullYear() < currentYear) {
                companyCalendarEvents.push({
                    ...event,
                    date: dateStr,
                    yearly: true,
                    originalDate: event.date
                });
            }
        }
    });
    
    saveCompanyCalendarEvents();
}

// 会社カレンダーの保存
function saveCompanyCalendarEvents() {
    try {
        localStorage.setItem('company_calendar_events', JSON.stringify(companyCalendarEvents));
    } catch (e) {
        console.error('会社カレンダーの保存エラー:', e);
    }
}

// カレンダー予定を保存
function saveCalendarEvents() {
    try {
        localStorage.setItem('calendar_events', JSON.stringify(calendarEvents));
    } catch (e) {
        console.error('予定の保存エラー:', e);
    }
}

// 予定モーダルを開く
function openCalendarEventModal(year, month, date) {
    const selectedDate = new Date(year, month, date);
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(date).padStart(2, '0')}`;
    
    // その日の予定を取得
    const dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && 
               eventDate.getMonth() === month && 
               eventDate.getDate() === date;
    });
    
    const modal = document.getElementById('calendar-event-modal');
    const modalTitle = document.getElementById('calendar-event-modal-title');
    const eventList = document.getElementById('calendar-event-list');
    const addEventBtn = document.getElementById('calendar-add-event-btn');
    
    modalTitle.textContent = dateStr + ' の予定';
    eventList.innerHTML = '';
    
    if (dayEvents.length === 0) {
        eventList.innerHTML = '<div class="no-events">予定はありません</div>';
    } else {
        dayEvents.forEach((event, index) => {
            const eventItem = document.createElement('div');
            eventItem.className = 'calendar-event-item';
            eventItem.innerHTML = `
                <div class="event-content">
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    ${event.time ? `<div class="event-time">${escapeHtml(event.time)}</div>` : ''}
                    ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button class="event-edit-btn" onclick="editCalendarEvent('${year}-${month}-${date}', ${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="event-delete-btn" onclick="deleteCalendarEvent('${year}-${month}-${date}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            eventList.appendChild(eventItem);
        });
    }
    
    addEventBtn.onclick = () => {
        openCalendarEventFormModal(year, month, date);
        closeCalendarEventModal();
    };
    
    modal.style.display = 'flex';
}

// 予定モーダルを閉じる
function closeCalendarEventModal() {
    const modal = document.getElementById('calendar-event-modal');
    modal.style.display = 'none';
}

// 予定追加/編集フォームモーダルを開く
function openCalendarEventFormModal(year, month, date, eventIndex = null) {
    const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(date).padStart(2, '0')}`;
    
    const formModal = document.getElementById('calendar-event-form-modal');
    if (!formModal) {
        console.error('calendar-event-form-modal要素が見つかりません');
        alert('予定フォームを開けませんでした。ページをリロードしてください。');
        return;
    }
    
    const formTitle = document.getElementById('calendar-event-form-title');
    const eventForm = document.getElementById('calendar-event-form');
    const eventDateInput = document.getElementById('calendar-event-date');
    const eventTitleInput = document.getElementById('calendar-event-title');
    const eventTimeInput = document.getElementById('calendar-event-time');
    const eventDescriptionInput = document.getElementById('calendar-event-description');
    
    if (!formTitle || !eventForm || !eventDateInput || !eventTitleInput || !eventTimeInput || !eventDescriptionInput) {
        console.error('フォーム要素が見つかりません');
        alert('予定フォームを開けませんでした。ページをリロードしてください。');
        return;
    }
    
    formTitle.textContent = eventIndex === null ? '✨ 予定を追加' : '✏️ 予定を編集';
    eventDateInput.value = dateStr;
    
    // フォームをリセット
    eventTitleInput.value = '';
    eventTimeInput.value = '';
    eventDescriptionInput.value = '';
    
    // 編集モードの場合
    if (eventIndex !== null) {
        const eventsOnDate = calendarEvents.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getFullYear() === year && 
                   eDate.getMonth() === month && 
                   eDate.getDate() === date;
        });
        const actualEvent = eventsOnDate[eventIndex];
        if (actualEvent) {
            eventTitleInput.value = actualEvent.title || '';
            eventTimeInput.value = actualEvent.time || '';
            eventDescriptionInput.value = actualEvent.description || '';
        }
        eventForm.setAttribute('data-event-index', eventIndex);
    } else {
        eventForm.removeAttribute('data-event-index');
    }
    
    // フォームのsubmitイベントを設定
    eventForm.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();
        saveCalendarEvent(year, month, date, eventIndex);
        return false;
    };
    
    // モーダルを表示
    formModal.style.display = 'flex';
    formModal.style.zIndex = '10000';
    
    // フォーカスをタイトル入力に設定
    setTimeout(() => {
        eventTitleInput.focus();
    }, 100);
}

// 予定フォームモーダルを閉じる
function closeCalendarEventFormModal() {
    const formModal = document.getElementById('calendar-event-form-modal');
    if (formModal) {
        formModal.style.display = 'none';
    }
}

// 予定を保存
function saveCalendarEvent(year, month, date, eventIndex) {
    const title = document.getElementById('calendar-event-title').value.trim();
    const time = document.getElementById('calendar-event-time').value.trim();
    const description = document.getElementById('calendar-event-description').value.trim();
    
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    const eventDate = new Date(year, month, date);
    
    if (eventIndex !== null) {
        // 編集
        const dayEvents = calendarEvents.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getFullYear() === year && 
                   eDate.getMonth() === month && 
                   eDate.getDate() === date;
        });
        const actualIndex = calendarEvents.findIndex(e => {
            const eDate = new Date(e.date);
            return eDate.getFullYear() === year && 
                   eDate.getMonth() === month && 
                   eDate.getDate() === date;
        });
        if (actualIndex !== -1) {
            const targetIndex = actualIndex + eventIndex;
            if (targetIndex < calendarEvents.length) {
                calendarEvents[targetIndex] = {
                    date: eventDate,
                    title,
                    time,
                    description
                };
            }
        }
    } else {
        // 新規追加
        calendarEvents.push({
            date: eventDate,
            title,
            time,
            description
        });
    }
    
    saveCalendarEvents();
    updateCalendar();
    updateTodayEvents();
    closeCalendarEventFormModal();
}

// 予定を編集
function editCalendarEvent(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    openCalendarEventFormModal(year, month, date, eventIndex);
}

// 予定を削除
function deleteCalendarEvent(dateStr, eventIndex) {
    if (!confirm('この予定を削除しますか？')) return;
    
    const [year, month, date] = dateStr.split('-').map(Number);
    const dayEvents = calendarEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && 
               eDate.getMonth() === month && 
               eDate.getDate() === date;
    });
    
    if (dayEvents.length === 0 || eventIndex >= dayEvents.length) return;
    
    const targetEvent = dayEvents[eventIndex];
    const eventTitle = targetEvent.title || '予定';
    
    showDeleteConfirm(
        '予定を削除',
        `「${eventTitle}」を削除しますか？\nこの操作は取り消せません。`,
        () => {
            calendarEvents = calendarEvents.filter(e => e !== targetEvent);
            saveCalendarEvents();
            updateCalendar();
            updateTodayEvents();
            closeCalendarEventModal();
        }
    );
}

// 削除確認モーダルを表示
function showDeleteConfirm(title, message, onConfirm) {
    const modal = document.getElementById('delete-confirm-modal');
    const titleEl = document.getElementById('delete-confirm-title');
    const messageEl = document.getElementById('delete-confirm-message');
    
    if (!modal) {
        // フォールバック: 標準のconfirmを使用
        if (confirm(message)) {
            onConfirm();
        }
        return;
    }
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    // 既存のイベントリスナーを削除して新しいものを設定
    const cancelBtn = document.getElementById('delete-confirm-cancel');
    const okBtn = document.getElementById('delete-confirm-ok');
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const newCancelBtnEl = document.getElementById('delete-confirm-cancel');
        if (newCancelBtnEl) {
            newCancelBtnEl.onclick = function() {
                modal.style.display = 'none';
            };
        }
    }
    
    if (okBtn) {
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newOkBtnEl = document.getElementById('delete-confirm-ok');
        if (newOkBtnEl) {
            newOkBtnEl.onclick = function() {
                modal.style.display = 'none';
                onConfirm();
            };
        }
    }
    
    modal.style.display = 'flex';
}

// カレンダーの月を変更
function changeCalendarMonth(delta) {
    currentCalendarMonth += delta;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    updateCalendar();
}

// 今日の日付に戻る
function goToToday() {
    const now = new Date();
    currentCalendarYear = now.getFullYear();
    currentCalendarMonth = now.getMonth();
    updateCalendar();
}

// カレンダーの年を変更
function changeCalendarYear(delta) {
    currentCalendarYear += delta;
    updateCalendar();
}

// カレンダーの月を指定数だけ変更
function changeCalendarMonths(delta) {
    currentCalendarMonth += delta;
    while (currentCalendarMonth < 0) {
        currentCalendarMonth += 12;
        currentCalendarYear--;
    }
    while (currentCalendarMonth > 11) {
        currentCalendarMonth -= 12;
        currentCalendarYear++;
    }
    updateCalendar();
}

// 設定モーダルを開く
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        console.error('設定モーダルが見つかりません');
        alert('設定モーダルが見つかりません。ページをリロードしてください。');
        return;
    }
    
    // フォームをリセット
    const form = document.getElementById('company-calendar-form');
    if (form) {
        form.reset();
    }
    
    // 編集エリアに日付を読み込む
    loadCompanyCalendarEdit();
    modal.style.display = 'flex';
    console.log('設定モーダルを開きました');
}

// 設定モーダルを閉じる
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 会社カレンダーリストを更新
function updateCompanyCalendarList() {
    loadCompanyCalendarEdit();
}

// 会社カレンダー編集エリアに日付を読み込む
function loadCompanyCalendarEdit() {
    const textarea = document.getElementById('company-calendar-edit-list');
    if (!textarea) return;
    
    if (companyCalendarEvents.length === 0) {
        textarea.value = '';
        return;
    }
    
    // 日付順にソート
    const sortedEvents = [...companyCalendarEvents].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    // 日付をテキストエリアに表示（YYYY/MM/DD形式、スペース区切り）
    const dateStrings = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        return `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
    });
    
    textarea.value = dateStrings.join(' ');
}

// 会社カレンダー編集を保存
function saveCompanyCalendarEdit() {
    const textarea = document.getElementById('company-calendar-edit-list');
    if (!textarea) return;
    
    const datesInput = textarea.value.trim();
    
    if (!datesInput) {
        // 空の場合はすべて削除
        companyCalendarEvents = [];
        saveCompanyCalendarEvents();
        updateCalendar();
        return;
    }
    
    // スペースまたは改行で分割して日付を取得
    const dateStrings = datesInput.split(/\s+/).map(s => s.trim()).filter(s => s.length > 0);
    const dates = [];
    
    // 日付をパース（YYYY/MM/DD形式またはYYYY-MM-DD形式に対応）
    dateStrings.forEach(dateInput => {
        let dateStr = '';
        // YYYY/MM/DD形式をYYYY-MM-DD形式に変換
        if (dateInput.includes('/')) {
            const parts = dateInput.split('/');
            if (parts.length === 3) {
                dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        } else if (dateInput.includes('-')) {
            dateStr = dateInput;
        }
        
        if (dateStr) {
            // 日付の妥当性をチェック
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                dates.push(dateStr);
            }
        }
    });
    
    if (dates.length === 0) {
        alert('有効な日付が見つかりませんでした。YYYY/MM/DD形式またはYYYY-MM-DD形式で入力してください。');
        return;
    }
    
    // 重複を削除
    const uniqueDates = [...new Set(dates)];
    
    // 会社カレンダーイベントを更新
    companyCalendarEvents = uniqueDates.map(date => ({
        date: date,
        title: '会社休日',
        type: 'holiday'
    }));
    
    saveCompanyCalendarEvents();
    updateCalendar();
    
    // テキストエリアを更新
    loadCompanyCalendarEdit();
}

// 会社カレンダーをCSV出力
function exportCompanyCalendarToCSV() {
    if (companyCalendarEvents.length === 0) {
        alert('出力する会社カレンダーがありません。');
        return;
    }
    
    // 日付順にソート
    const sortedEvents = [...companyCalendarEvents].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    // CSVヘッダー
    const csvHeader = '日付,タイトル,種類\n';
    
    // CSVデータ行を生成
    const csvRows = sortedEvents.map(event => {
        const eventDate = new Date(event.date);
        const dateStr = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
        const title = event.title || '会社休日';
        const type = event.type === 'holiday' ? '休日' : (event.type || '休日');
        return `${dateStr},${title},${type}`;
    });
    
    // CSV全体を結合
    const csvContent = csvHeader + csvRows.join('\n');
    
    // BOMを追加してExcelで正しく開けるようにする
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // ファイル名を生成（現在の日付を含む）
    const now = new Date();
    const fileName = `会社カレンダー_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    link.setAttribute('download', fileName);
    
    // リンクをクリックしてダウンロード
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // URLを解放
    URL.revokeObjectURL(url);
}


// 会社カレンダーを編集
function editCompanyCalendarEvent(index) {
    if (index < 0 || index >= companyCalendarEvents.length) return;
    
    const event = companyCalendarEvents[index];
    const eventDate = new Date(event.date);
    const currentDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    
    const newDateStr = prompt('日付を変更してください（YYYY-MM-DD形式）:', currentDateStr);
    if (!newDateStr) return;
    
    // 日付の妥当性をチェック
    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime())) {
        alert('有効な日付を入力してください。');
        return;
    }
    
    // 既に登録されている日付かチェック
    const dateExists = companyCalendarEvents.some((e, i) => {
        if (i === index) return false;
        const eDate = new Date(e.date);
        return eDate.getTime() === newDate.getTime();
    });
    
    if (dateExists) {
        alert('この日付は既に登録されています。');
        return;
    }
    
    companyCalendarEvents[index].date = newDateStr;
    saveCompanyCalendarEvents();
    updateCompanyCalendarList();
    updateCalendar();
}

// 会社カレンダーイベントを削除
function deleteCompanyCalendarEvent(index) {
    if (index < 0 || index >= companyCalendarEvents.length) return;
    
    const event = companyCalendarEvents[index];
    const eventDate = new Date(event.date);
    const dateStr = `${eventDate.getFullYear()}/${String(eventDate.getMonth() + 1).padStart(2, '0')}/${String(eventDate.getDate()).padStart(2, '0')}`;
    
    showDeleteConfirm(
        '会社カレンダーを削除',
        `${dateStr}を削除しますか？\nこの操作は取り消せません。`,
        () => {
            companyCalendarEvents.splice(index, 1);
            saveCompanyCalendarEvents();
            updateCompanyCalendarList();
            updateCalendar();
        }
    );
}

// HTMLエスケープ関数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
// updateActivityCharts関数は削除されました（アクティビティグラフが不要のため）

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
        detailBtn.style.cssText = 'width: 100%; white-space: nowrap; border-radius: 4px; box-sizing: border-box;';
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

    // カスタムフォーム定義を確認
    const formConfig = typeof getFormConfig === 'function' ? getFormConfig(currentTable) : null;
    
    if (formConfig && formConfig.fields) {
        // カスタムフォーム定義を使用
        generateCustomFormFields(container, formConfig.fields, data);
    } else {
        // デフォルト動作：テーブルのカラムから自動生成
        generateDefaultFormFields(container, data);
    }

    // 編集モードかどうかを判定（dataにidがある場合は編集）
    if (data && data.id !== undefined) {
        document.getElementById('register-form').dataset.editId = data.id;
    } else {
        delete document.getElementById('register-form').dataset.editId;
    }
}

// カスタムフォームフィールドを生成
function generateCustomFormFields(container, fields, data) {
    fields.forEach(fieldConfig => {
        const field = document.createElement('div');
        const widthClass = fieldConfig.width === 'full' ? 'form-field-full' : 
                         fieldConfig.width === 'third' ? 'form-field-third' : 'form-field-half';
        field.className = `form-field ${widthClass}`;
        
        const value = data && data[fieldConfig.name] !== undefined && data[fieldConfig.name] !== null 
            ? String(data[fieldConfig.name]) : '';
        const escapedValue = value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        let fieldHTML = '';
        
        if (fieldConfig.label) {
            fieldHTML += `<label>${fieldConfig.label}${fieldConfig.required ? ' <span class="required">*</span>' : ''}</label>`;
        }
        
        switch (fieldConfig.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
                fieldHTML += `<input type="${fieldConfig.type}" name="${fieldConfig.name}" value="${escapedValue}" 
                    class="form-input" ${fieldConfig.required ? 'required' : ''} 
                    ${fieldConfig.pattern ? `pattern="${fieldConfig.pattern}"` : ''} 
                    ${fieldConfig.placeholder ? `placeholder="${fieldConfig.placeholder}"` : ''}>`;
                if (fieldConfig.note) {
                    fieldHTML += `<span class="field-note">${fieldConfig.note}</span>`;
                }
                break;
                
            case 'textarea':
                fieldHTML += `<textarea name="${fieldConfig.name}" class="form-input" rows="${fieldConfig.rows || 3}" 
                    ${fieldConfig.required ? 'required' : ''}>${escapedValue}</textarea>`;
                break;
                
            case 'select':
                fieldHTML += `<select name="${fieldConfig.name}" class="form-input" ${fieldConfig.required ? 'required' : ''}>`;
                if (fieldConfig.placeholder) {
                    fieldHTML += `<option value="">${fieldConfig.placeholder}</option>`;
                }
                fieldConfig.options.forEach(option => {
                    const selected = value === option.value ? 'selected' : '';
                    fieldHTML += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                fieldHTML += `</select>`;
                break;
                
            case 'checkbox-group':
                fieldHTML += `<div class="checkbox-group">`;
                const currentValues = value ? value.split(',').map(v => v.trim()) : [];
                fieldConfig.options.forEach(option => {
                    const checked = currentValues.includes(option.value) ? 'checked' : '';
                    fieldHTML += `
                        <label class="checkbox-label">
                            <input type="checkbox" name="${fieldConfig.name}[]" value="${option.value}" ${checked}>
                            <span>${option.label}</span>
                        </label>
                    `;
                });
                fieldHTML += `</div>`;
                break;
                
            case 'radio-group':
                fieldHTML += `<div class="radio-group">`;
                fieldConfig.options.forEach(option => {
                    const checked = value === option.value ? 'checked' : '';
                    fieldHTML += `
                        <label class="radio-label">
                            <input type="radio" name="${fieldConfig.name}" value="${option.value}" ${checked} ${fieldConfig.required ? 'required' : ''}>
                            <span>${option.label}</span>
                        </label>
                    `;
                });
                fieldHTML += `</div>`;
                break;
                
            default:
                fieldHTML += `<input type="text" name="${fieldConfig.name}" value="${escapedValue}" class="form-input">`;
        }
        
        field.innerHTML = fieldHTML;
        container.appendChild(field);
    });
}

// デフォルトフォームフィールドを生成（既存の動作）
function generateDefaultFormFields(container, data) {
    if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
        const formColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

        formColumns.forEach(col => {
            const field = document.createElement('div');
            field.className = 'form-field form-field-half';
            const value = data && data[col] !== undefined && data[col] !== null ? String(data[col]) : '';
            field.innerHTML = `
                <label>${col}</label>
                <input type="text" name="${col}" value="${value.replace(/"/g, '&quot;')}" class="form-input">
            `;
            container.appendChild(field);
        });
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
    const processedFields = new Set();
    
    inputs.forEach(input => {
        const key = input.name.replace('[]', ''); // チェックボックスの[]を削除
        if (processedFields.has(key)) {
            return; // 既に処理済みのフィールドはスキップ
        }
        
        // チェックボックスグループの処理
        if (input.type === 'checkbox' && input.name.endsWith('[]')) {
            const checkboxes = form.querySelectorAll(`input[name="${input.name}"]:checked`);
            const values = Array.from(checkboxes).map(cb => cb.value);
            data[key] = values.length > 0 ? values.join(',') : null;
            processedFields.add(key);
            return;
        }
        
        // 通常のフィールドの処理
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
                data[key] = input.value;
            } else if (input.type === 'radio') {
                // ラジオボタンで未選択の場合はスキップ
                return;
            } else {
                // チェックボックスで未選択の場合はnull
                data[key] = null;
            }
        } else {
        const value = input.value;
        // required属性を削除して必須チェックを無効化
        input.removeAttribute('required');
        if (value !== null && value !== undefined) {
            // 空文字列の場合はnullに変換（データベースの制約に対応）
            data[key] = value.trim() === '' ? null : value.trim();
        }
        }
        processedFields.add(key);
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
