import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const settingsFilePath = path.join(process.cwd(), "settings.json");

  const defaultSettings = {
    googleAppsScriptUrl: "https://script.google.com/macros/s/AKfycby4fbLKd7JdwuigJ7Pi3kJe6h2z70ewSDEIHhBMo2BQM_2AkD4l6kkO3hhIOnBOpXtTpA/exec",
    tahunPelajaranAktif: "2026/2027",
    adminUsername: "admin",
    adminPassword: "admin123"
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
