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
    },
    // t Accept Orderテーブル
    't Accept Order': {
        title: '受注登録',
        fields: [
            {
                name: '工事番号台',
                label: '工事番号台',
                type: 'select',
                required: true,
                width: 'half',
                placeholder: '選択してください',
                options: [
                    { value: '1000番台', label: '1000番台' },
                    { value: '2000番台', label: '2000番台' },
                    { value: '2900番台', label: '2900番台' },
                    { value: '3000番台', label: '3000番台' },
                    { value: '3A00番台', label: '3A00番台' },
                    { value: '3B00番台', label: '3B00番台' },
                    { value: '3C00番台', label: '3C00番台' },
                    { value: '3P00番台', label: '3P00番台' },
                    { value: '3T00番台', label: '3T00番台' },
                    { value: '4000番台', label: '4000番台' },
                    { value: '4A00番台', label: '4A00番台' },
                    { value: '4B00番台', label: '4B00番台' },
                    { value: '4C00番台', label: '4C00番台' },
                    { value: '4P00番台', label: '4P00番台' },
                    { value: '4T00番台', label: '4T00番台' },
                    { value: '5000番台', label: '5000番台' },
                    { value: '5A00番台', label: '5A00番台' },
                    { value: '5B00番台', label: '5B00番台' },
                    { value: '5E00番台', label: '5E00番台' },
                    { value: '6000番台', label: '6000番台' },
                    { value: '7000番台', label: '7000番台' },
                    { value: '7P00番台', label: '7P00番台' },
                    { value: '8000番台', label: '8000番台' },
                    { value: '8A00番台', label: '8A00番台' },
                    { value: '8B00番台', label: '8B00番台' },
                    { value: '8E00番台', label: '8E00番台' },
                    { value: '9000番台', label: '9000番台' },
                    { value: 'S000番台', label: 'S000番台' },
                    { value: 'Z000番台', label: 'Z000番台' },
                    { value: 'D000番台', label: 'D000番台' }
                ]
            },
            {
                name: 'Construct No',
                label: '工事番号',
                type: 'text',
                required: true,
                width: 'half',
                placeholder: '自動生成されます',
                button: {
                    label: '工事番号取得',
                    onclick: 'openConstructNumberModal'
                }
            },
            {
                name: 'Register Date',
                label: '受注登録日',
                type: 'date',
                width: 'half'
            },
            {
                name: 'Construct Name',
                label: '工事名称',
                type: 'text',
                width: 'half'
            },
            {
                name: 'Eigyo Manno',
                label: '営業担当ｺｰﾄﾞ',
                type: 'text',
                width: 'half'
            },
            {
                name: 'Owner Code',
                label: '受注元ｺｰﾄﾞ',
                type: 'text',
                width: 'half'
            },
            {
                name: 'User Code',
                label: '納品先ｺｰﾄﾞ',
                type: 'text',
                width: 'half'
            },
            {
                name: 'Order Price',
                label: '受注金額',
                type: 'number',
                width: 'half'
            },
            {
                name: 'Order Date',
                label: '受注日',
                type: 'date',
                width: 'half'
            },
            {
                name: 'Delivery Date',
                label: '納期',
                type: 'date',
                width: 'half'
            },
            {
                name: 'Dealing Doc Mitsumori',
                label: '電子見積書',
                type: 'text',
                width: 'half'
            },
            {
                name: 'Dealing Doc Chuumon',
                label: '電子注文書',
                type: 'text',
                width: 'half'
            },
            {
                name: 'Dealing Doc Seikyu',
                label: '電子請求書',
                type: 'text',
                width: 'half'
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

