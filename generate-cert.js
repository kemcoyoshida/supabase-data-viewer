// 証明書生成スクリプト
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

// certsディレクトリが存在しない場合は作成
if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
    console.log('certsディレクトリを作成しました');
}

// 証明書が既に存在するか確認
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('証明書は既に存在します');
    process.exit(0);
}

// 証明書を生成
console.log('証明書を生成中...');

try {
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
    
    console.log('✅ 証明書の生成が完了しました');
    console.log(`   キー: ${keyPath}`);
    console.log(`   証明書: ${certPath}`);
    process.exit(0);
} catch (error) {
    console.error('❌ 証明書の生成に失敗しました:', error.message);
    console.error('');
    console.error('selfsignedパッケージがインストールされているか確認してください:');
    console.error('  npm install --save-dev selfsigned');
    process.exit(1);
}

