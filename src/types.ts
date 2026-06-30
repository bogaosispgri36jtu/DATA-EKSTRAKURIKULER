/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  regNo: string;
  name: string;
  photo: string; // Base64 compressed image
  kelas: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  namaAyah: string;
  namaIbu: string;
  hpSiswa: string;
  hpOrtu: string;
  email?: string;
  prestasiChecked: boolean;
  namaLomba?: string;
  cabangLomba?: string;
  tingkatLomba?: string;
  juaraKe?: string;
  penyelenggara?: string;
  certificateFile?: string; // Base64 of the uploaded file/image
  certificateFileName?: string; // Name of the uploaded file
  alamat: string; // Nama Kampung / Perumahan
  rt: string;
  rw: string;
  provinsiId: string;
  provinsiName: string;
  kabupatenId: string;
  kabupatenName: string;
  kecamatanId: string;
  kecamatanName: string;
  kelurahanId: string;
  kelurahanName: string;
  eskulId: string;
  eskulName: string;
  eskulId2?: string;
  eskulName2?: string;
  tahunPelajaran: string;
  createdAt: string; // ISO string or date
}

export interface Extracurricular {
  id: string;
  nama: string;
  kelasAllowed: string[]; // e.g. ["VII", "VIII", "IX"]
  tahunPelajaran: string; // e.g. "2026/2027"
}

export interface AppSettings {
  googleAppsScriptUrl: string;
  tahunPelajaranAktif: string;
  adminUsername: string;
  adminPassword: string;
}

export interface AdminUser {
  id?: string;
  username: string;
  password?: string;
  status?: string;
  createdAt?: string;
}

