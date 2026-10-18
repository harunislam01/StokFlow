import { Link } from 'react-router-dom';
import {
  Box, FolderTree, Tags, Truck, BarChart3, History, Construction
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ComingSoonShell = ({ title, description, icon: Icon }: ComingSoonProps) => (
  <div className="max-w-2xl mx-auto py-10 sm:py-16">
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] p-8 sm:p-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-4">
        <Construction className="h-3.5 w-3.5" />
        Yapım Aşamasında
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      <Button asChild className="mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-sm shadow-blue-600/20">
        <Link to="/">Ana Sayfaya Dön</Link>
      </Button>
    </Card>
  </div>
);

export const StockPage = () => (
  <ComingSoonShell
    title="Stok"
    description="Stok özeti ve depo görünümü yakında burada olacak. Şimdilik ürün detayından stok giriş/çıkış işlemlerini kullanabilirsiniz."
    icon={Box}
  />
);

export const CategoriesListPage = () => (
  <ComingSoonShell
    title="Kategoriler"
    description="Tüm kategorilerin listeleneceği sayfa yapım aşamasındadır. Ana sayfadaki kategori kartlarından mevcut listelere ulaşabilirsiniz."
    icon={FolderTree}
  />
);

export const ProductsListPage = () => (
  <ComingSoonShell
    title="Ürünler"
    description="Toplu ürün listesi yakında eklenecek. Şimdilik bir kategoriye girerek veya arama sayfasından ürünlere ulaşabilirsiniz."
    icon={Tags}
  />
);

export const SuppliersPage = () => (
  <ComingSoonShell
    title="Tedarikçiler"
    description="Tedarikçi yönetimi modülü henüz hazır değil. Bu sayfa mavi/beyaz temaya uygun şekilde yakında tamamlanacak."
    icon={Truck}
  />
);

export const ReportsPage = () => (
  <ComingSoonShell
    title="Raporlar"
    description="Raporlar sayfası yapım aşamasındadır. Stok ve hareket özetleri için şimdilik ana sayfadaki paneli kullanabilirsiniz."
    icon={BarChart3}
  />
);

export const MovementsPage = () => (
  <ComingSoonShell
    title="Hareketler"
    description="Tüm stok hareketlerinin listeleneceği sayfa yakında gelecek. Ürün detayında ilgili ürünün geçmişini şimdiden görebilirsiniz."
    icon={History}
  />
);
