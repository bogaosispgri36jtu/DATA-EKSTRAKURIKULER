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
          setStudents(resJson.students || []);
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
        
        setStudents(resJson.students || []);
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

  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyHwTkpTwb9GU0dgKunUBX7kIKEdzn-CLs6A8wQX5WGLORe5FRx0TEuDksp-GyHCRFnAw/exec';

  const gasFetch = async (gasUrl: string, action: string, params: Record<string, string> = {}): Promise<any> => {
    try {
      const urlObj = new URL('/api/gas', window.location.origin);
      urlObj.searchParams.set('url', gasUrl);
      urlObj.searchParams.set('action', action);
      Object.entries(params).forEach(([key, val]) => {
        urlObj.searchParams.set(key, val);
      });

      const response = await fetch(urlObj.toString());
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
      console.warn('Proxy fetch failed, trying direct Google Apps Script fetch...', e);
    }

    // Direct GAS Web App fetch (e.g. for Vercel/serverless environments where proxy is not running)
    const directUrl = new URL(gasUrl);
    directUrl.searchParams.set('action', action);
    Object.entries(params).forEach(([key, val]) => {
      directUrl.searchParams.set(key, val);
    });

    const response = await fetch(directUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Direct connection to Google Apps Script failed: ${response.status}`);
    }
    return await response.json();
  };

  const gasPost = async (gasUrl: string, body: any): Promise<any> => {
    try {
      const response = await fetch(`/api/gas?url=${encodeURIComponent(gasUrl)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          if (json && (json.status === 'success' || json.status === 'error')) {
            return json;
          }
        }
      }
    } catch (e) {
      console.warn('Proxy POST failed, trying direct Google Apps Script POST...', e);
    }

    // Direct GAS Web App POST via no-cors (e.g. for Vercel/serverless environments where proxy is not running)
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(body)
    });

    return { status: 'success', isDirectPost: true };
  };

  // Core Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [eskulList, setEskulList] = useState<Extracurricular[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    googleAppsScriptUrl: '',
    tahunPelajaranAktif: '2026/2027',
    isPublished: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnection, setIsLiveConnection] = useState(false);

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

      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const serverSettings = await response.json();
            activeSettings = { ...activeSettings, ...serverSettings };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch settings from backend API, falling back to local storage', e);
        const savedSettings = localStorage.getItem('smp_pgri_settings');
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            activeSettings = { ...activeSettings, ...parsed };
          } catch (err) {}
        }
      }

      if (!activeSettings.googleAppsScriptUrl) {
        activeSettings.googleAppsScriptUrl = '';
      }

      setSettings(activeSettings);
      localStorage.setItem('smp_pgri_settings', JSON.stringify(activeSettings));
      fetchAppData(activeSettings);
    };

    initializeApp();
  }, []);

  const fetchAppData = async (currentSettings: AppSettings) => {
    setIsLoading(true);
    // FALLBACK TO DEFAULT SPREADSHEET URL FOR THE PUBLIC STUDENT REGISTRATION FORM
    const gasUrl = currentSettings.googleAppsScriptUrl || DEFAULT_GAS_URL;

    if (gasUrl && gasUrl.startsWith('http')) {
      try {
        // Try fetching from Google Apps Script Web App
        const resJson = await gasFetch(gasUrl, 'getData');
        
        if (resJson.status === 'success') {
          const mappedStudents = (resJson.students || []).map((s: any) => ({
            ...s,
            name: s.name || s.nama || ''
          }));
          setStudents(mappedStudents);
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
          setSettings({
            ...currentSettings,
            tahunPelajaranAktif: resJson.settings.tahunPelajaranAktif
          });
          setIsLiveConnection(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.warn('Google Sheets API connection failed, falling back to Local Database.', error);
        setIsLiveConnection(false);
      }
    }

    // LOCAL DATABASE FALLBACK (localStorage)
    setIsLiveConnection(false);
    
    // Load Eskul Fallback
    const savedEskul = localStorage.getItem('smp_pgri_eskul');
    if (savedEskul) {
      try {
        setEskulList(JSON.parse(savedEskul));
      } catch (e) {
        setEskulList([]);
      }
    } else {
      setEskulList([]);
    }

    // Load Classes Fallback
    const savedClasses = localStorage.getItem('smp_pgri_classes');
    if (savedClasses) {
      try {
        setClassList(JSON.parse(savedClasses));
      } catch (e) {
        setClassList([]);
      }
    } else {
      setClassList([]);
    }

    // Load Students Fallback
    const savedStudents = localStorage.getItem('smp_pgri_students');
    if (savedStudents) {
      try {
        setStudents(JSON.parse(savedStudents));
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
  };

  // -------------------- CORE ACTION PROXIES (POST HANDLERS) --------------------

  // Submit Student Registration
  const handleRegisterStudent = async (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>): Promise<Student> => {
    const gasUrl = settings.googleAppsScriptUrl || DEFAULT_GAS_URL;
    
    if (isLiveConnection && gasUrl) {
      try {
        const resJson = await gasPost(gasUrl, {
          action: 'registerStudent',
          data: studentData
        });

        if (resJson && resJson.status === 'success') {
          if (resJson.data) {
            setStudents(prev => [resJson.data, ...prev]);
            return resJson.data;
          } else {
            // direct post fallback (no-cors)
            setTimeout(() => fetchAppData(settings), 2000);
            const mockReg = generateMockStudentResponse(studentData);
            setStudents(prev => [mockReg, ...prev]);
            return mockReg;
          }
        }

        // Fallback re-fetch trigger just in case
        setTimeout(() => fetchAppData(settings), 2000);
        
        const mockReg = generateMockStudentResponse(studentData);
        setStudents(prev => [mockReg, ...prev]);
        return mockReg;
      } catch (err) {
        console.error('GAS Post failed, trying local fallback', err);
      }
    }

    // Local Storage save
    const mockReg = generateMockStudentResponse(studentData);
    const updatedStudents = [mockReg, ...students];
    setStudents(updatedStudents);
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));
    return mockReg;
  };

  const generateMockStudentResponse = (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>): Student => {
    // Count existing registrations in this school year for registration number sequence
    const yearMatches = students.filter(s => s.tahunPelajaran === studentData.tahunPelajaran).length;
    const sequenceStr = ("00" + (yearMatches + 1)).slice(-3);
    const targetYear = studentData.tahunPelajaran.split('/')[0];
    
    const regNo = `REG/${targetYear}/${sequenceStr}`;
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
    const newEskul = { nama, kelasAllowed, tahunPelajaran };

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'addEskul',
          data: newEskul
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Local Storage Save
    const id = `eskul-${Math.random().toString(36).substr(2, 9)}`;
    const createdEskul: Extracurricular = { id, nama, kelasAllowed, tahunPelajaran };
    const updatedList = [createdEskul, ...eskulList];
    setEskulList(updatedList);
    localStorage.setItem('smp_pgri_eskul', JSON.stringify(updatedList));

    // Update Class List dynamically with newly entered classes
    const updatedClasses = [...classList];
    let classListChanged = false;
    kelasAllowed.forEach(cls => {
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

  // Reset student registrations for a single extracurricular
  const handleResetEskulStudents = async (eskulId: string) => {
    const gasUrl = settings.googleAppsScriptUrl;

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'resetEskulStudents',
          eskulId
        });
        setTimeout(() => fetchAppData(settings), 1500);
      } catch (e) {
        console.error(e);
      }
    }

    // Local storage clean
    const updatedStudents = students.filter(s => s.eskulId !== eskulId);
    setStudents(updatedStudents);
    localStorage.setItem('smp_pgri_students', JSON.stringify(updatedStudents));
  };

  // Full Database registration clean
  const handleResetAllData = async () => {
    const gasUrl = settings.googleAppsScriptUrl;

    if (isLiveConnection && gasUrl) {
      try {
        await gasPost(gasUrl, {
          action: 'resetAllData'
        });
        setTimeout(() => fetchAppData(settings), 1500);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Local clean
    setStudents([]);
    localStorage.setItem('smp_pgri_students', JSON.stringify([]));
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
          const mappedStudents = resJson.students.map((s: any) => ({
            ...s,
            name: s.name || s.nama || ''
          }));
          setStudents(mappedStudents);
        }
        if (resJson.eskul) setEskulList(resJson.eskul);
        if (resJson.admins) {
          setAdmins(resJson.admins);
          localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
        }
        if (resJson.classes && Array.isArray(resJson.classes) && resJson.classes.length > 0) {
          setClassList(resJson.classes);
          localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
        }
        return;
      }
      setIsLiveConnection(false);
    } catch (e) {
      console.warn('Silent live connection test failed, using local database mode');
      setIsLiveConnection(false);
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

    // Hapus sinkronisasi Database (blocking loading) apabila mengedit atau menghapus URL
    if (newSettings.googleAppsScriptUrl !== undefined) {
      if (!updated.googleAppsScriptUrl || !updated.googleAppsScriptUrl.trim().startsWith('http')) {
        setIsLiveConnection(false);
        // Load local state data immediately
        const savedEskul = localStorage.getItem('smp_pgri_eskul');
        if (savedEskul) setEskulList(JSON.parse(savedEskul));
        const savedStudents = localStorage.getItem('smp_pgri_students');
        if (savedStudents) setStudents(JSON.parse(savedStudents));
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
    await fetchAppData(currentSettings);
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
        {isLoading && activeView === 'admin' ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-3">
            <span className="animate-spin rounded-full h-8 w-8 border-3 border-blue-700 border-t-transparent"></span>
            <span className="text-xs font-bold">Sinkronisasi Database...</span>
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
                  isLoading={isLoading}
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
                        Pendaftaran Esktrakurikuller Sudah di tutup
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
                eskulList={eskulList}
                settings={settings}
                onAddEskul={handleAddEskul}
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
                isLive={isLiveConnection && !!settings.googleAppsScriptUrl}
                onRefresh={handleRefresh}
                classList={classList}
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
