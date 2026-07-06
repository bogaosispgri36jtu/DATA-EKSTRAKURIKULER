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
 *    Kolom G: TempatLahir
 *    Kolom H: TanggalLahir
 *    Kolom I: NamaAyah
 *    Kolom J: NamaIbu
 *    Kolom K: HpSiswa
 *    Kolom L: HpOrtu
 *    Kolom M: Email
 *    Kolom N: PrestasiChecked (TRUE/FALSE)
 *    Kolom O: NamaLomba
 *    Kolom P: CabangLomba
 *    Kolom Q: TingkatLomba
 *    Kolom R: JuaraKe
 *    Kolom S: Penyelenggara
 *    Kolom T: Alamat
 *    Kolom U: RT
 *    Kolom V: RW
 *    Kolom W: ProvinsiId, Kolom X: ProvinsiName
 *    Kolom Y: KabupatenId, Kolom Z: KabupatenName
 *    Kolom AA: KecamatanId, Kolom AB: KecamatanName
 *    Kolom AC: KelurahanId, Kolom AD: KelurahanName
 *    Kolom AE: EskulId, Kolom AF: EskulName
 *    Kolom AG: EskulId2, Kolom AH: EskulName2
 *    Kolom AI: EskulId3, Kolom AJ: EskulName3
 *    Kolom AK: CertificateFile, Kolom AL: CertificateFileName
 *    Kolom AM: TahunPelajaran
 *    Kolom AN: CreatedAt
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

// Helper to extract nested/un-nested properties case-insensitively
function getPropCaseInsensitive(obj, keys) {
  if (!obj) return "";
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  // Try case-insensitive matching
  var lowerKeys = keys.map(function(k) { return k.toLowerCase(); });
  for (var prop in obj) {
    if (lowerKeys.indexOf(prop.toLowerCase()) !== -1) {
      return obj[prop];
    }
  }
  return "";
}

