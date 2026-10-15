import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const localDbUrl = process.env.DATABASE_URL;
const remoteDbUrl = process.env.REMOTE_DATABASE_URL;

if (!remoteDbUrl) {
  console.error("ERROR: REMOTE_DATABASE_URL environment variable is not defined!");
  process.exit(1);
}

console.log("Connecting to local database...");
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: localDbUrl,
    },
  },
});

console.log("Connecting to remote database...");
const remotePrisma = new PrismaClient({
  datasources: {
    db: {
      url: remoteDbUrl,
    },
  },
});

async function main() {
  console.log("Starting data synchronization from local to remote production database...");

  // 1. Clean remote database (in correct order of dependencies)
  console.log("Cleaning remote database tables...");
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "push_subscriptions" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "audit_logs" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "sync_queue" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "product_images" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "notifications" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "stock_movements" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "products" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "categories" CASCADE;`);
  await remotePrisma.$executeRawUnsafe(`TRUNCATE TABLE "users" CASCADE;`);
  console.log("Remote database tables cleaned.");

  // 2. Copy Users
  console.log("Copying users...");
  const users = await localPrisma.user.findMany();
  for (const u of users) {
    await remotePrisma.user.create({ data: u });
  }
  console.log(`Copied ${users.length} users.`);

  // 3. Copy Categories (with parentId set to null first to avoid relation issues, then update them)
  console.log("Copying categories...");
  const categories = await localPrisma.category.findMany();
  for (const c of categories) {
    const { parentId, ...catData } = c;
    await remotePrisma.category.create({
      data: {
        ...catData,
        formSchema: catData.formSchema as any,
        parentId: null
      }
    });
  }
  // Update parentIds
  for (const c of categories) {
    if (c.parentId !== null) {
      await remotePrisma.category.update({
        where: { id: c.id },
        data: { parentId: c.parentId }
      });
    }
  }
  console.log(`Copied ${categories.length} categories.`);

  // 4. Copy Products
  console.log("Copying products...");
  const products = await localPrisma.product.findMany();
  for (const p of products) {
    await remotePrisma.product.create({
      data: {
        ...p,
        attributes: p.attributes as any
      }
    });
  }
  console.log(`Copied ${products.length} products.`);

  // 5. Copy Stock Movements
  console.log("Copying stock movements...");
  const movements = await localPrisma.stockMovement.findMany();
  for (const m of movements) {
    await remotePrisma.stockMovement.create({ data: m });
  }
  console.log(`Copied ${movements.length} stock movements.`);

  // 6. Copy Product Images
  console.log("Copying product images...");
  const images = await localPrisma.productImage.findMany();
  for (const img of images) {
    await remotePrisma.productImage.create({ data: img });
  }
  console.log(`Copied ${images.length} product images.`);

  // 7. Copy Notifications
  console.log("Copying notifications...");
  const notifications = await localPrisma.notification.findMany();
  for (const n of notifications) {
    await remotePrisma.notification.create({ data: n });
  }
  console.log(`Copied ${notifications.length} notifications.`);

  // 8. Copy Sync Queue
  console.log("Copying sync queue...");
  const syncQueue = await localPrisma.syncQueue.findMany();
  for (const sq of syncQueue) {
    await remotePrisma.syncQueue.create({
      data: {
        ...sq,
        payload: sq.payload as any
      }
    });
  }
  console.log(`Copied ${syncQueue.length} sync queue entries.`);

  // 9. Copy Audit Logs
  console.log("Copying audit logs...");
  const auditLogs = await localPrisma.auditLog.findMany();
  for (const al of auditLogs) {
    await remotePrisma.auditLog.create({
      data: {
        ...al,
        oldData: al.oldData as any,
        newData: al.newData as any
      }
    });
  }
  console.log(`Copied ${auditLogs.length} audit logs.`);

  // 10. Copy Push Subscriptions
  console.log("Copying push subscriptions...");
  const subs = await localPrisma.pushSubscription.findMany();
  for (const sub of subs) {
    await remotePrisma.pushSubscription.create({
      data: {
        ...sub,
        keys: sub.keys as any
      }
    });
  }
  console.log(`Copied ${subs.length} push subscriptions.`);

  // 11. Reset auto-increment sequences
  console.log("Resetting database auto-increment sequences in PostgreSQL...");
  const tables = [
    { name: 'users', field: 'id' },
    { name: 'categories', field: 'id' },
    { name: 'products', field: 'id' },
    { name: 'stock_movements', field: 'id' },
    { name: 'notifications', field: 'id' },
    { name: 'product_images', field: 'id' },
    { name: 'sync_queue', field: 'id' },
    { name: 'audit_logs', field: 'id' },
    { name: 'push_subscriptions', field: 'id' }
  ];

  for (const table of tables) {
    await remotePrisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table.name}"', '${table.field}'), coalesce(max("${table.field}"), 1)) FROM "${table.name}";`
    );
  }
  console.log("Database auto-increment sequences reset successfully.");

  console.log("Synchronization completed successfully! 🎉");
}

main()
  .catch((err) => {
    console.error("Error during database synchronization:", err);
    process.exit(1);
  })
  .finally(async () => {
    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();
  });
