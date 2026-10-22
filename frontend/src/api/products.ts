import { apiClient } from './client';
import { db, type LocalProduct } from '../lib/db';
import type { Product, Category } from '../types';
import { mockProducts, mockCategories } from './mockData';

// Helper to check connection
const isOnline = () => navigator.onLine;

export const getCategories = async (): Promise<Category[]> => {
  if (isOnline()) {
    try {
      const response = await apiClient.get('/categories');
      const categories: Category[] = response.data;

      // Update local IndexedDB asynchronously in background without blocking return
      db.categories.bulkPut(categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        icon: cat.icon,
        color: cat.color,
        formSchema: cat.formSchema,
        productCount: cat.productCount
      }))).catch((dbErr: any) => console.error('Failed to write categories to local DB:', dbErr));

      return categories;
    } catch (error) {
      console.warn('Online categories fetch failed, falling back to local DB:', error);
    }
  }

  // Offline fallback
  try {
    const localCats = await db.categories.toArray();
    if (localCats.length === 0) {
      return mockCategories;
    }
    return localCats as Category[];
  } catch (dbErr) {
    console.error('Failed to read categories from local DB:', dbErr);
    return mockCategories;
  }
};

export const getProducts = async (filters?: { categoryId?: number; search?: string }): Promise<Product[]> => {
  if (isOnline()) {
    try {
      const response = await apiClient.get('/products', { params: filters });
      const products: Product[] = response.data;

      if (Array.isArray(products) && products.length > 0) {
        // Update local IndexedDB asynchronously in background without blocking
        db.syncQueue.count().then((pendingSyncs: number) => {
          if (pendingSyncs === 0) {
            db.products.bulkPut(products.map(p => ({
              id: p.id,
              categoryId: p.categoryId,
              productCode: p.productCode,
              materialCode: p.materialCode,
              name: p.name,
              description: p.description,
              stockQuantity: p.stockQuantity,
              minimumStock: p.minimumStock,
              location: p.location,
              attributes: p.attributes,
              version: p.version,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt
            }))).catch((err: any) => console.error('Failed to write products to local DB:', err));
          }
        }).catch((err: any) => console.error('Failed to check syncQueue count:', err));

        return products;
      }
    } catch (error) {
      console.warn('Online products fetch failed, falling back to local DB:', error);
    }
  }

  try {
    // Offline or request failed: query Dexie local IndexedDB or mock data
    let localProducts = await db.products.toArray();

    const needsRefresh = localProducts.length === 0 || localProducts.some((p: any) => p.attributes?.resistance && p.description && !p.description.includes('Direnç Değeri:'));
    if (needsRefresh) {
      localProducts = mockProducts as any;
      db.products.clear().then(() => db.products.bulkPut(mockProducts as any)).catch(() => { });
    }

    if (filters?.categoryId) {
      const catId = filters.categoryId;
      const cats = (await db.categories.toArray()) as Category[];
      const categoryList = cats.length > 0 ? cats : mockCategories;

      const getChildIds = (id: number): number[] => {
        const direct = categoryList.filter(c => c.parentId === id).map(c => c.id);
        const nested = direct.flatMap(childId => getChildIds(childId));
        return [id, ...direct, ...nested];
      };

      const validCatIds = new Set(getChildIds(catId));
      localProducts = localProducts.filter((p: any) => validCatIds.has(p.categoryId));
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      localProducts = localProducts.filter((p: any) =>
        p.productCode.toLowerCase().includes(s) ||
        p.name.toLowerCase().includes(s) ||
        (p.materialCode && p.materialCode.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.location && p.location.toLowerCase().includes(s))
      );
    }

    return localProducts as Product[];
  } catch (dbErr) {
    console.error('Failed to read products from local DB:', dbErr);
    return mockProducts;
  }
};

