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

// カラム名の日本語マッピング（一般的なカラム名）
const COLUMN_NAME_MAP = {
    'id': 'ID',
    'name': '名前',
    'title': 'タイトル',
    'description': '部品名',
    'created_at': '作成日時',
    'updated_at': '更新日時',
    'createdAt': '作成日時',
    'updatedAt': '更新日時',
    'date': '日付',
    'time': '時間',
    'datetime': '日時',
    'email': 'メールアドレス',
    'phone': '電話番号',
    'address': '住所',
    'status': 'ステータス',
    'type': '種類',
    'category': 'カテゴリ',
    'price': '価格',
    'quantity': '数量',
    'amount': '金額',
    'total': '合計',
    'code': 'コード',
    'number': '番号',
    'no': '番号',
    'num': '番号',
    'user_id': 'ユーザーID',
    'userId': 'ユーザーID',
    'user_name': 'ユーザー名',
    'userName': 'ユーザー名',
    'username': 'ユーザー名',
    'password': 'パスワード',
    'department': '部署',
    'is_admin': '管理者',
    'isAdmin': '管理者',
    'active': '有効',
    'enabled': '有効',
    'disabled': '無効',
    'deleted': '削除済み',
    'deleted_at': '削除日時',
    'deletedAt': '削除日時',
    'memo': 'メモ',
    'note': '備考',
    'notes': '備考',
    'comment': 'コメント',
    'comments': 'コメント',
    'file': 'ファイル',
    'files': 'ファイル',
    'image': '画像',
    'images': '画像',
    'url': 'URL',
    'link': 'リンク',
    'order': '順序',
    'sort': '並び順',
    'priority': '優先度',
    'due_date': '期限',
    'dueDate': '期限',
    'start_date': '開始日',
    'startDate': '開始日',
    'end_date': '終了日',
    'endDate': '終了日',
    'completed': '完了',
    'completed_at': '完了日時',
    'completedAt': '完了日時',
    'unit_code': 'ユニットコード',
    'unitCode': 'ユニットコード',
    'Unit Code': 'ユニットコード',
    'unit_name': 'ユニット名',
    'unitName': 'ユニット名',
    'Unit Name': 'ユニット名',
    'unit_name_en': 'ユニット名（英語）',
    'unitNameEn': 'ユニット名（英語）',
    'Unit Name En': 'ユニット名（英語）',
    // t saibanテーブルのカラム名
    'drawing_no': '図面番号',
    'drawingNo': '図面番号',
    'Drawing No': '図面番号',
    'drawing_number': '図面番号',
    'product_name': '品名',
    'productName': '品名',
    '品名': '品名',
    'order_no': '工事番号',
    'orderNo': '工事番号',
    'Order No': '工事番号',
    'order_number': '工事番号',
    'material': '材質',
    'Material': '材質',
    'material_weight': '素材重量',
    'materialWeight': '素材重量',
    'Material Weight': '素材重量',
    'finished_weight': '仕上げ重量',
    'finishedWeight': '仕上げ重量',
    'Finished Weight': '仕上げ重量',
    'designer': '設計者',
    'Designer': '設計者',
    'saiban_date': '採番日',
    'saibanDate': '採番日',
    'Saiban Date': '採番日',
    // t machinecodeテーブルのカラム名
    'machine_code': '機械コード',
    'machineCode': '機械コード',
    'MachineCode': '機械コード',
    'Machine Code': '機械コード',
    'machine_name': '機械名称',
    'machineName': '機械名称',
    'MachineName': '機械名称',
    'Machine Name': '機械名称',
    'machine_name_eng': '機械名称(英語)',
    'machineNameEng': '機械名称(英語)',
    'MachineNameEng': '機械名称(英語)',
    'Machine Name Eng': '機械名称(英語)',
    // t Accept Orderテーブルのカラム名
    'construct_no': '工事番号',
    'constructNo': '工事番号',
    'Construct No': '工事番号',
    'register_date': '受注登録日',
    'registerDate': '受注登録日',
    'Register Date': '受注登録日',
    'construct_name': '工事名称',
    'constructName': '工事名称',
    'Construct Name': '工事名称',
    'eigyo_manno': '営業担当ｺｰﾄﾞ',
    'eigyoManno': '営業担当ｺｰﾄﾞ',
    'Eigyo Manno': '営業担当ｺｰﾄﾞ',
    'owner_code': '受注元ｺｰﾄﾞ',
    'ownerCode': '受注元ｺｰﾄﾞ',
    'Owner Code': '受注元ｺｰﾄﾞ',
    'user_code': '納品先ｺｰﾄﾞ',
    'userCode': '納品先ｺｰﾄﾞ',
    'User Code': '納品先ｺｰﾄﾞ',
    'order_price': '受注金額',
    'orderPrice': '受注金額',
    'Order Price': '受注金額',
    'order_date': '受注日',
    'orderDate': '受注日',
    'Order Date': '受注日',
    'delivery_date': '納期',
    'deliveryDate': '納期',
    'Delivery Date': '納期',
    'dealing_doc_mitsumori': '電子見積書',
    'dealingDocMitsumori': '電子見積書',
    'Dealing Doc Mitsumori': '電子見積書',
    'dealing_doc_chuumon': '電子注文書',
    'dealingDocChuumon': '電子注文書',
    'Dealing Doc Chuumon': '電子注文書',
    'dealing_doc_seikyu': '電子請求書',
    'dealingDocSeikyu': '電子請求書',
    'Dealing Doc Seikyu': '電子請求書'
};

// カラム名を日本語に変換する関数
function getColumnDisplayName(columnName) {
    if (!columnName) return columnName;
    
    // 完全一致でマッピングを確認
    if (COLUMN_NAME_MAP[columnName]) {
        return COLUMN_NAME_MAP[columnName];
    }
    
    // スネークケースを変換（例: user_name -> ユーザー名）
    const snakeCase = columnName.toLowerCase();
    if (COLUMN_NAME_MAP[snakeCase]) {
        return COLUMN_NAME_MAP[snakeCase];
    }
    
    // スペースを含む形式を変換（例: Unit Code -> unit_code）
    const spaceToUnderscore = columnName.replace(/\s+/g, '_').toLowerCase();
    if (COLUMN_NAME_MAP[spaceToUnderscore]) {
        return COLUMN_NAME_MAP[spaceToUnderscore];
    }
    
    // カメルケースを変換（例: userName -> ユーザー名）
    const camelCase = columnName.charAt(0).toLowerCase() + columnName.slice(1);
    if (COLUMN_NAME_MAP[camelCase]) {
        return COLUMN_NAME_MAP[camelCase];
    }
    
    // アンダースコアをスペースに変換して読みやすくする
    let displayName = columnName
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    
    // 各単語の最初の文字を大文字に
    displayName = displayName.split(' ').map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    
    return displayName || columnName;
}

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

// ログイン状態の確認
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    
    if (!isLoggedIn) {
        if (loginPage) loginPage.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        return false;
    } else {
        if (loginPage) loginPage.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        return true;
    }
}

// パスワードをハッシュ化（簡易版 - 本番環境ではbcryptなどを使用）
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36) + password.length.toString(36);
}

