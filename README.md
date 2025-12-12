# データベース管理アプリ

Supabaseデータベースを管理するためのWebアプリケーションです。

## 特徴

- 📊 ダッシュボードでデータベースの概要を確認
- 📋 テーブルデータの閲覧・検索
- ➕ 新しいレコードの追加
- 🔍 高度な検索・フィルタリング機能
- 🎨 モダンで使いやすいUI

## 使い方

### 1. セットアップ

1. このリポジトリをクローンまたはダウンロードします
2. `config.js`ファイルを開き、Supabaseの接続情報を設定します：

```javascript
const SUPABASE_CONFIG = {
    url: "あなたのSupabase URL",
    key: "あなたのSupabase API Key"
};
```

### 2. 実行方法

#### 方法1: Live Server拡張機能を使う（最も簡単・推奨）⭐

**Cursor / VS Codeの場合:**

1. Cursor（またはVS Code）でこのプロジェクトフォルダを開きます
2. **拡張機能から「Live Server」をインストール**（まだの場合）
   - 拡張機能アイコン（左サイドバー）をクリック、または `Ctrl+Shift+X`（Mac: `Cmd+Shift+X`）
   - 検索ボックスに「**Live Server**」と入力
   - 「**Live Server**」（作者: Ritwick Dey）をインストール
   - インストール後、Cursorを再起動する場合があります
3. `index.html`を開きます
4. **起動方法（いずれか）:**
   - **方法A**: 画面右下のステータスバーに「**Go Live**」ボタンが表示されるのでクリック
   - **方法B**: `index.html`を右クリック → 「**Open with Live Server**」を選択
   - **方法C**: `Ctrl+Shift+P`（Mac: `Cmd+Shift+P`）でコマンドパレットを開く → 「**Live Server: Open with Live Server**」と入力して実行
5. ブラウザが自動で開き、アプリが表示されます（通常は `http://127.0.0.1:5500`）

**Go Liveボタンが表示されない場合:**
- 拡張機能が正しくインストールされているか確認
- Cursorを再起動してみてください
- コマンドパレット（`Ctrl+Shift+P`）から「Live Server」で検索して実行してみてください

#### 方法2: ローカルで直接開く

`index.html`をブラウザで直接開きます。

⚠️ **注意**: この方法では、一部の機能（特に外部APIへのアクセス）が制限される場合があります。

#### 方法3: Pythonのローカルサーバーで実行

Pythonがインストールされている場合：

```bash
# Python 3の場合
python -m http.server 8000

# または
python3 -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` にアクセスします。

#### 方法4: GitHub Pagesで公開

1. GitHubリポジトリにプッシュします
2. リポジトリの設定 > Pages から、GitHub Pagesを有効にします
3. 公開されたURLにアクセスします

**注意**: GitHub Pagesで公開する場合、`config.js`にSupabaseの接続情報が含まれるため、公開リポジトリの場合は注意が必要です。

## ファイル構成

```
supabase-data-viewer/
├── index.html      # メインのHTMLファイル
├── app.js          # アプリケーションのロジック
├── config.js       # Supabase接続設定
├── style.css       # スタイルシート
└── README.md       # このファイル
```

## 機能説明

### ダッシュボード

- 総レコード数、テーブル数、最終更新日時を表示
- テーブル一覧をカード形式で表示
- テーブルをクリックしてデータ管理ページに移動

### データ管理

- **テーブル選択**: 操作するテーブルを選択
- **データ追加**: 新しいレコードを追加
- **検索**: カラムを指定してデータを検索
- **データ表示**: テーブル形式でデータを表示

## 技術スタック

- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Supabase JavaScript SDK

## 注意事項

- このアプリはSupabaseの匿名キー（anon key）を使用します
- セキュリティのため、本番環境ではRow Level Security (RLS)の設定を推奨します
- `config.js`には機密情報が含まれるため、公開リポジトリにコミットしないよう注意してください

## トラブルシューティング

### テーブルが表示されない

- Supabaseの接続情報（URL、API Key）が正しいか確認してください
- ブラウザのコンソールでエラーメッセージを確認してください

### データが取得できない

- Supabaseのテーブルにデータが存在するか確認してください
- RLS（Row Level Security）が有効な場合、適切な権限が設定されているか確認してください

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

