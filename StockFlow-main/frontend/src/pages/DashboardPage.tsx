import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats, getDashboardCharts, type CriticalStockItem } from '../api/dashboard';
import { getCategories, createCategory } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeProvider';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Plus, ArrowUpCircle, ArrowDownCircle,
  Box, AlertTriangle, Star, TrendingUp, TrendingDown,
  ChevronRight, ArrowDown, ArrowUp, FolderTree, X
} from 'lucide-react';

/* ── Sabitler ───────────────────────────────────── */
const PIE_COLORS = [
  '#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6',
  '#64748b', '#10b981', '#f43f5e', '#a855f7'
];

const CAT_EMOJI_MAP: Record<string, string> = {
  'Direnç': '〰️',
  'Kondansatör': '🔋',
  'LED': '💡',
  'Entegre': '🔲',
  'Transistör': '🔀',
  'Röle': '🔌',
  'Konnektör': '🔗',
  'Kablo': '〽️',
  'Test': '🔬',
  'test': '🧪',
  'Soğutucular': '❄️',
  'Ofisler': '🏢',
  'Ofis Malzemeleri': '📑',
  'Çip': '📟',
  'Regülatör': '⚙️',
  'Yarı İletken Anahtarlar': '🎛️',
  'Yarı İletken Bileşenler': '🔬',
  'Diğer': '📦',
};

/* ── Stat Kartı ─────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  trend?: number;
  icon: React.ReactNode;
  iconBg: string;
  isDark: boolean;
  isText?: boolean;
  subValue?: string;
}

const StatCard = ({ label, value, subLabel, trend, icon, iconBg, isDark, isText, subValue }: StatCardProps) => (
  <div className={`rounded-xl border p-4 flex flex-col min-w-0 transition-all duration-150
    ${isDark
      ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.14]'
      : 'bg-white border-slate-200/80 shadow-sm hover:border-amber-200/60 shadow-slate-900/[0.03]'
    }`}>
    <div className="flex items-start justify-between gap-2 mb-2.5">
      <p className={`text-xs font-semibold leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div className={`font-bold tracking-tight mb-1 ${isText ? 'text-base leading-tight line-clamp-2' : 'text-2xl font-mono'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {value}
    </div>
    {subValue && (
      <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subValue}</p>
    )}
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-[11px] font-semibold mt-0.5
        ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend >= 0
          ? <TrendingUp className="h-3 w-3" />
          : <TrendingDown className="h-3 w-3" />
        }
        <span>{trend >= 0 ? '+' : ''}{trend}% {trend >= 0 ? 'artış' : 'azalış'}</span>
      </div>
    )}
    {subLabel && !trend && (
      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subLabel}</p>
    )}
  </div>
);


/* ── Kritik Stok Progress Bar ───────────────────── */
const CriticalStockBar = ({ item, isDark }: { item: CriticalStockItem; isDark: boolean }) => {
  const pct = Math.min(100, Math.max(0, item.percentage));
  const barColor = pct <= 30 ? '#ef4444' : pct <= 60 ? '#f59e0b' : '#10b981';
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b last:border-0
      ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {item.name}
        </p>
        <div className={`mt-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>
      <span style={{ color: barColor }} className="text-xs font-bold font-mono shrink-0">
        {item.stockQuantity} adet
      </span>
    </div>
  );
};

/* ── Kategori Kartı ─────────────────────────────── */
const CategoryCard = ({ name, productCount, isDark }: { name: string; productCount: number; isDark: boolean }) => {
  const emoji = CAT_EMOJI_MAP[name] || '📦';
  return (
    <div className={`rounded-xl border p-3 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer btn-tactile h-full justify-center min-h-[96px]
      ${isDark
        ? 'bg-[#1e293b] border-white/[0.07] hover:border-amber-500/30 hover:bg-amber-500/5'
        : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 shadow-sm'
      }`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-2xl shrink-0
        ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
        {emoji}
      </div>
      <p className={`text-xs font-bold leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{name}</p>
      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{productCount} ürün</p>
    </div>
  );
};

