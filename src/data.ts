/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Extracurricular } from './types';

export const DEFAULT_EXTRACURRICULARS: Extracurricular[] = [
  { id: 'eskul-1', nama: 'Pramuka (Wajib)', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-2', nama: 'Paskibra', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-3', nama: 'Futsal', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-4', nama: 'Pencak Silat', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-5', nama: 'PMR (Palang Merah Remaja)', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-6', nama: 'Tari Tradisional & Modern', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-7', nama: 'Paduan Suara (Seni Musik)', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-8', nama: 'Marawis & Hadroh', kelasAllowed: ['VII', 'VIII', 'IX'], tahunPelajaran: '2026/2027' },
  { id: 'eskul-9', nama: 'English Club', kelasAllowed: ['VII', 'VIII'], tahunPelajaran: '2026/2027' },
];

export const TAHUN_PELAJARAN_LIST = [
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
  '2031/2032',
  '2032/2033',
  '2033/2034',
  '2034/2035',
  '2035/2036'
];

// Kelas list is now dynamically synchronized from spreadsheet/local eskul entry instead of using hardcoded values

// High-fidelity local database focusing on Banten (Jatiuwung / Tangerang) and surrounding areas
export interface RegionItem {
  id: string;
  name: string;
}

export const LOCAL_PROVINCES: RegionItem[] = [
  { id: '36', name: 'BANTEN' },
  { id: '32', name: 'JAWA BARAT' },
  { id: '31', name: 'DKI JAKARTA' },
  { id: '33', name: 'JAWA TENGAH' },
  { id: '35', name: 'JAWA TIMUR' }
];

export const LOCAL_KABUPATEN: Record<string, RegionItem[]> = {
  '36': [
    { id: '3671', name: 'KOTA TANGERANG' },
    { id: '3603', name: 'KABUPATEN TANGERANG' },
    { id: '3674', name: 'KOTA TANGERANG SELATAN' },
    { id: '3604', name: 'KABUPATEN SERANG' },
    { id: '3672', name: 'KOTA SERANG' }
  ],
  '32': [
    { id: '3273', name: 'KOTA BANDUNG' },
    { id: '3275', name: 'KOTA BEKASI' },
    { id: '3276', name: 'KOTA DEPOK' },
    { id: '3271', name: 'KOTA BOGOR' }
  ],
  '31': [
    { id: '3173', name: 'KOTA JAKARTA BARAT' },
    { id: '3171', name: 'KOTA JAKARTA PUSAT' },
    { id: '3174', name: 'KOTA JAKARTA SELATAN' },
    { id: '3175', name: 'KOTA JAKARTA TIMUR' }
  ]
};

export const LOCAL_KECAMATAN: Record<string, RegionItem[]> = {
  // Kota Tangerang (3671)
  '3671': [
    { id: '367101', name: 'JATIUWUNG' },
    { id: '367102', name: 'CIBODAS' },
    { id: '367103', name: 'PERIUK' },
    { id: '367104', name: 'KARAWACI' },
    { id: '367105', name: 'TANGERANG' },
    { id: '367106', name: 'CIPONDOH' },
    { id: '367107', name: 'PINANG' },
    { id: '367108', name: 'CILEDUG' }
  ],
  // Kabupaten Tangerang (3603)
  '3603': [
    { id: '360301', name: 'PASARKEMIS' },
    { id: '360302', name: 'CIKUPA' },
    { id: '360303', name: 'BALARAJA' },
    { id: '360304', name: 'CURUG' }
  ]
};

export const LOCAL_KELURAHAN: Record<string, RegionItem[]> = {
  // Jatiuwung (367101)
  '367101': [
    { id: '36710101', name: 'GANDASARI' },
    { id: '36710102', name: 'JATAKE' },
    { id: '36710103', name: 'JATIUWUNG' },
    { id: '36710104', name: 'KERONCONG' },
    { id: '36710105', name: 'MANIS JAYA' },
    { id: '36710106', name: 'PASIR JAYA' }
  ],
  // Cibodas (367102)
  '367102': [
    { id: '36710201', name: 'CIBODAS' },
    { id: '36710202', name: 'CIBODAS SARI' },
    { id: '36710203', name: 'CIBODAS BARU' },
    { id: '36710204', name: 'FORMOSA' },
    { id: '36710205', name: 'PANUNGGANGAN BARAT' },
    { id: '36710206', name: 'UITENHAGE' }
  ],
  // Periuk (367103)
  '367103': [
    { id: '36710301', name: 'PERIUK' },
    { id: '36710302', name: 'PERIUK JAYA' },
    { id: '36710303', name: 'GEMBOR' },
    { id: '36710304', name: 'SANGIANG JAYA' },
    { id: '36710305', name: 'GEBANG RAYA' }
  ]
};

// Async utility to fetch region data with local fallback
export async function fetchProvinces(): Promise<RegionItem[]> {
  try {
    const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.map((item: any) => ({ id: item.id, name: item.name }));
  } catch (err) {
    return LOCAL_PROVINCES;
  }
}

export async function fetchKabupaten(provinsiId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsiId}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.map((item: any) => ({ id: item.id, name: item.name }));
  } catch (err) {
    return LOCAL_KABUPATEN[provinsiId] || [
      { id: `${provinsiId}01`, name: `KOTA/KABUPATEN DEFAULT ${provinsiId}` }
    ];
  }
}

export async function fetchKecamatan(kabupatenId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabupatenId}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.map((item: any) => ({ id: item.id, name: item.name }));
  } catch (err) {
    return LOCAL_KECAMATAN[kabupatenId] || [
      { id: `${kabupatenId}01`, name: `KECAMATAN DEFAULT ${kabupatenId}` }
    ];
  }
}

export async function fetchKelurahan(kecamatanId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatanId}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.map((item: any) => ({ id: item.id, name: item.name }));
  } catch (err) {
    return LOCAL_KELURAHAN[kecamatanId] || [
      { id: `${kecamatanId}01`, name: `KELURAHAN/DESA DEFAULT ${kecamatanId}` }
    ];
  }
}
