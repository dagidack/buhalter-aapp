const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const http = require("http");
const net = require("net");
const fs = require("fs");
const { spawn } = require("child_process");
const dotenv = require("dotenv");

const isDev = !app.isPackaged;
const appRoot = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
const packagedServerRoot = app.isPackaged
  ? path.join(process.resourcesPath, "next", "standalone")
  : appRoot;
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, "env", ".env.local")
  : path.join(appRoot, ".env.local");

let mainWindow;
let nextServerProcess;
let nextServerUrl = "http://127.0.0.1:3000";
let startupPromise = null;

function log(message, level = "info") {
  const logFile = path.join(app.getPath("userData"), "rm-fin-electron.log");
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, line);
  if (level === "error") {
    console.error(message);
  } else {
    console.log(message);
  }
}

function loadEnvFile() {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    log(`Loaded environment from ${envPath}`);
  }

  if (app.isPackaged) {
    const packagedKeyPath = path.join(
      process.resourcesPath,
      "secrets",
      "My Accounting App IAM.json"
    );

    if (fs.existsSync(packagedKeyPath)) {
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE = packagedKeyPath;
    }
  }
}

function createWindow(errorMessage = null) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (errorMessage) {
      const errorHtml = `<!doctype html><html><head><meta charset="utf-8" /><title>Startup failed</title><style>body{font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:24px;line-height:1.5;}code{background:#1e293b;padding:2px 6px;border-radius:4px;}</style></head><body><h1>Application startup failed</h1><p>The local Next.js server could not be started.</p><pre>${errorMessage}</pre></body></html>`;
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    } else if (mainWindow.webContents.getURL() !== nextServerUrl) {
      mainWindow.loadURL(nextServerUrl);
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    title: "RM fin",
    show: false,
    backgroundColor: "#0f172a",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(appRoot, "build", "icon.png"),
  });

  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (errorMessage) {
    const errorHtml = `<!doctype html><html><head><meta charset="utf-8" /><title>Startup failed</title><style>body{font-family:Arial,sans-serif;background:#0f172a;color:#f8fafc;padding:24px;line-height:1.5;}code{background:#1e293b;padding:2px 6px;border-radius:4px;}</style></head><body><h1>Application startup failed</h1><p>The local Next.js server could not be started.</p><pre>${errorMessage}</pre></body></html>`;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    return;
  }

  mainWindow.loadURL(nextServerUrl);
}

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });

    server.listen(startPort, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : startPort;
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tryConnect = () => {
      if (nextServerProcess && nextServerProcess.exitCode !== null) {
        reject(new Error(`Next.js server exited before becoming ready (code ${nextServerProcess.exitCode}).`));
        return;
      }

      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.setTimeout(1000, () => {
        request.destroy();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeout) {
          reject(new Error("Next.js server did not become ready in time."));
          return;
        }
        setTimeout(tryConnect, 1000);
      });
    };

    tryConnect();
  });
}

async function startNextServer() {
  const port = await findAvailablePort(3000);
  nextServerUrl = `http://127.0.0.1:${port}`;

  // In production, point directly to standalone server.js
  // In dev, use the wrapper next-server.js
  const serverScript = app.isPackaged
    ? path.join(packagedServerRoot, "server.js")
    : path.join(__dirname, "next-server.js");
  
  // CRITICAL: cwd MUST be the directory containing server.js
  const serverCwd = path.dirname(serverScript);
  const isProduction = !isDev;

  log(`Starting Next.js server from ${serverScript}`);
  log(`Working directory (cwd): ${serverCwd}`);
  log(`Environment: production=${isProduction}, NODE_ENV=${isProduction ? "production" : "development"}`);
  
  const serverEnv = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: isProduction ? "production" : "development",
    ELECTRON_RUN_AS_NODE: "1"
  };
  
  nextServerProcess = spawn(process.execPath, [serverScript], {
    cwd: serverCwd,
    env: serverEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextServerProcess.stdout?.on("data", (data) => {
    const output = data.toString();
    process.stdout.write(output);
    log(output.trim(), "info");
  });

  nextServerProcess.stderr?.on("data", (data) => {
    const output = data.toString();
    process.stderr.write(output);
    log(output.trim(), "error");
  });

  await waitForServer(nextServerUrl);
  return nextServerUrl;
}

async function initializeApp() {
  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    try {
      loadEnvFile();
      await startNextServer();
      createWindow();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(message, "error");
      createWindow(message);
    }
  })().finally(() => {
    startupPromise = null;
  });

  return startupPromise;
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      return;
    }

    initializeApp();
  });

  app.whenReady().then(() => {
    initializeApp();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initializeApp();
  } else if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("before-quit", () => {
  if (nextServerProcess && !nextServerProcess.killed) {
    nextServerProcess.kill("SIGTERM");
  }
});
