import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllStock } from '../api/stock';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search, Box, AlertTriangle, PackageOpen } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';

export const StockPage = () => {
    const [search, setSearch] = useState('');

    const { data: products, isLoading } = useQuery({
        queryKey: ['all-stock'],
        queryFn: getAllStock,
    });

    // Arama filtresi
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!search) return products;
        const lowerSearch = search.toLowerCase();
        return products.filter((p: any) =>
            p.name.toLowerCase().includes(lowerSearch) ||
            p.productCode.toLowerCase().includes(lowerSearch) ||
            (p.category?.name && p.category.name.toLowerCase().includes(lowerSearch))
        );
    }, [products, search]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pt-4">
            {/* Sayfa Başlığı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Box className="h-6 w-6 text-blue-600" /> Stok Durumu
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Tüm ürünlerin güncel stok seviyelerini görüntüleyin.</p>
                </div>
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Ürün adı, kodu veya kategori ara..."
                            className="pl-10 h-11 rounded-xl bg-white border-slate-200 focus-visible:ring-blue-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <PackageOpen className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Ürün Bulunamadı</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {search ? 'Arama kriterlerinize uygun sonuç yok.' : 'Sistemde henüz kayıtlı ürün yok.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="font-semibold text-slate-600 w-[30%]">Ürün Adı</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Ürün Kodu</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Kategori</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Tedarikçi</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Mevcut Stok</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Durum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product: any) => {
                                        const isLowStock = product.stockQuantity <= product.minimumStock;
                                        return (
                                            <TableRow key={product.id} className="hover:bg-blue-50/30 transition-colors">
                                                <TableCell className="font-semibold text-slate-800">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-slate-500">
                                                    {product.productCode}
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    {product.category?.name || '-'}
                                                </TableCell>
                                                <TableCell className="text-slate-600">
                                                    {product.supplier?.name || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`text-lg font-bold font-mono ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>
                                                        {product.stockQuantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isLowStock ? (
                                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 shadow-none border-0 gap-1 px-2.5 py-1">
                                                            <AlertTriangle className="h-3 w-3" /> Kritik
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none px-2.5 py-1">
                                                            Yeterli
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};