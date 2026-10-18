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
import { useVirtualizer } from '@tanstack/react-virtual';

export const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const [searchTerm, setSearchTerm] = useState('');

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
              <div className="p-3 rounded-xl bg-blue-50">
                {IconComponent && <IconComponent className="h-6 w-6 text-blue-600" />}
              </div>
            )
          )}
          <div>
            {isLoadingCats ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{category?.name}</h1>
            )}
            <p className="text-xs sm:text-sm text-slate-500">Ürün Listesi</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-600/20 btn-tactile min-h-[48px] px-5">
            <Link to={`/category/${categoryId}/new`}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
            </Link>
          </Button>
        </div>
      </div>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 text-slate-800">Alt Kategoriler</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {subCategories.map((cat) => {
              const SubIcon = Icons[cat.icon as keyof typeof Icons] as React.ElementType;
              return (
                <Link key={cat.id} to={`/category/${cat.id}`} className="min-h-[48px] flex">
                  <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-150 p-4 w-full flex flex-col justify-center items-center text-center group cursor-pointer hover:shadow-md hover:border-blue-200 btn-tactile">
                    <div className="p-3 rounded-xl bg-blue-50 mb-3 group-hover:scale-105 transition-transform duration-150">
                      {SubIcon && <SubIcon className="h-6 w-6 text-blue-600" />}
                    </div>
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-800">{cat.name}</h3>
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
            className="pl-11 pr-4 h-12 text-base rounded-xl shadow-sm border border-slate-200/80 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="shrink-0 h-12 rounded-xl btn-tactile min-h-[48px] px-4 border border-slate-200/80 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm"
        >
          <Filter className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline-block">Filtrele</span>
        </Button>
      </div>

      {/* Product List */}
      {isLoadingProducts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Ürün Bulunamadı</h3>
          <p className="text-sm mt-1 mb-4 text-slate-500">Bu kategoriye ait ürün bulunmuyor veya arama kriterleriniz eşleşmiyor.</p>
          <Button asChild className="min-h-[48px] btn-tactile bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
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
                    <Card className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-150 w-full flex flex-col group hover:shadow-md hover:border-blue-200 btn-tactile">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="font-mono font-bold text-base sm:text-lg text-blue-600 group-hover:underline line-clamp-1 transition-colors">
                          {product.productCode}
                        </h3>
                        {product.stockQuantity <= (product.minimumStock || 0) && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] sm:text-xs font-bold shrink-0">
                            Kritik Stok
                          </span>
                        )}
                      </div>

                      {(() => {
                        const displayDescription = product.description && product.attributes?.resistance && !product.description.includes('Direnç Değeri:')
                          ? `Direnç Değeri: ${product.attributes.resistance}, ${product.description}`
                          : (product.description || 'Açıklama yok');
                        return (
                          <p className="text-xs sm:text-sm mb-4 line-clamp-2 flex-1 text-slate-500">
                            {displayDescription}
                          </p>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs mb-4 p-3 rounded-xl border min-h-[56px] font-mono bg-slate-50 border-slate-100 text-slate-600">
                        {product.location && <div className="truncate"><span className="font-semibold">Konum:</span> {product.location}</div>}
                        {product.attributes?.resistance && <div className="truncate"><span className="font-semibold">Direnç:</span> {product.attributes.resistance}</div>}
                        {product.attributes?.package && <div className="truncate"><span className="font-semibold">Kılıf:</span> {product.attributes.package}</div>}
                        {product.attributes?.tolerance && <div className="truncate"><span className="font-semibold">Tolerans:</span> {product.attributes.tolerance}</div>}
                        {product.materialCode && !product.attributes?.resistance && <div className="truncate"><span className="font-semibold">Kod:</span> {product.materialCode}</div>}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                        <span className="text-xs sm:text-sm font-semibold text-slate-500">Stok Miktarı</span>
                        <span className={`text-base sm:text-lg font-mono font-bold ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-600' : 'text-slate-900'}`}>
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
      <Button asChild className="sm:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 p-0 z-40 btn-tactile">
        <Link to={`/category/${categoryId}/new`} className="flex items-center justify-center">
          <Plus className="h-6 w-6 text-white" />
        </Link>
      </Button>
    </div>
  );
};
