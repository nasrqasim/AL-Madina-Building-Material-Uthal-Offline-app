const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Configure ERP offline data directory in user's Documents folder
const documentsDir = app.getPath("documents");
const erpDataDir = path.join(documentsDir, "AlMadina ERP");

if (!fs.existsSync(erpDataDir)) {
  fs.mkdirSync(erpDataDir, { recursive: true });
}

// Set environment variable so Next.js API routes & db.ts write SQLite DB to Documents/AlMadina ERP
process.env.ALMADINA_DATA_DIR = erpDataDir;
process.env.NODE_ENV = app.isPackaged ? "production" : "development";
process.env.PORT = "3000";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "almadina-erp-offline-secret-key-2026";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";

let mainWindow = null;

function createWindow(serverUrl) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Al Madina Building Material ERP",
    icon: path.join(__dirname, "../public/icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(serverUrl);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const isDev = !app.isPackaged;
    const PORT = parseInt(process.env.PORT || "3000", 10);
    const serverUrl = `http://127.0.0.1:${PORT}`;

    if (isDev) {
      createWindow(`http://localhost:${PORT}`);
    } else {
      try {
        // In production mode: Start embedded Next.js server on 127.0.0.1
        const next = require("next");
        const nextApp = next({ dev: false, dir: path.join(__dirname, "..") });
        const handle = nextApp.getRequestHandler();

        await nextApp.prepare();
        const server = http.createServer((req, res) => {
          handle(req, res);
        });

        server.on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            // Fallback to random available port if 3000 is occupied
            server.listen(0, "127.0.0.1", () => {
              const assignedPort = server.address().port;
              console.log(`Al Madina ERP Server running on port ${assignedPort}`);
              createWindow(`http://127.0.0.1:${assignedPort}`);
            });
          } else {
            const { dialog } = require("electron");
            dialog.showErrorBox("Al Madina ERP Startup Error", `Failed to start local server: ${err.message}`);
            app.quit();
          }
        });

        server.listen(PORT, "127.0.0.1", () => {
          console.log(`Al Madina ERP Server running on ${serverUrl}`);
          createWindow(serverUrl);
        });
      } catch (err) {
        const { dialog } = require("electron");
        dialog.showErrorBox("Al Madina ERP Initialization Error", `Failed to initialize application server: ${err.message}`);
        app.quit();
      }
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null && app.isReady()) {
    createWindow(`http://localhost:${process.env.PORT || "3000"}`);
  }
});
