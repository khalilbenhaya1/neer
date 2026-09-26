import net from 'node:net';
const client = new net.Socket();
client.connect(18789, '127.0.0.1', () => {
    console.log('CONNECTED TO 18789');
    client.destroy();
});
client.on('error', (err) => {
    console.log('FAILED TO CONNECT: ' + err.message);
    process.exit(1);
});
setTimeout(() => {
    console.log('TIMEOUT');
    process.exit(1);
}, 2000);
