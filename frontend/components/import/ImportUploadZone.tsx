"use client";
import { useCallback, useState } from "react";
import { useDropzone }           from "react-dropzone";
import Papa                      from "papaparse";
import * as XLSX                 from "xlsx";
import { toast }                 from "sonner";

interface Props {
  onUploaded: (data: Record<string, string>[], batch: string, stagingId: string) => void;
}

export function ImportUploadZone({ onUploaded }: Props) {
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setLoading(true);

    try {
      let rows: Record<string, string>[] = [];

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (file.name.match(/\.xlsx?$/i)) {
        const buffer = await file.arrayBuffer();
        const wb     = XLSX.read(buffer);
        const ws     = wb.Sheets[wb.SheetNames[0]];
        rows         = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      } else {
        toast.error("Unsupported file type. Use CSV or Excel.");
        setLoading(false);
        return;
      }

      if (rows.length === 0) {
        toast.error("File is empty or could not be parsed.");
        setLoading(false);
        return;
      }

      const batch = `BATCH-${Date.now()}`;

      // Write to staging_import so the queue page can track this import
      let stagingId = "";
      try {
        const res = await fetch("/api/import/stage", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            source_name:  file.name,
            source_file:  file.name,
            import_batch: batch,
            raw_data:     rows,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          stagingId = json.staging_id ?? "";
        }
      } catch {
        // Staging write failure is non-blocking — import can still proceed
      }

      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
      onUploaded(rows, batch, stagingId);
    } catch (err) {
      toast.error("Failed to parse file. Check the format and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] },
    maxFiles: 1,
  });

  return (
    <div className="p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragActive ? "border-[#4A2FA0] bg-[#EDE8F8]" : "border-[#7B5EA7] bg-[#F5F2FD] hover:bg-[#EDE8F8]"}
          ${loading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-3 text-[#4A2FA0]">⬆</div>
        <p className="text-[13px] font-medium text-[#4A2FA0] mb-1">
          {loading ? "Processing…" : isDragActive ? "Drop it here…" : "Drop file here or click to browse"}
        </p>
        <p className="text-[11px] text-muted-foreground mb-4">
          Google Form exports, Excel files, or CSV — up to 10,000 rows
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {["CSV", "XLSX", "XLS", "Google Sheet export"].map((t) => (
            <span key={t} className="px-2 py-0.5 bg-[#2D1B69] text-white rounded text-[9px] font-medium">{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] text-muted-foreground px-2">or connect from Google Drive</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="mt-3 flex gap-2 justify-center flex-wrap">
        {["FIW 2025 Registration", "GEW 2025 Pitchers", "Entrepreneur Database", "OSVP 2024 Master"].map((s) => (
          <button
            key={s}
            className="px-3 py-1.5 text-[10px] border border-border rounded-lg bg-white hover:bg-[#EDE8F8] hover:border-[#7B5EA7] transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
