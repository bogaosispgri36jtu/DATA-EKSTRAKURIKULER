/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, ShieldCheck, Database, FileCode, CheckCircle, 
  HelpCircle, Sparkles, School, Layers, Users, RefreshCw
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
  const [activeView, setActiveView] = useState<'student' | 'admin' | 'guide'>('student');

  // Core Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [eskulList, setEskulList] = useState<Extracurricular[]>([]);
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
          setSettings({
            ...currentSettings,
            tahunPelajaranAktif: resJson.settings.tahunPelajaranAktif,
            adminUsername: resJson.settings.adminUsername,
            adminPassword: resJson.settings.adminPassword
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

    // Load Students
    const savedStudents = localStorage.getItem('smp_pgri_students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      localStorage.setItem('smp_pgri_students', JSON.stringify(SEED_STUDENTS));
      setStudents(SEED_STUDENTS);
    }

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
          mode: 'no-cors', // Trigger simple post if required, or direct JSON depending on execution
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* LEFT COLUMN: DESKTOP SIMULATOR CONTROLLER PANEL */}
      <div className="w-full md:w-[350px] lg:w-[420px] bg-slate-950 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
              <School className="w-5.5 h-5.5 text-blue-900" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide uppercase text-white leading-tight">SMP PGRI Jatiuwung</h2>
              <p className="text-[10px] text-yellow-300 font-bold tracking-wider">PANEL KENDALILIVE PREVIEW</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Selamat datang di simulator platform pendaftaran digital. Panel ini mensimulasikan fungsionalitas mobile-first dari website publik dan portal admin.
          </p>

          {/* Device Toggles */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pilih Simulasi Tampilan</span>
            
            {/* Toggle 1: Student view */}
            <button
              onClick={() => setActiveView('student')}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                activeView === 'student' 
                  ? 'bg-blue-600/10 border-blue-600 text-white shadow-md shadow-blue-500/5' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeView === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Tampilan Formulir Siswa</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Form publik pendaftar eskul</p>
                </div>
              </div>
              {activeView === 'student' && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
            </button>

            {/* Toggle 2: Admin Dashboard */}
            <button
              onClick={() => setActiveView('admin')}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                activeView === 'admin' 
                  ? 'bg-blue-600/10 border-blue-600 text-white shadow-md shadow-blue-500/5' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeView === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Portal Dashboard Guru</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Kelola kategori & rekap data</p>
                </div>
              </div>
              {activeView === 'admin' && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
            </button>

            {/* Toggle 3: API Connection Manual */}
            <button
              onClick={() => setActiveView('guide')}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                activeView === 'guide' 
                  ? 'bg-blue-600/10 border-blue-600 text-white shadow-md shadow-blue-500/5' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeView === 'guide' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Panduan Apps Script (kode.gs)</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Integrasi Google Sheet gratis</p>
                </div>
              </div>
              {activeView === 'guide' && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
            </button>
          </div>

          {/* Connection Status Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Konektivitas Database</span>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Mode Database</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLiveConnection ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                {isLiveConnection ? 'Google Sheets Live' : 'Simulasi Lokal'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Pendaftar Terdata</span>
              <span className="text-xs font-bold font-mono text-white">{students.length} Siswa</span>
            </div>
            
            {/* Quick manual refresh */}
            <button
              onClick={() => fetchAppData(settings)}
              className="w-full mt-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Segarkan Sinkronisasi
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-slate-900 text-[10px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">SMP PGRI Jatiuwung Tangerang</p>
          <p>© 2026. All rights reserved.</p>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW SCREEN SIMULATOR AREA */}
      <div className="flex-1 bg-slate-900 p-3 md:p-8 flex items-center justify-center overflow-hidden">
        
        {/* Device Wrapper Container (Adds a gorgeous smartphone border mockup on desktop viewports) */}
        <div className="w-full max-w-md bg-transparent flex flex-col items-center">
          
          <div className="text-[10px] text-slate-400 mb-2.5 font-bold tracking-widest uppercase flex items-center gap-1.5 md:hidden">
            <Smartphone className="w-4 h-4 text-yellow-400" />
            <span>Simulasi HP Aktif</span>
          </div>

          {/* Virtual Mobile Screen */}
          <div className="w-full h-[640px] md:h-[720px] rounded-[2.5rem] bg-white border-[10px] border-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between max-w-[380px]">
            {/* Phone Speaker Notch bar */}
            <div className="absolute top-0 left-0 right-0 h-5 bg-slate-950 flex justify-center items-center z-50">
              <div className="w-16 h-3 bg-slate-900 rounded-full border border-slate-850"></div>
            </div>

            {/* Embedded Active Mobile App View Container */}
            <div className="flex-1 overflow-y-auto mt-5 scrollbar-thin">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 bg-white gap-3">
                  <span className="animate-spin rounded-full h-8 w-8 border-3 border-blue-700 border-t-transparent"></span>
                  <span className="text-xs font-bold text-slate-500">Sinkronisasi Database...</span>
                </div>
              ) : (
                <>
                  {activeView === 'student' && (
                    <StudentForm 
                      eskulList={eskulList} 
                      tahunPelajaranAktif={settings.tahunPelajaranAktif}
                      onSubmitRegistration={handleRegisterStudent}
                      isLive={isLiveConnection}
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
                    />
                  )}
                  {activeView === 'guide' && (
                    <ApiSetupGuide />
                  )}
                </>
              )}
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 text-center font-bold tracking-wide mt-3 uppercase hidden md:block">
            Tekan tombol menu samping untuk bertukar kacamata pandangan (Form Siswa vs. Dashboard Guru)
          </p>
        </div>

      </div>

    </div>
  );
}
