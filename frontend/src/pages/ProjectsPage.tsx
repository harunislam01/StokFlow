import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjects, createProject, deleteProject,
  type CreateProjectPayload, type Project
} from '../api/projects';
import { getProducts } from '../api/products';
import { useTheme } from '../context/ThemeProvider';
import {
  Briefcase, Plus, Search, Trash2, ChevronRight,
  Calendar, Package, CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import type { Product } from '../types';

/* ── Durum Badge ─────────────────────────────────── */
const STATUS_CONFIG = {
  PLANNING:  { label: 'Planlama',   color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  ACTIVE:    { label: 'Aktif',      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  CANCELLED: { label: 'İptal',      color: 'bg-red-500/10 text-red-400 border-red-500/20' }
} as const;

const StatusBadge = ({ status }: { status: keyof typeof STATUS_CONFIG }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

/* ── Ürün Seçici ─────────────────────────────────── */
interface SelectedProduct {
  productId: number;
  quantity: number;
  note?: string;
  name: string;
  productCode: string;
  stockQuantity: number;
}

const ProductSelector = ({
  products,
  selected,
  onToggle,
  onQuantityChange,
  isDark
}: {
  products: Product[];
  selected: SelectedProduct[];
  onToggle: (product: Product) => void;
  onQuantityChange: (productId: number, qty: number) => void;
  isDark: boolean;
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50),
    [products, search]
  );

  const isSelected = (id: number) => selected.some(s => s.productId === id);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ürün ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40
            ${isDark
              ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
        />
      </div>

      <div className={`rounded-lg border divide-y max-h-48 overflow-y-auto
        ${isDark ? 'border-white/10 divide-white/[0.06]' : 'border-slate-200 divide-slate-100'}`}>
        {filtered.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500">Ürün bulunamadı</p>
        ) : filtered.map(product => {
          const sel = isSelected(product.id);
          const selItem = selected.find(s => s.productId === product.id);
          return (
            <div key={product.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors
              ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
              <button
                type="button"
                onClick={() => onToggle(product)}
                className="shrink-0 text-amber-500"
              >
                {sel ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {product.productCode}
                </p>
                <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {product.name}
                </p>
              </div>
              <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {product.stockQuantity} adet
              </span>
              {sel && (
                <input
                  type="number"
                  min={1}
                  value={selItem?.quantity || 1}
                  onChange={e => onQuantityChange(product.id, Math.max(1, parseInt(e.target.value) || 1))}
                  onClick={e => e.stopPropagation()}
                  className={`w-14 text-center text-xs py-1 rounded border focus:outline-none focus:ring-1 focus:ring-amber-500
                    ${isDark ? 'bg-slate-700 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          {selected.length} ürün seçildi
        </p>
      )}
    </div>
  );
};

/* ── Proje Kartı ─────────────────────────────────── */
const ProjectCard = ({
  project,
  isDark,
  onDelete
}: {
  project: Project;
  isDark: boolean;
  onDelete: (id: number) => void;
}) => (
  <div className={`rounded-xl border p-5 transition-all duration-150 group relative
    ${isDark
      ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.14]'
      : 'bg-white border-slate-200/80 shadow-sm hover:border-amber-200 hover:shadow-md shadow-slate-900/[0.04]'
    }`}>

    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
          <Briefcase className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
        </div>
        <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {project.name}
        </h3>
      </div>
      <StatusBadge status={project.status} />
    </div>

    {project.description && (
      <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {project.description}
      </p>
    )}

    <div className={`flex items-center gap-4 text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
      <span className="flex items-center gap-1">
        <Package className="h-3.5 w-3.5" />
        {project.products.length} Ürün
      </span>
      {project.startDate && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(project.startDate).toLocaleDateString('tr-TR')}
          {project.endDate ? ` - ${new Date(project.endDate).toLocaleDateString('tr-TR')}` : ''}
        </span>
      )}
    </div>

    <div className="flex items-center gap-2">
      <Link
        to={`/projects/${project.id}`}
        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg transition-colors btn-tactile
          ${isDark
            ? 'bg-white/[0.05] hover:bg-amber-500/10 text-slate-300 hover:text-amber-400'
            : 'bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600'
          }`}
      >
        Detaylar <ChevronRight className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={() => onDelete(project.id)}
        className={`p-2.5 rounded-lg transition-colors btn-tactile
          ${isDark
            ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
          }`}
        title="Projeyi sil"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/* ── Ana Sayfa ───────────────────────────────────── */
export const ProjectsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts()
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectPayload) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Proje oluşturulurken hata oluştu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirm(null);
    }
  });

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormStatus('PLANNING');
    setFormStart('');
    setFormEnd('');
    setSelectedProducts([]);
  };

  const handleToggleProduct = (product: Product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(s => s.productId === product.id);
      if (exists) return prev.filter(s => s.productId !== product.id);
      return [...prev, {
        productId: product.id,
        quantity: 1,
        name: product.name,
        productCode: product.productCode,
        stockQuantity: product.stockQuantity
      }];
    });
  };

  const handleQuantityChange = (productId: number, qty: number) => {
    setSelectedProducts(prev =>
      prev.map(s => s.productId === productId ? { ...s, quantity: qty } : s)
    );
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      alert('Proje adı zorunludur');
      return;
    }
    createMutation.mutate({
      name: formName.trim(),
      description: formDesc || undefined,
      status: formStatus,
      startDate: formStart || undefined,
      endDate: formEnd || undefined,
      productIds: selectedProducts.map(s => ({
        productId: s.productId,
        quantity: s.quantity
      }))
    });
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Projeler
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Malzeme ve stok projelerini yönetin
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="bg-amber-600 hover:bg-amber-700 text-white h-11 px-4 rounded-xl btn-tactile gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Yeni Proje</span>
        </Button>
      </div>

      {/* Proje Listesi */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className={`rounded-xl border-2 border-dashed p-16 text-center
          ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
          <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4
            ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <Briefcase className={`h-8 w-8 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
          <h3 className={`text-base font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Henüz proje yok
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            İlk projenizi oluşturun ve malzeme takibine başlayın.
          </p>
          <Button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="bg-amber-600 hover:bg-amber-700 text-white h-11 px-6 rounded-xl btn-tactile gap-2"
          >
            <Plus className="h-4 w-4" /> Proje Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isDark={isDark}
              onDelete={id => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Proje Oluşturma Modalı */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-500" />
              Yeni Proje Oluştur
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Proje Adı */}
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Proje Adı <span className="text-red-500">*</span>
              </label>
              <Input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Örn: LED Aydınlatma Projesi"
                className="h-11 text-base"
              />
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Açıklama
              </label>
              <textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="Proje hakkında kısa bir açıklama..."
                rows={2}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40
                  ${isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
              />
            </div>

            {/* Durum */}
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Durum
              </label>
              <select
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as any)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none
                  ${isDark
                    ? 'bg-slate-800 border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                  }`}
              >
                <option value="PLANNING">Planlama</option>
                <option value="ACTIVE">Aktif</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </div>

            {/* Tarih Aralığı */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Başlangıç
                </label>
                <Input
                  type="date"
                  value={formStart}
                  onChange={e => setFormStart(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Bitiş
                </label>
                <Input
                  type="date"
                  value={formEnd}
                  onChange={e => setFormEnd(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Malzeme Seçimi */}
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Malzeme Seçimi <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(opsiyonel)</span>
              </label>
              <ProductSelector
                products={products || []}
                selected={selectedProducts}
                onToggle={handleToggleProduct}
                onQuantityChange={handleQuantityChange}
                isDark={isDark}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setIsCreateOpen(false); resetForm(); }}
              className="h-11"
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !formName.trim()}
              className="h-11 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Proje Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Modalı */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Projeyi Sil
            </DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="h-11">İptal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="h-11"
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
