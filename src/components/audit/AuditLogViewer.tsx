"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Filter, Search, Clock, User, Activity, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { getAuditLogs } from "@/actions/audit";

interface AuditLogViewerProps {
  initialLogs: any[];
}

const ENTITIES = ["ALL", "Product", "Sale", "User", "InventoryBatch", "Settings"];
const ACTIONS = ["ALL", "LOGIN", "LOGOUT", "CREATE_PRODUCT", "ADD_BATCH", "SALE_COMPLETED", "ADJUST_STOCK", "UPDATE_SETTINGS", "CREATE_USER", "UPDATE_USER", "RESET_PASSWORD"];

export function AuditLogViewer({ initialLogs }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const handleFilter = (entity: string, action: string) => {
    setSelectedEntity(entity);
    setSelectedAction(action);
    startTransition(async () => {
      const data = await getAuditLogs(entity, action);
      setLogs(data);
    });
  };

  const actionColors: Record<string, { bg: string; text: string }> = {
    LOGIN: { bg: "bg-blue-50", text: "text-blue-700" },
    LOGOUT: { bg: "bg-slate-100", text: "text-slate-600" },
    SALE_COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700" },
    CREATE_PRODUCT: { bg: "bg-purple-50", text: "text-purple-700" },
    ADD_BATCH: { bg: "bg-teal-50", text: "text-teal-700" },
    ADJUST_STOCK: { bg: "bg-amber-50", text: "text-amber-800" },
    UPDATE_SETTINGS: { bg: "bg-indigo-50", text: "text-indigo-700" },
    CREATE_USER: { bg: "bg-pink-50", text: "text-pink-700" },
    RESET_PASSWORD: { bg: "bg-rose-50", text: "text-rose-700" },
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>System Audit Trail & Activity Logs</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Immutable Log
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological timeline of user actions, sales, adjustments, and system security events
          </p>
        </div>

        <button
          onClick={() => handleFilter(selectedEntity, selectedAction)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors self-start"
          title="Refresh logs"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Filter By Target:</span>
          <select
            value={selectedEntity}
            onChange={(e) => handleFilter(e.target.value, selectedAction)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            {ENTITIES.map((ent) => (
              <option key={ent} value={ent}>
                {ent === "ALL" ? "All Modules / Entities" : ent}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Action Type:</span>
          <select
            value={selectedAction}
            onChange={(e) => handleFilter(selectedEntity, e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden"
          >
            {ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act === "ALL" ? "All Action Types" : act.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No audit logs matching criteria.</p>
            </div>
          ) : (
            logs.map((log) => {
              const actStyle = actionColors[log.action] || { bg: "bg-slate-100", text: "text-slate-700" };

              return (
                <div
                  key={log.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actStyle.bg} ${actStyle.text}`}
                        >
                          {log.action?.replace("_", " ")}
                        </span>
                        <span className="font-bold text-slate-900">{log.entity}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{log.user ? `${log.user.name} (${log.user.role})` : "System Engine"}</span>
                        </span>
                      </div>

                      <p className="text-slate-700 mt-1 leading-relaxed">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-slate-400 text-[11px] font-mono shrink-0 flex items-center gap-1.5 sm:text-right">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
