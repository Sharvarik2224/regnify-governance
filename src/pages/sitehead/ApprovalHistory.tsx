import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { approvalHistory } from "@/data/siteHeadMockData";
import { useState } from "react";

const ApprovalHistory = () => {
  const [search, setSearch] = useState("");
  const filtered = approvalHistory.filter(a => !search || a.employee.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval History</h1>
          <p className="text-muted-foreground text-sm">Complete record of executive decisions and outcomes.</p>
        </div>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by employee..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMPLOYEE</TableHead>
                <TableHead>HR RECOMMENDATION</TableHead>
                <TableHead>FINAL DECISION</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>COMMENT</TableHead>
                <TableHead>APPROVED BY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-foreground">{r.employee}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.hrRecommendation}</Badge></TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${r.finalDecision === "Confirmed" ? "bg-green-100 text-green-700 border-0" : r.finalDecision === "Terminated" ? "bg-destructive/10 text-destructive border-0" : "bg-amber-100 text-amber-700 border-0"}`}>
                      {r.finalDecision}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.date}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{r.comment}</TableCell>
                  <TableCell className="text-muted-foreground">{r.approvedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalHistory;
