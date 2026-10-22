import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '../api/products';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FolderTree, Plus, X } from 'lucide-react';
import * as Icons from 'lucide-react';

export const CategoryListPage = () => {
    const queryClient = useQueryClient();
    const [createCatModalOpen, setCreateCatModalOpen] = useState(false);
    const [catNameInput, setCatNameInput] = useState('');
    const [catParentIdInput, setCatParentIdInput] = useState<string>('null');

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    // Dashboard'dan taşınan Kategori Ekleme Mutation'ı
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
            icon: 'Package', // Varsayılan ikon
            color: 'slate-500',
            formSchema: []
        });
    };

    const parentCategories = categories?.filter(c => !c.parentId) || [];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10 pt-4 anim-number-tick">
            {/* Sayfa Başlığı */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <FolderTree className="h-6 w-6 text-blue-600" />
                        Kategoriler
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Tüm ürün kategorilerini görüntüleyin ve yönetin.
                    </p>
                </div>
                <button
                    onClick={() => setCreateCatModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors btn-tactile"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Kategori
                </button>
            </div>

            {/* Kategoriler Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
            ) : parentCategories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                    <FolderTree className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">Henüz Kategori Yok</h3>
                    <p className="text-sm text-slate-500 mt-1">Sisteme henüz bir kategori eklenmemiş.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {parentCategories.map((cat) => {
                        const IconComponent = cat.icon ? (Icons[cat.icon as keyof typeof Icons] as React.ElementType) : Icons.Package;
                        return (
                            <Link key={cat.id} to={`/category/${cat.id}`} className="flex h-full">
                                <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-150 flex flex-col items-center justify-center text-center group cursor-pointer btn-tactile">
                                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-100 transition-all duration-150">
                                        {IconComponent && <IconComponent className="h-7 w-7 text-blue-600" />}
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                        {cat.name}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                        {cat.productCount || 0} Ürün
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Kategori Ekleme Modalı (Portal ile) */}
            {createCatModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg rounded-3xl shadow-2xl border-none bg-white overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <FolderTree className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Yeni Kategori Ekle</CardTitle>
                                    <p className="text-xs text-slate-500 mt-0.5">Sisteme yeni bir ana kategori tanımlayın.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200" onClick={() => setCreateCatModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardContent className="p-6">
                            <form onSubmit={handleSaveCategory} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Kategori Adı <span className="text-red-500">*</span></Label>
                                    <Input
                                        placeholder="Örn: Entegre, Transistör, Çip..."
                                        value={catNameInput}
                                        onChange={e => setCatNameInput(e.target.value)}
                                        required
                                        autoFocus
                                        className="h-12 text-base rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-blue-600 focus-visible:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Üst Kategori</Label>
                                    <Select value={catParentIdInput} onValueChange={setCatParentIdInput}>
                                        <SelectTrigger className="h-12 text-base rounded-xl border-slate-200 bg-slate-50 focus:ring-blue-600 focus:bg-white transition-colors">
                                            <SelectValue placeholder="Ana Kategori (Yok)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">Ana Kategori (Yok)</SelectItem>
                                            {categories?.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-slate-500">Eğer bir ana kategori oluşturuyorsanız boş bırakın.</p>
                                </div>
                                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-2">
                                    <Button variant="outline" type="button" className="h-11 text-sm rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50" onClick={() => setCreateCatModalOpen(false)}>İptal</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-11 text-sm font-semibold px-6 rounded-xl shadow-sm shadow-blue-600/20" disabled={createCatMutation.isPending}>
                                        {createCatMutation.isPending ? 'Oluşturuluyor...' : 'Kategori Oluştur'}
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