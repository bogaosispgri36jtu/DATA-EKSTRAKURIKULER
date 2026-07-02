/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEB APP API - BACKEND PENDAFTARAN EKSTRAKURIKULER
 * SMP PGRI JATIUWUNG TANGERANG - BANTEN
 * =========================================================================
 * 
 * PETUNJUK PEMBUATAN SPREADSHEET:
 * Buat 1 Google Spreadsheet baru dengan 5 Sheet (Lembar) berikut:
 * 
 * 1. Sheet bernama "Settings"
 *    Kolom A: Key, Kolom B: Value
 *    Baris 1: Key=TahunPelajaranAktif, Value=2026/2027
 * 
 * 2. Sheet bernama "Admin"
 *    Kolom A: ID, Kolom B: Username, Kolom C: Password, Kolom D: Status, Kolom E: CreatedAt
 *    Isi baris dengan daftar akun admin yang Anda inginkan (Status: Utama atau Biasa)
 * 
 * 3. Sheet bernama "Eskul"
 *    Kolom A: ID
 *    Kolom B: NamaEskul
 *    Kolom C: KelasAllowed (Kombinasi dipisahkan koma, contoh: VII,VIII,IX)
 *    Kolom D: TahunPelajaran
 * 
 * 4. Sheet bernama "Siswa"
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
 *    Kolom AF: EskulId3, Kolom AG: EskulName3
 *    Kolom AH: CertificateFile, Kolom AI: CertificateFileName
 *    Kolom AJ: TahunPelajaran
 *    Kolom AK: CreatedAt
 * 
 * 5. Sheet bernama "Kelas" (Opsional, untuk kustomisasi daftar kelas di luar VII, VIII, IX)
 *    Kolom A: Nama Kelas (Baris 1 berisi judul "Nama Kelas", baris berikutnya berisi nama-nama kelas)
 */

// KOSONGKAN jika script ini ditautkan langsung di Spreadsheet Anda (Extensions -> Apps Script).
// Jika berupa Script Standalone (terpisah), isi dengan ID Spreadsheet Anda.
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

// Format phone number to start with +62
function formatToIndoPhone(num) {
  if (!num) return "";
  var clean = num.toString().replace(/\D/g, "");
  if (clean.indexOf("0") === 0) {
    clean = "62" + clean.substring(1);
  } else if (clean.indexOf("8") === 0) {
    clean = "62" + clean;
  } else if (clean.indexOf("62") !== 0) {
    clean = "62" + clean;
  }
  return "+" + clean;
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

// Helper to automatically repair outdated headers if the user had an older schema
function repairHeadersIfNeeded(sheet, requiredHeaders) {
  if (!sheet) return;
  var lastCol = Math.max(1, sheet.getLastColumn());
  var range = sheet.getRange(1, 1, 1, lastCol);
  var currentHeaders = range.getValues()[0];
  
  // If we have fewer columns or headers are blank/mismatched, force set the headers
  if (currentHeaders.length < requiredHeaders.length || !currentHeaders[0]) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  }
}

