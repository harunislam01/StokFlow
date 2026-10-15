import React, { useEffect, useState } from 'react';
import { Search, PlusCircle, User as UserIcon, LogOut, Sun, Moon, LayoutDashboard, Wifi, WifiOff, RefreshCw, Briefcase, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeProvider';
import { db } from '../../lib/db';
import logoUrl from '../../assets/logo.png';
import { ShortcutHelpOverlay } from '../ui/ShortcutHelpOverlay';

/* ─────────────────────────────────────
   HEADER
───────────────────────────────────── */
export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const showBackButton = location.pathname !== '/';

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updatePendingCount = async () => {
      try {
        const count = await db.syncQueue.count();
        setPendingCount(count);
      } catch (err) {
        console.error(err);
      }
    };

    updatePendingCount();

    window.addEventListener('sync-completed', updatePendingCount);
    const interval = setInterval(updatePendingCount, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-completed', updatePendingCount);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className={`
      sticky top-0 z-30 flex h-16 items-center gap-3 px-4 sm:px-6
      border-b transition-all duration-150 pt-[env(safe-area-inset-top)]
      ${isDark
        ? 'bg-[#0f172a]/95 border-white/[0.06] backdrop-blur-xl'
        : 'bg-white/90 border-slate-200/80 backdrop-blur-xl shadow-sm shadow-slate-900/[0.04]'
      }
    `}>
      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold
            btn-tactile transition-all duration-150 shrink-0 cursor-pointer
            ${isDark
              ? 'bg-white/[0.06] border-white/[0.1] text-slate-200 hover:bg-white/[0.12] hover:border-amber-500/40'
              : 'bg-slate-100/90 border-slate-200/90 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 shadow-2xs'
            }
          `}
          title="Geri Dön"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline font-medium">Geri</span>
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2.5 md:w-60 shrink-0">
        <div className={`p-1 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-amber-50'}`}>
          <img src={logoUrl} alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
        </div>
        <span className={`hidden md:block font-bold text-sm tracking-tight bg-clip-text text-transparent
          bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-500`}>
          StockFlow
        </span>
      </div>

      {/* Network & Sync Connection Indicator */}
      <div className="flex items-center gap-1.5">
        {!online ? (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border
            ${isDark 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
            <WifiOff className="h-3 w-3 shrink-0" />
            <span>Çevrimdışı</span>
          </span>
        ) : pendingCount > 0 ? (
          <span className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border
            bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse`}>
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Eşitleniyor ({pendingCount})</span>
          </span>
        ) : (
          <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border
            ${isDark 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
            <Wifi className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Çevrimiçi</span>
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`
            relative h-12 w-12 flex items-center justify-center rounded-xl btn-tactile
            transition-all duration-150 cursor-pointer
            ${isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }
          `}
          title="Tema değiştir"
        >
          {isDark
            ? <Sun className="h-5 w-5" />
            : <Moon className="h-5 w-5" />
          }
        </button>

        {/* User pill */}
        <div className={`
          hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-150
          ${isDark
            ? 'bg-white/[0.04] border-white/[0.07] text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-700'
          }
        `}>
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold uppercase">
            {user?.username?.[0] ?? 'A'}
          </div>
          <div className="flex flex-col leading-tight">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {user?.username}
            </span>
            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-amber-600'} font-medium`}>
              {user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className={`
            h-12 w-12 flex items-center justify-center rounded-xl btn-tactile
            transition-all duration-150 cursor-pointer
            ${isDark
              ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
            }
          `}
          title="Çıkış yap"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

/* ─────────────────────────────────────
   SIDEBAR
───────────────────────────────────── */
export const Sidebar = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { name: 'Dashboard',  path: '/',           icon: LayoutDashboard },
    { name: 'Projeler',   path: '/projects',   icon: Briefcase },
    { name: 'Ara',        path: '/search',      icon: Search },
    { name: 'Yeni Ürün',  path: '/product/new', icon: PlusCircle },
    { name: 'Ayarlar',   path: '/settings',    icon: UserIcon },
  ];

  return (
    <aside className={`
      hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0
      border-r transition-all duration-150
      ${isDark
        ? 'bg-[#0f172a] border-white/[0.06]'
        : 'bg-white border-slate-200/80 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]'
      }
    `}>
      {/* Logo area */}
      <div className={`flex items-center gap-3 h-16 px-5 border-b shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div className={`p-1.5 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-amber-50'}`}>
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
        </div>
        <div>
          <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            StockFlow
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className={`text-[10px] font-semibold uppercase tracking-widest px-3 mb-2
          ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Menü
        </p>
        {navItems.map(({ name, path, icon: Icon }) => {
          const active = location.pathname === path
            || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold btn-tactile
                transition-all duration-150
                ${active
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : ''}`} />
              <span>{name}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div className={`rounded-xl p-3 text-center
          ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          <p className={`text-[10px] font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
            Depo Stok Yönetimi v1.0
          </p>
        </div>
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────
   BOTTOM NAV (Mobile Thumb-Zone Oriented)
───────────────────────────────────── */
export const BottomNav = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { name: 'Ana Sayfa', path: '/',           icon: LayoutDashboard },
    { name: 'Projeler',  path: '/projects',   icon: Briefcase },
    { name: 'Hızlı Ekle', path: '/product/new', icon: PlusCircle, main: true },
    { name: 'Ara',       path: '/search',      icon: Search },
    { name: 'Ayarlar',    path: '/settings',    icon: UserIcon },
  ];

  return (
    <nav className={`
      md:hidden fixed bottom-0 inset-x-0 z-50
      flex items-center h-[68px] px-2 pb-[env(safe-area-inset-bottom)]
      border-t transition-all duration-150
      ${isDark
        ? 'bg-[#0f172a]/98 border-white/[0.06] backdrop-blur-xl'
        : 'bg-white/95 border-slate-200 backdrop-blur-xl shadow-[0_-2px_8px_rgba(15,23,42,0.04)]'
      }
    `}>
      {navItems.map(({ name, path, icon: Icon, main }) => {
        const active = location.pathname === path
          || (path !== '/' && location.pathname.startsWith(path));

        if (main) return (
          <Link key={path} to={path} className="flex-1 flex justify-center btn-tactile">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 -translate-y-3.5 border border-amber-400/20">
              <Icon className="h-6 w-6" />
            </div>
          </Link>
        );

        return (
          <Link key={path} to={path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 btn-tactile min-h-[48px] transition-colors
              ${active
                ? 'text-amber-600 dark:text-amber-500'
                : isDark ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-semibold">{name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

/* ─────────────────────────────────────
   APP LAYOUT
───────────────────────────────────── */
export const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 pb-24 md:pb-6">
        {children}
      </main>
      <BottomNav />
      <ShortcutHelpOverlay />
    </div>
  </div>
);
