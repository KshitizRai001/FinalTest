import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload } from "lucide-react";
import { csvApi } from "@/lib/api";
import { toast } from "sonner";

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        record.push(field);
        field = "";
      } else if (char === "\n") {
        record.push(field);
        rows.push(record);
        record = [];
        field = "";
      } else if (char === "\r") {
        // ignore CR
      } else {
        field += char;
      }
    }
  }
  // push last field
  record.push(field);
  if (record.length > 1 || record[0] !== "") rows.push(record);

  const headers = rows[0] ?? [];
  const data = rows.slice(1).filter((r) => r.some((c) => c !== ""));
  return { headers, rows: data };
}

export default function CSVImporter({ source }: { source: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [status, setStatus] = useState<null | { ok: boolean; message: string }>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name);
    const text = await file.text();
    const parsed = parseCSV(text);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setStatus(null);
  }

  async function ingest() {
    try {
      setLoading(true);
      const objects = rows.map((r) =>
        Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])),
      );
      
      // Use Supabase API directly for better error handling
      const result = await csvApi.ingestData({
        source,
        fileName: name,
        headers,
        rows: objects.slice(0, 1000), // Limit to 1000 rows for performance
      });
      
      setStatus({
        ok: true,
        message: result.message,
      });
      
      toast.success(`Successfully uploaded ${objects.length} rows!`);
    } catch (e: any) {
      console.error("CSV upload error:", e);
      const errorMessage = e.message || "Upload failed";
      setStatus({ ok: false, message: errorMessage });
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName("");
    setHeaders([]);
    setRows([]);
    setStatus(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-medium">Upload CSV for {source}</div>
            <div className="text-xs text-muted-foreground">
              Select a .csv exported from your system
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Button 
                variant={name ? "default" : "outline"}
                className={`${name ? 'bg-green-600 hover:bg-green-700 text-white' : ''} min-w-[140px]`}
                type="button"
              >
                {name ? (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    File Selected
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </>
                )}
              </Button>
            </div>
            <Button variant="outline" onClick={reset} disabled={!name}>
              Clear
            </Button>
            <Button onClick={ingest} disabled={!rows.length || loading}>
              {loading ? "Uploading..." : "Ingest"}
            </Button>
          </div>
        </div>
        {name && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Selected file:</span>
              <Badge variant="default" className="bg-green-600">{name}</Badge>
            </div>
            <div className="text-sm text-green-700 mt-1">
              Contains {rows.length} data rows with {headers.length} columns
            </div>
          </div>
        )}
        {!!headers.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border rounded-md">
              <thead className="bg-muted">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="text-left p-2 border-r last:border-r-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t">
                    {headers.map((h, j) => (
                      <td
                        key={j}
                        className="p-2 border-r last:border-r-0 whitespace-nowrap"
                      >
                        {r[j]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {status && (
          <Alert variant={status.ok ? "default" : "destructive"}>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
