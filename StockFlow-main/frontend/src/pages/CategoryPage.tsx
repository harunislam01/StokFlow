import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as Icons from 'lucide-react';
import { getCategories, getProducts } from '../api/products';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Plus, Filter, Package } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useTheme } from '../context/ThemeProvider';
import { useVirtualizer } from '@tanstack/react-virtual';

export const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: categories, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', categoryId, searchTerm],
    queryFn: () => getProducts({ categoryId, search: searchTerm }),
  });

  const category = categories?.find((c) => c.id === categoryId);
  const subCategories = categories?.filter((c) => c.parentId === categoryId) || [];
  const IconComponent = category ? (Icons[category.icon as keyof typeof Icons] as React.ElementType) : null;

  const [columns, setColumns] = useState(1);

  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setColumns(3);
      } else if (width >= 640) {
        setColumns(2);
      } else {
        setColumns(1);
      }
    };
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const rows = React.useMemo(() => {
    const chunked = [];
    if (!products) return [];
    for (let i = 0; i < products.length; i += columns) {
      chunked.push(products.slice(i, i + columns));
    }
    return chunked;
  }, [products, columns]);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => document.querySelector('main'),
    estimateSize: () => 260,
    overscan: 5,
  });

  return (
    <div className="space-y-6 anim-number-tick max-w-[1400px] mx-auto pb-10">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isLoadingCats ? (
            <Skeleton className="h-12 w-12 rounded-xl" />
          ) : (
            category && (
              <div className={`p-3 rounded-xl bg-amber-500/10`}>
                {IconComponent && <IconComponent className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
              </div>
            )
          )}
          <div>
            {isLoadingCats ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{category?.name}</h1>
            )}
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ürün Listesi</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white rounded-md btn-tactile min-h-[48px] px-5">
            <Link to={`/category/${categoryId}/new`}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
            </Link>
          </Button>
        </div>
      </div>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="mb-6">
          <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Alt Kategoriler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {subCategories.map((cat) => {
              const IconComponent = Icons[cat.icon as keyof typeof Icons] as React.ElementType;
              return (
                <Link key={cat.id} to={`/category/${cat.id}`} className="min-h-[48px] flex">
                  <Card className={`rounded-xl border shadow-sm transition-all duration-150 p-4 w-full flex flex-col justify-center items-center text-center group cursor-pointer hover:shadow-md btn-tactile
                    ${isDark
                      ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.14]'
                      : 'bg-white border-slate-200/80 hover:border-amber-200'
                    }`}>
                    <div className="p-3 rounded-md bg-amber-500/10 mb-3 group-hover:scale-105 transition-transform duration-150">
                      {IconComponent && <IconComponent className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <h3 className={`font-semibold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cat.name}</h3>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder={`${category?.name || 'Kategori'} içinde ara...`}
            /* text-base (16px) prevents iOS automatic zoom on focus */
            className={`pl-11 pr-4 h-12 text-base rounded-sm shadow-sm border
              ${isDark 
                ? 'bg-[#1e293b] border-white/[0.07] text-white focus:border-amber-500/50' 
                : 'bg-white border-slate-200/80 text-slate-900 focus:border-amber-500/50'
              }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className={`shrink-0 h-12 rounded-sm btn-tactile min-h-[48px] px-4 border
          ${isDark
            ? 'bg-[#1e293b] border-white/[0.07] text-slate-300 hover:bg-white/[0.05]'
            : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
          }`}>
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline-block">Filtrele</span>
        </Button>
      </div>

      {/* Product List */}
      {isLoadingProducts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border border-dashed shadow-xs
          ${isDark
            ? 'bg-[#1e293b]/40 border-white/[0.07]'
            : 'bg-white border-slate-300/50'
          }`}>
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Ürün Bulunamadı</h3>
          <p className={`text-sm mt-1 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bu kategoriye ait ürün bulunmuyor veya arama kriterleriniz eşleşmiyor.</p>
          <Button asChild variant="outline" className="min-h-[48px] btn-tactile">
            <Link to={`/category/${categoryId}/new`}>
              <Plus className="mr-2 h-4 w-4" /> İlk Ürünü Ekle
            </Link>
          </Button>
        </div>
      ) : (
        <div
          ref={parentRef}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowProducts = rows[virtualRow.index];
            if (!rowProducts) return null;
            return (
              <div
                key={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: '16px',
                }}
                className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              >
                {rowProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`} className="min-h-[48px] flex h-full">
                    <Card className={`p-5 rounded-xl border shadow-sm transition-all duration-150 w-full flex flex-col group hover:shadow-md btn-tactile
                      ${isDark
                        ? 'bg-[#1e293b] border-white/[0.07] hover:border-white/[0.12]'
                        : 'bg-white border-slate-200/80 hover:border-amber-200'
                      }`}>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className={`font-mono font-bold text-base sm:text-lg text-amber-600 dark:text-amber-400 group-hover:underline line-clamp-1 transition-colors`}>
                          {product.productCode}
                        </h3>
                        {product.stockQuantity <= (product.minimumStock || 0) && (
                          <span className="px-2 py-0.5 rounded-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] sm:text-xs font-bold shrink-0">
                            Kritik Stok
                          </span>
                        )}
                      </div>
                      
                      {(() => {
                        const displayDescription = product.description && product.attributes?.resistance && !product.description.includes('Direnç Değeri:')
                          ? `Direnç Değeri: ${product.attributes.resistance}, ${product.description}`
                          : (product.description || 'Açıklama yok');
                        return (
                          <p className={`text-xs sm:text-sm mb-4 line-clamp-2 flex-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {displayDescription}
                          </p>
                        );
                      })()}
                      
                      <div className={`grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs mb-4 p-3 rounded-md border min-h-[56px] font-mono
                        ${isDark
                          ? 'bg-slate-800/40 border-white/[0.05] text-slate-300'
                          : 'bg-slate-50/50 border-slate-200/50 text-slate-600'
                        }`}>
                        {product.location && <div className="truncate"><span className="font-semibold">Konum:</span> {product.location}</div>}
                        {product.attributes?.resistance && <div className="truncate"><span className="font-semibold">Direnç:</span> {product.attributes.resistance}</div>}
                        {product.attributes?.package && <div className="truncate"><span className="font-semibold">Kılıf:</span> {product.attributes.package}</div>}
                        {product.attributes?.tolerance && <div className="truncate"><span className="font-semibold">Tolerans:</span> {product.attributes.tolerance}</div>}
                        {product.materialCode && !product.attributes?.resistance && <div className="truncate"><span className="font-semibold">Kod:</span> {product.materialCode}</div>}
                      </div>
                      
                      <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                        <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stok Miktarı</span>
                        <span className={`text-base sm:text-lg font-mono font-bold ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {product.stockQuantity}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Floating Action Button (Thumb-Zone accessible) */}
      <Button asChild className="sm:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-amber-600 hover:bg-amber-700 p-0 z-40 btn-tactile">
        <Link to={`/category/${categoryId}/new`} className="flex items-center justify-center">
          <Plus className="h-6 w-6 text-white" />
        </Link>
      </Button>
    </div>
  );
};