// ユーザー認証情報を取得
function getUserCredentials() {
    const stored = localStorage.getItem('userCredentials');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ユーザー認証情報を保存
function saveUserCredentials(username, passwordHash) {
    const credentials = {
        username: username,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('userCredentials', JSON.stringify(credentials));
}

// 初回ログイン設定を確認
function isFirstLogin() {
    const credentials = getUserCredentials();
    return !credentials || !credentials.passwordHash;
}

// ログイン処理
function handleLogin(username, password, remember) {
    if (!username || !password) {
        return false;
    }
    
    // ユーザー管理のユーザーリストを確認
    loadUsers();
    
    // ユーザー管理に登録されている場合は、そちらで認証
    let user = users.find(u => u.loginId === username);
    
    if (user) {
        // 既存ユーザーの認証
        const inputHash = hashPassword(password);
        // パスワードハッシュが空の場合は、初回ログインとして扱う
        if (!user.passwordHash || user.passwordHash === '') {
            // パスワードハッシュが空の場合は、入力されたパスワードを設定
            user.passwordHash = inputHash;
            saveUsers();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', user.pcName || user.loginId);
            localStorage.setItem('loginId', user.loginId);
            if (remember) {
                localStorage.setItem('rememberLogin', 'true');
            }
            checkLoginStatus();
            return true;
        } else if (user.passwordHash === inputHash) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', user.pcName || user.loginId);
            localStorage.setItem('loginId', user.loginId);
            if (remember) {
                localStorage.setItem('rememberLogin', 'true');
            }
            checkLoginStatus();
            return true;
        }
        // パスワードが間違っている場合は認証失敗
        return false;
    } else {
        // ユーザー管理に登録されていない場合は自動的に追加
        const passwordHash = hashPassword(password);
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        const newUser = {
            id: newId,
            pcName: username, // 初期値はログインIDと同じ
            loginId: username,
            passwordHash: passwordHash,
            department: '', // 部署は後で設定
            isAdmin: false, // 管理者フラグは後で設定
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers();
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('loginId', username);
        if (remember) {
            localStorage.setItem('rememberLogin', 'true');
        }
        checkLoginStatus();
        return true;
    }
}

// ユーザー管理
let users = [];

// ユーザーを読み込み
function loadUsers() {
    const stored = localStorage.getItem('users');
    if (stored) {
        try {
            users = JSON.parse(stored);
        } catch (e) {
            console.error('ユーザーの読み込みエラー:', e);
            users = [];
        }
    } else {
        users = [];
    }
    return users;
}

// ユーザーを保存
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// ユーザー一覧を表示
function renderUserList() {
    const userListEl = document.getElementById('user-list');
    if (!userListEl) return;
    
    loadUsers();
    userListEl.innerHTML = '';
    
    if (users.length === 0) {
        userListEl.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">ユーザーが登録されていません</div>';
        return;
    }
    
    users.forEach((user, index) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-item-content">
                <div class="user-item-info">
                    <div class="user-item-name">
                        ${escapeHtml(user.pcName || user.loginId)}
                        ${user.isAdmin ? '<span style="margin-left: 8px; color: var(--primary); font-size: 12px;"><i class="fas fa-crown"></i> 管理者</span>' : ''}
                    </div>
                    <div class="user-item-id">
                        ID: ${escapeHtml(user.loginId)} | 部署: ${escapeHtml(user.department || '未設定')}
                    </div>
                </div>
                <div class="user-item-actions">
                    <button class="btn-secondary btn-small" onclick="editUser(${user.id})" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger btn-small" onclick="deleteUser(${user.id})" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        userListEl.appendChild(userItem);
    });
}

// ユーザーフォームモーダルを開く
function openUserFormModal(userId = null) {
    const modal = document.getElementById('user-form-modal');
    const titleEl = document.getElementById('user-form-title');
    const form = document.getElementById('user-form');
    const pcNameEl = document.getElementById('user-pc-name');
    const loginIdEl = document.getElementById('user-login-id');
    const passwordEl = document.getElementById('user-password');
    const passwordConfirmEl = document.getElementById('user-password-confirm');
    const departmentEl = document.getElementById('user-department');
    const isAdminEl = document.getElementById('user-is-admin');
    const editIdEl = document.getElementById('user-edit-id');
    
    if (!modal || !form) return;
    
    if (userId) {
        // 編集モード
        const user = users.find(u => u.id === userId);
        if (user) {
            titleEl.textContent = 'ユーザーを編集';
            pcNameEl.value = user.pcName || '';
            loginIdEl.value = user.loginId || '';
            passwordEl.value = '';
            passwordConfirmEl.value = '';
            if (departmentEl) departmentEl.value = user.department || '';
            if (isAdminEl) isAdminEl.checked = user.isAdmin === true;
            editIdEl.value = userId;
            // パスワードフィールドを任意にする
            passwordEl.removeAttribute('required');
            passwordConfirmEl.removeAttribute('required');
            const passwordRequired = document.getElementById('password-required');
            const passwordConfirmRequired = document.getElementById('password-confirm-required');
            if (passwordRequired) passwordRequired.style.display = 'none';
            if (passwordConfirmRequired) passwordConfirmRequired.style.display = 'none';
        }
    } else {
        // 新規追加モード
        titleEl.textContent = 'ユーザーを追加';
        form.reset();
        editIdEl.value = '';
        // パスワードフィールドを必須にする
        passwordEl.setAttribute('required', 'required');
        passwordConfirmEl.setAttribute('required', 'required');
        const passwordRequired = document.getElementById('password-required');
        const passwordConfirmRequired = document.getElementById('password-confirm-required');
        if (passwordRequired) passwordRequired.style.display = 'inline';
        if (passwordConfirmRequired) passwordConfirmRequired.style.display = 'inline';
    }
    
    modal.style.display = 'flex';
}

// ユーザーフォームモーダルを閉じる
function closeUserFormModal() {
    const modal = document.getElementById('user-form-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ユーザーを保存
function saveUser() {
    const pcName = document.getElementById('user-pc-name').value.trim();
    const loginId = document.getElementById('user-login-id').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const passwordConfirm = document.getElementById('user-password-confirm').value.trim();
    const department = document.getElementById('user-department')?.value.trim() || '';
    const isAdmin = document.getElementById('user-is-admin')?.checked || false;
    const editId = document.getElementById('user-edit-id').value;
    
    if (!pcName || !loginId) {
        alert('パソコン名とログインIDを入力してください');
        return;
    }
    
    // 部署は任意（後で設定可能）
    
    // 新規追加時はパスワード必須
    if (!editId) {
        if (!password || !passwordConfirm) {
            alert('パスワードを入力してください');
            return;
        }
        if (password.length < 4) {
            alert('パスワードは4文字以上で入力してください');
            return;
        }
        if (password !== passwordConfirm) {
            alert('パスワードが一致しません');
            return;
        }
    } else {
        // 編集時はパスワードが入力されている場合のみ変更
        if (password || passwordConfirm) {
            if (password.length < 4) {
                alert('パスワードは4文字以上で入力してください');
                return;
            }
            if (password !== passwordConfirm) {
                alert('パスワードが一致しません');
                return;
            }
        }
    }
    
    loadUsers();
    
    if (editId) {
        // 編集
        const index = users.findIndex(u => u.id === parseInt(editId));
        if (index !== -1) {
            users[index].pcName = pcName;
            users[index].loginId = loginId;
            users[index].department = department;
            users[index].isAdmin = isAdmin;
            // パスワードが入力されている場合のみ更新
            if (password) {
                users[index].passwordHash = hashPassword(password);
            }
            users[index].updatedAt = new Date().toISOString();
        }
    } else {
        // 新規追加
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
        users.push({
            id: newId,
            pcName: pcName,
            loginId: loginId,
            passwordHash: hashPassword(password),
            department: department,
            isAdmin: isAdmin,
            createdAt: new Date().toISOString()
        });
    }
    
    saveUsers();
    renderUserList();
    closeUserFormModal();
    
    if (typeof showMessage === 'function') {
        showMessage(editId ? 'ユーザーを更新しました' : 'ユーザーを追加しました', 'success');
    } else {
        alert(editId ? 'ユーザーを更新しました' : 'ユーザーを追加しました');
    }
}

// ユーザーを編集
function editUser(userId) {
    openUserFormModal(userId);
}

// ユーザーを削除
function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (typeof showDeleteConfirm === 'function') {
        showDeleteConfirm(
            'ユーザーを削除',
            `「${user.pcName || user.loginId}」を削除しますか？\nこの操作は取り消せません。`,
            () => {
                users = users.filter(u => u.id !== userId);
                saveUsers();
                renderUserList();
                if (typeof showMessage === 'function') {
                    showMessage('ユーザーを削除しました', 'success');
                }
            }
        );
    } else {
        if (confirm(`「${user.pcName || user.loginId}」を削除しますか？`)) {
            users = users.filter(u => u.id !== userId);
            saveUsers();
            renderUserList();
        }
    }
}

// ユーザーIDでログイン認証
function authenticateUser(loginId, password) {
    loadUsers();
    const user = users.find(u => u.loginId === loginId);
    if (!user) {
        return false;
    }
    
    const inputHash = hashPassword(password);
    return user.passwordHash === inputHash;
}

// ログアウト処理
function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('rememberLogin');
    checkLoginStatus();
}

// ログアウト確認モーダルを表示
function showLogoutConfirm() {
    const modal = document.getElementById('logout-confirm-modal');
    if (!modal) {
        // フォールバック
        if (confirm('ログアウトしますか？')) {
            handleLogout();
        }
        return;
    }
    
    const cancelBtn = document.getElementById('logout-confirm-cancel');
    const okBtn = document.getElementById('logout-confirm-ok');
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const newCancelBtnEl = document.getElementById('logout-confirm-cancel');
        if (newCancelBtnEl) {
            newCancelBtnEl.onclick = function() {
                modal.style.display = 'none';
            };
        }
    }
    
    if (okBtn) {
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        const newOkBtnEl = document.getElementById('logout-confirm-ok');
        if (newOkBtnEl) {
            newOkBtnEl.onclick = function() {
                modal.style.display = 'none';
                handleLogout();
            };
        }
    }
    
    modal.style.display = 'flex';
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    // ログイン状態を確認
    if (!checkLoginStatus()) {
        // ログインフォームのイベントリスナーを設定
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                const remember = document.getElementById('login-remember').checked;
                
                if (!username || !password) {
                    alert('ユーザー名とパスワードを入力してください');
                    return;
                }
                
                // 初回ログインかどうかを確認（ログイン前にチェック）
                const isFirst = isFirstLogin();
                
                if (handleLogin(username, password, remember)) {
                    // 初回ログインの場合、メッセージを表示
                    if (isFirst) {
                        alert('初回ログインです。パスワードを設定しました。\n設定ページからパスワードを変更できます。');
                    }
                    // ログイン成功後、アプリケーションを初期化
                    initializeApp();
                } else {
                    alert('ユーザー名またはパスワードが正しくありません');
                }
            });
        }
        return; // ログインしていない場合はここで終了
    }
    
    // ログイン済みの場合、アプリケーションを初期化
    initializeApp();
});

