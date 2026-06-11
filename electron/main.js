const { app, BrowserWindow, shell, session } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");

const isDev = !app.isPackaged;
const PROD_URL = "https://blu3.in";
const DEV_URL = "http://localhost:3000";
const APP_URL = isDev ? DEV_URL : PROD_URL;
const API_URL = isDev ? "http://localhost:8000" : "https://api.blu3.in";
const PROTOCOL = "blu3";

let mainWindow = null;
let splashWindow = null;

// ─── Register Custom Protocol (blu3://) ──────────────────────────────────────
// This allows Chrome to redirect back to this app after OAuth

if (isDev) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  if (!app.isDefaultProtocolClient(PROTOCOL)) {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

let pendingProtocolUrl = null;

// Handle protocol on Windows (single instance lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv) => {
    // On Windows, the protocol URL is in argv
    const protocolUrl = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (protocolUrl) {
      handleProtocolUrl(protocolUrl);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Protocol URL Handler ────────────────────────────────────────────────────

function handleProtocolUrl(url) {
  try {
    const parsed = new URL(url);
    // blu3://auth-callback?token=SESSION_TOKEN
    if (parsed.hostname === "auth-callback") {
      const token = parsed.searchParams.get("token");
      if (token) {
        if (!mainWindow) {
          pendingProtocolUrl = url;
          return;
        }

        // Set the session cookie in Electron's webContents for the API domain
        const apiDomain = isDev ? "http://localhost:8000" : "https://api.blu3.in";
        const cookieUrl = apiDomain;

        session.defaultSession.cookies.set({
          url: cookieUrl,
          name: "better-auth.session_token",
          value: token,
          path: "/",
          httpOnly: true,
          secure: !isDev,
          sameSite: "lax",
        }).then(() => {
          console.log("Session cookie set, reloading app...");
          mainWindow.loadURL(APP_URL);
        }).catch((err) => {
          console.error("Failed to set cookie:", err);
          mainWindow.loadURL(APP_URL);
        });
      }
    }
  } catch (err) {
    console.error("Protocol URL parse error:", err);
  }
}

// ─── Splash Screen ──────────────────────────────────────────────────────────

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 380,
    height: 280,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));
  splashWindow.center();

  splashWindow.webContents.on("did-finish-load", () => {
    splashWindow.webContents.send("app-version", app.getVersion());
  });
}

// ─── Auth URL Helper ─────────────────────────────────────────────────────────

function prepareAuthUrl(urlStr) {
  try {
    const resolvedUrl = urlStr.startsWith("http") ? urlStr : new URL(urlStr, APP_URL).toString();
    const url = new URL(resolvedUrl);
    if (url.pathname.includes("/api/auth/")) {
      const targetRedirect = isDev
        ? "http://localhost:8000/api/auth/desktop-redirect"
        : "https://api.blu3.in/api/auth/desktop-redirect";
      url.searchParams.set("callbackURL", targetRedirect);
    }
    return url.toString();
  } catch (e) {
    return urlStr;
  }
}

// ─── Main Window ─────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Blu3",
    icon: path.join(__dirname, "../build/icon.ico"),
    backgroundColor: "#080808",
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#080808",
      symbolColor: "#ffffff",
      height: 36,
    },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadURL(APP_URL);

  // ─── External Navigations: Open in System Browser ─────────────────────────
  // Intercept any navigation to an external URL or auth endpoint
  // and open it in the default system browser (Chrome) instead of inside the app.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("http") && (!url.startsWith(APP_URL) || (url.includes("/api/auth/") && !url.includes("/api/auth/desktop-redirect")))) {
      event.preventDefault();
      const targetUrl = prepareAuthUrl(url);
      console.log("Opening external navigation in system browser:", targetUrl);
      shell.openExternal(targetUrl);
    }
  });

  // Intercept server-side redirects (like 302 redirects to Google/Discord)
  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (url.startsWith("http") && (!url.startsWith(APP_URL) || (url.includes("/api/auth/") && !url.includes("/api/auth/desktop-redirect")))) {
      event.preventDefault();
      const targetUrl = prepareAuthUrl(url);
      console.log("Opening redirect in system browser:", targetUrl);
      shell.openExternal(targetUrl);
    }
  });

  // Handle window.open() calls for external links or auth popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL) || url.includes("/api/auth/")) {
      const targetUrl = prepareAuthUrl(url);
      console.log("Opening window.open in system browser:", targetUrl);
      shell.openExternal(targetUrl);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();

    if (pendingProtocolUrl) {
      const url = pendingProtocolUrl;
      pendingProtocolUrl = null;
      handleProtocolUrl(url);
    }
  });

  // Uncomment to debug:
  // if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
}

// ─── Auto-Updater ────────────────────────────────────────────────────────────

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    sendToSplash("update-checking");
  });

  autoUpdater.on("update-available", (info) => {
    sendToSplash("update-status", `Downloading update v${info.version}...`);
  });

  autoUpdater.on("download-progress", (progress) => {
    sendToSplash("update-progress", Math.round(progress.percent));
    sendToSplash(
      "update-status",
      `Downloading update — ${Math.round(progress.percent)}%`
    );
  });

  autoUpdater.on("update-downloaded", () => {
    sendToSplash("update-status", "Update downloaded. Restarting...");
    setTimeout(() => {
      autoUpdater.quitAndInstall(true, true);
    }, 1500);
  });

  autoUpdater.on("update-not-available", () => {
    sendToSplash("update-status", "Starting Blu3...");
    setTimeout(() => {
      createMainWindow();
    }, 800);
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-updater error:", err);
    sendToSplash("update-status", "Starting Blu3...");
    setTimeout(() => {
      createMainWindow();
    }, 800);
  });
}

function sendToSplash(channel, data) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send(channel, data);
  }
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createSplash();

  // Check for protocol launch URL on startup
  const protocolUrl = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
  if (protocolUrl) {
    handleProtocolUrl(protocolUrl);
  }

  if (isDev) {
    sendToSplash("update-status", "Starting in dev mode...");
    setTimeout(() => {
      createMainWindow();
    }, 1000);
  } else {
    setupAutoUpdater();
    autoUpdater.checkForUpdates().catch((err) => {
      console.error("Update check failed:", err);
      sendToSplash("update-status", "Starting Blu3...");
      setTimeout(() => {
        createMainWindow();
      }, 800);
    });
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (event, navigationUrl) => {
    if (navigationUrl.startsWith("http") && (!navigationUrl.startsWith(APP_URL) || (navigationUrl.includes("/api/auth/") && !navigationUrl.includes("/api/auth/desktop-redirect")))) {
      event.preventDefault();
      const targetUrl = prepareAuthUrl(navigationUrl);
      console.log("Opening external navigation in system browser:", targetUrl);
      shell.openExternal(targetUrl);
      
      const win = BrowserWindow.fromWebContents(contents);
      if (win && win !== mainWindow) {
        win.close();
      }
    }
  });

  contents.on("will-redirect", (event, navigationUrl) => {
    if (navigationUrl.startsWith("http") && (!navigationUrl.startsWith(APP_URL) || (navigationUrl.includes("/api/auth/") && !navigationUrl.includes("/api/auth/desktop-redirect")))) {
      event.preventDefault();
      const targetUrl = prepareAuthUrl(navigationUrl);
      console.log("Opening redirect in system browser:", targetUrl);
      shell.openExternal(targetUrl);
      
      const win = BrowserWindow.fromWebContents(contents);
      if (win && win !== mainWindow) {
        win.close();
      }
    }
  });
});
