/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, ShieldCheck, Database, FileCode, CheckCircle, 
  HelpCircle, Sparkles, School, Layers, Users, RefreshCw, Lock, LogOut,
  Eye, EyeOff
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Student, Extracurricular, AppSettings } from './types';
import { DEFAULT_EXTRACURRICULARS, KELAS_LIST } from './data';
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
  const [activeView, setActiveView] = useState<'student' | 'admin' | 'guide'>('student');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loggedAdmin, setLoggedAdmin] = useState<{ username: string; status: string } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleSetIsAdminLoggedIn = (loggedIn: boolean) => {
    setIsAdminLoggedIn(loggedIn);
    if (loggedIn) {
      setActiveView('admin');
    } else {
      setActiveView('student');
      setLoggedAdmin(null);
    }
  };

  const handlePopupLoginSubmit = (e: React.FormEvent) => {
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

    const currentAdmins = (admins && admins.length > 0) ? admins : [{ username: 'admin', password: 'admin123', status: 'Admin Utama' }];
    const matchedAccount = currentAdmins.find(
      (acc) => acc.username.toLowerCase().trim() === loginUsername.toLowerCase().trim() && acc.password === loginPassword
    );

    if (matchedAccount) {
      setLoggedAdmin({ username: matchedAccount.username, status: matchedAccount.status || 'Admin Biasa' });
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
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '340px'
      });
    }
  };

  // Core Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [eskulList, setEskulList] = useState<Extracurricular[]>([]);
  const [classList, setClassList] = useState<string[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    googleAppsScriptUrl: '',
    tahunPelajaranAktif: '2026/2027',
    adminUsername: 'admin',
    adminPassword: 'admin123'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLiveConnection, setIsLiveConnection] = useState(false);

  // Initialize and load data (from Sheets API if exists, otherwise localStorage)
  useEffect(() => {
    // 1. Load basic settings from local storage to check for GAS URL
    const savedSettings = localStorage.getItem('smp_pgri_settings');
    let activeSettings = {
      googleAppsScriptUrl: '',
      tahunPelajaranAktif: '2026/2027',
      adminUsername: 'admin',
      adminPassword: 'admin123'
    };

    if (savedSettings) {
      try {
        activeSettings = { ...activeSettings, ...JSON.parse(savedSettings) };
        setSettings(activeSettings);
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }

    // 2. Fetch data
    fetchAppData(activeSettings);
  }, []);

  const fetchAppData = async (currentSettings: AppSettings) => {
    setIsLoading(true);
    const gasUrl = currentSettings.googleAppsScriptUrl;

    if (gasUrl && gasUrl.startsWith('http')) {
      try {
        // Try fetching from Google Apps Script Web App
        const response = await fetch(`${gasUrl}?action=getData`);
        if (!response.ok) throw new Error('API fetch failed');
        const resJson = await response.json();
        
        if (resJson.status === 'success') {
          setStudents(resJson.students || []);
          setEskulList(resJson.eskul || []);
          if (resJson.classes && Array.isArray(resJson.classes) && resJson.classes.length > 0) {
            setClassList(resJson.classes);
            localStorage.setItem('smp_pgri_classes', JSON.stringify(resJson.classes));
          } else {
            const savedClasses = localStorage.getItem('smp_pgri_classes');
            if (savedClasses) {
              setClassList(JSON.parse(savedClasses));
            } else {
              setClassList(KELAS_LIST);
            }
          }
          if (resJson.admins && Array.isArray(resJson.admins)) {
            setAdmins(resJson.admins);
          } else {
            setAdmins([{ username: 'admin', password: 'admin123', status: 'Admin Utama' }]);
          }
          setSettings({
            ...currentSettings,
            tahunPelajaranAktif: resJson.settings.tahunPelajaranAktif,
            adminUsername: '',
            adminPassword: ''
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
    
    // Load Eskul
    const savedEskul = localStorage.getItem('smp_pgri_eskul');
    if (savedEskul) {
      setEskulList(JSON.parse(savedEskul));
    } else {
      localStorage.setItem('smp_pgri_eskul', JSON.stringify(DEFAULT_EXTRACURRICULARS));
      setEskulList(DEFAULT_EXTRACURRICULARS);
    }

    // Load Kelas List
    const savedClasses = localStorage.getItem('smp_pgri_classes');
    if (savedClasses) {
      setClassList(JSON.parse(savedClasses));
    } else {
      localStorage.setItem('smp_pgri_classes', JSON.stringify(KELAS_LIST));
      setClassList(KELAS_LIST);
    }

    // Load Students
    const savedStudents = localStorage.getItem('smp_pgri_students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      localStorage.setItem('smp_pgri_students', JSON.stringify(SEED_STUDENTS));
      setStudents(SEED_STUDENTS);
    }

    // Load Admin List Fallback
    setAdmins([{ username: 'admin', password: 'admin123', status: 'Admin Utama' }]);

    setIsLoading(false);
  };

  // -------------------- CORE ACTION PROXIES (POST HANDLERS) --------------------

  // Submit Student Registration
  const handleRegisterStudent = async (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>): Promise<Student> => {
    const gasUrl = settings.googleAppsScriptUrl;
    
    if (isLiveConnection && gasUrl) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'registerStudent',
            data: studentData
          })
        });

        // Due to no-cors limitations or redirect in GAS web apps, we double-check the server state
        // To keep it 100% reliable, we trigger an immediate silent re-fetch
        setTimeout(() => fetchAppData(settings), 2000);

        // Generate matching mock response client-side for immediate feedback
        const mockReg = generateMockStudentResponse(studentData);
        // Append locally as optimist update
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
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'addEskul',
            data: newEskul
          })
        });
        setTimeout(() => fetchAppData(settings), 1500);
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
  };

  // Delete Extracurricular
  const handleDeleteEskul = async (id: string) => {
    const gasUrl = settings.googleAppsScriptUrl;

    if (isLiveConnection && gasUrl) {
      try {
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteEskul',
            id
          })
        });
        setTimeout(() => fetchAppData(settings), 1500);
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
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'resetEskulStudents',
            eskulId
          })
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
        await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'resetAllData'
          })
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

  // Update Settings
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('smp_pgri_settings', JSON.stringify(updated));

    // If cloud link is active, update settings on sheet
    if (isLiveConnection && settings.googleAppsScriptUrl) {
      try {
        await fetch(settings.googleAppsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'updateSettings',
            data: newSettings
          })
        });
      } catch (e) {
        console.error('Could not sync settings to Sheets');
      }
    }

    // Trigger complete data refresh
    fetchAppData(updated);
  };

  // Add Admin Account
  const handleAddAdmin = async (newAdmin: any): Promise<any> => {
    const adminWithStatus = {
      ...newAdmin,
      status: newAdmin.status || (newAdmin.username.toLowerCase().trim() === 'admin' ? 'Admin Utama' : 'Admin Biasa')
    };

    const gasUrl = settings.googleAppsScriptUrl;
    if (isLiveConnection && gasUrl && gasUrl.startsWith('http')) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'addAdmin',
            data: adminWithStatus
          })
        });
        if (!response.ok) throw new Error('Failed to save admin to Sheets');
        const resJson = await response.json();
        if (resJson.status === 'success') {
          const updatedAdmins = [...admins, resJson.data];
          setAdmins(updatedAdmins);
          return resJson.data;
        }
      } catch (error) {
        console.error('Error adding admin to Sheets:', error);
        throw error;
      }
    }

    // Local Fallback
    const updated = [...admins, adminWithStatus];
    setAdmins(updated);
    return adminWithStatus;
  };

  // Delete Admin Account
  const handleDeleteAdmin = async (username: string): Promise<void> => {
    const gasUrl = settings.googleAppsScriptUrl;
    if (isLiveConnection && gasUrl && gasUrl.startsWith('http')) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'deleteAdmin',
            username: username
          })
        });
        if (!response.ok) throw new Error('Failed to delete admin from Sheets');
        const resJson = await response.json();
        if (resJson.status === 'success') {
          setAdmins(prev => prev.filter(adm => adm.username.toLowerCase().trim() !== username.toLowerCase().trim()));
          return;
        }
      } catch (error) {
        console.error('Error deleting admin from Sheets:', error);
        throw error;
      }
    }

    // Local Fallback
    setAdmins(prev => prev.filter(adm => adm.username.toLowerCase().trim() !== username.toLowerCase().trim()));
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
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-black bg-yellow-400 hover:bg-yellow-500 text-slate-950 rounded-md sm:rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm shrink-0 uppercase tracking-wider"
                >
                  <Lock className="w-3 h-3 text-slate-950" />
                  <span>Masuk</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetIsAdminLoggedIn(false)}
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
              <StudentForm 
                eskulList={eskulList} 
                tahunPelajaranAktif={settings.tahunPelajaranAktif}
                onSubmitRegistration={handleRegisterStudent}
                isLive={isLiveConnection}
                classList={classList}
              />
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
                isLive={isLiveConnection}
                onRefresh={() => fetchAppData(settings)}
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
            <form onSubmit={handlePopupLoginSubmit} noValidate className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-700 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-250 rounded-lg text-xs focus:outline-none focus:border-blue-700 font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>MASUK</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
