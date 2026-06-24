/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Camera, School, Users, FileText, Phone, Award, MapPin, 
  Send, FileCheck, CheckCircle2, RefreshCw, AlertTriangle
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Student, Extracurricular } from '../types';
import { 
  KELAS_LIST, 
  fetchProvinces, 
  fetchKabupaten, 
  fetchKecamatan, 
  fetchKelurahan,
  RegionItem 
} from '../data';

interface StudentFormProps {
  eskulList: Extracurricular[];
  tahunPelajaranAktif: string;
  onSubmitRegistration: (studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'>) => Promise<Student>;
  isLive: boolean;
}

export default function StudentForm({ eskulList, tahunPelajaranAktif, onSubmitRegistration, isLive }: StudentFormProps) {
  // Personal Details state
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoSize, setPhotoSize] = useState<number | null>(null);
  const [originalPhotoSize, setOriginalPhotoSize] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [kelas, setKelas] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan' | ''>('');
  const [namaAyah, setNamaAyah] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [hpSiswa, setHpSiswa] = useState('');
  const [hpOrtu, setHpOrtu] = useState('');
  
  // Achievements state
  const [hasAchievements, setHasAchievements] = useState(false);
  const [namaLomba, setNamaLomba] = useState('');
  const [cabangLomba, setCabangLomba] = useState('');
  const [tingkatLomba, setTingkatLomba] = useState('');
  const [juaraKe, setJuaraKe] = useState('');
  const [penyelenggara, setPenyelenggara] = useState('');

  // Address state
  const [alamat, setAlamat] = useState('');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');
  
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [kabupatens, setKabupatens] = useState<RegionItem[]>([]);
  const [kecamatans, setKecamatans] = useState<RegionItem[]>([]);
  const [kelurahans, setKelurahans] = useState<RegionItem[]>([]);

  const [selectedProvinsi, setSelectedProvinsi] = useState<RegionItem | null>(null);
  const [selectedKabupaten, setSelectedKabupaten] = useState<RegionItem | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<RegionItem | null>(null);
  const [selectedKelurahan, setSelectedKelurahan] = useState<RegionItem | null>(null);

  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  // Extracurricular state
  const [selectedEskul, setSelectedEskul] = useState<Extracurricular | null>(null);

