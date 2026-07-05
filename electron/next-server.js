const http = require("http");
const next = require("next");
const path = require("path");

const appRoot = path.resolve(process.cwd());
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || "127.0.0.1";
const dev = process.env.NODE_ENV !== "production";

console.error(`[next-server] Starting in ${dev ? "dev" : "production"} mode`);
console.error(`[next-server] appRoot=${appRoot}, port=${port}, hostname=${hostname}`);

async function main() {
  try {
    const app = next({ dev, dir: appRoot });
    await app.prepare();

    const handle = app.getRequestHandler();
    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(port, hostname, () => {
      console.log(`[next-server] ✓ Ready on http://${hostname}:${port}`);
      console.error(`[next-server] NEXT_SERVER_READY http://${hostname}:${port} pid=${process.pid}`);
    });

    server.on("error", (err) => {
      console.error(`[next-server] Server error: ${err.message}`);
      process.exit(1);
    });
  } catch (err) {
    console.error(`[next-server] Failed to start:`, err);
    process.exit(1);
  }
}

main();
