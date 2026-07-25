'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function PWARegistration() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);

          // When online, tell the SW to pre-cache all routes
          if (navigator.onLine && registration.active) {
            registration.active.postMessage({ type: 'CACHE_ALL_ROUTES' });
          }

          // Also cache when a new SW becomes active
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  // New worker is active, cache routes
                  newWorker.postMessage({ type: 'CACHE_ALL_ROUTES' });
                }
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New SW version installed');
                  setShowUpdate(true);
                }
              });
            }
          });

          // If SW is already active and we're online, cache routes
          if (registration.active && navigator.onLine) {
            setTimeout(() => {
              registration.active?.postMessage({ type: 'CACHE_ALL_ROUTES' });
            }, 3000); // Delay to let app finish loading first
          }
        })
        .catch((err) => console.error('SW registration failed:', err));

      // Request persistent storage so IndexedDB is never auto-cleared
      if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then((granted) => {
          console.log(`Persistent storage ${granted ? 'granted' : 'denied'}`);
        });
      }
    }
  }, []);

  const reloadPage = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#060913]/95 backdrop-blur-md border border-emerald-500/20 p-4 rounded-xl shadow-lg flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="text-sm text-gray-200">
        <span className="font-semibold text-emerald-400">Update available!</span><br />
        Refresh to apply changes.
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={reloadPage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
