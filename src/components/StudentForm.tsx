/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Camera, School, Users, FileText, Phone, Award, MapPin, 
  Send, FileCheck, CheckCircle2, RefreshCw, AlertTriangle, X, Mail
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Student, Extracurricular } from '../types';
import { 
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
  classList?: string[];
}

export default function StudentForm({ eskulList, tahunPelajaranAktif, onSubmitRegistration, isLive, classList = [] }: StudentFormProps) {
  const [logoImgElement, setLogoImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://lh3.googleusercontent.com/d/1Jfb6nl1FHxlA3tL8qNNrgyPrc1ob2SfT';
    img.onload = () => {
      setLogoImgElement(img);
    };
  }, []);

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
  const [email, setEmail] = useState('');
  
  // Achievements state
  const [hasAchievements, setHasAchievements] = useState(false);
  const [namaLomba, setNamaLomba] = useState('');
  const [cabangLomba, setCabangLomba] = useState('');
  const [tingkatLomba, setTingkatLomba] = useState('');
  const [juaraKe, setJuaraKe] = useState('');
  const [penyelenggara, setPenyelenggara] = useState('');
  const [certificateFile, setCertificateFile] = useState('');
  const [certificateFileName, setCertificateFileName] = useState('');

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
  const [selectedEskul2, setSelectedEskul2] = useState<Extracurricular | null>(null);

  // Result state
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  // Dynamic class list derived from extracurriculars created by teacher/admin
  const dynamicKelasList = React.useMemo(() => {
    // Filter active extracurriculars for the current active school year
    const activeEskuls = eskulList.filter(e => e.tahunPelajaran === tahunPelajaranAktif);
    // Use the filtered active ones, or fall back to all extracurriculars if none matches
    const targetEskuls = activeEskuls.length > 0 ? activeEskuls : eskulList;
    
    const classesSet = new Set<string>();
    targetEskuls.forEach(eskul => {
      if (Array.isArray(eskul.kelasAllowed)) {
        eskul.kelasAllowed.forEach(k => {
          if (k && k.trim()) {
            classesSet.add(k.trim().toUpperCase());
          }
        });
      }
    });

    const sortedList = Array.from(classesSet);
    if (sortedList.length === 0) {
      return [];
    }

    // Sort alphanumeric order nicely (e.g. VII, VIII, IX or 7A, 7B, 8A etc)
    return sortedList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [eskulList, tahunPelajaranAktif]);

  // Use classList from spreadsheet if available, fallback to dynamic derived list
  const finalKelasList = React.useMemo(() => {
    if (classList && classList.length > 0) {
      return classList;
    }
    return dynamicKelasList;
  }, [classList, dynamicKelasList]);

  // Load Provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setIsLoadingRegions(true);
      const data = await fetchProvinces();
      setProvinces(data);
      
      const banten = data.find(p => p.id === '36' || p.name.toUpperCase() === 'BANTEN');
      if (banten) {
        setSelectedProvinsi(banten);
        const kabs = await fetchKabupaten(banten.id);
        setKabupatens(kabs);
      }
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

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Format File Salah',
        text: 'Harap unggah file foto dalam format gambar (JPG/JPEG/PNG).',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Terlalu Besar',
        text: 'Maksimal ukuran file pas foto untuk kompresi adalah 15MB.',
        confirmButtonColor: '#1d4ed8',
        width: '340px',
        timer: 5000,
        timerProgressBar: true
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

        // Start compression quality and dimension scaling loop to guarantee < 200 kb
        let quality = 0.8;
        let dataUrl = '';
        let sizeInKb = 999;
        let scale = 1.0;

        while (sizeInKb > 195 && scale > 0.1) {
          const currentWidth = Math.round(width * scale);
          const currentHeight = Math.round(height * scale);
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          }

          quality = 0.8;
          do {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            const head = 'data:image/jpeg;base64,'.length;
            sizeInKb = Math.round(((dataUrl.length - head) * 3) / 4 / 1024);
            quality -= 0.1;
          } while (sizeInKb > 195 && quality > 0.1);

          if (sizeInKb > 195) {
            scale -= 0.15; // scale down dimensions further if quality adjustment alone is insufficient
          }
        }

        setPhoto(dataUrl);
        setPhotoSize(sizeInKb);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhoto('');
    setPhotoSize(null);
    setOriginalPhotoSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isPdf = fileType === 'application/pdf';

    if (!isImage && !isPdf) {
      Swal.fire({
        icon: 'error',
        title: 'Format File Tidak Didukung',
        text: 'Harap unggah file sertifikat dalam format JPG/JPEG/PNG atau PDF.',
        confirmButtonColor: '#1d4ed8',
        width: '360px',
        timer: 5000,
        timerProgressBar: true
      });
      return;
    }

    // Limit to 100kb to keep Base64 strings manageable and fit requested limit
    if (file.size > 100 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran File Terlalu Besar',
        text: 'Maksimal ukuran file sertifikat adalah 100kb.',
        confirmButtonColor: '#1d4ed8',
        width: '360px',
        timer: 5000,
        timerProgressBar: true
      });
      return;
    }

    setCertificateFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCertificateFile(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelCert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCertificateFile('');
    setCertificateFileName('');
    if (certInputRef.current) {
      certInputRef.current.value = '';
    }
  };

  // Extract Grade from selected Class
  const getGrade = (selectedClass: string): string => {
    const cls = selectedClass.toUpperCase().trim();
    if (cls.startsWith('VII') || cls.startsWith('7') || cls.includes('KELAS VII') || cls.includes('KELAS 7')) return 'VII';
    if (cls.startsWith('VIII') || cls.startsWith('8') || cls.includes('KELAS VIII') || cls.includes('KELAS 8')) return 'VIII';
    if (cls.startsWith('IX') || cls.startsWith('9') || cls.includes('KELAS IX') || cls.includes('KELAS 9')) return 'IX';
    return '';
  };

  // Smart checking if student's selected class fits the eskul's allowed classes list
  const isClassEligible = (studentClass: string, allowedClasses: string[]): boolean => {
    if (!studentClass) return true;
    if (!allowedClasses || allowedClasses.length === 0) return true;

    const normalizedStudentClass = studentClass.trim().toUpperCase();
    
    // Extract student grade level
    const isStudent7 = normalizedStudentClass.startsWith('VII') || normalizedStudentClass.startsWith('7') || normalizedStudentClass.includes('KELAS VII') || normalizedStudentClass.includes('KELAS 7');
    const isStudent8 = normalizedStudentClass.startsWith('VIII') || normalizedStudentClass.startsWith('8') || normalizedStudentClass.includes('KELAS VIII') || normalizedStudentClass.includes('KELAS 8');
    const isStudent9 = normalizedStudentClass.startsWith('IX') || normalizedStudentClass.startsWith('9') || normalizedStudentClass.includes('KELAS IX') || normalizedStudentClass.includes('KELAS 9');

    for (const allowed of allowedClasses) {
      const normAllowed = allowed.trim().toUpperCase();
      if (!normAllowed) continue;
      
      // 1. Exact match
      if (normalizedStudentClass === normAllowed) return true;
      
      // 2. Substring match
      if (normalizedStudentClass.includes(normAllowed) || normAllowed.includes(normalizedStudentClass)) return true;

      // 3. Smart Roman/Arabic grade level match
      const isAllowed7 = normAllowed.startsWith('VII') || normAllowed.startsWith('7') || normAllowed.includes('KELAS VII') || normAllowed.includes('KELAS 7');
      const isAllowed8 = normAllowed.startsWith('VIII') || normAllowed.startsWith('8') || normAllowed.includes('KELAS VIII') || normAllowed.includes('KELAS 8');
      const isAllowed9 = normAllowed.startsWith('IX') || normAllowed.startsWith('9') || normAllowed.includes('KELAS IX') || normAllowed.includes('KELAS 9');

      if (isStudent7 && isAllowed7) return true;
      if (isStudent8 && isAllowed8) return true;
      if (isStudent9 && isAllowed9) return true;
    }

    return false;
  };

  // Filter extracurricular activities by eligibility and active school year
  const studentGrade = getGrade(kelas);
  const eligibleEskuls = eskulList.filter(eskul => {
    const matchYear = eskul.tahunPelajaran === tahunPelajaranAktif;
    if (!matchYear) return false;
    if (!kelas) return true; // Show all if class not selected yet
    return isClassEligible(kelas, eskul.kelasAllowed);
  });

  // Check if form is fully valid
  const isFormValid = () => {
    const basicValid = 
      name.trim() !== '' &&
      photo !== '' &&
      kelas !== '' &&
      jenisKelamin !== '' &&
      email.trim() !== '' &&
      email.trim().toLowerCase().endsWith('@gmail.com') &&
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
    
    // Detailed validation to show exact missing / incorrect fields using SweetAlert2
    const missing: string[] = [];
    
    if (!name.trim()) missing.push('Nama Lengkap');
    if (!photo) missing.push('Pas Foto');
    if (!kelas) missing.push('Kelas');
    if (!jenisKelamin) missing.push('Jenis Kelamin');
    if (!email.trim()) {
      missing.push('Email Siswa');
    } else if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      missing.push('Email harus @gmail.com');
    }
    if (!namaAyah.trim()) missing.push('Nama Ayah');
    if (!namaIbu.trim()) missing.push('Nama Ibu');
    if (!hpSiswa.trim()) missing.push('No. HP Siswa');
    if (!hpOrtu.trim()) missing.push('No. HP Ortu');
    if (!alamat.trim()) missing.push('Alamat Lengkap');
    if (!rt.trim()) missing.push('RT');
    if (!rw.trim()) missing.push('RW');
    if (!selectedProvinsi) missing.push('Provinsi');
    if (!selectedKabupaten) missing.push('Kota/Kabupaten');
    if (!selectedKecamatan) missing.push('Kecamatan');
    if (!selectedKelurahan) missing.push('Kelurahan/Desa');
    if (!selectedEskul) missing.push('Pilihan Eskul 1');

    if (hasAchievements) {
      if (!namaLomba.trim()) missing.push('Nama Lomba');
      if (!cabangLomba.trim()) missing.push('Cabang Lomba');
      if (!tingkatLomba) missing.push('Tingkat Lomba');
      if (!juaraKe) missing.push('Juara Ke');
      if (!penyelenggara.trim()) missing.push('Penyelenggara');
    }

    if (missing.length > 0) {
      const isEmailOnlyError = missing.length === 1 && missing[0] === 'Email harus @gmail.com';
      if (isEmailOnlyError) {
        Swal.fire({
          icon: 'warning',
          title: 'Format Email Salah',
          text: 'Harap gunakan alamat email aktif yang berakhiran @gmail.com.',
          confirmButtonColor: '#1d4ed8',
          width: '340px',
          timer: 5000,
          timerProgressBar: true
        });
        return;
      }

      const formattedList = missing.map(item => `<span class="inline-block bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-1 rounded-md border border-red-100">${item}</span>`).join(' ');
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        html: `
          <div class="text-left text-[11px] text-slate-600 space-y-2">
            <p class="font-bold text-slate-700">Silakan isi / lengkapi kolom wajib berikut:</p>
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${formattedList}
            </div>
          </div>
        `,
        showConfirmButton: false,
        width: '340px',
        timer: 5000,
        timerProgressBar: true
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
      width: '360px'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        const studentData: Omit<Student, 'id' | 'regNo' | 'createdAt'> = {
          name,
          photo,
          kelas,
          jenisKelamin: jenisKelamin as 'Laki-laki' | 'Perempuan',
          email: email.trim(),
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
          certificateFile: hasAchievements ? certificateFile : '',
          certificateFileName: hasAchievements ? certificateFileName : '',
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
          eskulId2: selectedEskul2?.id || '',
          eskulName2: selectedEskul2?.nama || '',
          tahunPelajaran: tahunPelajaranAktif
        };

        const res = await onSubmitRegistration(studentData);
        setRegisteredStudent(res);
        
        Swal.fire({
          icon: 'success',
          title: 'Pendaftaran Berhasil!',
          text: `Selamat, Anda berhasil terdaftar dengan Nomor: ${res.regNo}`,
          confirmButtonColor: '#1d4ed8',
          width: '360px'
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan Data',
          text: 'Terjadi masalah saat mengirim data ke server. Coba beberapa saat lagi.',
          confirmButtonColor: '#ef4444',
          width: '360px'
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
      width: '340px',
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

      // Draw Logo
      if (logoImgElement) {
        try {
          doc.addImage(logoImgElement, 'PNG', 15, 9, 20, 20);
        } catch (e) {
          console.error("Failed to add preloaded logo to PDF", e);
        }
      }

      // KOP SURAT Header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SMP PGRI JATIUWUNG', 114, 17, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Tahun Pelajaran ' + registeredStudent.tahunPelajaran, 114, 22, { align: 'center' });
      doc.text('Jl. Gatot Subroto KM. 5 No. 4 Jatiuwung Kota Tangerang', 114, 27, { align: 'center' });
      
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
      drawField('Email Siswa', registeredStudent.email || '-');
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

      if (registeredStudent.eskulName2) {
        drawField('Pilihan Ekstrakurikuler 1', registeredStudent.eskulName.toUpperCase(), true);
        drawField('Pilihan Ekstrakurikuler 2', registeredStudent.eskulName2.toUpperCase(), true);
      } else {
        drawField('Pilihan Ekstrakurikuler', registeredStudent.eskulName.toUpperCase(), true);
      }

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
        if (registeredStudent.certificateFile) {
          drawField('Sertifikat Lomba', 'Terlampir (Ada)');
        }
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
Eskul 1: ${registeredStudent.eskulName}${registeredStudent.eskulName2 ? `\nEskul 2: ${registeredStudent.eskulName2}` : ''}
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
        confirmButtonColor: '#1d4ed8',
        width: '360px',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (e) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'PDF Error',
        text: 'Gagal membuat dokumen bukti PDF.',
        confirmButtonColor: '#ef4444',
        width: '360px'
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
    setEmail('');
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
    setCertificateFile('');
    setCertificateFileName('');
    if (certInputRef.current) {
      certInputRef.current.value = '';
    }
    setAlamat('');
    setRt('');
    setRw('');
    
    // Reset back to Banten
    const banten = provinces.find(p => p.id === '36' || p.name.toUpperCase() === 'BANTEN');
    if (banten) {
      setSelectedProvinsi(banten);
      fetchKabupaten(banten.id).then(kabs => setKabupatens(kabs));
    } else {
      setSelectedProvinsi(null);
      setKabupatens([]);
    }
    setSelectedKabupaten(null);
    setKecamatans([]);
    setSelectedKecamatan(null);
    setKelurahans([]);
    setSelectedKelurahan(null);
    setSelectedEskul(null);
    setSelectedEskul2(null);
    setRegisteredStudent(null);
  };

  // If successfully registered, show the Success Screen
  if (registeredStudent) {
    return (
      <div className="bg-slate-50 min-h-[calc(100vh-4rem)] py-12 px-4 flex items-center justify-center w-full" id="registration-success-screen">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 max-w-xl w-full flex flex-col justify-center items-center p-8 md:p-10 text-center">
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
            {registeredStudent.eskulName2 ? (
              <>
                <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
                  <span className="text-xs text-blue-600 font-medium">Ekstrakurikuler 1</span>
                  <span className="text-sm font-bold text-blue-900">{registeredStudent.eskulName}</span>
                </div>
                <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
                  <span className="text-xs text-blue-600 font-medium">Ekstrakurikuler 2</span>
                  <span className="text-sm font-bold text-blue-900">{registeredStudent.eskulName2}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between border-b border-blue-100 pb-2 mb-2">
                <span className="text-xs text-blue-600 font-medium">Ekstrakurikuler</span>
                <span className="text-sm font-bold text-blue-900">{registeredStudent.eskulName}</span>
              </div>
            )}
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
              Download Formulir PDF Resmi
            </button>
            
            <button
              onClick={handleResetForm}
              id="btn-register-new"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Kembali / Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active form view
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-12 w-full" id="student-form-screen">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950 text-white pt-6 pb-12 sm:pt-8 sm:pb-14 px-3.5 sm:px-6 relative overflow-hidden shadow-md border-b border-slate-800">
        {/* Yellow artistic highlight */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-yellow-400 opacity-15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue-500 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-1.5 relative z-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-wide leading-tight">SMP PGRI JATIUWUNG</h1>
            <div className="text-[10px] sm:text-xs md:text-sm text-yellow-300 font-bold tracking-wider mt-0.5">
              Pendaftaran Ekstrakurikuler
            </div>
            <p className="text-[10px] sm:text-xs text-blue-200 font-extrabold tracking-wider uppercase mt-1 bg-blue-950/40 px-2.5 py-0.5 rounded-full inline-block">
              Tahun Pelajaran: <span className="text-yellow-300 font-mono font-black">{tahunPelajaranAktif}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Registration Form */}
      <div className="max-w-3xl mx-auto px-3 sm:px-6 -mt-5 sm:-mt-6 relative z-20">
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg sm:rounded-xl shadow-lg p-2.5 sm:p-4 md:p-5 space-y-3 sm:space-y-3.5 border border-slate-100">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4.5 items-start">
            
            {/* LEFT COLUMN: BIODATA & ESKUL */}
            <div className="space-y-3.5">
              <h2 className="text-[10px] sm:text-xs font-black text-blue-950 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-700" />
                Data Diri Pendaftar
              </h2>

              {/* Foto Siswa Upload & Compression */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">PAS FOTO <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden relative shadow-sm shrink-0"
                  >
                    {photo ? (
                      <>
                        <img src={photo} alt="Student preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleCancelPhoto}
                          className="absolute top-1 right-1 bg-red-600 border border-white text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-all duration-300 hover:scale-110 flex items-center justify-center z-20"
                          title="Hapus Foto"
                          id="btn-cancel-photo"
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 mb-0.5" />
                        <span className="text-[7px] sm:text-[8px] text-slate-400 text-center font-bold px-1">Pas Foto</span>
                      </>
                    )}
                    
                    {isCompressing && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mb-1"></span>
                        <span className="text-[7px] uppercase tracking-wider font-bold">Kompres...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                    <div className="text-[9px] sm:text-[8px] text-slate-400 font-normal leading-normal">
                      <p className="font-bold text-slate-500 mb-0.5">Syarat foto :</p>
                      <p>• Foto wajib berseragam sekolah.</p>
                      <p>• Maksimal ukuran Foto 200 kb</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">NAMA LENGKAP SISWA <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap Siswa" 
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Row: Kelas & Jenis Kelamin */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">KELAS <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <School className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={kelas}
                      onChange={(e) => {
                        setKelas(e.target.value);
                        setSelectedEskul(null); // Reset eskul selection as criteria may change
                        setSelectedEskul2(null);
                      }}
                      className="w-full pl-8 pr-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none"
                      required
                    >
                      <option value="">Pilih...</option>
                      {finalKelasList.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">JENIS KELAMIN <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value as any)}
                      className="w-full pl-8 pr-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none"
                      required
                    >
                      <option value="">Pilih...</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Email Siswa */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase">EMAIL SISWA <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama.siswa@gmail.com" 
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-semibold"
                    required
                  />
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-semibold">
                  * Harus diisi dengan alamat email aktif berakhiran <span className="text-blue-700 font-bold">@gmail.com</span>
                </p>
                {email && !email.toLowerCase().endsWith('@gmail.com') && (
                  <p className="text-[8px] sm:text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-1 bg-rose-50 border border-rose-100 p-1.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                    Format email harus berakhiran @gmail.com
                  </p>
                )}
              </div>

              {/* No. HP WhatsApp Siswa */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase">NO. WHATSAPP SISWA <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="tel" 
                    value={hpSiswa} 
                    onChange={(e) => setHpSiswa(e.target.value)}
                    placeholder="08xxxxxxxxxx" 
                    className="w-full pl-8 pr-2.5 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 transition-all duration-300 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Extracurricular Selection */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase">PILIH EKSTRAKURIKULER 1 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedEskul?.id || ''}
                    onChange={(e) => {
                      const eskul = eligibleEskuls.find(item => item.id === e.target.value) || null;
                      setSelectedEskul(eskul);
                      // Clear second if it is now identical or invalid
                      if (selectedEskul2 && selectedEskul2.id === e.target.value) {
                        setSelectedEskul2(null);
                      }
                    }}
                    className="w-full pl-8 pr-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none"
                    required
                    disabled={!kelas}
                  >
                    <option value="">{kelas ? '-- Pilih Ekstrakurikuler --' : 'Pilih Kelas terlebih dahulu...'}</option>
                    {eligibleEskuls.map(eskul => (
                      <option key={eskul.id} value={eskul.id}>
                        {eskul.nama}
                      </option>
                    ))}
                  </select>
                </div>
                {kelas && eligibleEskuls.length === 0 && (
                  <div className="text-[8px] sm:text-[9px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    Tidak ada eskul yang tersedia untuk kelas {studentGrade} di Tahun {tahunPelajaranAktif}.
                  </div>
                )}
              </div>

              {/* Extracurricular Selection 2 (Optional) */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase">PILIH EKSTRAKURIKULER 2 (Tidak Wajib)</label>
                <div className="relative">
                  <Award className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedEskul2?.id || ''}
                    onChange={(e) => {
                      const eskul = eligibleEskuls.find(item => item.id === e.target.value) || null;
                      setSelectedEskul2(eskul);
                    }}
                    className="w-full pl-8 pr-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold cursor-pointer appearance-none"
                    disabled={!kelas || !selectedEskul}
                  >
                    <option value="">{!kelas ? 'Pilih Kelas terlebih dahulu...' : !selectedEskul ? 'Pilih Ekstrakurikuler 1 terlebih dahulu...' : '-- Pilih Ekstrakurikuler 2 (Tidak Wajib) --'}</option>
                    {eligibleEskuls
                      .filter(eskul => eskul.id !== selectedEskul?.id)
                      .map(eskul => (
                        <option key={eskul.id} value={eskul.id}>
                          {eskul.nama}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORANG TUA, ALAMAT, PRESTASI */}
            <div className="space-y-3.5">
              <h2 className="text-[10px] sm:text-xs font-black text-blue-950 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-700" />
                Orang Tua & Alamat Rumah
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">NAMA AYAH <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={namaAyah} 
                    onChange={(e) => setNamaAyah(e.target.value)}
                    placeholder="Nama ayah kandung..." 
                    className="w-full px-2.5 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block">NAMA IBU <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={namaIbu} 
                    onChange={(e) => setNamaIbu(e.target.value)}
                    placeholder="Nama ibu kandung..." 
                    className="w-full px-2.5 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp Orang Tua */}
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-bold text-slate-700 block uppercase">NO. WHATSAPP ORANG TUA / WALI <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input 
                    type="tel" 
                    value={hpOrtu} 
                    onChange={(e) => setHpOrtu(e.target.value)}
                    placeholder="08xxxxxxxxxx" 
                    className="w-full pl-6.5 pr-2 py-1 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs focus:outline-none focus:border-blue-700 focus:bg-white text-slate-800 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Section: Alamat Lengkap */}
              <div className="space-y-2 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200/60">
                {/* Kampung/Perumahan */}
                <div className="space-y-1">
                  <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">KAMPUNG / PERUMAHAN <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={alamat} 
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Kp. Jatake RT 02, Jalan Pajajaran..." 
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-medium"
                    required
                  />
                </div>

                {/* RT & RW */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">RT <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={rt} 
                      onChange={(e) => setRt(e.target.value)}
                      placeholder="000" 
                      className="w-full px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-mono font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">RW <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={rw} 
                      onChange={(e) => setRw(e.target.value)}
                      placeholder="000" 
                      className="w-full px-2.5 py-1 bg-white border border-slate-100 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">PROVINSI <span className="text-red-500">*</span></label>
                    <select
                      value={selectedProvinsi?.id || ''}
                      onChange={(e) => handleProvinsiChange(e.target.value)}
                      disabled={true}
                      className="w-full px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 font-semibold cursor-not-allowed"
                      required
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">KOTA / KABUPATEN <span className="text-red-500">*</span></label>
                    <select
                      value={selectedKabupaten?.id || ''}
                      onChange={(e) => handleKabupatenChange(e.target.value)}
                      disabled={!selectedProvinsi}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Kota/Kabupaten --</option>
                      {kabupatens.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">KECAMATAN <span className="text-red-500">*</span></label>
                    <select
                      value={selectedKecamatan?.id || ''}
                      onChange={(e) => handleKecamatanChange(e.target.value)}
                      disabled={!selectedKabupaten}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {kecamatans.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[9px] font-bold text-slate-600 block">KELURAHAN / DESA <span className="text-red-500">*</span></label>
                    <select
                      value={selectedKelurahan?.id || ''}
                      onChange={(e) => handleKelurahanChange(e.target.value)}
                      disabled={!selectedKecamatan}
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Kelurahan --</option>
                      {kelurahans.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {isLoadingRegions && (
                  <div className="text-[8px] text-blue-700 font-bold animate-pulse text-center pt-1 flex items-center justify-center gap-1">
                    <span className="w-1 h-1 bg-blue-700 rounded-full animate-ping"></span>
                    Memuat Data Wilayah...
                  </div>
                )}
              </div>

              {/* Section: Prestasi Siswa */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] sm:text-[11px] font-black text-blue-800 tracking-wider uppercase flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-yellow-500" />
                    PRESTASI
                  </h3>
                  <span className="text-[8px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded-full uppercase">Tidak Wajib</span>
                </div>

                <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                  <input 
                    type="checkbox" 
                    id="checkbox-prestasi"
                    checked={hasAchievements}
                    onChange={(e) => setHasAchievements(e.target.checked)}
                    className="w-3 h-3 text-blue-700 border-slate-300 rounded focus:ring-blue-700 mt-0.5 cursor-pointer"
                  />
                  <div className="text-[11px] sm:text-xs">
                    <label htmlFor="checkbox-prestasi" className="font-bold text-slate-700 cursor-pointer block select-none">Siswa Memiliki Prestasi Khusus</label>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 leading-normal">Centang kotak ini untuk melampirkan piagam/prestasi lomba siswa di formulir.</p>
                  </div>
                </div>

                {hasAchievements && (
                  <div className="bg-slate-50/60 p-2.5 sm:p-3 rounded-lg border border-blue-100 space-y-2.5 transition-all duration-500 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">NAMA LOMBA <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={namaLomba} 
                        onChange={(e) => setNamaLomba(e.target.value)}
                        placeholder="Contoh: Lomba Pencak Silat Piala Walikota..." 
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">PENYELENGGARA <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={penyelenggara} 
                        onChange={(e) => setPenyelenggara(e.target.value)}
                        placeholder="Nama penyelenggara lomba..." 
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">CABANG LOMBA <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={cabangLomba} 
                        onChange={(e) => setCabangLomba(e.target.value)}
                        placeholder="Contoh: Tanding Kelas C Putra..." 
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">TINGKAT LOMBA <span className="text-red-500">*</span></label>
                      <select
                        value={tingkatLomba}
                        onChange={(e) => setTingkatLomba(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold cursor-pointer"
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

                    <div className="space-y-1">
                      <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">JUARA KE <span className="text-red-500">*</span></label>
                      <select
                        value={juaraKe}
                        onChange={(e) => setJuaraKe(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-700 text-slate-800 font-semibold cursor-pointer"
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

                    {/* Lampiran Sertifikat (JPG / PDF) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] sm:text-[9px] font-bold text-slate-700 block">LAMPIRAN SERTIFIKAT JUARA (JPG / PDF)</label>
                        {certificateFile && (
                          <span className="text-[8px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">Terlampir</span>
                        )}
                      </div>
                      <div className="relative border border-dashed border-slate-200 rounded-lg p-2.5 bg-white hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          ref={certInputRef}
                          onChange={handleCertUpload}
                          accept="image/jpeg,image/png,application/pdf"
                          className="hidden"
                          id="input-cert"
                        />
                        {certificateFile ? (
                          <div className="flex items-center justify-between gap-2 p-1 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              {certificateFile.startsWith('data:application/pdf') ? (
                                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              <span className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">{certificateFileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleCancelCert}
                              className="w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white flex items-center justify-center text-slate-600 transition-all shrink-0 cursor-pointer"
                              title="Hapus file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => certInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-blue-700 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Pilih Gambar / PDF (Maks. 100kb)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-registration"
              className="w-full md:max-w-xs mx-auto bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-[11px] sm:text-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                  Memproses Pendaftaran...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-yellow-300 uppercase" />
                  KIRIM PENDAFTARAN
                </>
              )}
            </button>
            <p className="text-[8px] sm:text-[9px] text-slate-400 text-center mt-2 font-semibold leading-normal max-w-sm mx-auto">
              Dengan mengirim pendaftaran, Anda menyatakan bahwa data di atas diisi dengan jujur, benar, dan bersedia mengikuti seluruh kegiatan esktrakurikuller SMP PGRI Jatiuwung.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