/* ── Ana Dashboard ───────────────────────────────── */
export const DashboardPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Kategori Modal State
  const [createCatModalOpen, setCreateCatModalOpen] = useState(false);
  const [catNameInput, setCatNameInput] = useState('');
  const [catParentIdInput, setCatParentIdInput] = useState<string>('null');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 60000
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: getDashboardCharts,
    refetchInterval: 120000
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  // Kategori Ekleme Mutation
  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setCreateCatModalOpen(false);
      setCatNameInput('');
      setCatParentIdInput('null');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Kategori eklenirken hata oluştu');
    }
  });

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    createCatMutation.mutate({
      name: catNameInput.trim(),
      parentId: catParentIdInput === 'null' ? null : parseInt(catParentIdInput),
      icon: 'Package',
      color: 'slate-500',
      formSchema: []
    });
  };

  // Pie chart verisi
  const pieData = useMemo(() =>
    (charts?.categoryDistribution || [])
      .filter(c => c.productCount > 0)
      .map(c => ({
        name: c.categoryName,
        value: c.productCount,
        totalStock: c.totalStock
      })),
    [charts]
  );

  const totalProductsForPie = useMemo(() =>
    pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  );

  // Stat kartları config (5 Adet Kart - Toplam Ürün Çıkarıldı)
  const statCards = stats ? [
    {
      label: 'Toplam Stok',
      value: stats.totalStock.toLocaleString('tr-TR'),
      icon: <Box className="h-5 w-5 text-amber-500" />,
      iconBg: isDark ? 'bg-amber-500/10' : 'bg-amber-50'
    },
    {
      label: 'Kritik Stok',
      value: stats.lowStockCount,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50'
    },
    {
      label: 'Bugün Giriş',
      value: `${stats.todayIn.toLocaleString('tr-TR')} adet`,
      icon: <ArrowDown className="h-5 w-5 text-emerald-500" />,
      iconBg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
    },
    {
      label: 'Bugün Çıkış',
      value: `${stats.todayOut.toLocaleString('tr-TR')} adet`,
      icon: <ArrowUp className="h-5 w-5 text-violet-500" />,
      iconBg: isDark ? 'bg-violet-500/10' : 'bg-violet-50'
    },
    {
      label: 'En Çok Kullanılan',
      value: stats.mostUsedProduct?.name || '-',
      subValue: stats.mostUsedProduct ? `${stats.mostUsedProduct.quantity.toLocaleString('tr-TR')} adet stok` : undefined,
      icon: <Star className="h-5 w-5 text-amber-500" />,
      iconBg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      isText: true
    }
  ] : [];

  const isLoading = statsLoading || chartsLoading;

  /* ── Kategoriler (ana, parent olmayan) ─────────── */
  const parentCategories = useMemo(() =>
    (categories || [])
      .filter(c => !c.parentId)
      .map(cat => {
        const distItem = charts?.categoryDistribution.find(d => d.categoryName === cat.name);
        return { ...cat, productCount: distItem?.productCount || cat.productCount || 0 };
      })
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0)),
    [categories, charts]
  );

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-6">

      {/* ── Karşılama ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Hoş geldiniz, {user?.username} 👋
          </h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Depo stok durumunun genel özeti aşağıda listelenmiştir.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-4 rounded-xl gap-2 text-sm btn-tactile font-semibold"
          >
            <Link to="/product/new">
              <Plus className="h-4 w-4" /> Yeni Ürün
            </Link>
          </Button>
          <Button
            variant="outline"
            className="hidden md:flex h-10 px-4 rounded-xl gap-2 text-sm btn-tactile text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20"
            onClick={() => navigate('/search?type=in')}
          >
            <ArrowDownCircle className="h-4 w-4" /> Stok Girişi
          </Button>
          <Button
            variant="outline"
            className="hidden md:flex h-10 px-4 rounded-xl gap-2 text-sm btn-tactile text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
            onClick={() => navigate('/search?type=out')}
          >
            <ArrowUpCircle className="h-4 w-4" /> Stok Çıkışı
          </Button>
        </div>
      </div>

      {/* ── Stat Kartları (5 Adet Kart) ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card, i) => (
            <StatCard
              key={i}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconBg={card.iconBg}
              isDark={isDark}
              isText={card.isText}
              subValue={card.subValue}
            />
          ))}
        </div>
      )}

      {/* ── Ana İçerik Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_2.2fr_1.4fr] gap-4">

        {/* ─ Sol: Kategori Dağılımı Donut Chart ─ */}
        <div className={`rounded-xl border p-5 transition-all duration-150
          ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm shadow-slate-900/[0.03]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Kategori Dağılımı</h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full rounded" />)}
            </div>
          ) : (
            <div>
              {/* Donut */}
              <div className="relative flex justify-center mb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      dataKey="value"
                      strokeWidth={2}
                      stroke={isDark ? '#1e293b' : '#fff'}
                      label={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                      formatter={(value: any, name: any) => [`${value} ürün`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Donut merkez etiketi */}
                {totalProductsForPie > 0 && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ paddingBottom: 0 }}
                  >
                    <span
                      className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                      {totalProductsForPie.toLocaleString('tr-TR')}
                    </span>
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Toplam Ürün
                    </span>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-2">
                {pieData.slice(0, 6).map((item, index) => {
                  const pct = totalProductsForPie > 0 ? Math.round((item.value / totalProductsForPie) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>%{pct}</span>
                        <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({item.value})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─ Orta: Kategoriler Grid ─ */}
        <div className={`rounded-xl border p-5 transition-all duration-150
          ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm shadow-slate-900/[0.03]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Kategoriler</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 overflow-y-auto max-h-[420px] pr-1">
              {parentCategories.map(cat => (
                <Link key={cat.id} to={`/category/${cat.id}`}>
                  <CategoryCard
                    name={cat.name}
                    productCount={cat.productCount || 0}
                    isDark={isDark}
                  />
                </Link>
              ))}

              {/* ➕ Kategori Ekle Kartı (En Son) */}
              <div
                onClick={() => setCreateCatModalOpen(true)}
                className={`rounded-xl border border-dashed p-3 flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer btn-tactile min-h-[96px]
                  ${isDark
                    ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 text-amber-400'
                    : 'bg-amber-50/50 border-amber-300 hover:border-amber-400 hover:bg-amber-100/50 text-amber-800 shadow-sm'
                  }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl font-bold shrink-0
                  ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-200/70 text-amber-900'}`}>
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold leading-tight">Kategori Ekle</p>
                <p className={`text-[10px] ${isDark ? 'text-amber-400/70' : 'text-amber-700/80'}`}>+ Yeni Oluştur</p>
              </div>
            </div>
          )}
        </div>

        {/* ─ Sağ: Kritik Stok + Son Aktiviteler ─ */}
        <div className="space-y-4">
          {/* Kritik Stoklar */}
          <div className={`rounded-xl border p-5 transition-all duration-150
            ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm shadow-slate-900/[0.03]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Kritik Stoklar (İlk 5)
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}
              </div>
            ) : charts?.criticalStocks && charts.criticalStocks.length > 0 ? (
              <>
                <div>
                  {charts.criticalStocks.map(item => (
                    <Link key={item.id} to={`/product/${item.id}`}>
                      <CriticalStockBar item={item} isDark={isDark} />
                    </Link>
                  ))}
                </div>
                <Link
                  to="/search?lowStock=true"
                  className={`flex items-center gap-1 text-xs font-semibold mt-3 hover:underline
                    ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                >
                  Tümünü Görüntüle <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Kritik stok yok 🎉
              </p>
            )}
          </div>

          {/* Son Aktiviteler */}
          <div className={`rounded-xl border p-5 transition-all duration-150
            ${isDark ? 'bg-[#1e293b] border-white/[0.07]' : 'bg-white border-slate-200/80 shadow-sm shadow-slate-900/[0.03]'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Son Aktiviteler
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded" />)}
              </div>
            ) : charts?.recentMovements && charts.recentMovements.length > 0 ? (
              <>
                <div className="space-y-1">
                  {charts.recentMovements.slice(0, 5).map(mv => {
                    const isIn = mv.changeAmount > 0;
                    return (
                      <Link
                        key={mv.id}
                        to={`/product/${mv.productId}`}
                        className={`flex items-start gap-2.5 py-2 border-b last:border-0 transition-colors rounded-md px-1 -mx-1
                          ${isDark ? 'border-white/[0.05] hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-slate-50/70'}`}
                      >
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                          ${isIn
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            : isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
                          }`}>
                          {isIn ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {mv.product.name}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isIn ? 'Stok Girişi' : 'Stok Çıkışı'} · {isIn ? '+' : ''}{mv.changeAmount} adet
                          </p>
                        </div>
                        <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(mv.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  to="/search"
                  className={`flex items-center gap-1 text-xs font-semibold mt-3 hover:underline
                    ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                >
                  Tümünü Görüntüle <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Henüz stok hareketi yok
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Kategori Ekleme Modalı ── */}
      {createCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <Card className={`w-full max-w-md rounded-2xl shadow-2xl border
            ${isDark ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-amber-500" /> Yeni Kategori Ekle
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setCreateCatModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Kategori Adı *</Label>
                  <Input
                    placeholder="Örn: Entegre, Transistör, Çip..."
                    value={catNameInput}
                    onChange={e => setCatNameInput(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Üst Kategori</Label>
                  <Select value={catParentIdInput} onValueChange={setCatParentIdInput}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Ana Kategori (Yok)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Ana Kategori (Yok)</SelectItem>
                      {categories?.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <Button
                    variant="outline"
                    type="button"
                    className="h-9 text-xs"
                    onClick={() => setCreateCatModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-white h-9 text-xs font-semibold px-4"
                    disabled={createCatMutation.isPending}
                  >
                    {createCatMutation.isPending ? 'Ekleniyor...' : 'Kategori Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};
