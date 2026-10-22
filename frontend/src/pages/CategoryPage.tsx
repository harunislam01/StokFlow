import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Icons from 'lucide-react';
import { getCategories, getProducts, createCategory } from '../api/products';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Search, Plus, Filter, Package, X, FolderTree } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useVirtualizer } from '@tanstack/react-virtual';

export const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Alt Kategori Ekleme State
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
  const [subCatName, setSubCatName] = useState('');

  const { data: categories, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', categoryId, searchTerm],
    queryFn: () => getProducts({ categoryId, search: searchTerm }),
  });

  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsSubCatModalOpen(false);
      setSubCatName('');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Alt kategori eklenirken hata oluştu')
  });

  const handleSaveSubCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatName.trim()) return;
    createCatMutation.mutate({
      name: subCatName.trim(),
      parentId: categoryId, // Otomatik olarak mevcut kategorinin altına ekler
      icon: 'Package',
      color: 'slate-500',
      formSchema: []
    });
  };

  const category = categories?.find((c) => c.id === categoryId);
  const subCategories = categories?.filter((c) => c.parentId === categoryId) || [];
  const IconComponent = category ? (Icons[category.icon as keyof typeof Icons] as React.ElementType) : null;

  const [columns, setColumns] = useState(1);

  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1024) setColumns(3);
      else if (width >= 640) setColumns(2);
      else setColumns(1);
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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => document.querySelector('main'),
    estimateSize: () => 120,
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
            {isLoadingCats ? <Skeleton className="h-8 w-40" /> : <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{category?.name}</h1>}
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

      {/* Subcategories (Alt Kategoriler) */}
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

          {/* YENİ: Alt Kategori Ekle Butonu (Kart Görünümünde) */}
          <div
            onClick={() => setIsSubCatModalOpen(true)}
            className="rounded-2xl border border-dashed p-4 flex flex-col justify-center items-center text-center gap-1.5 transition-all cursor-pointer btn-tactile min-h-[96px] bg-blue-50/50 border-blue-300 hover:border-blue-400 hover:bg-blue-100/50 text-blue-800 shadow-sm"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl font-bold shrink-0 bg-blue-200/70 text-blue-900 mb-1">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold leading-tight">Alt Kategori Ekle</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder={`${category?.name || 'Kategori'} içinde ara...`}
            className="pl-11 pr-4 h-12 text-base rounded-xl shadow-sm border border-slate-200/80 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="shrink-0 h-12 rounded-xl btn-tactile min-h-[48px] px-4 border border-slate-200/80 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-sm">
          <Filter className="h-4 w-4 mr-2" /><span className="hidden sm:inline-block">Filtrele</span>
        </Button>
      </div>

      {/* Product List */}
      {isLoadingProducts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Ürün Bulunamadı</h3>
          <p className="text-sm mt-1 mb-4 text-slate-500">Bu kategoriye ait ürün bulunmuyor veya arama kriterleriniz eşleşmiyor.</p>
        </div>
      ) : (
        <div ref={rowVirtualizer.containerRef} style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowProducts = rows[virtualRow.index];
            if (!rowProducts) return null;
            return (
              <div key={virtualRow.index} ref={rowVirtualizer.measureElement} data-index={virtualRow.index} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start}px)`, paddingBottom: '16px' }} className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rowProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`} className="min-h-[48px] flex h-full">
                    <Card className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.04] transition-all duration-150 w-full flex items-center group hover:shadow-md hover:border-blue-300 btn-tactile">
                      <div className="h-14 w-14 shrink-0 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center mr-4 overflow-hidden group-hover:border-blue-200 transition-colors">
                        <Package className="h-6 w-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate mb-0.5 group-hover:text-blue-700 transition-colors">{product.name}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-mono font-medium truncate">{product.productCode}</p>
                      </div>
                      <div className="ml-3 flex flex-col items-end shrink-0 pl-3 border-l border-slate-100">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Stok</span>
                        <span className={`text-lg font-bold font-mono ${product.stockQuantity <= (product.minimumStock || 0) ? 'text-red-500' : 'text-slate-900'}`}>{product.stockQuantity}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <Button asChild className="sm:hidden fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 p-0 z-40 btn-tactile">
        <Link to={`/category/${categoryId}/new`} className="flex items-center justify-center"><Plus className="h-6 w-6 text-white" /></Link>
      </Button>

      {/* YENİ: Alt Kategori Ekleme Modalı (Portal ile) */}
      {isSubCatModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FolderTree className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Alt Kategori Ekle</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">{category?.name} altına eklenecek.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200" onClick={() => setIsSubCatModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleSaveSubCat} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Kategori Adı <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Örn: SMD, THT, 0805..."
                    value={subCatName}
                    onChange={e => setSubCatName(e.target.value)}
                    required
                    autoFocus
                    className="h-12 text-base rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-600 focus-visible:bg-white transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-2">
                  <Button variant="outline" type="button" className="h-11 text-sm rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setIsSubCatModalOpen(false)}>İptal</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-semibold px-6 rounded-xl shadow-sm shadow-blue-600/20" disabled={createCatMutation.isPending}>
                    {createCatMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
};