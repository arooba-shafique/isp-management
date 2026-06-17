import { useQueryClient } from "@tanstack/react-query";
import { useImportCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const SAMPLE_CSV = `phone,name,address,zone,packageName,dueDate
03001234567,Ahmed Khan,Street 5 Block B,Zone A,Basic 5Mbps,2025-07-31
03111234567,Sara Ali,House 12 Model Town,Zone B,Standard 10Mbps,2025-08-15`;

type ImportRow = { phone: string; name: string; address?: string; zone?: string; packageName?: string; dueDate?: string };

export default function ImportCustomersPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const importMutation = useImportCustomers();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ImportRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  function parseCsv() {
    setParseError(""); setResult(null);
    const lines = csvText.trim().split("\n").filter(Boolean);
    if (lines.length < 2) { setParseError("CSV must have a header row and at least one data row"); return; }
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row as ImportRow;
    });
    const invalid = rows.filter(r => !r.phone || !r.name);
    if (invalid.length) { setParseError(`${invalid.length} rows missing phone or name`); return; }
    setParsed(rows);
  }

  async function handleImport() {
    if (!parsed) return;
    try {
      const res = await importMutation.mutateAsync({ data: { customers: parsed } });
      setResult(res as { imported: number; skipped: number; errors: string[] });
      await qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      setParsed(null); setCsvText("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; message?: string };
      setParseError(err?.data?.error ?? err?.message ?? "Import failed");
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/customers")} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Bulk Import Customers</h1>
          <p className="text-sm text-muted-foreground">Import existing customers from CSV</p>
        </div>
      </div>

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-emerald-600" />
            <span className="font-semibold text-emerald-700">Import Complete</span>
          </div>
          <p className="text-sm text-emerald-700">{result.imported} imported, {result.skipped} skipped</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="font-semibold mb-3">CSV Format</h2>
        <p className="text-sm text-muted-foreground mb-2">Required: <code className="bg-muted px-1 rounded">phone</code>, <code className="bg-muted px-1 rounded">name</code>. Optional: address, zone, packageName, dueDate</p>
        <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">{SAMPLE_CSV}</pre>
        <button onClick={() => setCsvText(SAMPLE_CSV)} className="mt-2 text-xs text-primary hover:underline">Use sample data</button>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Paste CSV Data</label>
          <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setParsed(null); }} rows={10} className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Paste CSV here..." />
        </div>

        {parseError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {parseError}
          </div>
        )}

        {parsed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
            {parsed.length} rows parsed successfully. Ready to import.
          </div>
        )}

        <div className="flex gap-2">
          {!parsed ? (
            <button onClick={parseCsv} disabled={!csvText.trim()} className="flex-1 border py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
              Parse CSV
            </button>
          ) : (
            <button onClick={handleImport} disabled={importMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Upload size={14} />
              {importMutation.isPending ? "Importing..." : `Import ${parsed.length} Customers`}
            </button>
          )}
          <button onClick={() => navigate("/admin/customers")} className="px-4 border rounded-lg text-sm hover:bg-accent transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
