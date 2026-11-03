import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../api/products';
import { addStockMovement } from '../../api/stockMovements';
import { useAuth } from '../../context/AuthContext';
import {
  X, Search, PlusCircle, ArrowLeftRight, Package, Plus, Minus,
  ChevronRight, CheckCircle2, ArrowDownCircle, ArrowUpCircle, AlertCircle
} from 'lucide-react';
import type { Product } from '../../types';

type View = 'menu' | 'picker' | 'form' | 'done';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const QuickActionsSheet = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [view, setView] = useState<View>('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ productName: string; stock: number; type: 'IN' | 'OUT' } | null>(null);

  const reset = () => {
    setView('menu');
    setSearchTerm('');
    setSelected(null);
    setQuantity(1);
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    onClose();
  };

  // Reset the sheet a little after it closes so the exit animation stays clean
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(reset, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => getProducts(),
    enabled: open,
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p =>
      [p.productCode, p.name, p.materialCode, p.location]
        .some(value => value?.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const stockMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason?: string }) =>
      addStockMovement(selected!.id, amount, user?.username || 'Bilinmeyen', reason, selected!.version),
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries();
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      setResult({
        productName: selected?.productCode || selected?.name || '',
        stock: data?.stockQuantity ?? selected?.stockQuantity ?? 0,
        type: variables.amount > 0 ? 'IN' : 'OUT',
      });
      setView('done');
      setTimeout(handleClose, 1400);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || err?.message || 'Stok güncellenirken hata oluştu');
    },
  });

  const submit = (type: 'IN' | 'OUT') => {
    if (!selected || quantity <= 0) return;
    setError(null);
    if (type === 'OUT' && quantity > selected.stockQuantity) {
      setError('Yetersiz stok. Mevcut stok: ' + selected.stockQuantity);
      return;
    }
    stockMutation.mutate({ amount: type === 'IN' ? quantity : -quantity });
  };

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[60]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={handleClose}
        className="absolute inset-0 h-full w-full bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="
          absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col
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
          {view !== 'menu' && view !== 'done' && (
            <button
              type="button"
              onClick={() => {
                if (view === 'form') {
                  setView('picker');
                  setSelected(null);
                  setError(null);
                } else {
                  setView('menu');
                }
              }}
              className="h-9 w-9 -ml-1 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:scale-95 transition"
              aria-label="Geri"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {view === 'menu' && 'Hızlı İşlemler'}
              {view === 'picker' && 'Ürün Seç'}
              {view === 'form' && 'Hızlı Stok İşlemi'}
              {view === 'done' && 'Tamamlandı'}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {view === 'menu' && 'Stok yönetimi için kısayollar'}
              {view === 'picker' && 'Stok işlemi yapacağın ürünü bul'}
              {view === 'form' && (selected?.name || '')}
              {view === 'done' && 'Stok başarıyla güncellendi'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Kapat"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 active:scale-95 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-5">
          {view === 'menu' && (
            <div className="space-y-3 animate-in fade-in-0 duration-200">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/product/new');
                }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-[0.99] transition btn-tactile"
              >
                <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                  <PlusCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-slate-900">Yeni Ürün Ekle</p>
                  <p className="text-xs text-slate-500">Kataloğa yeni bir ürün kaydet</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setView('picker')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-[0.99] transition btn-tactile"
              >
                <div className="h-12 w-12 shrink-0 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <ArrowLeftRight className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-slate-900">Hızlı Stok İşlemi</p>
                  <p className="text-xs text-slate-500">Ürün ara, stok girişi veya çıkışı yap</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full h-12 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600 active:scale-[0.99] transition mt-1"
              >
                Vazgeç
              </button>
            </div>
          )}

          {view === 'picker' && (
            <div className="space-y-3 animate-in fade-in-0 duration-200">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  inputMode="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ürün adı, kodu veya konum..."
                  className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Aramayı temizle"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2 pt-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    {searchTerm.trim() ? 'Sonuç bulunamadı' : 'Henüz ürün yok'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(product => {
                    const isLow = product.stockQuantity <= (product.minimumStock || 0);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelected(product);
                          setQuantity(1);
                          setError(null);
                          setView('form');
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white shadow-sm active:scale-[0.99] transition text-left"
                      >
                        <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                          {(product as any).imageUrl ? (
                            <img src={(product as any).imageUrl} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-bold text-blue-600 truncate">{product.productCode}</p>
                          <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-base font-mono font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                            {product.stockQuantity}
                          </p>
                          <p className="text-[10px] text-slate-400">Adet</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'form' && selected && (
            <div className="space-y-4 animate-in fade-in-0 duration-200">
              {/* Product summary */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold text-blue-600 truncate">{selected.productCode}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{selected.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-mono font-bold text-slate-900">{selected.stockQuantity}</p>
                  <p className="text-[10px] text-slate-500">Mevcut</p>
                </div>
              </div>

              {/* Quantity stepper */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Miktar</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Azalt"
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 active:scale-95 transition disabled:opacity-40"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-12 min-w-0 rounded-xl border border-slate-200 bg-white text-center text-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    aria-label="Arttır"
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 active:scale-95 transition"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => submit('IN')}
                  disabled={stockMutation.isPending}
                  className="h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-600/25 active:scale-[0.98] transition disabled:opacity-60"
                >
                  <ArrowDownCircle className="h-5 w-5" />
                  Stok Girişi
                </button>
                <button
                  type="button"
                  onClick={() => submit('OUT')}
                  disabled={stockMutation.isPending}
                  className="h-12 flex items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 text-sm font-bold active:scale-[0.98] transition disabled:opacity-60"
                >
                  <ArrowUpCircle className="h-5 w-5" />
                  Stok Çıkışı
                </button>
              </div>
              {stockMutation.isPending && (
                <p className="text-center text-xs text-slate-400">Kaydediliyor...</p>
              )}
            </div>
          )}

          {view === 'done' && result && (
            <div className="py-6 text-center animate-in zoom-in-95 fade-in-0 duration-200">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                {result.type === 'IN' ? 'Stok girişi yapıldı' : 'Stok çıkışı yapıldı'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {result.productName} · Yeni stok: <span className="font-mono font-bold text-slate-700">{result.stock}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
