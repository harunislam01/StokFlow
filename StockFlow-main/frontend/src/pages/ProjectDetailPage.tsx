import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjectById, updateProject, deleteProject,
  addProductToProject, removeProductFromProject
} from '../api/projects';
import { getProducts } from '../api/products';
import { useTheme } from '../context/ThemeProvider';
import {
  ArrowLeft, Package, Edit2, Trash2, Plus,
  AlertTriangle, X, Search, CheckSquare, Square
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';

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

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Add product state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addNote, setAddNote] = useState('');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !isNaN(projectId)
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts()
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditOpen(false);
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Güncelleme hatası')
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    }
  });

  const addProductMutation = useMutation({
    mutationFn: () => addProductToProject(projectId, selectedProductId!, addQty, addNote || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsAddProductOpen(false);
      setSelectedProductId(null);
      setAddQty(1);
      setAddNote('');
      setProductSearch('');
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Ürün eklenirken hata')
  });

  const removeProductMutation = useMutation({
    mutationFn: (pid: number) => removeProductFromProject(projectId, pid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  });

  const openEdit = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description || '');
    setEditStatus(project.status);
    setEditStart(project.startDate ? project.startDate.split('T')[0] : '');
    setEditEnd(project.endDate ? project.endDate.split('T')[0] : '');
    setIsEditOpen(true);
  };

  const filteredProducts = (allProducts || []).filter(p => {
    const already = project?.products.some(pp => pp.productId === p.id);
    if (already) return false;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q);
  }).slice(0, 30);

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48 rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );

  if (!project) return (
    <div className="text-center py-16">
      <p className="text-slate-500">Proje bulunamadı.</p>
      <Button onClick={() => navigate('/projects')} variant="outline" className="mt-4">
        Projelere Dön
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')} className="h-11 w-11 rounded-xl btn-tactile">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {project.createdBy && (
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {project.createdBy.username} tarafından oluşturuldu
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={openEdit}
            className="h-11 rounded-xl btn-tactile gap-2"
          >
            <Edit2 className="h-4 w-4" /> Düzenle
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="h-11 rounded-xl btn-tactile"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Proje Bilgileri */}
      <div className={`rounded-xl border p-5 space-y-4
        ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
        {project.description && (
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {project.description}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Durum</p>
            <div className="mt-1.5"><StatusBadge status={project.status} /></div>
          </div>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Toplam Ürün</p>
            <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.products.length}</p>
          </div>
          {project.startDate && (
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Başlangıç</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {new Date(project.startDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
          )}
          {project.endDate && (
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bitiş</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {new Date(project.endDate).toLocaleDateString('tr-TR')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ürün Listesi */}
      <div className={`rounded-xl border overflow-hidden
        ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm'}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between
          ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-white/[0.06]' : 'bg-amber-50'}`}>
              <Package className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            </div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Proje Malzemeleri ({project.products.length})
            </h3>
          </div>
          <Button
            onClick={() => setIsAddProductOpen(true)}
            className="h-9 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 btn-tactile"
          >
            <Plus className="h-3.5 w-3.5" /> Ürün Ekle
          </Button>
        </div>

        {project.products.length === 0 ? (
          <div className="py-12 text-center">
            <Package className={`h-10 w-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Bu projeye henüz ürün eklenmedi
            </p>
            <Button
              onClick={() => setIsAddProductOpen(true)}
              variant="outline"
              className="mt-4 h-10 rounded-xl gap-2 text-sm"
            >
              <Plus className="h-4 w-4" /> İlk Ürünü Ekle
            </Button>
          </div>
        ) : (
          <div>
            {project.products.map((pp, idx) => {
              const isLow = pp.product.stockQuantity <= pp.product.minimumStock;
              return (
                <div
                  key={pp.id}
                  className={`flex items-center gap-4 px-5 py-3.5 min-h-[52px] transition-colors
                    ${idx !== project.products.length - 1
                      ? isDark ? 'border-b border-white/[0.05]' : 'border-b border-slate-100'
                      : ''
                    }
                    ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/70'}`}
                >
                  <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0
                    ${isLow
                      ? isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                      : isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}>
                    <Package className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/product/${pp.productId}`}
                        className={`text-sm font-bold hover:underline truncate
                          ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                      >
                        {pp.product.productCode}
                      </Link>
                      {isLow && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                          <AlertTriangle className="h-3 w-3" /> Kritik Stok
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {pp.product.name} · {pp.product.category.name}
                    </p>
                    {pp.note && (
                      <p className={`text-[10px] italic mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {pp.note}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Proje: <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{pp.quantity}</span>
                    </p>
                    <p className={`text-[10px] ${isLow ? 'text-red-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Stok: {pp.product.stockQuantity}
                    </p>
                  </div>

                  <button
                    onClick={() => removeProductMutation.mutate(pp.productId)}
                    disabled={removeProductMutation.isPending}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors btn-tactile
                      ${isDark
                        ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                        : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                    title="Projeden çıkar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Düzenle Modalı */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Projeyi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Proje Adı *</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-11 text-base" />
            </div>
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Açıklama</label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={2}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/40
                  ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Durum</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as any)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none
                  ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              >
                <option value="PLANNING">Planlama</option>
                <option value="ACTIVE">Aktif</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Başlangıç</label>
                <Input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bitiş</label>
                <Input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="h-11">İptal</Button>
            <Button
              onClick={() => updateMutation.mutate({
                name: editName, description: editDesc, status: editStatus,
                startDate: editStart || undefined, endDate: editEnd || undefined
              })}
              disabled={updateMutation.isPending || !editName.trim()}
              className="h-11 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sil Modalı */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Projeyi Sil
            </DialogTitle>
          </DialogHeader>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <strong>{project.name}</strong> projesini silmek istediğinize emin misiniz?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-11">İptal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="h-11"
            >
              {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ürün Ekle Modalı */}
      <Dialog open={isAddProductOpen} onOpenChange={open => { setIsAddProductOpen(open); if (!open) { setSelectedProductId(null); setProductSearch(''); setAddQty(1); setAddNote(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" /> Projeye Ürün Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40
                  ${isDark ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            <div className={`rounded-lg border divide-y max-h-52 overflow-y-auto
              ${isDark ? 'border-white/10 divide-white/[0.06]' : 'border-slate-200 divide-slate-100'}`}>
              {filteredProducts.length === 0 ? (
                <p className="text-center py-6 text-sm text-slate-500">Ürün bulunamadı</p>
              ) : filteredProducts.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProductId(product.id === selectedProductId ? null : product.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${selectedProductId === product.id
                      ? isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                      : isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'
                    }`}
                >
                  {selectedProductId === product.id
                    ? <CheckSquare className="h-4 w-4 text-amber-500 shrink-0" />
                    : <Square className="h-4 w-4 text-slate-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{product.productCode}</p>
                    <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{product.name}</p>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {product.stockQuantity} adet
                  </span>
                </button>
              ))}
            </div>

            {selectedProductId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Miktar</label>
                  <Input
                    type="number"
                    min={1}
                    value={addQty}
                    onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Not</label>
                  <Input
                    value={addNote}
                    onChange={e => setAddNote(e.target.value)}
                    placeholder="Opsiyonel..."
                    className="h-11"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)} className="h-11">İptal</Button>
            <Button
              onClick={() => addProductMutation.mutate()}
              disabled={!selectedProductId || addProductMutation.isPending}
              className="h-11 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {addProductMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
