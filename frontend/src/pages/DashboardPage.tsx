import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getDashboardCharts, type CriticalStockItem } from '../api/dashboard';
// import { getCategories } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Plus, ArrowUpCircle, ArrowDownCircle,
  Box, AlertTriangle,
  ChevronRight, ArrowDown, ArrowUp
} from 'lucide-react';

const PIE_COLORS = [
  '#3b82f6', '#06b6d4', '#f59e0b', '#8b5cf6',
  '#64748b', '#10b981', '#f43f5e', '#a855f7'
];

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ label, value, icon, iconBg }: StatCardProps) => (
  <div className="rounded-xl border p-4 flex flex-col min-w-0 transition-all duration-150 bg-white border-slate-200/80 shadow-sm hover:border-blue-200/60 shadow-slate-900/[0.03]">
    <div className="flex items-start justify-between gap-2 mb-2.5">
      <p className="text-xs font-semibold leading-tight text-slate-500">{label}</p>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
    </div>
    <div className="font-bold tracking-tight mb-1 text-2xl font-mono text-slate-900">{value}</div>
  </div>
);

const CriticalStockBar = ({ item }: { item: CriticalStockItem }) => {
  const pct = Math.min(100, Math.max(0, item.percentage));
  const barColor = pct <= 30 ? '#ef4444' : pct <= 60 ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0 border-slate-100">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate text-slate-800">{item.name}</p>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </div>
      </div>
      <span style={{ color: barColor }} className="text-xs font-bold font-mono shrink-0">{item.stockQuantity} adet</span>
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const pieData = useMemo(() =>
    (charts?.categoryDistribution || [])
      .filter(c => c.productCount > 0)
      .map(c => ({ name: c.categoryName, value: c.productCount, totalStock: c.totalStock })),
    [charts]
  );

  const totalProductsForPie = useMemo(() => pieData.reduce((sum, d) => sum + d.value, 0), [pieData]);

  const statCards = stats ? [
    { label: 'Toplam Stok', value: stats.totalStock.toLocaleString('tr-TR'), icon: <Box className="h-5 w-5 text-blue-600" />, iconBg: 'bg-blue-50' },
    { label: 'Kritik Stok', value: stats.lowStockCount, icon: <AlertTriangle className="h-5 w-5 text-red-500" />, iconBg: 'bg-red-50' },
    { label: 'Bugün Giriş', value: `${stats.todayIn.toLocaleString('tr-TR')} adet`, icon: <ArrowDown className="h-5 w-5 text-emerald-500" />, iconBg: 'bg-emerald-50' },
    { label: 'Bugün Çıkış', value: `${stats.todayOut.toLocaleString('tr-TR')} adet`, icon: <ArrowUp className="h-5 w-5 text-indigo-500" />, iconBg: 'bg-indigo-50' }
  ] : [];

  const isLoading = statsLoading || chartsLoading;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-6 bg-slate-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Hoş geldiniz, {user?.username} 👋</h1>
          <p className="text-sm mt-0.5 text-slate-500">Depo stok durumunun genel özeti aşağıda listelenmiştir.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-xl gap-2 text-sm btn-tactile font-semibold">
            <Link to="/product/new"><Plus className="h-4 w-4" /> Yeni Ürün</Link>
          </Button>
          <Button variant="outline" className="hidden md:flex h-10 px-4 rounded-xl gap-2 text-sm btn-tactile text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate('/search?type=in')}>
            <ArrowDownCircle className="h-4 w-4" /> Stok Girişi
          </Button>
          <Button variant="outline" className="hidden md:flex h-10 px-4 rounded-xl gap-2 text-sm btn-tactile text-red-500 border-red-200 hover:bg-red-50" onClick={() => navigate('/search?type=out')}>
            <ArrowUpCircle className="h-4 w-4" /> Stok Çıkışı
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card, i) => <StatCard key={i} {...card} />)}
        </div>
      )}

      {/* 3 Sütunlu Yapıyı 2 Sütunlu (Grafik ve Hareketler) Yapıya Çevirdik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sol: Kategori Dağılımı */}
        <div className="rounded-xl border p-5 bg-white border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Kategori Dağılımı</h2>
          </div>
          {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : (
            <div>
              <div className="relative flex justify-center mb-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" strokeWidth={2} stroke="#fff" label={false}>
                      {pieData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(value: any, name: any) => [`${value} ürün`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {totalProductsForPie > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold font-mono text-slate-900">{totalProductsForPie.toLocaleString('tr-TR')}</span>
                    <span className="text-[10px] font-semibold text-slate-500">Toplam Ürün</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {pieData.slice(0, 6).map((item, index) => {
                  const pct = totalProductsForPie > 0 ? Math.round((item.value / totalProductsForPie) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-xs font-medium text-slate-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">%{pct}</span>
                        <span className="text-xs font-mono text-slate-400">({item.value})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Kritik Stok ve Son Aktiviteler Birleşik */}
        <div className="space-y-4">
          <div className="rounded-xl border p-5 bg-white border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-slate-800"><AlertTriangle className="h-4 w-4 text-red-500" /> Kritik Stok Uyarıları</h2>
            </div>
            {isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}</div> :
              charts?.criticalStocks && charts.criticalStocks.length > 0 ? (
                <>
                  <div>{charts.criticalStocks.map(item => <Link key={item.id} to={`/product/${item.id}`}><CriticalStockBar item={item} /></Link>)}</div>
                  <Link to="/search?lowStock=true" className="flex items-center gap-1 text-xs font-semibold mt-3 hover:underline text-blue-600">Tümünü Görüntüle <ChevronRight className="h-3.5 w-3.5" /></Link>
                </>
              ) : <p className="text-xs text-center py-4 text-slate-400">Kritik stok yok 🎉</p>}
          </div>

          <div className="rounded-xl border p-5 bg-white border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Son Hareketler</h2>
            </div>
            {isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded" />)}</div> :
              charts?.recentMovements && charts.recentMovements.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {charts.recentMovements.slice(0, 4).map(mv => {
                      const isIn = mv.changeAmount > 0;
                      return (
                        <Link key={mv.id} to={`/product/${mv.productId}`} className="flex items-start gap-2.5 py-2 border-b last:border-0 border-slate-100 hover:bg-slate-50/70 rounded-md px-1 -mx-1 transition-colors">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {isIn ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-slate-800">{mv.product.name}</p>
                            <p className="text-[10px] text-slate-400">{isIn ? 'Stok Girişi' : 'Stok Çıkışı'} · {isIn ? '+' : ''}{mv.changeAmount} adet</p>
                          </div>
                          <span className="text-[10px] font-mono shrink-0 text-slate-400">{new Date(mv.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </Link>
                      );
                    })}
                  </div>
                  <Link to="/search" className="flex items-center gap-1 text-xs font-semibold mt-3 hover:underline text-blue-600">Tümünü Görüntüle <ChevronRight className="h-3.5 w-3.5" /></Link>
                </>
              ) : <p className="text-xs text-center py-4 text-slate-400">Henüz stok hareketi yok</p>}
          </div>
        </div>
      </div>
    </div>
  );
};