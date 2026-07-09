import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const settingsFilePath = path.join(process.cwd(), "settings.json");

  const defaultSettings = {
    googleAppsScriptUrl: "",
    tahunPelajaranAktif: "2026/2027",
    isPublished: true,
    dbProvider: "gas", // "gas" or "supabase"
    supabaseUrl: "",
    supabaseAnonKey: ""
  };

  const getSettings = () => {
    try {
      if (fs.existsSync(settingsFilePath)) {
        const data = fs.readFileSync(settingsFilePath, "utf8");
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Error reading settings.json", e);
    }
    return { ...defaultSettings };
  };

  // API Route to get shared settings
  app.get("/api/settings", (req, res) => {
    try {
      if (fs.existsSync(settingsFilePath)) {
        const data = fs.readFileSync(settingsFilePath, "utf8");
        return res.json(JSON.parse(data));
      }
    } catch (e) {
      console.error("Error reading settings.json, returning default:", e);
    }
    return res.json(defaultSettings);
  });

  // API Route to save shared settings
  app.post("/api/settings", (req, res) => {
    try {
      const newSettings = req.body;
      fs.writeFileSync(settingsFilePath, JSON.stringify(newSettings, null, 2), "utf8");
      return res.json({ status: "success", settings: newSettings });
    } catch (e: any) {
      console.error("Error writing settings.json:", e);
      return res.status(500).json({ status: "error", message: e.toString() });
    }
  });

  // API Route to proxy Google Apps Script requests to avoid browser CORS/firewall blocks
  app.get("/api/proxy-image", async (req, res) => {
    try {
      let imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ status: "error", message: "URL parameter required" });
      }

      // Convert Google Drive view URL to direct image link if detected
      if (imageUrl.includes("drive.google.com")) {
        const matches = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (matches && matches[1]) {
          const fileId = matches[1];
          imageUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        }
      }

      console.log(`[Proxy Image] Fetching image from: ${imageUrl}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).json({ status: "error", message: `Failed to fetch image: ${response.statusText}` });
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const contentType = response.headers.get("content-type") || "image/png";

      return res.json({
        status: "success",
        contentType,
        base64: `data:${contentType};base64,${base64}`
      });
    } catch (err: any) {
      console.error("[Proxy Image Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || err.toString() });
    }
  });

  // API Route to proxy Google Apps Script requests to avoid browser CORS/firewall blocks
  app.all("/api/gas", async (req, res) => {
    try {
      const currentSettings = getSettings();
      const forceGas = req.query.forceGas === "true" || req.body?.forceGas === "true";
      const isSupabase = currentSettings.dbProvider === "supabase" && !forceGas;

      if (isSupabase) {
        const supabaseUrl = currentSettings.supabaseUrl || process.env.SUPABASE_URL;
        const supabaseAnonKey = currentSettings.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          return res.status(400).json({ 
            status: "error", 
            message: "Supabase URL atau Anon Key belum dikonfigurasi di Pengaturan." 
          });
        }

        console.log(`[Supabase Engine] Connecting to Supabase: ${supabaseUrl}`);
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Extract action from query or body
        const action = (req.query.action || req.body?.action) as string;

        if (action === "getData") {
          let studentsList = [];
          let eskulList = [];
          let classesList = [];
          let adminsList = [];
          let isSchemaIncomplete = false;

          const { data: stData, error: stErr } = await supabase.from("students").select("*");
          if (stErr) {
            console.log(`[Supabase Schema Check] Table 'students' not found or inaccessible (Code: ${stErr.code || 'unknown'}).`);
            if (stErr.code === "42P01" || stErr.message?.includes("relation")) isSchemaIncomplete = true;
          } else {
            studentsList = stData || [];
          }

          const { data: esData, error: esErr } = await supabase.from("eskul").select("*");
          if (esErr) {
            console.log(`[Supabase Schema Check] Table 'eskul' not found or inaccessible (Code: ${esErr.code || 'unknown'}).`);
            if (esErr.code === "42P01" || esErr.message?.includes("relation")) isSchemaIncomplete = true;
          } else {
            eskulList = esData || [];
          }

          const { data: clData, error: clErr } = await supabase.from("classes").select("*");
          if (clErr) {
            console.log(`[Supabase Schema Check] Table 'classes' not found or inaccessible (Code: ${clErr.code || 'unknown'}).`);
            if (clErr.code === "42P01" || clErr.message?.includes("relation")) isSchemaIncomplete = true;
          } else {
            classesList = clData ? clData.map((c: any) => c.name) : [];
          }

          const { data: adData, error: adErr } = await supabase.from("admins").select("*");
          if (adErr) {
            console.log(`[Supabase Schema Check] Table 'admins' not found or inaccessible (Code: ${adErr.code || 'unknown'}).`);
            if (adErr.code === "42P01" || adErr.message?.includes("relation")) isSchemaIncomplete = true;
          } else {
            adminsList = adData || [];
          }

          return res.json({
            status: "success",
            students: studentsList,
            eskul: eskulList,
            classes: classesList,
            admins: adminsList,
            isSchemaIncomplete,
            settings: {
              tahunPelajaranAktif: currentSettings.tahunPelajaranAktif,
              isPublished: currentSettings.isPublished
            }
          });
        } 
        
        if (action === "registerStudent") {
          const studentObj = req.body.data;
          if (!studentObj) {
            return res.status(400).json({ status: "error", message: "Data siswa wajib diisi." });
          }

          // Count existing for sequence
          const { data: existing, error: countErr } = await supabase
            .from("students")
            .select("id")
            .eq("tahunPelajaran", studentObj.tahunPelajaran);
          
          if (countErr) {
            console.error("Failed to query existing students for reg sequence", countErr);
          }

          const seq = (existing?.length || 0) + 1;
          const seqStr = String(seq).padStart(3, "0");
          const targetYear = studentObj.tahunPelajaran.replace(/\D/g, "");
          const regNo = `eskul/${targetYear}/${seqStr}`;
          const id = `student-${Math.random().toString(36).substr(2, 9)}`;

          // Ensure eskulId values are valid references or NULL
          const validEskulIds = new Set<string>();
          try {
            const { data: dbEskul } = await supabase.from("eskul").select("id");
            if (dbEskul) {
              dbEskul.forEach((es: any) => {
                if (es && es.id) validEskulIds.add(es.id);
              });
            }
          } catch (err) {
            console.error("Error pre-fetching eskul ids during student registration:", err);
          }

          const getValidEskulIdOrNull = (val: any) => {
            if (!val) return null;
            const strId = String(val).trim();
            if (strId === "" || strId.toLowerCase() === "null" || strId.toLowerCase() === "undefined") return null;
            return validEskulIds.has(strId) ? strId : null;
          };

          const newStudent = {
            id,
            regNo,
            ...studentObj,
            eskulId: getValidEskulIdOrNull(studentObj.eskulId),
            eskulId2: getValidEskulIdOrNull(studentObj.eskulId2),
            eskulId3: getValidEskulIdOrNull(studentObj.eskulId3),
            createdAt: new Date().toISOString()
          };

          const { data: inserted, error: insertErr } = await supabase.from("students").insert([newStudent]).select();
          if (insertErr) {
            console.error("Supabase student insertion failed:", insertErr);
            return res.status(500).json({ status: "error", message: insertErr.message });
          }

          // Forward to Google Apps Script if URL is configured
          let gasUrl = currentSettings.googleAppsScriptUrl;
          if (gasUrl && gasUrl.trim().startsWith("http")) {
            let targetUrl = gasUrl.trim();
            const match = targetUrl.match(/(https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/(?:exec|dev))/);
            if (match) {
              targetUrl = match[1];
            } else {
              targetUrl = targetUrl.split(/[\s\n\r]+/)[0];
            }

            console.log(`[Supabase -> GAS Sync] Forwarding registration of ${newStudent.name || newStudent.nama || ''} to: ${targetUrl}`);
            try {
              const gasPayload = {
                action: "registerStudent",
                data: inserted ? inserted[0] : newStudent
              };
              
              const response = await fetch(targetUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json"
                },
                body: JSON.stringify(gasPayload)
              });

              if (response.ok) {
                console.log(`[Supabase -> GAS Sync] Sync success`);
              } else {
                console.warn(`[Supabase -> GAS Sync] GAS returned status ${response.status}`);
              }
            } catch (syncErr) {
              console.error("[Supabase -> GAS Sync] Sync failed:", syncErr);
            }
          }

          return res.json({ status: "success", data: inserted ? inserted[0] : newStudent });
        }

        if (action === "addEskul") {
          const eskulObj = req.body.data;
          if (!eskulObj) {
            return res.status(400).json({ status: "error", message: "Data eskul wajib diisi." });
          }

          const id = `eskul-${Math.random().toString(36).substr(2, 9)}`;
          const newEskul = {
            id,
            ...eskulObj
          };

          const { error: eskulErr } = await supabase.from("eskul").insert([newEskul]);
          if (eskulErr) {
            console.error("Supabase eskul insertion failed:", eskulErr);
            return res.status(500).json({ status: "error", message: eskulErr.message });
          }

          // Ensure allowed classes exist in 'classes' table
          if (eskulObj.kelasAllowed && Array.isArray(eskulObj.kelasAllowed)) {
            for (const cls of eskulObj.kelasAllowed) {
              const trimmed = cls.trim();
              if (trimmed) {
                await supabase.from("classes").upsert({ name: trimmed });
              }
            }
          }

          return res.json({ status: "success", data: newEskul });
        }

        if (action === "deleteEskul") {
          const eskulId = req.body.id;
          if (!eskulId) {
            return res.status(400).json({ status: "error", message: "ID eskul wajib diisi." });
          }

          const { error: delErr } = await supabase.from("eskul").delete().eq("id", eskulId);
          if (delErr) {
            console.error("Supabase eskul deletion failed:", delErr);
            return res.status(500).json({ status: "error", message: delErr.message });
          }

          return res.json({ status: "success" });
        }

        if (action === "resetEskulStudents") {
          const eskulId = req.body.eskulId;
          if (!eskulId) {
            return res.status(400).json({ status: "error", message: "ID eskul wajib diisi." });
          }

          const { error: resetErr } = await supabase.from("students").delete().eq("eskulId", eskulId);
          if (resetErr) {
            console.error("Supabase student reset failed:", resetErr);
            return res.status(500).json({ status: "error", message: resetErr.message });
          }

          return res.json({ status: "success" });
        }

        if (action === "resetAllData") {
          const { error: resetAllErr } = await supabase.from("students").delete().neq("id", "schema_placeholder_item");
          if (resetAllErr) {
            console.error("Supabase full database reset failed:", resetAllErr);
            return res.status(500).json({ status: "error", message: resetAllErr.message });
          }

          return res.json({ status: "success" });
        }

        if (action === "addAdmin") {
          const adminObj = req.body.data;
          if (!adminObj) {
            return res.status(400).json({ status: "error", message: "Data admin wajib diisi." });
          }

          const { error: adminErr } = await supabase.from("admins").insert([adminObj]);
          if (adminErr) {
            console.error("Supabase admin creation failed:", adminErr);
            return res.status(500).json({ status: "error", message: adminErr.message });
          }

          return res.json({ status: "success", data: adminObj });
        }

        if (action === "deleteAdmin") {
          const username = req.body.username;
          if (!username) {
            return res.status(400).json({ status: "error", message: "Username admin wajib diisi." });
          }

          const { error: delAdminErr } = await supabase.from("admins").delete().eq("username", username);
          if (delAdminErr) {
            console.error("Supabase admin deletion failed:", delAdminErr);
            return res.status(500).json({ status: "error", message: delAdminErr.message });
          }

          return res.json({ status: "success" });
        }

        if (action === "updateSettings") {
          // Handled on server side in settings.json, return success
          return res.json({ status: "success" });
        }

        return res.status(400).json({ status: "error", message: `Aksi '${action}' tidak dikenal di Supabase Engine.` });
      }

      // -------------------- GOOGLE APPS SCRIPT ENGINE (ORIGINAL) --------------------
      let targetUrl = (req.query.url || (req.body && req.body.url)) as string;
      
      if (!targetUrl) {
        targetUrl = currentSettings.googleAppsScriptUrl;
      }

      if (!targetUrl) {
        targetUrl = defaultSettings.googleAppsScriptUrl;
      }

      if (targetUrl) {
        targetUrl = targetUrl.trim();
        const match = targetUrl.match(/(https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/(?:exec|dev))/);
        if (match) {
          targetUrl = match[1];
        } else {
          targetUrl = targetUrl.split(/[\s\n\r]+/)[0];
        }
      }

      if (!targetUrl || !targetUrl.startsWith("http")) {
        return res.status(400).json({ status: "error", message: "Google Apps Script URL tidak terkonfigurasi." });
      }

      if (req.method === "GET") {
        const urlObj = new URL(targetUrl);
        Object.entries(req.query).forEach(([key, val]) => {
          if (key !== "url") {
            urlObj.searchParams.set(key, val as string);
          }
        });

        console.log(`[Proxy GET] Forwarding to: ${urlObj.toString()}`);
        const response = await fetch(urlObj.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          return res.json(json);
        } else {
          const text = await response.text();
          return res.send(text);
        }
      } else if (req.method === "POST") {
        console.log(`[Proxy POST] Forwarding to: ${targetUrl}`);
        const bodyCopy = { ...req.body };
        delete bodyCopy.url;

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(bodyCopy)
        });

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          return res.json(json);
        } else {
          const text = await response.text();
          return res.send(text);
        }
      } else {
        return res.status(405).json({ status: "error", message: "Method not allowed" });
      }
    } catch (err: any) {
      console.error("[Proxy GAS Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || err.toString() });
    }
  });

  // API Route to Migrate/Seed database into Supabase
  app.post("/api/migrate-to-supabase", async (req, res) => {
    try {
      const currentSettings = getSettings();
      const supabaseUrl = currentSettings.supabaseUrl || process.env.SUPABASE_URL;
      const supabaseAnonKey = currentSettings.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(400).json({ 
          status: "error", 
          message: "Supabase URL atau Anon Key belum dikonfigurasi di Pengaturan." 
        });
      }
      
      const { students, eskul, classes, admins } = req.body;
      console.log(`[Migration Engine] Starting migration to Supabase URL: ${supabaseUrl}`);
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      let logs: string[] = [];
      
      if (admins && Array.isArray(admins) && admins.length > 0) {
        console.log(`[Migration Engine] Upserting ${admins.length} admins...`);
        // Filter out any unexpected properties (like 'createdAt') to prevent PGRST204 errors
        const cleanAdmins = admins.map((ad: any) => {
          const resObj: any = {
            username: ad.username,
            password: ad.password,
            status: ad.status
          };
          if (ad.namaLengkap !== undefined) resObj.namaLengkap = ad.namaLengkap;
          if (ad.namalengkap !== undefined) resObj.namaLengkap = ad.namalengkap;
          return resObj;
        });
        const { error } = await supabase.from("admins").upsert(cleanAdmins);
        if (error) {
          logs.push(`⚠️ Gagal migrasi administrator: ${error.message} (Code: ${error.code})`);
        } else {
          logs.push(`✅ Sukses memigrasi ${admins.length} akun administrator.`);
        }
      }
      
      if (classes && Array.isArray(classes) && classes.length > 0) {
        console.log(`[Migration Engine] Upserting ${classes.length} classes...`);
        const classRows = classes.map(c => ({ name: c }));
        const { error } = await supabase.from("classes").upsert(classRows);
        if (error) {
          logs.push(`⚠️ Gagal migrasi daftar kelas: ${error.message} (Code: ${error.code})`);
        } else {
          logs.push(`✅ Sukses memigrasi ${classes.length} kelas.`);
        }
      }
      
      if (eskul && Array.isArray(eskul) && eskul.length > 0) {
        console.log(`[Migration Engine] Upserting ${eskul.length} eskul...`);
        // Filter out any unexpected properties
        const cleanEskul = eskul.map((es: any) => {
          const tp = es.tahunPelajaran || es.tahun_pelajaran || es.tahunpelajaran || currentSettings.tahunPelajaranAktif || "2026/2027";
          const resObj: any = {
            id: es.id,
            nama: es.nama || es.name || '',
            tahunPelajaran: tp
          };
          
          const cls = es.kelasAllowed || es.kelas_allowed || es.kelasallowed || es.KelasAllowed;
          if (cls !== undefined) {
            resObj.kelasAllowed = Array.isArray(cls) ? cls : [cls];
          }
          return resObj;
        });
        const { error } = await supabase.from("eskul").upsert(cleanEskul);
        if (error) {
          logs.push(`⚠️ Gagal migrasi ekstrakurikuler: ${error.message} (Code: ${error.code})`);
        } else {
          logs.push(`✅ Sukses memigrasi ${eskul.length} pilihan ekstrakurikuler.`);
        }
      }
      
      if (students && Array.isArray(students) && students.length > 0) {
        console.log(`[Migration Engine] Upserting ${students.length} students...`);
        
        // Retrieve and build a Set of all valid eskul IDs from the payload and database to prevent foreign key violations
        const validEskulIds = new Set<string>();
        if (eskul && Array.isArray(eskul)) {
          eskul.forEach((es: any) => {
            if (es && es.id) {
              validEskulIds.add(es.id);
            }
          });
        }
        try {
          const { data: dbEskul, error: fetchErr } = await supabase.from("eskul").select("id");
          if (!fetchErr && dbEskul) {
            dbEskul.forEach((es: any) => {
              if (es && es.id) {
                validEskulIds.add(es.id);
              }
            });
          }
        } catch (fetchErr) {
          console.error("[Migration Engine] Error pre-fetching eskul IDs:", fetchErr);
        }

        const isValidId = (id: any) => {
          if (!id) return false;
          const str = String(id).trim().toLowerCase();
          if (str === "" || str === "null" || str === "undefined" || str === "none") return false;
          return validEskulIds.has(id);
        };

        // Ensure we only upsert actual columns to avoid PGRST204 errors and handle foreign keys correctly (setting empty strings to null)
        const cleanStudents = students.map((st: any) => {
          const isPrestasiChecked = 
            st.prestasiChecked === true || 
            st.prestasiChecked === "true" || 
            st.prestasiChecked === "TRUE" || 
            st.prestasi_checked === true || 
            st.prestasi_checked === "true" || 
            st.prestasi_checked === "TRUE" ||
            st.PrestasiChecked === true ||
            false;

          const tp = st.tahunPelajaran || st.tahun_pelajaran || st.tahunpelajaran || st.TahunPelajaran || currentSettings.tahunPelajaranAktif || '2026/2027';
          const createdAtVal = st.createdAt || st.created_at || st.CreatedAt || new Date().toISOString();

          const eId1 = st.eskulId || st.eskul_id || st.EskulId;
          const eId2 = st.eskulId2 || st.eskul_id2 || st.EskulId2;
          const eId3 = st.eskulId3 || st.eskul_id3 || st.EskulId3;

          const cleanObj: any = {
            id: st.id,
            regNo: st.regNo || st.reg_no || st.RegNo || st.regno || st['no. registrasi'] || '',
            name: st.name || st.nama || st.Nama || '',
            nama: st.nama || st.name || st.Nama || '',
            photo: st.photo || st.Photo || st.foto || st.Foto || '',
            kelas: st.kelas || st.Kelas || '',
            jenisKelamin: st.jenisKelamin || st.jenis_kelamin || st.JenisKelamin || st.jeniskelamin || st['jenis kelamin'] || '',
            namaAyah: st.namaAyah || st.nama_ayah || st.NamaAyah || st.namaayah || st['nama ayah'] || '',
            namaIbu: st.namaIbu || st.nama_ibu || st.NamaIbu || st.namaibu || st['nama ibu'] || '',
            hpSiswa: st.hpSiswa || st.hp_siswa || st.HpSiswa || st.hpsiswa || st['hp siswa'] || '',
            hpOrtu: st.hpOrtu || st.hp_ortu || st.HpOrtu || st.hportu || st['hp ortu'] || '',
            email: st.email || st.Email || '',
            tempatLahir: st.tempatLahir || st.tempat_lahir || st.TempatLahir || st.tempatlahir || st['tempat lahir'] || '',
            tanggalLahir: st.tanggalLahir || st.tanggal_lahir || st.TanggalLahir || st.tanggallahir || st['tanggal lahir'] || '',
            prestasiChecked: isPrestasiChecked,
            namaLomba: isPrestasiChecked ? (st.namaLomba || st.nama_lomba || st.NamaLomba || '') : '',
            cabangLomba: isPrestasiChecked ? (st.cabangLomba || st.cabang_lomba || st.CabangLomba || '') : '',
            tingkatLomba: isPrestasiChecked ? (st.tingkatLomba || st.tingkat_lomba || st.TingkatLomba || '') : '',
            juaraKe: isPrestasiChecked ? (st.juaraKe || st.juara_ke || st.JuaraKe || '') : '',
            penyelenggara: isPrestasiChecked ? (st.penyelenggara || st.Penyelenggara || '') : '',
            certificateFile: isPrestasiChecked ? (st.certificateFile || st.certificate_file || st.CertificateFile || '') : '',
            certificateFileName: isPrestasiChecked ? (st.certificateFileName || st.certificate_file_name || st.CertificateFileName || '') : '',
            alamat: st.alamat || st.Alamat || '',
            rt: st.rt || st.RT || '',
            rw: st.rw || st.RW || '',
            provinsiId: st.provinsiId || st.provinsi_id || st.ProvinsiId || '',
            provinsiName: st.provinsiName || st.provinsi_name || st.ProvinsiName || st.provinsi || '',
            kabupatenId: st.kabupatenId || st.kabupaten_id || st.KabupatenId || '',
            kabupatenName: st.kabupatenName || st.kabupaten_name || st.KabupatenName || st.kabupaten || '',
            kecamatanId: st.kecamatanId || st.kecamatan_id || st.KecamatanId || '',
            kecamatanName: st.kecamatanName || st.kecamatan_name || st.KecamatanName || st.kecamatan || '',
            kelurahanId: st.kelurahanId || st.kelurahan_id || st.KelurahanId || '',
            kelurahanName: st.kelurahanName || st.kelurahan_name || st.KelurahanName || st.kelurahan || '',
            eskulId: isValidId(eId1) ? eId1 : null,
            eskulName: st.eskulName || st.eskul_name || st.EskulName || '',
            eskulId2: isValidId(eId2) ? eId2 : null,
            eskulName2: st.eskulName2 || st.eskul_name2 || st.EskulName2 || '',
            eskulId3: isValidId(eId3) ? eId3 : null,
            eskulName3: st.eskulName3 || st.eskul_name3 || st.EskulName3 || '',
            nisn: st.nisn || st.NISN || '',
            noWa: st.noWa || st.no_wa || st.NoWa || st.nowa || '',
            alasan: st.alasan || st.Alasan || '',
            tahunPelajaran: tp,
            createdAt: createdAtVal
          };

          return cleanObj;
        });

        const { error } = await supabase.from("students").upsert(cleanStudents);
        if (error) {
          logs.push(`⚠️ Gagal migrasi data pendaftar siswa: ${error.message} (Code: ${error.code})`);
        } else {
          logs.push(`✅ Sukses memigrasi ${students.length} data registrasi siswa.`);
        }
      }
      
      return res.json({ 
        status: "success", 
        message: "Proses migrasi selesai.",
        logs 
      });
    } catch (err: any) {
      console.error("[Migration Engine Error]:", err);
      return res.status(500).json({ status: "error", message: err.message || err.toString() });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
