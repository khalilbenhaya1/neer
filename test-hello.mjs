import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:18789');

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
            type: 'req',
            id: '1',
            method: 'connect',
            params: {
                minProtocol: 1,
                maxProtocol: 3,
                client: { id: "test", version: "1", platform: "win32", mode: "test" }
            }
        }));
    }

    if (msg.type === 'hello-ok') {
        console.log("HELLO-OK RECEIVED!");
        const hasEvent = msg.features?.events?.includes("agent.proactive");
        console.log("EVENTS_INCLUDES_AGENT_PROACTIVE:", hasEvent);
        process.exit(hasEvent ? 0 : 1);
    }

    if (msg.type === 'res' && msg.id === '1' && msg.payload?.type === 'hello-ok') {
        console.log("HELLO-OK RECEIVED (res)!");
        const hasEvent = msg.payload.features?.events?.includes("agent.proactive");
        console.log("EVENTS_INCLUDES_AGENT_PROACTIVE:", hasEvent);
        process.exit(hasEvent ? 0 : 1);
    }
});

ws.on('error', (e) => {
    console.error(e);
    process.exit(1);
});

setTimeout(() => {
    console.error("Timeout waiting for hello-ok");
    process.exit(1);
}, 3000);
