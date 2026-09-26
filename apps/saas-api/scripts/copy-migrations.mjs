import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const destination = path.join(packageRoot, "dist", "migrations");
await mkdir(destination, { recursive: true });
await cp(path.join(packageRoot, "migrations"), destination, { recursive: true });
