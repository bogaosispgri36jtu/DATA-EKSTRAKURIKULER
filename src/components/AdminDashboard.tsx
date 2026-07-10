/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, LayoutDashboard, FileText, Settings, Plus, Trash2, 
  Download, Printer, Search, Filter, ShieldAlert, CheckCircle2,
  RefreshCcw, Eye, EyeOff, ArrowUpDown, Layers, Database, UserCheck, LogOut,
  UserPlus, User, Shield, Key
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Student, Extracurricular, AppSettings } from '../types';
import { TAHUN_PELAJARAN_LIST } from '../data';
import ApiSetupGuide from './ApiSetupGuide';

interface AdminDashboardProps {
  students: Student[];
  eskulList: Extracurricular[];
  settings: AppSettings;
  onAddEskul: (nama: string, kelasAllowed: string[], tahunPelajaran: string) => Promise<void>;
  onDeleteEskul: (id: string) => Promise<void>;
  onResetEskulStudents: (eskulId: string) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onAddAdmin?: (newAdmin: any) => Promise<any>;
  onDeleteAdmin?: (username: string) => Promise<void>;
  admins?: any[];
  loggedAdmin?: { username: string; status: string } | null;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean, adminUser?: { username: string; status: string }) => void;
  isLive?: boolean;
  onRefresh?: () => Promise<void> | void;
  classList?: string[];
  isSupabaseSchemaIncomplete?: boolean;
}

const formatToIndoPhone = (num: any): string => {
  if (!num) return '';
  const str = String(num);
  let clean = str.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return '+' + clean;
};

