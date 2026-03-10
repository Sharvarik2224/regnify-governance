import { useEffect, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api";

type AuditLogRecord = {
  id: string;
  timestamp?: string;
  actor?: string;
  action?: string;
  entity?: string;
  entityId?: string | null;
  hash?: string;
};

const toUiTimestamp = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const AuditLogs = () => {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit-logs?limit=50`);
      if (!response.ok) {
        throw new Error(`Unable to load audit logs. Status ${response.status}`);
      }

      const payload = await response.json();
      setLogs(Array.isArray(payload) ? payload : []);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();

    const eventSource = new EventSource(`${API_BASE_URL}/api/audit-logs/stream`);
    eventSource.onmessage = (event) => {
      try {
        const incomingLog = JSON.parse(event.data) as AuditLogRecord;
        if (!incomingLog?.id) {
          return;
        }

        setLogs((previousLogs) => {
          const deduplicated = previousLogs.filter((log) => log.id !== incomingLog.id);
          return [incomingLog, ...deduplicated].slice(0, 200);
        });
        setError(null);
        setLoading(false);
      } catch (streamError) {
        console.warn("Invalid audit stream payload", streamError);
      }
    };

    eventSource.onerror = () => {
      setError("Real-time stream disconnected. Reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const actorOptions = useMemo(() => {
    const uniqueActors = new Set(logs.map((log) => (log.actor || "System")).filter(Boolean));
    return Array.from(uniqueActors).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const actionOptions = useMemo(() => {
    const uniqueActions = new Set(logs.map((log) => (log.action || "Unknown Action")).filter(Boolean));
    return Array.from(uniqueActions).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logs.filter((log) => {
      const actor = log.actor || "System";
      const action = log.action || "Unknown Action";
      const entity = log.entity || "Unknown Entity";
      const entityId = log.entityId || "";

      const matchesActor = actorFilter === "all" || actor === actorFilter;
      const matchesAction = actionFilter === "all" || action === actionFilter;
      const matchesSearch = !normalizedSearch || [actor, action, entity, entityId, log.hash || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      return matchesActor && matchesAction && matchesSearch;
    });
  }, [logs, search, actorFilter, actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Append-only, tamper-evident record of all governance actions.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search audit logs..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Actor: All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {actorOptions.map((actor) => (
              <SelectItem key={actor} value={actor}>{actor}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Action: All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {actionOptions.map((action) => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Entity</th>
              <th className="px-5 py-3">Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-3 text-sm text-muted-foreground" colSpan={5}>Loading audit logs...</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-5 py-3 text-sm text-destructive" colSpan={5}>{error}</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td className="px-5 py-3 text-sm text-muted-foreground" colSpan={5}>No audit logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{toUiTimestamp(log.timestamp)}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{log.actor || "System"}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{log.action || "Unknown Action"}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{log.entity || "Unknown Entity"}</td>
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />{log.hash || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground italic">Audit logs update in real time. Entries are cryptographically hashed.</p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
