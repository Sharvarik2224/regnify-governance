import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { attendanceRecords } from "@/data/employeeMockData";
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const days = Array.from({ length: 30 }, (_, i) => {
  const r = Math.random();
  return r > 0.9 ? "late" : r > 0.85 ? "absent" : i % 7 >= 5 ? "weekend" : "present";
});

const Attendance = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Attendance</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto text-lg font-bold text-muted-foreground mb-3">AR</div>
            <p className="font-semibold text-foreground">Alex Rivers</p>
            <p className="text-sm text-muted-foreground">Product Designer</p>
            <Badge className="mt-2 bg-primary text-primary-foreground">FULL-TIME</Badge>
          </CardContent>
        </Card>

        {[
          { label: "Present Days", value: 22, change: "+2%", changeColor: "text-green-600", icon: CheckCircle, iconColor: "text-green-500" },
          { label: "Absent Days", value: "01", change: "-1%", changeColor: "text-destructive", icon: XCircle, iconColor: "text-destructive" },
          { label: "Late Count", value: "02", change: "No change", changeColor: "text-muted-foreground", icon: Clock, iconColor: "text-amber-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <p className="text-3xl font-bold text-foreground mt-2">{kpi.value}</p>
              <p className={`text-sm ${kpi.changeColor}`}>{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">June 2024</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map(d => <span key={d} className="text-muted-foreground font-medium py-1">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {days.map((status, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 mx-auto rounded-md flex items-center justify-center text-xs font-medium ${
                    status === "present" ? "bg-green-100 text-green-700" :
                    status === "late" ? "bg-amber-100 text-amber-700" :
                    status === "absent" ? "bg-destructive/10 text-destructive" :
                    "text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" /> Present</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-destructive" /> Absent</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" /> Late</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Status */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs uppercase font-semibold opacity-80">Current Month Status</p>
            <p className="text-5xl font-bold mt-2">96%</p>
            <p className="text-sm opacity-80 mt-1">Overall Attendance Rate</p>
            <Progress value={96} className="h-2 mt-4 bg-primary-foreground/20" />
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Clock-ins</CardTitle>
          <Button variant="link" className="text-primary text-sm">View All History</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATE</TableHead>
                <TableHead>CLOCK IN</TableHead>
                <TableHead>CLOCK OUT</TableHead>
                <TableHead>DURATION</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.map((r) => (
                <TableRow key={r.date}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  <TableCell>{r.clockIn}</TableCell>
                  <TableCell>{r.clockOut}</TableCell>
                  <TableCell>{r.duration}</TableCell>
                  <TableCell>
                    <Badge className={r.status === "On Time" ? "bg-green-100 text-green-700 border-0" : "bg-destructive/10 text-destructive border-0"}>
                      {r.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