// アプリケーション初期化関数
async function initializeApp() {
    try {
        // ユーザーを読み込み
        loadUsers();
        
        // 現在ログインしているユーザーを確認し、ユーザー管理に存在しない場合は追加
        const currentLoginId = localStorage.getItem('loginId') || localStorage.getItem('username');
        const currentUsername = localStorage.getItem('username') || currentLoginId;
        
        if (currentLoginId) {
            const existingUser = users.find(u => u.loginId === currentLoginId);
            if (!existingUser) {
                // ユーザー管理に存在しない場合は自動的に追加
                // 既存の認証情報からパスワードハッシュを取得を試みる
                const credentials = getUserCredentials();
                let passwordHash = '';
                
                if (credentials && credentials.passwordHash && credentials.username === currentLoginId) {
                    // 既存の認証情報からパスワードハッシュを取得
                    passwordHash = credentials.passwordHash;
                } else {
                    // 認証情報がない場合は、空のパスワードハッシュを設定
                    // 管理者が後でユーザー管理画面からパスワードを設定できる
                    // または、次回ログイン時にパスワードを再設定してもらう
                    passwordHash = '';
                }
                
                const newId = users.length > 0 ? Math.max(...users.map(u => u.id || 0)) + 1 : 1;
                const newUser = {
                    id: newId,
                    pcName: currentUsername || currentLoginId,
                    loginId: currentLoginId,
                    passwordHash: passwordHash,
                    department: '', // 部署は後で設定
                    isAdmin: false, // 管理者フラグは後で設定
                    createdAt: new Date().toISOString(),
                    autoCreated: true // 自動作成フラグ
                };
                users.push(newUser);
                saveUsers();
                
                // ログインIDを保存（次回ログイン時に使用）
                if (!localStorage.getItem('loginId')) {
                    localStorage.setItem('loginId', currentLoginId);
                }
            }
        }
        
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
}

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
    
    // ヘッダーボタンのイベントリスナー
    const headerBtns = document.querySelectorAll('.header-btn');
    headerBtns.forEach(btn => {
        const btnText = btn.textContent.trim();
        if (btnText === '設定') {
            btn.addEventListener('click', function() {
                openSettingsModal();
            });
        } else if (btnText === 'ログアウト') {
            btn.addEventListener('click', function() {
                showLogoutConfirm();
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

    // テーブルデータ更新
    const refreshTableBtn = document.getElementById('refresh-table');
    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', () => {
            if (currentTable) {
                loadTableData(currentTable);
                if (typeof showMessage === 'function') {
                    showMessage('テーブルデータを更新しました', 'success');
                }
            }
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
            if (type === 'construct-number') {
                // 工事番号採番モーダルを開く
                openConstructNumberModal();
            } else {
                openRegisterModal(type, null);
            }
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
            console.log('通知ボタンがクリックされました');
            toggleNotificationDropdown();
        });
    } else {
        console.error('通知ボタンが見つかりません');
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
    
    // 今日の予定追加ボタン
    const addTodayEventBtn = document.getElementById('add-today-event-btn');
    if (addTodayEventBtn) {
        addTodayEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const date = today.getDate();
            
            if (typeof openCalendarEventFormModal === 'function') {
                openCalendarEventFormModal(year, month, date);
            } else if (typeof window.openCalendarEventFormModal === 'function') {
                window.openCalendarEventFormModal(year, month, date);
            } else {
                console.error('openCalendarEventFormModal関数が見つかりません');
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
        itemEl.onclick = () => showBulletinDetail(bulletin.id);
        
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
            <div class="bulletin-item-right">
                ${filesHtml}
                <button class="bulletin-action-btn delete" onclick="event.stopPropagation(); deleteBulletin(${bulletin.id})" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
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
// 掲示板の詳細を表示
function showBulletinDetail(bulletinId) {
    const bulletin = bulletins.find(b => b.id === bulletinId);
    if (!bulletin) return;
    
    const modal = document.getElementById('bulletin-detail-modal');
    const dateEl = document.getElementById('bulletin-detail-date');
    const textEl = document.getElementById('bulletin-detail-text');
    const filesContainer = document.getElementById('bulletin-detail-files-container');
    const filesList = document.getElementById('bulletin-detail-files');
    const editBtn = document.getElementById('bulletin-detail-edit-btn');
    
    if (!modal || !dateEl || !textEl || !filesList || !editBtn) return;
    
    // 日付を表示
    const date = new Date(bulletin.date);
    const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    dateEl.textContent = dateStr;
    
    // 内容を表示
    textEl.textContent = bulletin.text || '';
    
    // 添付ファイルを表示
    if (bulletin.files && bulletin.files.length > 0) {
        filesContainer.style.display = 'block';
        filesList.innerHTML = '';
        bulletin.files.forEach((file, fileIndex) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'bulletin-detail-file-item';
            fileItem.style.cssText = 'padding: 10px 12px; margin-bottom: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 6px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;';
            fileItem.onmouseover = function() { this.style.background = 'var(--bg-tertiary)'; };
            fileItem.onmouseout = function() { this.style.background = 'var(--bg-secondary)'; };
            
            const fileIcon = getFileIcon(file.type || file.name);
            fileItem.innerHTML = `
                <i class="${fileIcon}" style="font-size: 18px; color: var(--primary);"></i>
                <span style="flex: 1; font-size: 14px; color: var(--text-primary);">${escapeHtml(file.name)}</span>
                <i class="fas fa-external-link-alt" style="font-size: 12px; color: var(--text-secondary);"></i>
            `;
            fileItem.onclick = function(e) {
                e.stopPropagation();
                viewBulletinFile(bulletinId, fileIndex);
            };
            filesList.appendChild(fileItem);
        });
    } else {
        filesContainer.style.display = 'none';
    }
    
    // 編集ボタンのイベント
    editBtn.onclick = function() {
        closeBulletinDetailModal();
        setTimeout(() => {
            editBulletin(bulletinId);
        }, 100);
    };
    
    // モーダルを表示
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
}

// 掲示板詳細モーダルを閉じる
function closeBulletinDetailModal() {
    const modal = document.getElementById('bulletin-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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
window.showBulletinDetail = showBulletinDetail;
window.closeBulletinDetailModal = closeBulletinDetailModal;
window.deleteBulletin = deleteBulletin;
window.removeSelectedFile = removeSelectedFile;
window.removeBulletinFile = removeBulletinFile;
window.viewBulletinFile = viewBulletinFile;
window.closeFileViewerModal = closeFileViewerModal;
window.getFileIcon = getFileIcon;
window.downloadBulletinFile = downloadBulletinFile;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openSettingsPage = openSettingsPage;
window.closeSettingsPage = closeSettingsPage;
window.openUserFormModal = openUserFormModal;
window.closeUserFormModal = closeUserFormModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.renderUserList = renderUserList;
window.closeSettingsModal = closeSettingsModal;

// 通知の更新（Todoを含む）
function updateNotifications() {
    if (typeof updateNotificationsWithTodos === 'function') {
        updateNotificationsWithTodos();
    } else {
        // フォールバック（todo.jsが読み込まれていない場合）
        const notifications = [];
        
        // 通知バッジを更新
        const unreadCount = notifications.filter(n => n.unread).length;
        const badge = document.getElementById('header-notification-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
        // 通知ドロップダウンの内容を更新
        const dropdownBody = document.getElementById('notification-dropdown-body');
        if (dropdownBody) {
            dropdownBody.innerHTML = '';
            if (notifications.length === 0) {
                dropdownBody.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">通知はありません</div>';
            } else {
                notifications.forEach(notification => {
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
                    
                    dropdownBody.appendChild(item);
                });
            }
        }
    }
}

// 通知ドロップダウンの開閉
function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) {
        console.error('通知ドロップダウンが見つかりません');
        return;
    }
    
    const isVisible = dropdown.style.display !== 'none' && dropdown.style.display !== '';
    console.log('通知ドロップダウンの状態:', isVisible ? '表示中' : '非表示');
    
    if (!isVisible) {
        // ドロップダウンを開く前に通知を更新
        updateNotifications();
        dropdown.style.display = 'flex';
        console.log('通知ドロップダウンを開きました');
    } else {
        dropdown.style.display = 'none';
        console.log('通知ドロップダウンを閉じました');
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
    
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const todayEvents = calendarEvents.filter(event => {
        if (!event || !event.date) return false;
        
        // 日付を文字列として比較
        let eventDateStr = event.date;
        
        // Dateオブジェクトの場合は文字列に変換
        if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
            const d = new Date(eventDateStr);
            eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
            // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
            const parts = eventDateStr.split('/');
            if (parts.length === 3) {
                eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        // 今日の予定でない場合は除外
        if (eventDateStr !== todayStr) return false;
        
        // 時間がない予定は表示する
        if (!event.time || event.time.trim() === '') return true;
        
        // 時間をパース（HH:MM形式を想定）
        const timeParts = event.time.trim().split(':');
        if (timeParts.length < 2) return true; // 形式が不正な場合は表示
        
        const eventHour = parseInt(timeParts[0], 10);
        const eventMinute = parseInt(timeParts[1], 10);
        
        if (isNaN(eventHour) || isNaN(eventMinute)) return true; // パース失敗時は表示
        
        // 現在時刻と比較（予定時間から30分後までは表示）
        const eventTimeInMinutes = eventHour * 60 + eventMinute;
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const eventEndTimeInMinutes = eventTimeInMinutes + 30; // 予定時間から30分後
        
        return currentTimeInMinutes <= eventEndTimeInMinutes;
    });
    
    // 時間順にソート
    todayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        // 時間がない場合は最後に
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        // 時間を比較（HH:MM形式を想定）
        const [hourA, minuteA] = timeA.split(':').map(Number);
        const [hourB, minuteB] = timeB.split(':').map(Number);
        
        if (hourA !== hourB) {
            return hourA - hourB;
        }
        return (minuteA || 0) - (minuteB || 0);
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
        // 期限が今日以前のタスクを表示（期限切れも含む）
        return dueDate.getTime() <= today.getTime();
    });
    
    // 期限が近い順（期限切れ→今日の期限）にソート
    dueTasks.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        return dateA.getTime() - dateB.getTime();
    });
    
    dueTasksList.innerHTML = '';
    
    if (dueTasks.length === 0) {
        dueTasksList.innerHTML = '<div class="sidebar-empty">期限のタスクはありません</div>';
        return;
    }
    
    dueTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'sidebar-task-item';
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const isOverdue = dueDate.getTime() < today.getTime();
        const isDueToday = dueDate.getTime() === today.getTime();
        
        if (isOverdue) {
            taskItem.style.borderLeft = '3px solid var(--error)';
            taskItem.style.background = 'rgba(184, 154, 154, 0.1)';
        } else if (isDueToday) {
            taskItem.style.borderLeft = '3px solid var(--warning)';
        }
        
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
        
        const dueDateStr = `${dueDate.getFullYear()}/${String(dueDate.getMonth() + 1).padStart(2, '0')}/${String(dueDate.getDate()).padStart(2, '0')}`;
        const dueDateLabel = isOverdue ? `⚠️ 期限切れ: ${dueDateStr}` : (isDueToday ? `⏰ 今日が期限: ${dueDateStr}` : `📅 期限: ${dueDateStr}`);
        
        taskItem.innerHTML = `
            <div class="sidebar-task-priority priority-${task.priority || 'medium'}">
                ${priorityIcons[task.priority || 'medium']} ${priorityLabels[task.priority || 'medium']}
            </div>
            <div class="sidebar-task-content">
                <div class="sidebar-task-title">${escapeHtml(task.title || '')}</div>
                <div style="font-size: 11px; color: ${isOverdue ? 'var(--error)' : 'var(--text-secondary)'}; margin-top: 4px;">${dueDateLabel}</div>
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
    
    // 予定を確実に読み込む
    if (typeof loadCalendarEvents === 'function') {
        loadCalendarEvents();
    }
    
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
        
        // 日付を先に追加（予定の下に表示されるように）
        const dateText = document.createElement('div');
        dateText.className = 'calendar-date-number';
        dateText.textContent = dayDate;
        dayEl.appendChild(dateText);
        
        // 予定がある日をマーク（個人予定のみ、会社カレンダーの休日は除外）
        const hasPersonalEvent = hasEventOnDate(dayYear, dayMonth, dayDate);
        // 会社カレンダーの休日は除外（休日マークだけで表示）
        const hasCompanyEvent = hasCompanyEventOnDate(dayYear, dayMonth, dayDate) && !isCompanyHoliday;
        
        if (hasPersonalEvent || hasCompanyEvent) {
            dayEl.classList.add('has-event');
            
            // その日の予定を取得（個人予定）
            const dateStr = `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
            const dayEvents = calendarEvents.filter(event => {
                if (!event || !event.date) return false;
                
                // 日付を文字列として比較
                let eventDateStr = event.date;
                
                // Dateオブジェクトの場合は文字列に変換
                if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
                    const d = new Date(eventDateStr);
                    eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
                    // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
                    const parts = eventDateStr.split('/');
                    if (parts.length === 3) {
                        eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
                
                return eventDateStr === dateStr;
            });
            
            // その日の会社カレンダー予定を取得（休日を除く）
            const dayCompanyEvents = companyCalendarEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === dayYear && 
                       eventDate.getMonth() === dayMonth && 
                       eventDate.getDate() === dayDate &&
                       event.type !== 'holiday';
            });
            
            // 個人予定を表示（日付の下に）
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
        
        // 予定入力フィールドを追加
        const eventInputContainer = document.createElement('div');
        eventInputContainer.className = 'calendar-event-input-container';
        eventInputContainer.style.cssText = 'margin-top: 4px; display: none; width: 100%;';
        
        const eventInput = document.createElement('input');
        eventInput.type = 'text';
        eventInput.className = 'calendar-event-input';
        eventInput.placeholder = '予定を入力...';
        eventInput.style.cssText = 'width: 100%; padding: 2px 4px; font-size: 10px; border: 1px solid var(--border-light); border-radius: 3px; background: var(--bg-primary); color: var(--text-primary); box-sizing: border-box;';
        
        eventInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const title = eventInput.value.trim();
                if (title) {
                    // 予定を保存
                    calendarEvents.push({
                        date: `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`,
                        title: title,
                        time: '',
                        description: ''
                    });
                    saveCalendarEvents();
                    updateCalendar();
                    updateTodayEvents();
                    eventInput.value = '';
                    eventInputContainer.style.display = 'none';
                }
            } else if (e.key === 'Escape') {
                eventInput.value = '';
                eventInputContainer.style.display = 'none';
            }
        });
        
        eventInput.addEventListener('blur', () => {
            // 少し遅延してから非表示にする（Enterキーで保存する時間を確保）
            setTimeout(() => {
                if (eventInput.value.trim() === '') {
                    eventInputContainer.style.display = 'none';
                }
            }, 200);
        });
        
        eventInputContainer.appendChild(eventInput);
        dayEl.appendChild(eventInputContainer);
        
        // 日付をクリックして予定を追加/表示
        dayEl.addEventListener('click', (e) => {
            if (!dayEl.classList.contains('other-month') && !dayEl.classList.contains('calendar-weekday')) {
                // 予定入力フィールドが表示されていない場合のみモーダルを開く
                if (eventInputContainer.style.display === 'none' || eventInputContainer.style.display === '') {
                    // 日付をクリックしたら直接予定入力フォームを開く
                    openCalendarEventFormModal(dayYear, dayMonth, dayDate);
                }
            }
        });
        
        // 日付セルをダブルクリックで予定入力フィールドを表示
        dayEl.addEventListener('dblclick', (e) => {
            if (!dayEl.classList.contains('other-month') && !dayEl.classList.contains('calendar-weekday')) {
                e.preventDefault();
                e.stopPropagation();
                eventInputContainer.style.display = 'block';
                setTimeout(() => {
                    eventInput.focus();
                }, 10);
            }
        });
        
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
    
    // 今日の予定を右サイドバーに表示
    updateTodayEvents();
}

