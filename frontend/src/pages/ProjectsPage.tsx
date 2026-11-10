import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjects, createProject, updateProject, deleteProject, downloadProjectExcel,
  type CreateProjectPayload, type Project
} from '../api/projects';
import { getProducts } from '../api/products';
import { useTheme } from '../context/ThemeProvider';
import {
  Briefcase, Plus, Search, Trash2, ChevronLeft, ChevronRight,
  Calendar, Package, CheckSquare, Square, AlertTriangle, ArrowLeft, Edit2,
  FileSpreadsheet, Upload, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import type { Product } from '../types';

/* ── Excel Dosyası ───────────────────────────────── */
interface ExcelAttachment {
  name: string;
  type: string;
  data: string;
}

const ACCEPTED_EXCEL_PATTERN = /\.(xls|xlsx|csv)$/i;
const MAX_EXCEL_SIZE = 4 * 1024 * 1024; // express.json limit is 5mb (base64 grows ~33%)

const readExcelFile = (file: File): Promise<ExcelAttachment> => {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_EXCEL_PATTERN.test(file.name)) {
      reject(new Error('Sadece .xls, .xlsx veya .csv dosyaları yüklenebilir'));
      return;
    }
    if (file.size > MAX_EXCEL_SIZE) {
      reject(new Error('Dosya boyutu en fazla 4 MB olabilir'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        name: file.name,
        type: file.type || (/\.csv$/i.test(file.name) ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        data: base64
      });
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
};

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
          className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40
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
                className="shrink-0 text-blue-600"
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
                  className={`w-14 text-center text-xs py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500
                    ${isDark ? 'bg-slate-700 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
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
  onEdit,
  onDownloadExcel,
  onDelete
}: {
  project: Project;
  isDark: boolean;
  onEdit: () => void;
  onDownloadExcel: () => void;
  onDelete: () => void;
}) => (
  <div className={`flex flex-col rounded-xl border p-5 transition-all duration-150 group relative
    ${isDark
      ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.14]'
      : 'bg-white border-slate-200/80 shadow-sm hover:border-blue-300 hover:shadow-md shadow-slate-900/[0.04]'
    }`}>

    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <Briefcase className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
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

    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          title="Projeyi düzenle"
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors btn-tactile
            ${isDark
              ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10'
              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDownloadExcel}
          disabled={!project.hasExcel}
          title={project.hasExcel ? 'Excel dosyasını indir' : 'Excel dosyası yüklenmemiş'}
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors btn-tactile
            ${!project.hasExcel
              ? isDark ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
              : isDark
                ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Projeyi sil"
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors btn-tactile
            ${isDark
              ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
            }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    {/* Atanan ürünler */}
    <div>
      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Atanan Ürünler
      </p>
      {project.products.length === 0 ? (
        <div className={`rounded-lg border border-dashed px-3 py-4 text-center text-[11px]
          ${isDark ? 'border-white/[0.08] text-slate-500' : 'border-slate-200 text-slate-400'}`}>
          Henüz ürün atanmadı
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {project.products.map(pp => {
            const isLow = pp.product.stockQuantity <= pp.product.minimumStock;
            return (
              <Link
                key={pp.id}
                to={`/product/${pp.productId}`}
                className={`flex items-center gap-2.5 rounded-lg border p-2 transition-colors btn-tactile
                  ${isDark
                    ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]'
                    : 'border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
              >
                <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0
                  ${isLow
                    ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                    : isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-mono font-bold truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {pp.product.productCode}
                  </p>
                  <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {pp.product.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {pp.quantity} <span className="text-[9px] font-normal">adet</span>
                  </p>
                  <p className={`text-[9px] ${isLow ? 'text-red-500 font-semibold' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isLow ? 'Kritik stok' : `Stok: ${pp.product.stockQuantity}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
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

  // Carousel state
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateCarouselState = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  // Ekranda yan yana kaç kart görünüyorsa o kadar kart ilerlet
  const getCardsPerPage = () => {
    const el = carouselRef.current;
    const firstCard = el?.firstElementChild as HTMLElement | null;
    if (!el || !firstCard) return 1;
    const gap = 16; // gap-4
    const cardWidth = firstCard.getBoundingClientRect().width;
    if (!cardWidth) return 1;
    return Math.max(1, Math.round((el.clientWidth + gap) / (cardWidth + gap)));
  };

  const scrollCarousel = (direction: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = firstCard ? firstCard.getBoundingClientRect().width + 16 : el.clientWidth;
    el.scrollBy({ left: direction * step * getCardsPerPage(), behavior: 'smooth' });
  };

  const scrollToStart = () => {
    carouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [formExcel, setFormExcel] = useState<ExcelAttachment | null>(null);

  // Edit state
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editExcel, setEditExcel] = useState<ExcelAttachment | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  });

  // Mevcut sıralamayı koruyup yeni projeleri her zaman en sona (en sağa) ekle
  const orderedProjects = useMemo(
    () => [...(projects ?? [])].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    [projects]
  );

  useEffect(() => {
    updateCarouselState();
    window.addEventListener('resize', updateCarouselState);
    return () => window.removeEventListener('resize', updateCarouselState);
  }, [projects]);

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

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateProjectPayload>) => updateProject(editProject!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditProject(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Proje güncellenirken hata oluştu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteConfirm(null);
    }
  });

  const openEdit = (project: Project) => {
    setEditProject(project);
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditStatus(project.status);
    setEditStart(project.startDate ? project.startDate.split('T')[0] : '');
    setEditEnd(project.endDate ? project.endDate.split('T')[0] : '');
    setEditExcel(null);
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormStatus('PLANNING');
    setFormStart('');
    setFormEnd('');
    setSelectedProducts([]);
    setFormExcel(null);
  };

  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const attachment = await readExcelFile(file);
      if (target === 'create') setFormExcel(attachment);
      else setEditExcel(attachment);
    } catch (err: any) {
      alert(err.message || 'Excel dosyası seçilemedi');
    }
    e.target.value = '';
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
      })),
      ...(formExcel ? {
        excelFileName: formExcel.name,
        excelFileType: formExcel.type,
        excelFileData: formExcel.data
      } : {})
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
          className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-4 rounded-xl btn-tactile gap-2"
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
      ) : orderedProjects.length === 0 ? (
        <div className={`rounded-xl border-2 border-dashed p-16 text-center
          ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
          <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4
            ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <Briefcase className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h3 className={`text-base font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Henüz proje yok
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            İlk projenizi oluşturun ve malzeme takibine başlayın.
          </p>
          <Button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 rounded-xl btn-tactile gap-2"
          >
            <Plus className="h-4 w-4" /> Proje Oluştur
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 min-h-[36px]">
            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {orderedProjects.length} proje
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {canScrollLeft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToStart}
                  className="h-9 rounded-xl gap-1.5 border-slate-200 text-slate-700 btn-tactile"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Başa Dön
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCarousel(-1)}
                disabled={!canScrollLeft}
                aria-label="Önceki projeler"
                className="h-9 w-9 rounded-xl btn-tactile"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollCarousel(1)}
                disabled={!canScrollRight}
                aria-label="Sonraki projeler"
                className="h-9 w-9 rounded-xl btn-tactile"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={carouselRef}
            onScroll={updateCarouselState}
            className="flex items-start gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {orderedProjects.map(project => (
              <div
                key={project.id}
                className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]"
              >
                <ProjectCard
                  project={project}
                  isDark={isDark}
                  onEdit={() => openEdit(project)}
                  onDownloadExcel={() => {
                    if (!project.hasExcel) return;
                    downloadProjectExcel(project.id, project.excelFileName).catch((err: any) =>
                      alert(err.response?.data?.error || 'Excel dosyası indirilemedi')
                    );
                  }}
                  onDelete={() => setDeleteConfirm(project.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proje Oluşturma Modalı */}
      <Dialog open={isCreateOpen} onOpenChange={open => { setIsCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
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
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40
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
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none
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

            {/* Excel Dosyası */}
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Excel Dosyası <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(opsiyonel)</span>
              </label>
              {formExcel ? (
                <div className={`flex items-center gap-2 rounded-lg border p-2.5
                  ${isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className={`flex-1 min-w-0 truncate text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {formExcel.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormExcel(null)}
                    title="Dosyayı kaldır"
                    className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors
                      ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 cursor-pointer text-xs font-semibold transition-colors
                  ${isDark
                    ? 'border-white/15 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                    : 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/40'
                  }`}>
                  <Upload className="h-4 w-4" /> Excel Dosyası Yükle
                  <input type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={e => handleExcelChange(e, 'create')} />
                </label>
              )}
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Sadece .xls, .xlsx ve .csv dosyaları (en fazla 4 MB).
              </p>
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
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Proje Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proje Düzenleme Modalı */}
      <Dialog open={editProject !== null} onOpenChange={open => { if (!open) setEditProject(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              Projeyi Düzenle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Proje Adı <span className="text-red-500">*</span>
              </label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11 text-base" />
            </div>

            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Açıklama
              </label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={2}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40
                  ${isDark
                    ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Durum
              </label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as any)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Başlangıç
                </label>
                <Input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Bitiş
                </label>
                <Input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="h-11" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Excel Dosyası
              </label>
              {editExcel ? (
                <div className={`flex items-center gap-2 rounded-lg border p-2.5
                  ${isDark ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-200 bg-emerald-50/50'}`}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className={`flex-1 min-w-0 truncate text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {editExcel.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditExcel(null)}
                    title="Yeni dosyayı kaldır"
                    className={`h-6 w-6 flex items-center justify-center rounded-md transition-colors
                      ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : editProject?.excelFileName ? (
                <div className={`flex items-center gap-2 rounded-lg border p-2.5
                  ${isDark ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className={`flex-1 min-w-0 truncate text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {editProject.excelFileName}
                  </span>
                  <label className={`text-[11px] font-semibold cursor-pointer shrink-0
                    ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700 hover:underline'}`}>
                    Değiştir
                    <input type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={e => handleExcelChange(e, 'edit')} />
                  </label>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 rounded-lg border border-dashed p-3 cursor-pointer text-xs font-semibold transition-colors
                  ${isDark
                    ? 'border-white/15 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                    : 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/40'
                  }`}>
                  <Upload className="h-4 w-4" /> Excel Dosyası Yükle
                  <input type="file" accept=".xls,.xlsx,.csv" className="hidden" onChange={e => handleExcelChange(e, 'edit')} />
                </label>
              )}
              <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Sadece .xls, .xlsx ve .csv dosyaları (en fazla 4 MB).
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditProject(null)}
              className="h-11"
              disabled={updateMutation.isPending}
            >
              İptal
            </Button>
            <Button
              onClick={() => updateMutation.mutate({
                name: editName,
                description: editDesc,
                status: editStatus,
                startDate: editStart || undefined,
                endDate: editEnd || undefined,
                ...(editExcel ? {
                  excelFileName: editExcel.name,
                  excelFileType: editExcel.type,
                  excelFileData: editExcel.data
                } : {})
              })}
              disabled={updateMutation.isPending || !editName.trim()}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
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
