// カレンダーイベント通知機能（ブラウザNotification API使用）

// 通知チェック用のインターバル変数
let calendarNotificationCheckInterval = null;

// 通知済みイベントIDを保存するキー
const NOTIFIED_EVENTS_KEY = 'calendarNotifiedEventIds';

// Step1: 通知許可の取得
async function requestNotificationPermission() {
    // Notification APIがサポートされているかチェック
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知機能をサポートしていません');
        alert('このブラウザは通知機能をサポートしていません。');
        return false;
    }
    
    // 既に許可されている場合
    if (Notification.permission === 'granted') {
        console.log('通知は既に許可されています');
        return true;
    }
    
    // 既に拒否されている場合
    if (Notification.permission === 'denied') {
        console.warn('通知が拒否されています。ブラウザの設定から許可してください。');
        alert('通知が拒否されています。\n\nブラウザの設定から通知を許可してください。\n\n【設定方法】\n・Chrome: 設定 > プライバシーとセキュリティ > サイトの設定 > 通知\n・Edge: 設定 > Cookieとサイトの権限 > 通知\n・Firefox: 設定 > プライバシーとセキュリティ > 権限 > 通知');
        return false;
    }
    
    // 許可を求める（ブラウザのポップアップが表示される）
    try {
        // ユーザーに説明を表示（オプション）
        console.log('通知許可を求めます。ブラウザのポップアップで「許可」を選択してください。');
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // 許可状態をローカルストレージに保存
            localStorage.setItem('notificationPermission', 'granted');
            console.log('通知許可が取得されました');
            // 通知チェックを自動的に開始
            if (typeof startCalendarNotificationCheck === 'function') {
                startCalendarNotificationCheck();
            }
            return true;
        } else if (permission === 'denied') {
            localStorage.setItem('notificationPermission', 'denied');
            console.log('通知許可が拒否されました');
            alert('通知が拒否されました。\n\n後で通知を有効にする場合は、ブラウザの設定から許可してください。');
            return false;
        } else {
            // 'default' の場合（ユーザーが選択しなかった）
            localStorage.setItem('notificationPermission', 'default');
            console.log('通知許可が選択されませんでした');
            return false;
        }
    } catch (error) {
        console.error('通知許可の取得エラー:', error);
        alert('通知許可の取得中にエラーが発生しました: ' + error.message);
        return false;
    }
}

// Step2: 通知スケジュール機能の作成
function startCalendarNotificationCheck() {
    // 既存のインターバルをクリア
    if (calendarNotificationCheckInterval) {
        clearInterval(calendarNotificationCheckInterval);
    }
    
    // 通知許可を確認
    if (Notification.permission !== 'granted') {
        console.log('通知許可が取得されていないため、通知チェックを開始しません');
        return;
    }
    
    // 1分ごとにチェック
    calendarNotificationCheckInterval = setInterval(() => {
        checkUpcomingEvents();
    }, 60000); // 60秒 = 1分
    
    // 初回チェックも実行
    checkUpcomingEvents();
    
    console.log('カレンダー通知チェックを開始しました');
}

// 10分以内のイベントをチェック
function checkUpcomingEvents() {
    // 通知許可を確認
    if (Notification.permission !== 'granted') {
        console.log('[通知チェック] 通知許可が取得されていません');
        return;
    }
    
    // カレンダーイベントが読み込まれているか確認
    const events = typeof window !== 'undefined' && typeof window.calendarEvents !== 'undefined' 
        ? window.calendarEvents 
        : (typeof calendarEvents !== 'undefined' ? calendarEvents : []);
    
    if (!Array.isArray(events) || events.length === 0) {
        console.log('[通知チェック] カレンダーイベントが読み込まれていません');
        return;
    }
    
    console.log(`[通知チェック] ${events.length}件のイベントをチェック中...`);
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 通知済みイベントIDを取得
    const notifiedEventIds = JSON.parse(localStorage.getItem(NOTIFIED_EVENTS_KEY) || '[]');
    
    // 今日の予定で、時間が設定されているものをフィルタリング
    const todayEvents = events.filter(event => {
        // 通知が無効な場合はスキップ
        if (event.notification === false) {
            console.log(`[通知チェック] 通知が無効: ${event.title || 'タイトルなし'}`);
            return false;
        }
        
        if (!event || !event.date || !event.time) {
            console.log(`[通知チェック] 日付または時間が設定されていません: ${event.title || 'タイトルなし'}`);
            return false;
        }
        
        // 日付を文字列として比較
        let eventDateStr = event.date;
        if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
            const d = new Date(eventDateStr);
            eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        } else if (typeof eventDateStr === 'string' && eventDateStr.includes('/')) {
            const parts = eventDateStr.split('/');
            if (parts.length === 3) {
                eventDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
        }
        
        return eventDateStr === todayStr;
    });
    
    // 各イベントをチェック
    todayEvents.forEach(event => {
        if (!event.time || event.time.trim() === '') return;
        
        const timeParts = event.time.trim().split(':');
        if (timeParts.length < 2) return;
        
        const eventHour = parseInt(timeParts[0], 10);
        const eventMinute = parseInt(timeParts[1], 10);
        
        if (isNaN(eventHour) || isNaN(eventMinute)) return;
        
        // イベント開始時刻を計算
        const eventTime = new Date();
        eventTime.setHours(eventHour, eventMinute, 0, 0);
        
        // 現在時刻との差分を計算（分単位）
        const timeDiff = eventTime - now;
        const minutes = Math.floor(timeDiff / 60000);
        
        // イベントIDを生成（日付_時間_タイトル）
        const eventId = `${event.date}_${event.time}_${event.title || ''}`;
        
        // デバッグ情報を出力
        const isNotified = notifiedEventIds.includes(eventId);
        console.log(`[通知チェック] イベント: ${event.title || 'タイトルなし'} (${event.time}) - 残り${minutes}分 - 通知済み: ${isNotified}`);
        
        // 10分前から0分前まで（既に通知済みでない場合）
        if (minutes <= 10 && minutes >= 0 && !isNotified) {
            console.log(`[通知チェック] 通知を表示します: ${event.title || 'タイトルなし'} (${minutes}分前)`);
            showEventNotification(event);
            // 通知済みリストに追加
            notifiedEventIds.push(eventId);
            localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(notifiedEventIds));
        } else if (minutes > 10) {
            console.log(`[通知チェック] まだ早すぎます: ${event.title || 'タイトルなし'} (${minutes}分後)`);
        } else if (minutes < 0) {
            console.log(`[通知チェック] イベントは既に開始しています: ${event.title || 'タイトルなし'} (${Math.abs(minutes)}分前)`);
        }
    });
}

