import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts, getCategories } from '../api/products';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Search as SearchIcon, Package, Tags, X } from 'lucide-react';

export const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => getProducts(),
  });

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories?.forEach(cat => map.set(cat.id, cat.name));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) => {
      const haystack = [
        product.productCode,
        product.name,
        product.materialCode,
        product.description,
        product.location,
        categoryMap.get(product.categoryId),
        product.attributes ? Object.values(product.attributes).join(' ') : '',
      ];

      return haystack.some(value => value?.toLowerCase().includes(term));
    });
  }, [products, searchTerm, categoryMap]);

  return (
    <div className="space-y-6 anim-number-tick max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-blue-50">
          <Tags className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Ürünler</h1>
          <p className="text-xs sm:text-sm text-slate-500">Tüm ürünlerin listesi</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          placeholder="Tüm ürünlerde ara (kod, isim, konum, açıklama)..."
          className="pl-11 pr-11 h-12 text-base rounded-xl shadow-sm border border-slate-200/80 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            aria-label="Aramayı temizle"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            {searchTerm.trim() ? 'Sonuç Bulunamadı' : 'Henüz Ürün Yok'}
          </h3>
          <p className="text-sm mt-1 text-slate-500">
            {searchTerm.trim()
              ? `"${searchTerm.trim()}" için eşleşen bir ürün yok.`
              : 'Sisteme kayıtlı ürün bulunmuyor.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-500">
            {searchTerm.trim() ? `${filteredProducts.length} sonuç bulundu` : `${filteredProducts.length} ürün`}
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="min-h-[48px] flex h-full">
                <Card className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-150 w-full flex items-center group hover:shadow-md hover:border-blue-300 btn-tactile">
                  <div className="h-14 w-14 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mr-4 overflow-hidden group-hover:border-blue-200 transition-colors">
                    {(product as any).imageUrl ? (
                      <img
                        src={(product as any).imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-mono font-bold text-sm sm:text-base text-blue-600 group-hover:underline truncate transition-colors">
                        {product.productCode}
                      </h3>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-bold bg-slate-100 text-slate-600">
                        {categoryMap.get(product.categoryId) || 'Kategorisiz'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {product.description || 'Açıklama yok'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className={`text-lg font-mono font-bold ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-600' : 'text-slate-900'}`}>
                      {product.stockQuantity}
                    </div>
                    <div className="text-xs text-slate-400">Adet</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
