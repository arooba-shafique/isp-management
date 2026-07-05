import { Router, type IRouter } from "express";
import crypto from "crypto";

const router: IRouter = Router();

const CHUNK_SIZE = 1024 * 1024; // 1MB
const DOWNLOAD_SIZE = 10; // 10 chunks = 10MB

// Ping endpoint
router.get("/speedtest/ping", (_req, res) => {
  res.json({ t: Date.now() });
});

// Download test — streams random bytes
router.get("/speedtest/download", (req, res) => {
  const size = Math.min(Math.max(Number(req.query.size) || DOWNLOAD_SIZE, 1), 50);
  const totalBytes = size * CHUNK_SIZE;

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(totalBytes));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  const chunk = crypto.randomBytes(CHUNK_SIZE);
  let sent = 0;

  function sendChunk() {
    while (sent < totalBytes) {
      const ok = res.write(chunk);
      sent += CHUNK_SIZE;
      if (!ok) {
        res.once("drain", sendChunk);
        return;
      }
    }
    res.end();
  }

  sendChunk();
});

// Upload test — receives and discards data
router.post("/speedtest/upload", (req, res) => {
  let received = 0;
  req.on("data", (chunk: Buffer) => { received += chunk.length; });
  req.on("end", () => {
    res.json({ bytes: received, t: Date.now() });
  });
});

export default router;
