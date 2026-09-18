"use client";

import { useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  X,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEmployees,
  createEmployeeAction,
  toggleEmployeeStatusAction,
  resetEmployeePasswordAction,
  CreateEmployeeInput,
} from "@/actions/employees";
import { SessionUser, Role } from "@/lib/types";

interface EmployeeManagerProps {
  initialEmployees: any[];
  currentUser: SessionUser;
}

export function EmployeeManager({ initialEmployees, currentUser }: EmployeeManagerProps) {
  const [employees, setEmployees] = useState<any[]>(initialEmployees);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<any | null>(null);

  // New staff form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CASHIER");
  const [phone, setPhone] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");

  const [isPending, startTransition] = useTransition();

  const refreshEmployees = () => {
    startTransition(async () => {
      const data = await getEmployees();
      setEmployees(data);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const res = await createEmployeeAction({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      });

      if (res.success) {
        toast.success(`Staff account for ${name} (${role}) created successfully!`);
        setIsAddOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        refreshEmployees();
      } else {
        toast.error(res.error || "Failed to create employee.");
      }
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean, userName: string) => {
    if (userId === currentUser.id) {
      toast.error("You cannot deactivate your own active session.");
      return;
    }

    startTransition(async () => {
      const res = await toggleEmployeeStatusAction(userId, !currentStatus);
      if (res.success) {
        toast.success(`${userName} has been ${!currentStatus ? "activated" : "deactivated"}.`);
        refreshEmployees();
      } else {
        toast.error(res.error || "Failed to update employee status.");
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const res = await resetEmployeePasswordAction(resetTargetUser.id, newPassword);
      if (res.success) {
        toast.success(`Password reset successfully for ${resetTargetUser.name}.`);
        setResetTargetUser(null);
        setNewPassword("");
      } else {
        toast.error(res.error || "Failed to reset password.");
      }
    });
  };

  const roleStyles: Record<string, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    PHARMACIST: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    CASHIER: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Staff & User Role Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {employees.length} Accounts
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage permissions, register staff members, and configure access security
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Employee Name</th>
              <th className="py-3 px-4">Role / Access</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4 text-center">Activity Metrics</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const rStyle = roleStyles[emp.role] || roleStyles.CASHIER;
              const isSelf = emp.id === currentUser.id;

              return (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {isSelf && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{emp.role}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <p className="text-[11px] flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{emp.email}</span>
                    </p>
                    {emp.phone && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[11px] font-semibold text-slate-700">
                      {emp._count?.sales || 0} sales • {emp._count?.adjustments || 0} stock logs
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.isActive, emp.name)}
                      disabled={isSelf || isPending}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        emp.isActive
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      } ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {emp.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Deactivated</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setResetTargetUser(emp)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 inline-flex"
                      title="Reset employee password"
                    >
                      <KeyRound className="w-3 h-3 text-slate-500" />
                      <span>Reset Key</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Add New Staff Member</h2>
                  <p className="text-xs text-slate-500">Configure role permissions and login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aster Kebede"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aster@galma.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assigned System Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white font-semibold"
                >
                  <option value="CASHIER">Cashier (POS & Sales Invoicing only)</option>
                  <option value="PHARMACIST">Pharmacist (Inventory, Batches, Stock adjustments)</option>
                  <option value="ADMIN">Administrator (Full System & Reports access)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+251 911 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
                >
                  {isPending ? "Creating..." : "Register Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Reset Password</h2>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{resetTargetUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all"
                >
                  {isPending ? "Updating..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
