import React, { useEffect, useState } from 'react';
import {
  Search, PlusCircle, User as UserIcon, LogOut, LayoutDashboard,
  Wifi, WifiOff, RefreshCw, Briefcase, ArrowLeft,
  Box, FolderTree, Tags, Truck, BarChart3, History
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    <header className="
      sticky top-0 z-30 flex h-16 items-center gap-3 px-4 sm:px-6
      border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm pt-[env(safe-area-inset-top)]
    ">
      {/* Back Button */}
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="
            flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold
            bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 shadow-sm
            transition-all duration-150 shrink-0 cursor-pointer
          "
          title="Geri Dön"
        >
          <ArrowLeft className="h-4 w-4 text-blue-600 shrink-0" />
          <span className="hidden sm:inline font-medium">Geri</span>
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2.5 md:w-60 shrink-0">
        <div className="p-1 rounded-xl bg-blue-50">
          <img src={logoUrl} alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
        </div>
        <span className="hidden md:block font-bold text-sm tracking-tight text-blue-800">
          StockFlow
        </span>
      </div>

      {/* Network & Sync Connection Indicator */}
      <div className="flex items-center gap-1.5">
        {!online ? (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-rose-50 border-rose-200 text-rose-700">
            <WifiOff className="h-3 w-3 shrink-0" />
            <span>Çevrimdışı</span>
          </span>
        ) : pendingCount > 0 ? (
          <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-blue-50 border-blue-200 text-blue-600 animate-pulse">
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Eşitleniyor ({pendingCount})</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
            <Wifi className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Çevrimiçi</span>
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* User pill */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-700">
          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold uppercase">
            {user?.username?.[0] ?? 'A'}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-slate-800">
              {user?.username}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="
            h-12 w-12 flex items-center justify-center rounded-xl
            text-slate-400 hover:text-rose-500 hover:bg-rose-50
            transition-all duration-150 cursor-pointer
          "
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

  const navItems = [
    { name: 'Ana Sayfa', path: '/', icon: LayoutDashboard },
    { name: 'Stok', path: '/stok', icon: Box },
    { name: 'Kategoriler', path: '/kategoriler', icon: FolderTree },
    { name: 'Ürünler', path: '/urunler', icon: Tags },
    { name: 'Tedarikçiler', path: '/tedarikciler', icon: Truck },
    { name: 'Raporlar', path: '/raporlar', icon: BarChart3 },
    { name: 'Hareketler', path: '/hareketler', icon: History },
    { name: 'Ayarlar', path: '/ayarlar', icon: UserIcon },
  ];

  return (
    <aside className="
      hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0
      border-r border-slate-200 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.04)]
    ">
      {/* Logo area */}
      <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-100 shrink-0">
        <div className="p-1.5 rounded-xl bg-blue-50">
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-800">
            StockFlow
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 text-slate-400">
          MENÜ
        </p>
        {navItems.map(({ name, path, icon: Icon }) => {
          const active = location.pathname === path
            || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link key={path} to={path}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150
                ${active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }
              `}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-100">
        <div className="rounded-xl p-3 text-center bg-slate-50">
          <p className="text-[10px] font-medium text-slate-400">
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

  const navItems = [
    { name: 'Ana Sayfa', path: '/', icon: LayoutDashboard },
    { name: 'Ürünler', path: '/urunler', icon: Tags },
    { name: 'Hızlı Ekle', path: '/product/new', icon: PlusCircle, main: true },
    { name: 'Ara', path: '/search', icon: Search },
    { name: 'Ayarlar', path: '/ayarlar', icon: UserIcon },
  ];

  return (
    <nav className="
      md:hidden fixed bottom-0 inset-x-0 z-50
      flex items-center h-[68px] px-2 pb-[env(safe-area-inset-bottom)]
      border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-2px_8px_rgba(15,23,42,0.04)]
    ">
      {navItems.map(({ name, path, icon: Icon, main }) => {
        const active = location.pathname === path
          || (path !== '/' && location.pathname.startsWith(path));

        if (main) return (
          <Link key={path} to={path} className="flex-1 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-3.5 border border-blue-400/20">
              <Icon className="h-6 w-6" />
            </div>
          </Link>
        );

        return (
          <Link key={path} to={path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[48px] transition-colors
              ${active
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-blue-600'
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
  <div className="flex h-screen overflow-hidden bg-slate-50">
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