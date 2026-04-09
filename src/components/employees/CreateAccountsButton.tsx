"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  workEmail: string | null;
}

export function CreateAccountsButton() {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [results, setResults] = useState<{ success: any[]; failed: any[] } | null>(null);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (showModal) {
      setLoadingList(true);
      fetch("/api/employees/create-accounts")
        .then(r => r.json())
        .then(data => setEmployees(data.employees || []))
        .finally(() => setLoadingList(false));
    }
  }, [showModal]);

  const createAllAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/create-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createAll: true }),
      });
      const data = await res.json();
      setResults(data);
      if (data.success?.length > 0) {
        toast.success(`${data.success.length} compte(s) créé(s)`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
      >
        <span>🔑</span>
        Créer comptes employés
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold">Créer des comptes employés</h2>
              <button onClick={() => { setShowModal(false); setResults(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="p-4 overflow-auto max-h-[60vh]">
              {loadingList ? (
                <p className="text-center text-gray-500">Chargement...</p>
              ) : results ? (
                <div className="space-y-4">
                  {results.success?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-600 mb-2">✓ Comptes créés ({results.success.length})</h3>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs text-gray-500">
                              <th className="pb-2">Nom</th>
                              <th className="pb-2">Email</th>
                              <th className="pb-2">Mot de passe temporaire</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.success.map((emp: any, i: number) => (
                              <tr key={i} className="border-t border-green-100 dark:border-green-900">
                                <td className="py-2">{emp.name}</td>
                                <td className="py-2">{emp.email}</td>
                                <td className="py-2 font-mono text-xs bg-green-100 dark:bg-green-900 px-2 rounded">{emp.tempPassword}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-green-700 mt-2">⚠️ Notez ces mots de passe - ils ne seront plus visibles!</p>
                      </div>
                    </div>
                  )}
                  {results.failed?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-600 mb-2">✕ Échecs ({results.failed.length})</h3>
                      <ul className="text-sm text-red-600">
                        {results.failed.map((emp: any, i: number) => (
                          <li key={i}>• {emp.name}: {emp.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : employees.length === 0 ? (
                <p className="text-center text-gray-500">Tous les employés ont déjà un compte!</p>
              ) : (
                <div>
                  <p className="mb-3 text-sm text-gray-600">{employees.length} employé(s) sans compte trouvé(s).</p>
                  <button
                    onClick={createAllAccounts}
                    disabled={loading}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? "Création en cours..." : "Créer tous les comptes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}