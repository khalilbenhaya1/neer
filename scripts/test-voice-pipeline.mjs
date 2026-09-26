import WebSocket from 'ws';

async function runTest() {
    const ws = new WebSocket('ws://127.0.0.1:19001');
    ws.on('open', () => {
        console.log("Connected. Sending call.start...");

        // Simulate frontend call start
        ws.send(JSON.stringify({
            id: "req-1",
            method: "call.start",
            params: { agentId: "main" }
        }));

        setTimeout(() => {
            console.log("Sending Audio Chunks...");
            // Simulate base64 audio data
            ws.send(JSON.stringify({
                method: "call.audio_in",
                params: { data: Buffer.from("fake pcm audio data chunk 1").toString("base64") }
            }));
            ws.send(JSON.stringify({
                method: "call.audio_in",
                params: { data: Buffer.from("fake pcm audio data chunk 2").toString("base64") }
            }));
        }, 1000);

        // Wait for VAD silence timeout (1.5s) to trigger completion
        setTimeout(() => {
            console.log("Sending call.end...");
            ws.send(JSON.stringify({
                method: "call.end",
                params: {}
            }));
            // ws.close();
        }, 4000);
    });

    ws.on('message', (data) => {
        console.log("Received data from Gateway:", data.toString());
    });

    ws.on('error', (err) => {
        console.error("WS Error:", err);
    });

    ws.on('close', () => {
        console.log("Connection closed.");
    });
}

runTest().catch(console.error);
