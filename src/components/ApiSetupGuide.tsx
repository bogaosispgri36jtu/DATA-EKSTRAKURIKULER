/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Copy, Check, FileCode, HelpCircle, HardDrive, Share2, 
  Settings, Key, Layers, Users, BookOpen
} from 'lucide-react';

export default function ApiSetupGuide() {
  const [copied, setCopied] = useState(false);

  const gsCode = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEB APP API - BACKEND PENDAFTARAN EKSTAKURIKULER
 * SMP PGRI JATIUWUNG TANGERANG - BANTEN
 * =========================================================================
 * 
 * PETUNJUK PEMBUATAN SPREADSHEET:
 * Buat 1 Google Spreadsheet baru dengan 3 Sheet (Lembar) berikut:
 * 
 * 1. Sheet bernama "Settings"
 *    Kolom A: Key, Kolom B: Value
 *    Baris 1: Key=TahunPelajaranAktif, Value=2026/2027
 *    Baris 2: Key=AdminUsername, Value=admin
 *    Baris 3: Key=AdminPassword, Value=admin123
 * 
 * 2. Sheet bernama "Eskul"
 *    Kolom A: ID
 *    Kolom B: Nama
 *    Kolom C: KelasAllowed (Kombinasi dipisahkan koma, contoh: VII,VIII,IX)
 *    Kolom D: TahunPelajaran
 * 
 * 3. Sheet bernama "Siswa"
 *    Kolom A: ID
 *    Kolom B: RegNo
 *    Kolom C: Nama
 *    Kolom D: Photo (Base64)
 *    Kolom E: Kelas
 *    Kolom F: JenisKelamin
 *    Kolom G: NamaAyah
 *    Kolom H: NamaIbu
 *    Kolom I: HpSiswa
 *    Kolom J: HpOrtu
 *    Kolom K: PrestasiChecked (TRUE/FALSE)
 *    Kolom L: NamaLomba
 *    Kolom M: CabangLomba
 *    Kolom N: TingkatLomba
 *    Kolom O: JuaraKe
 *    Kolom P: Penyelenggara
 *    Kolom Q: Alamat
 *    Kolom R: RT
 *    Kolom S: RW
 *    Kolom T: ProvinsiId, Kolom U: ProvinsiName
 *    Kolom V: KabupatenId, Kolom W: KabupatenName
 *    Kolom X: KecamatanId, Kolom Y: KecamatanName
 *    Kolom Z: KelurahanId, Kolom AA: KelurahanName
 *    Kolom AB: EskulId, Kolom AC: EskulName
 *    Kolom AD: EskulId2, Kolom AE: EskulName2
 *    Kolom AF: TahunPelajaran
 *    Kolom AG: CreatedAt
 */

// CONFIGURATION: Jika script dibuat secara mandiri (standalone), isi ID Spreadsheet Anda di bawah ini
// Contoh: var SPREADSHEET_ID = "1bgSnunCItAfESxiLTeKgythJRRWqwQLZLEeZ5AzN5T0";
var SPREADSHEET_ID = "";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  throw new Error("Spreadsheet tidak terhubung! Silakan isi SPREADSHEET_ID di bagian paling atas kode Apps Script Anda.");
}

