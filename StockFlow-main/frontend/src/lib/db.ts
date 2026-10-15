import Dexie, { type Table } from 'dexie';

export interface LocalCategory {
  id: number;
  name: string;
  parentId?: number | null;
  icon?: string | null;
  color?: string | null;
  formSchema?: any;
  productCount?: number;
}

export interface LocalProduct {
  id: number;
  categoryId: number;
  productCode: string;
  materialCode?: string | null;
  name: string;
  description?: string | null;
  stockQuantity: number;
  minimumStock: number;
  location?: string | null;
  attributes: any;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalSyncItem {
  id?: number;
  actionType: 'STOCK_IN' | 'STOCK_OUT' | 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'FAILED';
  createdAt: string;
}

/* ─────────────────────────────────────
   IN-MEMORY FALLBACK FOR BLOCKED INDEXEDDB (e.g. iOS Safari yerel ağ)
───────────────────────────────────── */
class InMemoryTable<T, Key> {
  private data = new Map<Key, T>();

  async get(key: Key): Promise<T | undefined> {
    return this.data.get(key);
  }

  async put(item: T, key?: Key): Promise<any> {
    const k = key || (item as any).id;
    this.data.set(k, item);
    return k;
  }

  async bulkPut(items: T[]): Promise<void> {
    items.forEach(item => {
      const k = (item as any).id;
      this.data.set(k, item);
    });
  }

  async toArray(): Promise<T[]> {
    return Array.from(this.data.values());
  }

  async update(key: Key, changes: Partial<T>): Promise<boolean> {
    const item = this.data.get(key);
    if (!item) return false;
    this.data.set(key, { ...item, ...changes });
    return true;
  }

  async delete(key: Key): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async count(): Promise<number> {
    return this.data.size;
  }

  where(index: string) {
    const table = this;
    return {
      equals(value: any) {
        return {
          async toArray(): Promise<T[]> {
            const arr = await table.toArray();
            return arr.filter(item => (item as any)[index] === value);
          }
        };
      }
    };
  }

  async add(item: T): Promise<any> {
    const id = (item as any).id || Math.floor(Math.random() * -1000000);
    const newItem = { ...item, id };
    this.data.set(id as unknown as Key, newItem);
    return id;
  }
}

export class ElectromTechLocalDB extends Dexie {
  products!: Table<LocalProduct, number>;
  categories!: Table<LocalCategory, number>;
  syncQueue!: Table<LocalSyncItem, number>;

  constructor() {
    super('ElectromTechLocalDB');
    this.version(1).stores({
      products: 'id, categoryId, productCode, name, location',
      categories: 'id, parentId, name',
      syncQueue: '++id, actionType, status, createdAt'
    });
  }
}

let activeDb: any = new ElectromTechLocalDB();

// Fallback detection logic
try {
  activeDb.open().catch((err: any) => {
    console.warn("IndexedDB initialization failed. Falling back to in-memory store:", err);
    fallbackToMemory();
  });
} catch (e) {
  console.warn("IndexedDB is not supported. Falling back to in-memory store:", e);
  fallbackToMemory();
}

function fallbackToMemory() {
  activeDb = {
    products: new InMemoryTable<LocalProduct, number>(),
    categories: new InMemoryTable<LocalCategory, number>(),
    syncQueue: new InMemoryTable<LocalSyncItem, number>(),
    open: async () => {},
    close: () => {}
  };
}

export { activeDb as db };
