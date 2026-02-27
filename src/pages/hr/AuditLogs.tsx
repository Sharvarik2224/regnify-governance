import { Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const logs = [
  { time: "2024-12-20 14:22:15", actor: "HR_Admin", action: "Access Level Escalated", entity: "User: Sarah W.", hash: "a3f2c1d8..." },
  { time: "2024-12-20 14:15:02", actor: "System", action: "Login Success", entity: "Employee: Alice Johnson", hash: "b7d4e2f1..." },
  { time: "2024-12-20 13:58:30", actor: "Robert S.", action: "Policy Acknowledgement", entity: "Workplace Harassment Policy", hash: "c9a8f3b2..." },
  { time: "2024-12-20 12:45:00", actor: "AI Engine", action: "Risk Score Updated", entity: "Employee: Jordan Smith", hash: "d1e5c4a7..." },
  { time: "2024-12-20 11:30:22", actor: "Sarah Jenkins", action: "Performance Review Submitted", entity: "Employee: Jordan Smith", hash: "e2f6d5b8..." },
  { time: "2024-12-20 10:15:45", actor: "System", action: "Governance Check Triggered", entity: "Employee: Sarah Parker", hash: "f3a7e6c9..." },
  { time: "2024-12-19 16:42:18", actor: "HR_Admin", action: "Override Justification Filed", entity: "Employee: Alice Johnson", hash: "a4b8f7d0..." },
  { time: "2024-12-19 15:20:33", actor: "System", action: "Probation Expiry Warning", entity: "Employee: Daniel Zhao", hash: "b5c9a8e1..." },
];

const AuditLogs = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
      <p className="text-sm text-muted-foreground">Append-only, tamper-evident record of all governance actions.</p>
    </div>

    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search audit logs..." className="pl-9" />
      </div>
      <Select>
        <SelectTrigger className="w-36"><SelectValue placeholder="Actor: All" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="system">System</SelectItem>
          <SelectItem value="ai">AI Engine</SelectItem>
          <SelectItem value="hr">HR Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-40"><SelectValue placeholder="Action: All" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="login">Login</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="override">Override</SelectItem>
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
          {logs.map((log, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{log.time}</td>
              <td className="px-5 py-3 text-sm text-foreground">{log.actor}</td>
              <td className="px-5 py-3 text-sm text-foreground">{log.action}</td>
              <td className="px-5 py-3 text-sm text-muted-foreground">{log.entity}</td>
              <td className="px-5 py-3 text-xs font-mono text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />{log.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground italic">⚠ This log is append-only and tamper-evident. All entries are cryptographically hashed.</p>
      </div>
    </div>
  </div>
);

export default AuditLogs;
