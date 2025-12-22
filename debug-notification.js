// 通知機能のデバッグ用スクリプト
// ブラウザのコンソールで実行してください

console.log('=== 通知機能デバッグ情報 ===\n');

// 1. 通知許可の状態
console.log('1. 通知許可の状態:');
console.log('   Notification API サポート:', 'Notification' in window);
console.log('   通知許可:', Notification.permission);
console.log('');

// 2. カレンダーイベントの状態
console.log('2. カレンダーイベントの状態:');
const events = typeof window !== 'undefined' && typeof window.calendarEvents !== 'undefined' 
    ? window.calendarEvents 
    : (typeof calendarEvents !== 'undefined' ? calendarEvents : []);
console.log('   イベント数:', Array.isArray(events) ? events.length : '未定義');
if (Array.isArray(events) && events.length > 0) {
    console.log('   今日のイベント:');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    events.forEach((event, index) => {
        if (event && event.date && event.time) {
            let eventDateStr = event.date;
            if (eventDateStr instanceof Date || (typeof eventDateStr === 'string' && eventDateStr.includes('T'))) {
                const d = new Date(eventDateStr);
                eventDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            
            const isToday = eventDateStr === todayStr;
            const hasNotification = event.notification !== false;
            console.log(`   [${index + 1}] ${event.title || 'タイトルなし'} - ${event.date} ${event.time} - 今日: ${isToday} - 通知: ${hasNotification}`);
        }
    });
}
console.log('');

// 3. 通知チェックの状態
console.log('3. 通知チェックの状態:');
if (typeof startCalendarNotificationCheck === 'function') {
    console.log('   startCalendarNotificationCheck関数: 利用可能');
} else {
    console.log('   startCalendarNotificationCheck関数: 未定義');
}
if (typeof checkUpcomingEvents === 'function') {
    console.log('   checkUpcomingEvents関数: 利用可能');
    console.log('   手動でチェックを実行: checkUpcomingEvents()');
} else {
    console.log('   checkUpcomingEvents関数: 未定義');
}
console.log('');

// 4. 通知済みイベント
console.log('4. 通知済みイベント:');
const notifiedIds = JSON.parse(localStorage.getItem('calendarNotifiedEventIds') || '[]');
console.log('   通知済み数:', notifiedIds.length);
if (notifiedIds.length > 0) {
    console.log('   通知済みID:', notifiedIds);
}
console.log('');

// 5. 現在時刻
console.log('5. 現在時刻:');
const now = new Date();
console.log('   現在:', now.toLocaleString('ja-JP'));
console.log('');

// 6. 手動テスト
console.log('6. 手動テスト:');
console.log('   テスト通知を表示: testEventNotification()');
console.log('   通知チェックを開始: startCalendarNotificationCheck()');
console.log('   通知チェックを停止: stopCalendarNotificationCheck()');
console.log('   通知済みIDをクリア: clearNotifiedEventIds()');
console.log('');

console.log('=== デバッグ情報終了 ===');

