"use client";
// src/components/documents/DocumentsClient.tsx
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileText, File, Trash2, Download, Search, AlertTriangle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";

const DOC_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contrat",
  PAYSLIP: "Fiche de paie",
  ID_CARD: "Pièce d'identité",
  DIPLOMA: "Diplôme",
  CERTIFICATE: "Certificat",
  OTHER: "Autre",
};
const DOC_TYPES = Object.entries(DOC_TYPE_LABELS);

interface Doc {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  expiresAt: string | null;
  createdAt: Date;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

interface Props {
  documents: Doc[];
  employees: { id: string; firstName: string; lastName: string }[];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsClient({ documents: docs, employees }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ employeeId: "", type: "CONTRACT", name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setSelectedFile(accepted[0]);
      if (!uploadData.name) setUploadData(prev => ({ ...prev, name: accepted[0].name }));
    }
  }, [uploadData.name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"], "application/msword": [".doc", ".docx"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.type || !uploadData.name) {
      toast.error("Renseignez le type et le nom du document");
      return;
    }
    setUploading(true);
    try {
      // In production, upload to Vercel Blob / S3 first, then save URL
      // Here we simulate with a placeholder URL
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("employeeId", uploadData.employeeId);
      formData.append("type", uploadData.type);
      formData.append("name", uploadData.name);
      formData.append("description", uploadData.description);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Document uploadé !");
      setShowUpload(false);
      setSelectedFile(null);
      setUploadData({ employeeId: "", type: "CONTRACT", name: "", description: "" });
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const filtered = docs.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      `${d.employeeFirstName} ${d.employeeLastName}`.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || d.type === typeFilter;
    return matchSearch && matchType;
  });

  const expiringSoon = docs.filter(d => d.expiresAt && differenceInDays(parseISO(d.expiresAt), new Date()) <= 30 && differenceInDays(parseISO(d.expiresAt), new Date()) >= 0);

  return (
    <div className="space-y-4">
      {/* Expiry alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {expiringSoon.length} document(s) expirent dans moins de 30 jours
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {expiringSoon.map(d => d.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..." className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1] w-52" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
            <option value="">Tous types</option>
            {DOC_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] hover:bg-[#007ab8] text-white text-sm font-medium rounded-lg transition-all shadow-md shadow-[#0090D1]/20">
          <Upload className="w-4 h-4" /> Uploader un document
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#0090D1]/30 dark:border-[#0090D1]/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Nouveau document</h3>
            <button onClick={() => setShowUpload(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Membre concerné</label>
              <select value={uploadData.employeeId} onChange={e => setUploadData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                <option value="">Document général</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select value={uploadData.type} onChange={e => setUploadData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0090D1]">
                {DOC_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du document *</label>
              <input value={uploadData.name} onChange={e => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Contrat CDI - Aminata Coulibaly"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input value={uploadData.description} onChange={e => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Notes éventuelles..."
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-[#0090D1]" />
            </div>
          </div>

          {/* Dropzone */}
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
          )}>
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-green-600">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">{formatSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive ? "Déposez le fichier ici..." : "Glissez un fichier ou cliquez pour sélectionner"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOCX — Max 10 MB</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowUpload(false)}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile}
              className="flex items-center gap-2 px-4 py-2 bg-[#0090D1] text-white text-sm font-medium rounded-lg hover:bg-[#007ab8] transition-all disabled:opacity-60 shadow-md shadow-[#0090D1]/20">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Upload..." : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {/* Documents table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{filtered.length} document(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Document</th>
                <th className="text-left">Membre</th>
                <th className="text-left">Type</th>
                <th className="text-left">Taille</th>
                <th className="text-left">Expiration</th>
                <th className="text-left">Ajouté le</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-400 text-sm">Aucun document</p>
                  </td>
                </tr>
              ) : filtered.map((doc) => {
                const daysLeft = doc.expiresAt ? differenceInDays(parseISO(doc.expiresAt), new Date()) : null;
                const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
                const isExpired = daysLeft !== null && daysLeft < 0;
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", doc.mimeType?.includes("pdf") ? "bg-red-50 dark:bg-red-900/20" : "bg-blue-50 dark:bg-blue-900/20")}>
                          <File className={cn("w-4 h-4", doc.mimeType?.includes("pdf") ? "text-red-500" : "text-blue-500")} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{doc.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">
                      {doc.employeeFirstName ? `${doc.employeeFirstName} ${doc.employeeLastName}` : <span className="text-gray-400">Général</span>}
                    </td>
                    <td>
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        {DOC_TYPE_LABELS[doc.type] || doc.type}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{formatSize(doc.fileSize)}</td>
                    <td>
                      {doc.expiresAt ? (
                        <span className={cn("text-xs font-medium",
                          isExpired ? "text-red-600" : isExpiring ? "text-amber-500" : "text-gray-500")}>
                          {isExpired ? "⚠ Expiré" : isExpiring ? `⚠ ${daysLeft}j` : format(parseISO(doc.expiresAt), "dd/MM/yyyy")}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="text-xs text-gray-500">{format(new Date(doc.createdAt), "dd/MM/yyyy")}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <a href={doc.fileUrl} download target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Download className="w-4 h-4" />
                        </a>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