// 指定した日付に予定があるかチェック
function hasEventOnDate(year, month, date) {
    // 日付をYYYY-MM-DD形式の文字列に変換
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    return calendarEvents.some(event => {
        if (!event || !event.date) return false;
        
        // 日付を文字列として比較
        let eventDateStr = event.date;
        
        // Dateオブジェクトの場合は文字列に変換
        if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
            const d = new Date(eventDateStr);
            eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
            // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
            const parts = eventDateStr.split('/');
            if (parts.length === 3) {
                eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        return eventDateStr === dateStr;
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
            const parsed = JSON.parse(saved);
            // 日付文字列を正規化（YYYY-MM-DD形式に統一）
            calendarEvents = parsed.map(event => {
                let dateStr = event.date;
                // Dateオブジェクトの場合は文字列に変換
                if (dateStr instanceof Date || (typeof dateStr === 'string' && dateStr.includes('T'))) {
                    const d = new Date(dateStr);
                    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
                    // YYYY/MM/DD形式の場合はYYYY-MM-DDに変換
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
                return {
                ...event,
                    date: dateStr
                };
            });
            console.log('予定を読み込みました:', calendarEvents.length, '件');
        } catch (e) {
            console.error('予定の読み込みエラー:', e);
            calendarEvents = [];
        }
    } else {
        calendarEvents = [];
        console.log('保存された予定がありません');
    }
    
    // グローバルに公開（通知機能で使用）
    if (typeof window !== 'undefined') {
        window.calendarEvents = calendarEvents;
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
        // グローバル変数も更新（通知機能で使用）
        if (typeof window !== 'undefined') {
            window.calendarEvents = calendarEvents;
        }
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
    const eventsContent = document.getElementById('calendar-event-form-events-content');
    
    if (!formTitle || !eventForm || !eventDateInput || !eventTitleInput || !eventTimeInput || !eventDescriptionInput) {
        console.error('フォーム要素が見つかりません');
        alert('予定フォームを開けませんでした。ページをリロードしてください。');
        return;
    }
    
    formTitle.textContent = eventIndex === null ? `✨ 予定を追加 - ${dateStr}` : `✏️ 予定を編集 - ${dateStr}`;
    eventDateInput.value = dateStr;
    
    // その日の予定を取得して表示
    let dayEvents = calendarEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && 
               eventDate.getMonth() === month && 
               eventDate.getDate() === date;
    });
    
    // 時間順にソート（時間がない予定は最後に）
    dayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        // 時間がない予定は最後に
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        // 時間を比較（HH:MM形式を想定）
        const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                return hours * 60 + minutes;
            }
            return 0;
        };
        
        return parseTime(timeA) - parseTime(timeB);
    });
    
        if (eventsContent) {
        eventsContent.innerHTML = '';
        if (dayEvents.length === 0) {
            eventsContent.innerHTML = '<div class="sidebar-empty" style="font-size: 14px;">予定はありません</div>';
        } else {
            dayEvents.forEach((event, index) => {
                const eventItem = document.createElement('div');
                eventItem.className = 'calendar-event-form-event-item';
                eventItem.style.cssText = 'padding: 16px; margin-bottom: 12px; background: var(--bg-primary); border: 1px solid var(--border-light); border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start; transition: background 0.2s;';
                eventItem.onmouseover = function() { this.style.background = 'var(--bg-secondary)'; };
                eventItem.onmouseout = function() { this.style.background = 'var(--bg-primary)'; };
                eventItem.innerHTML = `
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">${escapeHtml(event.title || '')}</div>
                        ${event.time ? `<div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 6px;">⏰ ${escapeHtml(event.time)}</div>` : ''}
                        ${event.description ? `<div style="font-size: 14px; color: var(--text-secondary); margin-top: 6px; line-height: 1.5; word-wrap: break-word;">${escapeHtml(event.description)}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 12px;">
                        <button onclick="event.stopPropagation(); editCalendarEventFromForm('${year}-${month}-${date}', ${index})" style="padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;" onmouseover="this.style.background='var(--primary-dark)'" onmouseout="this.style.background='var(--primary)'" title="編集">✏️</button>
                        <button onclick="event.stopPropagation(); deleteCalendarEventFromForm('${year}-${month}-${date}', ${index})" style="padding: 6px 12px; background: var(--error); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;" onmouseover="this.style.background='var(--error-dark)'" onmouseout="this.style.background='var(--error)'" title="削除">🗑️</button>
                    </div>
                `;
                eventsContent.appendChild(eventItem);
            });
        }
    }
    
    // フォームをリセット
    eventTitleInput.value = '';
    eventTimeInput.value = '';
    eventDescriptionInput.value = '';
    
    // 編集モードの場合
    if (eventIndex !== null) {
        const actualEvent = dayEvents[eventIndex];
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
        // フォームから日付を読み取る
        const dateValue = eventDateInput.value;
        if (dateValue) {
            const [y, m, d] = dateValue.split('/').map(Number);
            saveCalendarEvent(y, m - 1, d, eventIndex);
        } else {
            // フォールバック: 引数から取得
        saveCalendarEvent(year, month, date, eventIndex);
        }
        return false;
    };
    
    // フォームに日付情報を保存（フォールバック用）
    eventForm.setAttribute('data-year', year);
    eventForm.setAttribute('data-month', month);
    eventForm.setAttribute('data-date', date);
    
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
    const eventDateInput = document.getElementById('calendar-event-date');
    
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    // フォームから日付を読み取る（優先）
    let eventYear = year;
    let eventMonth = month;
    let eventDate = date;
    
    if (eventDateInput && eventDateInput.value) {
        const dateValue = eventDateInput.value;
        const dateParts = dateValue.split('/');
        if (dateParts.length === 3) {
            eventYear = parseInt(dateParts[0], 10);
            eventMonth = parseInt(dateParts[1], 10) - 1; // 月は0ベース
            eventDate = parseInt(dateParts[2], 10);
            console.log('フォームから日付を読み取り:', eventYear, eventMonth, eventDate);
        }
    } else {
        console.log('フォームの日付が空、引数から取得:', year, month, date);
    }
    
    // 日付を文字列形式（YYYY-MM-DD）で保存（タイムゾーン問題を避けるため）
    const eventDateObj = new Date(eventYear, eventMonth, eventDate);
    const eventDateISO = `${eventYear}-${String(eventMonth + 1).padStart(2, '0')}-${String(eventDate).padStart(2, '0')}`;
    console.log('保存する日付:', eventDateISO, '元の日付:', eventYear, eventMonth, eventDate);
    
    if (eventIndex !== null) {
        // 編集
        let dayEvents = calendarEvents.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getFullYear() === eventYear && 
                   eDate.getMonth() === eventMonth && 
                   eDate.getDate() === eventDate;
        });
        
        // 時間順にソート（表示と同じ順序にする）
        dayEvents.sort((a, b) => {
            const timeA = a.time || '';
            const timeB = b.time || '';
            
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;
            
            const parseTime = (timeStr) => {
                const parts = timeStr.split(':');
                if (parts.length >= 2) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    return hours * 60 + minutes;
                }
                return 0;
            };
            
            return parseTime(timeA) - parseTime(timeB);
        });
        
        if (eventIndex >= 0 && eventIndex < dayEvents.length) {
            const targetEvent = dayEvents[eventIndex];
            // 元の配列から該当する予定を見つけて更新
            const actualIndex = calendarEvents.findIndex(e => e === targetEvent);
            if (actualIndex !== -1) {
                calendarEvents[actualIndex] = {
                    date: eventDateISO,
                    title,
                    time,
                    description
                };
            }
        }
    } else {
        // 新規追加
        calendarEvents.push({
            date: eventDateISO,
            title,
            time,
            description
        });
    }
    
    saveCalendarEvents();
    updateCalendar();
    updateTodayEvents();
    
    // フォームモーダルが開いている場合は、予定一覧を更新
    const formModal = document.getElementById('calendar-event-form-modal');
    if (formModal && formModal.style.display === 'flex') {
        // フォームモーダルを再描画して予定一覧を更新
        const eventDateInput = document.getElementById('calendar-event-date');
        if (eventDateInput && eventDateInput.value) {
            const dateValue = eventDateInput.value;
            const dateParts = dateValue.split('/');
            if (dateParts.length === 3) {
                const y = parseInt(dateParts[0], 10);
                const m = parseInt(dateParts[1], 10) - 1;
                const d = parseInt(dateParts[2], 10);
                const form = document.getElementById('calendar-event-form');
                const eventIndex = form ? form.getAttribute('data-event-index') : null;
                openCalendarEventFormModal(y, m, d, eventIndex ? parseInt(eventIndex) : null);
            }
        }
    } else {
    closeCalendarEventFormModal();
    }
}

