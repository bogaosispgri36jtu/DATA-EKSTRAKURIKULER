-- 1. Buat Tabel Pilihan Ekstrakurikuler
CREATE TABLE IF NOT EXISTS eskul (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  "kelasAllowed" TEXT[],
  "tahunPelajaran" TEXT NOT NULL
);

-- 2. Buat Tabel Daftar Kelas
CREATE TABLE IF NOT EXISTS classes (
  name TEXT PRIMARY KEY
);

-- 3. Buat Tabel Akun Administrator
CREATE TABLE IF NOT EXISTS admins (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  status TEXT NOT NULL,
  "namaLengkap" TEXT
);

-- 4. Buat Tabel Pendaftar Siswa (Lengkap dengan seluruh field Formulir)
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

-- 5. Aktifkan Row Level Security (RLS) pada seluruh Tabel
ALTER TABLE eskul ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 6. Buat Kebijakan Akses (Security Policy) agar API dan Publik dapat beroperasi secara penuh
-- Kebijakan untuk tabel: eskul
DROP POLICY IF EXISTS "Allow public select eskul" ON eskul;
CREATE POLICY "Allow public select eskul" ON eskul FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert eskul" ON eskul;
CREATE POLICY "Allow public insert eskul" ON eskul FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update eskul" ON eskul;
CREATE POLICY "Allow public update eskul" ON eskul FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete eskul" ON eskul;
CREATE POLICY "Allow public delete eskul" ON eskul FOR DELETE USING (true);

-- Kebijakan untuk tabel: classes
DROP POLICY IF EXISTS "Allow public select classes" ON classes;
CREATE POLICY "Allow public select classes" ON classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert classes" ON classes;
CREATE POLICY "Allow public insert classes" ON classes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update classes" ON classes;
CREATE POLICY "Allow public update classes" ON classes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete classes" ON classes;
CREATE POLICY "Allow public delete classes" ON classes FOR DELETE USING (true);

-- Kebijakan untuk tabel: admins
DROP POLICY IF EXISTS "Allow public select admins" ON admins;
CREATE POLICY "Allow public select admins" ON admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert admins" ON admins;
CREATE POLICY "Allow public insert admins" ON admins FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update admins" ON admins;
CREATE POLICY "Allow public update admins" ON admins FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete admins" ON admins;
CREATE POLICY "Allow public delete admins" ON admins FOR DELETE USING (true);

-- Kebijakan untuk tabel: students
DROP POLICY IF EXISTS "Allow public select students" ON students;
CREATE POLICY "Allow public select students" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert students" ON students;
CREATE POLICY "Allow public insert students" ON students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update students" ON students;
CREATE POLICY "Allow public update students" ON students FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete students" ON students;
CREATE POLICY "Allow public delete students" ON students FOR DELETE USING (true);