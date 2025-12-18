// テーブルごとのフォーム定義設定
// 各テーブルに対して、カスタマイズされたフォームフィールドを定義できます

const formConfigs = {
    // 取引先テーブルの例
    '取引先': {
        title: '取引先',
        fields: [
            {
                name: '取引先名称',
                label: '取引先名称',
                type: 'text',
                required: true,
                width: 'full' // full, half, third
            },
            {
                name: '略名称',
                label: '略名称',
                type: 'text',
                width: 'half'
            },
            {
                name: 'ヨミガナ',
                label: 'ヨミガナ',
                type: 'text',
                width: 'half'
            },
            {
                name: '国名',
                label: '国名',
                type: 'text',
                width: 'half'
            },
            {
                name: '郵便番号',
                label: '郵便番号',
                type: 'text',
                width: 'half',
                pattern: '[0-9]{3}-[0-9]{4}',
                placeholder: '123-4567'
            },
            {
                name: '住所1',
                label: '住所',
                type: 'text',
                width: 'full'
            },
            {
                name: '住所2',
                label: '',
                type: 'text',
                width: 'full'
            },
            {
                name: '電話',
                label: '電話',
                type: 'tel',
                width: 'half',
                pattern: '[0-9-]+',
                placeholder: '03-1234-5678'
            },
            {
                name: 'FAX',
                label: 'FAX',
                type: 'tel',
                width: 'half',
                pattern: '[0-9-]+'
            },
            {
                name: '分類',
                label: '分類',
                type: 'checkbox-group',
                width: 'full',
                options: [
                    { value: '客先', label: '客先' },
                    { value: '仕入先', label: '仕入先' },
                    { value: '外注加工業者', label: '外注加工業者' },
                    { value: '総務部関係', label: '総務部関係' },
                    { value: 'その他', label: 'その他' }
                ]
            },
            {
                name: '担当者1',
                label: '担当者',
                type: 'text',
                width: 'half'
            },
            {
                name: '担当者2',
                label: '',
                type: 'text',
                width: 'half'
            },
            {
                name: 'メールアドレス1',
                label: 'メールアドレス1',
                type: 'email',
                width: 'full',
                placeholder: 'example@company.com',
                note: '[発注]見積照会用'
            },
            {
                name: 'メールアドレス2',
                label: 'メールアドレス2',
                type: 'email',
                width: 'full',
                placeholder: 'example@company.com',
                note: '[発注]注文書送信用'
            },
            {
                name: 'メールアドレス3',
                label: 'メールアドレス3',
                type: 'email',
                width: 'full',
                placeholder: 'example@company.com',
                note: '[発注]債務一覧送信用'
            },
            {
                name: '売掛コード',
                label: '売掛コード',
                type: 'text',
                width: 'half'
            },
            {
                name: '買掛コード',
                label: '買掛コード',
                type: 'text',
                width: 'half'
            },
            {
                name: '取引文書',
                label: '取引文書(電・紙・混・無)',
                type: 'checkbox-group',
                width: 'full',
                options: [
                    { value: '見積書', label: '見積書' },
                    { value: '注文書', label: '注文書' },
                    { value: '納品書', label: '納品書' },
                    { value: '検収書', label: '検収書' },
                    { value: '請求書', label: '請求書' },
                    { value: '領収証', label: '領収証' }
                ]
            }
        ]
    }
};

// フォーム定義を取得する関数
function getFormConfig(tableName) {
    if (!tableName) return null;
    
    // まず完全一致を確認
    if (formConfigs[tableName]) {
        return formConfigs[tableName];
    }
    
    // テーブル表示名で検索（getTableDisplayNameが利用可能な場合）
    if (typeof getTableDisplayName === 'function') {
        try {
            const displayName = getTableDisplayName(tableName);
            if (formConfigs[displayName]) {
                return formConfigs[displayName];
            }
        } catch (e) {
            // エラーは無視
        }
    }
    
    // 設定がない場合はnullを返す（デフォルト動作）
    return null;
}

