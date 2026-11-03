import { PrismaClient, ProjectStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/* ─────────────────────────────────────────────
   KATEGORİLER (id'ler sabit: alt kategori eşleşmeleri buna dayanır)
───────────────────────────────────────────── */
const categories = [
  { id: 1, name: 'Direnç', icon: 'Waves', color: 'amber-700', parentId: null, formSchema: [
    { name: 'resistance', label: 'Direnç Değeri', type: 'text', required: true, placeholder: 'örn: 10K, 220R' },
    { name: 'tolerance', label: 'Tolerans', type: 'select', required: false, options: ['±1%', '±2%', '±5%', '±10%'] },
    { name: 'watt', label: 'Güç (Watt)', type: 'text', required: false, placeholder: 'örn: 0.25W' },
    { name: 'package', label: 'Kılıf', type: 'text', required: false, placeholder: 'örn: 0805, 0603, THT' }
  ] },
  { id: 2, name: 'Kondansatör', icon: 'AlignVerticalJustifyCenter', color: 'blue-500', parentId: null, formSchema: [
    { name: 'capacity', label: 'Kapasite Değeri', type: 'text', required: true, placeholder: 'örn: 100nF, 10uF' },
    { name: 'voltage', label: 'Maksimum Voltaj', type: 'text', required: true, placeholder: 'örn: 25V, 50V' },
    { name: 'type', label: 'Tip', type: 'select', required: false, options: ['Elektrolitik', 'Seramik', 'Tantal', 'Polyester'] },
    { name: 'package', label: 'Kılıf', type: 'text', required: false, placeholder: 'örn: SMD, Radial' }
  ] },
  { id: 3, name: 'Bobin', icon: 'CircleDashed', color: 'orange-500', parentId: null, formSchema: [
    { name: 'inductance', label: 'Endüktans Değeri', type: 'text', required: true, placeholder: 'örn: 10uH' },
    { name: 'maxCurrent', label: 'Maks Akım', type: 'text', required: false, placeholder: 'örn: 1A' }
  ] },
  { id: 4, name: 'Yarı İletken Anahtar', icon: 'ToggleLeft', color: 'purple-500', parentId: null, formSchema: [
    { name: 'type', label: 'Anahtar Tipi', type: 'text', required: true, placeholder: 'örn: MOSFET, Transistör' },
    { name: 'voltage', label: 'Voltaj Değeri', type: 'text', required: false },
    { name: 'current', label: 'Akım Değeri', type: 'text', required: false }
  ] },
  { id: 5, name: 'Röle', icon: 'ToggleRight', color: 'red-500', parentId: null, formSchema: [
    { name: 'coilVoltage', label: 'Bobin Voltajı', type: 'text', required: true, placeholder: 'örn: 5V, 12V' },
    { name: 'contactRating', label: 'Kontak Gücü', type: 'text', required: true, placeholder: 'örn: 10A 220VAC' }
  ] },
  { id: 6, name: 'Entegre', icon: 'Cpu', color: 'gray-700', parentId: null, formSchema: [
    { name: 'package', label: 'Kılıf', type: 'text', required: true, placeholder: 'örn: DIP-8, SOIC-8' },
    { name: 'pins', label: 'Pin Sayısı', type: 'text', required: false }
  ] },
  { id: 7, name: 'Çip', icon: 'MemoryStick', color: 'gray-800', parentId: null, formSchema: [
    { name: 'type', label: 'Çip Tipi', type: 'text', required: true, placeholder: 'örn: EEPROM, MCU' }
  ] },
  { id: 8, name: 'Regülatör', icon: 'Gauge', color: 'green-500', parentId: null, formSchema: [
    { name: 'inputVoltage', label: 'Giriş Voltajı', type: 'text', required: false },
    { name: 'outputVoltage', label: 'Çıkış Voltajı', type: 'text', required: true, placeholder: 'örn: 5V, 3.3V' }
  ] },
  { id: 9, name: 'Yarı İletken Bileşenler', icon: 'Zap', color: 'yellow-500', parentId: null, formSchema: [] },
  { id: 10, name: 'Konnektör', icon: 'Plug', color: 'teal-500', parentId: null, formSchema: [] },
  { id: 11, name: 'Diğer', icon: 'Package', color: 'slate-500', parentId: null, formSchema: [] },
  { id: 12, name: 'Ofis Malzemeleri', icon: 'Briefcase', color: 'indigo-500', parentId: null, formSchema: [] },
  { id: 13, name: 'Cihazlar', icon: 'Monitor', color: 'indigo-600', parentId: 12, formSchema: [] },
  { id: 14, name: 'Elektronik Cihazlar', icon: 'Laptop', color: 'indigo-700', parentId: 12, formSchema: [] },
  { id: 15, name: 'THT', icon: 'CircuitBoard', color: 'amber-600', parentId: 1, formSchema: [] },
  { id: 16, name: 'SMD', icon: 'Microchip', color: 'amber-800', parentId: 1, formSchema: [] },
  { id: 17, name: '603', icon: 'BoxSelect', color: 'amber-900', parentId: 16, formSchema: [] },
  { id: 18, name: '1206', icon: 'Maximize', color: 'amber-900', parentId: 16, formSchema: [] },
];

/* ─────────────────────────────────────────────
   TEDARİKÇİLER
───────────────────────────────────────────── */
const suppliers = [
  { name: 'Marmara Komponent A.Ş.', contactName: 'Serkan Yıldız', phone: '+90 216 555 12 34', email: 'siparis@marmarakomponent.com', address: 'İçerenköy Mah. Ataşehir / İstanbul' },
  { name: 'Anadolu Elektronik Ltd.', contactName: 'Elif Kaya', phone: '+90 312 444 78 90', email: 'satis@anadoluelektronik.com', address: 'Kızılay Mah. Çankaya / Ankara' },
  { name: 'Ege Devre Malzemeleri', contactName: 'Murat Demir', phone: '+90 232 333 45 67', email: 'info@egedevre.com', address: 'Bornova / İzmir' },
  { name: 'Bosphorus Chip Ticaret', contactName: 'Ayşe Şahin', phone: '+90 212 222 90 11', email: 'ayse@bosphoruschip.com', address: 'Şişli / İstanbul' },
  { name: 'ATN Soft Tedarik', contactName: 'Mehmet Demir', phone: '+90 850 000 00 00', email: 'tedarik@atnsoft.com', address: 'Teknopark / Gebze' },
];

/* ─────────────────────────────────────────────
   ÜRÜNLER (demo sunum verisi)
───────────────────────────────────────────── */
type ProductSeed = {
  categoryId: number;
  code: string;
  name: string;
  materialCode?: string;
  description: string;
  stock: number;
  min: number;
  location: string;
  attributes: Record<string, string>;
  supplier?: string;
};

const products: ProductSeed[] = [
  // Direnç - 0603
  { categoryId: 17, code: '0603WAF1002T5E', name: '10K 0603 SMD Direnç', materialCode: 'MAT-DR-001', description: '10K ±1% 0.1W 0603 kılıf ince film SMD direnç', stock: 4200, min: 500, location: 'A-01-01', attributes: { resistance: '10K', tolerance: '±1%', watt: '0.1W', package: '0603' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 17, code: '0603WAF1001T5E', name: '1K 0603 SMD Direnç', materialCode: 'MAT-DR-002', description: '1K ±1% 0.1W 0603 kılıf SMD direnç', stock: 3100, min: 500, location: 'A-01-02', attributes: { resistance: '1K', tolerance: '±1%', watt: '0.1W', package: '0603' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 17, code: '0603WAF4701T5E', name: '4.7K 0603 SMD Direnç', materialCode: 'MAT-DR-003', description: '4.7K ±1% 0.1W 0603 kılıf SMD direnç', stock: 1800, min: 400, location: 'A-01-03', attributes: { resistance: '4.7K', tolerance: '±1%', watt: '0.1W', package: '0603' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 17, code: '0603WAF2200T5E', name: '220R 0603 SMD Direnç', materialCode: 'MAT-DR-004', description: '220R ±1% 0.1W 0603 kılıf SMD direnç', stock: 96, min: 400, location: 'A-01-04', attributes: { resistance: '220R', tolerance: '±1%', watt: '0.1W', package: '0603' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 17, code: '0603WAF1003T5E', name: '100K 0603 SMD Direnç', materialCode: 'MAT-DR-005', description: '100K ±1% 0.1W 0603 kılıf SMD direnç', stock: 2400, min: 400, location: 'A-01-05', attributes: { resistance: '100K', tolerance: '±1%', watt: '0.1W', package: '0603' }, supplier: 'Ege Devre Malzemeleri' },

  // Direnç - 1206
  { categoryId: 18, code: '1206W4F1002T5E', name: '10K 1206 SMD Direnç', materialCode: 'MAT-DR-010', description: '10K ±1% 0.25W 1206 kılıf SMD direnç', stock: 1650, min: 300, location: 'A-02-01', attributes: { resistance: '10K', tolerance: '±1%', watt: '0.25W', package: '1206' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 18, code: '1206W4F2200T5E', name: '220R 1206 SMD Direnç', materialCode: 'MAT-DR-011', description: '220R ±1% 0.25W 1206 kılıf SMD direnç', stock: 890, min: 250, location: 'A-02-02', attributes: { resistance: '220R', tolerance: '±1%', watt: '0.25W', package: '1206' }, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 18, code: '1206W4F4701T5E', name: '4.7K 1206 SMD Direnç', materialCode: 'MAT-DR-012', description: '4.7K ±1% 0.25W 1206 kılıf SMD direnç', stock: 1320, min: 250, location: 'A-02-03', attributes: { resistance: '4.7K', tolerance: '±1%', watt: '0.25W', package: '1206' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 18, code: '1206W4J0104T5E', name: '100K 1206 SMD Direnç', materialCode: 'MAT-DR-013', description: '100K ±5% 0.25W 1206 kılıf SMD direnç', stock: 40, min: 250, location: 'A-02-04', attributes: { resistance: '100K', tolerance: '±5%', watt: '0.25W', package: '1206' }, supplier: 'Bosphorus Chip Ticaret' },

  // Direnç - THT
  { categoryId: 15, code: 'CFR-25JB-52-10K', name: '10K THT Karbon Direnç', materialCode: 'MAT-DR-020', description: '10K ±5% 0.25W karbon film THT direnç', stock: 760, min: 150, location: 'A-03-01', attributes: { resistance: '10K', tolerance: '±5%', watt: '0.25W', package: 'THT' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 15, code: 'CFR-25JB-52-1K', name: '1K THT Karbon Direnç', materialCode: 'MAT-DR-021', description: '1K ±5% 0.25W karbon film THT direnç', stock: 540, min: 150, location: 'A-03-02', attributes: { resistance: '1K', tolerance: '±5%', watt: '0.25W', package: 'THT' }, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 15, code: 'MFR-25FBF52-100R', name: '100R THT Metal Film Direnç', materialCode: 'MAT-DR-022', description: '100R ±1% 0.25W metal film THT direnç', stock: 120, min: 100, location: 'A-03-03', attributes: { resistance: '100R', tolerance: '±1%', watt: '0.25W', package: 'THT' }, supplier: 'Ege Devre Malzemeleri' },

  // Kondansatör
  { categoryId: 2, code: 'CAP-100UF-25V', name: '100uF 25V Elektrolitik Kondansatör', materialCode: 'MAT-KD-001', description: '100uF 25V ±20% radyal elektrolitik kondansatör', stock: 640, min: 150, location: 'B-01-01', attributes: { capacity: '100uF', voltage: '25V', type: 'Elektrolitik', package: 'Radial' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 2, code: 'CAP-10UF-16V', name: '10uF 16V Elektrolitik Kondansatör', materialCode: 'MAT-KD-002', description: '10uF 16V ±20% radyal elektrolitik kondansatör', stock: 1180, min: 200, location: 'B-01-02', attributes: { capacity: '10uF', voltage: '16V', type: 'Elektrolitik', package: 'Radial' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 2, code: 'CAP-22PF-50V', name: '22pF 50V Seramik Kondansatör', materialCode: 'MAT-KD-003', description: '22pF 50V NPO seramik SMD 0603 kondansatör', stock: 2200, min: 300, location: 'B-01-03', attributes: { capacity: '22pF', voltage: '50V', type: 'Seramik', package: '0603' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 2, code: 'CAP-1NF-100V', name: '1nF 100V Seramik Kondansatör', materialCode: 'MAT-KD-004', description: '1nF 100V X7R seramik 1206 kondansatör', stock: 950, min: 250, location: 'B-01-04', attributes: { capacity: '1nF', voltage: '100V', type: 'Seramik', package: '1206' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 2, code: 'CAP-470UF-35V', name: '470uF 35V Elektrolitik Kondansatör', materialCode: 'MAT-KD-005', description: '470uF 35V ±20% snap-in elektrolitik kondansatör', stock: 35, min: 100, location: 'B-01-05', attributes: { capacity: '470uF', voltage: '35V', type: 'Elektrolitik', package: 'Snap-in' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 2, code: 'CAP-100NF-1206', name: '100nF SMD Kondansatör', materialCode: 'MAT-KD-006', description: '100nF 50V X7R 1206 SMD Kondansatör', stock: 725, min: 300, location: 'B-04', attributes: { capacity: '100nF', voltage: '50V', type: 'Seramik', package: '1206' }, supplier: 'Marmara Komponent A.Ş.' },

  // Bobin
  { categoryId: 3, code: 'IND-10UH-SMD', name: '10uH SMD Bobin', materialCode: 'MAT-BB-001', description: '10uH ±20% 1.5A yastık tip SMD bobin', stock: 430, min: 100, location: 'B-02-01', attributes: { inductance: '10uH', maxCurrent: '1.5A' }, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 3, code: 'IND-100UH-THT', name: '100uH THT Bobin', materialCode: 'MAT-BB-002', description: '100uH ±10% 500mA radyal THT bobin', stock: 45, min: 80, location: 'B-02-02', attributes: { inductance: '100uH', maxCurrent: '500mA' }, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 3, code: 'IND-4U7-SMD', name: '4.7uH SMD Bobin', materialCode: 'MAT-BB-003', description: '4.7uH ±20% 2A ekranlı SMD bobin', stock: 610, min: 120, location: 'B-02-03', attributes: { inductance: '4.7uH', maxCurrent: '2A' }, supplier: 'Marmara Komponent A.Ş.' },

  // Yarı iletken anahtar
  { categoryId: 4, code: 'MOS-IRF540N', name: 'IRF540N N-Kanal MOSFET', materialCode: 'MAT-YA-001', description: '100V 33A 44mΩ TO-220 N-kanal güç MOSFET', stock: 240, min: 60, location: 'C-01-01', attributes: { type: 'MOSFET', voltage: '100V', current: '33A' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 4, code: 'MOS-IRLZ44N', name: 'IRLZ44N Logic Level MOSFET', materialCode: 'MAT-YA-002', description: '55V 47A logic level N-kanal TO-220 MOSFET', stock: 180, min: 50, location: 'C-01-02', attributes: { type: 'MOSFET', voltage: '55V', current: '47A' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 4, code: 'BJT-BC547', name: 'BC547 NPN Transistör', materialCode: 'MAT-YA-003', description: '45V 100mA NPN TO-92 bipolar transistör', stock: 3100, min: 500, location: 'C-01-03', attributes: { type: 'Transistör', voltage: '45V', current: '100mA' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 4, code: 'BJT-2N2222A', name: '2N2222A NPN Transistör', materialCode: 'MAT-YA-004', description: '40V 800mA NPN TO-18 metal kılıf transistör', stock: 72, min: 100, location: 'C-01-04', attributes: { type: 'Transistör', voltage: '40V', current: '800mA' }, supplier: 'Anadolu Elektronik Ltd.' },

  // Röle
  { categoryId: 5, code: 'REL-5V-SRD', name: '5V SRD Röle', materialCode: 'MAT-RL-001', description: '5V bobinli 10A 250VAC tek kontak PCB röle', stock: 320, min: 80, location: 'C-02-01', attributes: { coilVoltage: '5V', contactRating: '10A 250VAC' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 5, code: 'REL-12V-JQX', name: '12V JQX Röle', materialCode: 'MAT-RL-002', description: '12V bobinli 15A 250VAC güç rölesi', stock: 145, min: 60, location: 'C-02-02', attributes: { coilVoltage: '12V', contactRating: '15A 250VAC' }, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 5, code: 'REL-24V-FINDER', name: '24V Finder Röle', materialCode: 'MAT-RL-003', description: '24V bobinli 8A 250VAC endüstriyel röle', stock: 12, min: 40, location: 'C-02-03', attributes: { coilVoltage: '24V', contactRating: '8A 250VAC' }, supplier: 'Ege Devre Malzemeleri' },

  // Entegre
  { categoryId: 6, code: 'IC-NE555', name: 'NE555 Zamanlayıcı Entegre', materialCode: 'MAT-EN-001', description: 'Zamanlayıcı DIP-8 entegre', stock: 860, min: 150, location: 'C-03-01', attributes: { package: 'DIP-8', pins: '8' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 6, code: 'IC-ATMEGA328P', name: 'ATmega328P Mikrodenetleyici', materialCode: 'MAT-EN-002', description: '8-bit AVR 32KB flash DIP-28 mikrodenetleyici', stock: 96, min: 60, location: 'C-03-02', attributes: { package: 'DIP-28', pins: '28' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 6, code: 'IC-ULN2003', name: 'ULN2003 Darlington Dizisi', materialCode: 'MAT-EN-003', description: '7 kanallı darlington sürücü DIP-16', stock: 340, min: 80, location: 'C-03-03', attributes: { package: 'DIP-16', pins: '16' }, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 6, code: 'IC-MCP23017', name: 'MCP23017 I/O Genişletici', materialCode: 'MAT-EN-004', description: '16-bit I2C I/O genişletici SOIC-28', stock: 185, min: 50, location: 'C-03-04', attributes: { package: 'SOIC-28', pins: '28' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 6, code: 'IC-LM358', name: 'LM358 Op-Amp Entegre', materialCode: 'MAT-EN-005', description: 'Çift kanallı operasyonel yükseltici DIP-8 entegre', stock: 45, min: 10, location: 'C-01', attributes: { package: 'DIP-8', pins: '8' }, supplier: 'Marmara Komponent A.Ş.' },

  // Çip
  { categoryId: 7, code: 'CHIP-ESP32-WROOM', name: 'ESP32-WROOM-32 Modül', materialCode: 'MAT-CP-001', description: 'Wi-Fi + Bluetooth 4MB flash geliştirme modülü', stock: 140, min: 40, location: 'C-04-01', attributes: { type: 'MCU' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 7, code: 'CHIP-STM32F103', name: 'STM32F103C8T6 Çip', materialCode: 'MAT-CP-002', description: 'ARM Cortex-M3 64KB flash LQFP-48 çip', stock: 210, min: 50, location: 'C-04-02', attributes: { type: 'MCU' }, supplier: 'Bosphorus Chip Ticaret' },

  // Regülatör
  { categoryId: 8, code: 'REG-LM7805', name: 'LM7805 5V Regülatör', materialCode: 'MAT-RG-001', description: '5V 1.5A TO-220 lineer gerilim regülatörü', stock: 520, min: 100, location: 'C-05-01', attributes: { inputVoltage: '7-35V', outputVoltage: '5V' }, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 8, code: 'REG-AMS1117-33', name: 'AMS1117 3.3V Regülatör', materialCode: 'MAT-RG-002', description: '3.3V 1A SOT-223 LDO regülatör', stock: 1300, min: 200, location: 'C-05-02', attributes: { inputVoltage: '4.75-15V', outputVoltage: '3.3V' }, supplier: 'Bosphorus Chip Ticaret' },
  { categoryId: 8, code: 'REG-LM317T', name: 'LM317T Ayarlı Regülatör', materialCode: 'MAT-RG-003', description: '1.2-37V 1.5A TO-220 ayarlı regülatör', stock: 68, min: 80, location: 'C-05-03', attributes: { inputVoltage: '40V', outputVoltage: '1.2-37V' }, supplier: 'Ege Devre Malzemeleri' },

  // Yarı iletken bileşenler
  { categoryId: 9, code: 'DIODE-1N4148', name: '1N4148 Anahtarlama Diyotu', materialCode: 'MAT-DY-001', description: '75V 300mA hızlı anahtarlama diyotu DO-35', stock: 5400, min: 800, location: 'D-01-01', attributes: {}, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 9, code: 'DIODE-1N4007', name: '1N4007 Doğrultucu Diyot', materialCode: 'MAT-DY-002', description: '1000V 1A doğrultucu diyot DO-41', stock: 2900, min: 500, location: 'D-01-02', attributes: {}, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 9, code: 'LED-RED-5MM', name: '5mm Kırmızı LED', materialCode: 'MAT-DY-003', description: '5mm kırmızı difüz LED 2V 20mA', stock: 1800, min: 300, location: 'D-01-03', attributes: {}, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 9, code: 'BRIDGE-KBPC', name: 'KBPC3510 Köprü Diyot', materialCode: 'MAT-DY-004', description: '1000V 35A köprü doğrultucu diyot', stock: 24, min: 50, location: 'D-01-04', attributes: {}, supplier: 'Ege Devre Malzemeleri' },

  // Konnektör
  { categoryId: 10, code: 'CONN-USB-C-16P', name: 'USB-C 16 Pin SMD Konnektör', materialCode: 'MAT-KN-001', description: '16 pin USB Type-C şarj/veri dişi konnektör', stock: 740, min: 150, location: 'D-02-01', attributes: {}, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 10, code: 'CONN-JST-XH-4P', name: 'JST XH 4 Pin Konnektör', materialCode: 'MAT-KN-002', description: '2.5mm pitch 4 pin erkek JST XH konnektör', stock: 520, min: 100, location: 'D-02-02', attributes: {}, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 10, code: 'CONN-HEADER-2X20', name: '2x20 Pin Header 2.54mm', materialCode: 'MAT-KN-003', description: '2.54mm pitch 2x20 pin erkek header', stock: 88, min: 100, location: 'D-02-03', attributes: {}, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 10, code: 'CONN-DB9', name: 'DB9 Dişi Konnektör', materialCode: 'MAT-KN-004', description: 'PCB montaj DB9 dişi seri port konnektörü', stock: 210, min: 50, location: 'D-02-04', attributes: {}, supplier: 'Marmara Komponent A.Ş.' },

  // Diğer
  { categoryId: 11, code: 'PCB-PROTO-10X15', name: '10x15cm Delikli Pertinaks', materialCode: 'MAT-DG-001', description: 'Tek taraflı bakır kaplı 10x15cm FR4 pertinaks', stock: 95, min: 40, location: 'E-01-01', attributes: {}, supplier: 'Ege Devre Malzemeleri' },
  { categoryId: 11, code: 'SOLDER-ROSIN-1MM', name: '1mm Reçineli Lehim Teli', materialCode: 'MAT-DG-002', description: '1mm 60/40 reçineli lehim teli 100gr', stock: 62, min: 25, location: 'E-01-02', attributes: {}, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 11, code: 'HEATSINK-TO220', name: 'TO-220 Alüminyum Soğutucu', materialCode: 'MAT-DG-003', description: 'TO-220 kılıflar için 20x15x10mm alüminyum soğutucu', stock: 380, min: 80, location: 'E-01-03', attributes: {}, supplier: 'Ege Devre Malzemeleri' },

  // Cihazlar / ofis
  { categoryId: 13, code: 'DEV-MULTIMETRE-DT9205', name: 'DT9205A Dijital Multimetre', materialCode: 'MAT-CH-001', description: 'Dijital multimetre, 1999 sayım, kapasite ve sıcaklık ölçümü', stock: 14, min: 5, location: 'F-01-01', attributes: {}, supplier: 'Anadolu Elektronik Ltd.' },
  { categoryId: 13, code: 'DEV-HAVYA-936', name: '936 Sıcak Hava İstasyonu', materialCode: 'MAT-CH-002', description: 'Ayarlı sıcaklık lehim istasyonu 60W', stock: 9, min: 3, location: 'F-01-02', attributes: {}, supplier: 'Marmara Komponent A.Ş.' },
  { categoryId: 12, code: 'OFIS-A4-KAGIT', name: 'A4 Fotokopi Kağıdı', materialCode: 'MAT-OF-001', description: '80gr A4 fotokopi kağıdı 500 yaprak', stock: 46, min: 10, location: 'F-02-01', attributes: {}, supplier: 'ATN Soft Tedarik' },
  { categoryId: 12, code: 'OFIS-TONER-HP', name: 'HP 85A Toner Kartuşu', materialCode: 'MAT-OF-002', description: 'HP LaserJet Pro uyumlu 85A toner kartuşu', stock: 7, min: 3, location: 'F-02-02', attributes: {}, supplier: 'ATN Soft Tedarik' },
];

/* ─────────────────────────────────────────────
   PROJELER
───────────────────────────────────────────── */
const projects: Array<{
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date | null;
  items: Array<{ code: string; quantity: number; note?: string }>;
}> = [
  {
    name: 'Endüstriyel Kontrol Kartı Rev-B',
    description: 'PLC haberleşme katı ve röle çıkışları için yeni nesil kontrol kartı üretimi.',
    status: ProjectStatus.ACTIVE,
    startDate: new Date(Date.now() - 21 * 86400000),
    endDate: new Date(Date.now() + 35 * 86400000),
    items: [
      { code: 'IC-ATMEGA328P', quantity: 25, note: 'Ana denetleyici' },
      { code: 'IC-MCP23017', quantity: 25, note: 'I/O genişletici' },
      { code: 'REL-12V-JQX', quantity: 80, note: 'Röle çıkışları' },
      { code: '0603WAF1002T5E', quantity: 500 },
      { code: 'CAP-100UF-25V', quantity: 120 },
      { code: 'CONN-USB-C-16P', quantity: 25 },
    ],
  },
  {
    name: 'Güç Kaynağı Modülü Prototipi',
    description: '24V girişli, 5V ve 3.3V çıkışlı izole güç kaynağı prototipi.',
    status: ProjectStatus.PLANNING,
    startDate: new Date(Date.now() + 7 * 86400000),
    endDate: null,
    items: [
      { code: 'REG-LM7805', quantity: 40 },
      { code: 'REG-AMS1117-33', quantity: 60 },
      { code: 'CAP-470UF-35V', quantity: 40, note: 'Kritik stok - tedarik planlanmalı' },
      { code: 'BRIDGE-KBPC', quantity: 20, note: 'Kritik stok' },
      { code: 'HEATSINK-TO220', quantity: 40 },
    ],
  },
  {
    name: 'Sensör Kartı Seri Üretim',
    description: 'Sıcaklık ve nem sensörü içeren kompakt ölçüm kartı seri üretimi (tamamlandı).',
    status: ProjectStatus.COMPLETED,
    startDate: new Date(Date.now() - 120 * 86400000),
    endDate: new Date(Date.now() - 30 * 86400000),
    items: [
      { code: 'CHIP-ESP32-WROOM', quantity: 60 },
      { code: 'IC-LM358', quantity: 60 },
      { code: '0603WAF1001T5E', quantity: 300 },
      { code: 'CAP-22PF-50V', quantity: 250 },
      { code: 'CONN-JST-XH-4P', quantity: 60 },
    ],
  },
];

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: bcrypt.hashSync('admin123', 10), role: 'ADMIN', isActive: true },
    create: { username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'ADMIN', isActive: true },
  });
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: { passwordHash: bcrypt.hashSync('user123', 10), role: 'USER', isActive: true },
    create: { username: 'user', passwordHash: bcrypt.hashSync('user123', 10), role: 'USER', isActive: true },
  });
  const depo = await prisma.user.upsert({
    where: { username: 'depo' },
    update: { passwordHash: bcrypt.hashSync('depo123', 10), role: 'USER', isActive: true },
    create: { username: 'depo', passwordHash: bcrypt.hashSync('depo123', 10), role: 'USER', isActive: true },
  });
  console.log('  • Kullanıcılar: admin / user / depo');
  return { admin, user, depo };
}

async function seedCategories() {
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({ where: { id: cat.id } });
    if (existing) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { name: cat.name, icon: cat.icon, color: cat.color, parentId: cat.parentId, formSchema: cat.formSchema, deletedAt: null },
      });
    } else {
      await prisma.category.create({
        data: { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, parentId: cat.parentId, formSchema: cat.formSchema },
      });
    }
  }
  // Explicit id ile eklenen kayıtlar için sequence'i düzelt
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('categories', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM categories), 1))`
  );
  console.log(`  • Kategoriler: ${categories.length} adet`);
}

async function seedSuppliers() {
  const map = new Map<string, number>();
  for (const s of suppliers) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    const record = existing
      ? await prisma.supplier.update({ where: { id: existing.id }, data: s })
      : await prisma.supplier.create({ data: s });
    map.set(s.name, record.id);
  }
  console.log(`  • Tedarikçiler: ${suppliers.length} adet`);
  return map;
}

async function seedProducts(supplierMap: Map<string, number>) {
  let created = 0;
  let updated = 0;
  const productIds = new Map<string, number>();

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { productCode: p.code } });
    const data = {
      categoryId: p.categoryId,
      productCode: p.code,
      materialCode: p.materialCode ?? null,
      name: p.name,
      description: p.description,
      stockQuantity: p.stock,
      minimumStock: p.min,
      location: p.location,
      attributes: p.attributes,
      supplierId: p.supplier ? supplierMap.get(p.supplier) ?? null : null,
      deletedAt: null,
    };

    const record = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data: { ...data, version: 1 } });

    if (existing) updated++; else created++;
    productIds.set(p.code, record.id);
  }

  console.log(`  • Ürünler: ${created} yeni, ${updated} güncellendi (toplam ${products.length})`);
  return productIds;
}

async function seedMovements(productIds: Map<string, number>, users: { admin: { id: number }; user: { id: number }; depo: { id: number } }) {
  const staff = [users.admin.id, users.user.id, users.depo.id];
  let created = 0;

  for (const [index, p] of products.entries()) {
    const productId = productIds.get(p.code);
    if (!productId) continue;

    const movementCount = await prisma.stockMovement.count({ where: { productId } });
    if (movementCount > 0) continue;

    const used = Math.max(10, Math.round(p.stock * 0.15));
    const initialDate = new Date(Date.now() - (52 - (index % 20)) * 86400000 + 9 * 3600000);
    const outDate = new Date(Date.now() - (4 + (index % 18)) * 86400000 + 14 * 3600000);

    await prisma.stockMovement.create({
      data: {
        productId,
        userId: staff[index % staff.length],
        changeAmount: p.stock + used,
        movementType: 'IN',
        reason: 'Tedarikçi sevkiyatı - dönem açılış stoğu',
        createdAt: initialDate,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId,
        userId: staff[(index + 1) % staff.length],
        changeAmount: -used,
        movementType: 'OUT',
        reason: index % 3 === 0 ? 'Üretim hattına sarf' : index % 3 === 1 ? 'Proje için kullanıldı' : 'Müşteri siparişi',
        createdAt: outDate,
      },
    });
    created += 2;
  }

  console.log(`  • Stok hareketleri: ${created} adet eklendi`);
}

async function seedProjects(adminId: number, productIds: Map<string, number>) {
  let createdProjects = 0;
  let assignments = 0;

  for (const project of projects) {
    let record = await prisma.project.findFirst({ where: { name: project.name } });

    if (!record) {
      record = await prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          createdById: adminId,
        },
      });
      createdProjects++;
    }

    for (const item of project.items) {
      const productId = productIds.get(item.code);
      if (!productId) continue;

      const existing = await prisma.projectProduct.findUnique({
        where: { projectId_productId: { projectId: record.id, productId } },
      });
      if (existing) continue;

      await prisma.projectProduct.create({
        data: {
          projectId: record.id,
          productId,
          quantity: item.quantity,
          note: item.note ?? null,
          assignedById: adminId,
        },
      });
      assignments++;
    }
  }

  console.log(`  • Projeler: ${createdProjects} yeni proje, ${assignments} malzeme ataması`);
}

async function seedNotifications(productIds: Map<string, number>) {
  let created = 0;

  for (const p of products) {
    if (p.stock > p.min) continue;
    const productId = productIds.get(p.code);
    if (!productId) continue;

    const existing = await prisma.notification.findFirst({ where: { productId } });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        productId,
        message: `${p.code} (${p.name}) stok seviyesi minimum sınırın altında: ${p.stock} adet!`,
        isRead: false,
      },
    });
    created++;
  }

  console.log(`  • Bildirimler: ${created} kritik stok uyarısı`);
}

async function main() {
  console.log('\nStockFlow demo verisi yükleniyor...\n');

  const users = await seedUsers();
  await seedCategories();
  const supplierMap = await seedSuppliers();
  const productIds = await seedProducts(supplierMap);
  await seedMovements(productIds, users);
  await seedProjects(users.admin.id, productIds);
  await seedNotifications(productIds);

  console.log('\nDemo verisi hazır.');
  console.log('Giriş bilgileri → admin / admin123  |  user / user123  |  depo / depo123\n');
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