// Handle Request GET (Mengambil Data)
function doGet(e) {
  var response = {};
  try {
    var action = e.parameter.action;
    var ss = getSpreadsheet();
    
    // Inisialisasi Database jika kosong
    initDatabase(ss);
    
    if (action === "getData") {
      response = {
        status: "success",
        settings: getSettings(ss),
        eskul: getEskulList(ss),
        students: getStudentsList(ss)
      };
    } else {
      response = { status: "error", message: "Action tidak ditemukan!" };
    }
  } catch (error) {
    response = { status: "error", message: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle Request POST (Menyimpan / Mengubah Data)
function doPost(e) {
  var response = {};
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var ss = getSpreadsheet();
    
    initDatabase(ss);
    
    if (action === "registerStudent") {
      var student = saveStudent(ss, postData.data);
      response = { status: "success", data: student };
    } 
    else if (action === "addEskul") {
      var eskul = saveEskul(ss, postData.data);
      response = { status: "success", data: eskul };
    } 
    else if (action === "deleteEskul") {
      deleteEskul(ss, postData.id);
      response = { status: "success", message: "Eskul berhasil dihapus." };
    }
    else if (action === "resetEskulStudents") {
      resetEskulStudents(ss, postData.eskulId);
      response = { status: "success", message: "Data pendaftar eskul berhasil direset." };
    }
    else if (action === "resetAllData") {
      resetAllData(ss);
      response = { status: "success", message: "Seluruh database pendaftaran berhasil direset." };
    }
    else if (action === "updateSettings") {
      updateSettings(ss, postData.data);
      response = { status: "success", message: "Pengaturan berhasil diperbarui." };
    }
    else {
      response = { status: "error", message: "Action POST tidak ditemukan!" };
    }
  } catch (error) {
    response = { status: "error", message: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Inisialisasi Header Tabel jika belum dibuat
function initDatabase(ss) {
  var sheetSettings = ss.getSheetByName("Settings");
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet("Settings");
    sheetSettings.appendRow(["Key", "Value"]);
    sheetSettings.appendRow(["TahunPelajaranAktif", "2026/2027"]);
    sheetSettings.appendRow(["AdminUsername", "admin"]);
    sheetSettings.appendRow(["AdminPassword", "admin123"]);
  }
  
  var sheetEskul = ss.getSheetByName("Eskul");
  if (!sheetEskul) {
    sheetEskul = ss.insertSheet("Eskul");
    sheetEskul.appendRow(["ID", "Nama", "KelasAllowed", "TahunPelajaran"]);
    // Seed awal
    sheetEskul.appendRow(["eskul-1", "Pramuka (Wajib)", "VII,VIII,IX", "2026/2027"]);
    sheetEskul.appendRow(["eskul-2", "Paskibra", "VII,VIII,IX", "2026/2027"]);
    sheetEskul.appendRow(["eskul-3", "Futsal", "VII,VIII,IX", "2026/2027"]);
  }
  
  var sheetSiswa = ss.getSheetByName("Siswa");
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet("Siswa");
    sheetSiswa.appendRow([
      "ID", "RegNo", "Nama", "Photo", "Kelas", "JenisKelamin", "NamaAyah", "NamaIbu", 
      "HpSiswa", "HpOrtu", "PrestasiChecked", "NamaLomba", "CabangLomba", "TingkatLomba", 
      "JuaraKe", "Penyelenggara", "Alamat", "RT", "RW", "ProvinsiId", "ProvinsiName", 
      "KabupatenId", "KabupatenName", "KecamatanId", "KecamatanName", "KelurahanId", 
      "KelurahanName", "EskulId", "EskulName", "EskulId2", "EskulName2", "TahunPelajaran", "CreatedAt"
    ]);
  }
}

// Ambil Konfigurasi Settings
function getSettings(ss) {
  var sheet = ss.getSheetByName("Settings");
  var rows = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < rows.length; i++) {
    config[rows[i][0]] = rows[i][1];
  }
  return {
    tahunPelajaranAktif: config["TahunPelajaranAktif"] || "2026/2027",
    adminUsername: config["AdminUsername"] || "admin",
    adminPassword: config["AdminPassword"] || "admin123"
  };
}

// Ambil Daftar Eskul
function getEskulList(ss) {
  var sheet = ss.getSheetByName("Eskul");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var rows = sheet.getDataRange().getValues();
  var eskul = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    eskul.push({
      id: rows[i][0].toString(),
      nama: rows[i][1] ? rows[i][1].toString() : "",
      kelasAllowed: rows[i][2] ? rows[i][2].toString().split(",") : [],
      tahunPelajaran: rows[i][3] ? rows[i][3].toString() : ""
    });
  }
  return eskul;
}

// Ambil Daftar Siswa
function getStudentsList(ss) {
  var sheet = ss.getSheetByName("Siswa");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var rows = sheet.getDataRange().getValues();
  var students = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[0]) continue; // Skip baris kosong
    
    // Fungsi pembantu untuk mengambil data kolom secara aman
    var getVal = function(idx) {
      return (row[idx] !== undefined && row[idx] !== null) ? row[idx].toString() : "";
    };
    
    var eskulId = getVal(27);
    var eskulName = getVal(28);
    var eskulId2 = "";
    var eskulName2 = "";
    var tahunPelajaran = "";
    var createdAt = "";
    
    // Mendukung sheet dengan format 31 kolom (tanpa eskul pilihan ke-2) maupun 33 kolom (dengan eskul pilihan ke-2)
    if (row.length <= 31) {
      tahunPelajaran = getVal(29);
      createdAt = getVal(30);
    } else {
      eskulId2 = getVal(29);
      eskulName2 = getVal(30);
      tahunPelajaran = getVal(31);
      createdAt = getVal(32);
      
      // Fallback jika baris diisi format 31 kolom tapi baris memiliki sisa kolom kosong
      if (tahunPelajaran === "" && eskulId2.indexOf("/") !== -1) {
        tahunPelajaran = eskulId2;
        createdAt = eskulName2;
        eskulId2 = "";
        eskulName2 = "";
      }
    }
    
    students.push({
      id: getVal(0),
      regNo: getVal(1),
      name: getVal(2),
      photo: getVal(3),
      kelas: getVal(4),
      jenisKelamin: getVal(5),
      namaAyah: getVal(6),
      namaIbu: getVal(7),
      hpSiswa: getVal(8),
      hpOrtu: getVal(9),
      prestasiChecked: getVal(10) === "true" || getVal(10) === "TRUE" || row[10] === true,
      namaLomba: getVal(11),
      cabangLomba: getVal(12),
      tingkatLomba: getVal(13),
      juaraKe: getVal(14),
      penyelenggara: getVal(15),
      alamat: getVal(16),
      rt: getVal(17),
      rw: getVal(18),
      provinsiId: getVal(19),
      provinsiName: getVal(20),
      kabupatenId: getVal(21),
      kabupatenName: getVal(22),
      kecamatanId: getVal(23),
      kecamatanName: getVal(24),
      kelurahanId: getVal(25),
      kelurahanName: getVal(26),
      eskulId: eskulId,
      eskulName: eskulName,
      eskulId2: eskulId2,
      eskulName2: eskulName2,
      tahunPelajaran: tahunPelajaran,
      createdAt: createdAt
    });
  }
  return students;
}

