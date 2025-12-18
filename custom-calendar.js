// カスタムカレンダーピッカー

let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let targetInputElement = null;

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];

// カレンダーピッカーを開く
function openCustomCalendar(inputElement) {
    targetInputElement = inputElement;
    const currentValue = inputElement.value;
    
    if (currentValue) {
        const date = new Date(currentValue);
        if (!isNaN(date.getTime())) {
            currentCalendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
            selectedCalendarDate = new Date(date);
        }
    } else {
        currentCalendarDate = new Date();
        selectedCalendarDate = null;
    }
    
    renderCalendar();
    
    const picker = document.getElementById('custom-calendar-picker');
    if (picker) {
        picker.style.display = 'flex';
        
        // 入力フィールドの位置に合わせて配置（モーダル内で切れないように調整）
        const rect = inputElement.getBoundingClientRect();
        const pickerContainer = picker.querySelector('.custom-calendar-container');
        const pickerHeight = pickerContainer ? pickerContainer.offsetHeight : 280;
        const pickerWidth = pickerContainer ? pickerContainer.offsetWidth : 280;
        
        let top = rect.bottom + 4;
        let left = rect.left;
        
        // 画面下部で切れないように調整
        if (top + pickerHeight > window.innerHeight) {
            top = rect.top - pickerHeight - 4;
            if (top < 0) {
                top = 8;
            }
        }
        
        // 画面右側で切れないように調整
        if (left + pickerWidth > window.innerWidth) {
            left = window.innerWidth - pickerWidth - 8;
            if (left < 0) {
                left = 8;
            }
        }
        
        picker.style.top = top + 'px';
        picker.style.left = left + 'px';
    }
}

// カレンダーピッカーを閉じる
function closeCustomCalendar() {
    const picker = document.getElementById('custom-calendar-picker');
    if (picker) {
        picker.style.display = 'none';
    }
    targetInputElement = null;
}

// カレンダーを描画
function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // 月と年を更新
    const monthEl = document.getElementById('calendar-display-month');
    const yearEl = document.getElementById('calendar-display-year');
    if (monthEl) monthEl.textContent = monthNames[month];
    if (yearEl) yearEl.textContent = year;
    
    // カレンダーのグリッドを生成
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const daysGrid = document.getElementById('calendar-days-grid');
    if (!daysGrid) return;
    
    daysGrid.innerHTML = '';
    
    // 前月の日付
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        const dayElement = createDayElement(date, true);
        daysGrid.appendChild(dayElement);
    }
    
    // 今月の日付
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
        const dayElement = createDayElement(date, false, isToday, isSelected);
        daysGrid.appendChild(dayElement);
    }
    
    // 次月の日付（42マス埋める）
    const totalCells = daysGrid.children.length;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        const dayElement = createDayElement(date, true);
        daysGrid.appendChild(dayElement);
    }
}

// 日付要素を作成
function createDayElement(date, isOtherMonth, isToday = false, isSelected = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day-cell';
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    if (isToday) {
        dayElement.classList.add('today');
    }
    if (isSelected) {
        dayElement.classList.add('selected');
    }
    
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
        dayElement.classList.add('sunday');
    } else if (dayOfWeek === 6) {
        dayElement.classList.add('saturday');
    }
    
    dayElement.textContent = date.getDate();
    dayElement.dataset.date = date.toISOString().split('T')[0];
    
    dayElement.addEventListener('click', () => {
        selectDate(date);
    });
    
    return dayElement;
}

// 日付を選択
function selectDate(date) {
    selectedCalendarDate = date;
    
    if (targetInputElement) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        targetInputElement.value = `${year}-${month}-${day}`;
        
        // changeイベントを発火
        const event = new Event('change', { bubbles: true });
        targetInputElement.dispatchEvent(event);
    }
    
    renderCalendar();
    setTimeout(() => {
        closeCustomCalendar();
    }, 200);
}

// 前月に移動
function goToPrevMonth() {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1);
    renderCalendar();
}

// 次月に移動
function goToNextMonth() {
    currentCalendarDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1);
    renderCalendar();
}

// 今日を選択
function selectToday() {
    const today = new Date();
    selectDate(today);
}

// クリア
function clearDate() {
    selectedCalendarDate = null;
    if (targetInputElement) {
        targetInputElement.value = '';
        const event = new Event('change', { bubbles: true });
        targetInputElement.dispatchEvent(event);
    }
    closeCustomCalendar();
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.openCustomCalendar = openCustomCalendar;
    window.closeCustomCalendar = closeCustomCalendar;
}

// イベントリスナーの設定（非ブロッキング）
(function() {
    'use strict';
    
    const processedInputs = new WeakSet();
    
    function setupDateInput(input) {
        if (processedInputs.has(input)) {
            return;
        }
        processedInputs.add(input);
        
        // クリックイベントを無効化してカスタムカレンダーを開く
        input.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.blur();
            openCustomCalendar(this);
            return false;
        }, true);
        
        // フォーカス時もカスタムカレンダーを開く
        input.addEventListener('focus', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.blur();
            openCustomCalendar(this);
            return false;
        }, true);
        
        // mousedownでも防止
        input.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.blur();
            setTimeout(() => {
                openCustomCalendar(this);
            }, 10);
            return false;
        }, true);
    }
    
    function setupDateInputs() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!processedInputs.has(input)) {
                setupDateInput(input);
            }
        });
    }
    
    // カレンダーボタンのイベントリスナー設定
    function setupCalendarButtons() {
        const prevBtn = document.getElementById('calendar-prev-month');
        const nextBtn = document.getElementById('calendar-next-month');
        const todayBtn = document.getElementById('calendar-today');
        const clearBtn = document.getElementById('calendar-clear');
        
        if (prevBtn) prevBtn.addEventListener('click', goToPrevMonth);
        if (nextBtn) nextBtn.addEventListener('click', goToNextMonth);
        if (todayBtn) todayBtn.addEventListener('click', selectToday);
        if (clearBtn) clearBtn.addEventListener('click', clearDate);
        
        // カレンダー外をクリックで閉じる
        const overlay = document.getElementById('custom-calendar-picker');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    closeCustomCalendar();
                }
            });
        }
    }
    
    // ページが完全に読み込まれてから初期化（非ブロッキング）
    function init() {
        try {
            setupCalendarButtons();
            
            // 初期設定（少し遅延）
            setTimeout(() => {
                setupDateInputs();
            }, 500);
            
            // モーダルが開かれた時にdate inputを設定
            document.addEventListener('click', function(e) {
                if (e.target.closest('.modal-overlay')) {
                    setTimeout(() => {
                        setupDateInputs();
                    }, 100);
                }
            });
        } catch (error) {
            console.error('カスタムカレンダーの初期化エラー:', error);
        }
    }
    
    // ページが読み込まれたら初期化
    if (document.readyState === 'complete') {
        setTimeout(init, 1000);
    } else {
        window.addEventListener('load', function() {
            setTimeout(init, 1000);
        });
    }
})();
