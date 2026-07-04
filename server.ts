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
    googleAppsScriptUrl: "",
    tahunPelajaranAktif: "2026/2027",
    isPublished: true
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
      let targetUrl = (req.query.url || (req.body && req.body.url)) as string;
      
      if (!targetUrl) {
        if (fs.existsSync(settingsFilePath)) {
          try {
            const data = fs.readFileSync(settingsFilePath, "utf8");
            const parsed = JSON.parse(data);
            targetUrl = parsed.googleAppsScriptUrl;
          } catch (e) {}
        }
      }

      if (!targetUrl) {
        targetUrl = defaultSettings.googleAppsScriptUrl;
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
