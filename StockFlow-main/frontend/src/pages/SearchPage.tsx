import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '../api/products';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search as SearchIcon, Package2 } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useDebounce } from '../lib/hooks';
import { useTheme } from '../context/ThemeProvider';

export const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Ara</h1>
      
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <Input 
          autoFocus
          placeholder="Tüm stokta ara (kod, kılıf no, açıklama)..." 
          /* text-base (16px) prevents iOS Safari auto zoom on focus */
          className={`pl-12 h-14 text-base shadow-sm border rounded-sm transition-all duration-150
            ${isDark 
              ? 'bg-[#1e293b] border-white/[0.07] text-white focus:border-amber-500/50' 
              : 'bg-white border-slate-200/80 text-slate-900 focus:border-amber-500/50'
            }`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="pt-4">
        {searchTerm.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Arama Yapın</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aramaya başlamak için bir şeyler yazın</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border border-dashed shadow-xs
            ${isDark
              ? 'bg-[#1e293b]/40 border-white/[0.07]'
              : 'bg-white border-slate-300/50'
            }`}>
            <Package2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Sonuç Bulunamadı</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>"{searchTerm}" için eşleşen bir ürün yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{products?.length} sonuç bulundu</p>
            {products?.map((product) => {
              const category = categories?.find(c => c.id === product.categoryId);
              return (
                <Link key={product.id} to={`/product/${product.id}`} className="min-h-[48px] flex">
                  <Card className={`p-5 rounded-xl border shadow-sm transition-all duration-150 w-full flex items-center gap-4 group hover:shadow-md btn-tactile
                    ${isDark
                      ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.12]'
                      : 'bg-white border-slate-200/80 hover:border-amber-200'
                    }`}>
                    <div className="p-3 rounded-md bg-amber-500/10 hidden sm:block">
                      <Package2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className={`font-mono font-bold text-lg text-amber-600 dark:text-amber-400 group-hover:underline truncate transition-colors`}>
                          {product.productCode}
                        </h3>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-bold
                          ${isDark 
                            ? 'bg-white/[0.06] text-slate-300' 
                            : 'bg-slate-100 text-slate-600'}`}>
                          {category?.name}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {product.attributes?.resistance && !product.description?.includes('Direnç Değeri:')
                          ? `Direnç Değeri: ${product.attributes.resistance}, ${product.description || ''}`
                          : (product.description || 'Açıklama yok')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-mono font-bold ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {product.stockQuantity}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Adet</div>
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
