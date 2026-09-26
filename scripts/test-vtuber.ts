
import { sendToVtuber } from "../src/gateway/vtuber-client.js";

async function main() {
    console.log("Testing VTuber integration...");
    try {
        await sendToVtuber({ text: "Hello from Neer! This is a test message." });
        console.log("Test finished.");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

main();
