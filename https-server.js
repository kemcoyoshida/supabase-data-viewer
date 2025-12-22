// HTTPSサーバー（テスト用）
const https = require('https');
const fs = require('fs');
const path = require('path');

// 自己署名証明書の生成（初回のみ）
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

// certsディレクトリが存在しない場合は作成
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
}

// 証明書が存在しない場合は生成
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('自己署名証明書を生成しています...');
    
    try {
        // selfsignedパッケージを使用して証明書を生成（OpenSSL不要）
        const selfsigned = require('selfsigned');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = selfsigned.generate(attrs, {
            keySize: 2048,
            days: 365,
            algorithm: 'sha256'
        });
        
        // 証明書とキーをファイルに保存
        fs.writeFileSync(keyPath, pems.private);
        fs.writeFileSync(certPath, pems.cert);
        console.log('✅ 証明書の生成が完了しました。');
        console.log(`   証明書: ${certPath}`);
        console.log(`   キー: ${keyPath}`);
    } catch (error) {
        console.error('❌ selfsignedでの証明書生成に失敗しました:', error.message);
        console.error('');
        // selfsignedが失敗した場合、OpenSSLを試す
        console.log('OpenSSLを試します...');
        const { execSync } = require('child_process');
        try {
            execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Test/CN=localhost"`, {
                stdio: 'inherit',
                cwd: __dirname,
                shell: true
            });
            console.log('✅ 証明書の生成が完了しました。');
        } catch (opensslError) {
            console.error('❌ OpenSSLでの証明書生成も失敗しました。');
            console.error('');
            console.error('以下のいずれかの方法で証明書を生成してください:');
            console.error('');
            console.error('方法1: npmパッケージを再インストール');
            console.error('  npm install --save-dev selfsigned');
            console.error('');
            console.error('方法2: スクリプトを実行');
            console.error('  Windows: generate-cert.bat');
            console.error('  PowerShell: .\\generate-cert.ps1');
            process.exit(1);
        }
    }
}

// 証明書とキーを読み込む
let options;
try {
    console.log('証明書とキーを読み込んでいます...');
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    console.log(`✅ キーを読み込みました (${key.length} bytes)`);
    console.log(`✅ 証明書を読み込みました (${cert.length} bytes)`);
    
    options = {
        key: key,
        cert: cert
    };
} catch (error) {
    console.error('❌ 証明書の読み込みに失敗しました:', error.message);
    console.error('');
    console.error('証明書を生成してください:');
    console.error('  Windows: generate-cert.bat');
    console.error('  PowerShell: .\\generate-cert.ps1');
    process.exit(1);
}

// ポート番号
const PORT = 5500;

// 静的ファイルを配信する関数
function serveFile(filePath, res) {
    const fullPath = path.join(__dirname, filePath === '/' ? 'index.html' : filePath);
    
    // セキュリティチェック（ディレクトリトラバーサル対策）
    if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // ファイルが存在するか確認
    if (!fs.existsSync(fullPath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('File not found: ' + filePath);
        return;
    }
    
    // ディレクトリの場合はindex.htmlを返す
    if (fs.statSync(fullPath).isDirectory()) {
        const indexPath = path.join(fullPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            serveFile('/index.html', res);
            return;
        }
    }
    
    fs.readFile(fullPath, (err, data) => {
        if (err) {
            console.error('ファイル読み込みエラー:', err.message);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal Server Error');
            return;
        }
        
        // ファイル拡張子に応じてContent-Typeを設定
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf'
        };
        
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// HTTPSサーバーを作成
const server = https.createServer(options, (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    
    // CORSヘッダーを追加
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        serveFile(url.pathname, res);
    } catch (error) {
        console.error('URL解析エラー:', error.message);
        res.writeHead(400);
        res.end('Bad Request');
    }
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ ポート ${PORT} は既に使用されています。`);
        console.error('別のポートを使用するか、既存のサーバーを停止してください。');
    } else {
        console.error('❌ サーバーエラー:', error.message);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log(`✅ HTTPSサーバーが起動しました！`);
    console.log(`URL: https://localhost:${PORT}`);
    console.log('');
    console.log('⚠️  自己署名証明書を使用しています。');
    console.log('   ブラウザで警告が表示されたら:');
    console.log('   Chrome/Edge: 「詳細設定」→「localhost にアクセスする（安全ではありません）」');
    console.log('   Firefox: 「詳細情報」→「リスクを承知して続行」');
    console.log('========================================');
    console.log('');
    console.log('停止するには Ctrl+C を押してください');
    console.log('');
});


