/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, ShieldCheck, Database, FileCode, CheckCircle, 
  HelpCircle, Sparkles, School, Layers, Users, RefreshCw, Lock, LogOut,
  Eye, EyeOff, Calendar, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Student, Extracurricular, AppSettings } from './types';
import { DEFAULT_EXTRACURRICULARS } from './data';
import StudentForm from './components/StudentForm';
import AdminDashboard from './components/AdminDashboard';
import ApiSetupGuide from './components/ApiSetupGuide';

// Base64 Seed Avatars to show real photos in tables out-of-the-box
const SEED_AVATAR_BOY = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23bfdbfe'/><circle cx='50' cy='38' r='20' fill='%231e3a8a'/><path d='M20,80 C20,60 80,60 80,80 Z' fill='%231d4ed8'/><circle cx='46' cy='36' r='2' fill='white'/><circle cx='54' cy='36' r='2' fill='white'/><path d='M46,45 Q50,48 54,45' stroke='white' stroke-width='2' fill='none'/></svg>";
const SEED_AVATAR_GIRL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23fef08a'/><circle cx='50' cy='38' r='18' fill='%23ca8a04'/><path d='M20,80 C20,62 80,62 80,80 Z' fill='%23854d0e'/><circle cx='46' cy='36' r='2' fill='white'/><circle cx='54' cy='36' r='2' fill='white'/><path d='M46,44 Q50,47 54,44' stroke='white' stroke-width='2' fill='none'/></svg>";

const SEED_STUDENTS: Student[] = [
  {
    id: 'student-seed-1',
    regNo: 'REG/2026/001',
    name: 'MUHAMMAD RIZKY PRATAMA',
    photo: SEED_AVATAR_BOY,
    kelas: 'VII-1',
    jenisKelamin: 'Laki-laki',
    namaAyah: 'Hendra Pratama',
    namaIbu: 'Dewi Lestari',
    hpSiswa: '081298765432',
    hpOrtu: '081298765431',
    prestasiChecked: true,
    namaLomba: 'Lomba Pencak Silat Walikota Tangerang',
    cabangLomba: 'Kategori Tanding Remaja B Putra',
    tingkatLomba: 'Kota/Kabupaten',
    juaraKe: '1',
    penyelenggara: 'IPSI Kota Tangerang',
    alamat: 'Perumahan Jatiuwung Permai, Blok B2 No. 12',
    rt: '003',
    rw: '005',
    provinsiId: '36',
    provinsiName: 'BANTEN',
    kabupatenId: '3671',
    kabupatenName: 'KOTA TANGERANG',
    kecamatanId: '367101',
    kecamatanName: 'JATIUWUNG',
    kelurahanId: '36710103',
    kelurahanName: 'JATIUWUNG',
    eskulId: 'eskul-4',
    eskulName: 'Pencak Silat',
    tahunPelajaran: '2026/2027',
    createdAt: new Date('2026-06-20T09:15:00Z').toISOString()
  },
  {
    id: 'student-seed-2',
    regNo: 'REG/2026/002',
    name: 'SITI NUR AMINAH',
    photo: SEED_AVATAR_GIRL,
    kelas: 'VIII-2',
    jenisKelamin: 'Perempuan',
    namaAyah: 'Ahmad Sunarya',
    namaIbu: 'Suryati',
    hpSiswa: '085712345678',
    hpOrtu: '085712345670',
    prestasiChecked: true,
    namaLomba: 'Lomba Paduan Suara Tingkat Provinsi',
    cabangLomba: 'Soprano Utama',
    tingkatLomba: 'Provinsi',
    juaraKe: '2',
    penyelenggara: 'Dinas Pendidikan Provinsi Banten',
    alamat: 'Kp. Jatake, No. 44, RT 02 / RW 01',
    rt: '002',
    rw: '001',
    provinsiId: '36',
    provinsiName: 'BANTEN',
    kabupatenId: '3671',
    kabupatenName: 'KOTA TANGERANG',
    kecamatanId: '367101',
    kecamatanName: 'JATIUWUNG',
    kelurahanId: '36710102',
    kelurahanName: 'JATAKE',
    eskulId: 'eskul-7',
    eskulName: 'Paduan Suara (Seni Musik)',
    tahunPelajaran: '2026/2027',
    createdAt: new Date('2026-06-22T14:30:00Z').toISOString()
  },
  {
    id: 'student-seed-3',
    regNo: 'REG/2026/003',
    name: 'BAGUS TRI ADITYA',
    photo: SEED_AVATAR_BOY,
    kelas: 'IX-1',
    jenisKelamin: 'Laki-laki',
    namaAyah: 'Wibowo Aditya',
    namaIbu: 'Ratnasari',
    hpSiswa: '081355443322',
    hpOrtu: '081355443320',
    prestasiChecked: false,
    alamat: 'Kp. Gandasari, RT 01 / RW 03',
    rt: '001',
    rw: '003',
    provinsiId: '36',
    provinsiName: 'BANTEN',
    kabupatenId: '3671',
    kabupatenName: 'KOTA TANGERANG',
    kecamatanId: '367101',
    kecamatanName: 'JATIUWUNG',
    kelurahanId: '36710101',
    kelurahanName: 'GANDASARI',
    eskulId: 'eskul-3',
    eskulName: 'Futsal',
    tahunPelajaran: '2026/2027',
    createdAt: new Date('2026-06-23T11:05:00Z').toISOString()
  }
];

