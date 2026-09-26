
import net from "node:net";

export function freePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, () => {
            const addr = srv.address();
            if (addr && typeof addr !== "string") {
                const port = addr.port;
                srv.close(() => resolve(port));
            } else {
                srv.close(() => reject(new Error("Failed to get port")));
            }
        });
        srv.on("error", reject);
    });
}
