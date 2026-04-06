"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  employeeId: string | null;
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYE",
    employeeId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingUser ? "PUT" : "POST";
      const res = await fetch("/api/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser ? { ...formData, id: editingUser.id } : formData),
      });

      if (res.ok) {
        fetchUsers();
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "EMPLOYE", employeeId: "" });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role,
      employeeId: user.employeeId || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN_RH: "Administrateur RH",
    MANAGER: "Manager",
    EMPLOYE: "Employé",
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et gérez les comptes utilisateurs</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", role: "EMPLOYE", employeeId: "" });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          + Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 text-gray-900 dark:text-gray-100">{user.name || "-"}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === "ADMIN_RH" ? "bg-purple-100 text-purple-800" :
                    user.role === "MANAGER" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleEdit(user)} className="text-amber-600 hover:text-amber-800">Modifier</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe {editingUser && "(laisser vide pour garder)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="EMPLOYE">Employé</option>
                  <option value="MANAGER">Manager</option>
                  <option value="PRESIDENT">Président</option>
                  <option value="ADMIN_RH">Administrateur RH</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  {editingUser ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
