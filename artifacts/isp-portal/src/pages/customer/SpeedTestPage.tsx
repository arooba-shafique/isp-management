import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Wifi, Download, Upload, Activity, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const TEST_SIZE_MB = 10;

type TestState = "idle" | "ping" | "download" | "upload" | "done";

interface SpeedResult {
  ping: number;
  download: number;
  upload: number;
}

function getSpeedLabel(mbps: number) {
  if (mbps >= 100) return { label: "Excellent", color: "text-emerald-500" };
  if (mbps >= 50) return { label: "Great", color: "text-emerald-400" };
  if (mbps >= 20) return { label: "Good", color: "text-primary" };
  if (mbps >= 10) return { label: "Fair", color: "text-amber-500" };
  return { label: "Slow", color: "text-red-500" };
}

function SpeedGauge({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const speed = getSpeedLabel(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
            className="text-muted/30" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
            strokeLinecap="round"
            className="text-primary transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{value.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        <div className={`text-xs font-semibold ${speed.color}`}>{speed.label}</div>
      </div>
    </div>
  );
}

export default function SpeedTestPage() {
  const { user } = useAuth();
  const [state, setState] = useState<TestState>("idle");
  const [result, setResult] = useState<SpeedResult>({ ping: 0, download: 0, upload: 0 });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const runTest = useCallback(async () => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setState("ping");
    setResult({ ping: 0, download: 0, upload: 0 });
    setDownloadProgress(0);

    try {
      // Ping test (3 samples)
      const pings: number[] = [];
      for (let i = 0; i < 3; i++) {
        const start = performance.now();
        await fetch(`${API_BASE}/api/speedtest/ping`, { signal });
        pings.push(performance.now() - start);
      }
      const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
      setResult(prev => ({ ...prev, ping: Math.round(avgPing) }));

      // Download test
      setState("download");
      const dlStart = performance.now();
      const res = await fetch(`${API_BASE}/api/speedtest/download?size=${TEST_SIZE_MB}`, { signal });
      const reader = res.body!.getReader();
      let received = 0;
      const contentLength = Number(res.headers.get("Content-Length")) || TEST_SIZE_MB * 1024 * 1024;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value!.byteLength;
        setDownloadProgress(Math.round((received / contentLength) * 100));
      }

      const dlTime = (performance.now() - dlStart) / 1000;
      const dlMbps = ((received * 8) / dlTime / 1_000_000);
      setResult(prev => ({ ...prev, download: dlMbps }));
      setDownloadProgress(100);

      // Upload test
      setState("upload");
      const uploadSize = 5 * 1024 * 1024; // 5MB
      const payload = new Uint8Array(uploadSize);
      crypto.getRandomValues(payload);

      const ulStart = performance.now();
      const ulRes = await fetch(`${API_BASE}/api/speedtest/upload`, {
        method: "POST",
        body: payload,
        signal,
      });
      await ulRes.json();
      const ulTime = (performance.now() - ulStart) / 1000;
      const ulMbps = ((uploadSize * 8) / ulTime / 1_000_000);
      setResult(prev => ({ ...prev, upload: ulMbps }));

      setState("done");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setState("idle");
      }
    }
  }, []);

  function handleStop() {
    abortRef.current?.abort();
    setState("idle");
  }

  const isActive = state !== "idle" && state !== "done";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Speed Test</h1>
        <p className="text-sm text-muted-foreground">Measure your connection speed to NetLink servers</p>
      </div>

      {/* Main Card */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        {/* Gauge Display */}
        <div className="flex flex-col items-center py-6 gap-6">
          {state === "idle" && !result.download && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Wifi size={36} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Ready to test your connection<br />to NetLink servers
              </p>
            </div>
          )}

          {(state === "ping" || state === "download" || state === "upload") && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={48} className="text-primary animate-spin" />
              <p className="text-sm font-medium">
                {state === "ping" && "Measuring ping..."}
                {state === "download" && `Testing download speed... ${downloadProgress}%`}
                {state === "upload" && "Testing upload speed..."}
              </p>
            </div>
          )}

          {state === "done" && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={20} />
                <span className="text-sm font-semibold">Test Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-6 w-full">
                <SpeedGauge value={result.ping} max={200} label="Ping" unit="ms" />
                <SpeedGauge value={result.download} max={200} label="Download" unit="Mbps" />
                <SpeedGauge value={result.upload} max={200} label="Upload" unit="Mbps" />
              </div>
            </div>
          )}

          {state === "idle" && result.download > 0 && (
            <div className="grid grid-cols-3 gap-6 w-full">
              <SpeedGauge value={result.ping} max={200} label="Ping" unit="ms" />
              <SpeedGauge value={result.download} max={200} label="Download" unit="Mbps" />
              <SpeedGauge value={result.upload} max={200} label="Upload" unit="Mbps" />
            </div>
          )}
        </div>

        {/* Progress bar during download */}
        {state === "download" && (
          <div className="mb-6">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          {isActive ? (
            <button onClick={handleStop}
              className="px-8 py-3 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              Stop Test
            </button>
          ) : (
            <button onClick={runTest}
              className="px-8 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2">
              {result.download > 0 ? (
                <>
                  <ArrowRight size={16} />
                  Test Again
                </>
              ) : (
                <>
                  <Activity size={16} />
                  Start Speed Test
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Download size={16} className="text-primary" />
            <span className="text-sm font-medium">Download</span>
          </div>
          <p className="text-xs text-muted-foreground">
            How fast you can receive data from the server. Affects streaming, browsing, and downloads.
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Upload size={16} className="text-primary" />
            <span className="text-sm font-medium">Upload</span>
          </div>
          <p className="text-xs text-muted-foreground">
            How fast you can send data to the server. Affects video calls, file uploads, and backups.
          </p>
        </div>
      </div>

      {/* Package info */}
      {user && (
        <div className="bg-muted/50 border rounded-xl p-4 text-xs text-muted-foreground">
          <p>Speeds shown are measured between your device and NetLink servers. Actual internet speed may vary based on your package, network conditions, and time of day.</p>
        </div>
      )}
    </div>
  );
}
