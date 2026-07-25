const CACHE_VERSION = 'almadina-erp-v5';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// All ERP routes that must work offline - we cache their HTML on first visit
const APP_ROUTES = [
  '/',
  '/dashboard',
  '/login',
  '/dashboard/cash-banks',
  '/dashboard/receivables',
  '/dashboard/payables',
  '/maintain/customers',
  '/maintain/vendors',
  '/maintain/customer-balances',
  '/maintain/vendor-balances',
  '/maintain/items',
  '/maintain/accounts',
  '/maintain/banks',
  '/maintain/employees',
  '/maintain/expenses',
  '/maintain/locations',
  '/maintain/regions',
  '/maintain/units',
  '/maintain/jobs',
  '/maintain/opening-balances',
  '/maintain/import-templates',
  '/maintain/parties',
  '/purchases/purchase-invoice',
  '/purchases/purchase-return',
  '/purchases/purchase-order',
  '/purchases/bill',
  '/sales/sale-invoice',
  '/sales/sale-return',
  '/sales/sale-order',
  '/sales/pos-counter-sale',
  '/sales/bill',
  '/sales/returns',
  '/payments/cash-payment',
  '/payments/bank-payment',
  '/receipts/cash-receipt',
  '/receipts/bank-receipt',
  '/receipts/other-income',
  '/salary/staff-salary',
  '/salary/payroll-run',
  '/salary/advance',
  '/salary/loan',
  '/salary/final-settlement',
  '/journal',
  '/reports/main',
  '/reports/sale',
  '/reports/purchase',
  '/reports/salary',
  '/reports/inventory',
  '/reports/financial',
  '/reports/party-ledger',
  '/reports/daily-cash-book',
  '/reports/stock-ledger',
  '/reports/main/journal',
  '/reports/main/po-tracking',
  '/reports/main/so-tracking',
  '/reports/main/serial-tracking',
  '/reports/purchase/register',
  '/reports/purchase/summary',
  '/reports/purchase/vendor-balances',
  '/reports/purchase/vendor-payments',
  '/reports/sales/customer-balances',
  '/reports/sales/item-profit-loss',
  '/reports/sales/pos-sales',
  '/reports/sales/salesman-incentive',
  '/reports/sale/summary',
  '/reports/inventory/balances',
  '/reports/inventory/intelligence',
  '/reports/inventory/inventory-ledger',
  '/reports/inventory/ledger',
  '/reports/inventory/low-stock',
  '/reports/financial/balance-sheet',
  '/reports/financial/profit-loss',
  '/reports/financial/trial-balance',
  '/reports/financial/ledger',
  '/reports/salary/register',
  '/reports/salary/loan-advance',
  '/reports/salary/statutory',
  '/settings/company',
  '/settings/users',
  '/settings/backup',
  '/settings/documents',
  '/settings/financial-year',
  '/settings/inventory-movement',
  '/settings/print-formats',
  '/settings/wipe-data',
  '/store/production-order',
];

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install: cache static assets ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v5...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Static cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches, claim clients ──────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v5...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: comprehensive offline-first strategy ────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle our own domain GET requests
  if (request.method !== 'GET' || url.hostname !== self.location.hostname) {
    return;
  }

  // Let API calls pass through to client-side mockApi handler (never cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // ── Navigation requests (HTML pages) ──
  // This is the KEY fix: serve cached HTML for ALL page navigations
  // Next.js client-side router handles the actual routing
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // ── Next.js data requests (.json RSC payloads) ──
  if (url.pathname.includes('/_next/data/')) {
    event.respondWith(handleNextDataRequest(request));
    return;
  }

  // ── Static assets (JS, CSS, fonts, images) ── Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAssetRequest(request));
    return;
  }

  // ── Everything else ── Network first with cache fallback
  event.respondWith(handleGeneralRequest(request));
});

// ─── Navigation Handler ────────────────────────────────────────────────────
// Strategy: Cache-first for the app shell, with network update in background.
// For ANY navigation request, if no exact match, serve the cached root "/" page
// (the Next.js app shell) which boots the client-side router.
async function handleNavigationRequest(request) {
  const url = new URL(request.url);

  // 1. Try exact cache match first
  const exactMatch = await caches.match(request);
  if (exactMatch) {
    // Update in background
    updateCacheInBackground(request);
    return exactMatch;
  }

  // 2. Try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (err) {
    // Network failed - expected when offline
  }

  // 3. Serve any cached page as the app shell fallback
  // Since Next.js is an SPA, any cached page HTML can bootstrap the app,
  // then client-side routing navigates to the correct page.
  const shellCandidates = ['/dashboard', '/', '/login'];
  for (const path of shellCandidates) {
    const shellResponse = await caches.match(path);
    if (shellResponse) {
      return shellResponse;
    }
    // Also try with trailing slash or full URL
    const fullUrl = new URL(path, self.location.origin).href;
    const shellResponse2 = await caches.match(fullUrl);
    if (shellResponse2) {
      return shellResponse2;
    }
  }

  // 4. Try ANY cached navigation response as last resort
  const allCaches = await caches.keys();
  for (const cacheName of allCaches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (const key of keys) {
      const resp = await cache.match(key);
      if (resp && resp.headers.get('content-type')?.includes('text/html')) {
        return resp;
      }
    }
  }

  // 5. Generate a minimal offline bootstrap page
  return new Response(getOfflineBootstrapHTML(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

// ─── Next.js Data Request Handler ───────────────────────────────────────────
async function handleNextDataRequest(request) {
  // Try cache first
  const cached = await caches.match(request);
  if (cached) {
    updateCacheInBackground(request);
    return cached;
  }

  // Try network
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      return response;
    }
  } catch (err) {
    // offline
  }

  // Return empty JSON to prevent errors
  return new Response(JSON.stringify({ pageProps: {} }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Static Asset Handler (Cache First) ─────────────────────────────────────
async function handleStaticAssetRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return empty response for missing static assets to prevent errors
    const url = new URL(request.url);
    if (url.pathname.match(/\.(css)$/)) {
      return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
    }
    if (url.pathname.match(/\.(js)$/)) {
      return new Response('', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
    }
    return new Response('', { status: 200 });
  }
}

// ─── General Request Handler (Network First) ────────────────────────────────
async function handleGeneralRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('', { status: 200 });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp|woff|woff2|ttf|eot|css|js|json)$/)
  );
}

function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response && response.ok) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {});
}

function getOfflineBootstrapHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AL Madina Building Material ERP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050110; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; padding: 2rem; }
    .spinner { width: 48px; height: 48px; border: 4px solid #7c3aed; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; color: #a78bfa; }
    p { font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.5rem; }
    button { background: #7c3aed; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>AL Madina Building Material ERP</h1>
    <p>Loading application... Please wait.</p>
    <p style="font-size: 0.75rem; color: #64748b;">If this page doesn't load, please open the app once while connected to the internet to cache all resources.</p>
    <button onclick="window.location.reload()">Retry</button>
  </div>
</body>
</html>`;
}

// ─── Pre-cache routes on first activation ───────────────────────────────────
// When the SW activates online, eagerly cache all ERP routes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_ALL_ROUTES') {
    cacheAllRoutes();
  }
});

async function cacheAllRoutes() {
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const route of APP_ROUTES) {
    try {
      const response = await fetch(route);
      if (response && response.ok) {
        await cache.put(route, response);
      }
    } catch (err) {
      // Skip routes that fail (might be offline)
    }
  }
  console.log('[SW] All routes cached for offline use.');
}
