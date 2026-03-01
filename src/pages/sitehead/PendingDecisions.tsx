import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { pendingEmployees } from "@/data/siteHeadMockData";
import { Link } from "react-router-dom";

const riskBadge = (level: string) => {
  const cls = level === "High" ? "bg-destructive text-destructive-foreground" : level === "Medium" ? "bg-amber-100 text-amber-700 border-0" : "bg-green-100 text-green-700 border-0";
  return <Badge className={`${cls} text-[10px]`}>{level.toUpperCase()}</Badge>;
};

const recBadge = (rec: string) => {
  if (rec === "Highly Recommended") return <Badge className="bg-green-100 text-green-700 border-0 text-[10px] gap-1"><CheckCircle className="h-3 w-3" /> {rec}</Badge>;
  if (rec === "Not Recommended") return <Badge className="bg-destructive/10 text-destructive border-0 text-[10px] gap-1">✕ {rec}</Badge>;
  return <Badge variant="outline" className="text-[10px]">{rec}</Badge>;
};

const PendingDecisions = () => {
  const [search, setSearch] = useState("");

  const filtered = pendingEmployees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Decisions</h1>
        <p className="text-muted-foreground text-sm">High-authority overview for Site Head review. Audit AI performance metrics and HR recommendations to finalize employment contracts.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employee name or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="ops">Operations</SelectItem><SelectItem value="eng">Engineering</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="HR Rec" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="hr">Highly Recommended</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="Risk Level" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="med">Medium</SelectItem></SelectContent></Select>
          <Button>Apply Filters</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMPLOYEE NAME</TableHead>
                <TableHead>DEPARTMENT</TableHead>
                <TableHead>CONTRACT TYPE</TableHead>
                <TableHead className="text-center">AI PERF SCORE</TableHead>
                <TableHead className="text-center">ATTENDANCE %</TableHead>
                <TableHead>HR RECOMMENDATION</TableHead>
                <TableHead>RISK LEVEL</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell>
                    <Link to={`/site-head/review/${emp.id}`} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{emp.initials}</div>
                      <span className="font-medium text-foreground">{emp.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{emp.department}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.contractType}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`${emp.aiScore >= 85 ? "border-green-500 text-green-700" : emp.aiScore >= 70 ? "border-amber-500 text-amber-700" : "border-destructive text-destructive"}`}>{emp.aiScore}%</Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">{emp.attendance}%</TableCell>
                  <TableCell>{recBadge(emp.hrRecommendation)}</TableCell>
                  <TableCell>{riskBadge(emp.riskLevel)}</TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1.5 text-xs ${emp.status === "Pending" ? "text-amber-600" : "text-primary"}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${emp.status === "Pending" ? "bg-amber-500" : "bg-primary"}`} />
                      {emp.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-6 py-3 border-t text-xs text-muted-foreground">
            <span>SHOWING {filtered.length} OF 142 RECORDS</span>
            <span>Page 1 of 29</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "AWAITING DECISION", value: 42, sub: "HIGH PRIORITY", subColor: "text-destructive", icon: ClipboardCheck },
          { label: "AVG. PERFORMANCE", value: "84.5%", sub: "ABOVE TARGET", subColor: "text-green-600", icon: TrendingUp },
          { label: "CRITICAL RISKS", value: 12, sub: "ACTION NEEDED", subColor: "text-destructive", icon: AlertTriangle },
          { label: "SITE APPROVAL RATE", value: "91%", sub: "SITE: CHICAGO HQ", subColor: "text-primary", icon: CheckCircle },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-start justify-between pt-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{k.value}</p>
                <p className={`text-[10px] font-semibold uppercase mt-1 ${k.subColor}`}>{k.sub}</p>
              </div>
              <k.icon className="h-5 w-5 text-primary opacity-50" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PendingDecisions;
