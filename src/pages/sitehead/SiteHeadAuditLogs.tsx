import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Shield } from "lucide-react";
import { siteAuditLogs } from "@/data/siteHeadMockData";

const SiteHeadAuditLogs = () => {
  const [search, setSearch] = useState("");
  const filtered = siteAuditLogs.filter(l =>
    !search || l.action.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Chronological record of all executive actions and system events.</p>
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TIMESTAMP</TableHead>
                <TableHead>ACTOR</TableHead>
                <TableHead>ACTION</TableHead>
                <TableHead>ENTITY</TableHead>
                <TableHead>DETAILS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs font-mono">{log.timestamp}</TableCell>
                  <TableCell className="font-medium text-foreground">{log.actor}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{log.entity}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>This log is append-only and tamper-evident. All entries are cryptographically signed.</span>
      </div>
    </div>
  );
};

export default SiteHeadAuditLogs;