// フォームモーダルから予定を編集
function editCalendarEventFromForm(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    openCalendarEventFormModal(year, month, date, eventIndex);
}

// フォームモーダルから予定を削除
function deleteCalendarEventFromForm(dateStr, eventIndex) {
    const [year, month, date] = dateStr.split('-').map(Number);
    
    let dayEvents = calendarEvents.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getFullYear() === year && 
               eDate.getMonth() === month && 
               eDate.getDate() === date;
    });
    
    // 時間順にソート（表示と同じ順序にする）
    dayEvents.sort((a, b) => {
        const timeA = a.time || '';
        const timeB = b.time || '';
        
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        
        const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                return hours * 60 + minutes;
            }
            return 0;
        };
        
        return parseTime(timeA) - parseTime(timeB);
    });
    
    if (eventIndex >= 0 && eventIndex < dayEvents.length) {
        const targetEvent = dayEvents[eventIndex];
        const eventTitle = targetEvent.title || '予定';
        
        if (typeof showDeleteConfirm === 'function') {
            showDeleteConfirm(
                '予定を削除',
                `「${eventTitle}」を削除しますか？\nこの操作は取り消せません。`,
                () => {
                    calendarEvents = calendarEvents.filter(e => e !== targetEvent);
                    saveCalendarEvents();
                    updateCalendar();
                    updateTodayEvents();
                    
                    // フォームモーダルが開いている場合は、予定一覧を更新
                    const formModal = document.getElementById('calendar-event-form-modal');
                    if (formModal && formModal.style.display === 'flex') {
                        const eventDateInput = document.getElementById('calendar-event-date');
                        if (eventDateInput && eventDateInput.value) {
                            const dateValue = eventDateInput.value;
                            const dateParts = dateValue.split('/');
                            if (dateParts.length === 3) {
                                const y = parseInt(dateParts[0], 10);
                                const m = parseInt(dateParts[1], 10) - 1;
                                const d = parseInt(dateParts[2], 10);
                                openCalendarEventFormModal(y, m, d, null);
                            }
                        }
                    }
                }
            );
        } else {
            if (confirm(`「${eventTitle}」を削除しますか？`)) {
                calendarEvents = calendarEvents.filter(e => e !== targetEvent);
                saveCalendarEvents();
                updateCalendar();
                updateTodayEvents();
                
                // フォームモーダルが開いている場合は、予定一覧を更新
                const formModal = document.getElementById('calendar-event-form-modal');
                if (formModal && formModal.style.display === 'flex') {
                    const eventDateInput = document.getElementById('calendar-event-date');
                    if (eventDateInput && eventDateInput.value) {
                        const dateValue = eventDateInput.value;
                        const dateParts = dateValue.split('/');
                        if (dateParts.length === 3) {
                            const y = parseInt(dateParts[0], 10);
                            const m = parseInt(dateParts[1], 10) - 1;
                            const d = parseInt(dateParts[2], 10);
                            openCalendarEventFormModal(y, m, d, null);
                        }
                    }
                }
            }
        }
    }
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

// 設定モーダルを開く（目次）
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
        console.error('設定モーダルが見つかりません');
        alert('設定モーダルが見つかりません。ページをリロードしてください。');
        return;
    }
    modal.style.display = 'flex';
}

// 設定ページを開く
function openSettingsPage(page) {
    const settingsModal = document.getElementById('settings-modal');
    let targetModal = null;
    
    if (page === 'user-management') {
        targetModal = document.getElementById('user-management-modal');
        if (targetModal) {
            renderUserList();
        }
    } else if (page === 'company-calendar') {
        targetModal = document.getElementById('company-calendar-modal');
        if (targetModal) {
            loadCompanyCalendarEdit();
        }
    }
    
    if (settingsModal) settingsModal.style.display = 'none';
    if (targetModal) targetModal.style.display = 'flex';
}

