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
    const PORT = process.env.PORT || "3000";
    const serverUrl = `http://localhost:${PORT}`;

    if (isDev) {
      createWindow(serverUrl);
    } else {
      // In production mode: Start Next.js server dynamically
      const next = require("next");
      const nextApp = next({ dev: false, dir: path.join(__dirname, "..") });
      const handle = nextApp.getRequestHandler();

      await nextApp.prepare();
      const server = http.createServer((req, res) => {
        handle(req, res);
      });

      server.listen(PORT, () => {
        console.log(`Al Madina ERP Server running on ${serverUrl}`);
        createWindow(serverUrl);
      });
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
