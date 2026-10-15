import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductById, createProduct, updateProduct, getCategories } from '../api/products';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';

const productSchema = z.object({
  categoryId: z.number().min(1, 'Kategori seçimi zorunludur'),
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
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

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = categories?.find(c => c.id === selectedCategoryId);
  const formSchemaFields = selectedCategory?.formSchema || [];

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        categoryId: product.categoryId,
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
      
      // Haptic feedback on success
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
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

  if (isEditing && isLoading) return <div className="text-center py-12">Yükleniyor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-12 w-12 rounded-xl btn-tactile">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        </h1>
      </div>

      <Card className={`rounded-xl border shadow-sm transition-all duration-150
        ${isDark
          ? 'bg-[#1e293b] border-white/[0.07]'
          : 'bg-white border-slate-200/80 shadow-slate-900/[0.03]'
        }`}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori *</Label>
                <Controller
                  name="categoryId"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={!!categoryIdParam && !isEditing}
                    >
                      <SelectTrigger id="categoryId" className={`h-12 text-base rounded-sm ${form.formState.errors.categoryId ? 'border-red-500' : ''}`}>
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
                  <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productCode">Ürün Kodu *</Label>
                <Input id="productCode" {...form.register('productCode')} className={`h-12 text-base rounded-sm font-mono ${form.formState.errors.productCode ? 'border-red-500' : ''}`} />
                {form.formState.errors.productCode && <p className="text-sm text-red-500">{form.formState.errors.productCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Ürün İsmi *</Label>
                <Input id="name" placeholder="Örn: 10K Ohm Direnç" {...form.register('name')} className={`h-12 text-base rounded-sm ${form.formState.errors.name ? 'border-red-500' : ''}`} />
                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Mevcut Stok Adedi *</Label>
                <Input id="stockQuantity" type="number" inputMode="numeric" {...form.register('stockQuantity', { valueAsNumber: true })} className={`h-12 text-base rounded-sm font-mono ${form.formState.errors.stockQuantity ? 'border-red-500' : ''}`} />
                {form.formState.errors.stockQuantity && <p className="text-sm text-red-500">{form.formState.errors.stockQuantity.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumStock">Düşük Stok Uyarı Sınırı</Label>
                <Input id="minimumStock" type="number" inputMode="numeric" {...form.register('minimumStock', { valueAsNumber: true })} className="h-12 text-base rounded-sm font-mono" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Raf / Dolap Konumu</Label>
                <Input id="location" placeholder="Örn: Raf-A1" {...form.register('location')} className="h-12 text-base rounded-sm font-mono" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input id="description" {...form.register('description')} className="h-12 text-base rounded-sm" />
              </div>

              {/* DYNAMIC FIELDS BASED ON CATEGORY SCHEMA */}
              {formSchemaFields.length > 0 && (
                <div className={`md:col-span-2 border-t pt-6 ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Kategoriye Özel Alanlar</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formSchemaFields.map((field: any) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`attributes.${field.name}`}>{field.label}{field.required ? ' *' : ''}</Label>
                        
                        {field.type === 'select' ? (
                          <Controller
                            name={`attributes.${field.name}`}
                            control={form.control}
                            rules={{ required: field.required }}
                            render={({ field: selectField }) => (
                              <Select
                                onValueChange={selectField.onChange}
                                value={(selectField.value as string) || ''}
                              >
                                <SelectTrigger id={`attributes.${field.name}`} className="h-12 text-base rounded-sm">
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
                          <Input
                            id={`attributes.${field.name}`}
                            placeholder={field.placeholder || ''}
                            className="h-12 text-base rounded-sm font-mono"
                            {...form.register(`attributes.${field.name}`, { required: field.required })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </CardContent>
          
          <div className={`flex items-center justify-end gap-3 p-6 border-t rounded-b-xl
            ${isDark 
              ? 'border-white/[0.06] bg-slate-900/50' 
              : 'border-slate-200/50 bg-slate-50/50'
            }`}>
            <Button variant="outline" type="button" onClick={() => navigate(-1)} className="h-12 rounded-md btn-tactile">
              İptal
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-md btn-tactile px-5" disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