const parseDateSafely = (dateStr: any): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  
  const s = String(dateStr).trim();
  if (!s) return new Date();

  // Try standard Date parsing
  let d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d;
  }

  // Handle dd/MM/yyyy HH:mm:ss or dd-MM-yyyy HH:mm:ss
  const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
  const match = s.match(dmyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    const second = match[6] ? parseInt(match[6], 10) : 0;
    
    d = new Date(year, month, day, hour, minute, second);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  // Handle yyyy-MM-dd HH:mm:ss or yyyy/MM/dd HH:mm:ss
  const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;
  const matchYmd = s.match(ymdRegex);
  if (matchYmd) {
    const year = parseInt(matchYmd[1], 10);
    const month = parseInt(matchYmd[2], 10) - 1;
    const day = parseInt(matchYmd[3], 10);
    const hour = matchYmd[4] ? parseInt(matchYmd[4], 10) : 0;
    const minute = matchYmd[5] ? parseInt(matchYmd[5], 10) : 0;
    const second = matchYmd[6] ? parseInt(matchYmd[6], 10) : 0;
    
    d = new Date(year, month, day, hour, minute, second);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  return new Date(); // Fallback to current date/time to avoid throwing Uncaught RangeError
};

export default function AdminDashboard({
  students,
  eskulList,
  settings,
  onAddEskul,
  onDeleteEskul,
  onResetEskulStudents,
  onResetAllData,
  onUpdateSettings,
  onAddAdmin,
  onDeleteAdmin,
  admins = [],
  loggedAdmin = null,
  isLoggedIn,
  setIsLoggedIn,
  isLive = false,
  onRefresh,
  classList = [],
  isSupabaseSchemaIncomplete = false
}: AdminDashboardProps) {
  const isLoggedAdminUtama = !loggedAdmin ? false : (
    (loggedAdmin.status && loggedAdmin.status.toLowerCase().includes('utama'))
  );

  const [logoImgElement, setLogoImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://lh3.googleusercontent.com/d/1Jfb6nl1FHxlA3tL8qNNrgyPrc1ob2SfT';
    img.onload = () => {
      setLogoImgElement(img);
    };
  }, []);

  useEffect(() => {
    setGasUrlInput(settings.googleAppsScriptUrl || '');
    setActiveYearInput(settings.tahunPelajaranAktif);
    setNewEskulTahun(settings.tahunPelajaranAktif);
    setIsPublishedInput(settings.isPublished !== false);
    setDbProviderInput('gas');
    setSupabaseUrlInput('');
    setSupabaseAnonKeyInput(settings.supabaseAnonKey || '');
  }, [settings]);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'eskul' | 'laporan' | 'pengaturan'>('laporan');

  // Extract grades and rombels dynamically from both classList and eskulList (Spreadsheet integration)
  const { availableGrades, availableRombels } = React.useMemo(() => {
    const gradesSet = new Set<string>(['7', '8', '9']);
    const rombelsSet = new Set<string>(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);

    const allRawClasses: string[] = [];
    
    // Add from classList (Sheet Kelas)
    if (classList && classList.length > 0) {
      allRawClasses.push(...classList);
    }
    
    // Add from eskulList (Sheet Eskul)
    if (eskulList && eskulList.length > 0) {
      eskulList.forEach(e => {
        if (e.kelasAllowed) {
          allRawClasses.push(...e.kelasAllowed);
        }
      });
    }

    allRawClasses.forEach(cls => {
      const trimmed = cls.trim();
      if (!trimmed) return;
      // Split by dot (e.g. "7.A") or space (e.g. "7 A") or dash (e.g. "7-A") or take components
      const parts = trimmed.split(/[\.\-\s]+/);
      if (parts[0]) {
        gradesSet.add(parts[0].trim());
      }
      if (parts[1]) {
        rombelsSet.add(parts[1].trim());
      }
    });

    let gradesArr = Array.from(gradesSet);
    let rombelsArr = Array.from(rombelsSet);

    // Sort grades and rombels naturally
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    gradesArr.sort(collator.compare);
    rombelsArr.sort(collator.compare);

    return {
      availableGrades: gradesArr,
      availableRombels: rombelsArr
    };
  }, [classList, eskulList]);

  // New Eskul State
  const [newEskulNama, setNewEskulNama] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [newEskulTahun, setNewEskulTahun] = useState(settings.tahunPelajaranAktif);
  const [isAddingEskul, setIsAddingEskul] = useState(false);

  // Robustly resolve grade & rombel into exact class name matching classList formatting
  const resolveClassName = (grade: string, rombel: string): string => {
    const rombelMap: Record<string, string> = {
      'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5', 'F': '6', 'G': '7', 'H': '8', 'I': '9'
    };
    const numericRombel = rombelMap[rombel.toUpperCase()] || '';

    const found = classList.find(cls => {
      const c = cls.trim().toUpperCase();
      const romanGrade = grade === '7' ? 'VII' : grade === '8' ? 'VIII' : grade === '9' ? 'IX' : '';
      
      const parts = c.split(/[\.\-\s]+/);
      if (parts.length >= 2) {
        const gPart = parts[0];
        const rPart = parts[1];
        if (
          (gPart === grade || gPart === romanGrade) && 
          (rPart === rombel.toUpperCase() || (numericRombel && rPart === numericRombel))
        ) {
          return true;
        }
      } else {
        if (
          c === `${grade}${rombel}` || 
          c === `${romanGrade}${rombel}` ||
          (numericRombel && (c === `${grade}${numericRombel}` || c === `${romanGrade}${numericRombel}`))
        ) {
          return true;
        }
      }
      return false;
    });
    
    const romanGrade = grade === '7' ? 'VII' : grade === '8' ? 'VIII' : grade === '9' ? 'IX' : grade;
    const defaultFormat = numericRombel ? `${romanGrade}-${numericRombel}` : `${grade}.${rombel}`;
    return found || defaultFormat;
  };

  const handleToggleClass = (classNameVal: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classNameVal)) {
        return prev.filter(x => x !== classNameVal);
      } else {
        return [...prev, classNameVal];
      }
    });
  };

  const handleToggleMaster = (grade: string) => {
    const rombels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const classNamesForGrade = rombels.map(r => resolveClassName(grade, r));
    const allSelected = classNamesForGrade.every(c => selectedClasses.includes(c));
    
    if (allSelected) {
      setSelectedClasses(prev => prev.filter(c => !classNamesForGrade.includes(c)));
    } else {
      setSelectedClasses(prev => {
        const otherClasses = prev.filter(c => !classNamesForGrade.includes(c));
        return [...otherClasses, ...classNamesForGrade];
      });
    }
  };

  // Laporan Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEskul, setFilterEskul] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Settings State
  const [gasUrlInput, setGasUrlInput] = useState(settings.googleAppsScriptUrl);
  const [activeYearInput, setActiveYearInput] = useState(settings.tahunPelajaranAktif);
  const [isPublishedInput, setIsPublishedInput] = useState(settings.isPublished !== false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [dbProviderInput, setDbProviderInput] = useState<'gas' | 'supabase'>(settings.dbProvider || 'gas');
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(settings.supabaseAnonKey || '');
  const [isMigrating, setIsMigrating] = useState(false);

  // New Admin Form State
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [newAdminStatus, setNewAdminStatus] = useState('Biasa');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Username wajib diisi!',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
      });
      return;
    }
    if (!password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Password wajib diisi!',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
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
      return u === username.toLowerCase().trim() && p === password.trim();
    });

    if (!matchedAccount && settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.startsWith('http')) {
      Swal.fire({
        title: 'Memverifikasi...',
        text: 'Sedang mencocokkan data dengan Google Sheet...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        width: '340px'
      });

      try {
        const response = await fetch(`${settings.googleAppsScriptUrl}?action=getData`);
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.status === 'success' && resJson.admins && Array.isArray(resJson.admins)) {
            localStorage.setItem('smp_pgri_admins', JSON.stringify(resJson.admins));
            matchedAccount = resJson.admins.find((acc: any) => {
              const u = acc.username ? acc.username.toString().toLowerCase().trim() : '';
              const p = acc.password ? acc.password.toString().trim() : '';
              return u === username.toLowerCase().trim() && p === password.trim();
            });
          }
        }
      } catch (error) {
        console.warn('Failed to refetch live admins for verification', error);
      }
      Swal.close();
    }

    if (matchedAccount) {
      setIsLoggedIn(true, { username: matchedAccount.username, status: matchedAccount.status || 'Biasa' });
      Swal.fire({
        icon: 'success',
        iconColor: '#10b981', // Emerald green
        title: 'Login Berhasil',
        text: 'Selamat datang di Dashboard Admin.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        width: '340px'
      });
    } else {
      const loadedUsernames = currentAdmins.map((acc: any) => acc.username || '').filter(Boolean);
      const usernamesListHtml = loadedUsernames.length > 0 
        ? `<div class="mt-2 text-[10px] bg-blue-50 text-blue-800 p-2 rounded-lg font-bold"><b>Daftar Akun Terdaftar Saat Ini:</b><br/>${loadedUsernames.join(', ')}</div>`
        : '';

      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        html: `<div class="text-xs text-slate-600 leading-relaxed text-center space-y-1.5">
          <div>Username atau password salah!</div>
          ${usernamesListHtml}
          <div class="mt-2 text-[10px] bg-slate-100 p-2 rounded-lg text-slate-500 font-semibold text-left">
            <b>Tips:</b> Jika baru menambahkan admin di Spreadsheet, pastikan Anda sudah melakukan <b>Deploy Ulang (New Deployment)</b> di Google Apps Script agar perubahan tersinkronisasi.
          </div>
        </div>`,
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    }
  };

  // Add Eskul Handler
  const handleAddEskulSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEskulNama.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Eskul Wajib diisi',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
      return;
    }

    if (selectedClasses.length === 0) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Kelas Wajib Diisi', 
        text: 'Silakan pilih minimal satu rombel kelas yang diizinkan dengan mencentangnya.',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
      return;
    }

    setIsAddingEskul(true);
    try {
      await onAddEskul(newEskulNama, selectedClasses, newEskulTahun);
      setNewEskulNama('');
      setSelectedClasses([]);
      Swal.fire({
        icon: 'success',
        title: 'Eskul Ditambahkan',
        text: 'Kategori Ekstrakurikuler baru berhasil tersimpan.',
        timer: 1500,
        showConfirmButton: false,
        width: '340px'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambahkan',
        text: 'Koneksi API bermasalah.',
        confirmButtonColor: '#ef4444',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
    } finally {
      setIsAddingEskul(false);
    }
  };

  // Delete Eskul
  const handleDeleteEskulClick = async (id: string, name: string) => {
    const studentCount = students.filter(s => s.eskulId === id).length;
    
    const result = await Swal.fire({
      title: 'Hapus Ekstrakurikuler?',
      html: `<div class="text-xs text-slate-600 leading-relaxed text-left">Apakah Anda yakin ingin menghapus <b>${name}</b>?<br/>${studentCount > 0 ? `<span class="text-red-500 font-bold block mt-2">⚠️ PERINGATAN: Ada ${studentCount} siswa terdaftar di eskul ini!</span>` : ''}</div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      width: '340px'
    });

    if (result.isConfirmed) {
      try {
        await onDeleteEskul(id);
        Swal.fire({ icon: 'success', title: 'Eskul terhapus', timer: 1200, showConfirmButton: false, width: '340px' });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal menghapus', width: '340px' });
      }
    }
  };

  // Dynamic list of classes derived from active extracurriculars
  const dynamicKelasList = React.useMemo(() => {
    const classesSet = new Set<string>();
    eskulList.forEach(eskul => {
      if (Array.isArray(eskul.kelasAllowed)) {
        eskul.kelasAllowed.forEach(k => {
          if (k && k.trim() !== '') {
            classesSet.add(k.trim());
          }
        });
      }
    });
    const sortedList = Array.from(classesSet);
    return sortedList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [eskulList]);

  // Use classList from spreadsheet if available, fallback to dynamic derived list
  const finalKelasList = React.useMemo(() => {
    if (classList && classList.length > 0) {
      return classList;
    }
    return dynamicKelasList;
  }, [classList, dynamicKelasList]);

  // Extract classes with registered students for the active academic year
  const registeredClasses = React.useMemo(() => {
    const classesSet = new Set<string>();
    students.forEach(s => {
      if (s.tahunPelajaran === settings.tahunPelajaranAktif && s.kelas) {
        classesSet.add(s.kelas.trim());
      }
    });
    return Array.from(classesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [students, settings.tahunPelajaranAktif]);

  // Extract active extracurriculars with student counts
  const activeEskulsWithCounts = React.useMemo(() => {
    const active = eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif);
    return active.map(eskul => {
      const count = students.filter(s => 
        s.tahunPelajaran === settings.tahunPelajaranAktif && 
        (s.eskulId === eskul.id || s.eskulId2 === eskul.id || s.eskulId3 === eskul.id)
      ).length;
      return { ...eskul, count };
    });
  }, [eskulList, students, settings.tahunPelajaranAktif]);

  // Calculate statistics per class (classes created by teachers in active school year)
  const classRegistrationStats = React.useMemo(() => {
    const allClasses = Array.from(new Set([...finalKelasList, ...registeredClasses]));
    return allClasses.map(cls => {
      const clsStr = (cls || '').toString().toLowerCase().trim();
      const count = students.filter(s => {
        const sKelas = (s?.kelas || '').toString().toLowerCase().trim();
        const sTahun = s?.tahunPelajaran || '';
        return sKelas === clsStr && sTahun === (settings.tahunPelajaranAktif || '');
      }).length;
      return { className: cls, count };
    }).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' }));
  }, [finalKelasList, registeredClasses, students, settings.tahunPelajaranAktif]);

  // Filter students based on query
  const filteredStudents = students.filter(student => {
    const matchTahun = student?.tahunPelajaran === settings.tahunPelajaranAktif;
    if (!matchTahun) return false;

    const sName = (student?.name || student?.nama || '').toString().toLowerCase();
    const sRegNo = (student?.regNo || '').toString().toLowerCase();
    const sHp = (student?.hpSiswa || '').toString();

    const matchSearch = 
      sName.includes(searchQuery.toLowerCase()) ||
      sRegNo.includes(searchQuery.toLowerCase()) ||
      sHp.includes(searchQuery);
    
    const matchEskul = filterEskul ? (
      (student?.eskulId || '') === filterEskul ||
      (student?.eskulId2 || '') === filterEskul ||
      (student?.eskulId3 || '') === filterEskul
    ) : true;

    const matchKelas = filterKelas ? (student?.kelas || '').toString().toLowerCase().trim() === filterKelas.toLowerCase().trim() : true;

    return matchSearch && matchEskul && matchKelas;
  });

  // Export reports to Excel format (with multiple sheets per eskul)
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data siswa untuk diekspor.', width: '340px' });
      return;
    }

    // 1. Create a new Workbook
    const wb = XLSX.utils.book_new();

    // Headers requested by the user
    const excelHeaders = [
      "Nama",
      "Kelas",
      "JenisKelamin",
      "TempatLahir",
      "TanggalLahir",
      "NamaAyah",
      "NamaIbu",
      "HpSiswa",
      "HpOrtu",
      "Email",
      "PrestasiChecked",
      "NamaLomba",
      "CabangLomba",
      "TingkatLomba",
      "JuaraKe",
      "Penyelenggara",
      "Alamat",
      "RT",
      "RW",
      "ProvinsiName",
      "KabupatenName",
      "KecamatanName",
      "KelurahanName",
      "EskulName",
      "EskulName2",
      "EskulName3",
      "CreatedAt"
    ];

    // Mapper function to map student object to the requested columns
    const mapStudentToRow = (s: typeof filteredStudents[0]) => {
      let formattedDate = "";
      if (s.createdAt) {
        try {
          const d = parseDateSafely(s.createdAt);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
          } else {
            formattedDate = String(s.createdAt);
          }
        } catch (e) {
          formattedDate = String(s.createdAt);
        }
      }

      let formattedTanggalLahir = "";
      if (s.tanggalLahir) {
        try {
          const d = parseDateSafely(s.tanggalLahir);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            formattedTanggalLahir = `${day}-${month}-${year}`; // e.g. "04-07-2026"
          } else {
            formattedTanggalLahir = String(s.tanggalLahir);
          }
        } catch (e) {
          formattedTanggalLahir = String(s.tanggalLahir);
        }
      }

      const prestasiVal = s.prestasiChecked ? "Tersedia" : "Tidak Ada";

      return [
        s.name || s.nama || "",
        s.kelas || "",
        s.jenisKelamin || "",
        s.tempatLahir || "",
        formattedTanggalLahir,
        s.namaAyah || "",
        s.namaIbu || "",
        formatToIndoPhone(s.hpSiswa),
        formatToIndoPhone(s.hpOrtu),
        s.email || "",
        prestasiVal,
        s.namaLomba || "",
        s.cabangLomba || "",
        s.tingkatLomba || "",
        s.juaraKe || "",
        s.penyelenggara || "",
        s.alamat || "",
        s.rt || "",
        s.rw || "",
        s.provinsiName || "",
        s.kabupatenName || "",
        s.kecamatanName || "",
        s.kelurahanName || "",
        s.eskulName || "",
        s.eskulName2 || "",
        s.eskulName3 || "",
        formattedDate
      ];
    };

    // Helper to calculate column widths
    const setColWidths = (ws: XLSX.WorkSheet, headers: string[], rows: any[][]) => {
      const colWidths = headers.map((hdr, cIdx) => {
        let maxLen = hdr.length;
        rows.forEach(row => {
          const val = String(row[cIdx] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
      });
      ws['!cols'] = colWidths;
    };

    // 2. First sheet is "Semua Siswa" (All Students)
    const allSiswaRows = filteredStudents.map(mapStudentToRow);
    const wsAllSiswa = XLSX.utils.aoa_to_sheet([excelHeaders, ...allSiswaRows]);
    setColWidths(wsAllSiswa, excelHeaders, allSiswaRows);
    XLSX.utils.book_append_sheet(wb, wsAllSiswa, "Semua Siswa");

    // 3. Generate sheet for EACH registered extracurricular in eskulList
    let activeEskuls = eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif);
    if (activeEskuls.length === 0) {
      activeEskuls = eskulList;
    }

    activeEskuls.forEach(eskul => {
      // Find students registered for this eskul (either as choice 1, 2, or 3)
      const eskulStudents = filteredStudents.filter(s => 
        s.eskulId === eskul.id || 
        s.eskulId2 === eskul.id || 
        s.eskulId3 === eskul.id
      );

      const eskulRows = eskulStudents.map(mapStudentToRow);
      const wsEskul = XLSX.utils.aoa_to_sheet([excelHeaders, ...eskulRows]);
      setColWidths(wsEskul, excelHeaders, eskulRows);

      // Sanitize sheet name: unique, max 31 chars, no invalid characters
      let sheetName = eskul.nama.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31).trim();
      if (!sheetName) sheetName = `Eskul ${eskul.id}`;
      
      // Handle potential sheet name duplicates
      let uniqueName = sheetName;
      let counter = 1;
      while (wb.SheetNames.includes(uniqueName)) {
        uniqueName = `${sheetName.substring(0, 28)} ${counter++}`;
      }

      XLSX.utils.book_append_sheet(wb, wsEskul, uniqueName);
    });

    // Write file
    const fileSuffix = settings.tahunPelajaranAktif.replace(/\//g, '-');
    XLSX.writeFile(wb, `LAPORAN_DAFTAR_SISWA_ESKUL_${fileSuffix}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Ekspor Berhasil',
      text: 'File laporan Excel dengan sheet per-eskul telah terunduh.',
      showConfirmButton: false,
      timer: 2000,
      width: '340px'
    });
  };

  // Generate Recap PDF Report
  const handlePrintPDFRecap = () => {
    if (filteredStudents.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data siswa untuk dicetak.', width: '340px' });
      return;
    }

    Swal.fire({
      title: 'Menyiapkan Dokumen...',
      text: 'Sedang membuat laporan rekapitulasi pendaftaran.',
      allowOutsideClick: false,
      width: '340px',
      didOpen: () => Swal.showLoading()
    });

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Header with Logo
      if (logoImgElement) {
        try {
          doc.addImage(logoImgElement, 'PNG', 15, 8, 18, 18);
        } catch (e) {
          console.error("Failed to add preloaded logo to recap PDF", e);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(29, 78, 216);
      doc.text('SMP PGRI JATIUWUNG', 114, 13, { align: 'center' });
      doc.setFontSize(9.5);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`LAPORAN REKAPITULASI PENDAFTARAN EKSTRAKURIKULER`, 114, 18, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text('Jl. Gatot Subroto KM. 5 No. 4 Jatiuwung Kota Tangerang', 114, 22, { align: 'center' });
      doc.text(`Tahun Pelajaran: ${settings.tahunPelajaranAktif} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 114, 26, { align: 'center' });
      
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.5);
      doc.line(15, 29, 195, 29);

      // Section 1: Summary Table per Eskul
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      doc.text('RINGKASAN PENDAFTARAN PER EKSTRAKURIKULER', 15, 36);

      // Draw table headers
      let currentY = 42;
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.2);
      doc.rect(15, currentY, 180, 8, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('No', 18, currentY + 5.5);
      doc.text('Nama Ekstrakurikuler', 30, currentY + 5.5);
      doc.text('Kriteria Kelas', 120, currentY + 5.5);
      doc.text('Jumlah Pendaftar', 160, currentY + 5.5);

      doc.line(15, currentY, 195, currentY);
      doc.line(15, currentY + 8, 195, currentY + 8);
      
      currentY += 8;
      
      let no = 1;
      let totalSiswa = 0;
      
      eskulList.forEach(eskul => {
        const count = students.filter(s => s.eskulId === eskul.id && s.tahunPelajaran === settings.tahunPelajaranAktif).length;
        totalSiswa += count;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(31, 41, 55);
        doc.text(String(no++), 18, currentY + 5);
        doc.text(eskul.nama, 30, currentY + 5);
        doc.text(eskul.kelasAllowed.join(', '), 120, currentY + 5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${count} Siswa`, 160, currentY + 5);
        
        doc.line(15, currentY + 7, 195, currentY + 7);
        currentY += 7;
      });

      // Total Row
      doc.setFillColor(239, 246, 255);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(29, 78, 216);
      doc.text('TOTAL SELURUH PENDAFTAR', 30, currentY + 5.5);
      doc.text(`${totalSiswa} Siswa`, 160, currentY + 5.5);
      doc.line(15, currentY + 8, 195, currentY + 8);

      currentY += 16;

      // Section 2: Detailed Registrant List
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(11);
      doc.text('DAFTAR PESERTA PENDAFTAR BARU', 15, currentY);
      
      currentY += 6;

      doc.setFillColor(243, 244, 246);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('No', 18, currentY + 5.5);
      doc.text('No. Registrasi', 28, currentY + 5.5);
      doc.text('Nama Lengkap', 60, currentY + 5.5);
      doc.text('Kelas', 115, currentY + 5.5);
      doc.text('Pilihan Ekstrakurikuler', 135, currentY + 5.5);

      doc.line(15, currentY, 195, currentY);
      doc.line(15, currentY + 8, 195, currentY + 8);
      
      currentY += 8;

      let rNo = 1;
      filteredStudents.forEach(s => {
        // Handle page overflow safely
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
          doc.setFillColor(243, 244, 246);
          doc.rect(15, currentY, 180, 8, 'F');
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(55, 65, 81);
          doc.text('No', 18, currentY + 5.5);
          doc.text('No. Registrasi', 28, currentY + 5.5);
          doc.text('Nama Lengkap', 60, currentY + 5.5);
          doc.text('Kelas', 115, currentY + 5.5);
          doc.text('Pilihan Ekstrakurikuler', 135, currentY + 5.5);
          doc.line(15, currentY, 195, currentY);
          doc.line(15, currentY + 8, 195, currentY + 8);
          currentY += 8;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(31, 41, 55);
        doc.text(String(rNo++), 18, currentY + 5);
        doc.text(s.regNo, 28, currentY + 5);
        doc.text(s.name.toUpperCase().substring(0, 25), 60, currentY + 5);
        doc.text(s.kelas, 115, currentY + 5);
        const eskulStr = s.eskulName2 ? `${s.eskulName}, ${s.eskulName2}` : s.eskulName;
        doc.text(eskulStr.substring(0, 32), 135, currentY + 5);

        doc.line(15, currentY + 7, 195, currentY + 7);
        currentY += 7;
      });

      // Signature section at the very end
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      const sigY = currentY + 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text('Mengetahui,', 160, sigY, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Kepala Sekolah SMP PGRI', 160, sigY + 5, { align: 'center' });
      doc.line(130, sigY + 30, 190, sigY + 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('NIP. .............................', 160, sigY + 34, { align: 'center' });

      doc.save(`REKAPITULASI_PENDAFTARAN_JU_${settings.tahunPelajaranAktif.replace(/\//g, '-')}.pdf`);
      Swal.close();
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Rekapitulasi PDF telah terunduh.',
          showConfirmButton: false,
          timer: 2000,
          width: '340px'
        });
      }, 100);
    } catch (e) {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Gagal cetak PDF', width: '340px' });
    }
  };

  // Generate PDF Reports per Eskul
  const handlePrintPDFPerEskul = async () => {
    // Determine which eskuls to print
    let eskulsToPrint = eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif);
    
    if (filterEskul) {
      eskulsToPrint = eskulsToPrint.filter(e => e.id === filterEskul);
    }

    if (eskulsToPrint.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data kategori ekstrakurikuler untuk dicetak.', width: '340px' });
      return;
    }

    Swal.fire({
      title: 'Menyiapkan Dokumen...',
      text: 'Sedang membuat laporan PDF per-ekstrakurikuler.',
      allowOutsideClick: false,
      width: '340px',
      didOpen: () => Swal.showLoading()
    });

    let kopImageSrc = 'https://lh3.googleusercontent.com/d/1NxNXjW1OcRjs_zRf7-t0wpLhRJfZFN0q';
    let kopHeight = 31;
    let hasLoadedImg = false;
    const img = new Image();

    try {
      img.crossOrigin = 'anonymous';
      img.src = kopImageSrc;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      if (img.naturalWidth && img.naturalHeight) {
        kopHeight = (img.naturalHeight / img.naturalWidth) * 196;
        hasLoadedImg = true;
      }
    } catch (e) {
      console.error("Failed to load Kop image in AdminDashboard", e);
    }

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let isFirstPage = true;

      eskulsToPrint.forEach(eskul => {
        // Find students registered for this eskul (choice 1, 2, or 3)
        const eskulStudents = students.filter(s => 
          s.tahunPelajaran === settings.tahunPelajaranAktif &&
          (s.eskulId === eskul.id || s.eskulId2 === eskul.id || s.eskulId3 === eskul.id)
        );

        if (!isFirstPage) {
          doc.addPage();
        }
        isFirstPage = false;

        // Draw unified KOP Image
        let startYAfterKop = 45;
        if (hasLoadedImg) {
          doc.addImage(img, 'PNG', 7, 7, 196, kopHeight);
          startYAfterKop = 7 + kopHeight + 6; // Spacing after Kop image
        }

        // Eskul Information Header on first page of this eskul
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text(`KATEGORI EKSTRAKURIKULER: ${eskul.nama.toUpperCase()}`, 15, startYAfterKop);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Total Terdaftar: ${eskulStudents.length} Siswa`, 15, startYAfterKop + 5);

        // Draw Table Headers (Height: 7mm)
        let currentY = startYAfterKop + 10;
        doc.setFillColor(29, 78, 216); // Blue header
        doc.rect(15, currentY, 180, 7, 'F');
        doc.setDrawColor(209, 213, 219);
        doc.setLineWidth(0.2);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255); // White text
        doc.text('No', 18, currentY + 4.8);
        doc.text('Nama Siswa', 28, currentY + 4.8);
        doc.text('Kelas', 73, currentY + 4.8);
        doc.text('No. HP Siswa', 88, currentY + 4.8);
        doc.text('No. HP Ortu', 118, currentY + 4.8);
        doc.text('Alamat', 148, currentY + 4.8);

        // White vertical grid lines for headers
        doc.setDrawColor(255, 255, 255);
        doc.line(25, currentY, 25, currentY + 7);
        doc.line(70, currentY, 70, currentY + 7);
        doc.line(85, currentY, 85, currentY + 7);
        doc.line(115, currentY, 115, currentY + 7);
        doc.line(145, currentY, 145, currentY + 7);

        currentY += 7;

        if (eskulStudents.length === 0) {
          doc.setDrawColor(209, 213, 219);
          doc.rect(15, currentY, 180, 8);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(107, 114, 128);
          doc.text('Belum ada siswa yang mendaftar di ekstrakurikuler ini.', 105, currentY + 5, { align: 'center' });
          currentY += 8;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(31, 41, 55);
          doc.setDrawColor(209, 213, 219);

          eskulStudents.forEach((s, idx) => {
            // Page break check (row height is 6mm)
            if (currentY + 6 > 272) {
              doc.addPage();
              currentY = 20;

              // Redraw headers on new page
              doc.setFillColor(29, 78, 216);
              doc.rect(15, currentY, 180, 7, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(255, 255, 255);
              doc.text('No', 18, currentY + 4.8);
              doc.text('Nama Siswa', 28, currentY + 4.8);
              doc.text('Kelas', 73, currentY + 4.8);
              doc.text('No. HP Siswa', 88, currentY + 4.8);
              doc.text('No. HP Ortu', 118, currentY + 4.8);
              doc.text('Alamat', 148, currentY + 4.8);

              doc.setDrawColor(255, 255, 255);
              doc.line(25, currentY, 25, currentY + 7);
              doc.line(70, currentY, 70, currentY + 7);
              doc.line(85, currentY, 85, currentY + 7);
              doc.line(115, currentY, 115, currentY + 7);
              doc.line(145, currentY, 145, currentY + 7);

              currentY += 7;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(31, 41, 55);
              doc.setDrawColor(209, 213, 219);
            }

            // Alternating backgrounds (even indices have white, odd have very light gray)
            if (idx % 2 === 1) {
              doc.setFillColor(249, 250, 251);
              doc.rect(15, currentY, 180, 6, 'F');
            }

            // Draw border cell lines
            doc.rect(15, currentY, 180, 6);
            doc.line(25, currentY, 25, currentY + 6);
            doc.line(70, currentY, 70, currentY + 6);
            doc.line(85, currentY, 85, currentY + 6);
            doc.line(115, currentY, 115, currentY + 6);
            doc.line(145, currentY, 145, currentY + 6);

            // Print text contents cleanly inside row
            doc.text(String(idx + 1), 18, currentY + 4.2);
            doc.text(s.name.toUpperCase().substring(0, 25), 28, currentY + 4.2);
            doc.text(s.kelas, 73, currentY + 4.2);
            doc.text(formatToIndoPhone(s.hpSiswa), 88, currentY + 4.2);
            doc.text(formatToIndoPhone(s.hpOrtu), 118, currentY + 4.2);
            
            const alamatTrunc = s.alamat.substring(0, 22) + (s.alamat.length > 22 ? '..' : '');
            doc.text(alamatTrunc, 148, currentY + 4.2);

            currentY += 6;
          });
        }

        // Add page break for signature if we don't have enough room
        if (currentY + 35 > 275) {
          doc.addPage();
          currentY = 20;
        }

        // Signature section
        const sigY = currentY + 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        doc.text('Mengetahui,', 160, sigY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Kepala Sekolah SMP PGRI', 160, sigY + 4, { align: 'center' });
        doc.line(130, sigY + 24, 190, sigY + 24);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('NIP. .............................', 160, sigY + 28, { align: 'center' });
      });

      // Save the generated document
      const fileSuffix = settings.tahunPelajaranAktif.replace(/\//g, '-');
      const filename = filterEskul && eskulsToPrint[0]
        ? `LAPORAN_SISWA_${eskulsToPrint[0].nama.replace(/\s+/g, '_').toUpperCase()}_${fileSuffix}.pdf`
        : `LAPORAN_SISWA_PER_ESKUL_${fileSuffix}.pdf`;

      doc.save(filename);
      Swal.close();

      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: 'Cetak Berhasil',
          text: 'Laporan PDF per-ekstrakurikuler telah diunduh.',
          showConfirmButton: false,
          timer: 2000,
          width: '340px'
        });
      }, 100);
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mencetak',
        text: 'Terjadi kesalahan saat membuat file PDF.',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    }
  };

  // Reset per Ekstrakurikuler
  const handleResetEskulClick = async () => {
    if (eskulList.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Eskul Kosong', width: '340px' });
      return;
    }

    const { value: selectedEskulId } = await Swal.fire({
      title: 'Reset per Ekstrakurikuler',
      input: 'select',
      inputOptions: eskulList.reduce((acc, eskul) => {
        const count = students.filter(s => s.eskulId === eskul.id).length;
        acc[eskul.id] = `${eskul.nama} (${count} siswa)`;
        return acc;
      }, {} as Record<string, string>),
      inputPlaceholder: '-- Pilih Ekstrakurikuler --',
      showCancelButton: true,
      confirmButtonText: 'Lanjut',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#eab308',
      width: '340px',
      inputValidator: (value) => {
        if (!value) {
          return 'Anda wajib memilih ekstrakurikuler!';
        }
      }
    });

    if (selectedEskulId) {
      const selectedEskul = eskulList.find(e => e.id === selectedEskulId);
      const studentCount = students.filter(s => s.eskulId === selectedEskulId).length;

      const confirm = await Swal.fire({
        title: 'Konfirmasi Penghapusan',
        html: `<div class="text-xs text-slate-600 leading-relaxed text-left">Apakah Anda yakin ingin menghapus <b>seluruh data (${studentCount} siswa)</b> yang terdaftar pada eskul <b>${selectedEskul?.nama}</b>? Tindakan ini bersifat permanen!</div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Reset Data!',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        width: '340px'
      });

      if (confirm.isConfirmed) {
        await onResetEskulStudents(selectedEskulId);
        Swal.fire({
          icon: 'success',
          title: 'Reset Berhasil',
          text: `Data siswa pada eskul ${selectedEskul?.nama} telah dikosongkan.`,
          confirmButtonColor: '#1d4ed8',
          width: '340px'
        });
      }
    }
  };

  // Reset Seluruh Data (Database reset)
  const handleResetAllDataClick = async () => {
    // Stage 1 Confirmation
    const stage1 = await Swal.fire({
      title: 'Reset Seluruh Database?',
      html: '<div class="text-xs text-slate-600 leading-relaxed text-left"><p class="text-red-500 font-bold text-sm">⚠️ PERINGATAN KRITIS!</p> Tindakan ini akan mengosongkan SELURUH data registrasi siswa dari database pendaftaran saat ini secara permanen untuk menyambut Tahun Pelajaran baru.</div>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan Konfirmasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      width: '340px'
    });

    if (stage1.isConfirmed) {
      // Stage 2 Confirmation with explicit text code
      const stage2 = await Swal.fire({
        title: 'Konfirmasi Berlapis',
        html: '<div class="text-xs text-slate-600 leading-relaxed text-left">Untuk menghindari ketidaksengajaan, silakan ketik teks <b>"RESET"</b> di bawah ini untuk mengosongkan seluruh database pendaftaran:</div>',
        input: 'text',
        inputPlaceholder: 'Ketik RESET di sini...',
        showCancelButton: true,
        confirmButtonText: 'RESET SEKARANG!',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        width: '340px',
        inputValidator: (value) => {
          if (value !== 'RESET') {
            return 'Teks yang Anda ketik salah!';
          }
        }
      });

      if (stage2.value === 'RESET') {
        Swal.fire({
          title: 'Sedang Mereset...',
          allowOutsideClick: false,
          width: '340px',
          didOpen: () => Swal.showLoading()
        });

        try {
          await onResetAllData();
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Database Bersih',
            text: 'Seluruh data pendaftaran siswa berhasil dibersihkan dengan aman.',
            confirmButtonColor: '#1d4ed8',
            width: '340px'
          });
        } catch (e) {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Gagal membersihkan database',
            width: '340px'
          });
        }
      }
    }
  };

  // Toggle Publication status with SweetAlert2 confirmation
  const handleTogglePublication = async () => {
    if (!isLoggedAdminUtama) return;

    if (isPublishedInput) {
      // Confirm closing registration
      const result = await Swal.fire({
        title: 'Tutup Pendaftaran?',
        text: 'Apakah Anda yakin ingin menutup pendaftaran? Siswa tidak akan dapat mengakses formulir pendaftaran ekstrakurikuler setelah ini ditutup.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Red
        cancelButtonColor: '#64748b', // Slate
        confirmButtonText: 'Ya, Tutup Pendaftaran',
        cancelButtonText: 'Batal',
        width: '360px',
        customClass: {
          popup: 'rounded-2xl',
          title: 'text-sm font-black text-slate-800',
          htmlContainer: 'text-xs text-slate-500 font-medium'
        }
      });
      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: 'Menyimpan...',
          html: 'Sedang menonaktifkan form pendaftaran...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
          width: '300px',
          customClass: { popup: 'rounded-2xl' }
        });

        try {
          await onUpdateSettings({ isPublished: false });
          setIsPublishedInput(false);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Ditutup',
            text: 'Form pendaftaran siswa kini telah ditutup.',
            timer: 1500,
            showConfirmButton: false,
            width: '340px',
            customClass: { popup: 'rounded-2xl' }
          });
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menyimpan',
            text: 'Gagal menonaktifkan pendaftaran. Silakan coba lagi.',
            confirmButtonColor: '#ef4444',
            width: '340px',
            customClass: { popup: 'rounded-2xl' }
          });
        }
      }
    } else {
      // Confirm opening registration
      const result = await Swal.fire({
        title: 'Buka Pendaftaran?',
        text: 'Apakah Anda yakin ingin membuka pendaftaran? Formulir pendaftaran akan aktif kembali dan dapat diakses secara publik oleh seluruh siswa.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1d4ed8', // Blue
        cancelButtonColor: '#64748b', // Slate
        confirmButtonText: 'Ya, Buka Pendaftaran',
        cancelButtonText: 'Batal',
        width: '360px',
        customClass: {
          popup: 'rounded-2xl',
          title: 'text-sm font-black text-slate-800',
          htmlContainer: 'text-xs text-slate-500 font-medium'
        }
      });
      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: 'Menyimpan...',
          html: 'Sedang mengaktifkan form pendaftaran...',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
          width: '300px',
          customClass: { popup: 'rounded-2xl' }
        });

        try {
          await onUpdateSettings({ isPublished: true });
          setIsPublishedInput(true);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Dibuka',
            text: 'Form pendaftaran siswa kini aktif kembali.',
            timer: 1500,
            showConfirmButton: false,
            width: '340px',
            customClass: { popup: 'rounded-2xl' }
          });
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal Menyimpan',
            text: 'Gagal mengaktifkan pendaftaran. Silakan coba lagi.',
            confirmButtonColor: '#ef4444',
            width: '340px',
            customClass: { popup: 'rounded-2xl' }
          });
        }
      }
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    
    let targetUrl = gasUrlInput ? gasUrlInput.trim() : '';
    
    if (targetUrl !== '' && !targetUrl.startsWith('https://script.google.com/')) {
      Swal.fire({
        icon: 'error',
        title: 'URL Tidak Valid',
        text: 'Format Google Apps Script URL harus dimulai dengan "https://script.google.com/".',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
      setIsSavingSettings(false);
      return;
    }

    let wasDevUrl = false;
    if (targetUrl.endsWith('/dev')) {
      targetUrl = targetUrl.substring(0, targetUrl.length - 4) + '/exec';
      wasDevUrl = true;
      setGasUrlInput(targetUrl);
    }

    try {
      await onUpdateSettings({
        dbProvider: 'gas',
        googleAppsScriptUrl: targetUrl,
        tahunPelajaranAktif: isLoggedAdminUtama ? activeYearInput : settings.tahunPelajaranAktif,
        isPublished: isLoggedAdminUtama ? isPublishedInput : (settings.isPublished !== false)
      });
      
      if (wasDevUrl) {
        Swal.fire({
          icon: 'warning',
          title: 'URL Diubah ke /exec',
          text: 'URL Apps Script yang berakhiran /dev telah otomatis diganti ke /exec agar dapat diakses publik. Harap pastikan Anda sudah melakukan "Deploy Baru" (New Deployment) dengan opsi akses "Anyone" pada editor Apps Script.',
          confirmButtonColor: '#1d4ed8',
          width: '340px'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Pengaturan Tersimpan',
          text: 'Pengaturan Tahun Pelajaran Aktif & API Sync diperbarui.',
          timer: 1500,
          showConfirmButton: false,
          width: '340px'
        });
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan', width: '340px' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Migrate Data to Supabase
  const handleMigrateToSupabase = async () => {
    setIsMigrating(true);
    Swal.fire({
      title: 'Memulai Migrasi...',
      text: 'Mempersiapkan data lokal dan Google Sheets...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Fetch latest values from localStorage or props
      const localAdmins = JSON.parse(localStorage.getItem('smp_pgri_admins') || '[]');
      const localClasses = JSON.parse(localStorage.getItem('smp_pgri_classes') || '[]');
      const localStudents = JSON.parse(localStorage.getItem('smp_pgri_students') || '[]');
      const localEskul = JSON.parse(localStorage.getItem('smp_pgri_eskul') || '[]');
      
      let finalStudents: any[] = [];
      let finalEskul: any[] = [];

      // If we are currently connected to Supabase, our active state might be empty.
      // We should check if we can fetch fresh data from Google Apps Script first.
      let gasUrl = '';
      try {
        const savedSettings = JSON.parse(localStorage.getItem('smp_pgri_settings') || '{}');
        gasUrl = savedSettings.googleAppsScriptUrl || '';
      } catch {}

      let sourceInfo = "Data lokal";

      if (gasUrl && gasUrl.startsWith('http')) {
        Swal.update({
          text: 'Mengambil data segar dari Google Sheets...'
        });
        try {
          const cleanUrl = gasUrl.replace(/\/edit\?usp=sharing$/, '/exec').replace(/\/edit$/, '/exec');
          const urlObj = new URL('/api/gas', window.location.origin);
          urlObj.searchParams.set('url', cleanUrl);
          urlObj.searchParams.set('action', 'getData');
          urlObj.searchParams.set('forceGas', 'true');
          
          const gasRes = await fetch(urlObj.toString());
          if (gasRes.ok) {
            const gasJson = await gasRes.json();
            if (gasJson && gasJson.status === 'success') {
              if (gasJson.students && Array.isArray(gasJson.students) && gasJson.students.length > 0) {
                finalStudents = gasJson.students;
                sourceInfo = "Google Sheets (Siswa & Eskul)";
              }
              if (gasJson.eskul && Array.isArray(gasJson.eskul) && gasJson.eskul.length > 0) {
                finalEskul = gasJson.eskul;
              }
            }
          }
        } catch (e) {
          console.warn('[Migration] Gagal mengambil data segar dari Google Sheets:', e);
        }
      }

      // Fallback to localStorage cache if still empty
      if (finalStudents.length === 0 && localStudents.length > 0) {
        finalStudents = localStudents;
        sourceInfo = "Penyimpanan Lokal (Cache Browser)";
      }
      if (finalEskul.length === 0 && localEskul.length > 0) {
        finalEskul = localEskul;
      }

      Swal.update({
        text: `Mengunggah data (${finalStudents.length} siswa, ${finalEskul.length} eskul) dari ${sourceInfo} ke Supabase...`
      });

      const payload = {
        students: finalStudents,
        eskul: finalEskul,
        classes: classList && classList.length > 0 ? classList : localClasses,
        admins: admins && admins.length > 0 ? admins : localAdmins
      };

      const response = await fetch('/api/migrate-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Migrasi Berhasil!',
          html: `<div class="text-left text-xs mb-2 font-semibold text-slate-600" style="text-align: left;">
            Sumber Data: <span class="text-emerald-700 font-bold">${sourceInfo}</span>
          </div>
          <div class="text-left text-xs space-y-1 max-h-48 overflow-y-auto font-mono bg-slate-50 p-2 rounded border border-slate-200" style="text-align: left;">
            ${result.logs.map((log: string) => `<div>${log}</div>`).join('')}
          </div>`,
          confirmButtonText: 'Selesai',
          confirmButtonColor: '#10b981',
          width: '450px'
        });
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Migrasi Gagal',
          text: result.message || 'Terjadi kesalahan saat berkomunikasi dengan server.',
          confirmButtonColor: '#ef4444',
          width: '340px'
        });
      }
    } catch (err: any) {
      console.error('Migration error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Kesalahan Sistem',
        text: err.message || 'Gagal terhubung ke endpoint migrasi server.',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Submit handler for creating a new admin account
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Nama Lengkap (Username) wajib diisi!',
        confirmButtonColor: '#1d4ed8',
        width: '340px'
      });
      return;
    }
    if (newAdminPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Password minimal 6 karakter!',
        confirmButtonColor: '#1d4ed8',
        width: '340px'
      });
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Password Tidak Cocok',
        text: 'Password dan Konfirmasi Password tidak cocok!',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
      return;
    }

    setIsCreatingAdmin(true);
    Swal.fire({
      title: 'Mendaftarkan Admin...',
      text: `Sedang memproses pendaftaran akun "${newAdminUsername.trim()}" ke Google Sheet...`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (onAddAdmin) {
        await onAddAdmin({
          username: newAdminUsername.trim(),
          password: newAdminPassword,
          status: newAdminStatus
        });
        
        Swal.fire({
          icon: 'success',
          iconColor: '#10b981',
          title: 'Admin Terdaftar',
          text: `Akun administrator "${newAdminUsername}" berhasil dibuat!`,
          confirmButtonColor: '#10b981',
          width: '340px'
        });

        // Reset form
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminConfirmPassword('');
        setNewAdminStatus('Biasa');
      } else {
        throw new Error('Metode pendaftaran admin tidak tersedia');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: 'Terjadi kesalahan saat menyimpan data admin baru.',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Handle Delete Admin with SweetAlert2 confirmation
  const handleDeleteAdminClick = async (username: string) => {
    if (username.toLowerCase().trim() === (loggedAdmin?.username || '').toLowerCase().trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Aksi Ditolak',
        text: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan!',
        confirmButtonColor: '#ef4444',
        width: '340px'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Administrator?',
      text: `Apakah Anda yakin ingin menghapus akun "${username}"? Akun ini tidak akan bisa login lagi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      width: '360px'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Menghapus Admin...',
        text: `Sedang memproses penghapusan akun "${username}" dari Google Sheet...`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        if (onDeleteAdmin) {
          await onDeleteAdmin(username);
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Dihapus',
            text: `Akun administrator "${username}" berhasil dihapus.`,
            confirmButtonColor: '#10b981',
            width: '340px'
          });
        } else {
          throw new Error('Metode penghapusan admin tidak tersedia');
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: 'Terjadi kesalahan saat menghapus data administrator.',
          confirmButtonColor: '#ef4444',
          width: '340px'
        });
      }
    }
  };

  // If not logged in, render beautiful login panel
  if (!isLoggedIn) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col justify-center px-4 max-w-md mx-auto" id="admin-login-screen">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto border-2 border-blue-400">
            <Lock className="w-8 h-8 text-blue-700" />
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-wide">LOGIN GURU</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Hanya Guru yang dapat masuk.</p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-admin-login"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-yellow-300" />
              MASUK
            </button>
          </form>

          <div className="bg-yellow-50 text-yellow-800 text-[10px] font-semibold border border-yellow-200/50 p-2.5 rounded-xl flex items-start gap-1.5 text-left">
            <ShieldAlert className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <span>Kredensial Login: Silakan gunakan data akun yang terdaftar pada tab/sheet <b>Admin</b> di Google Spreadsheet Anda.</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Layout with Responsive Layout & Top Tab Bar
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] w-full flex flex-col justify-start pb-12" id="admin-dashboard-screen">
      {/* Upper header banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white px-4 py-3.5 sm:px-5 sm:py-4 md:py-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 animate-fadeIn">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xs sm:text-sm md:text-base font-black tracking-wide uppercase leading-none font-montserrat">Portal Guru & Dashboard Admin</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <p className="text-[9px] sm:text-[11px] text-yellow-300 font-bold font-poppins">SMP PGRI Jatiuwung Tangerang</p>
              {loggedAdmin && (
                <>
                  <span className="text-slate-500 text-xs hidden sm:inline">|</span>
                  <div className="flex items-center gap-1 bg-blue-800/60 border border-blue-700/60 text-blue-100 px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold shadow-inner">
                    <User className="w-2.5 h-2.5 text-blue-300" />
                    <span>Aktif: <span className="text-white">{loggedAdmin.username}</span></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right block">
            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Status Database</span>
            {isLive ? (
              <span className="text-[11px] text-green-400 font-black flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Terhubung
              </span>
            ) : (
              <span className="text-[11px] text-rose-400 font-black flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                Tidak Terhubung
              </span>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-[10px] sm:text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1 border border-blue-600/50 shrink-0"
              title="Segarkan Sinkronisasi Data"
            >
              <RefreshCcw className="w-3 h-3 shrink-0" />
              <span>Segarkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6 py-4 md:py-5 flex flex-col gap-4">
        
        {/* Modern Tab Bar Selector */}
        <div className="bg-white rounded-lg p-0.5 sm:p-1 shadow-sm border border-slate-200/60 flex gap-0.5 w-full max-w-xl mx-auto">
          <button
            onClick={() => setActiveTab('eskul')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-md text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'eskul' 
                ? 'bg-blue-700 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kelola Ekstrakurikuler</span>
            <span className="sm:hidden">Kategori</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-md text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'laporan' 
                ? 'bg-blue-700 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laporan & Rekap Siswa</span>
            <span className="sm:hidden">Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-3 rounded-md text-[9px] sm:text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === 'pengaturan' 
                ? 'bg-blue-700 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Pengaturan</span>
            <span className="sm:hidden">Setelan</span>
          </button>
        </div>

        {/* ===================== TAB 1: JENIS EKSTRAKURIKULER ===================== */}
        {activeTab === 'eskul' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn" id="tab-eskul-management">
            
            {/* Form Add New (Left side - 1 col on lg) */}
            <form onSubmit={handleAddEskulSubmit} noValidate className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-4 lg:col-span-1">
              <h2 className="text-[11px] sm:text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-blue-700" />
                Tambah Ekstrakurikuler Baru
              </h2>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase tracking-wider">NAMA EKSTRAKURIKULER <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newEskulNama}
                  onChange={(e) => setNewEskulNama(e.target.value)}
                  placeholder="Contoh: English Club, Hadroh..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-200 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase tracking-wider">TAHUN PELAJARAN</label>
                <select
                  value={newEskulTahun}
                  onChange={(e) => setNewEskulTahun(e.target.value)}
                  disabled={!isLoggedAdminUtama}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-700 focus:bg-white transition-all duration-200 shadow-sm ${
                    !isLoggedAdminUtama ? 'opacity-70 cursor-not-allowed bg-slate-100' : 'cursor-pointer'
                  }`}
                >
                  {TAHUN_PELAJARAN_LIST.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {!isLoggedAdminUtama && (
                  <span className="text-[8px] font-bold text-slate-400 block mt-1 italic">
                    * Dikunci (hanya admin utama yang dapat merubah)
                  </span>
                )}
              </div>

              <div className="space-y-3.5 border border-slate-100 p-3 sm:p-4 bg-slate-50/50 rounded-2xl shadow-inner">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase tracking-wider">ROMBEL KELAS DIIZINKAN <span className="text-red-500">*</span></label>
                
                {/* Render elegant grade rows matching user's requested layout precisely */}
                {['7', '8', '9'].map(grade => {
                  const rombels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
                  const classNamesForGrade = rombels.map(r => resolveClassName(grade, r));
                  const isMasterChecked = classNamesForGrade.every(c => selectedClasses.includes(c));

                  const renderRombelCheckbox = (r: string) => {
                    const classNameVal = resolveClassName(grade, r);
                    const isChecked = selectedClasses.includes(classNameVal);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleToggleClass(classNameVal)}
                        className={`w-full py-1 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer select-none ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-black scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  };

                  return (
                    <div key={grade} className="flex items-start gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      {/* Left Part: Grade Label (Checkbox removed as requested, text acts as master toggle) */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-16 text-center border-r border-slate-100 pr-3 self-stretch my-auto">
                        <button
                          type="button"
                          onClick={() => handleToggleMaster(grade)}
                          className="text-[11px] font-black text-slate-700 hover:text-blue-700 hover:underline transition-all focus:outline-none cursor-pointer"
                          title={`Klik untuk pilih/hapus semua rombel Kelas ${grade}`}
                        >
                          Kelas {grade}
                        </button>
                      </div>
                      
                      {/* Right Part: Rombels in 3 columns */}
                      <div className="flex-1 grid grid-cols-3 gap-x-4 gap-y-1.5 pl-1">
                        {/* Column 1: A, B, C */}
                        <div className="space-y-1.5">
                          {['A', 'B', 'C'].map(r => renderRombelCheckbox(r))}
                        </div>
                        {/* Column 2: D, E, F */}
                        <div className="space-y-1.5">
                          {['D', 'E', 'F'].map(r => renderRombelCheckbox(r))}
                        </div>
                        {/* Column 3: G, H, I */}
                        <div className="space-y-1.5">
                          {['G', 'H', 'I'].map(r => renderRombelCheckbox(r))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Selected combination summary badge list */}
                {selectedClasses.length > 0 && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 mt-2 text-[10px] font-semibold text-blue-700 font-mono shadow-sm">
                    <span className="text-slate-400 font-bold uppercase text-[8px] block mb-1">Hasil Kriteria Kelas Diizinkan ({selectedClasses.length}):</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {selectedClasses.sort().map(c => (
                        <span key={c} className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-800 text-[9px]">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isAddingEskul}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-[11px] sm:text-xs font-bold py-2.5 sm:py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {isAddingEskul ? 'Menyimpan...' : 'Tambah Ekstrakurikuler'}
              </button>
            </form>

            {/* List Table of Eskuls (Right side - 2 cols on lg) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 lg:col-span-2">
              <h2 className="text-[10px] sm:text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5 mb-3.5">
                <Layers className="w-3.5 h-3.5 text-blue-700" />
                Daftar Kategori Ekstrakurikuler Aktif ({eskulList.length})
              </h2>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {eskulList.map(eskul => {
                  const numRegistered = students.filter(s => s.eskulId === eskul.id).length;
                  return (
                    <div key={eskul.id} className="flex items-center justify-between border border-slate-100 p-2.5 sm:p-3 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 font-montserrat truncate">{eskul.nama}</h4>
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 text-[8px] sm:text-[9px] font-bold">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Kelas: {eskul.kelasAllowed.join(', ')}</span>
                          <span className="bg-yellow-400/20 text-yellow-900 px-1.5 py-0.5 rounded font-mono">{eskul.tahunPelajaran}</span>
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{numRegistered} Siswa</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEskulClick(eskul.id, eskul.nama)}
                        className="text-red-500 hover:text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-50 hover:bg-red-600 transition-all cursor-pointer shadow-sm border border-red-100 shrink-0"
                        title="Hapus eskul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {eskulList.length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    Belum ada kategori eskul terdaftar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: LAPORAN PENDAFTAR ===================== */}
        {activeTab === 'laporan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start animate-fadeIn" id="tab-reports-list">
            
            {/* Filter & Quick Actions Panel (Left side - 1 col on lg) */}
            <div className="space-y-3.5 lg:col-span-1">
              
              {/* Quick Action Counters */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-blue-900 text-white rounded-xl p-3 shadow-md border border-blue-950 relative overflow-hidden">
                  <span className="text-[8px] sm:text-[9px] font-bold text-blue-300 uppercase block tracking-wider font-poppins">Total Siswa ({settings.tahunPelajaranAktif})</span>
                  <span className="text-xl sm:text-2xl font-black font-mono block mt-1">{students.filter(s => s.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                  <div className="absolute right-2 bottom-2 bg-white/10 p-1.5 rounded-lg text-yellow-300">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 relative overflow-hidden">
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-poppins">Kategori Eskul</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-800 block mt-1">{eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                  <div className="absolute right-2 bottom-2 bg-yellow-400/20 p-1.5 rounded-lg text-blue-800">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Print & Export buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handlePrintPDFRecap}
                  className="bg-red-700 hover:bg-red-800 text-white text-[10px] sm:text-xs font-bold py-2.5 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-red-800"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  Cetak PDF Rekap
                </button>

                <button
                  onClick={handlePrintPDFPerEskul}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-[10px] sm:text-xs font-bold py-2.5 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-blue-800"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  Cetak PDF Per-Eskul
                </button>
                
                <button
                  onClick={handleExportExcel}
                  className="bg-green-700 hover:bg-green-800 text-white text-[10px] sm:text-xs font-bold py-2.5 px-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-green-800"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  Ekspor Excel (XLSX)
                </button>
              </div>

              {/* Filter Form */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                <h2 className="text-[10px] sm:text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Filter className="w-3.5 h-3.5 text-blue-700" />
                  Saring Data Pendaftar
                </h2>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, no. registrasi, HP..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Ekstrakurikuler</span>
                    <select
                      value={filterEskul}
                      onChange={(e) => setFilterEskul(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-700 cursor-pointer"
                    >
                      <option value="">Semua Eskul</option>
                      {activeEskulsWithCounts.map(e => (
                        <option key={e.id} value={e.id}>{e.nama} ({e.count})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Tingkat Kelas</span>
                    <select
                      value={filterKelas}
                      onChange={(e) => setFilterKelas(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-700 cursor-pointer"
                    >
                      <option value="">Semua Kelas</option>
                      {classRegistrationStats.map(item => (
                        <option key={item.className} value={item.className}>Kelas {item.className} ({item.count})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Students List Display (Right side - 2 cols on lg) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 lg:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">Daftar Siswa Terdaftar</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Tahun Pelajaran: {settings.tahunPelajaranAktif}</p>
                </div>
                <span className="bg-blue-50 text-blue-800 font-extrabold px-2.5 py-1 rounded-lg font-mono text-[11px] self-start sm:self-auto border border-blue-100">
                  {filteredStudents.length} siswa ditemukan
                </span>
              </div>

              {/* Saringan Berdasarkan Rombel Kelas Terintegrasi */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Saring Berdasarkan Rombel Kelas:</span>
                <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setFilterKelas('')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${
                      filterKelas === ''
                        ? 'bg-blue-700 border-blue-700 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Semua Kelas ({students.filter(s => s.tahunPelajaran === settings.tahunPelajaranAktif).length})
                  </button>
                  {classRegistrationStats.map((item, idx) => {
                    const isSelected = filterKelas === item.className;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFilterKelas('');
                          } else {
                            setFilterKelas(item.className);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-700 border-blue-700 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>Kelas {item.className}</span>
                        <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                        }`}>
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                  {classRegistrationStats.length === 0 && (
                    <span className="text-[11px] text-slate-400 font-semibold italic">Tidak ada data kelas dari Eskul.</span>
                  )}
                </div>
              </div>

              <div className="overflow-auto rounded-xl border border-slate-100 max-h-[360px] custom-compact-scrollbar">
                <table className="w-full text-left border-collapse text-[8px]">
                  <thead>
                    <tr className="text-slate-400 font-medium uppercase tracking-wider border-b border-slate-100/40 text-[8px] sticky top-0 z-10">
                      <th className="py-1 px-2 text-center w-10 bg-white/60 backdrop-blur-sm">No</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">No. Registrasi</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Nama Lengkap</th>
                      <th className="py-1 px-1.5 text-center w-12 bg-white/60 backdrop-blur-sm">L/P</th>
                      <th className="py-1 px-2 text-center w-16 bg-white/60 backdrop-blur-sm">Kelas</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Eskul 1</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Eskul 2</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Eskul 3</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Email</th>
                      <th className="py-1 px-2 bg-white/60 backdrop-blur-sm">Kontak HP</th>
                      <th className="py-1 px-2 text-center w-20 bg-white/60 backdrop-blur-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 text-[8px]">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors h-7 text-[8px]">
                        <td className="py-1 px-2 text-center text-slate-400 font-mono text-[8px]">{idx + 1}</td>
                        <td className="py-1 px-2 font-mono text-blue-700 text-[8px]">
                          <span className="bg-blue-50/50 px-1 py-0.5 rounded text-[8px]">{s.regNo}</span>
                        </td>
                        <td className="py-1 px-2 font-montserrat font-medium text-slate-700 uppercase tracking-wide text-[8px] max-w-[150px] truncate" title={s.name}>
                          {s.name}
                        </td>
                        <td className="py-1 px-1.5 text-center text-[8px]">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                            s.jenisKelamin === 'Laki-laki' 
                              ? 'bg-blue-50/50 text-blue-700' 
                              : 'bg-pink-50/50 text-pink-700'
                          }`}>
                            {s.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-center text-[8px]">
                          <span className="bg-slate-100/70 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-medium">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-slate-800 text-[8px] max-w-[140px] truncate" title={s.eskulName}>
                          {s.eskulName}
                        </td>
                        <td className="py-1 px-2 text-[8px] max-w-[140px] truncate" title={s.eskulName2 || '-'}>
                          {s.eskulName2 ? (
                            <span className="text-slate-600">{s.eskulName2}</span>
                          ) : (
                            <span className="text-slate-400 italic font-medium text-[8px]">-</span>
                          )}
                        </td>
                        <td className="py-1 px-2 text-[8px] max-w-[140px] truncate" title={s.eskulName3 || '-'}>
                          {s.eskulName3 ? (
                            <span className="text-slate-600">{s.eskulName3}</span>
                          ) : (
                            <span className="text-slate-400 italic font-medium text-[8px]">-</span>
                          )}
                        </td>
                        <td className="py-1 px-2 text-[8px] max-w-[120px] truncate text-slate-600" title={s.email || '-'}>
                          {s.email || <span className="text-slate-400 italic font-medium text-[8px]">-</span>}
                        </td>
                        <td className="py-1 px-2 font-mono text-slate-600 text-[8px]">
                          {formatToIndoPhone(s.hpSiswa)}
                        </td>
                        <td className="py-1 px-2 text-center text-[8px]">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentDetail(s)}
                            className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-1.5 py-0.5 rounded transition-all text-[8px] font-medium cursor-pointer"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-16 text-slate-400 font-semibold bg-slate-50/50 text-[10px]">
                          Tidak ada pendaftar yang cocok dengan filter pencarian Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PENGATURAN & DATABASE ===================== */}
        {activeTab === 'pengaturan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 items-start animate-fadeIn" id="tab-app-settings">
              
              {/* Database Sync parameters (Left side - 2 cols on lg) */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSaveSettings} noValidate className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
                  <h2 className="text-[10px] sm:text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Settings className="w-4 h-4 text-blue-700" />
                    Konfigurasi Umum & Database API
                  </h2>
  
                  {/* Status Publikasi */}
                  <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-2">
                        <label className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-wider block">
                          Status Publikasi Form Pendaftaran
                        </label>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 leading-normal font-medium">
                          {isPublishedInput 
                            ? "Formulir pendaftaran saat ini AKTIF dan dapat diakses publik oleh siswa." 
                            : "Formulir pendaftaran saat ini DITUTUP. Siswa akan melihat informasi bahwa pendaftaran belum dibuka."}
                        </p>
                      </div>
                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          disabled={!isLoggedAdminUtama}
                          onClick={handleTogglePublication}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            !isLoggedAdminUtama ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } ${isPublishedInput ? 'bg-blue-700' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isPublishedInput ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    {!isLoggedAdminUtama && (
                      <p className="text-[8px] text-amber-600 font-extrabold mt-1 italic">
                        * Dikunci (hanya admin utama yang dapat merubah)
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-700 block uppercase tracking-wider">TAHUN PELAJARAN AKTIF</label>
                    <select
                      value={activeYearInput}
                      onChange={(e) => setActiveYearInput(e.target.value)}
                      disabled={!isLoggedAdminUtama}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {TAHUN_PELAJARAN_LIST.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 leading-normal">Mengatur tahun aktif pendaftaran untuk formulir publik secara instan.</p>
                    {!isLoggedAdminUtama && (
                      <p className="text-[8px] text-amber-600 font-extrabold mt-1 italic">
                        * Dikunci (hanya admin utama yang dapat merubah)
                      </p>
                    )}
                  </div>
  
                  {dbProviderInput === 'gas' ? (
                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-700 block uppercase tracking-wider">GOOGLE APPS SCRIPT WEB APP URL</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="url"
                            value={gasUrlInput}
                            onChange={(e) => setGasUrlInput(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono font-medium focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                          />
                        </div>
                        {gasUrlInput && (
                          <button
                            type="button"
                            onClick={async () => {
                              setGasUrlInput('');
                              if (onUpdateSettings) {
                                await onUpdateSettings({ googleAppsScriptUrl: '' });
                              }
                              Swal.fire({
                                icon: 'success',
                                title: 'URL Dihapus',
                                text: 'Google Apps Script URL berhasil dihapus. Status Database beralih ke Mode Simulasi Lokal (Tidak Terhubung).',
                                confirmButtonColor: '#ef4444',
                                width: '340px'
                              });
                            }}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                            title="Hapus URL"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Hapus URL</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">
                        Kosongkan kolom ini untuk menggunakan database simulasi lokal (`localStorage`). Isi dengan URL Deployment Apps Script Anda untuk menghubungkan data nyata di Google Spreadsheet.
                      </p>
                      
                      {gasUrlInput && gasUrlInput.trim().endsWith('/dev') && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] p-3 rounded-xl leading-relaxed mt-2 space-y-1">
                          <p className="font-bold text-amber-900 flex items-center gap-1">⚠️ Peringatan: URL Pengembangan (/dev) Terdeteksi</p>
                          <p>
                            URL yang berakhiran <b>/dev</b> tidak dapat menerima data dari luar karena Google membatasi aksesnya hanya untuk akun pemilik skrip. Aplikasi pendaftaran ini tidak akan bisa menyimpan data ke Spreadsheet Anda.
                          </p>
                          <p>
                            <b>Solusi:</b> Di Google Apps Script, lakukan <b>Deploy (Terapkan) &gt; New deployment (Terapkan baru)</b>. Pilih jenis <b>Web App</b>, ubah akses "Who has access" menjadi <b>Anyone (Siapa saja)</b>, klik Deploy, lalu salin URL yang berakhiran <b>/exec</b> ke kolom ini.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Supabase inputs */}
                      <div className="space-y-1">
                        <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-700 block uppercase tracking-wider">SUPABASE PROJECT URL</label>
                        <div className="relative">
                          <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={supabaseUrlInput}
                            onChange={(e) => setSupabaseUrlInput(e.target.value)}
                            placeholder="https://xyzabcdefg.supabase.co"
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono font-medium focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400">Dapatkan URL ini di dashboard Supabase proyek Anda -&gt; Project Settings -&gt; API.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] sm:text-[9px] font-extrabold text-slate-700 block uppercase tracking-wider">SUPABASE ANON / PUBLIC KEY</label>
                        <div className="relative">
                          <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="password"
                            value={supabaseAnonKeyInput}
                            onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono font-medium focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400">Dapatkan Anon Key (Public) ini di dashboard Supabase -&gt; Project Settings -&gt; API.</p>
                        
                        {supabaseAnonKeyInput && (supabaseAnonKeyInput.startsWith('postgresql://') || supabaseAnonKeyInput.startsWith('postgres://') || supabaseAnonKeyInput.includes('@db.')) && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] p-3 rounded-xl leading-relaxed mt-2 space-y-1">
                            <p className="font-bold text-rose-950 flex items-center gap-1">⚠️ Terdeteksi String Koneksi Database (PostgreSQL URI)!</p>
                            <p>
                              Kolom ini membutuhkan <b>Anon/Public API Key</b> (token JWT sangat panjang berawalan <b>eyJ...</b>). Anda keliru memasukkan Database Connection String (postgresql://...).
                            </p>
                            <p>
                              <b>Solusi:</b> Di dashboard Supabase Anda, buka <b>Project Settings &gt; API</b>. Cari bagian <b>Project API keys</b>, temukan kunci <b>anon public</b>, salin, lalu tempel di sini.
                            </p>
                          </div>
                        )}

                        {supabaseAnonKeyInput && supabaseAnonKeyInput.trim().startsWith('sb_publishable_') && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[10px] p-3 rounded-xl leading-relaxed mt-2 space-y-1">
                            <p className="font-bold text-rose-950 flex items-center gap-1">⚠️ Terdeteksi Kunci Publishable Baru (sb_publishable_...)!</p>
                            <p>
                              Kolom ini membutuhkan <b>Anon/Public API Key</b> standar yang merupakan token JWT panjang berawalan <b>eyJ...</b>. Kunci format <code>sb_publishable_...</code> hanya digunakan untuk Supabase Auth saja dan akan diblokir oleh API database utama (PostgREST) dengan galat <i>"Invalid API key"</i>.
                            </p>
                            <p>
                              <b>Solusi:</b> Di dashboard Supabase Anda, buka <b>Project Settings &gt; API</b>. Pada bagian <b>Project API keys</b>, temukan kunci berlabel <b>anon public</b> (biasanya berawalan <code>eyJ...</code>), salin, lalu tempel di sini.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Schema/Setup alert and script code */}
                      {isSupabaseSchemaIncomplete && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-[11px]">
                          <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                            ⚠️ Tabel Supabase Belum Terdeteksi atau Tidak Lengkap!
                          </p>
                          <p className="text-slate-700 leading-normal">
                            Supabase memerlukan struktur tabel tertentu agar aplikasi pendaftaran dapat berfungsi dengan normal. Silakan salin script SQL Setup di bawah ini, lalu jalankan di **SQL Editor** dashboard Supabase Anda:
                          </p>
                          
                          <div className="relative bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[9.5px] max-h-48 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                            {`-- Buat Tabel Pilihan Ekstrakurikuler
CREATE TABLE IF NOT EXISTS eskul (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  "kelasAllowed" TEXT[],
  "tahunPelajaran" TEXT NOT NULL
);

-- Buat Tabel Daftar Kelas
CREATE TABLE IF NOT EXISTS classes (
  name TEXT PRIMARY KEY
);

-- Buat Tabel Akun Administrator
CREATE TABLE IF NOT EXISTS admins (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  status TEXT NOT NULL,
  "namaLengkap" TEXT
);

-- Buat Tabel Pendaftar Siswa
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  "regNo" TEXT UNIQUE NOT NULL,
  name TEXT,
  nama TEXT,
  photo TEXT,
  kelas TEXT,
  "jenisKelamin" TEXT,
  "namaAyah" TEXT,
  "namaIbu" TEXT,
  "hpSiswa" TEXT,
  "hpOrtu" TEXT,
  email TEXT,
  "tempatLahir" TEXT,
  "tanggalLahir" TEXT,
  "prestasiChecked" BOOLEAN DEFAULT false,
  "namaLomba" TEXT,
  "cabangLomba" TEXT,
  "tingkatLomba" TEXT,
  "juaraKe" TEXT,
  "penyelenggara" TEXT,
  "certificateFile" TEXT,
  "certificateFileName" TEXT,
  alamat TEXT,
  rt TEXT,
  rw TEXT,
  "provinsiId" TEXT,
  "provinsiName" TEXT,
  "kabupatenId" TEXT,
  "kabupatenName" TEXT,
  "kecamatanId" TEXT,
  "kecamatanName" TEXT,
  "kelurahanId" TEXT,
  "kelurahanName" TEXT,
  "eskulId" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName" TEXT,
  "eskulId2" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName2" TEXT,
  "eskulId3" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName3" TEXT,
  nisn TEXT,
  "noWa" TEXT,
  alasan TEXT,
  "tahunPelajaran" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aktifkan Row Level Security (RLS) atau Bypass untuk API Pendaftaran
ALTER TABLE eskul ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Izinkan Semua Akses Anonim (agar form pendaftaran sekolah bekerja tanpa login siswa)
DROP POLICY IF EXISTS "Allow public select eskul" ON eskul;
CREATE POLICY "Allow public select eskul" ON eskul FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select classes" ON classes;
CREATE POLICY "Allow public select classes" ON classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select admins" ON admins;
CREATE POLICY "Allow public select admins" ON admins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select students" ON students;
CREATE POLICY "Allow public select students" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert eskul" ON eskul;
CREATE POLICY "Allow public insert eskul" ON eskul FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert classes" ON classes;
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert admins" ON admins;
CREATE POLICY "Allow public insert admins" ON admins FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert students" ON students;
CREATE POLICY "Allow public insert students" ON students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update eskul" ON eskul;
CREATE POLICY "Allow public update eskul" ON eskul FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update classes" ON classes;
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update admins" ON admins;
CREATE POLICY "Allow public update admins" ON admins FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update students" ON students;
CREATE POLICY "Allow public update students" ON students FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete eskul" ON eskul;
CREATE POLICY "Allow public delete eskul" ON eskul FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete classes" ON classes;
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete admins" ON admins;
CREATE POLICY "Allow public delete admins" ON admins FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete students" ON students;
CREATE POLICY "Allow public delete students" ON students FOR DELETE USING (true);`}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const sqlText = `-- Buat Tabel Pilihan Ekstrakurikuler
CREATE TABLE IF NOT EXISTS eskul (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  "kelasAllowed" TEXT[],
  "tahunPelajaran" TEXT NOT NULL
);

-- Buat Tabel Daftar Kelas
CREATE TABLE IF NOT EXISTS classes (
  name TEXT PRIMARY KEY
);

-- Buat Tabel Akun Administrator
CREATE TABLE IF NOT EXISTS admins (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  status TEXT NOT NULL,
  "namaLengkap" TEXT
);

-- Buat Tabel Pendaftar Siswa
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  "regNo" TEXT UNIQUE NOT NULL,
  name TEXT,
  nama TEXT,
  photo TEXT,
  kelas TEXT,
  "jenisKelamin" TEXT,
  "namaAyah" TEXT,
  "namaIbu" TEXT,
  "hpSiswa" TEXT,
  "hpOrtu" TEXT,
  email TEXT,
  "tempatLahir" TEXT,
  "tanggalLahir" TEXT,
  "prestasiChecked" BOOLEAN DEFAULT false,
  "namaLomba" TEXT,
  "cabangLomba" TEXT,
  "tingkatLomba" TEXT,
  "juaraKe" TEXT,
  "penyelenggara" TEXT,
  "certificateFile" TEXT,
  "certificateFileName" TEXT,
  alamat TEXT,
  rt TEXT,
  rw TEXT,
  "provinsiId" TEXT,
  "provinsiName" TEXT,
  "kabupatenId" TEXT,
  "kabupatenName" TEXT,
  "kecamatanId" TEXT,
  "kecamatanName" TEXT,
  "kelurahanId" TEXT,
  "kelurahanName" TEXT,
  "eskulId" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName" TEXT,
  "eskulId2" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName2" TEXT,
  "eskulId3" TEXT REFERENCES eskul(id) ON DELETE SET NULL,
  "eskulName3" TEXT,
  nisn TEXT,
  "noWa" TEXT,
  alasan TEXT,
  "tahunPelajaran" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Aktifkan Row Level Security (RLS) atau Bypass untuk API Pendaftaran
ALTER TABLE eskul ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Izinkan Semua Akses Anonim (agar form pendaftaran sekolah bekerja tanpa login siswa)
DROP POLICY IF EXISTS "Allow public select eskul" ON eskul;
CREATE POLICY "Allow public select eskul" ON eskul FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select classes" ON classes;
CREATE POLICY "Allow public select classes" ON classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select admins" ON admins;
CREATE POLICY "Allow public select admins" ON admins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public select students" ON students;
CREATE POLICY "Allow public select students" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert eskul" ON eskul;
CREATE POLICY "Allow public insert eskul" ON eskul FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert classes" ON classes;
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert admins" ON admins;
CREATE POLICY "Allow public insert admins" ON admins FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public insert students" ON students;
CREATE POLICY "Allow public insert students" ON students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update eskul" ON eskul;
CREATE POLICY "Allow public update eskul" ON eskul FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update classes" ON classes;
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update admins" ON admins;
CREATE POLICY "Allow public update admins" ON admins FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public update students" ON students;
CREATE POLICY "Allow public update students" ON students FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete eskul" ON eskul;
CREATE POLICY "Allow public delete eskul" ON eskul FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete classes" ON classes;
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete admins" ON admins;
CREATE POLICY "Allow public delete admins" ON admins FOR DELETE USING (true);
DROP POLICY IF EXISTS "Allow public delete students" ON students;
CREATE POLICY "Allow public delete students" ON students FOR DELETE USING (true);`;
                              navigator.clipboard.writeText(sqlText);
                              Swal.fire({
                                icon: 'success',
                                title: 'Disalin!',
                                text: 'Script SQL berhasil disalin ke clipboard.',
                                timer: 1000,
                                showConfirmButton: false,
                                width: '300px'
                              });
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            📋 Salin Script SQL Setup
                          </button>
                        </div>
                      )}

                      {/* Migration launcher panel */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Sinkronisasi & Migrasi ke Supabase</p>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Gunakan tombol di bawah untuk mentransfer seluruh data lokal (Siswa, Pilihan Eskul, Daftar Kelas, Akun Administrator) ke dalam database Supabase Anda.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isMigrating}
                          onClick={handleMigrateToSupabase}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isMigrating ? 'Sedang Memigrasi...' : '🚀 Mulai Migrasi Seluruh Data ke Supabase'}
                        </button>
                      </div>
                    </div>
                  )}
  
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </form>
              </div>
  
              {/* Reset Database Actions (Right side - 1 col on lg) */}
              <div className="lg:col-span-1">
                {!isLoggedAdminUtama ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3 min-h-[220px] flex flex-col justify-center items-center">
                    <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
                    <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Zona Bahaya Terkunci</h2>
                    <p className="text-[10px] text-slate-500 leading-relaxed max-w-[200px]">
                      Fitur penghapusan atau reset database hanya dapat diakses oleh Admin Utama.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-2 border-b border-red-200/50 pb-3">
                      <ShieldAlert className="w-5 h-5 text-red-700" />
                      Zona Bahaya
                    </h2>
                    <p className="text-[10px] text-red-700 leading-relaxed">
                      Tindakan ini bersifat destruktif dan permanen. Pastikan Anda telah mengekspor rekap Excel terlebih dahulu sebelum melakukan penghapusan data.
                    </p>
    
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleResetEskulClick}
                        className="w-full bg-white hover:bg-yellow-50 text-yellow-800 hover:text-yellow-900 border border-yellow-300 hover:border-yellow-400 text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCcw className="w-4 h-4 text-yellow-700" />
                        Reset Per Ekstrakurikuler
                      </button>
    
                      <button
                        onClick={handleResetAllDataClick}
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-white animate-pulse" />
                        Reset Seluruh Database Pendaftar
                      </button>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Form Tambah Admin Baru (Aesthetic and Professional) */}
              {!isLoggedAdminUtama ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2 lg:col-span-2 flex flex-col justify-center items-center">
                  <UserPlus className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                  <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Registrasi Admin Terkunci</h2>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    Pendaftaran administrator baru hanya dapat dilakukan oleh akun dengan status Admin Utama.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 lg:col-span-2">
                  <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserPlus className="w-5 h-5 text-blue-700" />
                    Tambah Administrator Baru
                  </h2>
                  <form onSubmit={handleCreateAdminSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Username / Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                          Nama Lengkap (Username) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={newAdminUsername}
                            onChange={(e) => setNewAdminUsername(e.target.value)}
                            placeholder="Contoh: Ahmad Subardjo"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all"
                          />
                        </div>
                      </div>
     
                      {/* Status / Role Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                          Status Admin <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select
                            required
                            value={newAdminStatus}
                            onChange={(e) => setNewAdminStatus(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 appearance-none cursor-pointer transition-all"
                          >
                            <option value="Biasa">Biasa</option>
                            <option value="Utama">Utama</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            required
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          >
                            {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
     
                      {/* Password Confirmation */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">
                          Konfirmasi Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showAdminConfirmPassword ? "text" : "password"}
                            required
                            value={newAdminConfirmPassword}
                            onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                            placeholder="Ulangi password"
                            className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          >
                            {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
     
                    </div>
     
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isCreatingAdmin}
                        className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isCreatingAdmin ? 'Mendaftarkan...' : 'Daftarkan Admin Baru'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
  
              {/* Daftar Admin Aktif */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-3 lg:col-span-1">
                <h2 className="text-[10px] sm:text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Shield className="w-4 h-4 text-blue-700" />
                  Administrator Terdaftar ({admins ? admins.length : 0})
                </h2>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {(admins || []).map((adm: any, idx: number) => {
                    const isAdminUtama = adm.status && adm.status.toLowerCase().includes('utama');
                    const roleText = isAdminUtama ? 'Utama' : (adm.status || 'Biasa');
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 gap-2 animate-fadeIn">
                        <div className="min-w-0 flex items-center gap-1.5">
                          <div className="w-6.5 h-6.5 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0">
                            {adm.username ? adm.username.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate leading-none">{adm.username}</p>
                            <p className="text-[8px] text-slate-400 font-extrabold uppercase mt-0.5">Akses: {roleText}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] bg-green-50 text-green-700 border border-green-200/30 px-1.5 py-0.5 rounded-full font-bold">Aktif</span>
                          {!isAdminUtama && isLoggedAdminUtama && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdminClick(adm.username)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus Administrator"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
  
              {/* Panduan Integrasi Backend & Spreadsheet */}
              {isLoggedAdminUtama && (
                <div className="lg:col-span-3 mt-6">
                  <ApiSetupGuide />
                </div>
              )}
  
            </div>
        )}

      </div>

      {/* Detail Siswa Modal (No Photo) */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-scaleIn">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-900 text-white rounded-t-3xl">
              <div>
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">{selectedStudentDetail.regNo}</span>
                <h3 className="text-base font-black uppercase mt-1.5 font-montserrat tracking-wide">{selectedStudentDetail.name}</h3>
                <p className="text-[10px] text-blue-200 font-semibold mt-0.5">Daftar Ekstrakurikuler: {selectedStudentDetail.tahunPelajaran}</p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Photo & Core Info Row */}
              <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-slate-100 pb-5">
                {selectedStudentDetail.photo ? (
                  <div className="shrink-0 bg-slate-50 p-1 rounded-xl shadow-sm border border-slate-200">
                    <img
                      src={selectedStudentDetail.photo}
                      alt={selectedStudentDetail.name}
                      referrerPolicy="no-referrer"
                      className="w-24 h-32 object-cover rounded-lg shadow-inner border border-slate-100 bg-white"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 w-24 h-32 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-dashed border-slate-300 text-slate-400">
                    <User className="w-8 h-8 text-slate-300" />
                    <span className="text-[9px] font-bold mt-1 text-center uppercase text-slate-400">KOSONG</span>
                  </div>
                )}
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Kelas Siswa</span>
                    <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg inline-block">Kelas {selectedStudentDetail.kelas}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg inline-block">{selectedStudentDetail.jenisKelamin}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Tempat, Tgl Lahir</span>
                    <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg inline-block">
                      {selectedStudentDetail.tempatLahir || '-'}, {(() => {
                        if (!selectedStudentDetail.tanggalLahir) return '-';
                        try {
                          const d = parseDateSafely(selectedStudentDetail.tanggalLahir);
                          if (isNaN(d.getTime())) return selectedStudentDetail.tanggalLahir;
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        } catch {
                          return selectedStudentDetail.tanggalLahir;
                        }
                      })()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Tanggal Daftar</span>
                    <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg inline-block">
                      {(() => {
                        if (!selectedStudentDetail.createdAt) return '-';
                        try {
                          const d = parseDateSafely(selectedStudentDetail.createdAt);
                          if (isNaN(d.getTime())) return selectedStudentDetail.createdAt;
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        } catch {
                          return selectedStudentDetail.createdAt;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eskul Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-blue-900 block uppercase tracking-wider">Ekstrakurikuler Pilihan 1</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedStudentDetail.eskulName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-blue-900 block uppercase tracking-wider">Ekstrakurikuler Pilihan 2</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedStudentDetail.eskulName2 || <span className="text-slate-400 italic font-medium">Tidak memilih</span>}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-blue-900 block uppercase tracking-wider">Ekstrakurikuler Pilihan 3</span>
                  <span className="font-extrabold text-slate-800 text-sm">{selectedStudentDetail.eskulName3 || <span className="text-slate-400 italic font-medium">Tidak memilih</span>}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3.5">
                <h4 className="font-black text-blue-950 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-[10px]">
                  Informasi Kontak Siswa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">No. HP (WhatsApp)</span>
                    <span className="font-bold text-slate-800 font-mono text-xs">{formatToIndoPhone(selectedStudentDetail.hpSiswa)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Email</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">{selectedStudentDetail.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Parents Info */}
              <div className="space-y-3.5">
                <h4 className="font-black text-blue-950 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-[10px]">
                  Data Orang Tua / Wali
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Nama Ayah</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedStudentDetail.namaAyah}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Nama Ibu</span>
                    <span className="font-bold text-slate-800 text-xs">{selectedStudentDetail.namaIbu}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">No. HP Orang Tua</span>
                    <span className="font-bold text-slate-800 font-mono text-xs">{formatToIndoPhone(selectedStudentDetail.hpOrtu)}</span>
                  </div>
                </div>
              </div>

              {/* Jalur Prestasi */}
              {selectedStudentDetail.prestasiChecked && (
                <div className="bg-amber-50/50 p-4 border border-amber-200/70 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-amber-800 block uppercase tracking-wider">★ JALUR PRESTASI KHUSUS</span>
                      <p className="font-extrabold text-xs text-slate-800">{selectedStudentDetail.namaLomba} ({selectedStudentDetail.cabangLomba})</p>
                      <p className="text-[10px] font-semibold text-slate-600">Tingkat {selectedStudentDetail.tingkatLomba} | Juara {selectedStudentDetail.juaraKe} | Penyelenggara: {selectedStudentDetail.penyelenggara}</p>
                    </div>
                    {selectedStudentDetail.certificateFile && (
                      <a
                        href={selectedStudentDetail.certificateFile}
                        download={selectedStudentDetail.certificateFileName || `sertifikat_${selectedStudentDetail.name}`}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-center cursor-pointer border border-blue-800"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="w-4 h-4 text-white" />
                        Unduh Sertifikat
                      </a>
                    )}
                  </div>

                  {/* Attachment Preview (Request #3) */}
                  {selectedStudentDetail.certificateFile && (
                    <div className="border-t border-amber-200/50 pt-3 space-y-1.5">
                      <span className="text-[8px] font-extrabold text-amber-800 uppercase tracking-wider block">Lampiran Sertifikat Juara:</span>
                      {selectedStudentDetail.certificateFile.startsWith('data:image/') ? (
                        <div className="max-w-md mx-auto bg-white p-1 rounded-xl shadow-inner border border-amber-100/60">
                          <img
                            src={selectedStudentDetail.certificateFile}
                            alt="Sertifikat Juara"
                            referrerPolicy="no-referrer"
                            className="max-h-60 w-auto object-contain rounded-lg mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-amber-100/60 flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center border border-rose-100">
                              <FileText className="w-4 h-4 text-rose-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate max-w-xs">{selectedStudentDetail.certificateFileName || 'Sertifikat_Juara.pdf'}</p>
                              <p className="text-[8px] font-semibold text-rose-500 uppercase">Dokumen PDF</p>
                            </div>
                          </div>
                          <a
                            href={selectedStudentDetail.certificateFile}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg border border-blue-100 transition-all cursor-pointer text-center"
                          >
                            Buka / Lihat PDF
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Address */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Alamat Tinggal Lengkap</span>
                <p className="font-semibold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedStudentDetail.alamat}, RT {selectedStudentDetail.rt}/RW {selectedStudentDetail.rw}, Kelurahan {selectedStudentDetail.kelurahanName}, Kecamatan {selectedStudentDetail.kecamatanName}, Kabupaten/Kota {selectedStudentDetail.kabupatenName}, Provinsi {selectedStudentDetail.provinsiName}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