// Inisialisasi Header Tabel jika belum dibuat
function initDatabase(ss) {
  var sheetSettings = getSheetCaseInsensitive(ss, "Settings");
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet("Settings");
    sheetSettings.appendRow(["Key", "Value"]);
    sheetSettings.appendRow(["TahunPelajaranAktif", "2026/2027"]);
  } else {
    repairHeadersIfNeeded(sheetSettings, ["Key", "Value"]);
  }
  
  var sheetAdmin = getSheetCaseInsensitive(ss, "Admin");
  if (!sheetAdmin) {
    sheetAdmin = ss.insertSheet("Admin");
    sheetAdmin.appendRow(["ID", "Username", "Password", "Status", "CreatedAt"]);
  } else {
    repairHeadersIfNeeded(sheetAdmin, ["ID", "Username", "Password", "Status", "CreatedAt"]);
  }
  
  var sheetEskul = getSheetCaseInsensitive(ss, "Eskul");
  if (!sheetEskul) {
    sheetEskul = ss.insertSheet("Eskul");
    sheetEskul.appendRow(["ID", "NamaEskul", "KelasAllowed", "TahunPelajaran"]);
    // Seed awal
    sheetEskul.appendRow(["eskul-1", "Pramuka (Wajib)", "VII,VIII,IX", "2026/2027"]);
    sheetEskul.appendRow(["eskul-2", "Paskibra", "VII,VIII,IX", "2026/2027"]);
    sheetEskul.appendRow(["eskul-3", "Futsal", "VII,VIII,IX", "2026/2027"]);
  } else {
    repairHeadersIfNeeded(sheetEskul, ["ID", "NamaEskul", "KelasAllowed", "TahunPelajaran"]);
  }
  
  var sheetSiswa = getSheetCaseInsensitive(ss, "Siswa");
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet("Siswa");
    sheetSiswa.appendRow([
      "ID", "RegNo", "Nama", "Photo", "Kelas", "JenisKelamin", "NamaAyah", "NamaIbu", 
      "HpSiswa", "HpOrtu", "PrestasiChecked", "NamaLomba", "CabangLomba", "TingkatLomba", 
      "JuaraKe", "Penyelenggara", "Alamat", "RT", "RW", "ProvinsiId", "ProvinsiName", 
      "KabupatenId", "KabupatenName", "KecamatanId", "KecamatanName", "KelurahanId", 
      "KelurahanName", "EskulId", "EskulName", "EskulId2", "EskulName2", "EskulId3", "EskulName3", 
      "CertificateFile", "CertificateFileName", "TahunPelajaran", "CreatedAt"
    ]);
  } else {
    repairHeadersIfNeeded(sheetSiswa, [
      "ID", "RegNo", "Nama", "Photo", "Kelas", "JenisKelamin", "NamaAyah", "NamaIbu", 
      "HpSiswa", "HpOrtu", "PrestasiChecked", "NamaLomba", "CabangLomba", "TingkatLomba", 
      "JuaraKe", "Penyelenggara", "Alamat", "RT", "RW", "ProvinsiId", "ProvinsiName", 
      "KabupatenId", "KabupatenName", "KecamatanId", "KecamatanName", "KelurahanId", 
      "KelurahanName", "EskulId", "EskulName", "EskulId2", "EskulName2", "EskulId3", "EskulName3", 
      "CertificateFile", "CertificateFileName", "TahunPelajaran", "CreatedAt"
    ]);
  }
  
  var sheetKelas = getSheetCaseInsensitive(ss, "Kelas");
  if (!sheetKelas) {
    sheetKelas = ss.insertSheet("Kelas");
    sheetKelas.appendRow(["Nama Kelas"]);
    sheetKelas.appendRow(["VII-1"]);
    sheetKelas.appendRow(["VII-2"]);
    sheetKelas.appendRow(["VIII-1"]);
    sheetKelas.appendRow(["VIII-2"]);
    sheetKelas.appendRow(["IX-1"]);
    sheetKelas.appendRow(["IX-2"]);
  } else {
    repairHeadersIfNeeded(sheetKelas, ["Nama Kelas"]);
  }
}

function getSettings(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Settings");
  var rows = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < rows.length; i++) {
    config[rows[i][0]] = rows[i][1];
  }
  return {
    tahunPelajaranAktif: config["TahunPelajaranAktif"] || "2026/2027"
  };
}

// Ambil Daftar Eskul
function getEskulList(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Eskul");
  var rows = sheet.getDataRange().getValues();
  var eskul = [];
  for (var i = 1; i < rows.length; i++) {
    var idVal = rows[i][0];
    var namaVal = rows[i][1];
    var kelasAllowedVal = rows[i][2];
    var tpVal = rows[i][3];
    
    if (idVal && namaVal) {
      eskul.push({
        id: idVal.toString(),
        nama: namaVal.toString(),
        kelasAllowed: kelasAllowedVal ? kelasAllowedVal.toString().split(",") : [],
        tahunPelajaran: tpVal ? tpVal.toString() : "2026/2027"
      });
    }
  }
  return eskul;
}

