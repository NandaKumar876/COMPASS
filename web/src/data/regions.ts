import type { Region } from '../types';

export const regions: Region[] = [
  { name: 'Andhra Pradesh', saturation: 0.45, need_index: 0.65, population: 53000000 },
  { name: 'Assam', saturation: 0.2, need_index: 0.8, population: 35000000 },
  { name: 'Bihar', saturation: 0.15, need_index: 0.9, population: 124000000 },
  { name: 'Chhattisgarh', saturation: 0.18, need_index: 0.82, population: 29000000 },
  { name: 'Delhi', saturation: 0.75, need_index: 0.4, population: 20000000 },
  { name: 'Gujarat', saturation: 0.55, need_index: 0.5, population: 64000000 },
  { name: 'Haryana', saturation: 0.5, need_index: 0.45, population: 29000000 },
  { name: 'Jharkhand', saturation: 0.15, need_index: 0.85, population: 38000000 },
  { name: 'Karnataka', saturation: 0.6, need_index: 0.48, population: 68000000 },
  { name: 'Kerala', saturation: 0.65, need_index: 0.3, population: 35000000 },
  { name: 'Madhya Pradesh', saturation: 0.22, need_index: 0.78, population: 85000000 },
  { name: 'Maharashtra', saturation: 0.7, need_index: 0.42, population: 124000000 },
  { name: 'Manipur', saturation: 0.1, need_index: 0.75, population: 3000000 },
  { name: 'Odisha', saturation: 0.2, need_index: 0.85, population: 46000000 },
  { name: 'Rajasthan', saturation: 0.3, need_index: 0.72, population: 79000000 },
  { name: 'Tamil Nadu', saturation: 0.6, need_index: 0.45, population: 77000000 },
  { name: 'Uttar Pradesh', saturation: 0.25, need_index: 0.82, population: 231000000 },
  { name: 'Uttarakhand', saturation: 0.35, need_index: 0.6, population: 11000000 },
  { name: 'West Bengal', saturation: 0.3, need_index: 0.7, population: 99000000 },
];

export const regionMap: Record<string, Region> = Object.fromEntries(
  regions.map((r) => [r.name, r])
);
