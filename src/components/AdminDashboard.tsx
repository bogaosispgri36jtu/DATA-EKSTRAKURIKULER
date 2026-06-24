/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Lock, LayoutDashboard, FileText, Settings, Plus, Trash2, 
  Download, Printer, Search, Filter, ShieldAlert, CheckCircle2,
  RefreshCcw, Eye, ArrowUpDown, Layers, Database, UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { Student, Extracurricular, AppSettings } from '../types';
import { TAHUN_PELAJARAN_LIST, KELAS_LIST } from '../data';

interface AdminDashboardProps {
  students: Student[];
  eskulList: Extracurricular[];
  settings: AppSettings;
  onAddEskul: (nama: string, kelasAllowed: string[], tahunPelajaran: string) => Promise<void>;
  onDeleteEskul: (id: string) => Promise<void>;
  onResetEskulStudents: (eskulId: string) => Promise<void>;
  onResetAllData: () => Promise<void>;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export default function AdminDashboard({
  students,
  eskulList,
  settings,
  onAddEskul,
  onDeleteEskul,
  onResetEskulStudents,
  onResetAllData,
  onUpdateSettings
}: AdminDashboardProps) {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'eskul' | 'laporan' | 'pengaturan'>('laporan');

  // New Eskul State
  const [newEskulNama, setNewEskulNama] = useState('');
  const [newEskulKelas, setNewEskulKelas] = useState<string[]>(['VII', 'VIII', 'IX']);
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
    if (username === settings.adminUsername && password === settings.adminPassword) {
      setIsLoggedIn(true);
      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil',
        text: 'Selamat datang di Dashboard Admin SMP PGRI Jatiuwung.',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Username atau password yang Anda masukkan salah!',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // Add Eskul Handler
  const handleAddEskulSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEskulNama.trim() === '') {
      Swal.fire({ icon: 'warning', title: 'Nama Eskul Wajib diisi', confirmButtonColor: '#1d4ed8' });
      return;
    }
    if (newEskulKelas.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih minimal satu kriteria kelas', confirmButtonColor: '#1d4ed8' });
      return;
    }

    setIsAddingEskul(true);
    try {
      await onAddEskul(newEskulNama, newEskulKelas, newEskulTahun);
      setNewEskulNama('');
      Swal.fire({
        icon: 'success',
        title: 'Eskul Ditambahkan',
        text: 'Kategori Ekstrakurikuler baru berhasil tersimpan.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Menambahkan', text: 'Koneksi API bermasalah.', confirmButtonColor: '#ef4444' });
    } finally {
      setIsAddingEskul(false);
    }
  };

  // Delete Eskul
  const handleDeleteEskulClick = async (id: string, name: string) => {
    const studentCount = students.filter(s => s.eskulId === id).length;
    
    const result = await Swal.fire({
      title: 'Hapus Ekstrakurikuler?',
      html: `Apakah Anda yakin ingin menghapus <b>${name}</b>?<br/>${studentCount > 0 ? `<span class="text-red-500 font-bold">PERINGATAN: Ada ${studentCount} siswa yang terdaftar di eskul ini!</span>` : ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      try {
        await onDeleteEskul(id);
        Swal.fire({ icon: 'success', title: 'Eskul terhapus', timer: 1200, showConfirmButton: false });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gagal menghapus' });
      }
    }
  };

  // Toggle Class Checkbox helper
  const handleClassCheckboxChange = (grade: string) => {
    if (newEskulKelas.includes(grade)) {
      setNewEskulKelas(newEskulKelas.filter(c => c !== grade));
    } else {
      setNewEskulKelas([...newEskulKelas, grade]);
    }
  };

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
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data siswa untuk diekspor.' });
      return;
    }

    // Prepare CSV headers
    const headers = [
      'No. Registrasi', 'Tahun Pelajaran', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 
      'Ekstrakurikuler', 'Nama Ayah', 'Nama Ibu', 'No. HP Siswa', 'No. HP Orang Tua',
      'Memiliki Prestasi', 'Nama Lomba', 'Cabang Lomba', 'Tingkat Lomba', 'Juara Ke', 'Penyelenggara',
      'Alamat', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kota/Kabupaten', 'Provinsi', 'Tanggal Daftar'
    ];

    const rows = filteredStudents.map(s => [
      s.regNo,
      s.tahunPelajaran,
      s.name,
      s.kelas,
      s.jenisKelamin,
      s.eskulName,
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
      confirmButtonColor: '#1d4ed8'
    });
  };

  // Generate Recap PDF Report
  const handlePrintPDFRecap = () => {
    if (filteredStudents.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data siswa untuk dicetak.' });
      return;
    }

    Swal.fire({
      title: 'Menyiapkan Dokumen...',
      text: 'Sedang membuat laporan rekapitulasi pendaftaran.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(29, 78, 216);
      doc.text('SMP PGRI JATIUWUNG', 105, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`LAPORAN REKAPITULASI PENDAFTARAN EKSTRAKURIKULER`, 105, 20, { align: 'center' });
      doc.text(`Tahun Pelajaran: ${settings.tahunPelajaranAktif} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 25, { align: 'center' });
      
      doc.setDrawColor(29, 78, 216);
      doc.setLineWidth(0.5);
      doc.line(15, 28, 195, 28);

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
        doc.text(s.eskulName.substring(0, 30), 135, currentY + 5);

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
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Rekapitulasi PDF telah terunduh.' });
    } catch (e) {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Gagal cetak PDF' });
    }
  };

