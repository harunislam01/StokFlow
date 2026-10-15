import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const resistorData = [
  {"code": "CRT03J7E1001", "type": "smd", "package": "0603", "value": "1K", "tolerance": "±5%", "qty": 67},
  {"code": "1206W4J0331T5E", "type": "smd", "package": "1206", "value": "330", "tolerance": "±5%", "qty": 95},
  {"code": "1206S4F3601T5E", "type": "smd", "package": "1206", "value": "3.6k", "tolerance": "±1%", "qty": 99},
  {"code": "CRT06F7E1802", "type": "smd", "package": "1206", "value": "18.k", "tolerance": "±1%", "qty": 101},
  {"code": "1206S4F270JT5E", "type": "smd", "package": "1206", "value": "27", "tolerance": "±5%", "qty": 99},
  {"code": "1206S4J0470T5E", "type": "smd", "package": "1206", "value": "47", "tolerance": "±5%", "qty": 101},
  {"code": "DSTK6541", "type": "smd", "package": "0603", "value": "10.k", "tolerance": "±5%", "qty": 186},
  {"code": "1206S4F4700T5E", "type": "smd", "package": "1206", "value": "470", "tolerance": "±1%", "qty": 103},
  {"code": "1206S4F2001T5E", "type": "smd", "package": "1206", "value": "2.k", "tolerance": "±1%", "qty": 101},
  {"code": "1206S4F1004T5E", "type": "smd", "package": "1206", "value": "1.M", "tolerance": "±1%", "qty": 94},
  {"code": "1206S4F5100T5E", "type": "smd", "package": "1206", "value": "510", "tolerance": "±1%", "qty": 103},
  {"code": "1206S4J015KT5E", "type": "smd", "package": "1206", "value": "150.m", "tolerance": "±5%", "qty": 24},
  {"code": "1206S4F8201T5E", "type": "smd", "package": "1206", "value": "8.2 k", "tolerance": "±1%", "qty": 101},
  {"code": "1206S4F5103T5E", "type": "smd", "package": "1206", "value": "510.k", "tolerance": "±1%", "qty": 100},
  {"code": "RC1206FR-07220KL", "type": "smd", "package": "1206", "value": "220.k", "tolerance": "±1%", "qty": 99},
  {"code": "1206S4F2003T5E", "type": "smd", "package": "1206", "value": "200.k", "tolerance": "±1%", "qty": 100},
  {"code": "1206S4F3003T5E", "type": "smd", "package": "1206", "value": "300.k", "tolerance": "±1%", "qty": 100},
  {"code": "1206S4J0434T5E", "type": "smd", "package": "1206", "value": "430.k", "tolerance": "±5%", "qty": 100},
  {"code": "1206S4J0754T5E", "type": "smd", "package": "1206", "value": "750.k", "tolerance": "±5%", "qty": 100},
  {"code": "1206S4F4023T5E", "type": "smd", "package": "1206", "value": "402.k", "tolerance": "±1%", "qty": 100},
  {"code": "RC1206FR-0710KL", "type": "smd", "package": "1206", "value": "10.k", "tolerance": "±1%", "qty": 100},
  {"code": "HP122WF100JT4E", "type": "smd", "package": "1206", "value": "10", "tolerance": "±5%", "qty": 83},
  {"code": "MF0W4FF470JA50", "type": "tht", "package": "0207", "value": "47", "tolerance": "±1%", "qty": 17},
  {"code": "MFR200JT-73-0R16", "type": "tht", "package": "0617", "value": "160.m", "tolerance": "±5%", "qty": 20},
  {"code": "CFR0W4J0511A50", "type": "tht", "package": "0207", "value": "510", "tolerance": "±5%", "qty": 20},
  {"code": "0603WAF5601T5E", "type": "smd", "package": "0603", "value": "5.6 k", "tolerance": "±1%", "qty": 91},
  {"code": "CQ06S4J0302T5E", "type": "smd", "package": "0603", "value": "30.k", "tolerance": "±5%", "qty": 101},
  {"code": "ESR03EZPF1002", "type": "smd", "package": "0603", "value": "10.k", "tolerance": "±1%", "qty": 187},
  {"code": "PS03W4F1003T5E", "type": "smd", "package": "0603", "value": "100.k", "tolerance": "±1%", "qty": 83},
  {"code": "CRGP0603F47R", "type": "smd", "package": "0603", "value": "47", "tolerance": "±1%", "qty": 46},
  {"code": "0603SAJ0101T5E", "type": "smd", "package": "0603", "value": "100", "tolerance": "±5%", "qty": 57},
  {"code": "0603WAJ0000T5E", "type": "smd", "package": "0603", "value": "0", "tolerance": "±5%", "qty": 67},
  {"code": "HP03W5F2001T5E", "type": "smd", "package": "0603", "value": "2.k", "tolerance": "±1%", "qty": 79},
  {"code": "PS03W4F1001T5E", "type": "smd", "package": "0603", "value": "1.k", "tolerance": "±1%", "qty": 164},
  {"code": "FMP200JT-52-0R1", "type": "tht", "package": "0617", "value": "100m", "tolerance": "±5%", "qty": 9},
  {"code": "MF01WJJ0103A10", "type": "tht", "package": "0414", "value": "10.k", "tolerance": "±5%", "qty": 16},
  {"code": "CFR200JT-73-0R2", "type": "tht", "package": "0617", "value": "200m", "tolerance": "±5%", "qty": 10},
  {"code": "MFR200FBF73-0R91", "type": "tht", "package": "0617", "value": "910m", "tolerance": "±1%", "qty": 5},
  {"code": "MFR200JT-73-0R62", "type": "tht", "package": "0617", "value": "620m", "tolerance": "±5%", "qty": 10},
  {"code": "MFR200JT-73-0R3", "type": "tht", "package": "0617", "value": "300m", "tolerance": "±5%", "qty": 10},
  {"code": "MF01WJJ0102A10", "type": "tht", "package": "0414", "value": "1k", "tolerance": "±5%", "qty": 16},
  {"code": "UNK-1206-1K-1", "type": "smd", "package": "1206", "value": "1k", "tolerance": "±5%", "qty": 60},
  {"code": "UNK-1206-2-2K", "type": "smd", "package": "1206", "value": "2.2k", "tolerance": "±5%", "qty": 98},
  {"code": "UNK-1206-0R", "type": "smd", "package": "1206", "value": "0", "tolerance": "±5%", "qty": 93},
  {"code": "UNK-1206-1K-2", "type": "smd", "package": "1206", "value": "1k", "tolerance": "±5%", "qty": 91},
  {"code": "UNK-1206-100R", "type": "smd", "package": "1206", "value": "100", "tolerance": "±5%", "qty": 98}
];

