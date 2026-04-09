"use client";
// src/components/employees/ImportEmployeesButton.tsx
import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  details: { row: number; message: string }[];
}

export function ImportEmployeesButton() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Format invalide. Utilisez .xlsx ou .xls");
      return;
    }

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'import");
      }

      setResult(data);
      
      if (data.imported > 0) {
        toast.success(`${data.imported} membre(s) importé(s) avec succès !`);
        setTimeout(() => window.location.reload(), 1500);
      }
      
      if (data.failed > 0) {
        toast.warning(`${data.failed} erreur(s) rencontrée(s)`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDownloadTemplate = () => {
    window.open("/api/employees/template", "_blank");
  };

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" /> Import Excel
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Importer des membres</h2>
              <p className="text-xs text-gray-500">Depuis un fichier Excel (.xlsx)</p>
            </div>
          </div>
          <button onClick={() => { setOpen(false); setResult(null); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            <Download className="w-5 h-5 text-amber-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Télécharger le modèle</p>
              <p className="text-xs text-gray-500">Remplissez le modèle puis importez-le</p>
            </div>
          </button>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              dragging
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {importing ? (
              <>
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Import en cours...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                </div>
              </>
            )}
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {result.imported} importé(s)
                  </span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {result.failed} erreur(s)
                    </span>
                  </div>
                )}
              </div>

              {result.details.length > 0 && (
                <div className="max-h-40 overflow-y-auto bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-1">
                  {result.details.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-red-500 font-medium">Ligne {err.row}:</span>
                      <span className="text-red-700 dark:text-red-300">{err.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={() => { setOpen(false); setResult(null); }}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
