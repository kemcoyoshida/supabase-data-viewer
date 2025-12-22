// テスト用: 証明書生成とサーバー起動を確認
const https = require('https');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

console.log('証明書ディレクトリ:', certDir);
console.log('キーパス:', keyPath);
console.log('証明書パス:', certPath);
console.log('');

// certsディレクトリが存在しない場合は作成
if (!fs.existsSync(certDir)) {
    console.log('certsディレクトリを作成しています...');
    fs.mkdirSync(certDir, { recursive: true });
    console.log('✅ certsディレクトリを作成しました');
}

// 証明書が存在しない場合は生成
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('証明書を生成しています...');
    
    try {
        const selfsigned = require('selfsigned');
        console.log('selfsignedパッケージを読み込みました');
        
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = selfsigned.generate(attrs, {
            keySize: 2048,
            days: 365,
            algorithm: 'sha256'
        });
        
        console.log('証明書を生成しました');
        fs.writeFileSync(keyPath, pems.private);
        console.log('✅ キーファイルを保存しました');
        fs.writeFileSync(certPath, pems.cert);
        console.log('✅ 証明書ファイルを保存しました');
    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
} else {
    console.log('証明書は既に存在します');
}

// 証明書を読み込む
try {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    console.log('✅ 証明書とキーを読み込みました');
    console.log('   キーサイズ:', key.length, 'bytes');
    console.log('   証明書サイズ:', cert.length, 'bytes');
    
    const options = { key, cert };
    const PORT = 5500;
    
    const server = https.createServer(options, (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>HTTPSサーバーが正常に動作しています！</h1>');
    });
    
    server.on('error', (error) => {
        console.error('❌ サーバーエラー:', error.message);
        if (error.code === 'EADDRINUSE') {
            console.error(`ポート ${PORT} は既に使用されています`);
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
        console.log('停止するには Ctrl+C を押してください');
    });
    
} catch (error) {
    console.error('❌ 証明書の読み込みエラー:', error.message);
    process.exit(1);
}