// 設定ページを閉じる
function closeSettingsPage(page) {
    const settingsModal = document.getElementById('settings-modal');
    let targetModal = null;
    
    if (page === 'user-management') {
        targetModal = document.getElementById('user-management-modal');
    } else if (page === 'company-calendar') {
        targetModal = document.getElementById('company-calendar-modal');
    }
    
    if (targetModal) targetModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'flex';
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

// グローバルに公開
window.loadTableData = loadTableData;

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
        option.textContent = getColumnDisplayName(col);
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
        th.textContent = getColumnDisplayName(col);
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
    // フォーム生成後にボタンテキストを設定（少し遅延して確実に設定）
    setTimeout(() => {
        const submitButton = document.querySelector('#register-form button[type="submit"]');
        if (data && data.id !== undefined) {
            document.getElementById('register-form').dataset.editId = data.id;
            if (submitButton) {
                submitButton.textContent = '更新';
            }
        } else {
            delete document.getElementById('register-form').dataset.editId;
            if (submitButton) {
                submitButton.textContent = '登録';
            }
        }
    }, 50);
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
                fieldHTML += `<div style="display: flex; gap: 8px; align-items: center;">`;
                fieldHTML += `<input type="${fieldConfig.type}" name="${fieldConfig.name}" value="${escapedValue}" 
                    class="form-input" ${fieldConfig.required ? 'required' : ''} 
                    ${fieldConfig.pattern ? `pattern="${fieldConfig.pattern}"` : ''} 
                    ${fieldConfig.placeholder ? `placeholder="${fieldConfig.placeholder}"` : ''} 
                    style="${fieldConfig.button ? 'flex: 1;' : ''}">`;
                if (fieldConfig.button) {
                    fieldHTML += `<button type="button" class="btn-secondary btn-small" onclick="${fieldConfig.button.onclick}()" style="white-space: nowrap;">${fieldConfig.button.label}</button>`;
                }
                fieldHTML += `</div>`;
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
        
        // 工事番号台の選択時に工事番号を自動生成
        if (fieldConfig.name === '工事番号台') {
            const selectElement = field.querySelector('select');
            if (selectElement) {
                // changeイベントで自動採番
                selectElement.addEventListener('change', function() {
                    if (this.value) {
                        generateNextConstructNumber(this.value);
                    }
                });
                
                // 初期値が設定されている場合も自動採番
                if (selectElement.value) {
                    setTimeout(() => {
                        generateNextConstructNumber(selectElement.value);
                    }, 100);
                }
            }
        }
    });
    
    // フォーム生成後にイベントリスナーを設定
    setTimeout(() => {
        setupConstructNumberAutoGeneration();
    }, 100);
}

// 工事番号の自動生成を設定
function setupConstructNumberAutoGeneration() {
    const constructNoSelect = document.querySelector('select[name="工事番号台"]');
    const constructNoInput = document.querySelector('input[name="Construct No"]');
    
    if (constructNoSelect && constructNoInput) {
        // changeイベントで自動採番
        constructNoSelect.addEventListener('change', function() {
            if (this.value) {
                generateNextConstructNumber(this.value);
            }
        });
        
        // 初期値が設定されている場合も自動採番
        if (constructNoSelect.value) {
            setTimeout(() => {
                generateNextConstructNumber(constructNoSelect.value);
            }, 100);
        }
    }
}

// 次の工事番号を生成
async function generateNextConstructNumber(koujibangou) {
    if (!koujibangou || koujibangou.trim() === '') return;
    
    // 工事番号入力欄を取得
    const constructNoInput = document.querySelector('input[name="Construct No"]');
    if (!constructNoInput) return;
    
    try {
        // 工事番号台からプレフィックスを抽出（例：「1000番台」→「10」）
        let prefix = '';
        let prefix1 = '';
        
        if (koujibangou.includes('番台')) {
            const match = koujibangou.match(/^(\d+|[A-Z]\d+|[A-Z])(\d+)?番台/);
            if (match) {
                if (match[1].length === 1 && /[A-Z]/.test(match[1])) {
                    // S, T, Z, Dなどの1文字アルファベット
                    prefix1 = match[1];
                } else if (match[1].length >= 2) {
                    // 数字またはアルファベット+数字
                    prefix = match[1].substring(0, 2);
                    prefix1 = match[1].substring(0, 1);
                }
            }
        } else {
            // 番台が含まれていない場合は最初の2文字を使用
            prefix = koujibangou.substring(0, 2);
            prefix1 = koujibangou.substring(0, 1);
        }
        
        let maxNumber = null;
        
        // テーブル名を確認（t Accept Orderテーブルを想定）
        const tableName = currentTable || 't Accept Order';
        
        // 工事番号カラム名を推測（複数の可能性を試す）
        const possibleColumns = ['Construct No', 'construct_no', 'Order No', 'order_no', '工事番号'];
        let constructNoColumn = null;
        
        // まずカラム名を確認
        if (tableData && tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            constructNoColumn = possibleColumns.find(col => columns.includes(col));
        }
        
        if (!constructNoColumn) {
            constructNoColumn = 'Construct No'; // デフォルト
        }
        
        // データベースから該当する工事番号の最大値を取得
        const { data, error } = await supabase
            .from(tableName)
            .select(constructNoColumn)
            .not(constructNoColumn, 'is', null)
            .limit(10000);
        
        if (error) {
            console.error('工事番号取得エラー:', error);
            // エラーの場合でもデフォルト値を設定
            const nextNumber = calculateNextConstructNumber(koujibangou, null);
            if (nextNumber) {
                constructNoInput.value = nextNumber;
            }
            return;
        }
        
        // 使用済み番号を取得
        const usedNumbers = await getUsedConstructNumbers();
        
        // 選択された工事番号台に該当する最大値を探す（データベース + 使用済み番号）
        const allNumbers = [];
        
        // データベースから取得した番号を追加
        if (data && data.length > 0) {
            data.forEach(row => {
                const value = row[constructNoColumn];
                if (!value) return;
                const strValue = String(value).trim();
                
                // プレフィックスでマッチング
                if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                    // 1文字アルファベット（S, T, Z, D）
                    if (strValue.startsWith(prefix1)) {
                        allNumbers.push(strValue);
                    }
                } else if (prefix) {
                    // 2文字プレフィックス
                    if (strValue.startsWith(prefix)) {
                        allNumbers.push(strValue);
                    }
                }
            });
        }
        
        // 使用済み番号を追加
        usedNumbers.forEach(usedItem => {
            const usedNum = typeof usedItem === 'string' ? usedItem : usedItem.number;
            const strValue = String(usedNum).trim();
            if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                if (strValue.startsWith(prefix1) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            } else if (prefix) {
                if (strValue.startsWith(prefix) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            }
        });
        
        // 最大値を計算
        if (allNumbers.length > 0) {
            const numericValues = allNumbers.filter(v => /^\d+$/.test(v));
            const alphaNumericValues = allNumbers.filter(v => !/^\d+$/.test(v));
            
            if (numericValues.length > 0) {
                maxNumber = Math.max(...numericValues.map(v => parseInt(v, 10))).toString();
            } else if (alphaNumericValues.length > 0) {
                // アルファベット+数字の場合は文字列比較
                maxNumber = alphaNumericValues.sort().reverse()[0];
            }
        }
        
        // 次の番号を生成
        const nextNumber = calculateNextConstructNumber(koujibangou, maxNumber);
        if (nextNumber) {
            constructNoInput.value = nextNumber;
        }
    } catch (error) {
        console.error('工事番号生成エラー:', error);
        // エラーの場合でもデフォルト値を設定
        const nextNumber = calculateNextConstructNumber(koujibangou, null);
        if (nextNumber) {
            constructNoInput.value = nextNumber;
        }
    }
}