// Simpan Data Siswa Pendaftar Baru & Generate No. Registrasi
function saveStudent(ss, s) {
  var sheet = ss.getSheetByName("Siswa");
  var lastRow = sheet.getLastRow();
  
  // Hitung jumlah pendaftar di tahun pelajaran yang sama untuk nomor urut
  var rows = sheet.getDataRange().getValues();
  var matchCount = 0;
  var targetYear = s.tahunPelajaran.split("/")[0]; // Ambil tahun awal saja (misal: 2026)
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var rowTahunPelajaran = "";
    if (row.length <= 31) {
      rowTahunPelajaran = row[29] ? row[29].toString() : "";
    } else {
      rowTahunPelajaran = row[31] ? row[31].toString() : "";
      if (rowTahunPelajaran === "" && row[29] && row[29].toString().indexOf("/") !== -1) {
        rowTahunPelajaran = row[29].toString();
      }
    }
    if (rowTahunPelajaran === s.tahunPelajaran) {
      matchCount++;
    }
  }
  
  // Format nomor urut: REG/TAHUN/00X (Contoh: REG/2026/001)
  var urutan = ("00" + (matchCount + 1)).slice(-3);
  var regNo = "REG/" + targetYear + "/" + urutan;
  var id = "student-" + Utilities.getUuid();
  var createdAt = new Date().toISOString();
  
  sheet.appendRow([
    id,
    regNo,
    s.name,
    s.photo,
    s.kelas,
    s.jenisKelamin,
    s.namaAyah,
    s.namaIbu,
    s.hpSiswa,
    s.hpOrtu,
    s.prestasiChecked,
    s.namaLomba,
    s.cabangLomba,
    s.tingkatLomba,
    s.juaraKe,
    s.penyelenggara,
    s.alamat,
    s.rt,
    s.rw,
    s.provinsiId,
    s.provinsiName,
    s.kabupatenId,
    s.kabupatenName,
    s.kecamatanId,
    s.kecamatanName,
    s.kelurahanId,
    s.kelurahanName,
    s.eskulId,
    s.eskulName,
    s.eskulId2 || "",
    s.eskulName2 || "",
    s.tahunPelajaran,
    createdAt
  ]);
  
  s.id = id;
  s.regNo = regNo;
  s.createdAt = createdAt;
  return s;
}

// Simpan Data Eskul Baru
function saveEskul(ss, e) {
  var sheet = ss.getSheetByName("Eskul");
  var id = "eskul-" + Utilities.getUuid();
  sheet.appendRow([
    id,
    e.nama,
    e.kelasAllowed.join(","),
    e.tahunPelajaran
  ]);
  e.id = id;
  return e;
}

// Hapus Eskul
function deleteEskul(ss, id) {
  var sheet = ss.getSheetByName("Eskul");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === id) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// Reset Pendaftar per Eskul tertentu
