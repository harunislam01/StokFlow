import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/products';
import { getAuditLogs } from '../api/audit';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { User as UserIcon, Shield, Users, FolderTree, Edit2, Trash2, Plus, LogOut, X, History, ChevronDown, ChevronUp, WifiOff, Bell } from 'lucide-react';
import { apiClient } from '../api/client';

const OfflineWarning = ({ sectionName }: { sectionName: string }) => (
  <Card className="rounded-2xl shadow-sm border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
    <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-full text-amber-500">
        <WifiOff className="h-10 w-auto" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{sectionName} Çevrimdışı Kullanılamaz</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Bu yönetim modülü doğrudan backend veritabanına bağlıdır. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.
        </p>
      </div>
    </CardContent>
  </Card>
);

const formatDateTime = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleString('tr-TR');
};

const getActionBadge = (action: string) => {
  switch (action) {
    case 'CREATE_PRODUCT':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Ürün Eklendi</Badge>;
    case 'UPDATE_PRODUCT':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Ürün Güncellendi</Badge>;
    case 'DELETE_PRODUCT':
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Ürün Silindi</Badge>;
    case 'STOCK_IN':
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Stok Girişi</Badge>;
    case 'STOCK_OUT':
      return <Badge className="bg-amber-600 hover:bg-amber-700 text-white">Stok Çıkışı</Badge>;
    case 'CREATE_CATEGORY':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Kategori Eklendi</Badge>;
    case 'UPDATE_CATEGORY':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Kategori Güncellendi</Badge>;
    case 'DELETE_CATEGORY':
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Kategori Silindi</Badge>;
    case 'CREATE_USER':
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Kullanıcı Oluşturuldu</Badge>;
    case 'UPDATE_USER':
      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Kullanıcı Güncellendi</Badge>;
    case 'DELETE_USER':
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Kullanıcı Silindi</Badge>;
    default:
      return <Badge variant="secondary">{action}</Badge>;
  }
};

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');

  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'categories' | 'audit'>(
    (tabParam as any) || 'profile'
  );

  React.useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
    if (actionParam === 'new' && tabParam === 'categories') {
      resetCategoryForm();
      setCategoryModalOpen(true);
      setSearchParams({});
    }
  }, [tabParam, actionParam]);

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribePush = async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      alert('Bu tarayıcı bildirimleri desteklemiyor.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = 'BPexBxvsYDImEA7HVk-B5tLwSh62cp8GEyoQ4R3H7KJutWfj4kAP3m0J5JCanh2b0rXUGgQ7JVuRNrfT59NjPiM';
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await apiClient.post('/notifications/subscribe', subscription);
        alert('Web Push bildirim aboneliği başarıyla etkinleştirildi! 🎉');
      }
    } catch (err: any) {
      console.error('Failed to subscribe push notifications:', err);
      alert('Bildirim aboneliği başlatılamadı: ' + (err.message || err));
    }
  };

  // Modal / Form States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState<'ADMIN' | 'USER'>('USER');
  const [isActiveInput, setIsActiveInput] = useState(true);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catParentIdInput, setCatParentIdInput] = useState<string>('null');
  const [catIconInput, setCatIconInput] = useState('Package');
  const [catColorInput, setCatColorInput] = useState('indigo-600');
  const [properties, setProperties] = useState<any[]>([]);

  const addProperty = () => {
    setProperties(prev => [
      ...prev,
      { label: '', type: 'text', required: false, options: '' }
    ]);
  };

  const removeProperty = (index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, key: string, value: any) => {
    setProperties(prev => prev.map((prop, i) => {
      if (i === index) {
        return { ...prop, [key]: value };
      }
      return prop;
    }));
  };

  // Expandable Audit Log State
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Queries
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: activeTab === 'users' && user?.role === 'ADMIN',
  });

  const { data: categories, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    enabled: activeTab === 'categories' && user?.role === 'ADMIN',
  });

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
    enabled: activeTab === 'audit' && user?.role === 'ADMIN',
  });

  // User Mutations
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserModalOpen(false);
      resetUserForm();
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserModalOpen(false);
      resetUserForm();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Kullanıcı silinirken hata oluştu');
    }
  });



  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryModalOpen(false);
      resetCategoryForm();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryModalOpen(false);
      resetCategoryForm();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Kategori silinemedi. Alt kategorisi veya ürünü olabilir.');
    }
  });

  // Helper actions
  const resetUserForm = () => {
    setEditingUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setRoleInput('USER');
    setIsActiveInput(true);
  };

  const handleEditUser = (u: any) => {
    setEditingUser(u);
    setUsernameInput(u.username);
    setPasswordInput('');
    setRoleInput(u.role);
    setIsActiveInput(u.isActive);
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const data: any = { username: usernameInput, role: roleInput, isActive: isActiveInput };
      if (passwordInput) data.password = passwordInput;
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate({ username: usernameInput, password: passwordInput, role: roleInput });
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatNameInput('');
    setCatParentIdInput('null');
    setCatIconInput('Package');
    setCatColorInput('indigo-600');
    setProperties([]);
  };

  const handleEditCategory = (c: any) => {
    setEditingCategory(c);
    setCatNameInput(c.name);
    setCatParentIdInput(c.parentId ? String(c.parentId) : 'null');
    setCatIconInput(c.icon || 'Package');
    setCatColorInput(c.color || 'indigo-600');
    setProperties(c.formSchema || []);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate properties
    for (const prop of properties) {
      if (!prop.label.trim()) {
        alert('Lütfen tüm özelliklerin adını doldurun.');
        return;
      }
    }
    
    // Slugify and clean properties
    const cleanedProperties = properties.map(prop => {
      const name = prop.name || prop.label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
      const cleaned: any = {
        name,
        label: prop.label.trim(),
        type: prop.type,
        required: !!prop.required
      };
      if (prop.type === 'select') {
        cleaned.options = Array.isArray(prop.options) 
          ? prop.options 
          : typeof prop.options === 'string'
            ? prop.options.split(',').map((o: string) => o.trim()).filter((o: string) => o.length > 0)
            : [];
      }
      return cleaned;
    });

    const payload = {
      name: catNameInput,
      parentId: catParentIdInput === 'null' ? null : Number(catParentIdInput),
      icon: catIconInput,
      color: catColorInput,
      formSchema: cleanedProperties
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: payload });
    } else {
      createCategoryMutation.mutate(payload);
    }
  };

  const loadSchemaTemplate = (type: 'resistor' | 'capacitor') => {
    if (type === 'resistor') {
      setProperties([
        { name: 'package', label: 'Kılıf (Package)', type: 'select', required: true, options: '0603, 0805, 1206, THT' },
        { name: 'resistance', label: 'Direnç Değeri', type: 'text', required: true, options: '' },
        { name: 'tolerance', label: 'Tolerans', type: 'text', required: false, options: '' }
      ]);
    } else if (type === 'capacitor') {
      setProperties([
        { name: 'package', label: 'Kılıf (Package)', type: 'select', required: true, options: '0805, 1206, Electrolytic, Tantalum' },
        { name: 'capacitance', label: 'Kapasite Değeri', type: 'text', required: true, options: '' },
        { name: 'voltage', label: 'Voltaj Değeri', type: 'text', required: false, options: '' }
      ]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Ayarlar</h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Profil & Güvenlik
        </button>
        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Kullanıcı Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Kategori Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Denetim Kayıtları (Audit)
            </button>
          </>
        )}
      </div>

      <div className="grid gap-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card className="rounded-xl border shadow-sm transition-all duration-150 bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.07]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-amber-600 dark:text-amber-500" /> Profil Bilgileri
                </CardTitle>
                <CardDescription>Oturum açmış kullanıcı detayları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Kullanıcı Adı</span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">{user?.username}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Yetki Rolü</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'} className={user?.role === 'ADMIN' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}>
                        {user?.role === 'ADMIN' ? 'Yönetici (Admin)' : 'Standart Kullanıcı'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="destructive" className="flex items-center gap-2 btn-tactile h-11" onClick={logout}>
                  <LogOut className="h-4 w-4" /> Çıkış Yap
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm transition-all duration-150 bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/[0.07]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-500" /> Web Push Bildirimleri
                </CardTitle>
                <CardDescription>Depo kritik stok uyarılarını anlık bildirim olarak alın</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-slate-200/50 dark:border-white/[0.05]">
                  <div>
                    <p className="text-sm font-semibold">Anlık Bildirim İzin Durumu</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pushPermission === 'granted' ? 'Etkinleştirildi' : pushPermission === 'denied' ? 'Engellendi (Ayarlardan açın)' : 'Henüz İzin İstenmedi'}
                    </p>
                  </div>
                  <Button
                    onClick={handleSubscribePush}
                    disabled={pushPermission === 'granted'}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-11 px-4 btn-tactile rounded-md"
                  >
                    {pushPermission === 'granted' ? 'Abonelik Aktif' : 'Bildirimleri Aç'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && user?.role === 'ADMIN' && (
          !navigator.onLine ? <OfflineWarning sectionName="Kullanıcı Yönetimi" /> : (
          <Card className="rounded-2xl shadow-sm border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" /> Kullanıcılar
                </CardTitle>
                <CardDescription>Sisteme kayıtlı kullanıcıları ve rollerini yönetin</CardDescription>
              </div>
              <Button onClick={() => { resetUserForm(); setUserModalOpen(true); }} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Kullanıcı Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div>Kullanıcı listesi yükleniyor...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı Adı</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Aksiyonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{u.username}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'outline' : 'destructive'} className={u.isActive ? 'border-emerald-500 text-emerald-500' : ''}>
                            {u.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)}>
                            <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                          </Button>
                          {u.username !== 'admin' && (
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) deleteUserMutation.mutate(u.id); }}>
                              <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )
        )}

        {/* Category Management Tab */}
        {activeTab === 'categories' && user?.role === 'ADMIN' && (
          !navigator.onLine ? <OfflineWarning sectionName="Kategori Yönetimi" /> : (
          <Card className="rounded-2xl shadow-sm border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-indigo-600" /> Kategoriler
                </CardTitle>
                <CardDescription>Bileşen kategorilerini ve form şemalarını tasarlayın</CardDescription>
              </div>
              <Button onClick={() => { resetCategoryForm(); setCategoryModalOpen(true); }} className="flex items-center gap-1">
                <Plus className="h-4 w-4" /> Kategori Ekle
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCats ? (
                <div>Kategoriler yükleniyor...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Adı</TableHead>
                      <TableHead>Renk/İkon</TableHead>
                      <TableHead>Üst Kategori</TableHead>
                      <TableHead>Dinamik Şema (Fields)</TableHead>
                      <TableHead className="text-right">Aksiyonlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((c) => {
                      const parent = categories.find(pc => pc.id === c.parentId);
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full bg-${c.color || 'slate-500'}`} />
                              <span className="text-xs text-slate-500">{c.icon || 'Package'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">{parent?.name || 'Ana Kategori'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{c.formSchema?.length || 0} Parametre</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(c)}>
                              <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Kategoriyi silmek istediğinize emin misiniz?')) deleteCategoryMutation.mutate(c.id); }}>
                              <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )
        )}

        {/* Audit Logs Tab (Öneri 2) */}
        {activeTab === 'audit' && user?.role === 'ADMIN' && (
          !navigator.onLine ? <OfflineWarning sectionName="Denetim Kayıtları (Audit Logs)" /> : (
          <Card className="rounded-2xl shadow-sm border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" /> Sistem Denetim Kayıtları (Audit Logs)
              </CardTitle>
              <CardDescription>Sistem üzerinde gerçekleştirilen tüm veri yazma, güncelleme ve silme eylemleri</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAudit ? (
                <div>Denetim kayıtları yükleniyor...</div>
              ) : auditLogs?.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500">Kayıtlı denetim kaydı bulunmuyor.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>Tarih / Saat</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Aksiyon</TableHead>
                      <TableHead>Etkilenen Varlık</TableHead>
                      <TableHead>IP Adresi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <React.Fragment key={log.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          >
                            <TableCell className="w-6">
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </TableCell>
                            <TableCell className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                              {formatDateTime(log.createdAt)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">{log.user?.username || 'Sistem'}</TableCell>
                            <TableCell>{getActionBadge(log.action)}</TableCell>
                            <TableCell className="text-slate-500 text-xs font-mono">
                              {log.entityType} ({log.entityId || 'N/A'})
                            </TableCell>
                            <TableCell className="text-slate-400 text-xs font-mono">{log.ipAddress || '127.0.0.1'}</TableCell>
                          </TableRow>
                          
                          {/* Expanded detail box */}
                          {isExpanded && (
                            <TableRow className="bg-slate-50/30 dark:bg-slate-950/20">
                              <TableCell colSpan={6} className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                                <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                                  <div>
                                    <h4 className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Eski Veriler (Old Values)</h4>
                                    <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto max-h-60 border border-slate-200/40 dark:border-slate-800/40 text-slate-700 dark:text-slate-300">
                                      {log.oldData ? JSON.stringify(log.oldData, null, 2) : 'Eski Değer Yok'}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[10px]">Yeni Veriler (New Values)</h4>
                                    <pre className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto max-h-60 border border-slate-200/40 dark:border-slate-800/40 text-slate-700 dark:text-slate-300">
                                      {log.newData ? JSON.stringify(log.newData, null, 2) : 'Yeni Değer Yok'}
                                    </pre>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )
        )}
      </div>

      {/* User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingUser ? 'Kullanıcıyı Düzenle' : 'Kullanıcı Ekle'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setUserModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Kullanıcı Adı</Label>
                  <Input value={usernameInput} onChange={e => setUsernameInput(e.target.value)} required disabled={editingUser && editingUser.username === 'admin'} />
                </div>
                <div className="space-y-2">
                  <Label>{editingUser ? 'Şifre (Değiştirmek istemiyorsanız boş bırakın)' : 'Şifre'}</Label>
                  <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required={!editingUser} />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={roleInput} onValueChange={(val: any) => setRoleInput(val)} disabled={editingUser && editingUser.username === 'admin'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingUser && editingUser.username !== 'admin' && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isActive" checked={isActiveInput} onChange={e => setIsActiveInput(e.target.checked)} />
                    <Label htmlFor="isActive">Kullanıcı Hesabı Aktif</Label>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setUserModalOpen(false)}>İptal</Button>
                  <Button type="submit">Kaydet</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingCategory ? 'Kategoriyi Düzenle' : 'Kategori Ekle'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCategoryModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori Adı</Label>
                    <Input value={catNameInput} onChange={e => setCatNameInput(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Üst Kategori</Label>
                    <Select value={catParentIdInput} onValueChange={setCatParentIdInput}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Ana Kategori (Yok)</SelectItem>
                        {categories?.filter(c => c.id !== editingCategory?.id).map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İkon (Lucide adı)</Label>
                    <Input value={catIconInput} onChange={e => setCatIconInput(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Renk Sınıfı (Tailwind)</Label>
                    <Input value={catColorInput} onChange={e => setCatColorInput(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Label className="text-sm font-bold">Kategori Özellikleri (Alanlar)</Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" type="button" onClick={() => loadSchemaTemplate('resistor')} className="text-xs">Direnç Şablonu</Button>
                      <Button variant="ghost" size="sm" type="button" onClick={() => loadSchemaTemplate('capacitor')} className="text-xs">Kondansatör Şablonu</Button>
                    </div>
                  </div>

                  {properties.map((prop, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => removeProperty(idx)}
                        className="absolute top-3 right-3 p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Özelliği Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Özellik Adı (Etiket)</Label>
                          <Input
                            placeholder="örn: Kapasite, Voltaj"
                            value={prop.label}
                            onChange={e => updateProperty(idx, 'label', e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Veri Tipi</Label>
                          <Select
                            value={prop.type}
                            onValueChange={val => updateProperty(idx, 'type', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tip Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Metin (Yazı)</SelectItem>
                              <SelectItem value="number">Sayı</SelectItem>
                              <SelectItem value="select">Seçim Listesi (Açılır Kutu)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id={`req-${idx}`}
                            checked={prop.required || false}
                            onChange={e => updateProperty(idx, 'required', e.target.checked)}
                            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <Label htmlFor={`req-${idx}`} className="text-xs font-semibold cursor-pointer select-none">
                            Zorunlu Alan
                          </Label>
                        </div>
                      </div>

                      {prop.type === 'select' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Seçenekler (Virgülle ayırarak yazın)</Label>
                          <Input
                            placeholder="örn: 10V, 16V, 25V, 50V"
                            value={Array.isArray(prop.options) ? prop.options.join(', ') : (prop.options || '')}
                            onChange={e => updateProperty(idx, 'options', e.target.value)}
                            required
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-2 py-6 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 btn-tactile"
                    onClick={addProperty}
                  >
                    <Plus className="h-4 w-4" /> Özellik Ekle
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setCategoryModalOpen(false)}>İptal</Button>
                  <Button type="submit">Kaydet</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