const mapStudentData = (s: any): Student => {
  if (!s) return s;
  
  const prest = s.prestasiChecked !== undefined ? s.prestasiChecked : (s.prestasi_checked !== undefined ? s.prestasi_checked : (s.PrestasiChecked !== undefined ? s.PrestasiChecked : false));
  const isPrestasiTrue = (prest === true || prest === 'TRUE' || prest === 'true');

  return {
    ...s,
    name: s.name || s.nama || s.Nama || '',
    tempatLahir: s.tempatLahir || s.tempat_lahir || s.TempatLahir || s.tempatlahir || s['tempat lahir'] || '',
    tanggalLahir: s.tanggalLahir || s.tanggal_lahir || s.TanggalLahir || s.tanggallahir || s['tanggal lahir'] || '',
    namaAyah: s.namaAyah || s.nama_ayah || s.NamaAyah || s.namaayah || s['nama ayah'] || '',
    namaIbu: s.namaIbu || s.nama_ibu || s.NamaIbu || s.namaibu || s['nama ibu'] || '',
    hpSiswa: s.hpSiswa || s.hp_siswa || s.HpSiswa || s.hpsiswa || s['hp siswa'] || '',
    hpOrtu: s.hpOrtu || s.hp_ortu || s.HpOrtu || s.hportu || s['hp ortu'] || '',
    jenisKelamin: s.jenisKelamin || s.jenis_kelamin || s.JenisKelamin || s.jeniskelamin || s['jenis kelamin'] || '',
    regNo: s.regNo || s.reg_no || s.RegNo || s.regno || s['no. registrasi'] || '',
    photo: s.photo || s.Photo || s.foto || s.Foto || '',
    kelas: s.kelas || s.Kelas || '',
    alamat: s.alamat || s.Alamat || '',
    rt: s.rt || s.RT || '',
    rw: s.rw || s.RW || '',
    provinsiName: s.provinsiName || s.provinsi_name || s.ProvinsiName || s.provinsiname || s.provinsi || '',
    kabupatenName: s.kabupatenName || s.kabupaten_name || s.KabupatenName || s.kabupatenname || s.kabupaten || '',
    kecamatanName: s.kecamatanName || s.kecamatan_name || s.KecamatanName || s.kecamatanname || s.kecamatan || '',
    kelurahanName: s.kelurahanName || s.kelurahan_name || s.KelurahanName || s.kelurahanname || s.kelurahan || '',
    eskulName: s.eskulName || s.eskul_name || s.EskulName || s.eskulname || '',
    eskulName2: s.eskulName2 || s.eskul_name2 || s.EskulName2 || s.eskulname2 || '',
    eskulName3: s.eskulName3 || s.eskul_name3 || s.EskulName3 || s.eskulname3 || '',
    
    // Achievement fields mapped safely
    prestasiChecked: isPrestasiTrue,
    namaLomba: isPrestasiTrue ? (s.namaLomba || s.nama_lomba || s.NamaLomba || '') : '',
    cabangLomba: isPrestasiTrue ? (s.cabangLomba || s.cabang_lomba || s.CabangLomba || '') : '',
    tingkatLomba: isPrestasiTrue ? (s.tingkatLomba || s.tingkat_lomba || s.TingkatLomba || '') : '',
    juaraKe: isPrestasiTrue ? (s.juaraKe || s.juara_ke || s.JuaraKe || '') : '',
    penyelenggara: isPrestasiTrue ? (s.penyelenggara || s.Penyelenggara || '') : '',
    certificateFile: isPrestasiTrue ? (s.certificateFile || s.certificate_file || s.CertificateFile || '') : '',
    certificateFileName: isPrestasiTrue ? (s.certificateFileName || s.certificate_file_name || s.CertificateFileName || '') : '',
    
    buktiPendaftaranFile: s.buktiPendaftaranFile || s.bukti_pendaftaran_file || s.BuktiPendaftaranFile || '',
    buktiPendaftaranFileName: s.buktiPendaftaranFileName || s.bukti_pendaftaran_file_name || s.BuktiPendaftaranFileName || '',
    
    tahunPelajaran: s.tahunPelajaran || s.tahun_pelajaran || s.TahunPelajaran || s.tahunpelajaran || '',
    createdAt: s.createdAt || s.created_at || s.CreatedAt || s.createdat || ''
  };
};

const cleanGasUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  const match = trimmed.match(/(https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/(?:exec|dev))/);
  if (match) {
    return match[1];
  }
  return trimmed.split(/[\s\n\r]+/)[0];
};

