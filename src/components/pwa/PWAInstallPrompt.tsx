'use client';
import { useState, useEffect } from 'react';
import { Download, Share, X, Plus, Smartphone, Monitor } from 'lucide-react';
import { COMPANY_NAME } from '@/lib/company';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid hydration mismatch flash
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect environment
    const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const _isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const _isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    setIsIOS(_isIOS && _isSafari);
    setIsStandalone(!!_isStandalone);
    setIsMobile(_isMobile);

    if (_isStandalone) return;

    const checkDismissed = () => {
      const dismissedStr = localStorage.getItem('pwa-install-dismissed');
      if (dismissedStr) {
        const dismissedTime = parseInt(dismissedStr, 10);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - dismissedTime < sevenDays) {
          return true;
        }
      }
      return false;
    };

    if (checkDismissed()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    if (_isIOS && _isSafari) {
      const timer = setTimeout(() => {
        if (!checkDismissed()) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 sm:inset-auto sm:right-6 sm:bottom-6 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">
      <div className="relative bg-[#060913]/95 backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-2xl p-5 sm:p-6 max-w-sm mx-auto sm:max-w-xs overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-emerald-500/10 blur-2xl -z-10 rounded-full" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center mb-4 text-white">
            {isMobile ? <Smartphone className="w-7 h-7" /> : <Monitor className="w-7 h-7" />}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-1">Install App</h3>
          <p className="text-sm text-gray-400 mb-5">
            Add <span className="text-emerald-400 font-medium">{COMPANY_NAME}</span> to your home screen for quick access and offline support.
          </p>

          {isIOS ? (
            <div className="w-full bg-black/40 rounded-xl p-4 text-left border border-white/5 space-y-3">
              <p className="text-xs text-gray-300 font-medium uppercase tracking-wider mb-2">How to install on iOS</p>
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-white/10 shrink-0">1</span>
                <span>Tap <Share className="w-4 h-4 inline mx-1 text-blue-400" /> in the toolbar</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-white/10 shrink-0">2</span>
                <span>Scroll and select <span className="font-medium inline-flex items-center gap-1">Add to Home Screen <Plus className="w-3 h-3" /></span></span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PWAInstallButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const _isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!_isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium ${className}`}
    >
      <Download className="w-4 h-4" />
      Install App
    </button>
  );
}