async function main() {
  console.log('Seeding resistor table data...');

  let insertedCount = 0;

  for (const item of resistorData) {
    let categoryId = 1; // Default Direnç
    
    // Determine category based on type and package
    if (item.type.toLowerCase().trim() === 'smd' || item.type.toLowerCase().trim() === 'smd.') {
      if (item.package === '0603') categoryId = 17;
      else if (item.package === '1206') categoryId = 18;
      else categoryId = 16; // SMD
    } else if (item.type.toLowerCase() === 'tht') {
      categoryId = 15; // THT
    }

    try {
      const descriptionStr = `Direnç Değeri: ${item.value}, Tolerans: ${item.tolerance}, Montaj Tipi: ${item.type.toUpperCase()}, Kılıf: ${item.package}`;
      const existing = await prisma.product.findFirst({ where: { productCode: item.code } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { 
            name: `${item.value} Ohm ${item.type.toUpperCase()} Direnç (${item.package})`,
            description: descriptionStr,
            stockQuantity: item.qty,
            attributes: {
              resistance: item.value,
              tolerance: item.tolerance,
              package: item.package
            }
          }
        });
      } else {
        await prisma.product.create({
          data: {
            categoryId: categoryId,
            productCode: item.code,
            name: `${item.value} Ohm ${item.type.toUpperCase()} Direnç (${item.package})`,
            description: descriptionStr,
            stockQuantity: item.qty,
            minimumStock: 10,
            location: 'Depo',
            attributes: {
              resistance: item.value,
              tolerance: item.tolerance,
              package: item.package
            },
            version: 1
          }
        });
      }
      insertedCount++;
    } catch(err) {
      console.error(`Error inserting ${item.code}:`, err);
    }
  }

  console.log(`Successfully processed ${insertedCount} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
