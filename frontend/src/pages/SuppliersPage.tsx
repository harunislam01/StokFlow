import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from '../api/suppliers';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Truck, Plus, Search, Phone, Mail, MapPin, X, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export const SuppliersPage = () => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', contactName: '', phone: '', email: '', address: ''
    });

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: getSuppliers,
    });

    // Ekleme / Güncelleme Mutation'ı
    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (editingSupplier) {
                return await updateSupplier(editingSupplier.id, data);
            }
            return await createSupplier(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            closeModal();
        },
        onError: (err: any) => alert(err?.response?.data?.error || 'İşlem sırasında hata oluştu.')
    });

    // Silme Mutation'ı
    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteSupplier(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setDeleteId(null);
        },
        onError: (err: any) => alert(err?.response?.data?.error || 'Tedarikçi silinemedi.')
    });

    const openModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactName: supplier.contactName || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', contactName: '', phone: '', email: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const filteredSuppliers = suppliers?.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Truck className="h-6 w-6 text-blue-600" /> Tedarikçiler
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Ürün tedarikçilerini ve iletişim bilgilerini yönetin.</p>
                </div>
                <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-4 gap-2">
                    <Plus className="h-4 w-4" /> Yeni Tedarikçi
                </Button>
            </div>

            <Card className="rounded-2xl border-slate-200/80 shadow-sm bg-white">
                <CardHeader className="pb-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tedarikçi veya yetkili ara..."
                            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-500">Tedarikçiler yükleniyor...</div>
                    ) : filteredSuppliers?.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                            <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-800">Tedarikçi Bulunamadı</h3>
                            <p className="text-sm text-slate-500">
                                {search ? 'Arama kriterlerinize uygun tedarikçi yok.' : 'Sisteme henüz bir tedarikçi eklenmemiş.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSuppliers?.map((s) => (
                                <div key={s.id} className="p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-300 transition-colors shadow-sm relative group">

                                    {/* Aksiyon Butonları (Hover ile görünür) */}
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg mb-1 pr-16 truncate">{s.name}</h3>
                                    <p className="text-xs font-semibold text-blue-600 mb-4">{s._count?.products || 0} Ürün Sağlıyor</p>

                                    <div className="space-y-2 text-sm text-slate-600">
                                        {s.contactName && <p className="flex items-center gap-2"><span className="font-semibold w-16 shrink-0">Yetkili:</span> <span className="truncate">{s.contactName}</span></p>}
                                        {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {s.phone}</p>}
                                        {s.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">{s.email}</span></p>}
                                        {s.address && <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> <span className="line-clamp-2">{s.address}</span></p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tedarikçi Ekle/Düzenle Modalı */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md rounded-3xl shadow-2xl border-none bg-white overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{editingSupplier ? 'Tedarikçiyi Düzenle' : 'Yeni Tedarikçi Ekle'}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Tedarikçi bilgilerini girin.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200" onClick={closeModal}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Firma Adı <span className="text-red-500">*</span></Label>
                                <Input required placeholder="Örn: ABC Elektronik Ltd." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Yetkili Kişi</Label>
                                <Input placeholder="Örn: Ahmet Yılmaz" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Telefon</Label>
                                    <Input placeholder="05xx..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">E-Posta</Label>
                                    <Input type="email" placeholder="ornek@mail.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Adres</Label>
                                <Input placeholder="Açık adres..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-11 rounded-xl bg-slate-50 focus:bg-white" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button variant="outline" type="button" onClick={closeModal} className="h-11 rounded-xl">İptal</Button>
                                <Button type="submit" disabled={saveMutation.isPending} className="h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                                    {saveMutation.isPending ? 'Kaydediliyor...' : (editingSupplier ? 'Değişiklikleri Kaydet' : 'Tedarikçi Ekle')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>,
                document.body
            )}

            {/* Silme Onay Modalı */}
            {deleteId !== null && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm rounded-3xl shadow-2xl border-none bg-white overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Tedarikçiyi Sil?</h3>
                            <p className="text-sm text-slate-500">
                                Bu tedarikçiyi silmek istediğinize emin misiniz?
                                Bağlı ürünler varsa işlem başarısız olabilir.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                            <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold border-slate-200 text-slate-600" onClick={() => setDeleteId(null)}>
                                İptal
                            </Button>
                            <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl font-semibold shadow-sm" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
};