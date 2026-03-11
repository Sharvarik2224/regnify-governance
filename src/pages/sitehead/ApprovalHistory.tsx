import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { useState } from "react";

const ApprovalHistory = () => {
  const [search, setSearch] = useState("");
  const filtered: Array<{ id: string }> = [];

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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={6}>No approval history available.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalHistory;
