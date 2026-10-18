import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with original categories...');

  // Veritabanında zaten veri varsa seed işlemini atla (Veri kaybını önlemek için)
  const categoryCount = await prisma.category.count();
  if (categoryCount > 0) {
    console.log('Database already contains data. Skipping initial seed to prevent data loss.');
    return;
  }

  // 1. Create Default Admin User
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN' },
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 2. Create Default Test User
  const userPasswordHash = bcrypt.hashSync('user123', 10);
  await prisma.user.upsert({
    where: { username: 'user' },
    update: { passwordHash: userPasswordHash, role: 'USER' },
    create: {
      username: 'user',
      passwordHash: userPasswordHash,
      role: 'USER',
      isActive: true,
    },
  });

  // 3. Categories Data matching constants.ts exactly
  // We will insert them with explicit IDs or map their tree correctly.
  // Root categories first
  const rootCategories = [
    { id: 1, name: 'Direnç', icon: 'Waves', color: 'amber-700', formSchema: [
      { name: 'resistance', label: 'Direnç Değeri', type: 'text', required: true, placeholder: 'örn: 10K, 220R' },
      { name: 'tolerance', label: 'Tolerans', type: 'select', required: false, options: ['±1%', '±2%', '±5%', '±10%'] },
      { name: 'watt', label: 'Güç (Watt)', type: 'text', required: false, placeholder: 'örn: 0.25W' },
      { name: 'package', label: 'Kılıf', type: 'text', required: false, placeholder: 'örn: 0805, 0603, THT' }
    ]},
    { id: 2, name: 'Kondansatör', icon: 'AlignVerticalJustifyCenter', color: 'blue-500', formSchema: [
      { name: 'capacity', label: 'Kapasite Değeri', type: 'text', required: true, placeholder: 'örn: 100nF, 10uF' },
      { name: 'voltage', label: 'Maksimum Voltaj', type: 'text', required: true, placeholder: 'örn: 25V, 50V' },
      { name: 'type', label: 'Tip', type: 'select', required: false, options: ['Elektrolitik', 'Seramik', 'Tantal', 'Polyester'] },
      { name: 'package', label: 'Kılıf', type: 'text', required: false, placeholder: 'örn: SMD, Radial' }
    ]},
    { id: 3, name: 'Bobin', icon: 'CircleDashed', color: 'orange-500', formSchema: [
      { name: 'inductance', label: 'Endüktans Değeri', type: 'text', required: true, placeholder: 'örn: 10uH' },
      { name: 'maxCurrent', label: 'Maks Akım', type: 'text', required: false, placeholder: 'örn: 1A' }
    ]},
    { id: 4, name: 'Yarı İletken Anahtar', icon: 'ToggleLeft', color: 'purple-500', formSchema: [
      { name: 'type', label: 'Anahtar Tipi', type: 'text', required: true, placeholder: 'örn: MOSFET, Transistör' },
      { name: 'voltage', label: 'Voltaj Değeri', type: 'text', required: false },
      { name: 'current', label: 'Akım Değeri', type: 'text', required: false }
    ]},
    { id: 5, name: 'Röle', icon: 'ToggleRight', color: 'red-500', formSchema: [
      { name: 'coilVoltage', label: 'Bobin Voltajı', type: 'text', required: true, placeholder: 'örn: 5V, 12V' },
      { name: 'contactRating', label: 'Kontak Gücü', type: 'text', required: true, placeholder: 'örn: 10A 220VAC' }
    ]},
    { id: 6, name: 'Entegre', icon: 'Cpu', color: 'gray-700', formSchema: [
      { name: 'package', label: 'Kılıf', type: 'text', required: true, placeholder: 'örn: DIP-8, SOIC-8' },
      { name: 'pins', label: 'Pin Sayısı', type: 'text', required: false }
    ]},
    { id: 7, name: 'Çip', icon: 'MemoryStick', color: 'gray-800', formSchema: [
      { name: 'type', label: 'Çip Tipi', type: 'text', required: true, placeholder: 'örn: EEPROM, MCU' }
    ]},
    { id: 8, name: 'Regülatör', icon: 'Gauge', color: 'green-500', formSchema: [
      { name: 'inputVoltage', label: 'Giriş Voltajı', type: 'text', required: false },
      { name: 'outputVoltage', label: 'Çıkış Voltajı', type: 'text', required: true, placeholder: 'örn: 5V, 3.3V' }
    ]},
    { id: 9, name: 'Yarı İletken Bileşenler', icon: 'Zap', color: 'yellow-500', formSchema: [] },
    { id: 10, name: 'Konnektör', icon: 'Plug', color: 'teal-500', formSchema: [] },
    { id: 11, name: 'Diğer', icon: 'Package', color: 'slate-500', formSchema: [] },
    { id: 12, name: 'Ofis Malzemeleri', icon: 'Briefcase', color: 'indigo-500', formSchema: [] }
  ];

  for (const cat of rootCategories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        formSchema: cat.formSchema,
      }
    });
  }

  // Sub-categories (ParentId mapping)
  const subCategories = [
    { id: 13, name: 'Cihazlar', icon: 'Monitor', color: 'indigo-600', parentId: 12, formSchema: [] },
    { id: 14, name: 'Elektronik Cihazlar', icon: 'Laptop', color: 'indigo-700', parentId: 12, formSchema: [] },
    { id: 15, name: 'THT', icon: 'CircuitBoard', color: 'amber-600', parentId: 1, formSchema: [] },
    { id: 16, name: 'SMD', icon: 'Microchip', color: 'amber-800', parentId: 1, formSchema: [] },
  ];

  for (const cat of subCategories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        parentId: cat.parentId,
        formSchema: cat.formSchema,
      }
    });
  }

  // Sub-sub categories
  const subSubCategories = [
    { id: 17, name: '603', icon: 'BoxSelect', color: 'amber-900', parentId: 16, formSchema: [] },
    { id: 18, name: '1206', icon: 'Maximize', color: 'amber-900', parentId: 16, formSchema: [] }
  ];

  for (const cat of subSubCategories) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        parentId: cat.parentId,
        formSchema: cat.formSchema,
      }
    });
  }

  // 4. Seed Test Products (Matching User's Previous Products)
  const productData = [
    {
      categoryId: 1, // Direnç
      productCode: 'RES-10K-0805',
      name: '10K SMD Direnç',
      description: 'Direnç Değeri: 10K, Tolerans: ±1%, Güç: 0.125W, Kılıf: 0805',
      stockQuantity: 1500,
      minimumStock: 100,
      location: 'A-12',
      attributes: {
        resistance: '10K',
        tolerance: '±1%',
        watt: '0.125W',
        package: '0805'
      }
    },
    {
      categoryId: 2, // Kondansatör
      productCode: 'CAP-100NF-1206',
      name: '100nF SMD Kondansatör',
      description: '100nF 50V X7R 1206 SMD Kondansatör',
      stockQuantity: 200,
      minimumStock: 300, // Trigger low stock since stock is 200
      location: 'B-04',
      attributes: {
        capacity: '100nF',
        voltage: '50V',
        type: 'Seramik',
        package: '1206'
      }
    },
    {
      categoryId: 6, // Entegre
      productCode: 'IC-LM358',
      name: 'LM358 Op-Amp Entegre',
      description: 'Çift Kanallı Operasyonel Yükseltici DIP-8 Entegre',
      stockQuantity: 45,
      minimumStock: 10,
      location: 'C-01',
      attributes: {
        package: 'DIP-8',
        pins: '8'
      }
    }
  ];

  for (const p of productData) {
    await prisma.product.create({
      data: {
        categoryId: p.categoryId,
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        stockQuantity: p.stockQuantity,
        minimumStock: p.minimumStock,
        location: p.location,
        attributes: p.attributes,
        version: 1
      }
    });
  }

  console.log('Database seeding successfully completed with 18 categories and 3 test products.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
