import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '../api/products';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search as SearchIcon, Package2 } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useDebounce } from '../lib/hooks';

export const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'search', debouncedSearchTerm],
    queryFn: () => getProducts({ search: debouncedSearchTerm }),
    enabled: debouncedSearchTerm.length > 0,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ara</h1>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          autoFocus
          placeholder="Tüm stokta ara (kod, kılıf no, açıklama)..."
          /* text-base (16px) prevents iOS Safari auto zoom on focus */
          className="pl-12 h-14 text-base rounded-xl shadow-sm border border-slate-200/80 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="pt-4">
        {searchTerm.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Arama Yapın</h3>
            <p className="text-sm mt-1 text-slate-500">Aramaya başlamak için bir şeyler yazın</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm">
            <Package2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Sonuç Bulunamadı</h3>
            <p className="text-sm mt-1 text-slate-500">"{searchTerm}" için eşleşen bir ürün yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold mb-4 text-slate-500">{products?.length} sonuç bulundu</p>
            {products?.map((product) => {
              const category = categories?.find(c => c.id === product.categoryId);
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="min-h-[48px] flex">
                  <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-150 w-full flex items-center gap-4 group hover:shadow-md hover:border-blue-200 btn-tactile">
                    <div className="p-3 rounded-xl bg-blue-50 hidden sm:block">
                      <Package2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-mono font-bold text-lg text-blue-600 group-hover:underline truncate transition-colors">
                          {product.productCode}
                        </h3>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-bold bg-slate-100 text-slate-600">
                          {category?.name}
                        </span>
                      </div>
                      <p className="text-sm truncate text-slate-500">
                        {product.attributes?.resistance && !product.description?.includes('Direnç Değeri:')
                          ? `Direnç Değeri: ${product.attributes.resistance}, ${product.description || ''}`
                          : (product.description || 'Açıklama yok')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-mono font-bold ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-600' : 'text-slate-900'}`}>
                        {product.stockQuantity}
                      </div>
                      <div className="text-xs text-slate-400">Adet</div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
