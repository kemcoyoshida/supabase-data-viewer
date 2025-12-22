-- Supabase 図面番号採番システム用テーブル定義
-- VB.NETのMod_StructureとMod_SQLに基づく

-- 1. T_Saiban テーブル（図面番号採番テーブル）
CREATE TABLE IF NOT EXISTS t_saiban (
    id BIGSERIAL PRIMARY KEY,
    DrawingNo VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT,
    OrderNo VARCHAR(50),
    Material VARCHAR(100),
    MaterialWeight DECIMAL(18, 2),
    FinishedWeight DECIMAL(18, 2),
    History1 TEXT,
    History2 TEXT,
    History3 TEXT,
    History4 TEXT,
    History5 TEXT,
    History6 TEXT,
    History7 TEXT,
    History8 TEXT,
    History9 TEXT,
    History10 TEXT,
    Designer VARCHAR(100),
    SaibanDate TIMESTAMP WITH TIME ZONE,
    KeyDate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_saiban_drawingno ON t_saiban(DrawingNo);
CREATE INDEX IF NOT EXISTS idx_t_saiban_orderno ON t_saiban(OrderNo);
CREATE INDEX IF NOT EXISTS idx_t_saiban_saibandate ON t_saiban(SaibanDate);
CREATE INDEX IF NOT EXISTS idx_t_saiban_designer ON t_saiban(Designer);

-- 2. T_MachineMarkForSaiban テーブル（機種記号管理）
CREATE TABLE IF NOT EXISTS t_machinemarkforsaiban (
    id BIGSERIAL PRIMARY KEY,
    MachineMark VARCHAR(50) NOT NULL UNIQUE,
    MachineName VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_machinemarkforsaiban_machinemark ON t_machinemarkforsaiban(MachineMark);

-- 3. T_ComputerDevice テーブル（コンピュータデバイス情報）
CREATE TABLE IF NOT EXISTS t_computerdevice (
    id BIGSERIAL PRIMARY KEY,
    TcpIp VARCHAR(50),
    StaffCode VARCHAR(50),
    StaffName VARCHAR(100),
    DepaCode VARCHAR(50),
    WorkDepa VARCHAR(100),
    LoginID VARCHAR(100) NOT NULL UNIQUE,
    LoginPassword VARCHAR(100),
    SQLusername VARCHAR(100),
    SQLusergroup VARCHAR(100),
    TelNo VARCHAR(50),
    FaxNo VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_computerdevice_loginid ON t_computerdevice(LoginID);
CREATE INDEX IF NOT EXISTS idx_t_computerdevice_staffcode ON t_computerdevice(StaffCode);

-- 4. T_AcceptOrder テーブル（受注情報）
CREATE TABLE IF NOT EXISTS t_acceptorder (
    id BIGSERIAL PRIMARY KEY,
    ConstructNo VARCHAR(50) NOT NULL,
    CancelFlg BOOLEAN DEFAULT FALSE,
    EigyoManno VARCHAR(50),
    ConstructName VARCHAR(200),
    Qty INTEGER,
    QtyUnit VARCHAR(50),
    OwnerCode VARCHAR(50),
    UserCode VARCHAR(50),
    OrderPerson VARCHAR(100),
    OrderSection VARCHAR(100),
    OrderNumber VARCHAR(50),
    OrderPrice DECIMAL(18, 2),
    OrderDate DATE,
    DeliveryDate DATE,
    PayTerm INTEGER,
    CmspTax DECIMAL(18, 2),
    Urikake DECIMAL(18, 2),
    Currency VARCHAR(10),
    ForgnMoney DECIMAL(18, 2),
    FinishedDate DATE,
    RegisterDate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_constructno ON t_acceptorder(ConstructNo);
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_finisheddate ON t_acceptorder(FinishedDate);
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_registerdate ON t_acceptorder(RegisterDate);

-- 5. T_StaffCode テーブル（スタッフコード管理）
CREATE TABLE IF NOT EXISTS t_staffcode (
    id BIGSERIAL PRIMARY KEY,
    StaffCode VARCHAR(50) NOT NULL,
    StaffName VARCHAR(100) NOT NULL,
    LoginID VARCHAR(100),
    DepaCode VARCHAR(50),
    OldDepaCode VARCHAR(50),
    SQLusergroup VARCHAR(100),
    StaffCross INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_staffcode_staffcode ON t_staffcode(StaffCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_olddepacode ON t_staffcode(OldDepaCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_depacode ON t_staffcode(DepaCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_staffcross ON t_staffcode(StaffCross);

-- RLS (Row Level Security) ポリシーの設定（必要に応じて）
-- 全ユーザーが読み書き可能にする場合
ALTER TABLE t_saiban ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_machinemarkforsaiban ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_computerdevice ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_acceptorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_staffcode ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み書き可能なポリシー（開発用・本番環境では適切に制限してください）
CREATE POLICY "Allow all operations on t_saiban" ON t_saiban FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_machinemarkforsaiban" ON t_machinemarkforsaiban FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_computerdevice" ON t_computerdevice FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_acceptorder" ON t_acceptorder FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_staffcode" ON t_staffcode FOR ALL USING (true) WITH CHECK (true);

-- コメント追加
COMMENT ON TABLE t_saiban IS '図面番号採番テーブル';
COMMENT ON COLUMN t_saiban.DrawingNo IS '図面番号';
COMMENT ON COLUMN t_saiban.Description IS '品名';
COMMENT ON COLUMN t_saiban.OrderNo IS '工事番号';
COMMENT ON COLUMN t_saiban.Material IS '材質';
COMMENT ON COLUMN t_saiban.MaterialWeight IS '素材重量';
COMMENT ON COLUMN t_saiban.FinishedWeight IS '仕上重量';
COMMENT ON COLUMN t_saiban.Designer IS '採番者';
COMMENT ON COLUMN t_saiban.SaibanDate IS '採番日時';
COMMENT ON COLUMN t_saiban.KeyDate IS 'キー日付（受注データの登録日など）';

COMMENT ON TABLE t_machinemarkforsaiban IS '機種記号管理テーブル';
COMMENT ON COLUMN t_machinemarkforsaiban.MachineMark IS '機種記号';
COMMENT ON COLUMN t_machinemarkforsaiban.MachineName IS '機種名';

COMMENT ON TABLE t_computerdevice IS 'コンピュータデバイス情報テーブル';
COMMENT ON COLUMN t_computerdevice.LoginID IS 'ログインID（マシン名）';

COMMENT ON TABLE t_acceptorder IS '受注情報テーブル';
COMMENT ON COLUMN t_acceptorder.ConstructNo IS '工事番号';
COMMENT ON COLUMN t_acceptorder.FinishedDate IS '工事完了日';

COMMENT ON TABLE t_staffcode IS 'スタッフコード管理テーブル';
COMMENT ON COLUMN t_staffcode.OldDepaCode IS '旧部署コード（325または320が採番者）';
COMMENT ON COLUMN t_staffcode.StaffCross IS 'スタッフクロス（0のみ採番可能）';

-- VB.NETのMod_StructureとMod_SQLに基づく

-- 1. T_Saiban テーブル（図面番号採番テーブル）
CREATE TABLE IF NOT EXISTS t_saiban (
    id BIGSERIAL PRIMARY KEY,
    DrawingNo VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT,
    OrderNo VARCHAR(50),
    Material VARCHAR(100),
    MaterialWeight DECIMAL(18, 2),
    FinishedWeight DECIMAL(18, 2),
    History1 TEXT,
    History2 TEXT,
    History3 TEXT,
    History4 TEXT,
    History5 TEXT,
    History6 TEXT,
    History7 TEXT,
    History8 TEXT,
    History9 TEXT,
    History10 TEXT,
    Designer VARCHAR(100),
    SaibanDate TIMESTAMP WITH TIME ZONE,
    KeyDate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_saiban_drawingno ON t_saiban(DrawingNo);
CREATE INDEX IF NOT EXISTS idx_t_saiban_orderno ON t_saiban(OrderNo);
CREATE INDEX IF NOT EXISTS idx_t_saiban_saibandate ON t_saiban(SaibanDate);
CREATE INDEX IF NOT EXISTS idx_t_saiban_designer ON t_saiban(Designer);

-- 2. T_MachineMarkForSaiban テーブル（機種記号管理）
CREATE TABLE IF NOT EXISTS t_machinemarkforsaiban (
    id BIGSERIAL PRIMARY KEY,
    MachineMark VARCHAR(50) NOT NULL UNIQUE,
    MachineName VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_machinemarkforsaiban_machinemark ON t_machinemarkforsaiban(MachineMark);

-- 3. T_ComputerDevice テーブル（コンピュータデバイス情報）
CREATE TABLE IF NOT EXISTS t_computerdevice (
    id BIGSERIAL PRIMARY KEY,
    TcpIp VARCHAR(50),
    StaffCode VARCHAR(50),
    StaffName VARCHAR(100),
    DepaCode VARCHAR(50),
    WorkDepa VARCHAR(100),
    LoginID VARCHAR(100) NOT NULL UNIQUE,
    LoginPassword VARCHAR(100),
    SQLusername VARCHAR(100),
    SQLusergroup VARCHAR(100),
    TelNo VARCHAR(50),
    FaxNo VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_computerdevice_loginid ON t_computerdevice(LoginID);
CREATE INDEX IF NOT EXISTS idx_t_computerdevice_staffcode ON t_computerdevice(StaffCode);

-- 4. T_AcceptOrder テーブル（受注情報）
CREATE TABLE IF NOT EXISTS t_acceptorder (
    id BIGSERIAL PRIMARY KEY,
    ConstructNo VARCHAR(50) NOT NULL,
    CancelFlg BOOLEAN DEFAULT FALSE,
    EigyoManno VARCHAR(50),
    ConstructName VARCHAR(200),
    Qty INTEGER,
    QtyUnit VARCHAR(50),
    OwnerCode VARCHAR(50),
    UserCode VARCHAR(50),
    OrderPerson VARCHAR(100),
    OrderSection VARCHAR(100),
    OrderNumber VARCHAR(50),
    OrderPrice DECIMAL(18, 2),
    OrderDate DATE,
    DeliveryDate DATE,
    PayTerm INTEGER,
    CmspTax DECIMAL(18, 2),
    Urikake DECIMAL(18, 2),
    Currency VARCHAR(10),
    ForgnMoney DECIMAL(18, 2),
    FinishedDate DATE,
    RegisterDate DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_constructno ON t_acceptorder(ConstructNo);
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_finisheddate ON t_acceptorder(FinishedDate);
CREATE INDEX IF NOT EXISTS idx_t_acceptorder_registerdate ON t_acceptorder(RegisterDate);

-- 5. T_StaffCode テーブル（スタッフコード管理）
CREATE TABLE IF NOT EXISTS t_staffcode (
    id BIGSERIAL PRIMARY KEY,
    StaffCode VARCHAR(50) NOT NULL,
    StaffName VARCHAR(100) NOT NULL,
    LoginID VARCHAR(100),
    DepaCode VARCHAR(50),
    OldDepaCode VARCHAR(50),
    SQLusergroup VARCHAR(100),
    StaffCross INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_t_staffcode_staffcode ON t_staffcode(StaffCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_olddepacode ON t_staffcode(OldDepaCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_depacode ON t_staffcode(DepaCode);
CREATE INDEX IF NOT EXISTS idx_t_staffcode_staffcross ON t_staffcode(StaffCross);

-- RLS (Row Level Security) ポリシーの設定（必要に応じて）
-- 全ユーザーが読み書き可能にする場合
ALTER TABLE t_saiban ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_machinemarkforsaiban ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_computerdevice ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_acceptorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_staffcode ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み書き可能なポリシー（開発用・本番環境では適切に制限してください）
CREATE POLICY "Allow all operations on t_saiban" ON t_saiban FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_machinemarkforsaiban" ON t_machinemarkforsaiban FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_computerdevice" ON t_computerdevice FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_acceptorder" ON t_acceptorder FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on t_staffcode" ON t_staffcode FOR ALL USING (true) WITH CHECK (true);

-- コメント追加
COMMENT ON TABLE t_saiban IS '図面番号採番テーブル';
COMMENT ON COLUMN t_saiban.DrawingNo IS '図面番号';
COMMENT ON COLUMN t_saiban.Description IS '品名';
COMMENT ON COLUMN t_saiban.OrderNo IS '工事番号';
COMMENT ON COLUMN t_saiban.Material IS '材質';
COMMENT ON COLUMN t_saiban.MaterialWeight IS '素材重量';
COMMENT ON COLUMN t_saiban.FinishedWeight IS '仕上重量';
COMMENT ON COLUMN t_saiban.Designer IS '採番者';
COMMENT ON COLUMN t_saiban.SaibanDate IS '採番日時';
COMMENT ON COLUMN t_saiban.KeyDate IS 'キー日付（受注データの登録日など）';

COMMENT ON TABLE t_machinemarkforsaiban IS '機種記号管理テーブル';
COMMENT ON COLUMN t_machinemarkforsaiban.MachineMark IS '機種記号';
COMMENT ON COLUMN t_machinemarkforsaiban.MachineName IS '機種名';

COMMENT ON TABLE t_computerdevice IS 'コンピュータデバイス情報テーブル';
COMMENT ON COLUMN t_computerdevice.LoginID IS 'ログインID（マシン名）';

COMMENT ON TABLE t_acceptorder IS '受注情報テーブル';
COMMENT ON COLUMN t_acceptorder.ConstructNo IS '工事番号';
COMMENT ON COLUMN t_acceptorder.FinishedDate IS '工事完了日';

COMMENT ON TABLE t_staffcode IS 'スタッフコード管理テーブル';
COMMENT ON COLUMN t_staffcode.OldDepaCode IS '旧部署コード（325または320が採番者）';
COMMENT ON COLUMN t_staffcode.StaffCross IS 'スタッフクロス（0のみ採番可能）';


