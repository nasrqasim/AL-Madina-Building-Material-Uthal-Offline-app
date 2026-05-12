"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import UserModal from "@/components/erp/settings/UserModal";
import RoleModal from "@/components/erp/settings/RoleModal";

export default function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState("Users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (data.ok) {
        setRoles(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Users") fetchUsers();
    else fetchRoles();
  }, [activeTab]);

  const handleAdd = () => {
    if (activeTab === "Users") {
      setSelectedUser(null);
      setIsModalOpen(true);
    } else {
      setSelectedRole(null);
      setIsRoleModalOpen(true);
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === "Users") {
      setSelectedUser(item);
      setIsModalOpen(true);
    } else {
      setSelectedRole(item);
      setIsRoleModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    const type = activeTab === "Users" ? "user" : "role";
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const endpoint = activeTab === "Users" ? `/api/users/${id}` : `/api/roles/${id}`;
        const res = await fetch(endpoint, { method: "DELETE" });
        if (res.ok) {
          if (activeTab === "Users") fetchUsers();
          else fetchRoles();
        }
      } catch (err) {
        console.error(`Failed to delete ${type}`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Users & Roles</h1>
        <div className="flex items-center gap-3">
          {/* Subscribe button removed */}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">Users & Roles</h2>
          <p className="text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium">Manage team members and their permissions in this company.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-8 py-4 bg-maroon-800 text-white rounded-2xl font-black shadow-lg shadow-maroon-900/20 hover:bg-maroon-700 hover:-translate-y-1 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add {activeTab === "Users" ? "User" : "Role"}
        </button>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
        {["Users", "Roles"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === tab 
                ? "bg-white dark:bg-slate-900 text-maroon-800 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200"
            }`}
          >
            {tab === "Users" ? `Users (${users.length})` : `Roles (${roles.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold">Loading {activeTab.toLowerCase()}...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    {activeTab === "Users" ? "User" : "Role Name"}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    {activeTab === "Users" ? "Role" : "Description"}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                    {activeTab === "Users" ? "Last Login" : "Created At"}
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTab === "Users" ? (
                  users.map((user) => (
                    <tr key={user._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-800 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-slate-100">{user.name}</p>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 bg-maroon-50 text-maroon-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <div className={`w-2 h-2 ${user.isActive ? "bg-emerald-500" : "bg-slate-300"} rounded-full`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-maroon-800 hover:text-white transition-all active:scale-90"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user._id)}
                            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  roles.map((role) => (
                    <tr key={role._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
                            <Shield size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{role.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 max-w-xs truncate">
                        {role.description || "No description provided."}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="text-[10px] font-black uppercase tracking-wider">Enabled</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(role)}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-maroon-800 hover:text-white transition-all active:scale-90"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(role._id)}
                            className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={fetchRoles}
        role={selectedRole}
      />
    </div>
  );
}