// Step3: 通知の表示
function showEventNotification(event) {
    // 通知許可を確認
    if (Notification.permission !== 'granted') {
        console.warn('通知許可が取得されていません');
        return;
    }
    
    const eventTitle = event.title || 'タイトルなし';
    const notificationTitle = '📅 予定通知';
    const notificationBody = `${eventTitle} - 10分後に開始します`;
    
    // 通知オプション
    const notificationOptions = {
        body: notificationBody,
        icon: '/favicon.ico', // アイコンがある場合
        badge: '/favicon.ico',
        tag: `event_${event.date}_${event.time}`, // 同じイベントの重複通知を防ぐ
        requireInteraction: false, // 自動で閉じる
        silent: false // 通知音を鳴らす
    };
    
    try {
        const notification = new Notification(notificationTitle, notificationOptions);
        
        // 通知クリック時の処理
        notification.onclick = function() {
            window.focus(); // ウィンドウにフォーカス
            // カレンダーページに移動（ダッシュボードページを表示）
            if (typeof showPage === 'function') {
                showPage('dashboard');
            }
            notification.close();
        };
        
        // 通知が閉じられた時の処理
        notification.onclose = function() {
            console.log('通知が閉じられました');
        };
        
        // 通知エラーの処理
        notification.onerror = function(error) {
            console.error('通知エラー:', error);
        };
        
        console.log('通知を表示しました:', notificationBody);
    } catch (error) {
        console.error('通知の表示エラー:', error);
    }
}

// Step4: テスト用の即時通知
function testEventNotification() {
    // 通知許可を確認
    if (Notification.permission !== 'granted') {
        alert('通知許可が必要です。まず通知許可を取得してください。');
        requestNotificationPermission().then(granted => {
            if (granted) {
                // テスト通知を表示
                const testEvent = {
                    title: 'テスト予定',
                    date: new Date().toISOString().split('T')[0],
                    time: '10:00',
                    description: 'これはテスト通知です'
                };
                showEventNotification(testEvent);
            }
        });
        return;
    }
    
    // テスト通知を表示
    const testEvent = {
        title: 'テスト予定',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        description: 'これはテスト通知です'
    };
    showEventNotification(testEvent);
    alert('テスト通知を表示しました。ブラウザの通知を確認してください。');
}

// 通知チェックを停止
function stopCalendarNotificationCheck() {
    if (calendarNotificationCheckInterval) {
        clearInterval(calendarNotificationCheckInterval);
        calendarNotificationCheckInterval = null;
        console.log('カレンダー通知チェックを停止しました');
    }
}

// 通知済みイベントIDをクリア（デバッグ用）
function clearNotifiedEventIds() {
    localStorage.removeItem(NOTIFIED_EVENTS_KEY);
    console.log('通知済みイベントIDをクリアしました');
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.requestNotificationPermission = requestNotificationPermission;
    window.startCalendarNotificationCheck = startCalendarNotificationCheck;
    window.stopCalendarNotificationCheck = stopCalendarNotificationCheck;
    window.testEventNotification = testEventNotification;
    window.clearNotifiedEventIds = clearNotifiedEventIds;
    window.checkUpcomingEvents = checkUpcomingEvents; // デバッグ用に公開
}

