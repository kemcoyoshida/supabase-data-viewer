// Supabaseクライアントの初期化
let supabase;
let availableTables = [];
let currentTable = null;
let tableData = [];
let filteredData = [];
let selectedRows = new Set();
let currentPage = 1;
let itemsPerPage = 20;

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
        // 初期表示は一覧表示ページ
        showPage('list');
        
        // テーブル検索のイベントリスナー
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                updateTableList();
            });
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

    // カラムフィルターのEnterキー対応
    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('column-filter')) {
            applyFilters();
        }
    });

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
}

// ページ表示切り替え
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'dashboard') {
        updateDashboard();
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

    document.getElementById('dashboard-total-records').textContent = totalRecords.toLocaleString('ja-JP');
    document.getElementById('dashboard-table-count').textContent = availableTables.length;
    document.getElementById('dashboard-last-update').textContent = new Date().toLocaleDateString('ja-JP');

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
    
    if (availableTables.length === 0) {
        container.innerHTML = '<p class="info">テーブルが見つかりません</p>';
        return;
    }

    // あいまい検索フィルター（大文字小文字を区別しない、部分一致、複数単語対応）
    if (searchTerm === '') {
        filteredTables = [...availableTables];
    } else {
        // 検索語を単語に分割（スペース区切り）
        const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
        
        filteredTables = availableTables.filter(table => {
            const displayName = getTableDisplayName(table);
            
            // 検索対象となる文字列のバリエーションを生成
            const tableLower = table.toLowerCase();
            const displayLower = displayName.toLowerCase();
            // MachineCode -> machinecode, machine_code, machine-code なども検索
            const camelCase = table.replace(/([A-Z])/g, ' $1').toLowerCase();
            const snakeCase = table.replace(/_/g, ' ').toLowerCase();
            const kebabCase = table.replace(/-/g, ' ').toLowerCase();
            // 連続した大文字を分割（MachineCode -> Machine Code）
            const splitCamel = table.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
            
            // すべての検索対象文字列を結合
            const searchTargets = [
                tableLower,
                displayLower,
                camelCase,
                snakeCase,
                kebabCase,
                splitCamel
            ].join(' ');
            
            // すべての検索語が含まれているかチェック（AND検索）
            // または、いずれかの検索語が含まれているかチェック（OR検索）
            // より柔軟なあいまい検索：各単語が部分的にマッチするか
            const allWordsMatch = searchWords.every(word => {
                // 完全一致または部分一致
                if (searchTargets.includes(word)) {
                    return true;
                }
                // あいまい検索：文字列の一部が含まれているか
                // 例：「機械」で「機械コード」を検索、「code」で「MachineCode」を検索
                const wordChars = word.split('');
                // 文字列内で順序通りに文字が出現するかチェック（あいまいマッチ）
                let targetIndex = 0;
                for (let i = 0; i < wordChars.length; i++) {
                    const charIndex = searchTargets.indexOf(wordChars[i], targetIndex);
                    if (charIndex === -1) {
                        return false;
                    }
                    targetIndex = charIndex + 1;
                }
                return true;
            });
            
            return allWordsMatch;
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

// 検索フィールドの更新（テーブルのカラムに基づいて動的に生成）
function updateSearchFields(data) {
    const container = document.getElementById('search-fields-grid');
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        return;
    }

    const columns = Object.keys(data[0]);
    const excludedCols = ['id', 'created_at', 'updated_at', 'deleted_at'];
    const searchColumns = columns.filter(col => !excludedCols.includes(col.toLowerCase()));

    // 最大8個のフィールドを表示
    const displayColumns = searchColumns.slice(0, 8);

    displayColumns.forEach(col => {
        const field = document.createElement('div');
        field.className = 'search-field';
        field.innerHTML = `
            <label>${col}</label>
            <input type="text" class="search-input column-filter" data-column="${col}" placeholder="${col}で検索">
        `;
        container.appendChild(field);
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
    selectTh.style.cssText = 'width: 50px; min-width: 50px; max-width: 50px; box-sizing: border-box;';
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
        selectCell.style.cssText = 'width: 50px; min-width: 50px; max-width: 50px; padding: 4px; text-align: center; box-sizing: border-box;';
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
        detailBtn.style.cssText = 'padding: 6px 12px; font-size: 11px; width: 100%; white-space: nowrap; border-radius: 0; box-sizing: border-box;';
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
            // 新規登録モーダルを開く（データを自動入力）
            openRegisterModal('新規登録（複製）', duplicateData);
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
    const columnFilters = {};
    
    // カラム別フィルターを取得
    document.querySelectorAll('.column-filter').forEach(input => {
        const column = input.dataset.column;
        const value = input.value.trim();
        if (value) {
            columnFilters[column] = value;
        }
    });

    filteredData = tableData.filter(row => {
        // 全体検索（すべてのカラムを対象にしたあいまい検索）
        if (globalSearch) {
            const searchLower = globalSearch.toLowerCase();
            let found = false;
            // すべてのカラムの値を確認
            for (const key in row) {
                const value = String(row[key] || '').toLowerCase();
                if (value.includes(searchLower)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }

        // カラム別フィルター
        for (const column in columnFilters) {
            const filterValue = columnFilters[column].toLowerCase();
        const cellValue = String(row[column] || '').toLowerCase();
            if (!cellValue.includes(filterValue)) {
                return false;
            }
        }

        return true;
    });

    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// フィルターのクリア
function clearFilters() {
    document.getElementById('filter-global-search').value = '';
    document.querySelectorAll('.column-filter').forEach(input => {
        input.value = '';
    });
    filteredData = [...tableData];
    currentPage = 1;
    selectedRows.clear();
    displayTable();
    updateSelectionInfo();
}

// 全選択
function selectAllRows() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    for (let i = start; i < Math.min(end, filteredData.length); i++) {
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
    openRegisterModal('新規登録（複製）', duplicateData);
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
