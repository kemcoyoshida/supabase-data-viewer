// サーバーの状態を確認するスクリプト
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('=== HTTPSサーバー状態確認 ===\n');

// Node.jsのバージョン確認
console.log('Node.jsバージョン:', process.version);

// 証明書の確認
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

console.log('\n証明書ディレクトリ:', certDir);
console.log('存在:', fs.existsSync(certDir));

if (fs.existsSync(keyPath)) {
    const key = fs.readFileSync(keyPath);
    console.log('✅ キーファイル:', keyPath, `(${key.length} bytes)`);
} else {
    console.log('❌ キーファイルが見つかりません:', keyPath);
}

if (fs.existsSync(certPath)) {
    const cert = fs.readFileSync(certPath);
    console.log('✅ 証明書ファイル:', certPath, `(${cert.length} bytes)`);
} else {
    console.log('❌ 証明書ファイルが見つかりません:', certPath);
}

// 証明書の内容を確認
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
        const key = fs.readFileSync(keyPath);
        const cert = fs.readFileSync(certPath);
        
        // 証明書が有効かテスト
        const options = { key, cert };
        const testServer = https.createServer(options, () => {});
        
        testServer.on('error', (err) => {
            console.log('\n❌ 証明書のテストに失敗:', err.message);
        });
        
        testServer.listen(0, () => {
            const port = testServer.address().port;
            console.log('\n✅ 証明書は有効です（テストポート:', port, '）');
            testServer.close();
            
            // 実際のサーバーを起動
            console.log('\n=== サーバーを起動します ===\n');
            startServer(options);
        });
        
    } catch (error) {
        console.log('\n❌ 証明書の読み込みエラー:', error.message);
    }
} else {
    console.log('\n証明書を生成します...');
    generateCert();
}

function generateCert() {
    try {
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true });
        }
        
        const selfsigned = require('selfsigned');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = selfsigned.generate(attrs, {
            keySize: 2048,
            days: 365,
            algorithm: 'sha256'
        });
        
        fs.writeFileSync(keyPath, pems.private);
        fs.writeFileSync(certPath, pems.cert);
        console.log('✅ 証明書を生成しました');
        
        const options = { key: pems.private, cert: pems.cert };
        startServer(options);
    } catch (error) {
        console.error('❌ 証明書生成エラー:', error.message);
        process.exit(1);
    }
}

function startServer(options) {
    const PORT = 5500;
    
    const server = https.createServer(options, (req, res) => {
        const filePath = req.url === '/' ? 'index.html' : req.url.substring(1);
        const fullPath = path.join(__dirname, filePath);
        
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath).toLowerCase();
            const contentTypes = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript',
                '.css': 'text/css'
            };
            const contentType = contentTypes[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fs.readFileSync(fullPath));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ ポート ${PORT} は既に使用されています`);
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
        console.log('========================================');
        console.log('');
        console.log('⚠️  自己署名証明書を使用しています。');
        console.log('   ブラウザで警告が表示されたら:');
        console.log('   Chrome/Edge: 「詳細設定」→「localhost にアクセスする（安全ではありません）」');
        console.log('   Firefox: 「詳細情報」→「リスクを承知して続行」');
        console.log('');
        console.log('停止するには Ctrl+C を押してください');
        console.log('');
    });
}

