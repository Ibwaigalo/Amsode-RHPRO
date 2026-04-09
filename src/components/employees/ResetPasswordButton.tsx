"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { KeyRound, RefreshCw } from "lucide-react";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
  hasAccount: string | null;
}

export function ResetPasswordButton({ employeeId, employeeName, onSuccess }: { employeeId: string; employeeName: string; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!confirm(`Réinitialiser le mot de passe de ${employeeName}?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/employees/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(`Mot de passe réinitialisé pour ${data.name}\n\nEmail: ${data.email}\nNouveau mot de passe: ${data.tempPassword}\n\n⚠️ Notez ce mot de passe!`);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleReset} disabled={loading} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
      <KeyRound className="w-3 h-3" /> {loading ? "..." : "Réinitialiser"}
    </button>
  );
}

export function ResetPasswordsManager() {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (showModal) {
      setLoadingList(true);
      fetch("/api/employees/reset-password")
        .then(r => r.json())
        .then(data => { setEmployees(data); setLoadingList(false); });
    }
  }, [showModal]);

  const resetSelected = async () => {
    setLoading(true);
    const res: any[] = [];
    for (const id of selected) {
      const emp = employees.find(e => e.id === id);
      try {
        const r = await fetch("/api/employees/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: id }),
        });
        const data = await r.json();
        if (r.ok) res.push({ name: data.name, email: data.email, password: data.tempPassword, success: true });
        else res.push({ name: emp?.firstName + " " + emp?.lastName, error: data.error, success: false });
      } catch (e: any) {
        res.push({ name: emp?.firstName + " " + emp?.lastName, error: e.message, success: false });
      }
    }
    setResults(res);
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
        <RefreshCw className="w-3 h-3" /> Réinitialiser mots de passe
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">Réinitialiser les mots de passe</h2>
              <button onClick={() => { setShowModal(false); setResults([]); setSelected([]); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="p-4 overflow-auto max-h-[60vh]">
              {loadingList ? (
                <p className="text-center text-gray-500">Chargement...</p>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Résultats</h3>
                  {results.map((r, i) => (
                    <div key={i} className={`p-3 rounded-lg ${r.success ? "bg-green-50" : "bg-red-50"}`}>
                      {r.success ? (
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-sm">Email: {r.email}</p>
                          <p className="text-sm font-mono bg-white p-1 rounded mt-1">Mot de passe: {r.password}</p>
                        </div>
                      ) : (
                        <p className="text-red-600">{r.name}: {r.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-gray-600">{employees.length} employé(s)</p>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {employees.map(emp => (
                      <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input type="checkbox" checked={selected.includes(emp.id)} onChange={e => setSelected(e.target.checked ? [...selected, emp.id] : selected.filter(id => id !== emp.id))} />
                        <span>{emp.firstName} {emp.lastName}</span>
                        {emp.hasAccount && <span className="text-xs text-green-600">✓ Compte</span>}
                      </label>
                    ))}
                  </div>
                  {selected.length > 0 && (
                    <button onClick={resetSelected} disabled={loading}
                      className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                      {loading ? "Traitement..." : `Réinitialiser (${selected.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}