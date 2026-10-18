import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../context/ThemeProvider';

export const PwaInstallPrompt = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt after 3 seconds if not dismissed
      const hasDismissed = localStorage.getItem('pwa_ios_prompt_dismissed');
      if (!hasDismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      // Android / Chrome: Listen for beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
        
        const hasDismissed = localStorage.getItem('pwa_android_prompt_dismissed');
        if (!hasDismissed) {
          setShowPrompt(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    
    // Hide our custom prompt
    setShowPrompt(false);
    
    // Trigger native prompt
    installPromptEvent.prompt();
    
    // Wait for the user's choice
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallPromptEvent(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(isIos ? 'pwa_ios_prompt_dismissed' : 'pwa_android_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-5 rounded-xl border shadow-xl flex flex-col gap-3.5 relative overflow-hidden
        ${isDark
          ? 'bg-[#1e293b]/95 border-white/[0.08] text-white shadow-black/30 backdrop-blur-xl'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/[0.08] backdrop-blur-xl'
        }`}>
        
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className={`absolute top-3.5 right-3.5 p-1 rounded-lg cursor-pointer transition-colors
            ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          title="Kapat"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Content */}
        <div className="flex gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 shrink-0 h-fit">
            <Download className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1 pr-6">
            <h4 className="text-sm font-bold leading-tight">Uygulamayı Yükleyin</h4>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Hızlı erişim, çevrimdışı kullanım ve anlık bildirimler için ana ekranınıza ekleyin.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isIos ? (
          <div className={`text-[11px] font-semibold flex items-center justify-center gap-2 p-3 rounded-lg border text-center
            ${isDark ? 'bg-slate-800/40 border-white/[0.05] text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
            <span>Safari menüsündeki</span>
            <Share className="h-4 w-4 text-amber-600" />
            <span>butonuna basıp <strong>Ana Ekrana Ekle</strong> deyin.</span>
          </div>
        ) : (
          <Button
            onClick={handleInstallClick}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 rounded-md font-semibold text-xs btn-tactile"
          >
            Yükle
          </Button>
        )}
      </div>
    </div>
  );
};
