import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, ChevronRight, Truck, Briefcase, BarChart3, type LucideIcon
} from 'lucide-react';

type MobileMenuItem = {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
};

// Yeni bir mobil kısayol eklemek için tek yapılması gereken bu listeye eleman eklemektir.
const MOBILE_MENU_ITEMS: MobileMenuItem[] = [
  { label: 'Tedarikçiler', description: 'Tedarikçi kayıtlarını yönet', path: '/tedarikciler', icon: Truck },
  { label: 'Projeler', description: 'Projeleri ve malzeme atamalarını görüntüle', path: '/projects', icon: Briefcase },
  { label: 'Raporlar', description: 'Stok ve hareket raporlarına göz at', path: '/raporlar', icon: BarChart3 },
];

export const MobileMenuSheet = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      {/* Floating menu button — bottom navigation'ın hemen üzerinde */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Daha fazla menü"
        aria-expanded={open}
        className="
          md:hidden fixed bottom-20 right-4 z-40
          flex h-12 w-12 items-center justify-center rounded-2xl
          bg-blue-600 text-white border border-blue-400/20
          shadow-lg shadow-blue-600/30 active:scale-95 transition-transform duration-150
        "
      >
        <Menu className="h-5 w-5" strokeWidth={2.4} />
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
          />

          {/* Bottom sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Daha fazla menü"
            className="
              absolute inset-x-0 bottom-0 flex flex-col max-h-[85vh]
              rounded-t-3xl bg-white shadow-2xl shadow-slate-900/20
              pb-[env(safe-area-inset-bottom)]
              animate-in slide-in-from-bottom-full duration-300 ease-out
            "
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-1 pb-4 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">Menü</h2>
                <p className="text-xs text-slate-500">Diğer sayfalara hızlı erişim</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Links */}
            <nav className="overflow-y-auto px-5 pb-5 space-y-2.5">
              {MOBILE_MENU_ITEMS.map(({ label, description, path, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`
                      flex items-center gap-3 p-3.5 min-h-[56px] rounded-2xl border
                      transition-colors btn-tactile
                      ${active
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-slate-200 bg-white shadow-sm active:bg-slate-50'
                      }
                    `}
                  >
                    <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center
                      ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-blue-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500 truncate">{description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