  // Result state
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setIsLoadingRegions(true);
      const data = await fetchProvinces();
      setProvinces(data);
      setIsLoadingRegions(false);
    }
    loadProvinces();
  }, []);

  // Cascading Region triggers
  const handleProvinsiChange = async (provId: string) => {
    if (!provId) {
      setSelectedProvinsi(null);
      setKabupatens([]);
      setSelectedKabupaten(null);
      setKecamatans([]);
      setSelectedKecamatan(null);
      setKelurahans([]);
      setSelectedKelurahan(null);
      return;
    }
    const prov = provinces.find(p => p.id === provId) || null;
    setSelectedProvinsi(prov);
    setSelectedKabupaten(null);
    setKecamatans([]);
    setSelectedKecamatan(null);
    setKelurahans([]);
    setSelectedKelurahan(null);
    
    setIsLoadingRegions(true);
    const data = await fetchKabupaten(provId);
    setKabupatens(data);
    setIsLoadingRegions(false);
  };

  const handleKabupatenChange = async (kabId: string) => {
    if (!kabId) {
      setSelectedKabupaten(null);
      setKecamatans([]);
      setSelectedKecamatan(null);
      setKelurahans([]);
      setSelectedKelurahan(null);
      return;
    }
    const kab = kabupatens.find(k => k.id === kabId) || null;
    setSelectedKabupaten(kab);
    setSelectedKecamatan(null);
    setKelurahans([]);
    setSelectedKelurahan(null);
    
    setIsLoadingRegions(true);
    const data = await fetchKecamatan(kabId);
    setKecamatans(data);
    setIsLoadingRegions(false);
  };

  const handleKecamatanChange = async (kecId: string) => {
    if (!kecId) {
      setSelectedKecamatan(null);
      setKelurahans([]);
      setSelectedKelurahan(null);
      return;
    }
    const kec = kecamatans.find(k => k.id === kecId) || null;
    setSelectedKecamatan(kec);
    setSelectedKelurahan(null);
    
    setIsLoadingRegions(true);
    const data = await fetchKelurahan(kecId);
    setKelurahans(data);
    setIsLoadingRegions(false);
  };

  const handleKelurahanChange = (kelId: string) => {
    if (!kelId) {
      setSelectedKelurahan(null);
      return;
    }
    const kel = kelurahans.find(k => k.id === kelId) || null;
    setSelectedKelurahan(kel);
  };

  // Image compression utility
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalPhotoSize(Math.round(file.size / 1024));
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension bounds for scaling
        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);

        // Start compression quality loop
        let quality = 0.8;
        let dataUrl = '';
        let sizeInKb = 999;

        do {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          // Calculate length in KB
          const head = 'data:image/jpeg;base64,'.length;
          sizeInKb = Math.round(((dataUrl.length - head) * 3) / 4 / 1024);
          quality -= 0.1;
        } while (sizeInKb > 195 && quality > 0.1);

        setPhoto(dataUrl);
        setPhotoSize(sizeInKb);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Extract Grade from selected Class
  const getGrade = (selectedClass: string): string => {
    if (selectedClass.startsWith('VII')) return 'VII';
    if (selectedClass.startsWith('VIII')) return 'VIII';
    if (selectedClass.startsWith('IX')) return 'IX';
    return '';
  };

  // Filter extracurricular activities by eligibility and active school year
  const studentGrade = getGrade(kelas);
  const eligibleEskuls = eskulList.filter(eskul => {
    const matchYear = eskul.tahunPelajaran === tahunPelajaranAktif;
    if (!matchYear) return false;
    if (!studentGrade) return true; // Show all if class not selected yet
    return eskul.kelasAllowed.includes(studentGrade);
  });

  // Check if form is fully valid
  const isFormValid = () => {
    const basicValid = 
      name.trim() !== '' &&
      photo !== '' &&
      kelas !== '' &&
      jenisKelamin !== '' &&
      namaAyah.trim() !== '' &&
      namaIbu.trim() !== '' &&
      hpSiswa.trim() !== '' &&
      hpOrtu.trim() !== '' &&
      alamat.trim() !== '' &&
      rt.trim() !== '' &&
      rw.trim() !== '' &&
      selectedProvinsi !== null &&
      selectedKabupaten !== null &&
      selectedKecamatan !== null &&
      selectedKelurahan !== null &&
      selectedEskul !== null;

    if (!basicValid) return false;

    if (hasAchievements) {
      return (
        namaLomba.trim() !== '' &&
        cabangLomba.trim() !== '' &&
        tingkatLomba !== '' &&
        juaraKe !== '' &&
        penyelenggara.trim() !== ''
      );
    }

    return true;
  };

  // Submit Handler with SweetAlert2
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulir Belum Lengkap',
        text: 'Silakan isi semua kolom wajib (*) yang ditandai.',
        confirmButtonColor: '#1d4ed8'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Konfirmasi Pendaftaran',
      text: 'Apakah semua data Anda sudah benar? Silakan cek kembali sebelum mengirim.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim Sekarang!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        const studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'> = {
          name,
          photo,
          kelas,
          jenisKelamin: jenisKelamin as 'Laki-laki' | 'Perempuan',
          namaAyah,
          namaIbu,
          hpSiswa,
          hpOrtu,
          prestasiChecked: hasAchievements,
          namaLomba: hasAchievements ? namaLomba : '',
          cabangLomba: hasAchievements ? cabangLomba : '',
          tingkatLomba: hasAchievements ? tingkatLomba : '',
          juaraKe: hasAchievements ? juaraKe : '',
          penyelenggara: hasAchievements ? penyelenggara : '',
          alamat,
          rt,
          rw,
          provinsiId: selectedProvinsi?.id || '',
          provinsiName: selectedProvinsi?.name || '',
          kabupatenId: selectedKabupaten?.id || '',
          kabupatenName: selectedKabupaten?.name || '',
          kecamatanId: selectedKecamatan?.id || '',
          kecamatanName: selectedKecamatan?.name || '',
          kelurahanId: selectedKelurahan?.id || '',
          kelurahanName: selectedKelurahan?.name || '',
          eskulId: selectedEskul?.id || '',
          eskulName: selectedEskul?.nama || '',
          tahunPelajaran: tahunPelajaranAktif
        };

        const res = await onSubmitRegistration(studentData);
        setRegisteredStudent(res);
        
        Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          text: `Selamat, Anda berhasil terdaftar dengan Nomor: ${res.regNo}`,
          confirmButtonColor: '#1d4ed8'
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Data',
          text: 'Terjadi masalah saat mengirim data ke server. Coba beberapa saat lagi.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Generate Receipt PDF
  const handleDownloadPDF = async () => {
    if (!registeredStudent) return;

    Swal.fire({
      title: 'Menyiapkan PDF...',
      html: 'Sedang membuat bukti pendaftaran resmi.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = [29, 78, 216]; // #1d4ed8
      const accentColor = [234, 179, 8]; // #eab308
      const darkColor = [31, 41, 55]; // #1f2937

      // Border frame
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);

      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(6.5, 6.5, 197, 284);

      // KOP SURAT Header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SMP PGRI JATIUWUNG', 105, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Tahun Pelajaran ' + registeredStudent.tahunPelajaran, 105, 23, { align: 'center' });
      doc.text('Jl. Raya Pajajaran No.1, Gandasari, Kec. Jatiuwung, Kota Tangerang, Banten 15137', 105, 28, { align: 'center' });
      
      // Divider Line
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.8);
      doc.line(12, 32, 198, 32);
      
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.4);
      doc.line(12, 33.5, 198, 33.5);

      // Form Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('BUKTI PENDAFTARAN EKSTRAKURIKULER', 105, 43, { align: 'center' });

      // Registration Number Box
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFillColor(243, 244, 246);
      doc.rect(55, 47, 100, 10, 'FD');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`NO. REGISTRASI: ${registeredStudent.regNo}`, 105, 53.5, { align: 'center' });

      // Student Photo (Base64 JPEG)
      if (registeredStudent.photo) {
        try {
          doc.addImage(registeredStudent.photo, 'JPEG', 150, 62, 40, 50);
          doc.setDrawColor(156, 163, 175);
          doc.setLineWidth(0.3);
          doc.rect(149.8, 61.8, 40.4, 50.4);
        } catch (e) {
          doc.rect(150, 62, 40, 50);
          doc.setFontSize(8);
          doc.text('Photo Error', 170, 87, { align: 'center' });
        }
      }

      // Write Data Helper
      let currentY = 66;
      const drawField = (label: string, value: string, boldVal: boolean = false) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(75, 85, 99);
        doc.text(label, 15, currentY);
        doc.text(':', 55, currentY);
        doc.setFont('helvetica', boldVal ? 'bold' : 'normal');
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        
        // Wrap text for long address
        if (value.length > 45) {
          const splitText = doc.splitTextToSize(value, 90);
          doc.text(splitText, 58, currentY);
          currentY += (splitText.length - 1) * 4.5 + 6;
        } else {
          doc.text(value, 58, currentY);
          currentY += 6;
        }
      };

      // 1. DATA PRIBADI SISWA (Section Header)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('A. DATA PRIBADI SISWA', 15, 61);
      doc.setDrawColor(229, 231, 235);
      doc.line(15, 62, 135, 62);

      drawField('Nama Lengkap', registeredStudent.name.toUpperCase(), true);
      drawField('Kelas', registeredStudent.kelas);
      drawField('Jenis Kelamin', registeredStudent.jenisKelamin);
      drawField('No. HP WhatsApp', registeredStudent.hpSiswa);

      // Reset alignment or adjust for photo boundary
      if (currentY < 118) currentY = 118;

      // 2. DATA PILIHAN EKSTRAKURIKULER
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('B. PILIHAN EKSTRAKURIKULER', 15, currentY);
      doc.line(15, currentY + 1, 195, currentY + 1);
      currentY += 6;

      drawField('Pilihan Ekstrakurikuler', registeredStudent.eskulName.toUpperCase(), true);

      // 3. DATA ORANG TUA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('C. DATA ORANG TUA / WALI', 15, currentY);
      doc.line(15, currentY + 1, 195, currentY + 1);
      currentY += 6;

      drawField('Nama Ayah Kandung', registeredStudent.namaAyah);
      drawField('Nama Ibu Kandung', registeredStudent.namaIbu);
      drawField('No. HP Orang Tua / Wali', registeredStudent.hpOrtu);

      // 4. PRESTASI SISWA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('D. PRESTASI SISWA', 15, currentY);
      doc.line(15, currentY + 1, 195, currentY + 1);
      currentY += 6;

      if (registeredStudent.prestasiChecked) {
        drawField('Nama Lomba', registeredStudent.namaLomba || '-');
        drawField('Cabang Lomba', registeredStudent.cabangLomba || '-');
        drawField('Tingkat / Juara', `${registeredStudent.tingkatLomba || '-'} / Juara ${registeredStudent.juaraKe || '-'}`);
        drawField('Penyelenggara', registeredStudent.penyelenggara || '-');
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(107, 114, 128);
        doc.text('Tidak memiliki prestasi khusus yang dilampirkan.', 15, currentY);
        currentY += 6;
      }

      // 5. ALAMAT LENGKAP
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('E. ALAMAT TEMPAT TINGGAL', 15, currentY);
      doc.line(15, currentY + 1, 195, currentY + 1);
      currentY += 6;

      const fullAlamatStr = `${registeredStudent.alamat}, RT ${registeredStudent.rt} / RW ${registeredStudent.rw}, Kel. ${registeredStudent.kelurahanName}, Kec. ${registeredStudent.kecamatanName}, ${registeredStudent.kabupatenName}, Prov. ${registeredStudent.provinsiName}`;
      drawField('Alamat Lengkap', fullAlamatStr);

      // 6. BOTTOM SIGNATURES SECTION
      const signY = 232;
      doc.setDrawColor(209, 213, 219);
      doc.line(15, signY - 8, 195, signY - 8);

      // Date of Registration
      const registrationDate = new Date(registeredStudent.createdAt);
      const optDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDate = registrationDate.toLocaleDateString('id-ID', optDate);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      doc.text(`Tangerang, ${formattedDate}`, 155, signY - 2, { align: 'center' });

      // Left: Parent Signature
      doc.setFont('helvetica', 'normal');
      doc.text('Mengetahui,', 45, signY + 3, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Orang Tua / Wali', 45, signY + 8, { align: 'center' });
      doc.line(20, signY + 34, 70, signY + 34); // Signature line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('( Tanda Tangan & Nama Jelas )', 45, signY + 38, { align: 'center' });

      // Right: Student Signature
      doc.setFontSize(9.5);
      doc.text('Pendaftar,', 155, signY + 3, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text('Siswa Bersangkutan', 155, signY + 8, { align: 'center' });
      doc.line(130, signY + 34, 180, signY + 34); // Signature line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('( Tanda Tangan & Nama Jelas )', 155, signY + 38, { align: 'center' });

      // Center: QR Code (Scannable verification)
      const qrText = `SMP PGRI Jatiuwung - Bukti Registrasi Resmi
No: ${registeredStudent.regNo}
Nama: ${registeredStudent.name}
Kelas: ${registeredStudent.kelas}
Eskul: ${registeredStudent.eskulName}
Tahun Pelajaran: ${registeredStudent.tahunPelajaran}`;
      
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1 });
      doc.addImage(qrDataUrl, 'JPEG', 88, signY + 6, 30, 30);
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text('Pindai untuk Verifikasi', 103, signY + 38, { align: 'center' });

      // Save PDF
      doc.save(`BUKTI_REG_${registeredStudent.regNo.replace(/\//g, '_')}.pdf`);
      Swal.close();
      
      Swal.fire({
        icon: 'success',
        title: 'Unduh Berhasil!',
        text: 'File bukti pendaftaran PDF telah disimpan di perangkat Anda.',
        confirmButtonColor: '#1d4ed8'
      });
    } catch (e) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Gagal membuat dokumen bukti PDF.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleResetForm = () => {
    setName('');
    setPhoto('');
    setPhotoSize(null);
    setOriginalPhotoSize(null);
    setKelas('');
    setJenisKelamin('');
    setNamaAyah('');
    setNamaIbu('');
    setHpSiswa('');
    setHpOrtu('');
    setHasAchievements(false);
    setNamaLomba('');
    setCabangLomba('');
    setTingkatLomba('');
    setJuaraKe('');
    setPenyelenggara('');
    setAlamat('');
    setRt('');
    setRw('');
    setSelectedProvinsi(null);
    setSelectedKabupaten(null);
    setSelectedKecamatan(null);
    setSelectedKelurahan(null);
    setSelectedEskul(null);
    setRegisteredStudent(null);
  };

  // If successfully registered, show the Success Screen
  if (registeredStudent) {
    return (
      <div className="bg-slate-50 min-h-screen py-6 px-4 flex flex-col justify-between max-w-md mx-auto" id="registration-success-screen">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex-1 flex flex-col justify-center items-center p-8 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border-2 border-green-400 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 text-sm mb-6 px-4">
            Selamat <span className="font-semibold text-slate-700">{registeredStudent.name}</span>, data pendaftaran Anda telah terekam di sistem kami secara permanen.
          </p>

          {/* Registrasi info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 w-full mb-8 text-left">
            <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
              <span className="text-xs text-blue-600 font-medium">No. Registrasi</span>
              <span className="text-sm font-bold text-blue-800 font-mono">{registeredStudent.regNo}</span>
            </div>
            <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
              <span className="text-xs text-blue-600 font-medium">Kelas</span>
              <span className="text-sm font-semibold text-blue-900">{registeredStudent.kelas}</span>
            </div>
            <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
              <span className="text-xs text-blue-600 font-medium">Ekstrakurikuler</span>
              <span className="text-sm font-bold text-blue-900">{registeredStudent.eskulName}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-xs text-blue-600 font-medium">Tahun Pelajaran</span>
              <span className="text-sm font-semibold text-blue-900">{registeredStudent.tahunPelajaran}</span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <button
              onClick={handleDownloadPDF}
              id="btn-download-pdf"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-5 h-5 text-yellow-300" />
              Download Formulir PDF
            </button>
            
            <button
              onClick={handleResetForm}
              id="btn-register-new"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Daftar Siswa Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active form view
  return (
    <div className="bg-slate-50 min-h-screen pb-12 max-w-md mx-auto" id="student-form-screen">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 text-white pb-12 pt-6 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Yellow artistic highlight */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400 opacity-20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-md border-2 border-white">
            <School className="w-7 h-7 text-blue-900" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide leading-tight">SMP PGRI JATIUWUNG</h1>
            <p className="text-xs text-yellow-300 font-medium">Sistem Informasi Pendaftaran Ekstrakurikuler</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-900/40 border border-blue-500/30 rounded-2xl p-4 flex justify-between items-center relative z-10 backdrop-blur-md">
          <div>
            <p className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">Tahun Pelajaran Aktif</p>
            <p className="text-lg font-black text-yellow-300 font-mono mt-0.5">{tahunPelajaranAktif}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-500/20 text-green-300 border border-green-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
            {isLive ? 'KONEKSI GOOGLE SHEET' : 'SIMULASI LOKAL'}
          </div>
        </div>
      </div>

      {/* Main Registration Form */}
      <div className="px-4 -mt-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-5 space-y-6 border border-slate-100">
          <h2 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700" />
            Isi Data Registrasi Siswa
          </h2>

          {/* Foto Siswa Upload & Compression */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">PAS FOTO BERSERAGAM <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative shadow-sm"
              >
                {photo ? (
                  <img src={photo} alt="Student preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-[9px] text-slate-400 text-center font-semibold px-2">Klik Pas Foto</span>
                  </>
                )}
                
                {isCompressing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mb-1"></span>
                    <span className="text-[8px] uppercase tracking-wider font-bold">Kompres...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-600" />
                  Pilih Berkas Foto
                </button>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">
                  <p className="font-semibold text-slate-500">Persyaratan Pas Foto:</p>
                  <p>• JPG atau PNG berseragam resmi</p>
                  <p>• Kompresi otomatis cerdas &lt; 200KB</p>
                </div>
              </div>
            </div>
            {photoSize !== null && originalPhotoSize !== null && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-yellow-800">
                <div className="flex items-center gap-1.5 font-medium">
                  <FileCheck className="w-4 h-4 text-yellow-600" />
                  <span>Kompresi berhasil dilakukan</span>
                </div>
                <div className="font-mono text-[10px] font-bold">
                  <span className="line-through text-slate-400">{originalPhotoSize}KB</span>
                  <span className="mx-1">→</span>
                  <span className="text-green-600">{photoSize}KB</span>
                </div>
              </div>
            )}
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">NAMA LENGKAP SISWA <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap pendaftar..." 
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-medium"
                required
              />
            </div>
          </div>

          {/* Row: Kelas & Jenis Kelamin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">KELAS <span className="text-red-500">*</span></label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={kelas}
                  onChange={(e) => {
                    setKelas(e.target.value);
                    setSelectedEskul(null); // Reset eskul selection as criteria may change
                  }}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-semibold cursor-pointer appearance-none"
                  required
                >
                  <option value="">Pilih...</option>
                  {KELAS_LIST.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">JENIS KELAMIN <span className="text-red-500">*</span></label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as any)}
                  className="w-full pl-9 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-semibold cursor-pointer appearance-none"
                  required
                >
                  <option value="">Pilih...</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Extracurricular Selection */}
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-4 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-blue-700" />
              PILIH EKSTRAKURIKULER <span className="text-red-500">*</span>
            </label>
            <p className="text-[10px] text-slate-500 leading-normal mb-2">
              Daftar di bawah ini disesuaikan otomatis dengan tingkat kelas ({studentGrade || 'Silakan pilih kelas dahulu'}) dan Tahun Pelajaran aktif.
            </p>
            {kelas ? (
              <div className="relative">
                <select
                  value={selectedEskul?.id || ''}
                  onChange={(e) => {
                    const eskul = eligibleEskuls.find(item => item.id === e.target.value) || null;
                    setSelectedEskul(eskul);
                  }}
                  className="w-full px-3 py-2.5 bg-white border border-yellow-400/30 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Ekstrakurikuler --</option>
                  {eligibleEskuls.map(eskul => (
                    <option key={eskul.id} value={eskul.id}>
                      {eskul.nama} ({eskul.kelasAllowed.join('/')})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-dashed border-slate-200">
                <span className="text-xs text-slate-400 font-medium">Pilih Kelas terlebih dahulu untuk melihat daftar eskul</span>
              </div>
            )}
            {kelas && eligibleEskuls.length === 0 && (
              <div className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tidak ada eskul yang tersedia untuk kelas {studentGrade} di Tahun {tahunPelajaranAktif}.
              </div>
            )}
          </div>

          {/* Section: Data Orang Tua */}
          <h3 className="text-xs font-black text-blue-800 tracking-wider uppercase border-t border-slate-100 pt-4 flex items-center gap-1">
            <Users className="w-4 h-4" />
            Informasi Orang Tua / Wali
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NAMA AYAH <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={namaAyah} 
                onChange={(e) => setNamaAyah(e.target.value)}
                placeholder="Nama ayah kandung..." 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NAMA IBU <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={namaIbu} 
                onChange={(e) => setNamaIbu(e.target.value)}
                placeholder="Nama ibu kandung..." 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                required
              />
            </div>
          </div>

          {/* Row: WhatsApp Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NO. HP SISWA (WA) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="tel" 
                  value={hpSiswa} 
                  onChange={(e) => setHpSiswa(e.target.value)}
                  placeholder="08xxxxxxxxxx" 
                  className="w-full pl-8.5 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NO. HP ORTU (WA) <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="tel" 
                  value={hpOrtu} 
                  onChange={(e) => setHpOrtu(e.target.value)}
                  placeholder="08xxxxxxxxxx" 
                  className="w-full pl-8.5 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Alamat Lengkap */}
          <h3 className="text-xs font-black text-blue-800 tracking-wider uppercase border-t border-slate-100 pt-4 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Alamat Tempat Tinggal
          </h3>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            {/* Kampung/Perumahan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 block">KAMPUNG / PERUMAHAN / NAMA JALAN <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={alamat} 
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: Kp. Jatake RT 02, Jalan Pajajaran..." 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-medium"
                required
              />
            </div>

            {/* RT & RW */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">RT <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={rt} 
                  onChange={(e) => setRt(e.target.value)}
                  placeholder="002" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-mono font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">RW <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={rw} 
                  onChange={(e) => setRw(e.target.value)}
                  placeholder="001" 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Dropdown 1: Provinsi */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 block">PROVINSI <span className="text-red-500">*</span></label>
              <select
                value={selectedProvinsi?.id || ''}
                onChange={(e) => handleProvinsiChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold cursor-pointer"
                required
              >
                <option value="">-- Pilih Provinsi --</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 2: Kota/Kabupaten */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 block">KOTA / KABUPATEN <span className="text-red-500">*</span></label>
              <select
                value={selectedKabupaten?.id || ''}
                onChange={(e) => handleKabupatenChange(e.target.value)}
                disabled={!selectedProvinsi}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                required
              >
                <option value="">-- Pilih Kota/Kabupaten --</option>
                {kabupatens.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 3: Kecamatan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 block">KECAMATAN <span className="text-red-500">*</span></label>
              <select
                value={selectedKecamatan?.id || ''}
                onChange={(e) => handleKecamatanChange(e.target.value)}
                disabled={!selectedKabupaten}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                required
              >
                <option value="">-- Pilih Kecamatan --</option>
                {kecamatans.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            {/* Dropdown 4: Kelurahan */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 block">KELURAHAN / DESA <span className="text-red-500">*</span></label>
              <select
                value={selectedKelurahan?.id || ''}
                onChange={(e) => handleKelurahanChange(e.target.value)}
                disabled={!selectedKecamatan}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                required
              >
                <option value="">-- Pilih Kelurahan --</option>
                {kelurahans.map(k => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>
            
            {isLoadingRegions && (
              <div className="text-[9px] text-blue-700 font-bold animate-pulse text-center pt-1 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-700 rounded-full animate-ping"></span>
                Memuat Data Wilayah...
              </div>
            )}
          </div>

          {/* Section: Prestasi Siswa */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-blue-800 tracking-wider uppercase flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                PRESTASI KHUSUS SISWA
              </h3>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">Opsional</span>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50">
              <input 
                type="checkbox" 
                id="checkbox-prestasi"
                checked={hasAchievements}
                onChange={(e) => setHasAchievements(e.target.checked)}
                className="w-4 h-4 text-blue-700 border-slate-300 rounded focus:ring-blue-700 mt-0.5 cursor-pointer"
              />
              <div className="text-xs">
                <label htmlFor="checkbox-prestasi" className="font-bold text-slate-700 cursor-pointer block select-none">Siswa Memiliki Prestasi Khusus</label>
                <p className="text-[10px] text-slate-400 leading-normal">Centang kotak ini untuk melampirkan piagam/prestasi lomba siswa di formulir.</p>
              </div>
            </div>

            {hasAchievements && (
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-blue-100 space-y-3 transition-all duration-500 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 block">NAMA LOMBA <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={namaLomba} 
                    onChange={(e) => setNamaLomba(e.target.value)}
                    placeholder="Contoh: Lomba Pencak Silat Piala Walikota..." 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">CABANG LOMBA <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={cabangLomba} 
                      onChange={(e) => setCabangLomba(e.target.value)}
                      placeholder="Contoh: Tanding Kelas C Putra..." 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">TINGKAT LOMBA <span className="text-red-500">*</span></label>
                    <select
                      value={tingkatLomba}
                      onChange={(e) => setTingkatLomba(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold cursor-pointer"
                      required
                    >
                      <option value="">Pilih Tingkat...</option>
                      <option value="Sekolah">Sekolah</option>
                      <option value="Kecamatan">Kecamatan</option>
                      <option value="Kota/Kabupaten">Kota/Kabupaten</option>
                      <option value="Provinsi">Provinsi</option>
                      <option value="Nasional">Nasional</option>
                      <option value="Internasional">Internasional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">JUARA KE <span className="text-red-500">*</span></label>
                    <select
                      value={juaraKe}
                      onChange={(e) => setJuaraKe(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold cursor-pointer"
                      required
                    >
                      <option value="">Pilih Juara...</option>
                      <option value="1">Juara 1</option>
                      <option value="2">Juara 2</option>
                      <option value="3">Juara 3</option>
                      <option value="Harapan 1">Harapan 1</option>
                      <option value="Harapan 2">Harapan 2</option>
                      <option value="Harapan 3">Harapan 3</option>
                      <option value="Lainnya">Lainnya / Partisipan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 block">PENYELENGGARA <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={penyelenggara} 
                      onChange={(e) => setPenyelenggara(e.target.value)}
                      placeholder="Nama penyelenggara lomba..." 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-registration"
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  Memproses Pendaftaran...
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5 text-yellow-300" />
                  Kirim Data Registrasi
                </>
              )}
            </button>
            <p className="text-[9px] text-slate-400 text-center mt-2.5 font-medium leading-normal">
              Dengan mengklik tombol Kirim, Anda menyatakan bahwa seluruh data yang diisi adalah benar milik pendaftar yang bersangkutan.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