function resetEskulStudents(ss, eskulId) {
  var sheet = ss.getSheetByName("Siswa");
  var rows = sheet.getDataRange().getValues();
  // Lakukan iterasi dari bawah agar penghapusan baris tidak merusak indeks loop
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][27].toString() === eskulId) {
      sheet.deleteRow(i + 1);
    }
  }
}

// Reset Seluruh Data Siswa (Clean Database)
function resetAllData(ss) {
  var sheet = ss.getSheetByName("Siswa");
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

// Perbarui Konfigurasi Settings
function updateSettings(ss, config) {
  var sheet = ss.getSheetByName("Settings");
  var rows = sheet.getDataRange().getValues();
  
  if (config.tahunPelajaranAktif) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === "TahunPelajaranAktif") {
        sheet.getRange(i + 1, 2).setValue(config.tahunPelajaranAktif);
      }
    }
  }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12 max-w-md mx-auto px-4 py-6 space-y-6" id="api-setup-guide">
      
      {/* Introduction Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 space-y-3">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-blue-400">
          <BookOpen className="w-6 h-6 text-blue-700" />
        </div>
        
        <h1 className="text-lg font-black text-slate-800">Panduan Setup Backend</h1>
        <p className="text-xs text-slate-500 leading-normal">
          Aplikasi pendaftaran ini dirancang full-stack dinamis. Anda dapat menggunakan penyimpanan **Simulasi Lokal** bawaan atau menghubungkannya langsung ke **Google Sheets** sebagai database gratis dan permanen menggunakan Google Apps Script!
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Langkah Integrasi Cloud</h2>
        
        {/* Step 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">1</div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Siapkan Google Spreadsheet</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Buat sebuah Google Spreadsheet baru. Tambahkan atau ganti nama sheet utama di dalamnya menjadi 3 sheet dengan nama persis berikut:
            </p>
            <div className="flex gap-1.5 pt-1">
              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">Settings</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">Eskul</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">Siswa</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">2</div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-800">Buka Google Apps Script</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Pada menu navigasi atas Google Spreadsheet, buka menu <b>Ekstensi</b> → klik <b>Apps Script</b>. Hapus semua baris kode bawaan yang ada di editor.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">3</div>
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">Salin & Tempel Kode Backend</h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Kode
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Salin kode Google Apps Script (`kode.gs`) di bawah ini lalu tempelkan di halaman editor Apps Script Anda. Klik tombol simpan (ikon disket).
            </p>

            <div className="relative bg-slate-900 rounded-xl overflow-hidden mt-2 border border-slate-800 max-h-48 overflow-y-auto">
              <pre className="p-3 text-[10px] font-mono text-emerald-400 leading-tight">
                {gsCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">4</div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Deploy sebagai Web App API</h4>
            <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
              <p>1. Klik tombol <b>Terapkan (Deploy)</b> di bagian kanan atas editor Apps Script.</p>
              <p>2. Pilih <b>Penerapan baru (New deployment)</b>.</p>
              <p>3. Klik ikon gir (Pilih jenis penerapan) → pilih <b>Aplikasi web (Web app)</b>.</p>
              <p>4. Atur deskripsi singkat bebas, lalu pastikan parameter berikut diset tepat:</p>
              <ul className="list-disc list-inside pl-1 text-[10px] font-semibold text-slate-700 space-y-0.5">
                <li>Jalankan sebagai (Execute as): <b>Saya (Email Anda)</b></li>
                <li>Yang memiliki akses (Who has access): <b>Siapa saja (Anyone)</b></li>
              </ul>
              <p>5. Klik <b>Terapkan (Deploy)</b>. Berikan izin akses Google Drive Anda jika muncul permintaan otorisasi.</p>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center font-bold text-xs text-blue-700 shrink-0">5</div>
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800">Hubungkan Link API ke Aplikasi</h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Salin <b>URL Aplikasi Web</b> yang digenerate setelah penerapan selesai (contoh format: <code className="text-[10px] font-mono bg-slate-100 p-0.5 rounded break-all">https://script.google.com/macros/s/.../exec</code>).
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              Masuk ke <b>Dashboard Admin</b> → tab <b>Pengaturan</b>, lalu tempelkan link URL tersebut ke inputan Google Apps Script Sync URL dan simpan. 
            </p>
            <div className="bg-green-50 border border-green-200 text-green-800 text-[10px] font-bold p-2.5 rounded-xl flex items-center gap-1.5 mt-2">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span>Selesai! Aplikasi Anda sekarang sepenuhnya online dengan database Google Sheets nyata!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
