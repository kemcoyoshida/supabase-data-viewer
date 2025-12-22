// 図面番号採番システム（Supabase直接接続版・VB.NETロジック完全再現）

// 図面番号採番ページの初期化
async function initializeDrawingNumberPage() {
    console.log('図面番号採番ページを初期化します');
    
    // 採番者リストを読み込む
    await loadDesigners();
    
    // 採番日に現在日時を設定
    const saibanDateInput = document.getElementById('saiban-date-input');
    if (saibanDateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        saibanDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // 図面一覧を読み込む
    await loadDrawingList();
}

// 採番者リストを読み込む（T Computer DeviceテーブルのDepaCode='325'または'320'のみ）
async function loadDesigners() {
    const designerSelect = document.getElementById('designer-select');
    if (!designerSelect) return;
    
    designerSelect.innerHTML = '<option value="">読み込み中...</option>';
    
    try {
        const tableNames = ['T_ComputerDevice', 't_computerdevice', 't_computer_device', 'ComputerDevice'];
        let data = null;
        
        for (const tableName of tableNames) {
            try {
                // T Computer DeviceテーブルのDepaCodeでフィルタリング
                const result = await getSupabaseClient()
                    .from(tableName)
                    .select('*')
                    .or('DepaCode.eq.325,DepaCode.eq.320');
                
                if (!result.error && result.data && result.data.length > 0) {
                    data = result.data;
                    break;
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        
        if (!data || data.length === 0) {
            console.warn('採番者が見つかりませんでした');
            designerSelect.innerHTML = '<option value="">採番者が見つかりません</option>';
            return;
        }
        
        designerSelect.innerHTML = '<option value="">選択してください</option>';
        
        data.forEach(staff => {
            const staffName = staff.StaffName || staff.staffName || staff.staff_name || '';
            if (staffName) {
                const option = document.createElement('option');
                // VB.NETのロジック: UserName() = UserFullName.Split("　")
                const userName = staffName.split('　')[0] || staffName.split(' ')[0] || staffName;
                option.value = userName;
                option.textContent = staffName;
                designerSelect.appendChild(option);
            }
        });
        
        console.log(`採番者 ${data.length} 名を読み込みました`);
    } catch (error) {
        console.error('採番者リストの読み込みエラー:', error);
        designerSelect.innerHTML = '<option value="">読み込みエラー</option>';
    }
}

// 図面一覧を読み込む
async function loadDrawingList() {
    const tbody = document.getElementById('drawing-list-page');
    if (!tbody) return;
    
    try {
        const tableNames = ['t_saiban', 'T_Saiban', 't_Saiban', 'saiban'];
        let data = null;
        
        for (const tableName of tableNames) {
            try {
                const result = await getSupabaseClient()
                    .from(tableName)
                    .select('DrawingNo, Description, SaibanDate, OrderNo')
                    .order('SaibanDate', { ascending: false })
                    .limit(100);
                
                if (!result.error && result.data) {
                    data = result.data;
                    break;
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        <i class="fas fa-inbox" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                        <span style="font-size: 13px;">図面データはありません</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach(drawing => {
            const drawingNo = drawing.DrawingNo || drawing.drawingNo || drawing.drawing_no || '';
            const description = drawing.Description || drawing.description || '';
            const saibanDate = drawing.SaibanDate || drawing.saibanDate || drawing.saiban_date || '';
            const dateStr = saibanDate ? new Date(saibanDate).toLocaleDateString('ja-JP') : '';
            
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.onclick = () => {
                document.getElementById('base-drawing-no-input').value = drawingNo;
            };
            row.innerHTML = `
                <td style="padding: 8px 10px; text-align: center; font-size: 12px; font-family: monospace;">${escapeHtml(drawingNo)}</td>
                <td style="padding: 8px 10px; text-align: left; font-size: 12px;">${escapeHtml(description)}</td>
                <td style="padding: 8px 10px; text-align: center; font-size: 12px;">${escapeHtml(dateStr)}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('図面一覧の読み込みエラー:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: var(--error);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px; opacity: 0.3; display: block;"></i>
                    <span style="font-size: 13px;">読み込みエラー: ${error.message}</span>
                </td>
            </tr>
        `;
    }
}

// 最初の図面番号を自動生成
async function generateFirstDrawingNumber() {
    const drawingType = document.getElementById('drawing-type-select').value;
    const machineCode = document.getElementById('machine-code-input').value.trim().toUpperCase();
    const baseDrawingNoInput = document.getElementById('base-drawing-no-input');
    
    if (!drawingType || !machineCode) {
        showDrawingNumberError('図面種類と機種記号を入力してください');
        return;
    }
    
    try {
        // 既存の図面番号を検索して、次の番号を生成
        const nextDrawingNo = await findNextDrawingNumber(machineCode, drawingType);
        if (nextDrawingNo) {
            baseDrawingNoInput.value = nextDrawingNo;
            showDrawingNumberSuccess(`最初の図面番号を生成しました: ${nextDrawingNo}`);
        } else {
            // 既存の図面がない場合、最初の番号を生成
            const firstDrawingNo = generateInitialDrawingNumber(machineCode, drawingType);
            baseDrawingNoInput.value = firstDrawingNo;
            showDrawingNumberSuccess(`最初の図面番号を生成しました: ${firstDrawingNo}`);
        }
    } catch (error) {
        console.error('図面番号生成エラー:', error);
        showDrawingNumberError('図面番号の生成中にエラーが発生しました: ' + error.message);
    }
}

// 次の図面番号を検索
async function findNextDrawingNumber(machineCode, drawingType) {
    try {
        const tableNames = ['t_saiban', 'T_Saiban', 't_Saiban', 'saiban'];
        let maxDrawingNo = null;
        
        // 図面種類に応じた検索条件
        let typeCondition = '';
        if (drawingType === 'parts') {
            // 部品図: 8桁目または9桁目が /, A, B, N
            typeCondition = `(SUBSTRING(DrawingNo,8,1) IN ('/', 'A', 'B', 'N') OR SUBSTRING(DrawingNo,9,1) IN ('/', 'A', 'B', 'N'))`;
        } else if (drawingType === 'unit') {
            // 組図: 8桁目または9桁目が U, R, L
            typeCondition = `(SUBSTRING(DrawingNo,8,1) IN ('U', 'R', 'L') OR SUBSTRING(DrawingNo,9,1) IN ('U', 'R', 'L'))`;
        }
        
        for (const tableName of tableNames) {
            try {
                // 機種記号で始まる図面番号を検索
                const { data, error } = await getSupabaseClient()
                    .from(tableName)
                    .select('DrawingNo')
                    .like('DrawingNo', `${machineCode}%`)
                    .order('DrawingNo', { ascending: false })
                    .limit(100);
                
                if (!error && data && data.length > 0) {
                    // 図面種類でフィルタリング
                    const filtered = data.filter(d => {
                        const drawingNo = d.DrawingNo || d.drawingNo || d.drawing_no || '';
                        if (drawingNo.length < 9) return false;
                        const char8 = drawingNo.charAt(7).toUpperCase();
                        const char9 = drawingNo.charAt(8).toUpperCase();
                        
                        if (drawingType === 'parts') {
                            return char8 === '/' || char8 === 'A' || char8 === 'B' || char8 === 'N' ||
                                   char9 === '/' || char9 === 'A' || char9 === 'B' || char9 === 'N';
                        } else if (drawingType === 'unit') {
                            return char8 === 'U' || char8 === 'R' || char8 === 'L' ||
                                   char9 === 'U' || char9 === 'R' || char9 === 'L';
                        }
                        return false;
                    });
                    
                    if (filtered.length > 0) {
                        // 最大の図面番号を取得
                        maxDrawingNo = filtered[0].DrawingNo || filtered[0].drawingNo || filtered[0].drawing_no;
                        break;
                    }
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        
        if (maxDrawingNo) {
            // 次の番号を生成（インクリメント）
            return incrementDrawingNumberForGeneration(maxDrawingNo, drawingType);
        }
        
        return null;
    } catch (error) {
        console.error('次の図面番号検索エラー:', error);
        throw error;
    }
}

// 最初の図面番号を生成（既存の図面がない場合）
function generateInitialDrawingNumber(machineCode, drawingType) {
    // 機種記号（2桁）+ サイズ/ユニット（3桁: 001）+ 部品番号（3桁: 001）+ 図面種類（2桁）
    // 例: MU001001/01 (部品図) または MU001001U01 (組図)
    
    const sizeUnit = '001'; // デフォルトのサイズ/ユニット
    const partNo = '001'; // デフォルトの部品番号
    
    let typeSuffix = '';
    if (drawingType === 'parts') {
        typeSuffix = '/01'; // 部品図のデフォルト
    } else if (drawingType === 'unit') {
        typeSuffix = 'U01'; // 組図のデフォルト
    }
    
    return machineCode + sizeUnit + partNo + typeSuffix;
}

// 図面番号をインクリメント（生成用の簡易版）
function incrementDrawingNumberForGeneration(drawingNo, drawingType) {
    if (drawingNo.length < 10) {
        // 10桁未満の場合は最初の番号を生成
        return generateInitialDrawingNumber(drawingNo.substring(0, 2), drawingType);
    }
    
    // 4-6桁目（部品番号部分）をインクリメント
    const partNum = parseInt(drawingNo.substring(3, 6));
    if (!isNaN(partNum)) {
        const newPartNum = partNum + 1;
        if (newPartNum >= 800 && drawingType === 'parts') {
            // 部品図の場合、800に達したら次のサイズ/ユニットに
            const sizeUnit = parseInt(drawingNo.substring(2, 5)) || 1;
            return drawingNo.substring(0, 2) + String(sizeUnit + 1).padStart(3, '0') + '001' + drawingNo.substring(6);
        }
        return drawingNo.substring(0, 3) + String(newPartNum).padStart(3, '0') + drawingNo.substring(6);
    }
    
    // パースできない場合は最初の番号を生成
    return generateInitialDrawingNumber(drawingNo.substring(0, 2), drawingType);
}

// 図面番号採番の実行（VB.NETのロジックを完全再現）
async function getDrawingNumberPage() {
    console.log('図面番号採番を実行します');
    
    // エラーメッセージを非表示
    hideDrawingNumberMessage();
    
    // 必須項目の取得
    const drawingType = document.getElementById('drawing-type-select').value;
    const machineCode = document.getElementById('machine-code-input').value.trim().toUpperCase();
    const orderNo = document.getElementById('order-no-input').value.trim().toUpperCase();
    const designer = document.getElementById('designer-select').value.trim();
    const saibanDate = document.getElementById('saiban-date-input').value;
    let baseDrawingNo = document.getElementById('base-drawing-no-input').value.trim().toUpperCase();
    const drawingCount = parseInt(document.getElementById('drawing-count-input').value) || 1;
    const description = document.getElementById('description-input').value.trim();
    
    // 必須項目チェック（基準図面番号は任意）
    if (!drawingType || !machineCode || !orderNo || !designer || !saibanDate) {
        showDrawingNumberError('すべての必須項目を入力してください');
        return;
    }
    
    // 基準図面番号が入力されていない場合、自動生成
    if (!baseDrawingNo || baseDrawingNo.length < 10) {
        try {
            const generatedNo = await findNextDrawingNumber(machineCode, drawingType);
            if (generatedNo) {
                baseDrawingNo = generatedNo;
                document.getElementById('base-drawing-no-input').value = baseDrawingNo;
            } else {
                baseDrawingNo = generateInitialDrawingNumber(machineCode, drawingType);
                document.getElementById('base-drawing-no-input').value = baseDrawingNo;
            }
        } catch (error) {
            console.error('図面番号自動生成エラー:', error);
            showDrawingNumberError('図面番号の自動生成に失敗しました。基準図面番号を手動で入力してください。');
            return;
        }
    }
    
    // 図面番号の桁数チェック（10桁以上）
    if (baseDrawingNo.length < 10) {
        showDrawingNumberError('図面番号は10桁以上である必要があります');
        return;
    }
    
    // 図面番号の6桁目に「I」や「O」が含まれていないかチェック（VB.NETのTxt_Drawing_Validatedロジック）
    if (baseDrawingNo.length >= 6) {
        const sixthChar = baseDrawingNo.charAt(5).toUpperCase();
        if (sixthChar === 'I' || sixthChar === 'O') {
            showDrawingNumberError('図面番号の6桁目に「I」や「O」は使用できません');
            return;
        }
    }
    
    // 機種記号の存在確認
    try {
        const machineCodeExists = await checkMachineCodeExists(machineCode);
        if (!machineCodeExists) {
            showDrawingNumberError('機種記号がデータベースに存在しません');
            return;
        }
    } catch (error) {
        console.error('機種記号の確認エラー:', error);
        showDrawingNumberError('機種記号の確認中にエラーが発生しました: ' + error.message);
        return;
    }
    
    // 工事番号の確認（最初の4桁が存在し、工事完了でないこと）
    try {
        const orderNoValid = await checkOrderNoValid(orderNo);
        if (!orderNoValid.valid) {
            showDrawingNumberError(orderNoValid.message || '工事番号が無効です');
            return;
        }
    } catch (error) {
        console.error('工事番号の確認エラー:', error);
        showDrawingNumberError('工事番号の確認中にエラーが発生しました: ' + error.message);
        return;
    }
    
    // 図面の種類を判定（8桁目または9桁目）
    const drawingTypeCheck = getDrawingType(baseDrawingNo);
    if (!drawingTypeCheck) {
        showDrawingNumberError('図面番号の8桁目または9桁目が無効です（部品図: /,A,B,N / 組図: U,R,L）');
        return;
    }
    
    // 選択された図面種類と一致するか確認
    if ((drawingType === 'parts' && drawingTypeCheck !== 'parts') || 
        (drawingType === 'unit' && drawingTypeCheck !== 'assembly')) {
        showDrawingNumberError('選択した図面種類と図面番号の種類が一致しません');
        return;
    }
    
    // 基準図面番号の重複チェック
    const isDuplicate = await checkDrawingNoDuplicate(baseDrawingNo);
    if (isDuplicate) {
        showDrawingNumberError('この図面番号は既に使用されています');
        return;
    }
    
    // 連続採番処理（VB.NETのロジックを完全再現）
    try {
        const results = await processDrawingNumberRegistrationVB(
            orderNo,
            machineCode,
            designer,
            saibanDate,
            baseDrawingNo,
            drawingCount,
            drawingTypeCheck,
            description
        );
        
        if (results.success) {
            const resultText = results.drawingNumbers && results.drawingNumbers.length > 0 
                ? results.drawingNumbers.join(', ') 
                : baseDrawingNo;
            document.getElementById('drawing-number-result-page').value = resultText;
            
            const skippedMsg = results.skipped && results.skipped.length > 0 
                ? `（${results.skipped.length}件スキップ: ${results.skipped.join(', ')}）` 
                : '';
            showDrawingNumberSuccess(`図面番号 ${results.count} 件を登録しました${skippedMsg}`);
            
            // 図面一覧を更新
            await loadDrawingList();
        } else {
            showDrawingNumberError(results.message || '図面番号の登録に失敗しました');
        }
    } catch (error) {
        console.error('図面番号登録エラー:', error);
        showDrawingNumberError('図面番号の登録中にエラーが発生しました: ' + error.message);
    }
}

// 機種記号の存在確認
async function checkMachineCodeExists(machineCode) {
    try {
        const tableNames = ['T_MachineMarkForSaiban', 't_machinemarkforsaiban', 'T_MachineCode', 't_machinecode', 't_machine_code', 'MachineCode'];
        for (const tableName of tableNames) {
            try {
                const { data, error } = await getSupabaseClient()
                    .from(tableName)
                    .select('*')
                    .or(`MachineMark.eq.${machineCode},machineMark.eq.${machineCode},machine_mark.eq.${machineCode},MachineCode.eq.${machineCode},machineCode.eq.${machineCode}`)
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    return true;
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        return false;
    } catch (error) {
        console.error('機種記号確認エラー:', error);
        return false;
    }
}

// 工事番号の有効性確認（VB.NETのSqlAcceptOrderロジック）
async function checkOrderNoValid(orderNo) {
    if (!orderNo || orderNo.length < 4) {
        return { valid: false, message: '工事番号が短すぎます' };
    }
    
    const first4Digits = orderNo.substring(0, 4);
    
    try {
        const tableNames = ['T_AcceptOrder', 't_acceptorder', 't_accept_order', 'AcceptOrder', 'orders'];
        for (const tableName of tableNames) {
            try {
                // VB.NET: WHERE ConstructNo='...' AND FinishedDate IS NULL
                const { data, error } = await getSupabaseClient()
                    .from(tableName)
                    .select('*')
                    .or(`ConstructNo.like.${first4Digits}%,constructNo.like.${first4Digits}%,OrderNo.like.${first4Digits}%,orderNo.like.${first4Digits}%`)
                    .is('FinishedDate', null)
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    const order = data[0];
                    const cancelFlg = order.CancelFlg || order.cancelFlg || order.cancel_flg;
                    
                    if (cancelFlg === true || cancelFlg === 1) {
                        return { valid: false, message: 'この工事はキャンセルされています' };
                    }
                    return { valid: true, registerDate: order.RegisterDate || order.registerDate || order.register_date };
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        // テーブルが存在しない場合は警告のみ（開発中は許可）
        console.warn('工事番号テーブルが見つかりません。検証をスキップします。');
        return { valid: true };
    } catch (error) {
        console.error('工事番号確認エラー:', error);
        return { valid: false, message: '工事番号の確認中にエラーが発生しました' };
    }
}

// 図面の種類を判定（VB.NETのロジック）
function getDrawingType(drawingNo) {
    if (drawingNo.length < 9) return null;
    
    const char8 = drawingNo.charAt(7).toUpperCase();
    const char9 = drawingNo.charAt(8).toUpperCase();
    
    // 部品図: /, A, B, N
    if (char8 === '/' || char8 === 'A' || char8 === 'B' || char8 === 'N') {
        return 'parts';
    }
    if (char9 === '/' || char9 === 'A' || char9 === 'B' || char9 === 'N') {
        return 'parts';
    }
    
    // 組図/ユニット図: U, R, L
    if (char8 === 'U' || char8 === 'R' || char8 === 'L') {
        return 'assembly';
    }
    if (char9 === 'U' || char9 === 'R' || char9 === 'L') {
        return 'assembly';
    }
    
    return null;
}

// VB.NETのFrm_PartsSaiban.Btn_Find_Clickロジックを完全再現
async function processDrawingNumberRegistrationVB(orderNo, machineCode, designer, saibanDate, baseDrawingNo, count, drawingType, description) {
    const drawingNumbers = [];
    const skipped = [];
    let successCount = 0;
    let prevDrawing = baseDrawingNo;
    
    // 工事番号からRegisterDateを取得（KeyDateとして使用）
    const orderInfo = await checkOrderNoValid(orderNo);
    const keyDate = orderInfo.registerDate || new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < count; i++) {
        let newDrawing = '';
        
        // VB.NETのロジック: If IsNumeric(PrevDrawing.Substring(5, 1)) = False Then
        const char5 = prevDrawing.charAt(4); // 5桁目（0-indexedなので4）
        const isNumericChar5 = /[0-9]/.test(char5);
        
        if (!isNumericChar5) {
            // 5桁目が数字でない場合（文字の場合）
            // VB.NET: If CInt(TxtDrawing.Substring(6, 1)) + i >= 10 Then
            const char6 = parseInt(prevDrawing.charAt(5)); // 6桁目
            if (!isNaN(char6) && char6 + i >= 10) {
                // 繰り上がり処理
                let currentChr = String.fromCharCode(prevDrawing.charCodeAt(4) + Math.floor((char6 + i) / 10));
                let kuriageFlg = false;
                
                if (currentChr === '[') {
                    currentChr = 'A';
                    kuriageFlg = true;
                } else if (currentChr === 'O') {
                    currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                } else if (currentChr === 'I') {
                    currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                }
                
                const amari = (char6 + i) % 10;
                
                if (kuriageFlg) {
                    const char4 = parseInt(prevDrawing.charAt(3));
                    newDrawing = prevDrawing.substring(0, 3) + (char4 + 1).toString() + currentChr + amari.toString() + prevDrawing.substring(7);
                } else {
                    newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                }
            } else {
                // 通常のインクリメント
                newDrawing = prevDrawing.substring(0, 6) + (char6 + i).toString() + prevDrawing.substring(7);
            }
        } else {
            // 5桁目が数字の場合
            // VB.NET: If CInt(TxtDrawing.Substring(4, 3)) + i >= 1000 Then
            const partNum = parseInt(prevDrawing.substring(3, 6)); // 4-6桁目（3桁の数値）
            
            if (partNum + i >= 1000) {
                // 1000に達した場合の処理
                let currentChr = '';
                let kuriageFlg = false;
                
                if (/[0-9]/.test(prevDrawing.charAt(4))) {
                    // 5桁目が数字の場合
                    currentChr = 'A';
                    const amari = (parseInt(prevDrawing.charAt(5)) + i) % 10;
                    if (prevDrawing.charAt(3) === '9') {
                        newDrawing = prevDrawing.substring(0, 3) + '1' + currentChr + amari.toString() + prevDrawing.substring(7);
                    } else {
                        newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                    }
                } else {
                    // 5桁目が文字の場合
                    if (prevDrawing.charAt(5) === '9') {
                        currentChr = String.fromCharCode(prevDrawing.charCodeAt(4) + 1);
                    } else {
                        currentChr = prevDrawing.charAt(4);
                    }
                    
                    if (currentChr === '[') {
                        currentChr = 'A';
                        kuriageFlg = true;
                    } else if (currentChr === 'O') {
                        currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                    } else if (currentChr === 'I') {
                        currentChr = String.fromCharCode(currentChr.charCodeAt(0) + 1);
                    }
                    
                    const amari = (parseInt(prevDrawing.charAt(5)) + i) % 10;
                    if (kuriageFlg) {
                        const char4 = parseInt(prevDrawing.charAt(3));
                        newDrawing = prevDrawing.substring(0, 3) + (char4 + 1).toString() + currentChr + amari.toString() + prevDrawing.substring(7);
                    } else {
                        newDrawing = prevDrawing.substring(0, 5) + currentChr + amari.toString() + prevDrawing.substring(7);
                    }
                }
            } else if (partNum + i === 800 && drawingType === 'parts') {
                // 部品図の場合、800に達したらループを抜ける
                break;
            } else {
                // 通常のインクリメント（3桁の数値として）
                const newPartNum = partNum + i;
                newDrawing = prevDrawing.substring(0, 3) + newPartNum.toString().padStart(3, '0') + prevDrawing.substring(6);
            }
        }
        
        // 重複チェック
        const isDuplicate = await checkDrawingNoDuplicate(newDrawing);
        if (isDuplicate) {
            console.warn(`図面番号 ${newDrawing} は既に使用されています`);
            skipped.push(newDrawing);
            continue;
        }
        
        // 図面データの登録
        try {
            const saibanDateISO = new Date(saibanDate).toISOString();
            
            const drawingData = {
                DrawingNo: newDrawing,
                Description: description || null,
                OrderNo: orderNo,
                Material: null,
                MaterialWeight: null,
                FinishedWeight: null,
                Designer: designer,
                SaibanDate: saibanDateISO,
                KeyDate: keyDate,
                History1: null,
                History2: null,
                History3: null,
                History4: null,
                History5: null,
                History6: null,
                History7: null,
                History8: null,
                History9: null,
                History10: null
            };
            
            // t_saibanテーブルに登録
            const tableNames = ['t_saiban', 'T_Saiban', 't_Saiban', 'saiban'];
            let registered = false;
            
            for (const tableName of tableNames) {
                try {
                    const { error } = await getSupabaseClient()
                        .from(tableName)
                        .insert([drawingData]);
                    
                    if (!error) {
                        registered = true;
                        successCount++;
                        drawingNumbers.push(newDrawing);
                        prevDrawing = newDrawing; // 次のループ用に更新
                        break;
                    } else {
                        console.error(`テーブル ${tableName} への登録エラー:`, error);
                    }
                } catch (e) {
                    console.error(`テーブル ${tableName} への登録例外:`, e);
                }
            }
            
            if (!registered) {
                skipped.push(newDrawing);
            }
        } catch (error) {
            console.error(`図面番号 ${newDrawing} の登録エラー:`, error);
            skipped.push(newDrawing);
        }
    }
    
    return {
        success: successCount > 0,
        count: successCount,
        drawingNumbers: drawingNumbers,
        skipped: skipped,
        message: successCount === count ? 'すべての図面番号を登録しました' : `${successCount}件の図面番号を登録しました（${count - successCount}件失敗）`
    };
}

// 図面番号の重複チェック
async function checkDrawingNoDuplicate(drawingNo) {
    try {
        const tableNames = ['t_saiban', 'T_Saiban', 't_Saiban', 'saiban'];
        for (const tableName of tableNames) {
            try {
                const { data, error } = await getSupabaseClient()
                    .from(tableName)
                    .select('DrawingNo')
                    .eq('DrawingNo', drawingNo)
                    .limit(1);
                
                if (!error && data && data.length > 0) {
                    return true; // 重複あり
                }
            } catch (e) {
                // 次のテーブルを試す
            }
        }
        return false; // 重複なし
    } catch (error) {
        console.error('図面番号重複チェックエラー:', error);
        throw error;
    }
}

// コピー機能
function copyDrawingNumberPage() {
    const resultInput = document.getElementById('drawing-number-result-page');
    if (resultInput && resultInput.value) {
        resultInput.select();
        document.execCommand('copy');
        showMessage('図面番号をクリップボードにコピーしました', 'success');
    }
}

// エラーメッセージ表示
function showDrawingNumberError(message) {
    const errorDiv = document.getElementById('drawing-number-errors-page');
    const errorMessage = document.getElementById('drawing-number-error-message-page');
    const successDiv = document.getElementById('drawing-number-success-page');
    
    if (errorDiv && errorMessage) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'block';
        if (successDiv) successDiv.style.display = 'none';
        
        // スクロールしてエラーメッセージを表示
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 成功メッセージ表示
function showDrawingNumberSuccess(message) {
    const successDiv = document.getElementById('drawing-number-success-page');
    const successMessage = document.getElementById('drawing-number-success-message-page');
    const errorDiv = document.getElementById('drawing-number-errors-page');
    
    if (successDiv && successMessage) {
        successMessage.textContent = message;
        successDiv.style.display = 'block';
        if (errorDiv) errorDiv.style.display = 'none';
        
        // スクロールして成功メッセージを表示
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// メッセージ非表示
function hideDrawingNumberMessage() {
    const errorDiv = document.getElementById('drawing-number-errors-page');
    const successDiv = document.getElementById('drawing-number-success-page');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

// エスケープ関数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// グローバルに公開
window.initializeDrawingNumberPage = initializeDrawingNumberPage;
window.getDrawingNumberPage = getDrawingNumberPage;
window.copyDrawingNumberPage = copyDrawingNumberPage;
window.loadDrawingList = loadDrawingList;
window.generateFirstDrawingNumber = generateFirstDrawingNumber;
