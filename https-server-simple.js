// より簡単なHTTPSサーバー（http-serverパッケージを使用）
const { spawn } = require('child_process');
const path = require('path');

const PORT = 5500;

console.log('');
console.log('========================================');
console.log('HTTPSサーバーを起動しています...');
console.log('========================================');
console.log('');

// http-serverを起動
const server = spawn('npx', ['http-server', '.', '-p', PORT.toString(), '-S', '-C', 'certs/cert.pem', '-K', 'certs/key.pem', '--cors'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
});

server.on('error', (error) => {
    console.error('❌ サーバーの起動に失敗しました:', error.message);
    console.error('');
    console.error('http-serverパッケージをインストールしてください:');
    console.error('  npm install --save-dev http-server');
    process.exit(1);
});

server.on('close', (code) => {
    if (code !== 0) {
        console.error(`サーバーが終了しました（コード: ${code}）`);
    }
});

// プロセス終了時にサーバーを停止
process.on('SIGINT', () => {
    console.log('\nサーバーを停止しています...');
    server.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.kill();
    process.exit(0);
});