  // Reset per Ekstrakurikuler
  const handleResetEskulClick = async () => {
    if (eskulList.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Eskul Kosong' });
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
        html: `Apakah Anda yakin ingin menghapus <b>seluruh data (${studentCount} siswa)</b> yang terdaftar pada eskul <b>${selectedEskul?.nama}</b>? Tindakan ini bersifat permanen!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Reset Data!',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280'
      });

      if (confirm.isConfirmed) {
        await onResetEskulStudents(selectedEskulId);
        Swal.fire({
          icon: 'success',
          title: 'Reset Berhasil',
          text: `Data siswa pada eskul ${selectedEskul?.nama} telah dikosongkan.`,
          confirmButtonColor: '#1d4ed8'
        });
      }
    }
  };

  // Reset Seluruh Data (Database reset)
  const handleResetAllDataClick = async () => {
    // Stage 1 Confirmation
    const stage1 = await Swal.fire({
      title: 'Reset Seluruh Database?',
      html: '<p class="text-red-500 font-bold text-sm">PERINGATAN KRITIS!</p> Tindakan ini akan mengosongkan SELURUH data registrasi siswa dari database pendaftaran saat ini secara permanen untuk menyambut Tahun Pelajaran baru.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan Konfirmasi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (stage1.isConfirmed) {
      // Stage 2 Confirmation with explicit text code
      const stage2 = await Swal.fire({
        title: 'Konfirmasi Berlapis',
        html: 'Untuk menghindari ketidaksengajaan, silakan ketik teks <b>"RESET"</b> di bawah ini untuk mengosongkan seluruh database pendaftaran:',
        input: 'text',
        inputPlaceholder: 'Ketik RESET di sini...',
        showCancelButton: true,
        confirmButtonText: 'RESET SEKARANG!',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
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
          didOpen: () => Swal.showLoading()
        });

        try {
          await onResetAllData();
          Swal.close();
          Swal.fire({
            icon: 'success',
            title: 'Database Bersih',
            text: 'Seluruh data pendaftaran siswa berhasil dibersihkan dengan aman.',
            confirmButtonColor: '#1d4ed8'
          });
        } catch (e) {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Gagal membersihkan database'
          });
        }
      }
    }
  };

  // Save Settings handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onUpdateSettings({
        googleAppsScriptUrl: gasUrlInput,
        tahunPelajaranAktif: activeYearInput
      });
      Swal.fire({
        icon: 'success',
        title: 'Pengaturan Tersimpan',
        text: 'Pengaturan Tahun Pelajaran Aktif & API Sync diperbarui.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Gagal Menyimpan' });
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
            <h1 className="text-xl font-black text-slate-800">Login Guru / Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Gunakan kredensial otentikasi administrator Anda untuk mengelola ekstrakurikuler & mengunduh rekap laporan pendaftaran.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              id="btn-admin-login"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4.5 h-4.5 text-yellow-300" />
              Masuk Dashboard
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

  // Render Admin Layout with Bottom Navigation
  return (
    <div className="bg-slate-50 min-h-screen pb-24 max-w-md mx-auto relative flex flex-col justify-between" id="admin-dashboard-screen">
      {/* Upper header */}
      <div className="bg-blue-900 text-white px-5 py-5 rounded-b-3xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5.5 h-5.5 text-blue-900" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide uppercase">Dashboard Admin</h1>
            <p className="text-[10px] text-yellow-300 font-bold">SMP PGRI Jatiuwung</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsLoggedIn(false);
            setPassword('');
          }}
          className="text-[10px] bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/20 py-1.5 px-3 rounded-lg font-bold transition-all"
        >
          Keluar
        </button>
      </div>

      {/* Main Content Area */}
      <div className="px-3 py-4 flex-1">
        
        {/* ===================== TAB 1: JENIS EKSTRAKURIKULER ===================== */}
        {activeTab === 'eskul' && (
          <div className="space-y-4 animate-fadeIn" id="tab-eskul-management">
            {/* Form Add New */}
            <form onSubmit={handleAddEskulSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
              <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Plus className="w-4.5 h-4.5" />
                Tambah Ekstrakurikuler Baru
              </h2>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block">NAMA EKSTRAKURIKULER <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newEskulNama}
                  onChange={(e) => setNewEskulNama(e.target.value)}
                  placeholder="Contoh: English Club, Hadroh..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">TAHUN PELAJARAN</label>
                  <select
                    value={newEskulTahun}
                    onChange={(e) => setNewEskulTahun(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {TAHUN_PELAJARAN_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">TINGKAT KELAS DIZINKAN</label>
                  <div className="flex gap-2.5 pt-1.5">
                    {['VII', 'VIII', 'IX'].map(grade => (
                      <label key={grade} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEskulKelas.includes(grade)}
                          onChange={() => handleClassCheckboxChange(grade)}
                          className="w-3.5 h-3.5 text-blue-700 border-slate-300 rounded"
                        />
                        {grade}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingEskul}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAddingEskul ? 'Menyimpan...' : 'Tambah Ekstrakurikuler'}
              </button>
            </form>

            {/* List Table of Eskuls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                <Layers className="w-4.5 h-4.5 text-slate-600" />
                Daftar Kategori Ekstrakurikuler ({eskulList.length})
              </h2>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {eskulList.map(eskul => {
                  const numRegistered = students.filter(s => s.eskulId === eskul.id).length;
                  return (
                    <div key={eskul.id} className="flex items-center justify-between border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition-all">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{eskul.nama}</h4>
                        <div className="flex gap-1.5 mt-1 text-[9px] font-bold text-slate-400">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">Kelas: {eskul.kelasAllowed.join(', ')}</span>
                          <span className="bg-yellow-400/10 text-yellow-800 px-1.5 py-0.5 rounded">{eskul.tahunPelajaran}</span>
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{numRegistered} pendaftar</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEskulClick(eskul.id, eskul.nama)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-all cursor-pointer"
                        title="Hapus eskul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {eskulList.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                    Belum ada kategori eskul terdaftar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ===================== TAB 2: LAPORAN PENDAFTAR ===================== */}
        {activeTab === 'laporan' && (
          <div className="space-y-4 animate-fadeIn" id="tab-reports-list">
            
            {/* Quick Action Counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-900 text-white rounded-2xl p-3.5 shadow-sm border border-blue-950 relative overflow-hidden">
                <span className="text-[9px] font-bold text-blue-300 uppercase block tracking-wider">Total Terdaftar ({settings.tahunPelajaranAktif})</span>
                <span className="text-2xl font-black font-mono block mt-1">{students.filter(s => s.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                <div className="absolute right-2 bottom-2 bg-white/10 p-1.5 rounded-lg text-yellow-300">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 relative overflow-hidden">
                <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Kategori Eskul</span>
                <span className="text-2xl font-black font-mono text-slate-800 block mt-1">{eskulList.filter(e => e.tahunPelajaran === settings.tahunPelajaranAktif).length}</span>
                <div className="absolute right-2 bottom-2 bg-yellow-400/20 p-1.5 rounded-lg text-blue-800">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Print & Export buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrintPDFRecap}
                className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4 text-white" />
                Cetak Rekap PDF
              </button>
              
              <button
                onClick={handleExportExcel}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-white" />
                Ekspor Excel (CSV)
              </button>
            </div>

            {/* Filter Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
              <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Filter className="w-4 h-4" />
                Saring Data Pendaftar
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, no. registrasi, HP..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filterEskul}
                  onChange={(e) => setFilterEskul(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Eskul</option>
                  {eskulList.map(e => (
                    <option key={e.id} value={e.id}>{e.nama}</option>
                  ))}
                </select>

                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">Semua Kelas</option>
                  {KELAS_LIST.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Students List Display */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 space-y-2.5 max-h-[380px] overflow-y-auto">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider border-b border-slate-50 pb-1.5">
                <span>Daftar Siswa Terfilter</span>
                <span className="text-blue-700">{filteredStudents.length} baris data</span>
              </div>

              {filteredStudents.map((s, idx) => {
                const isExpanded = expandedStudentId === s.id;
                return (
                  <div key={s.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-all space-y-2">
                    <div className="flex items-center gap-3">
                      {s.photo ? (
                        <img src={s.photo} alt="Student" className="w-10 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100" />
                      ) : (
                        <div className="w-10 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">?</div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{s.regNo}</span>
                          <span className="text-[8px] text-slate-400 font-semibold">{new Date(s.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{s.name.toUpperCase()}</h4>
                        <div className="flex gap-2 text-[9px] text-slate-500 font-semibold mt-0.5">
                          <span>Kelas {s.kelas}</span>
                          <span>•</span>
                          <span className="text-blue-900 font-bold">{s.eskulName}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedStudentId(isExpanded ? null : s.id)}
                        className="p-1 hover:bg-slate-200 rounded-lg transition-all text-slate-500 cursor-pointer"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-700 space-y-2 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Jenis Kelamin</span>
                            <span className="font-semibold text-slate-800">{s.jenisKelamin}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">HP Siswa (WA)</span>
                            <span className="font-semibold text-slate-800 font-mono">{s.hpSiswa}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Nama Ayah / Ibu</span>
                            <span className="font-semibold text-slate-800">{s.namaAyah} / {s.namaIbu}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">HP Orang Tua (WA)</span>
                            <span className="font-semibold text-slate-800 font-mono">{s.hpOrtu}</span>
                          </div>
                        </div>

                        {s.prestasiChecked && (
                          <div className="bg-yellow-50 p-2 border border-yellow-200 rounded-lg text-yellow-900 border-b border-slate-200 pb-2">
                            <span className="text-[9px] font-black text-yellow-800 block uppercase tracking-wider">★ PRESTASI KHUSUS SISWA</span>
                            <p className="mt-0.5 font-bold">{s.namaLomba} ({s.cabangLomba})</p>
                            <p className="text-[10px] font-medium text-yellow-700">Tingkat {s.tingkatLomba} | Juara {s.juaraKe} | Penyelenggara: {s.penyelenggara}</p>
                          </div>
                        )}

                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Alamat Tempat Tinggal</span>
                          <span className="font-semibold text-slate-800 leading-relaxed block">
                            {s.alamat}, RT {s.rt}/RW {s.rw}, Kel. {s.kelurahanName}, Kec. {s.kecamatanName}, {s.kabupatenName}, {s.provinsiName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredStudents.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                  Tidak ada pendaftar yang cocok dengan filter pencarian.
                </div>
              )}
            </div>
          </div>
        )}


        {/* ===================== TAB 3: PENGATURAN (RESET DATA) ===================== */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-4 animate-fadeIn" id="tab-app-settings">
            
            {/* API & active year parameters */}
            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
              <h2 className="text-xs font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Settings className="w-4.5 h-4.5 text-blue-700" />
                Konfigurasi Umum & Database API
              </h2>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block">TAHUN PELAJARAN AKTIF</label>
                <select
                  value={activeYearInput}
                  onChange={(e) => setActiveYearInput(e.target.value)}
                  className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-700 cursor-pointer"
                >
                  {TAHUN_PELAJARAN_LIST.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 leading-normal">Mengatur tahun aktif pendaftaran untuk formulir publik secara instan.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-700 block">GOOGLE APPS SCRIPT WEB APP URL</label>
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={gasUrlInput}
                    onChange={(e) => setGasUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-blue-700"
                  />
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Kosongkan kolom ini untuk menggunakan database simulasi lokal (`localStorage`). Isi dengan URL Deployment Apps Script Anda untuk menghubungkan data nyata di Google Spreadsheet.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </form>

            {/* Reset Database Actions Panel */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-4">
              <h2 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-red-200/50 pb-2">
                <ShieldAlert className="w-5 h-5 text-red-700" />
                Zona Bahaya (Reset Database)
              </h2>
              <p className="text-[10px] text-red-700 leading-normal">
                Tindakan ini bersifat destruktif dan permanen. Pastikan Anda telah mengunduh rekap Excel terlebih dahulu sebelum melakukan pembersihan.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleResetEskulClick}
                  className="w-full bg-white hover:bg-yellow-50 text-yellow-800 hover:text-yellow-900 border border-yellow-300 hover:border-yellow-400 text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCcw className="w-4 h-4 text-yellow-700" />
                  Reset per Ekstrakurikuler
                </button>

                <button
                  onClick={handleResetAllDataClick}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-white animate-pulse" />
                  Reset Seluruh Database Pendaftar
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* BOTTOM MOBILE NAVIGATION BAR */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2.5 px-6 flex justify-around rounded-t-3xl shadow-lg z-20">
        
        {/* Nav 1: Eskul Management */}
        <button
          onClick={() => setActiveTab('eskul')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'eskul' ? 'text-blue-700 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[9px] font-extrabold uppercase">Kategori Eskul</span>
        </button>

        {/* Nav 2: Reports List */}
        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'laporan' ? 'text-blue-700 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[9px] font-extrabold uppercase">Laporan</span>
        </button>

        {/* Nav 3: Settings & Resets */}
        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === 'pengaturan' ? 'text-blue-700 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-extrabold uppercase">Pengaturan</span>
        </button>

      </div>
    </div>
  );
}
