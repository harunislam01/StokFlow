import { useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductById, createProduct, updateProduct, getCategories } from '../api/products';
import { getSuppliers } from '../api/suppliers';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react';

const productSchema = z.object({
  categoryId: z.number().min(1, 'Kategori seçimi zorunludur'),
  supplierId: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  productCode: z.string().min(2, 'Ürün kodu en az 2 karakter olmalıdır'),
  materialCode: z.string().optional().nullable(),
  name: z.string().min(2, 'Ürün adı en az 2 karakter olmalıdır'),
  stockQuantity: z.number().min(0, 'Stok adedi 0 veya daha büyük olmalıdır'),
  minimumStock: z.number().min(0),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  attributes: z.record(z.string(), z.any()),
  version: z.number().optional()
});

type ProductFormValues = z.infer<typeof productSchema>;

export const ProductFormPage = () => {
  const { id, categoryId: categoryIdParam } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', Number(id)],
    queryFn: () => getProductById(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: categoryIdParam ? Number(categoryIdParam) : undefined,
      supplierId: undefined,
      imageUrl: null,
      productCode: '',
      materialCode: '',
      name: '',
      stockQuantity: 0,
      minimumStock: 10,
      location: '',
      description: '',
      attributes: {},
    },
  });

  const imageUrl = form.watch('imageUrl');

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          form.setValue('imageUrl', reader.result as string, { shouldDirty: true });
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        form.setValue('imageUrl', canvas.toDataURL('image/jpeg', 0.8), { shouldDirty: true });
      };
      img.onerror = () => form.setValue('imageUrl', reader.result as string, { shouldDirty: true });
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
  const formSchemaFields = selectedCategory?.formSchema || [];

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        categoryId: product.categoryId,
        supplierId: (product as any).supplierId ?? undefined,
        imageUrl:
          (product as any).imageUrl ||
          (product as any).images?.find((img: any) => img.isPrimary)?.url ||
          (product as any).images?.[0]?.url ||
          null,
        productCode: product.productCode,
        materialCode: product.materialCode || '',
        name: product.name,
        stockQuantity: product.stockQuantity,
        minimumStock: product.minimumStock,
        location: product.location || '',
        description: product.description || '',
        attributes: product.attributes || {},
        version: product.version
      });
    }
  }, [product, isEditing, form]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormValues) =>
      isEditing
        ? updateProduct(Number(id), { ...data, version: product?.version || 1 })
        : createProduct(data),
    onSuccess: (savedProduct) => {
      queryClient.invalidateQueries();
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
      navigate(`/product/${savedProduct.id}`);
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'Ürün kaydedilirken bir hata oluştu';
      alert(msg);
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoading) return <div className="text-center py-12 text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10 pt-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </h1>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-slate-700">Kategori *</Label>
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { if (!val) return; field.onChange(Number(val)); }}
                      value={field.value?.toString()}
                      disabled={!!categoryIdParam && !isEditing}
                    >
                      <SelectTrigger id="categoryId" className={`h-11 text-sm rounded-xl bg-slate-50/50 ${form.formState.errors.categoryId ? 'border-red-500' : 'border-slate-200'}`}>
                        <SelectValue placeholder="Kategori Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-red-500 font-medium">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierId" className="text-slate-700">Tedarikçi (Opsiyonel)</Label>
                <Controller
                  name="supplierId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => { if (!val) return; field.onChange(val === 'none' ? null : Number(val)); }}
                      value={field.value?.toString() || 'none'}
                    >
                      <SelectTrigger className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200">
                        <SelectValue placeholder="Tedarikçi Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tedarikçi Yok</SelectItem>
                        {suppliers?.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id.toString()}>{sup.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCode" className="text-slate-700">Ürün Kodu *</Label>
                <Input id="productCode" {...form.register('productCode')} className={`h-11 text-sm rounded-xl bg-slate-50/50 font-mono ${form.formState.errors.productCode ? 'border-red-500' : 'border-slate-200'}`} />
                {form.formState.errors.productCode && <p className="text-xs text-red-500 font-medium">{form.formState.errors.productCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="materialCode" className="text-slate-700">Malzeme Kodu</Label>
                <Input id="materialCode" placeholder="Örn: MAT-DR-001" {...form.register('materialCode')} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200 font-mono" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-slate-700">Ürün İsmi *</Label>
                <Input id="name" placeholder="Örn: 10K Ohm Direnç" {...form.register('name')} className={`h-11 text-sm rounded-xl bg-slate-50/50 ${form.formState.errors.name ? 'border-red-500' : 'border-slate-200'}`} />
                {form.formState.errors.name && <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity" className="text-slate-700">Mevcut Stok Adedi *</Label>
                <Input id="stockQuantity" type="number" inputMode="numeric" {...form.register('stockQuantity', { valueAsNumber: true })} className={`h-11 text-sm rounded-xl bg-slate-50/50 font-mono ${form.formState.errors.stockQuantity ? 'border-red-500' : 'border-slate-200'}`} />
                {form.formState.errors.stockQuantity && <p className="text-xs text-red-500 font-medium">{form.formState.errors.stockQuantity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock" className="text-slate-700">Düşük Stok Uyarı Sınırı</Label>
                <Input id="minimumStock" type="number" inputMode="numeric" {...form.register('minimumStock', { valueAsNumber: true })} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200 font-mono" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-700">Raf / Dolap Konumu</Label>
                <Input id="location" placeholder="Örn: Raf-A1" {...form.register('location')} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200 font-mono" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-slate-700">Açıklama</Label>
                <Input id="description" {...form.register('description')} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-700">Ürün Resmi (Opsiyonel)</Label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                      <img src={imageUrl} alt="Ürün resmi önizlemesi" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => form.setValue('imageUrl', null, { shouldDirty: true })}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-white shadow-sm"
                        aria-label="Resmi kaldır"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-24 w-24 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 cursor-pointer transition-colors shrink-0">
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-[11px] font-medium">Resim Seç</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Ürün için bir resim yükleyebilirsiniz.</p>
                    {imageUrl && (
                      <label className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                        Resmi Değiştir
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* DYNAMIC FIELDS */}
              {formSchemaFields.length > 0 && (
                <div className="md:col-span-2 border-t pt-6 border-slate-100">
                  <h3 className="text-sm font-bold mb-4 text-slate-800">Kategoriye Özel Alanlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formSchemaFields.map((field: any) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`attributes.${field.name}`} className="text-slate-700">{field.label}{field.required ? ' *' : ''}</Label>

                        {field.type === 'select' ? (
                          <Controller
                            name={`attributes.${field.name}`}
                            control={form.control}
                            rules={{ required: field.required }}
                            render={({ field: selectField }) => (
                              <Select onValueChange={selectField.onChange} value={(selectField.value as string) || ''}>
                                <SelectTrigger id={`attributes.${field.name}`} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200">
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        ) : (
                          <Input id={`attributes.${field.name}`} placeholder={field.placeholder || ''} className="h-11 text-sm rounded-xl bg-slate-50/50 border-slate-200 font-mono" {...form.register(`attributes.${field.name}`, { required: field.required })} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </CardContent>

          <div className="flex items-center justify-end gap-3 p-6 border-t rounded-b-2xl border-slate-100 bg-slate-50/50">
            <Button variant="outline" type="button" onClick={() => navigate(-1)} className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100">
              İptal
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl px-6" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};