// 次の工事番号を計算（VB.NETのロジックをJavaScriptに変換）
function calculateNextConstructNumber(koujibangou, ret) {
    if (!koujibangou) return null;
    
    // 工事番号台から最初の2文字または1文字を抽出
    // 例：「1000番台」→「10」、「3B00番台」→「3B」、「S000番台」→「S」
    let prefix = '';
    let prefix1 = '';
    
    // 「番台」を削除してから処理
    let koujiValue = koujibangou.replace('番台', '').trim();
    
    if (koujiValue.length >= 2) {
        prefix = koujiValue.substring(0, 2);
        prefix1 = koujiValue.substring(0, 1);
    } else if (koujiValue.length === 1) {
        prefix1 = koujiValue;
    }
    
    // retがnullまたはundefinedの場合はデフォルト値を返す
    if (!ret || ret === null || ret === undefined || ret === '') {
        if (prefix === '10') return '1001';
        if (prefix === '29') return '2901';
        if (prefix === '20') return '2001';
        if (prefix === '3B') return '3B01';
        if (prefix === '3C') return '3C01';
        if (prefix === '3V') return '3V01';
        if (prefix === '3P') return '3P01';
        if (prefix === '3T') return '3T01';
        if (prefix === '39') return '3901';
        if (prefix === '30') return '3001';
        if (prefix === '4B') return '4B01';
        if (prefix === '4C') return '4C01';
        if (prefix === '4V') return '4V01';
        if (prefix === '4P') return '4P01';
        if (prefix === '4T') return '4T01';
        if (prefix === '49') return '4901';
        if (prefix === '40') return '4001';
        if (prefix === '5B') return '5B01';
        if (prefix === '5E') return '5E01';
        if (prefix === '50') return '5001';
        if (prefix === '60') return '6001';
        if (prefix === '70') return '7001';
        if (prefix === '7P') return '7P01';
        if (prefix === '8B') return '8B01';
        if (prefix === '8E') return '8E01';
        if (prefix === '80') return '8001';
        if (prefix === '90') return '9001';
        if (prefix1 === 'S') return 'S001';
        if (prefix1 === 'T') return 'T001';
        if (prefix1 === 'Z') return 'Z001';
        if (prefix1 === 'D') return 'D001';
        return null;
    }
    
    const retStr = String(ret).trim();
    
    // VB.NETのロジックに従って処理
    if (prefix === '10') {
        if (retStr === '1999') {
            return '1001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '29') {
        if (retStr === '2999') {
            return '2901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '20') {
        if (retStr === '2899') {
            return '2001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '3B') {
        if (retStr === '3B99') {
            return '3B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3C') {
        if (retStr === '3C99') {
            return '3C01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3C' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3V') {
        if (retStr === '3V99') {
            return '3V01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3V' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3P') {
        if (retStr === '3P99') {
            return '3P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '3T') {
        if (retStr === '3T99') {
            return '3T01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '3T' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '39') {
        if (retStr === '3999') {
            return '3901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '30') {
        if (retStr === '3899') {
            return '3001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '4B') {
        if (retStr === '4B99') {
            return '4B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4C') {
        if (retStr === '4C99') {
            return '4C01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4C' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4V') {
        if (retStr === '4V99') {
            return '4V01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4V' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4P') {
        if (retStr === '4P99') {
            return '4P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '4T') {
        if (retStr === '4T99') {
            return '4T01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '4T' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '49') {
        if (retStr === '4999') {
            return '4901';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '40') {
        if (retStr === '4899') {
            return '4001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '5B') {
        if (retStr === '5B99') {
            return '5B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '5B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '5E') {
        if (retStr === '5E99') {
            return '5E01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '5E' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '50') {
        if (retStr === '5999') {
            return '5001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '60') {
        if (retStr === '6999') {
            return '6001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '70') {
        if (retStr === '7999') {
            return '7001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '7P') {
        if (retStr === '7P99') {
            return '7P01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '7P' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '8B') {
        if (retStr === '8B99') {
            return '8B01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '8B' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '8E') {
        if (retStr === '8E99') {
            return '8E01';
        } else {
            const num = parseInt(retStr.substring(2, 4), 10) + 1;
            return '8E' + String(num).padStart(2, '0');
        }
    }
    else if (prefix === '80') {
        if (retStr === '8999') {
            return '8001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix === '90') {
        if (retStr === '9999') {
            return '9001';
        } else {
            return String(parseInt(retStr, 10) + 1);
        }
    }
    else if (prefix1 === 'S') {
        if (retStr === 'S999') {
            return 'S001';
        } else {
            const num = parseInt(retStr.substring(1, 4), 10) + 1;
            return 'S' + String(num).padStart(3, '0');
        }
    }
    else if (prefix1 === 'T') {
        if (retStr === 'T999') {
            return 'T001';
        } else {
            const num = parseInt(retStr.substring(1, 4), 10) + 1;
            return 'T' + String(num).padStart(3, '0');
        }
    }
    else if (prefix1 === 'Z') {
        if (retStr === 'Z999') {
            return 'Z001';
        } else {
            const num = parseInt(retStr.substring(1, 4), 10) + 1;
            return 'Z' + String(num).padStart(3, '0');
        }
    }
    else if (prefix1 === 'D') {
        if (retStr === 'D999') {
            return 'D001';
        } else {
            const num = parseInt(retStr.substring(1, 4), 10) + 1;
            return 'D' + String(num).padStart(3, '0');
        }
    }
    
    return null;
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
            const escapedValue = value.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            // カラム名を日本語に変換
            const displayName = typeof getColumnDisplayName === 'function' ? getColumnDisplayName(col) : col;
            
            // フィールドタイプを判定
            let inputType = 'text';
            let inputHTML = '';
            
            // カラム名からタイプを推測
            const colLower = col.toLowerCase();
            if (colLower.includes('date') || colLower.includes('日')) {
                inputType = 'date';
                inputHTML = `<input type="date" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('price') || colLower.includes('amount') || colLower.includes('金額') || 
                       colLower.includes('quantity') || colLower.includes('数量') ||
                       colLower.includes('weight') || colLower.includes('重量') ||
                       colLower.includes('code') && !colLower.includes('name')) {
                inputType = 'number';
                inputHTML = `<input type="number" name="${col}" value="${escapedValue}" class="form-input" step="any">`;
            } else if (colLower.includes('email') || colLower.includes('メール')) {
                inputType = 'email';
                inputHTML = `<input type="email" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('tel') || colLower.includes('phone') || colLower.includes('電話') || colLower.includes('fax')) {
                inputType = 'tel';
                inputHTML = `<input type="tel" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('url') || colLower.includes('link')) {
                inputType = 'url';
                inputHTML = `<input type="url" name="${col}" value="${escapedValue}" class="form-input">`;
            } else if (colLower.includes('memo') || colLower.includes('note') || colLower.includes('備考') || colLower.includes('メモ') || 
                       colLower.includes('description') || colLower.includes('説明') || colLower.includes('詳細')) {
                inputHTML = `<textarea name="${col}" class="form-input" rows="3">${escapedValue}</textarea>`;
            } else {
                inputHTML = `<input type="text" name="${col}" value="${escapedValue}" class="form-input">`;
            }
            
            field.innerHTML = `
                <label>${displayName}</label>
                ${inputHTML}
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
            
            // 工事番号が登録された場合は使用済みリストに追加
            const constructNo = data['Construct No'] || data['construct_no'] || data['工事番号'];
            if (constructNo) {
                await saveUsedConstructNumberOnRegister(constructNo);
                // モーダルが開いている場合は一覧を更新
                const modal = document.getElementById('construct-number-modal');
                if (modal && modal.style.display === 'flex') {
                    await loadUsedConstructNumbersListInline();
                }
            }
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

// 工事番号取得モーダルを開く
async function openConstructNumberModal() {
    const modal = document.getElementById('construct-number-modal');
    modal.style.display = 'flex';
    
    // フォームをリセット
    document.getElementById('construct-number-form').reset();
    document.getElementById('construct-number-result').value = '';
    document.getElementById('apply-construct-number-btn').style.display = 'none';
    
    // 現在の登録フォームから工事番号台の値を取得して設定
    const currentKoujibangouSelect = document.querySelector('select[name="工事番号台"]');
    if (currentKoujibangouSelect && currentKoujibangouSelect.value) {
        document.getElementById('construct-number-select').value = currentKoujibangouSelect.value;
    }
    
    // 使用済み一覧を読み込む
    await loadUsedConstructNumbersListInline();
}

// 工事番号取得モーダルを閉じる
function closeConstructNumberModal() {
    const modal = document.getElementById('construct-number-modal');
    modal.style.display = 'none';
}

// 工事番号を取得
async function getConstructNumber() {
    const selectElement = document.getElementById('construct-number-select');
    const resultInput = document.getElementById('construct-number-result');
    const applyBtn = document.getElementById('apply-construct-number-btn');
    
    if (!selectElement.value) {
        showMessage('工事番号台を選択してください', 'warning');
        return;
    }
    
    try {
        // 工事番号を生成
        const koujibangou = selectElement.value;
        await generateNextConstructNumberForModal(koujibangou);
        
        // 結果を表示
        const resultValue = resultInput.value;
        if (resultValue) {
            // 取得した番号を使用済みとして記録（採番日付を記録）
            const today = new Date().toISOString().split('T')[0];
            await saveUsedConstructNumber(resultValue, today);
            applyBtn.style.display = 'inline-block';
            // 使用済み一覧を更新
            await loadUsedConstructNumbersListInline();
            showMessage('工事番号を取得しました（この番号は次回使用できません）', 'success');
        } else {
            showMessage('工事番号の取得に失敗しました', 'error');
        }
    } catch (error) {
        console.error('工事番号取得エラー:', error);
        showMessage('工事番号の取得に失敗しました', 'error');
    }
}

// 使用済み工事番号を取得
async function getUsedConstructNumbers() {
    try {
        // ローカルストレージから使用済み番号を取得
        const usedNumbersJson = localStorage.getItem('used_construct_numbers');
        if (usedNumbersJson) {
            const data = JSON.parse(usedNumbersJson);
            // 旧形式（文字列配列）の場合は新形式に変換
            if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
                return data.map(num => ({
                    number: num,
                    date: new Date().toISOString().split('T')[0],
                    type: '採番'
                }));
            }
            return data;
        }
        return [];
    } catch (error) {
        console.error('使用済み番号取得エラー:', error);
        return [];
    }
}

// 使用済み工事番号を保存（採番時）
async function saveUsedConstructNumber(constructNumber, date = null) {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const today = date || new Date().toISOString().split('T')[0];
        
        // 既に存在するか確認
        const exists = usedNumbers.some(item => {
            const num = typeof item === 'string' ? item : item.number;
            return num === constructNumber;
        });
        
        if (!exists) {
            usedNumbers.push({
                number: constructNumber,
                date: today,
                type: '採番'
            });
            localStorage.setItem('used_construct_numbers', JSON.stringify(usedNumbers));
        }
    } catch (error) {
        console.error('使用済み番号保存エラー:', error);
    }
}

// 使用済み工事番号を保存（登録時）
async function saveUsedConstructNumberOnRegister(constructNumber) {
    try {
        const usedNumbers = await getUsedConstructNumbers();
        const today = new Date().toISOString().split('T')[0];
        
        // 既に存在するか確認
        const existingIndex = usedNumbers.findIndex(item => {
            const num = typeof item === 'string' ? item : item.number;
            return num === constructNumber;
        });
        
        if (existingIndex >= 0) {
            // 既に存在する場合は、登録済みに更新
            usedNumbers[existingIndex] = {
                number: constructNumber,
                date: usedNumbers[existingIndex].date || today,
                registerDate: today,
                type: '登録済み'
            };
        } else {
            // 存在しない場合は新規追加
            usedNumbers.push({
                number: constructNumber,
                date: today,
                registerDate: today,
                type: '登録済み'
            });
        }
        
        localStorage.setItem('used_construct_numbers', JSON.stringify(usedNumbers));
    } catch (error) {
        console.error('使用済み番号保存エラー:', error);
    }
}

// モーダル用の工事番号生成関数
async function generateNextConstructNumberForModal(koujibangou) {
    if (!koujibangou || koujibangou.trim() === '') return;
    
    const resultInput = document.getElementById('construct-number-result');
    if (!resultInput) return;
    
    try {
        // 工事番号台からプレフィックスを抽出
        let prefix = '';
        let prefix1 = '';
        
        // 「番台」を削除してから処理
        let koujiValue = koujibangou.replace('番台', '').trim();
        
        if (koujiValue.length >= 2) {
            prefix = koujiValue.substring(0, 2);
            prefix1 = koujiValue.substring(0, 1);
        } else if (koujiValue.length === 1) {
            prefix1 = koujiValue;
        }
        
        let maxNumber = null;
        
        // テーブル名を確認
        const tableName = currentTable || 't Accept Order';
        
        // 工事番号カラム名を推測
        const possibleColumns = ['Construct No', 'construct_no', 'Order No', 'order_no', '工事番号'];
        let constructNoColumn = null;
        
        if (tableData && tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            constructNoColumn = possibleColumns.find(col => columns.includes(col));
        }
        
        if (!constructNoColumn) {
            constructNoColumn = 'Construct No';
        }
        
        // データベースから該当する工事番号の最大値を取得
        const { data, error } = await supabase
            .from(tableName)
            .select(constructNoColumn)
            .not(constructNoColumn, 'is', null)
            .limit(10000);
        
        if (error) {
            console.error('工事番号取得エラー:', error);
            const nextNumber = calculateNextConstructNumber(koujibangou, null);
            if (nextNumber) {
                resultInput.value = nextNumber;
            }
            return;
        }
        
        // 使用済み番号を取得
        const usedNumbers = await getUsedConstructNumbers();
        
        // 選択された工事番号台に該当する最大値を探す（データベース + 使用済み番号）
        const allNumbers = [];
        
        // データベースから取得した番号を追加
        if (data && data.length > 0) {
            data.forEach(row => {
                const value = row[constructNoColumn];
                if (!value) return;
                const strValue = String(value).trim();
                
                // プレフィックスでマッチング
                if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                    if (strValue.startsWith(prefix1)) {
                        allNumbers.push(strValue);
                    }
                } else if (prefix) {
                    if (strValue.startsWith(prefix)) {
                        allNumbers.push(strValue);
                    }
                }
            });
        }
        
        // 使用済み番号を追加
        usedNumbers.forEach(usedItem => {
            const usedNum = typeof usedItem === 'string' ? usedItem : usedItem.number;
            const strValue = String(usedNum).trim();
            if (prefix1 && /^[A-Z]$/.test(prefix1)) {
                if (strValue.startsWith(prefix1) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            } else if (prefix) {
                if (strValue.startsWith(prefix) && !allNumbers.includes(strValue)) {
                    allNumbers.push(strValue);
                }
            }
        });
        
        // 最大値を計算
        if (allNumbers.length > 0) {
            const numericValues = allNumbers.filter(v => /^\d+$/.test(v));
            const alphaNumericValues = allNumbers.filter(v => !/^\d+$/.test(v));
            
            if (numericValues.length > 0) {
                maxNumber = Math.max(...numericValues.map(v => parseInt(v, 10))).toString();
            } else if (alphaNumericValues.length > 0) {
                maxNumber = alphaNumericValues.sort().reverse()[0];
            }
        }
        
        // 次の番号を生成
        const nextNumber = calculateNextConstructNumber(koujibangou, maxNumber);
        if (nextNumber) {
            resultInput.value = nextNumber;
        }
    } catch (error) {
        console.error('工事番号生成エラー:', error);
        const nextNumber = calculateNextConstructNumber(koujibangou, null);
        if (nextNumber) {
            resultInput.value = nextNumber;
        }
    }
}

// 取得した工事番号を登録フォームに適用
function applyConstructNumber() {
    const resultInput = document.getElementById('construct-number-result');
    const constructNoInput = document.querySelector('input[name="Construct No"]');
    const koujibangouSelect = document.querySelector('select[name="工事番号台"]');
    const modalSelect = document.getElementById('construct-number-select');
    
    if (!resultInput || !resultInput.value) {
        showMessage('工事番号が取得されていません', 'warning');
        return;
    }
    
    if (constructNoInput) {
        constructNoInput.value = resultInput.value;
    }
    
    if (koujibangouSelect && modalSelect && modalSelect.value) {
        koujibangouSelect.value = modalSelect.value;
    }
    
    closeConstructNumberModal();
    showMessage('工事番号を登録フォームに適用しました', 'success');
}

// 使用済み工事番号一覧モーダルを開く
async function openUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'flex';
    
    await loadUsedConstructNumbersList();
}

// 使用済み工事番号一覧モーダルを閉じる
function closeUsedConstructNumbersModal() {
    const modal = document.getElementById('used-construct-numbers-modal');
    modal.style.display = 'none';
}

// 使用済み工事番号一覧を読み込む（インライン表示用）
async function loadUsedConstructNumbersListInline() {
    const tbody = document.getElementById('used-construct-numbers-list-inline');
    if (!tbody) return;
    
    const usedNumbers = await getUsedConstructNumbers();
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">使用済み工事番号はありません</td></tr>';
        return;
    }
    
    // 日付でソート（新しい順）
    const sorted = usedNumbers.sort((a, b) => {
        const dateA = a.registerDate || a.date || '';
        const dateB = b.registerDate || b.date || '';
        return dateB.localeCompare(dateA);
    });
    
    tbody.innerHTML = sorted.map(item => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        const type = typeof item === 'string' ? '採番' : (item.type || '採番');
        const typeClass = type === '登録済み' ? 'style="color: #4caf50; font-weight: 600;"' : 'style="color: #2196f3;"';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: 600; font-size: 14px;">${num}</td>
                <td style="padding: 10px; text-align: center; font-size: 13px;">${date || '-'}</td>
                <td style="padding: 10px; text-align: center; font-size: 13px;" ${typeClass}>${type}</td>
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号一覧を読み込む（モーダル表示用）
async function loadUsedConstructNumbersList() {
    const tbody = document.getElementById('used-construct-numbers-list');
    if (!tbody) return;
    
    const usedNumbers = await getUsedConstructNumbers();
    
    if (usedNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">使用済み工事番号はありません</td></tr>';
        return;
    }
    
    // 日付でソート（新しい順）
    const sorted = usedNumbers.sort((a, b) => {
        const dateA = a.registerDate || a.date || '';
        const dateB = b.registerDate || b.date || '';
        return dateB.localeCompare(dateA);
    });
    
    tbody.innerHTML = sorted.map(item => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        const type = typeof item === 'string' ? '採番' : (item.type || '採番');
        const typeClass = type === '登録済み' ? 'style="color: #4caf50; font-weight: 600;"' : 'style="color: #2196f3;"';
        
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-weight: 600; font-size: 14px;">${num}</td>
                <td style="padding: 12px; text-align: center; font-size: 13px;">${date || '-'}</td>
                <td style="padding: 12px; text-align: center; font-size: 13px;" ${typeClass}>${type}</td>
            </tr>
        `;
    }).join('');
}

// 使用済み工事番号を全削除
async function clearUsedConstructNumbers() {
    if (confirm('使用済み工事番号をすべて削除しますか？')) {
        localStorage.removeItem('used_construct_numbers');
        await loadUsedConstructNumbersList();
        await loadUsedConstructNumbersListInline();
        showMessage('使用済み工事番号をすべて削除しました', 'success');
    }
}

// 使用済み工事番号をCSV出力
async function exportUsedConstructNumbers() {
    const usedNumbers = await getUsedConstructNumbers();
    
    if (usedNumbers.length === 0) {
        showMessage('出力するデータがありません', 'warning');
        return;
    }
    
    // CSVヘッダー
    let csv = '工事番号,日付,状態\n';
    
    // データ
    usedNumbers.forEach(item => {
        const num = typeof item === 'string' ? item : item.number;
        const date = typeof item === 'string' ? '' : (item.registerDate || item.date || '');
        const type = typeof item === 'string' ? '採番' : (item.type || '採番');
        
        csv += `${num},${date},${type}\n`;
    });
    
    // ダウンロード
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `使用済み工事番号_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('CSVファイルを出力しました', 'success');
}