export default function App() {
  // Navigation / Frame toggles
  const [activeView, setActiveView] = useState<'student' | 'admin' | 'guide'>(() => {
    const saved = localStorage.getItem('smp_pgri_active_view');
    return (saved as 'student' | 'admin' | 'guide') || 'student';
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('smp_pgri_admin_logged_in') === 'true';
  });
  const [loggedAdmin, setLoggedAdmin] = useState<{ username: string; status: string } | null>(() => {
    const saved = localStorage.getItem('smp_pgri_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('smp_pgri_active_view', activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem('smp_pgri_admin_logged_in', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (loggedAdmin) {
      localStorage.setItem('smp_pgri_admin_user', JSON.stringify(loggedAdmin));
    } else {
      localStorage.removeItem('smp_pgri_admin_user');
    }
  }, [loggedAdmin]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isGasUrlConfigOpen, setIsGasUrlConfigOpen] = useState(false);
  const [tempGasUrl, setTempGasUrl] = useState('');
  const [isVerifyingLogin, setIsVerifyingLogin] = useState(false);

  const handleSetIsAdminLoggedIn = (loggedIn: boolean, adminUser?: { username: string; status: string }) => {
    setIsAdminLoggedIn(loggedIn);
    if (loggedIn) {
      setActiveView('admin');
      if (adminUser) {
        setLoggedAdmin(adminUser);
      } else {
        setLoggedAdmin({ username: 'admin', status: 'Utama' });
      }
    } else {
      setActiveView('student');
      setLoggedAdmin(null);
    }
  };

  const handleLogoutClick = () => {
    Swal.fire({
      title: 'Yakin ingin Keluar ??',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'IYA',
      cancelButtonText: 'TIDAK',
      width: '340px'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSetIsAdminLoggedIn(false);
      }
    });
  };

  const handlePopupLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Opss ....',
        text: 'Username wajib diisi!',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '340px'
      });
      return;
    }

    if (!loginPassword.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Opss ....',
        text: 'Password wajib diisi!',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '340px'
      });
      return;
    }

    const savedAdminsStr = localStorage.getItem('smp_pgri_admins');
    let localAdmins: any[] = [];
    if (savedAdminsStr) {
      try {
        localAdmins = JSON.parse(savedAdminsStr);
      } catch (e) {}
    }
    
    // Purge any default admin account with username "admin" and password "admin123" from local cache
    localAdmins = localAdmins.filter(acc => {
      const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
      const p = acc.password ? acc.password.toString().trim() : '';
      return !(u === 'admin' && p === 'admin123');
    });
    
    const currentAdmins = (admins && admins.length > 0) ? admins.filter(acc => {
      const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
      const p = acc.password ? acc.password.toString().trim() : '';
      return !(u === 'admin' && p === 'admin123');
    }) : localAdmins;

    let matchedAccount = currentAdmins.find((acc) => {
      const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
      const p = acc.password ? acc.password.toString().trim() : '';
      return u === loginUsername.toLowerCase().trim() && p === loginPassword.trim();
    });

    const checkGasUrl = (tempGasUrl && tempGasUrl.trim().startsWith('http')) 
      ? tempGasUrl.trim() 
      : settings.googleAppsScriptUrl;

    if (!matchedAccount && checkGasUrl && checkGasUrl.startsWith('http')) {
      setIsVerifyingLogin(true);
      try {
        const resJson = await gasFetch(checkGasUrl, 'getData');
        if (resJson.status === 'success') {
          // Save the URL since it connects successfully
          const newSettings = {
            ...settings,
            googleAppsScriptUrl: checkGasUrl
          };
          setSettings(newSettings);
          localStorage.setItem('smp_pgri_settings', JSON.stringify(newSettings));

          // Sync other data as well
          const syncedStudents = (resJson.students || []).map(mapStudentData);
          setStudents(syncedStudents);
          localStorage.setItem('smp_pgri_students', JSON.stringify(syncedStudents));
          setEskulList(resJson.eskul || []);
          if (resJson.classes && Array.isArray(resJson.classes)) {
            setClassList(resJson.classes);
            localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
          }
          if (resJson.admins && Array.isArray(resJson.admins)) {
            setAdmins(resJson.admins);
            localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
            
            matchedAccount = resJson.admins.find((acc: any) => {
              const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
              const p = acc.password ? acc.password.toString().trim() : '';
              return u === loginUsername.toLowerCase().trim() && p === loginPassword.trim();
            });
          }
          setIsLiveConnection(true);
        }
      } catch (error) {
        console.warn('Failed to refetch live admins for verification', error);
      } finally {
        setIsVerifyingLogin(false);
      }
    }

    if (matchedAccount) {
      setLoggedAdmin({ username: matchedAccount.username, status: matchedAccount.status || 'Biasa' });
      setIsAdminLoggedIn(true);
      setActiveView('admin');
      setIsLoginModalOpen(false);
      setLoginUsername('');
      setLoginPassword('');
      Swal.fire({
        icon: 'success',
        iconColor: '#10b981',
        title: 'Login Berhasil',
        text: 'Selamat datang di Dashboard Admin SMP PGRI Jatiuwung.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '340px'
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Username atau password yang Anda masukkan salah!',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    }
  };

  const handleSaveGasUrlFromLogin = async () => {
    if (!tempGasUrl.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'URL Kosong',
        text: 'Silakan masukkan URL Google Apps Script Web App terlebih dahulu.',
        confirmButtonColor: '#1d4ed8',
        width: '340px'
      });
      return;
    }

    if (!tempGasUrl.trim().startsWith('http')) {
      Swal.fire({
        icon: 'error',
        title: 'URL Tidak Valid',
        text: 'URL harus diawali dengan http:// atau https://',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
      return;
    }

    Swal.fire({
      title: 'Menghubungkan...',
      text: 'Sedang mencoba mengambil data dari Google Sheets...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      width: '340px'
    });

    const newSettings = {
      ...settings,
      googleAppsScriptUrl: tempGasUrl.trim()
    };

    try {
      const resJson = await gasFetch(newSettings.googleAppsScriptUrl, 'getData');
      
      if (resJson.status === 'success') {
        setSettings(newSettings);
        localStorage.setItem('smp_pgri_settings', JSON.stringify(newSettings));
        
        // Save to backend server so it persists on reloads
        try {
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
          });
        } catch (e) {
          console.error('Failed to save settings to server', e);
        }
        
        const testStudents = (resJson.students || []).map(mapStudentData);
        setStudents(testStudents);
        localStorage.setItem('smp_pgri_students', JSON.stringify(testStudents));
        setEskulList(resJson.eskul || []);
        if (resJson.classes && Array.isArray(resJson.classes)) {
          setClassList(resJson.classes);
          localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
        }
        if (resJson.admins && Array.isArray(resJson.admins)) {
          setAdmins(resJson.admins);
          localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
        }
        setIsLiveConnection(true);

        Swal.fire({
          icon: 'success',
          iconColor: '#10b981',
          title: 'Koneksi Berhasil!',
          text: 'Database & Akun Admin berhasil disinkronkan dari Google Sheets!',
          confirmButtonColor: '#1d4ed8',
          width: '340px'
        });
        setIsGasUrlConfigOpen(false);
      } else {
        throw new Error('Invalid JSON format from API');
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Koneksi Gagal',
        html: '<div class="text-xs text-slate-600 leading-relaxed text-center space-y-1.5"><div>Tidak dapat terhubung ke Google Apps Script Web App.</div><div class="mt-2 text-[10px] bg-slate-100 p-2 rounded-lg text-slate-500 font-semibold text-left"><b>Pastikan:</b><br/>1. URL yang ditempel sudah benar.<br/>2. Anda sudah melakukan <b>Deploy sebagai Web App</b> di Google Apps Script.<br/>3. Akses diset ke <b>"Anyone"</b> agar dapat diakses publik.</div></div>',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    }
  };

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzMFLeXiLw4mbTMpYEofvjb0gT5oJxqVONk_nYmeEjp3s8CjnnKVhlelL6PIUN7D0QooA/exec';

  const gasFetch = async (gasUrl: string, action: string, params: Record<string, string> = {}, timeoutMs: number = 15000): Promise<any> => {
    const cleanUrl = cleanGasUrl(gasUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const urlObj = new URL('/api/gas', window.location.origin);
      urlObj.searchParams.set('url', cleanUrl);
      urlObj.searchParams.set('action', action);
      Object.entries(params).forEach(([key, val]) => {
        urlObj.searchParams.set(key, val);
      });

      const response = await fetch(urlObj.toString(), { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json && (json.status === 'success' || json.status === 'error' || Array.isArray(json.students))) {
            return json;
          }
        }
      }
    } catch (e) {
      console.warn('Proxy fetch failed or timed out, trying direct Google Apps Script fetch...', e);
    }

    // Direct GAS Web App fetch (e.g. for Vercel/serverless environments where proxy is not running)
    const directController = new AbortController();
    const directTimeoutId = setTimeout(() => directController.abort(), timeoutMs);

    try {
      const directUrl = new URL(cleanUrl);
      directUrl.searchParams.set('action', action);
      Object.entries(params).forEach(([key, val]) => {
        directUrl.searchParams.set(key, val);
      });

      const response = await fetch(directUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: directController.signal
      });
      clearTimeout(directTimeoutId);
      if (!response.ok) {
        throw new Error(`Direct connection to Google Apps Script failed: ${response.status}`);
      }
      return await response.json();
    } catch (e) {
      clearTimeout(directTimeoutId);
      throw e;
    }
  };

  const gasPost = async (gasUrl: string, body: any): Promise<any> => {
    const cleanUrl = cleanGasUrl(gasUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds timeout for slower GAS operations

    try {
      const response = await fetch(`/api/gas?url=${encodeURIComponent(cleanUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json && (json.status === 'success' || json.status === 'error')) {
            return json;
          }
        }
      }
      throw new Error(`Server returned status: ${response.status}`);
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('Proxy POST failed or not running, trying direct Google Apps Script POST...', e);
      
      // Fallback: Direct POST to GAS
      const directController = new AbortController();
      const directTimeoutId = setTimeout(() => directController.abort(), 45000);

      try {
        // Try direct post with CORS
        const directResponse = await fetch(cleanUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // Use text/plain to avoid CORS preflight failures in some setups
          },
          body: JSON.stringify(body),
          signal: directController.signal
        });
        clearTimeout(directTimeoutId);

        if (directResponse.ok) {
          const text = await directResponse.text();
          try {
            const json = JSON.parse(text);
            if (json && (json.status === 'success' || json.status === 'error')) {
              return json;
            }
          } catch {
            // If response text is not JSON but direct response is ok, consider it a success
            return { status: 'success' };
          }
        }
        
        // If response is not ok (e.g. CORS preflight blocked), fall back to no-cors mode
        throw new Error(`Direct POST status: ${directResponse.status}`);
      } catch (directError: any) {
        clearTimeout(directTimeoutId);
        console.warn('Direct CORS POST failed, attempting direct no-cors POST...', directError);

        const noCorsController = new AbortController();
        const noCorsTimeoutId = setTimeout(() => noCorsController.abort(), 45000);

        try {
          // Direct POST with mode: 'no-cors'. 
          // Browser will successfully send payload to GAS Web App, but we won't be able to read response body.
          await fetch(cleanUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(body),
            signal: noCorsController.signal
          });
          clearTimeout(noCorsTimeoutId);
          
          // Since no-cors hides response, we assume it was processed successfully
          // and return status success so that the direct post fallback (no-cors) logic in handleRegisterStudent triggers.
          return { status: 'success' };
        } catch (noCorsError: any) {
          clearTimeout(noCorsTimeoutId);
          console.error('Direct no-cors POST also failed:', noCorsError);
          throw noCorsError;
        }
      }
    }
  };

  // Core Data state
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('smp_pgri_students');
      return saved ? JSON.parse(saved).map(mapStudentData) : [];
    } catch {
      return [];
    }
  });
  const [eskulList, setEskulList] = useState<Extracurricular[]>(() => {
    try {
      const saved = localStorage.getItem('smp_pgri_eskul');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_EXTRACURRICULARS;
  });
  const [classList, setClassList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('smp_pgri_classes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['VII', 'VIII', 'IX'];
  });
  const [admins, setAdmins] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('smp_pgri_admins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<AppSettings>({
    googleAppsScriptUrl: '',
    tahunPelajaranAktif: '2026/2027',
    isPublished: true
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cachedClasses = localStorage.getItem('smp_pgri_classes');
      const cachedEskul = localStorage.getItem('smp_pgri_eskul');
      if (cachedClasses && cachedEskul) {
        return false;
      }
    } catch {}
    return true;
  });
  const [isLiveConnection, setIsLiveConnection] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('smp_pgri_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && parsed.googleAppsScriptUrl && parsed.googleAppsScriptUrl.trim().startsWith('http')) {
          return true;
        }
      }
    } catch {}
    return false;
  });
  const [isSupabaseSchemaIncomplete, setIsSupabaseSchemaIncomplete] = useState(false);
  const [isInitializing, setIsInitializing] = useState(() => {
    try {
      const cachedClasses = localStorage.getItem('smp_pgri_classes');
      const cachedEskul = localStorage.getItem('smp_pgri_eskul');
      if (cachedClasses && cachedEskul) {
        return false;
      }
    } catch {}
    return true;
  });

  // Initialize and load data (from backend API or local storage fallback)
  useEffect(() => {
    // Purge any old cached default "admin" account with password "admin123" from browser storage
    const savedAdminsStr = localStorage.getItem('smp_pgri_admins');
    if (savedAdminsStr) {
      try {
        const parsed = JSON.parse(savedAdminsStr);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(acc => {
            const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
            const p = acc.password ? acc.password.toString().trim() : '';
            return !(u === 'admin' && p === 'admin123');
          });
          localStorage.setItem('smp_pgri_admins', JSON.stringify(cleaned));
        }
      } catch (err) {}
    }

    const initializeApp = async () => {
      let activeSettings = {
        googleAppsScriptUrl: '',
        tahunPelajaranAktif: '2026/2027',
        isPublished: true
      };

      // Load from Local Storage first so we don't lose configured settings in Vercel/serverless environments
      const savedSettings = localStorage.getItem('smp_pgri_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          activeSettings = { ...activeSettings, ...parsed };
        } catch (err) {}
      }

      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverSettings = await response.json();
            // Merge server settings, but do not overwrite a valid local GAS URL with an empty server URL
            let isPublishedVal = activeSettings.isPublished;
            if (serverSettings.isPublished !== undefined) {
              if (typeof serverSettings.isPublished === 'boolean') {
                isPublishedVal = serverSettings.isPublished;
              } else if (typeof serverSettings.isPublished === 'string') {
                isPublishedVal = serverSettings.isPublished.toLowerCase() === 'true';
              }
            }

            activeSettings = {
              ...activeSettings,
              tahunPelajaranAktif: serverSettings.tahunPelajaranAktif || activeSettings.tahunPelajaranAktif,
              isPublished: isPublishedVal,
              googleAppsScriptUrl: (serverSettings.googleAppsScriptUrl && serverSettings.googleAppsScriptUrl.trim().startsWith('http'))
                ? serverSettings.googleAppsScriptUrl
                : activeSettings.googleAppsScriptUrl
            };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch settings from backend API, using local storage values', e);
      }

      setSettings(activeSettings);
      localStorage.setItem('smp_pgri_settings', JSON.stringify(activeSettings));
      fetchAppData(activeSettings);
    };

    initializeApp();
  }, []);

  const fetchAppData = async (currentSettings: AppSettings): Promise<boolean> => {
    const hasCachedData = (() => {
       try {
         const cachedClasses = localStorage.getItem('smp_pgri_classes');
         const cachedEskul = localStorage.getItem('smp_pgri_eskul');
         return !!(cachedClasses && cachedEskul);
       } catch {
         return false;
       }
     })();

    if (!hasCachedData) {
      setIsLoading(true);
    }
    // FALLBACK TO DEFAULT SPREADSHEET URL FOR THE PUBLIC STUDENT REGISTRATION FORM
    const gasUrl = currentSettings.googleAppsScriptUrl || DEFAULT_GAS_URL;

    if (gasUrl && gasUrl.startsWith('http')) {
      try {
        // Try fetching from database/Sheets backend
        const resJson = await gasFetch(gasUrl, 'getData');
        
        if (resJson.status === 'success') {
          setIsSupabaseSchemaIncomplete(false);
          const mappedStudents = (resJson.students || []).map(mapStudentData);
          setStudents(mappedStudents);
          localStorage.setItem('smp_pgri_students', JSON.stringify(mappedStudents));
          setEskulList(resJson.eskul || []);
          if (resJson.classes && Array.isArray(resJson.classes) && resJson.classes.length > 0) {
            setClassList(resJson.classes);
            localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
          } else {
            const savedClasses = localStorage.getItem('smp_pgri_classes');
            if (savedClasses) {
              setClassList(JSON.parse(savedClasses));
            } else {
              // Extract unique classes dynamically from eskul list if classes sheet is empty
              const currentEskuls = resJson.eskul || [];
              const extracted: string[] = [];
              currentEskuls.forEach((esk: any) => {
                if (esk && esk.kelasAllowed) {
                  esk.kelasAllowed.forEach((cls: string) => {
                    const trimmed = cls.trim();
                    if (trimmed && !extracted.includes(trimmed)) {
                      extracted.push(trimmed);
                    }
                  });
                }
              });
              setClassList(extracted);
            }
          }
          if (resJson.admins && Array.isArray(resJson.admins) && resJson.admins.length > 0) {
            setAdmins(resJson.admins);
            localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
          } else {
            const savedAdminsStr = localStorage.getItem('smp_pgri_admins');
            if (savedAdminsStr) {
              try {
                const parsedAdmins = JSON.parse(savedAdminsStr);
                if (Array.isArray(parsedAdmins)) {
                  setAdmins(parsedAdmins);
                }
              } catch (e) {
                setAdmins([]);
              }
            } else {
              setAdmins([]);
            }
          }
          let isPublishedVal = currentSettings.isPublished;
          if (resJson.settings && resJson.settings.isPublished !== undefined) {
            if (typeof resJson.settings.isPublished === 'boolean') {
              isPublishedVal = resJson.settings.isPublished;
            } else if (typeof resJson.settings.isPublished === 'string') {
              isPublishedVal = resJson.settings.isPublished.toLowerCase() === 'true';
            }
          }

          const updatedSettings = {
            ...currentSettings,
            tahunPelajaranAktif: (resJson.settings && resJson.settings.tahunPelajaranAktif) || currentSettings.tahunPelajaranAktif,
            isPublished: isPublishedVal
          };

          setSettings(updatedSettings);
          localStorage.setItem('smp_pgri_settings', JSON.stringify(updatedSettings));
          setIsLiveConnection(true);
          setIsLoading(false);
          setIsInitializing(false);
          return true;
        }
      } catch (error) {
        console.warn('Google Sheets API connection failed, falling back to Local Database.', error);
        if (!currentSettings.googleAppsScriptUrl || !currentSettings.googleAppsScriptUrl.trim().startsWith('http')) {
          setIsLiveConnection(false);
        } else {
          setIsLiveConnection(true);
        }
      }
    }

    // LOCAL DATABASE FALLBACK (localStorage)
    if (!currentSettings.googleAppsScriptUrl || !currentSettings.googleAppsScriptUrl.trim().startsWith('http')) {
      setIsLiveConnection(false);
    } else {
      setIsLiveConnection(true);
    }
    
    // Load Eskul Fallback
    const savedEskul = localStorage.getItem('smp_pgri_eskul');
    if (savedEskul) {
      try {
        setEskulList(JSON.parse(savedEskul));
      } catch (e) {
        setEskulList(DEFAULT_EXTRACURRICULARS);
      }
    } else {
      setEskulList(DEFAULT_EXTRACURRICULARS);
    }

    // Load Classes Fallback
    const savedClasses = localStorage.getItem('smp_pgri_classes');
    if (savedClasses) {
      try {
        setClassList(JSON.parse(savedClasses));
      } catch (e) {
        setClassList(['VII', 'VIII', 'IX']);
      }
    } else {
      setClassList(['VII', 'VIII', 'IX']);
    }

    // Load Students Fallback
    const savedStudents = localStorage.getItem('smp_pgri_students');
    if (savedStudents) {
      try {
        setStudents(JSON.parse(savedStudents).map(mapStudentData));
      } catch (e) {
        setStudents([]);
      }
    } else {
      setStudents([]);
    }

    // Load Admin List Fallback
    const savedAdmins = localStorage.getItem('smp_pgri_admins');
    if (savedAdmins) {
      try {
        setAdmins(JSON.parse(savedAdmins));
      } catch (e) {
        setAdmins([]);
      }
    } else {
      setAdmins([]);
    }

    setIsLoading(false);
    setIsInitializing(false);
  };

  // -------------------- CORE ACTION PROXIES (POST HANDLERS) --------------------

  // Submit Student Registration
  const handleRegisterStudent = async (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>): Promise<Student> => {
    const gasUrl = settings.googleAppsScriptUrl || DEFAULT_GAS_URL;
    
    const isPrestasi = studentData.prestasiChecked === true || String(studentData.prestasiChecked) === 'true';
    const cleanedData = {
      name: String(studentData.name || studentData.nama || '').trim(),
      nama: String(studentData.nama || studentData.name || '').trim(),
      photo: String(studentData.photo || '').trim(),
      kelas: String(studentData.kelas || '').trim(),
      jenisKelamin: studentData.jenisKelamin,
      jenis_kelamin: studentData.jenisKelamin,
      namaAyah: String(studentData.namaAyah || '').trim(),
      nama_ayah: String(studentData.namaAyah || '').trim(),
      namaIbu: String(studentData.namaIbu || '').trim(),
      nama_ibu: String(studentData.namaIbu || '').trim(),
      hpSiswa: String(studentData.hpSiswa || '').trim(),
      hp_siswa: String(studentData.hpSiswa || '').trim(),
      hpOrtu: String(studentData.hpOrtu || '').trim(),
      hp_ortu: String(studentData.hpOrtu || '').trim(),
      email: String(studentData.email || '').trim(),
      tempatLahir: String(studentData.tempatLahir || '').trim(),
      tempat_lahir: String(studentData.tempatLahir || '').trim(),
      tanggalLahir: String(studentData.tanggalLahir || '').trim(),
      tanggal_lahir: String(studentData.tanggalLahir || '').trim(),
      prestasiChecked: isPrestasi,
      prestasi_checked: isPrestasi,
      namaLomba: String(studentData.namaLomba || '').trim(),
      nama_lomba: String(studentData.namaLomba || '').trim(),
      cabangLomba: String(studentData.cabangLomba || '').trim(),
      cabang_lomba: String(studentData.cabangLomba || '').trim(),
      tingkatLomba: String(studentData.tingkatLomba || '').trim(),
      tingkat_lomba: String(studentData.tingkatLomba || '').trim(),
      juaraKe: String(studentData.juaraKe || '').trim(),
      juara_ke: String(studentData.juaraKe || '').trim(),
      penyelenggara: String(studentData.penyelenggara || '').trim(),
      penyelenggara_lomba: String(studentData.penyelenggara || '').trim(),
      certificateFile: String(studentData.certificateFile || '').trim(),
      certificate_file: String(studentData.certificateFile || '').trim(),
      certificateFileName: String(studentData.certificateFileName || '').trim(),
      certificate_file_name: String(studentData.certificateFileName || '').trim(),
      alamat: String(studentData.alamat || '').trim(),
      rt: String(studentData.rt || '').trim(),
      rw: String(studentData.rw || '').trim(),
      provinsiId: String(studentData.provinsiId || '').trim(),
      provinsi_id: String(studentData.provinsiId || '').trim(),
      provinsiName: String(studentData.provinsiName || '').trim(),
      provinsi_name: String(studentData.provinsiName || '').trim(),
      kabupatenId: String(studentData.kabupatenId || '').trim(),
      kabupaten_id: String(studentData.kabupatenId || '').trim(),
      kabupatenName: String(studentData.kabupatenName || '').trim(),
      kabupaten_name: String(studentData.kabupatenName || '').trim(),
      kecamatanId: String(studentData.kecamatanId || '').trim(),
      kecamatan_id: String(studentData.kecamatanId || '').trim(),
      kecamatanName: String(studentData.kecamatanName || '').trim(),
      kecamatan_name: String(studentData.kecamatanName || '').trim(),
      kelurahanId: String(studentData.kelurahanId || '').trim(),
      kelurahan_id: String(studentData.kelurahanId || '').trim(),
      kelurahanName: String(studentData.kelurahanName || '').trim(),
      kelurahan_name: String(studentData.kelurahanName || '').trim(),
      eskulId: String(studentData.eskulId || '').trim(),
      eskul_id: String(studentData.eskulId || '').trim(),
      eskulName: String(studentData.eskulName || '').trim(),
      eskul_name: String(studentData.eskulName || '').trim(),
      eskulId2: String(studentData.eskulId2 || '').trim(),
      eskul_id_2: String(studentData.eskulId2 || '').trim(),
      eskulName2: String(studentData.eskulName2 || '').trim(),
      eskul_name_2: String(studentData.eskulName2 || '').trim(),
      eskulId3: String(studentData.eskulId3 || '').trim(),
      eskul_id_3: String(studentData.eskulId3 || '').trim(),
      eskulName3: String(studentData.eskulName3 || '').trim(),
      eskul_name_3: String(studentData.eskulName3 || '').trim(),
      tahunPelajaran: studentData.tahunPelajaran,
      tahun_pelajaran: studentData.tahunPelajaran
    };

    if (isLiveConnection && gasUrl) {
      try {
        const resJson = await gasPost(gasUrl, {
          action: 'registerStudent',
          data: cleanedData
        });

        if (resJson) {
          if (resJson.status === 'success') {
            if (resJson.data) {
              const mappedData = mapStudentData(resJson.data);
              setStudents(prev => [mappedData, ...prev]);
              return mappedData;
            } else {
              // direct post fallback (no-cors)
              const mockReg = mapStudentData(generateMockStudentResponse(cleanedData));
              setStudents(prev => [mockReg, ...prev]);
              return mockReg;
            }
          } else {
            // Server explicitly returned an error (e.g., insertion failed)
            throw new Error(resJson.message || 'Gagal menyimpan data ke database server.');
          }
        } else {
          throw new Error('Tidak ada respon dari server saat mendaftarkan siswa.');
        }
      } catch (err: any) {
        console.error('GAS Post failed during registration:', err);
        throw err;
      }
    }

    // Local Storage save (when offline / local database mode)
    const mockReg = mapStudentData(generateMockStudentResponse(cleanedData));
    const updatedStudents = [mockReg, ...students];
    setStudents(updatedStudents);
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));
    return mockReg;
  };

  // Update specific student record (e.g. upload registration proof PDF)
  const handleUpdateStudent = async (studentId: string, updatedFields: Partial<Student>): Promise<void> => {
    // 1. Update React state
    const updatedStudents = students.map(s => s.id === studentId ? { ...s, ...updatedFields } : s);
    setStudents(updatedStudents);

    // 2. Save to local storage
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));

    // 3. If live connection is active, send update to Google Apps Script
    const gasUrl = settings.googleAppsScriptUrl || DEFAULT_GAS_URL;
    if (isLiveConnection && gasUrl) {
      try {
        const studentToUpdate = updatedStudents.find(s => s.id === studentId);
        if (studentToUpdate) {
          await gasPost(gasUrl, {
            action: 'updateStudent',
            id: studentId,
            regNo: studentToUpdate.regNo,
            data: {
              buktiPendaftaranFile: studentToUpdate.buktiPendaftaranFile || '',
              buktiPendaftaranFileName: studentToUpdate.buktiPendaftaranFileName || '',
              bukti_pendaftaran_file: studentToUpdate.buktiPendaftaranFile || '',
              bukti_pendaftaran_file_name: studentToUpdate.buktiPendaftaranFileName || ''
            }
          });
        }
      } catch (e) {
        console.error('Failed to sync student update to Google Sheets:', e);
      }
    }
  };

  const generateMockStudentResponse = (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>): Student => {
    // Count existing registrations in this school year for registration number sequence
    const yearMatches = students.filter(s => s.tahunPelajaran === studentData.tahunPelajaran).length;
    const sequenceStr = ("00" + (yearMatches + 1)).slice(-3);
    const targetYear = studentData.tahunPelajaran.replace(/\D/g, '');
    
    const regNo = `eskul/${targetYear}/${sequenceStr}`;
    const id = `student-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    return {
      ...studentData,
      id,
      regNo,
      createdAt
    };
  };

  // Add Extracurricular
  const handleAddEskul = async (nama: string, kelasAllowed: string[], tahunPelajaran: string) => {
    const gasUrl = settings.googleAppsScriptUrl;
    const cleanKelas = (kelasAllowed || []).map(cls => cls.trim()).filter(Boolean);
    const newEskul = { nama, kelasAllowed: cleanKelas, tahunPelajaran };

    let createdId = `eskul-${Math.random().toString(36).substr(2, 9)}`;
    let finalKelas = cleanKelas;

    if (isLiveConnection && gasUrl) {
      try {
        const responseJson = await gasPost(gasUrl, {
          action: 'addEskul',
          data: newEskul
        });
        if (responseJson && responseJson.status === 'success' && responseJson.data) {
          if (responseJson.data.id) {
            createdId = responseJson.data.id;
          }
          if (responseJson.data.kelasAllowed) {
            const responseKelas = responseJson.data.kelasAllowed;
            if (Array.isArray(responseKelas)) {
              finalKelas = responseKelas.map((c: any) => String(c).trim()).filter(Boolean);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Local Storage Save
    const createdEskul: Extracurricular = { id: createdId, nama, kelasAllowed: finalKelas, tahunPelajaran };
    const updatedList = [createdEskul, ...eskulList];
    setEskulList(updatedList);
    localStorage.setItem('smp_pgri_eskul', JSON.stringify(updatedList));

    // Update Class List dynamically with newly entered classes
    const updatedClasses = [...classList];
    let classListChanged = false;
    finalKelas.forEach(cls => {
      const trimmed = cls.trim();
      if (trimmed && !updatedClasses.includes(trimmed)) {
        updatedClasses.push(trimmed);
        classListChanged = true;
      }
    });
    if (classListChanged) {
      setClassList(updatedClasses);
      localStorage.setItem('smp_pgri_classes', JSON.stringify(updatedClasses));
    }
  };

  // Delete Extracurricular
  const handleDeleteEskul = async (id: string) => {
    const gasUrl = settings.googleAppsScriptUrl;

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'deleteEskul',
          id
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Local Storage Save
    const updatedList = eskulList.filter(e => e.id !== id);
    setEskulList(updatedList);
    localStorage.setItem('smp_pgri_eskul', JSON.stringify(updatedList));
  };

  // Update Extracurricular
  const handleUpdateEskul = async (id: string, nama: string, kelasAllowed: string[], tahunPelajaran: string) => {
    const gasUrl = settings.googleAppsScriptUrl;
    const cleanKelas = (kelasAllowed || []).map(cls => cls.trim()).filter(Boolean);
    const updatedEskul = { nama, kelasAllowed: cleanKelas, tahunPelajaran };

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'updateEskul',
          id,
          data: updatedEskul
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Local Storage Save for eskulList
    const updatedList = eskulList.map(e => e.id === id ? { ...e, nama, kelasAllowed: cleanKelas, tahunPelajaran } : e);
    setEskulList(updatedList);
    localStorage.setItem('smp_pgri_eskul', JSON.stringify(updatedList));

    // Update corresponding eskul names in student list locally
    const updatedStudents = students.map(s => {
      let changed = false;
      const newS = { ...s };
      if (s.eskulId === id && s.eskulName !== nama) {
        newS.eskulName = nama;
        changed = true;
      }
      if (s.eskulId2 === id && s.eskulName2 !== nama) {
        newS.eskulName2 = nama;
        changed = true;
      }
      if (s.eskulId3 === id && s.eskulName3 !== nama) {
        newS.eskulName3 = nama;
        changed = true;
      }
      return changed ? newS : s;
    });
    setStudents(updatedStudents);
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));

    // Update Class List dynamically with any newly entered classes
    const updatedClasses = [...classList];
    let classListChanged = false;
    cleanKelas.forEach(cls => {
      const trimmed = cls.trim();
      if (trimmed && !updatedClasses.includes(trimmed)) {
        updatedClasses.push(trimmed);
        classListChanged = true;
      }
    });
    if (classListChanged) {
      setClassList(updatedClasses);
      localStorage.setItem('smp_pgri_classes', JSON.stringify(updatedClasses));
    }
  };

  // Reset student registrations for a single extracurricular
  const handleResetEskulStudents = async (eskulId: string) => {
    const gasUrl = settings.googleAppsScriptUrl;

    // Filter locally first to ensure immediate state update in case of lag/slow network
    const updatedStudents = students.filter(s => s.eskulId !== eskulId && s.eskulId2 !== eskulId && s.eskulId3 !== eskulId);
    setStudents(updatedStudents);
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'resetEskulStudents',
          eskulId
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchAppData(settings);
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
  };

  // Full Database registration clean
  const handleResetAllData = async () => {
    const gasUrl = settings.googleAppsScriptUrl;

    // Clear locally first
    setStudents([]);
    localStorage.setItem('smp_pgri_students', JSON.stringify([]));

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'resetAllData'
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        await fetchAppData(settings);
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
  };

  // Verify connection in background without full-screen loading overlay
  const checkLiveConnectionSilently = async (url: string) => {
    if (!url || !url.startsWith('http')) {
      setIsLiveConnection(false);
      return;
    }
    try {
      const resJson = await gasFetch(url, 'getData');
      if (resJson.status === 'success') {
        setIsLiveConnection(true);
        if (resJson.students) {
          const mappedStudents = resJson.students.map(mapStudentData);
          setStudents(mappedStudents);
          localStorage.setItem('smp_pgri_students', JSON.stringify(mappedStudents));
        }
        if (resJson.eskul) setEskulList(resJson.eskul);
        if (resJson.admins) {
          setAdmins(resJson.admins);
          localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
        }
        if (resJson.settings) {
          let isPublishedVal = settings.isPublished;
          if (resJson.settings.isPublished !== undefined) {
            if (typeof resJson.settings.isPublished === 'boolean') {
              isPublishedVal = resJson.settings.isPublished;
            } else if (typeof resJson.settings.isPublished === 'string') {
              isPublishedVal = resJson.settings.isPublished.toLowerCase() === 'true';
            }
          }
          const updatedSettings = {
            ...settings,
            tahunPelajaranAktif: resJson.settings.tahunPelajaranAktif || settings.tahunPelajaranAktif,
            isPublished: isPublishedVal
          };
          setSettings(updatedSettings);
          localStorage.setItem('smp_pgri_settings', JSON.stringify(updatedSettings));
        }
        if (resJson.classes && Array.isArray(resJson.classes) && resJson.classes.length > 0) {
          setClassList(resJson.classes);
          localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
        }
        return;
      }
      if (!settings.googleAppsScriptUrl || !settings.googleAppsScriptUrl.trim().startsWith('http')) {
        setIsLiveConnection(false);
      } else {
        setIsLiveConnection(true);
      }
    } catch (e) {
      console.warn('Silent live connection test failed, using local database mode');
      if (!settings.googleAppsScriptUrl || !settings.googleAppsScriptUrl.trim().startsWith('http')) {
        setIsLiveConnection(false);
      } else {
        setIsLiveConnection(true);
      }
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('smp_pgri_settings', JSON.stringify(updated));

    // Save to shared backend settings
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error('Failed to save settings to backend:', e);
    }

    // If cloud link is active, update settings on sheet
    if (isLiveConnection && updated.googleAppsScriptUrl) {
      try {
        await gasPost(updated.googleAppsScriptUrl, {
          action: 'updateSettings',
          data: newSettings
        });
      } catch (e) {
        console.error('Could not sync settings to Sheets');
      }
    }

    // Hapus sinkronisasi Database (blocking loading) apabila mengedit atau menghapus URL / provider
    if (newSettings.googleAppsScriptUrl !== undefined) {
      if (!updated.googleAppsScriptUrl || !updated.googleAppsScriptUrl.trim().startsWith('http')) {
        setIsLiveConnection(false);
        // Load local state data immediately
        const savedEskul = localStorage.getItem('smp_pgri_eskul');
        if (savedEskul) setEskulList(JSON.parse(savedEskul));
        const savedStudents = localStorage.getItem('smp_pgri_students');
        if (savedStudents) setStudents(JSON.parse(savedStudents).map(mapStudentData));
        const savedAdmins = localStorage.getItem('smp_pgri_admins');
        if (savedAdmins) setAdmins(JSON.parse(savedAdmins));
      } else {
        // Silent update/verification in the background (no full-screen spinner)
        checkLiveConnectionSilently(updated.googleAppsScriptUrl);
      }
    } else {
      // Trigger complete data refresh if they only updated the active school year
      fetchAppData(updated);
    }
  };

  // Synchronized refresh handler (fetching settings first, then app data)
  const handleRefresh = async () => {
    Swal.fire({
      title: 'Menyinkronkan...',
      text: 'Mengambil data terbaru dari Google Spreadsheet...',
      allowOutsideClick: false,
      width: '320px',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let currentSettings = settings;
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const serverSettings = await response.json();
          currentSettings = { ...currentSettings, ...serverSettings };
          setSettings(currentSettings);
          localStorage.setItem('smp_pgri_settings', JSON.stringify(currentSettings));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch settings from backend API on refresh', e);
    }

    try {
      const success = await fetchAppData(currentSettings);
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Sinkronisasi Berhasil!',
          text: 'Seluruh data pendaftaran siswa telah sinkron dengan sheet Siswa pada Google Spreadsheet.',
          showConfirmButton: false,
          timer: 1500,
          width: '340px'
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Sinkronisasi Menggunakan Offline Cache',
          text: 'Gagal terhubung dengan Spreadsheet. Data saat ini menggunakan cache lokal browser.',
          confirmButtonColor: '#ef4444',
          width: '340px'
        });
      }
    } catch (err) {
      console.error('Error during refresh:', err);
      Swal.fire({
        icon: 'error',
        title: 'Sinkronisasi Gagal',
        text: 'Terjadi kesalahan sistem saat sinkronisasi data.',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    }
  };

  // Add Admin Account
  const handleAddAdmin = async (newAdmin: any): Promise<any> => {
    const adminWithStatus = {
      id: 'admin-' + Math.random().toString(36).substring(2, 11),
      ...newAdmin,
      status: newAdmin.status || (newAdmin.username.toLowerCase().trim() === 'admin' ? 'Utama' : 'Biasa'),
      createdAt: new Date().toISOString()
    };

    const gasUrl = settings.googleAppsScriptUrl;
    if (isLiveConnection && gasUrl && gasUrl.startsWith('http')) {
      try {
        const resJson = await gasPost(gasUrl, {
          action: 'addAdmin',
          data: adminWithStatus
        });
        if (resJson && resJson.status === 'success') {
          const finalData = resJson.data || adminWithStatus;
          const updatedAdmins = [...admins, finalData];
          setAdmins(updatedAdmins);
          localStorage.setItem('smp_pgri_admins', JSON.stringify(updatedAdmins));
          return finalData;
        }
      } catch (error) {
        console.error('Error adding admin to Sheets:', error);
        throw error;
      }
    }

    // Local Fallback
    const updated = [...admins, adminWithStatus];
    setAdmins(updated);
    localStorage.setItem('smp_pgri_admins', JSON.stringify(updated));
    return adminWithStatus;
  };

  // Delete Admin Account
  const handleDeleteAdmin = async (username: string): Promise<void> => {
    const gasUrl = settings.googleAppsScriptUrl;
    if (isLiveConnection && gasUrl && gasUrl.startsWith('http')) {
      try {
        const resJson = await gasPost(gasUrl, {
          action: 'deleteAdmin',
          username: username
        });
        if (resJson && resJson.status === 'success') {
          const filtered = admins.filter(adm => adm.username.toLowerCase().trim() !== username.toLowerCase().trim());
          setAdmins(filtered);
          localStorage.setItem('smp_pgri_admins', JSON.stringify(filtered));
          return;
        }
      } catch (error) {
        console.error('Error deleting admin from Sheets:', error);
        throw error;
      }
    }

    // Local Fallback
    const filtered = admins.filter(adm => adm.username.toLowerCase().trim() !== username.toLowerCase().trim());
    setAdmins(filtered);
    localStorage.setItem('smp_pgri_admins', JSON.stringify(filtered));
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans animate-fadeIn">
      
      {/* PROFESSIONAL NAVBAR */}
      <header className="bg-slate-900 text-slate-100 border-b border-slate-850 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl flex items-center justify-center border-2 border-white shadow-sm shrink-0 overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/d/1Jfb6nl1FHxlA3tL8qNNrgyPrc1ob2SfT" 
                  alt="Logo SMP PGRI Jatiuwung" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[10px] sm:text-sm font-black tracking-wider uppercase text-white leading-none">SMP PGRI Jatiuwung</h1>
                <div className="text-[7px] sm:text-[9px] text-yellow-300 font-bold tracking-normal uppercase mt-0.5 sm:mt-1 flex flex-col sm:flex-row sm:items-start sm:gap-1">
                  <span>Jl. Gatot Subroto KM. 5 No. 4 Kec. Jatiuwung</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Kota Tangerang</span>
                </div>
              </div>
            </div>

            {/* Middle Navigation - Removed for simple clean single view */}

            {/* Right Indicators */}
            <div className="flex items-center gap-2 sm:gap-4">
              {!isAdminLoggedIn ? (
                <button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setTempGasUrl(settings.googleAppsScriptUrl || '');
                    setIsGasUrlConfigOpen(false);
                  }}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-black bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-md sm:rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0 uppercase tracking-wider"
                >
                  <Lock className="w-3 h-3 text-slate-950" />
                  <span>Masuk</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogoutClick}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer border border-red-700 shrink-0 uppercase tracking-wide"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex-grow">
        {isInitializing && activeView !== 'student' && !isAdminLoggedIn ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-3">
            <span className="animate-spin rounded-full h-8 w-8 border-3 border-blue-700 border-t-transparent"></span>
            <span className="text-xs font-bold text-slate-600 animate-pulse">Menghubungi Server...</span>
          </div>
        ) : isLoading && activeView === 'admin' && !isAdminLoggedIn ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-3">
            <span className="animate-spin rounded-full h-8 w-8 border-3 border-blue-700 border-t-transparent"></span>
            <span className="text-xs font-base">Sinkronisasi Database...</span>
          </div>
        ) : (
          <div className="animate-fadeIn">
            {activeView === 'student' && (
              settings.isPublished !== false ? (
                <StudentForm 
                  eskulList={eskulList} 
                  tahunPelajaranAktif={settings.tahunPelajaranAktif}
                  onSubmitRegistration={handleRegisterStudent}
                  isLive={isLiveConnection}
                  classList={classList}
                  isLoading={isLoading || isInitializing}
                  onRefresh={handleRefresh}
                />
              ) : (
                <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
                  <div className="bg-white rounded-3xl shadow-xl border border-blue-500 p-8 sm:p-12 space-y-6 animate-fadeIn relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-800 via-blue-500 to-blue-800"></div>
                    
                    {/* Icon */}
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 animate-spin mx-auto" />
                    
                    <div className="space-y-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest bg-blue-100 text-blue-800">
                        Mohon Maaf ...
                      </span>
                      <h2 className="text-[16px] font-bold text-slate-800 leading-tight">
                        Pendaftaran Ekstrakurikuller Sudah di tutup
                      </h2>
                      <p className="text-[12px] font-base text-slate-800 leading-tight">
                        Tahun Pelajaran {settings.tahunPelajaranAktif || '2026/2027'}
                      </p>
                      <p className="text-[12px] font-base text-slate-800 leading-tight">
                        Silahkan Menghubungi Pak Ahmed 082175787863
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
            {activeView === 'admin' && (
              <AdminDashboard 
                students={students}
                onUpdateStudent={handleUpdateStudent}
                eskulList={eskulList}
                settings={settings}
                onAddEskul={handleAddEskul}
                 onUpdateEskul={handleUpdateEskul}
                onDeleteEskul={handleDeleteEskul}
                onResetEskulStudents={handleResetEskulStudents}
                onResetAllData={handleResetAllData}
                onUpdateSettings={handleUpdateSettings}
                onAddAdmin={handleAddAdmin}
                onDeleteAdmin={handleDeleteAdmin}
                admins={admins}
                loggedAdmin={loggedAdmin}
                isLoggedIn={isAdminLoggedIn}
                setIsLoggedIn={handleSetIsAdminLoggedIn}
                isLive={isLiveConnection || (!!settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http'))}
                onRefresh={handleRefresh}
                classList={classList}
                isSupabaseSchemaIncomplete={isSupabaseSchemaIncomplete}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-center py-5 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-extrabold text-slate-200 tracking-wider text-[11px] sm:text-xs">SMP PGRI JATIUWUNG</p>
          <p className="font-medium text-slate-400 text-[10px] sm:text-[11px]">Sistem Pendaftaran Ekstrakurikuler</p>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold italic">Jl. Gatot Subroto KM. 5 No. 4 Jatiuwung Kota Tangerang</p>
          <p className="text-[10px] text-slate-500">© 2026 all rights reserved</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">@nawasyiahmed</p>
        </div>
      </footer>

      {/* RESPONSIVE POPUP LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn" id="login-modal-overlay">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden transform transition-all animate-scaleUp"
            id="login-modal-box"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 relative">
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-3.5 right-3.5 text-slate-300 hover:text-white transition-all text-xs font-bold bg-white/10 hover:bg-white/20 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                aria-label="Tutup"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center border border-white/20 shrink-0">
                  <Lock className="w-4 h-4 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase leading-none">Login Guru</h3>
                  <p className="text-[8px] text-yellow-300 font-semibold tracking-wider uppercase mt-1 leading-none">Hanya Guru yang dapat masuk.</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePopupLoginSubmit} noValidate className="p-4 space-y-3.5 relative">
              {isVerifyingLogin && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-2xl"></div>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  disabled={isVerifyingLogin}
                  placeholder="Username"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-700 font-semibold text-slate-800 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isVerifyingLogin}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-700 font-semibold text-slate-800 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={isVerifyingLogin}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifyingLogin}
                className={`w-full py-2 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 mt-2 ${
                  isVerifyingLogin 
                    ? 'bg-blue-500 cursor-not-allowed opacity-80' 
                    : 'bg-blue-700 hover:bg-blue-800 cursor-pointer'
                }`}
              >
                {isVerifyingLogin ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>MASUK</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
