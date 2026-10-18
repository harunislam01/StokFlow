import type { Category } from '../types';

export const CATEGORIES: Category[] = [
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
  { id: 13, name: 'Cihazlar', icon: 'Monitor', color: 'indigo-600', parentId: 12 },
  { id: 14, name: 'Elektronik Cihazlar', icon: 'Laptop', color: 'indigo-700', parentId: 12 },
  { id: 15, name: 'THT', icon: 'CircuitBoard', color: 'amber-600', parentId: 1 },
  { id: 16, name: 'SMD', icon: 'Microchip', color: 'amber-800', parentId: 1 },
  { id: 17, name: '603', icon: 'BoxSelect', color: 'amber-900', parentId: 16 },
  { id: 18, name: '1206', icon: 'Maximize', color: 'amber-900', parentId: 16 },
];