// Ambil Daftar Siswa
function getStudentsList(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Siswa");
  var rows = sheet.getDataRange().getValues();
  var students = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0]) {
      students.push({
        id: rows[i][0].toString(),
        regNo: rows[i][1].toString(),
        nama: rows[i][2].toString(),
        photo: rows[i][3] ? rows[i][3].toString() : "",
        kelas: rows[i][4].toString(),
        jenisKelamin: rows[i][5].toString(),
        namaAyah: rows[i][6].toString(),
        namaIbu: rows[i][7].toString(),
        hpSiswa: rows[i][8].toString(),
        hpOrtu: rows[i][9].toString(),
        prestasiChecked: rows[i][10] === true || rows[i][10] === "TRUE" || rows[i][10] === "true",
        namaLomba: rows[i][11] ? rows[i][11].toString() : "",
        cabangLomba: rows[i][12] ? rows[i][12].toString() : "",
        tingkatLomba: rows[i][13] ? rows[i][13].toString() : "",
        juaraKe: rows[i][14] ? rows[i][14].toString() : "",
        penyelenggara: rows[i][15] ? rows[i][15].toString() : "",
        alamat: rows[i][16] ? rows[i][16].toString() : "",
        rt: rows[i][17] ? rows[i][17].toString() : "",
        rw: rows[i][18] ? rows[i][18].toString() : "",
        provinsiId: rows[i][19] ? rows[i][19].toString() : "",
        provinsiName: rows[i][20] ? rows[i][20].toString() : "",
        kabupatenId: rows[i][21] ? rows[i][21].toString() : "",
        kabupatenName: rows[i][22] ? rows[i][22].toString() : "",
        kecamatanId: rows[i][23] ? rows[i][23].toString() : "",
        kecamatanName: rows[i][24] ? rows[i][24].toString() : "",
        kelurahanId: rows[i][25] ? rows[i][25].toString() : "",
        kelurahanName: rows[i][26] ? rows[i][26].toString() : "",
        eskulId: rows[i][27] ? rows[i][27].toString() : "",
        eskulName: rows[i][28] ? rows[i][28].toString() : "",
        eskulId2: rows[i][29] ? rows[i][29].toString() : "",
        eskulName2: rows[i][30] ? rows[i][30].toString() : "",
        eskulId3: rows[i][31] ? rows[i][31].toString() : "",
        eskulName3: rows[i][32] ? rows[i][32].toString() : "",
        certificateFile: rows[i][33] ? rows[i][33].toString() : "",
        certificateFileName: rows[i][34] ? rows[i][34].toString() : "",
        tahunPelajaran: rows[i][35] ? rows[i][35].toString() : "",
        createdAt: rows[i][36] ? rows[i][36].toString() : ""
      });
    }
  }
  return students;
}