// Helper to automatically repair outdated headers if the user had an older schema
function repairHeadersIfNeeded(sheet, requiredHeaders) {
  if (!sheet) return;
  var lastCol = Math.max(1, sheet.getLastColumn());
  var currentHeaders = [];
  try {
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  } catch (err) {}
  
  // If we have fewer columns or headers are blank/mismatched, force set the headers
  if (currentHeaders.length < requiredHeaders.length || !currentHeaders[0]) {
    var maxCols = sheet.getMaxColumns();
    if (maxCols < requiredHeaders.length) {
      sheet.insertColumnsAfter(maxCols, requiredHeaders.length - maxCols);
    }
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
      "ID", "RegNo", "Nama", "Photo", "Kelas", "JenisKelamin", "TempatLahir", "TanggalLahir",
      "NamaAyah", "NamaIbu", "HpSiswa", "HpOrtu", "Email", "PrestasiChecked", "NamaLomba", "CabangLomba",
      "TingkatLomba", "JuaraKe", "Penyelenggara", "Alamat", "RT", "RW", "ProvinsiId", "ProvinsiName", 
      "KabupatenId", "KabupatenName", "KecamatanId", "KecamatanName", "KelurahanId", 
      "KelurahanName", "EskulId", "EskulName", "EskulId2", "EskulName2", "EskulId3", "EskulName3", 
      "CertificateFile", "CertificateFileName", "TahunPelajaran", "CreatedAt"
    ]);
  } else {
    repairHeadersIfNeeded(sheetSiswa, [
      "ID", "RegNo", "Nama", "Photo", "Kelas", "JenisKelamin", "TempatLahir", "TanggalLahir",
      "NamaAyah", "NamaIbu", "HpSiswa", "HpOrtu", "Email", "PrestasiChecked", "NamaLomba", "CabangLomba",
      "TingkatLomba", "JuaraKe", "Penyelenggara", "Alamat", "RT", "RW", "ProvinsiId", "ProvinsiName", 
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
  if (rows.length === 0) return [];
  
  var headers = rows[0].map(function(h) { return h ? h.toString().toLowerCase().trim() : ""; });
  var students = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row || !row[0]) continue;
    
    var student = {};
    
    // Helper untuk mengambil nilai secara aman dengan mencocokkan header
    var getVal = function(names) {
      for (var j = 0; j < names.length; j++) {
        var idx = headers.indexOf(names[j]);
        if (idx !== -1 && idx < row.length) {
          return row[idx];
        }
      }
      return "";
    };
    
    student.id = getVal(["id"]).toString();
    student.regNo = getVal(["regno", "no. registrasi", "noreg", "no registrasi"]).toString();
    student.nama = getVal(["nama", "name"]).toString();
    student.name = student.nama;
    student.photo = getVal(["photo", "foto"]).toString();
    student.kelas = getVal(["kelas"]).toString();
    student.jenisKelamin = getVal(["jeniskelamin", "jenis kelamin"]).toString();
    student.tempatLahir = getVal(["tempatlahir", "tempat lahir"]).toString();
    student.tanggalLahir = getVal(["tanggallahir", "tanggal lahir"]).toString();
    student.namaAyah = getVal(["namaayah", "nama ayah"]).toString();
    student.namaIbu = getVal(["namaibu", "nama ibu", "namalbu"]).toString();
    student.hpSiswa = getVal(["hpsiswa", "hp siswa", "no. hp siswa"]).toString();
    student.hpOrtu = getVal(["hportu", "hp ortu", "no. hp orang tua"]).toString();
    student.email = getVal(["email"]).toString();
    
    var prest = getVal(["prestasichecked", "prestasi"]);
    student.prestasiChecked = (prest === true || prest === "TRUE" || prest === "true");
    
    student.namaLomba = getVal(["namalomba", "nama lomba"]).toString();
    student.cabangLomba = getVal(["cabanglomba", "cabang lomba"]).toString();
    student.tingkatLomba = getVal(["tingkatlomba", "tingkat lomba"]).toString();
    student.juaraKe = getVal(["juarake", "juara ke"]).toString();
    student.penyelenggara = getVal(["penyelenggara"]).toString();
    student.alamat = getVal(["alamat"]).toString();
    student.rt = getVal(["rt"]).toString();
    student.rw = getVal(["rw"]).toString();
    student.provinsiId = getVal(["provinsiid", "provinsi id"]).toString();
    student.provinsiName = getVal(["provinsiname", "provinsi name", "provinsi"]).toString();
    student.kabupatenId = getVal(["kabupatenid", "kabupaten id"]).toString();
    student.kabupatenName = getVal(["kabupatenname", "kabupaten name", "kabupaten"]).toString();
    student.kecamatanId = getVal(["kecamatanid", "kecamatan id"]).toString();
    student.kecamatanName = getVal(["kecamatanname", "kecamatan name", "kecamatan"]).toString();
    student.kelurahanId = getVal(["kelurahanid", "kelurahan id"]).toString();
    student.kelurahanName = getVal(["kelurahanname", "kelurahan name", "kelurahan"]).toString();
    student.eskulId = getVal(["eskulid", "eskul id"]).toString();
    student.eskulName = getVal(["eskulname", "eskul name"]).toString();
    student.eskulId2 = getVal(["eskulid2", "eskul id 2"]).toString();
    student.eskulName2 = getVal(["eskulname2", "eskul name 2"]).toString();
    student.eskulId3 = getVal(["eskulid3", "eskul id 3"]).toString();
    student.eskulName3 = getVal(["eskulname3", "eskul name 3"]).toString();
    student.certificateFile = getVal(["certificatefile", "certificate file"]).toString();
    student.certificateFileName = getVal(["certificatefilename", "certificate file name"]).toString();
    student.tahunPelajaran = getVal(["tahunpelajaran", "tahun pelajaran"]).toString();
    student.createdAt = getVal(["createdat", "created at"]).toString();
    
    students.push(student);
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
  var headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  
  // Format No. WhatsApp
  var hpSiswaVal = getPropCaseInsensitive(s, ["hpSiswa", "hp_siswa", "hpsiswa", "hp siswa", "noHpSiswa", "no_hp_siswa"]) || "";
  var hpOrtuVal = getPropCaseInsensitive(s, ["hpOrtu", "hp_ortu", "hportu", "hp ortu", "noHpOrtu", "no_hp_ortu", "noHpOrangTua", "no_hp_orang_tua"]) || "";
  var formattedHpSiswa = formatToIndoPhone(hpSiswaVal);
  var formattedHpOrtu = formatToIndoPhone(hpOrtuVal);
  
  // Hitung jumlah pendaftar di tahun pelajaran yang sama untuk nomor urut
  var rows = sheet.getDataRange().getValues();
  var matchCount = 0;
  var targetTP = getPropCaseInsensitive(s, ["tahunPelajaran", "tahun_pelajaran", "tahunpelajaran", "tahun pelajaran"]) || "2026/2027";
  var targetYear = targetTP.replace(/\D/g, "");
  if (!targetYear) targetYear = "20262027";
  
  // Cari indeks kolom Tahun Pelajaran untuk pencocokan urutan
  var tpIndex = -1;
  for (var k = 0; k < headers.length; k++) {
    var h = headers[k].toString().toLowerCase().trim();
    if (h === "tahunpelajaran" || h === "tahun pelajaran") {
      tpIndex = k;
      break;
    }
  }
  
  for (var i = 1; i < rows.length; i++) {
    if (tpIndex !== -1 && rows[i][tpIndex] && rows[i][tpIndex].toString() === targetTP) {
      matchCount++;
    }
  }
  
  var urutan = ("00" + (matchCount + 1)).slice(-3);
  var regNo = "eskul/" + targetYear + "/" + urutan;
  var id = "REG-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  var createdAt = new Date().toISOString();
  
  // Susun baris baru secara dinamis menyesuaikan header kolom yang ada
  var newRow = [];
  for (var c = 0; c < headers.length; c++) {
    var header = headers[c].toString().toLowerCase().trim();
    var val = "";
    
    if (header === "id") val = id;
    else if (header === "regno" || header === "no. registrasi" || header === "noreg" || header === "no registrasi") val = regNo;
    else if (header === "nama" || header === "name") val = getPropCaseInsensitive(s, ["nama", "name", "namaSiswa", "nama_lengkap"]);
    else if (header === "photo" || header === "foto") val = getPropCaseInsensitive(s, ["photo", "foto", "photoSiswa"]);
    else if (header === "kelas") val = getPropCaseInsensitive(s, ["kelas", "class"]);
    else if (header === "jeniskelamin" || header === "jenis kelamin") val = getPropCaseInsensitive(s, ["jenisKelamin", "jenis_kelamin", "jeniskelamin", "jenis kelamin", "gender"]);
    else if (header === "tempatlahir" || header === "tempat lahir") val = getPropCaseInsensitive(s, ["tempatLahir", "tempat_lahir", "tempatlahir", "tempat lahir"]);
    else if (header === "tanggallahir" || header === "tanggal lahir") val = getPropCaseInsensitive(s, ["tanggalLahir", "tanggal_lahir", "tanggallahir", "tanggal lahir"]);
    else if (header === "namaayah" || header === "nama ayah") val = getPropCaseInsensitive(s, ["namaAyah", "nama_ayah", "namaayah", "nama ayah", "ayah"]);
    else if (header === "namaibu" || header === "nama ibu" || header === "namalbu") val = getPropCaseInsensitive(s, ["namaIbu", "nama_ibu", "namaibu", "nama ibu", "ibu"]);
    else if (header === "hpsiswa" || header === "hp siswa" || header === "no. hp siswa") val = formattedHpSiswa;
    else if (header === "hportu" || header === "hp ortu" || header === "no. hp orang tua") val = formattedHpOrtu;
    else if (header === "email") val = getPropCaseInsensitive(s, ["email", "Email", "emailSiswa", "email_siswa"]);
    else if (header === "prestasichecked" || header === "prestasi") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? "TRUE" : "FALSE";
    }
    else if (header === "namalomba" || header === "nama lomba") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["namaLomba", "nama_lomba", "namalomba", "nama lomba"]) : "";
    }
    else if (header === "cabanglomba" || header === "cabang lomba") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["cabangLomba", "cabang_lomba", "cabanglomba", "cabang lomba"]) : "";
    }
    else if (header === "tingkatlomba" || header === "tingkat lomba") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["tingkatLomba", "tingkat_lomba", "tingkatlomba", "tingkat lomba"]) : "";
    }
    else if (header === "juarake" || header === "juara ke") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["juaraKe", "juara_ke", "juarake", "juara ke"]) : "";
    }
    else if (header === "penyelenggara") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["penyelenggara", "penyelenggaraLomba"]) : "";
    }
    else if (header === "alamat") val = getPropCaseInsensitive(s, ["alamat", "alamatLengkap"]);
    else if (header === "rt") val = getPropCaseInsensitive(s, ["rt"]);
    else if (header === "rw") val = getPropCaseInsensitive(s, ["rw"]);
    else if (header === "provinsiid" || header === "provinsi id") val = getPropCaseInsensitive(s, ["provinsiId", "provinsi_id"]);
    else if (header === "provinsiname" || header === "provinsi name" || header === "provinsi") val = getPropCaseInsensitive(s, ["provinsiName", "provinsi_name", "provinsi"]);
    else if (header === "kabupatenid" || header === "kabupaten id") val = getPropCaseInsensitive(s, ["kabupatenId", "kabupaten_id"]);
    else if (header === "kabupatenname" || header === "kabupaten name" || header === "kabupaten") val = getPropCaseInsensitive(s, ["kabupatenName", "kabupaten_name", "kabupaten"]);
    else if (header === "kecamatanid" || header === "kecamatan id") val = getPropCaseInsensitive(s, ["kecamatanId", "kecamatan_id"]);
    else if (header === "kecamatanname" || header === "kecamatan name" || header === "kecamatan") val = getPropCaseInsensitive(s, ["kecamatanName", "kecamatan_name", "kecamatan"]);
    else if (header === "kelurahanid" || header === "kelurahan id") val = getPropCaseInsensitive(s, ["kelurahanId", "kelurahan_id"]);
    else if (header === "kelurahanname" || header === "kelurahan name" || header === "kelurahan") val = getPropCaseInsensitive(s, ["kelurahanName", "kelurahan_name", "kelurahan"]);
    else if (header === "eskulid" || header === "eskul id") val = getPropCaseInsensitive(s, ["eskulId", "eskul_id"]);
    else if (header === "eskulname" || header === "eskul name") val = getPropCaseInsensitive(s, ["eskulName", "eskul_name", "eskul"]);
    else if (header === "eskulid2" || header === "eskul id 2") val = getPropCaseInsensitive(s, ["eskulId2", "eskul_id_2"]);
    else if (header === "eskulname2" || header === "eskul name 2") val = getPropCaseInsensitive(s, ["eskulName2", "eskul_name_2", "eskul2"]);
    else if (header === "eskulid3" || header === "eskul id 3") val = getPropCaseInsensitive(s, ["eskulid3", "eskul_id_3", "eskulId3"]);
    else if (header === "eskulname3" || header === "eskul name 3") val = getPropCaseInsensitive(s, ["eskulname3", "eskul_name_3", "eskulName3"]);
    else if (header === "certificatefile" || header === "certificate file") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["certificateFile", "certificate_file", "certificatefile"]) : "";
    }
    else if (header === "certificatefilename" || header === "certificate file name") {
      var prest = getPropCaseInsensitive(s, ["prestasiChecked", "prestasi_checked", "prestasichecked", "prestasi"]);
      val = (prest === true || prest === "TRUE" || prest === "true") ? getPropCaseInsensitive(s, ["certificateFileName", "certificate_file_name", "certificatefilename"]) : "";
    }
    else if (header === "tahunpelajaran" || header === "tahun pelajaran") val = targetTP;
    else if (header === "createdat" || header === "created at") val = createdAt;
    
    newRow.push(val === undefined || val === null ? "" : val);
  }
  
  sheet.appendRow(newRow);
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
    var eskul1 = rows[i][30] ? rows[i][30].toString() : "";
    var eskul2 = rows[i][32] ? rows[i][32].toString() : "";
    var eskul3 = rows[i][34] ? rows[i][34].toString() : "";
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

// Helper to get sheet with case-insensitive name matching
function getSheetCaseInsensitive(ss, name) {
  var sheets = ss.getSheets();
  var targetLower = name.toLowerCase().trim();
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName().toLowerCase().trim();
    if (sheetName === targetLower) {
      return sheets[i];
    }
  }
  return null;
}
