const cp = require('child_process');
const path = require('path');

const projectDir = "c:\\Users\\khali\\OneDrive\\Desktop\\Neer-folder\\neer";
const venvPython = path.join(projectDir, ".whisper", "venv", "Scripts", "python.exe");
const serverScript = path.join(projectDir, ".whisper", "server.py");

console.log("Spawning python:", venvPython);

const p = cp.spawn(venvPython, ["-u", serverScript], {
    env: {
        ...process.env,
        WHISPER_PORT: '8778',
        WHISPER_MODEL: 'base'
    },
    stdio: ["ignore", "pipe", "pipe"],
});

p.stdout.on('data', d => process.stdout.write('[OUT] ' + d.toString()));
p.stderr.on('data', d => process.stderr.write('[ERR] ' + d.toString()));

p.on('exit', code => console.log('EXIT:', code));
p.on('error', err => console.log('ERROR:', err));

setTimeout(() => {
    console.log("Killing after 5s...");
    p.kill();
}, 5000);