// Ambil Daftar Kelas dari Sheet Kelas
function getClassList(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Kelas");
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return [];
  
  var rows = sheet.getDataRange().getValues();
  var classes = [];
  var startIdx = 0;
  
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

// Ambil Daftar Admin
function getAdminsList(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Admin");
  var rows = sheet.getDataRange().getValues();
  if (rows.length === 0) return [];
  
  var admins = [];
  var headers = rows[0].map(function(h) { return h ? h.toString().toLowerCase().trim() : ""; });
  
  var idIdx = headers.indexOf("id");
  
  var userIdx = headers.indexOf("username");
  if (userIdx === -1) userIdx = headers.indexOf("nama pengguna");
  if (userIdx === -1) userIdx = headers.indexOf("user");
  if (userIdx === -1) userIdx = headers.indexOf("nama");
  if (userIdx === -1) userIdx = headers.indexOf("akun");
  
  var passIdx = headers.indexOf("password");
  if (passIdx === -1) passIdx = headers.indexOf("kata sandi");
  if (passIdx === -1) passIdx = headers.indexOf("pass");
  if (passIdx === -1) passIdx = headers.indexOf("sandi");
  if (passIdx === -1) passIdx = headers.indexOf("pin");
  
  var statusIdx = headers.indexOf("status");
  if (statusIdx === -1) statusIdx = headers.indexOf("role");
  
  var createdIdx = headers.indexOf("createdat");
  if (createdIdx === -1) createdIdx = headers.indexOf("created at");
  if (createdIdx === -1) createdIdx = headers.indexOf("tanggal dibuat");
  
  var startIdx = 1;
  
  if (userIdx === -1 && passIdx === -1) {
    startIdx = 0;
    
    var numCols = rows[0].length;
    if (numCols === 1) {
      userIdx = 0;
    } else if (numCols === 2) {
      userIdx = 0;
      passIdx = 1;
    } else if (numCols === 3) {
      userIdx = 0;
      passIdx = 1;
      statusIdx = 2;
    } else {
      idIdx = 0;
      userIdx = 1;
      passIdx = 2;
      statusIdx = 3;
      createdIdx = 4;
    }
  } else {
    if (userIdx === -1) userIdx = (idIdx === 0) ? 1 : 0;
    if (passIdx === -1) passIdx = (userIdx === 1) ? 2 : 1;
  }
  
  for (var i = startIdx; i < rows.length; i++) {
    var row = rows[i];
    if (!row) continue;
    
    var u = (userIdx !== -1 && userIdx < row.length) ? row[userIdx].toString().trim() : "";
    var p = (passIdx !== -1 && passIdx < row.length) ? row[passIdx].toString().trim() : "";
    
    if (u) {
      var id = (idIdx !== -1 && idIdx < row.length && row[idIdx]) ? row[idIdx].toString().trim() : "admin-" + i;
      var s = (statusIdx !== -1 && statusIdx < row.length && row[statusIdx]) ? row[statusIdx].toString().trim() : "Biasa";
      var c = (createdIdx !== -1 && createdIdx < row.length && row[createdIdx]) ? row[createdIdx].toString().trim() : new Date().toISOString();
      
      if (u.toLowerCase() === "admin") {
        s = "Utama";
      }
      
      admins.push({
        id: id,
        username: u,
        password: p,
        status: s,
        createdAt: c
      });
    }
  }
  return admins;
}

// Simpan Data Pendaftaran Siswa Baru
function saveStudent(ss, s) {
  var sheet = getSheetCaseInsensitive(ss, "Siswa");
  
  // Hitung jumlah pendaftar di tahun pelajaran yang sama untuk nomor urut
  var rows = sheet.getDataRange().getValues();
  var matchCount = 0;
  var targetYear = s.tahunPelajaran.split("/")[0]; // Ambil tahun awal saja (misal: 2026)
  
  for (var i = 1; i < rows.length; i++) {
    // Indeks ke-35 di layout baru adalah TahunPelajaran
    if (rows[i][35] && rows[i][35].toString() === s.tahunPelajaran) {
      matchCount++;
    }
  }
  
  // Format nomor urut: REG/TAHUN/00X (Contoh: REG/2026/001)
  var urutan = ("00" + (matchCount + 1)).slice(-3);
  var regNo = "REG/" + targetYear + "/" + urutan;
  var id = "REG-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  var createdAt = new Date().toISOString();
  
  // Ambil data dan pastikan format No. WhatsApp sudah menggunakan +62
  var formattedHpSiswa = formatToIndoPhone(s.hpSiswa || s.hpSiswa);
  var formattedHpOrtu = formatToIndoPhone(s.hpOrtu || s.hpOrtu);
  
  sheet.appendRow([
    id,
    regNo,
    s.nama || s.name,
    s.photo || "",
    s.kelas,
    s.jenisKelamin,
    s.namaAyah,
    s.namaIbu,
    formattedHpSiswa,
    formattedHpOrtu,
    (s.prestasiChecked === true || s.prestasiChecked === "TRUE" || s.prestasiChecked === "true") ? "TRUE" : "FALSE",
    s.namaLomba || "",
    s.cabangLomba || "",
    s.tingkatLomba || "",
    s.juaraKe || "",
    s.penyelenggara || "",
    s.alamat || "",
    s.rt || "",
    s.rw || "",
    s.provinsiId || "",
    s.provinsiName || "",
    s.kabupatenId || "",
    s.kabupatenName || "",
    s.kecamatanId || "",
    s.kecamatanName || "",
    s.kelurahanId || "",
    s.kelurahanName || "",
    s.eskulId || "",
    s.eskulName || "",
    s.eskulId2 || "",
    s.eskulName2 || "",
    s.eskulId3 || "",
    s.eskulName3 || "",
    s.certificateFile || "",
    s.certificateFileName || "",
    s.tahunPelajaran,
    createdAt
  ]);
  
  return { id: id, regNo: regNo, hpSiswa: formattedHpSiswa, hpOrtu: formattedHpOrtu, createdAt: createdAt, ...s };
}

// Simpan Ekstrakurikuler Baru
function saveEskul(ss, e) {
  var sheet = getSheetCaseInsensitive(ss, "Eskul");
  var id = "eskul-" + Date.now();
  sheet.appendRow([
    id,
    e.nama,
    e.kelasAllowed.join(","),
    e.tahunPelajaran
  ]);
  return { id: id, ...e };
}

// Hapus Ekstrakurikuler
function deleteEskul(ss, id) {
  var sheet = getSheetCaseInsensitive(ss, "Eskul");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// Reset Pendaftar Per Eskul
function resetEskulStudents(ss, eskulId) {
  var sheet = getSheetCaseInsensitive(ss, "Siswa");
  var rows = sheet.getDataRange().getValues();
  // Loop terbalik agar indeks baris tidak bergeser saat dihapus
  for (var i = rows.length - 1; i >= 1; i--) {
    var eskul1 = rows[i][27] ? rows[i][27].toString() : "";
    var eskul2 = rows[i][29] ? rows[i][29].toString() : "";
    var eskul3 = rows[i][31] ? rows[i][31].toString() : "";
    if (eskul1 === eskulId || eskul2 === eskulId || eskul3 === eskulId) {
      sheet.deleteRow(i + 1);
    }
  }
}

// Reset Seluruh Database Siswa Pendaftar
function resetAllData(ss) {
  var sheet = getSheetCaseInsensitive(ss, "Siswa");
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

// Update Konfigurasi Settings
function updateSettings(ss, config) {
  var sheet = getSheetCaseInsensitive(ss, "Settings");
  var rows = sheet.getDataRange().getValues();
  
  var activeTpUpdated = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === "TahunPelajaranAktif") {
      sheet.getRange(i + 1, 2).setValue(config.tahunPelajaranAktif);
      activeTpUpdated = true;
      break;
    }
  }
  if (!activeTpUpdated) {
    sheet.appendRow(["TahunPelajaranAktif", config.tahunPelajaranAktif]);
  }
}

// Simpan Admin Baru ke Sheet
function saveAdmin(ss, admin) {
  var sheet = getSheetCaseInsensitive(ss, "Admin");
  var id = "admin-" + Date.now();
  var createdAt = new Date().toISOString();
  sheet.appendRow([
    id,
    admin.username,
    admin.password,
    admin.status || "Biasa",
    createdAt
  ]);
  return { id: id, username: admin.username, password: admin.password, status: admin.status || "Biasa", createdAt: createdAt };
}

// Hapus Admin dari Sheet
function deleteAdmin(ss, username) {
  var sheet = getSheetCaseInsensitive(ss, "Admin");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1].toString().toLowerCase().trim() === username.toLowerCase().trim()) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}
