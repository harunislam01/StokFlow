import type { Product, Category } from '../types';

export const mockCategories: Category[] = [
  { id: 1, name: 'Direnç', icon: 'Waves', color: 'amber-700' },
  { id: 2, name: 'Kondansatör', icon: 'AlignVerticalJustifyCenter', color: 'blue-500' },
  { id: 3, name: 'Bobin', icon: 'CircleDashed', color: 'orange-500' },
  { id: 4, name: 'Yarı İletken Anahtar', icon: 'ToggleLeft', color: 'purple-500' },
  { id: 5, name: 'Röle', icon: 'ToggleRight', color: 'red-500' },
  { id: 6, name: 'Entegre', icon: 'Cpu', color: 'gray-700' },
  { id: 7, name: 'Çip', icon: 'MemoryStick', color: 'gray-800' },
  { id: 8, name: 'Regülatör', icon: 'Gauge', color: 'green-500' },
  { id: 9, name: 'Yarı İletken Bileşenler', icon: 'Zap', color: 'yellow-500' },
  { id: 10, name: 'Konnektör', icon: 'Plug', color: 'teal-500' },
  { id: 11, name: 'Diğer', icon: 'Package', color: 'slate-500' },
  { id: 12, name: 'Ofis Malzemeleri', icon: 'Briefcase', color: 'indigo-500' },
  { id: 15, name: 'THT', icon: 'CircuitBoard', color: 'amber-600', parentId: 1 },
  { id: 16, name: 'SMD', icon: 'Microchip', color: 'amber-800', parentId: 1 },
  { id: 17, name: '603', icon: 'BoxSelect', color: 'amber-900', parentId: 16 },
  { id: 18, name: '1206', icon: 'Maximize', color: 'amber-900', parentId: 16 }
];

const resistorRaw = [
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

export const mockProducts: Product[] = resistorRaw.map((item, idx) => {
  let categoryId = 1; // Default Direnç
  if (item.type === 'smd') {
    if (item.package === '0603') categoryId = 17;
    else if (item.package === '1206') categoryId = 18;
    else categoryId = 16;
  } else if (item.type === 'tht') {
    categoryId = 15;
  }

  return {
    id: idx + 1,
    categoryId: categoryId,
    productCode: item.code,
    name: `${item.value} Ohm ${item.type.toUpperCase()} Direnç (${item.package})`,
    description: `Direnç Değeri: ${item.value}, Tolerans: ${item.tolerance}, Montaj Tipi: ${item.type.toUpperCase()}, Kılıf: ${item.package}`,
    stockQuantity: item.qty,
    minimumStock: 10,
    location: 'Depo',
    attributes: {
      resistance: item.value,
      tolerance: item.tolerance,
      package: item.package
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
});

export const mockStockMovements = [];
export const mockUsers = [];