export const getProductById = async (id: number): Promise<Product> => {
  if (isOnline()) {
    try {
      const response = await apiClient.get(`/products/${id}`);
      const product: Product = response.data;

      // Update local cache
      await db.products.put({
        id: product.id,
        categoryId: product.categoryId,
        productCode: product.productCode,
        materialCode: product.materialCode,
        name: product.name,
        description: product.description,
        stockQuantity: product.stockQuantity,
        minimumStock: product.minimumStock,
        location: product.location,
        attributes: product.attributes,
        version: product.version,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });

      return product;
    } catch (error) {
      console.warn('Online product detail fetch failed, falling back to local DB:', error);
    }
  }

  const localProduct = await db.products.get(id);
  if (!localProduct) throw new Error('Ürün yerel veritabanında bulunamadı');
  return localProduct as Product;
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Product> => {
  // Local validation (Offline conflict prevention)
  const existingProducts = await db.products.where('productCode').equals(product.productCode).toArray();
  if (existingProducts.length > 0) {
    throw new Error(`"${product.productCode}" kodlu ürün zaten mevcut! Lütfen farklı bir ürün kodu kullanın.`);
  }

  if (isOnline()) {
    const response = await apiClient.post('/products', product);
    const saved: Product = response.data;

    // Save to local DB
    await db.products.put({
      id: saved.id,
      categoryId: saved.categoryId,
      productCode: saved.productCode,
      materialCode: saved.materialCode,
      name: saved.name,
      description: saved.description,
      stockQuantity: saved.stockQuantity,
      minimumStock: saved.minimumStock,
      location: saved.location,
      attributes: saved.attributes,
      version: saved.version,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    });

    return saved;
  }

  // Offline: Create product locally with a temporary ID
  const tempId = -Math.floor(Math.random() * 1000000); // negative temporary ID
  const newProduct: LocalProduct = {
    ...product,
    id: tempId,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    materialCode: product.materialCode || null,
    description: product.description || null,
    location: product.location || null,
  };

  await db.products.put(newProduct);

  // Enqueue in sync queue
  await db.syncQueue.add({
    actionType: 'CREATE',
    payload: newProduct,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });

  return newProduct as unknown as Product;
};

export const updateProduct = async (id: number, updates: Partial<Product> & { version: number }): Promise<Product> => {
  if (updates.productCode) {
    const existingProducts = await db.products.where('productCode').equals(updates.productCode).toArray();
    if (existingProducts.some((p: any) => p.id !== id)) {
      throw new Error(`"${updates.productCode}" kodlu ürün zaten mevcut! Lütfen farklı bir ürün kodu kullanın.`);
    }
  }

  if (isOnline()) {
    const response = await apiClient.put(`/products/${id}`, updates);
    const saved: Product = response.data;

    // Update local cache
    await db.products.put({
      id: saved.id,
      categoryId: saved.categoryId,
      productCode: saved.productCode,
      materialCode: saved.materialCode,
      name: saved.name,
      description: saved.description,
      stockQuantity: saved.stockQuantity,
      minimumStock: saved.minimumStock,
      location: saved.location,
      attributes: saved.attributes,
      version: saved.version,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt
    });

    return saved;
  }

  // Offline: update locally
  const localProduct = await db.products.get(id);
  if (!localProduct) throw new Error('Ürün yerel veritabanında bulunamadı');

  const updatedProduct: LocalProduct = {
    ...localProduct,
    ...updates,
    version: localProduct.version + 1, // INCREMENT local version to prevent conflict on subsequent offline edits
    updatedAt: new Date().toISOString()
  };

  await db.products.put(updatedProduct);

  // Enqueue in sync queue
  await db.syncQueue.add({
    actionType: 'UPDATE',
    payload: { id, updates }, // `updates` correctly contains the OLD version, so the server validates it properly.
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });

  return updatedProduct as unknown as Product;
};

export const deleteProduct = async (id: number): Promise<boolean> => {
  if (isOnline()) {
    await apiClient.delete(`/products/${id}`);
    await db.products.delete(id);
    return true;
  }

  // Offline
  await db.products.delete(id);

  await db.syncQueue.add({
    actionType: 'DELETE',
    payload: { id },
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });

  return true;
};

export const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  // Eğer parentId string geldiyse number'a çevir, null ise null bırak
  const payload = {
    ...category,
    parentId: category.parentId ? Number(category.parentId) : null
  };

  const response = await apiClient.post('/categories', payload);
  return response.data;
};

export const updateCategory = async (id: number, updates: Partial<Category>): Promise<Category> => {
  const response = await apiClient.put(`/categories/${id}`, updates);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  await apiClient.delete(`/categories/${id}`);
  return true;
};
