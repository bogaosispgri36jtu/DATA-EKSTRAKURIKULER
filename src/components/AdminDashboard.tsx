/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, LayoutDashboard, FileText, Settings, Plus, Trash2, 
  Download, Printer, Search, Filter, ShieldAlert, CheckCircle2,
  RefreshCcw, Eye, EyeOff, ArrowUpDown, Layers, Database, UserCheck, LogOut
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { Student, Extracurricular, AppSettings } from '../types';
import { TAHUN_PELAJARAN_LIST } from '../data';

interface AdminDashboardProps {
  students: Student[];
  eskulList: Extracurricular[];
  settings: AppSettings;
  onAddEskul: (nama: string, kelasAllowed: string[], tahunPelajaran: string) => Promise<void>;
  onDeleteEskul: (id: string) => Promise<void>;
  onResetEskulStudents: (eskulId: string) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  isLive?: boolean;
  onRefresh?: () => Promise<void> | void;
  classList?: string[];
}

export default function AdminDashboard({
  students,
  eskulList,
  settings,
  onAddEskul,
  onDeleteEskul,
  onResetEskulStudents,
  onResetAllData,
  onUpdateSettings,
  isLoggedIn,
  setIsLoggedIn,
  isLive = false,
  onRefresh,
  classList = []
}: AdminDashboardProps) {
  const [logoImgElement, setLogoImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://lh3.googleusercontent.com/d/1Jfb6nl1FHxlA3tL8qNNrgyPrc1ob2SfT';
    img.onload = () => {
      setLogoImgElement(img);
    };
  }, []);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'eskul' | 'laporan' | 'pengaturan'>('laporan');

  // New Eskul State
  const [newEskulNama, setNewEskulNama] = useState('');
  const [newEskulKelas, setNewEskulKelas] = useState('VII, VIII, IX');
  const [newEskulTahun, setNewEskulTahun] = useState(settings.tahunPelajaranAktif);
  const [isAddingEskul, setIsAddingEskul] = useState(false);

  // Laporan Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEskul, setFilterEskul] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Settings State
  const [gasUrlInput, setGasUrlInput] = useState(settings.googleAppsScriptUrl);
  const [activeYearInput, setActiveYearInput] = useState(settings.tahunPelajaranAktif);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
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

    if (username === settings.adminUsername && password === settings.adminPassword) {
      setIsLoggedIn(true);
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
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Username atau password salah!',
        confirmButtonColor: '#ef4444',
        width: '340px',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
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

    const classesArray = newEskulKelas.split(',')
      .map(k => k.trim())
      .filter(k => k !== '');

    if (classesArray.length === 0) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Kelas Wajib Diisi', 
        text: 'Masukkan minimal satu kelas (misal: 7.A atau VII).',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
      return;
    }

    setIsAddingEskul(true);
    try {
      await onAddEskul(newEskulNama, classesArray, newEskulTahun);
      setNewEskulNama('');
      setNewEskulKelas('VII, VIII, IX');
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

  // Filter students based on query
  const filteredStudents = students.filter(student => {
    const matchSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.hpSiswa.includes(searchQuery);
    
    const matchEskul = filterEskul ? student.eskulId === filterEskul : true;
    const matchKelas = filterKelas ? student.kelas === filterKelas : true;

    return matchSearch && matchEskul && matchKelas;
  });

  // Export reports to Excel/CSV format
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data siswa untuk diekspor.', width: '340px' });
      return;
    }

    // Prepare CSV headers
    const headers = [
      'No. Registrasi', 'Tahun Pelajaran', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Email Siswa',
      'Ekstrakurikuler 1', 'Ekstrakurikuler 2', 'Nama Ayah', 'Nama Ibu', 'No. HP Siswa', 'No. HP Orang Tua',
      'Memiliki Prestasi', 'Nama Lomba', 'Cabang Lomba', 'Tingkat Lomba', 'Juara Ke', 'Penyelenggara',
      'Alamat', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kota/Kabupaten', 'Provinsi', 'Tanggal Daftar'
    ];

    const rows = filteredStudents.map(s => [
      s.regNo,
      s.tahunPelajaran,
      s.name,
      s.kelas,
      s.jenisKelamin,
      s.email || '',
      s.eskulName,
      s.eskulName2 || '',
      s.namaAyah,
      s.namaIbu,
      s.hpSiswa,
      s.hpOrtu,
      s.prestasiChecked ? 'Ya' : 'Tidak',
      s.namaLomba || '',
      s.cabangLomba || '',
      s.tingkatLomba || '',
      s.juaraKe || '',
      s.penyelenggara || '',
      s.alamat,
      s.rt,
      s.rw,
      s.kelurahanName,
      s.kecamatanName,
      s.kabupatenName,
      s.provinsiName,
      new Date(s.createdAt).toLocaleString('id-ID')
    ]);

    // Construct CSV content (add BOM for proper Excel encoding of special characters)
    let csvContent = '\ufeff' + headers.join(',') + '\n';
    rows.forEach(row => {
      const formattedRow = row.map(val => {
        // Escape quotes and wrap in quotes
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvContent += formattedRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LAPORAN_ESKUL_SMP_PGRI_JU_${settings.tahunPelajaranAktif.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Ekspor Berhasil',
      text: 'File laporan berformat CSV (Excel) telah terunduh.',
      confirmButtonColor: '#1d4ed8',
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
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Rekapitulasi PDF telah terunduh.', width: '340px' });
    } catch (e) {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Gagal cetak PDF', width: '340px' });
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
        googleAppsScriptUrl: targetUrl,
        tahunPelajaranAktif: activeYearInput
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
            <span>Kredensial Default: Gunakan <b>admin</b> dan sandi <b>admin123</b> (Sandi tersinkronisasi aman dengan Apps Script).</span>
          </div>
        </div>
      </div>
    );
  }

  // Render Admin Layout with Responsive Layout & Top Tab Bar
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] w-full flex flex-col justify-start pb-12" id="admin-dashboard-screen">
      {/* Upper header banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white px-4 py-5 sm:px-6 sm:py-6 md:py-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide uppercase leading-none font-montserrat">Portal Guru & Dashboard Admin</h1>
            <p className="text-[10px] sm:text-xs text-yellow-300 font-bold mt-1.5 font-poppins">SMP PGRI Jatiuwung Tangerang</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right block">
            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Status Database</span>
            {isLive ? (
              <span className="text-xs text-green-400 font-black flex items-center gap-1.5 mt-1 leading-none">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                Sheets Aktif (Live)
              </span>
            ) : settings.googleAppsScriptUrl ? (
              <span className="text-xs text-rose-400 font-black flex items-center gap-1.5 mt-1 leading-none" title="Gagal terhubung ke Google Sheets API. Pastikan deploy sebagai Web App (Anyone) & tidak memakai URL /dev">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                Sheets Gagal (Lokal)
              </span>
            ) : (
              <span className="text-xs text-amber-400 font-black flex items-center gap-1.5 mt-1 leading-none">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                Simulasi Lokal
              </span>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-[11px] sm:text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 border border-blue-600/50 shrink-0"
              title="Segarkan Sinkronisasi Data"
            >
              <RefreshCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Segarkan Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Modern Tab Bar Selector */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-sm border border-slate-200/60 flex gap-1 w-full max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('eskul')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'eskul' 
                ? 'bg-blue-700 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Kelola Ekstrakurikuler</span>
            <span className="sm:hidden">Kategori</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'laporan' 
                ? 'bg-blue-700 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Laporan & Rekap Siswa</span>
            <span className="sm:hidden">Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pengaturan' 
                ? 'bg-blue-700 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Pengaturan Database</span>
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
                  className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase tracking-wider">TAHUN PELAJARAN</label>
                  <select
                    value={newEskulTahun}
                    onChange={(e) => setNewEskulTahun(e.target.value)}
                    className="w-full px-2.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-700 cursor-pointer"
                  >
                    {TAHUN_PELAJARAN_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase tracking-wider">ROMBEL KELAS DIIZINKAN <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newEskulKelas}
                    onChange={(e) => setNewEskulKelas(e.target.value)}
                    placeholder="Contoh: 7.A, 8.A, 9.A"
                    className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-mono"
                    required
                  />
                  <p className="text-[8px] sm:text-[9px] text-slate-400 font-medium leading-none">Pisahkan dengan koma.</p>
                </div>
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
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:col-span-2">
              <h2 className="text-[11px] sm:text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Layers className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-blue-700" />
                Daftar Kategori Ekstrakurikuler Aktif ({eskulList.length})
              </h2>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {eskulList.map(eskul => {
                  const numRegistered = students.filter(s => s.eskulId === eskul.id).length;
                  return (
                    <div key={eskul.id} className="flex items-center justify-between border border-slate-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-slate-50 hover:shadow-sm transition-all gap-2">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn" id="tab-reports-list">
            
            {/* Filter & Quick Actions Panel (Left side - 1 col on lg) */}
            <div className="space-y-4 lg:col-span-1">
              
              {/* Quick Action Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-900 text-white rounded-2xl p-4 shadow-md border border-blue-950 relative overflow-hidden">
                  <span className="text-[9px] font-bold text-blue-300 uppercase block tracking-wider font-poppins">Total Siswa ({settings.tahunPelajaranAktif})</span>
                  <span className="text-3xl font-black font-mono block mt-1.5">{students.filter(s => s.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                  <div className="absolute right-3 bottom-3 bg-white/10 p-2 rounded-xl text-yellow-300">
                    <UserCheck className="w-5.5 h-5.5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider font-poppins">Kategori Eskul</span>
                  <span className="text-3xl font-black font-mono text-slate-800 block mt-1.5">{eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                  <div className="absolute right-3 bottom-3 bg-yellow-400/20 p-2 rounded-xl text-blue-800">
                    <Layers className="w-5.5 h-5.5" />
                  </div>
                </div>
              </div>

              {/* Print & Export buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePrintPDFRecap}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-3 px-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border border-red-800"
                >
                  <Printer className="w-4 h-4 text-white animate-pulse" />
                  Cetak PDF Rekap
                </button>
                
                <button
                  onClick={handleExportExcel}
                  className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-3 px-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border border-green-800"
                >
                  <Download className="w-4 h-4 text-white" />
                  Ekspor Excel (CSV)
                </button>
              </div>

              {/* Filter Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
                <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Filter className="w-4 h-4 text-blue-700" />
                  Saring Data Pendaftar
                </h2>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, no. registrasi, HP..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Ekstrakurikuler</span>
                    <select
                      value={filterEskul}
                      onChange={(e) => setFilterEskul(e.target.value)}
                      className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-700 cursor-pointer"
                    >
                      <option value="">Semua Eskul</option>
                      {eskulList.map(e => (
                        <option key={e.id} value={e.id}>{e.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Tingkat Kelas</span>
                    <select
                      value={filterKelas}
                      onChange={(e) => setFilterKelas(e.target.value)}
                      className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-700 cursor-pointer"
                    >
                      <option value="">Semua Kelas</option>
                      {finalKelasList.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Students List Display (Right side - 2 cols on lg) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-3">
                <span className="font-montserrat">Daftar Siswa Terdaftar</span>
                <span className="bg-blue-50 text-blue-800 font-black px-2.5 py-1 rounded-lg font-mono">{filteredStudents.length} baris data ditemukan</span>
              </div>

              <div className="space-y-3 max-h-[600px] lg:max-h-[700px] overflow-y-auto pr-1">
                {filteredStudents.map((s, idx) => {
                  const isExpanded = expandedStudentId === s.id;
                  return (
                    <div key={s.id} className="border border-slate-100 rounded-2xl p-4 hover:bg-slate-50/70 hover:shadow-sm transition-all space-y-3">
                      <div className="flex items-center gap-4">
                        {s.photo ? (
                          <img src={s.photo} alt="Student" className="w-12 h-14 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0" />
                        ) : (
                          <div className="w-12 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">?</div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">{s.regNo}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{new Date(s.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 truncate mt-1 font-montserrat">{s.name.toUpperCase()}</h4>
                          <div className="flex gap-2 text-xs text-slate-500 font-semibold mt-1">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[10px]">Kelas {s.kelas}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-blue-900 font-bold text-[11px] mt-0.5">
                              {s.eskulName}{s.eskulName2 ? ` & ${s.eskulName2}` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedStudentId(isExpanded ? null : s.id)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                            isExpanded ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-3 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200/50 pb-3">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Jenis Kelamin</span>
                              <span className="font-bold text-slate-800 text-xs">{s.jenisKelamin}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Email Siswa</span>
                              <span className="font-bold text-slate-800 text-xs">{s.email || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">No. HP Siswa (WhatsApp)</span>
                              <span className="font-bold text-slate-800 font-mono text-xs">{s.hpSiswa}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200/50 pb-3">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Nama Orang Tua (Ayah / Ibu)</span>
                              <span className="font-bold text-slate-800 text-xs">{s.namaAyah} / {s.namaIbu}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">No. HP Orang Tua (WhatsApp)</span>
                              <span className="font-bold text-slate-800 font-mono text-xs">{s.hpOrtu}</span>
                            </div>
                          </div>

                          {s.prestasiChecked && (
                            <div className="bg-yellow-50/50 p-3 border border-yellow-200/70 rounded-xl text-yellow-900">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                  <span className="text-[9px] font-black text-yellow-800 block uppercase tracking-wider">★ JALUR PRESTASI KHUSUS</span>
                                  <p className="mt-1 font-extrabold text-xs text-slate-800">{s.namaLomba} ({s.cabangLomba})</p>
                                  <p className="text-[10px] font-semibold text-slate-600 mt-0.5">Tingkat {s.tingkatLomba} | Juara {s.juaraKe} | Penyelenggara: {s.penyelenggara}</p>
                                </div>
                                {s.certificateFile && (
                                  <a
                                    href={s.certificateFile}
                                    download={s.certificateFileName || `sertifikat_${s.name}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] sm:text-xs rounded-lg shadow-sm transition-all duration-300 self-start sm:self-center cursor-pointer"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Unduh Sertifikat
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Alamat Lengkap Tempat Tinggal</span>
                            <span className="font-semibold text-slate-800 leading-relaxed block mt-0.5 bg-white p-2.5 rounded-lg border border-slate-200/40">
                              {s.alamat}, RT {s.rt}/RW {s.rw}, Kelurahan {s.kelurahanName}, Kecamatan {s.kecamatanName}, Kabupaten/Kota {s.kabupatenName}, Provinsi {s.provinsiName}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="text-center py-16 text-xs text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    Tidak ada pendaftar yang cocok dengan filter pencarian Anda.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PENGATURAN & DATABASE ===================== */}
        {activeTab === 'pengaturan' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn" id="tab-app-settings">
            
            {/* Database Sync parameters (Left side - 2 cols on lg) */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSaveSettings} noValidate className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
                <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Settings className="w-4.5 h-4.5 text-blue-700" />
                  Konfigurasi Umum & Database API
                </h2>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">TAHUN PELAJARAN AKTIF</label>
                  <select
                    value={activeYearInput}
                    onChange={(e) => setActiveYearInput(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-700 cursor-pointer"
                  >
                    {TAHUN_PELAJARAN_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400 leading-normal">Mengatur tahun aktif pendaftaran untuk formulir publik secara instan.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider">GOOGLE APPS SCRIPT WEB APP URL</label>
                  <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      value={gasUrlInput}
                      onChange={(e) => setGasUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                    />
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
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
