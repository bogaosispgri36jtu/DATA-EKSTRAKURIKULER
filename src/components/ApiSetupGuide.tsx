/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Copy, Check, FileCode, HelpCircle, HardDrive, Share2, 
  Settings, Key, Layers, Users, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';

export default function ApiSetupGuide() {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const gsCode = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEB APP API - BACKEND PENDAFTARAN EKSTAKURIKULER
 * SMP PGRI JATIUWUNG TANGERANG - BANTEN
 * =========================================================================
 * 
 * PETUNJUK PEMBUATAN SPREADSHEET:
 * Buat 1 Google Spreadsheet baru dengan 4 Sheet (Lembar) berikut:
 * 
 * 1. Sheet bernama "Settings"
 *    Kolom A: Key, Kolom B: Value
 *    Baris 1: Key=TahunPelajaranAktif, Value=2026/2027
 * 
 * 2. Sheet bernama "Admin"
 *    Kolom A: Username, Kolom B: Password, Kolom C: Status
 *    Baris 1: Username=admin, Password=admin123, Status=Admin Utama (Secara default)
 * 
 * 3. Sheet bernama "Eskul"
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
        students: getStudentsList(ss),
        classes: getClassList(ss),
        admins: getAdminsList(ss)
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
    else if (action === "addAdmin") {
      var admin = saveAdmin(ss, postData.data);
      response = { status: "success", data: admin };
    }
    else if (action === "deleteAdmin") {
      deleteAdmin(ss, postData.username);
      response = { status: "success", message: "Admin berhasil dihapus." };
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
  }
  
  var sheetAdmin = ss.getSheetByName("Admin");
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet("Admin");
    sheetAdmin.appendRow(["Username", "Password", "Status"]);
    sheetAdmin.appendRow(["admin", "admin123", "Admin Utama"]);
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
  
  var sheetKelas = ss.getSheetByName("Kelas");
  if (!sheetKelas) {
    sheetKelas = ss.insertSheet("Kelas");
    sheetKelas.appendRow(["Nama Kelas"]);
    sheetKelas.appendRow(["VII-1"]);
    sheetKelas.appendRow(["VII-2"]);
    sheetKelas.appendRow(["VII-3"]);
    sheetKelas.appendRow(["VIII-1"]);
    sheetKelas.appendRow(["VIII-2"]);
    sheetKelas.appendRow(["VIII-3"]);
    sheetKelas.appendRow(["IX-1"]);
    sheetKelas.appendRow(["IX-2"]);
    sheetKelas.appendRow(["IX-3"]);
  }
}

// Ambil Daftar Kelas dari Sheet Kelas
function getClassList(ss) {
  var sheet = ss.getSheetByName("Kelas");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  
  var rows = sheet.getDataRange().getValues();
  var classes = [];
  var startIdx = 0;
  
  // Deteksi header secara cerdas
  var firstCell = rows[0][0] ? rows[0][0].toString().toLowerCase() : "";
  if (firstCell === "id" || firstCell === "nama" || firstCell === "kelas" || firstCell === "nama kelas") {
    startIdx = 1;
  }
  
  for (var i = startIdx; i < rows.length; i++) {
    var val = rows[i][0];
    if (val !== undefined && val !== null) {
      var valStr = val.toString().trim();
      if (valStr) {
        classes.push(valStr);
      }
    }
  }
  return classes;
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
    tahunPelajaranAktif: config["TahunPelajaranAktif"] || "2026/2027"
  };
}

// Ambil Daftar Admin dari Sheet Admin
function getAdminsList(ss) {
  var sheet = ss.getSheetByName("Admin");
  if (!sheet) return [{ username: "admin", password: "admin123", status: "Admin Utama" }];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [{ username: "admin", password: "admin123", status: "Admin Utama" }];
  
  var rows = sheet.getDataRange().getValues();
  var admins = [];
  for (var i = 1; i < rows.length; i++) {
    var u = rows[i][0] ? rows[i][0].toString().trim() : "";
    var p = rows[i][1] ? rows[i][1].toString().trim() : "";
    var s = rows[i][2] ? rows[i][2].toString().trim() : "Admin Biasa";
    if (u) {
      if (u.toLowerCase() === "admin") {
        s = "Admin Utama";
      }
      admins.push({ username: u, password: p, status: s });
    }
  }
  return admins;
}

