
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../context/ThemeProvider';

export const PwaUpdatePrompt = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.error('SW registration error: ', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-5 duration-300">
      <div className={`p-4 rounded-xl border shadow-xl flex items-center justify-between gap-4
        ${isDark
          ? 'bg-[#1e293b]/95 border-white/[0.08] text-white shadow-black/30 backdrop-blur-xl'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/[0.08] backdrop-blur-xl'
        }`}>
        <div className="flex-1">
          {offlineReady ? (
            <p className="text-xs font-semibold">Uygulama çevrimdışı çalışmaya hazır! 🎉</p>
          ) : (
            <p className="text-xs font-semibold">Yeni bir güncelleme mevcut! Yeniden yükleyin.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {needRefresh && (
            <Button
              onClick={() => updateServiceWorker(true)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] h-9 px-3 btn-tactile"
            >
              <RefreshCw className="h-3 w-3 mr-1.5 shrink-0 animate-spin" style={{ animationDuration: '3s' }} /> Güncelle
            </Button>
          )}
          <button
            onClick={close}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors
              ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
