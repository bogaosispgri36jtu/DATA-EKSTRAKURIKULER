/**
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
 *    Kolom AD: TahunPelajaran
 *    Kolom AE: CreatedAt
 */

// Handle Request GET (Mengambil Data)
function doGet(e) {
  var response = {};
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
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
      "KelurahanName", "EskulId", "EskulName", "TahunPelajaran", "CreatedAt"
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
  var rows = sheet.getDataRange().getValues();
  var eskul = [];
  for (var i = 1; i < rows.length; i++) {
    eskul.push({
      id: rows[i][0].toString(),
      nama: rows[i][1].toString(),
      kelasAllowed: rows[i][2].toString().split(","),
      tahunPelajaran: rows[i][3].toString()
    });
  }
  return eskul;
}

// Ambil Daftar Siswa
function getStudentsList(ss) {
  var sheet = ss.getSheetByName("Siswa");
  var rows = sheet.getDataRange().getValues();
  var students = [];
  for (var i = 1; i < rows.length; i++) {
    students.push({
      id: rows[i][0].toString(),
      regNo: rows[i][1].toString(),
      name: rows[i][2].toString(),
      photo: rows[i][3] ? rows[i][3].toString() : "",
      kelas: rows[i][4].toString(),
      jenisKelamin: rows[i][5].toString(),
      namaAyah: rows[i][6].toString(),
      namaIbu: rows[i][7].toString(),
      hpSiswa: rows[i][8].toString(),
      hpOrtu: rows[i][9].toString(),
      prestasiChecked: rows[i][10] === true || rows[i][10] === "TRUE",
      namaLomba: rows[i][11] ? rows[i][11].toString() : "",
      cabangLomba: rows[i][12] ? rows[i][12].toString() : "",
      tingkatLomba: rows[i][13] ? rows[i][13].toString() : "",
      juaraKe: rows[i][14] ? rows[i][14].toString() : "",
      penyelenggara: rows[i][15] ? rows[i][15].toString() : "",
      alamat: rows[i][16].toString(),
      rt: rows[i][17].toString(),
      rw: rows[i][18].toString(),
      provinsiId: rows[i][19].toString(),
      provinsiName: rows[i][20].toString(),
      kabupatenId: rows[i][21].toString(),
      kabupatenName: rows[i][22].toString(),
      kecamatanId: rows[i][23].toString(),
      kecamatanName: rows[i][24].toString(),
      kelurahanId: rows[i][25].toString(),
      kelurahanName: rows[i][26].toString(),
      eskulId: rows[i][27].toString(),
      eskulName: rows[i][28].toString(),
      tahunPelajaran: rows[i][29].toString(),
      createdAt: rows[i][30].toString()
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
    if (rows[i][29].toString() === s.tahunPelajaran) {
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