// Ambil Daftar Eskul
function getEskulList(ss) {
  var sheet = ss.getSheetByName("Eskul");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length === 0) return [];
  
  var eskul = [];
  var startIdx = 1;
  
  // Deteksi header secara cerdas
  var headers = rows[0].map(function(h) { return h ? h.toString().toLowerCase().trim() : ""; });
  var idColIdx = headers.indexOf("id");
  var namaColIdx = headers.indexOf("nama");
  if (namaColIdx === -1) namaColIdx = headers.indexOf("nama eskul");
  if (namaColIdx === -1) namaColIdx = headers.indexOf("ekstrakurikuler");
  var kelasColIdx = headers.indexOf("kelasallowed");
  if (kelasColIdx === -1) kelasColIdx = headers.indexOf("kelas");
  if (kelasColIdx === -1) kelasColIdx = headers.indexOf("rombel");
  var tahunColIdx = headers.indexOf("tahunpelajaran");
  if (tahunColIdx === -1) tahunColIdx = headers.indexOf("tahun");
  
  // Jika tidak ada baris header yang cocok sama sekali
  var firstCell = rows[0][0] ? rows[0][0].toString().toLowerCase() : "";
  if (firstCell !== "id" && firstCell !== "nama" && firstCell !== "nama eskul" && firstCell !== "ekstrakurikuler") {
    startIdx = 0;
  }
  
  // Fallback index kolom
  if (namaColIdx === -1) {
    idColIdx = 0;
    namaColIdx = 1;
    kelasColIdx = 2;
    tahunColIdx = 3;
  }
  
  for (var i = startIdx; i < rows.length; i++) {
    var row = rows[i];
    if (!row) continue;
    
    // Ambil nama eskul
    var namaVal = "";
    if (namaColIdx < row.length && row[namaColIdx]) {
      namaVal = row[namaColIdx].toString().trim();
    } else if (row[0] && idColIdx === -1) {
      namaVal = row[0].toString().trim();
    }
    
    if (!namaVal) continue; // Lewati baris jika nama eskul kosong
    
    // Ambil ID atau buat otomatis
    var idVal = "";
    if (idColIdx !== -1 && idColIdx < row.length && row[idColIdx]) {
      idVal = row[idColIdx].toString().trim();
    }
    if (!idVal) {
      idVal = "eskul-" + i;
    }
    
    // Ambil rombel kelas
    var kelasVal = [];
    if (kelasColIdx !== -1 && kelasColIdx < row.length && row[kelasColIdx]) {
      var kStr = row[kelasColIdx].toString().trim();
      kelasVal = kStr.split(/[,/]/).map(function(x) { return x.trim().toUpperCase(); }).filter(Boolean);
    }
    if (kelasVal.length === 0) {
      kelasVal = ["VII", "VIII", "IX"]; // Fallback jika kosong
    }
    
    // Ambil tahun pelajaran
    var tahunVal = "2026/2027";
    if (tahunColIdx !== -1 && tahunColIdx < row.length && row[tahunColIdx]) {
      tahunVal = row[tahunColIdx].toString().trim();
    }
    
    eskul.push({
      id: idVal,
      nama: namaVal,
      kelasAllowed: kelasVal,
      tahunPelajaran: tahunVal
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

// Simpan Data Admin Baru
function saveAdmin(ss, admin) {
  var sheet = ss.getSheetByName("Admin");
  if (!sheet) {
    sheet = ss.insertSheet("Admin");
    sheet.appendRow(["Username", "Password", "Status"]);
  }
  var statusVal = admin.status || "Admin Biasa";
  sheet.appendRow([
    admin.username,
    admin.password,
    statusVal
  ]);
  return { username: admin.username, password: admin.password, status: statusVal };
}

// Hapus Admin
function deleteAdmin(ss, username) {
  var sheet = ss.getSheetByName("Admin");
  if (!sheet) return;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toString().toLowerCase().trim() === username.toLowerCase().trim()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
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
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6" id="api-setup-guide">
      
      {/* Introduction Card Header */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 cursor-pointer hover:bg-slate-50/50 -m-6 p-6 rounded-t-2xl transition-all select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
            <BookOpen className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Panduan Setup Backend (Google Sheets)</h3>
            <p className="text-xs text-slate-500 leading-normal mt-0.5">
              Gunakan penyimpanan **Simulasi Lokal** bawaan atau hubungkan langsung ke **Google Sheets** sebagai database gratis dan permanen menggunakan Google Apps Script!
            </p>
          </div>
        </div>
        
        <button 
          type="button"
          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl transition-all self-start sm:self-center shrink-0"
        >
          {isExpanded ? (
            <>
              <span>Sembunyikan Panduan</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Tampilkan Panduan</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Steps List (Collapsible) */}
      {isExpanded && (
        <div className="space-y-5 pt-1 animate-fadeIn">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Langkah Integrasi Cloud</h4>
          
          {/* Step 1 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">1</div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Salin & Tempel Kode Backend</h5>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="flex items-center gap-1.5 text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-all cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
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
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Salin kode Google Apps Script (`kode.gs`) di bawah ini, lalu buka menu <b>Ekstensi</b> → <b>Apps Script</b> di Google Spreadsheet Anda, hapus semua kode bawaan, dan tempelkan kode ini. Jangan lupa klik tombol Simpan (ikon disket).
              </p>

              <div className="relative bg-slate-900 rounded-xl overflow-hidden mt-3 border border-slate-800 max-h-48 overflow-y-auto">
                <pre className="p-3 text-[10px] font-mono text-emerald-400 leading-tight">
                  {gsCode}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">2</div>
            <div className="space-y-1.5">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Deploy sebagai Web App API</h5>
              <div className="text-[11px] text-slate-500 leading-relaxed space-y-1.5">
                <p>1. Klik tombol <b>Terapkan (Deploy)</b> di bagian kanan atas editor Apps Script.</p>
                <p>2. Pilih <b>Penerapan baru (New deployment)</b>.</p>
                <p>3. Klik ikon gir (Pilih jenis penerapan) → pilih <b>Aplikasi web (Web app)</b>.</p>
                <p>4. Konfigurasi setelan berikut agar aplikasi dapat diakses dengan benar:</p>
                <ul className="list-disc list-inside pl-1 text-[10px] font-semibold text-slate-700 space-y-1 bg-white p-2.5 rounded-xl border border-slate-100">
                  <li>Jalankan sebagai (Execute as): <span className="text-blue-700">Saya (Email Anda)</span></li>
                  <li>Yang memiliki akses (Who has access): <span className="text-blue-700">Siapa saja (Anyone)</span></li>
                </ul>
                <p>5. Klik <b>Terapkan (Deploy)</b>. Berikan izin akses Google Drive Anda jika muncul permintaan otorisasi akun Google.</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">3</div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Hubungkan Link API ke Aplikasi</h5>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Salin <b>URL Aplikasi Web</b> yang digenerate oleh Google (contoh format: <code className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded break-all">https://script.google.com/macros/s/.../exec</code>).
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tempelkan link tersebut pada inputan <b>GOOGLE APPS SCRIPT WEB APP URL</b> di atas, lalu tekan tombol <b>Simpan Pengaturan</b>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold p-3 rounded-xl flex items-start gap-2.5 mt-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Selesai! Aplikasi Anda sekarang terintegrasi secara real-time dengan database Google Sheets nyata!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
