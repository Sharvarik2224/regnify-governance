export interface SiteHeadKPI {
  label: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface PendingEmployee {
  id: string;
  name: string;
  initials: string;
  department: string;
  contractType: string;
  aiScore: number;
  attendance: number;
  hrRecommendation: "Highly Recommended" | "Standard" | "Not Recommended";
  riskLevel: "Low" | "Medium" | "High";
  status: "Pending" | "Under Review";
}

export interface ApprovalRecord {
  id: string;
  employee: string;
  hrRecommendation: string;
  finalDecision: string;
  date: string;
  comment: string;
  approvedBy: string;
}

export interface SiteAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
}

export const siteHeadKPIs: SiteHeadKPI[] = [
  { label: "Under Review", value: 14, change: "+2%", changeType: "positive" },
  { label: "Pending Approvals", value: 6, change: "-5%", changeType: "negative" },
  { label: "HR Recommendations", value: 10, change: "-1%", changeType: "negative" },
  { label: "High Risk Cases", value: 2, change: "-50%", changeType: "positive" },
  { label: "Contracts Expiring", value: 5, change: "-10%", changeType: "negative" },
  { label: "Approval Rate", value: "94%", change: "+1%", changeType: "positive" },
];

export const pendingEmployees: PendingEmployee[] = [
  { id: "1", name: "Johnathan Doe", initials: "JD", department: "Operations", contractType: "Full-time", aiScore: 92, attendance: 98, hrRecommendation: "Highly Recommended", riskLevel: "Low", status: "Pending" },
  { id: "2", name: "Jane Smith", initials: "JS", department: "Logistics", contractType: "Contract", aiScore: 78, attendance: 94, hrRecommendation: "Standard", riskLevel: "Medium", status: "Under Review" },
  { id: "3", name: "Michael Chen", initials: "MC", department: "Engineering", contractType: "Full-time", aiScore: 85, attendance: 99, hrRecommendation: "Highly Recommended", riskLevel: "Low", status: "Pending" },
  { id: "4", name: "Sarah Barker", initials: "SB", department: "Operations", contractType: "Contract", aiScore: 62, attendance: 88, hrRecommendation: "Not Recommended", riskLevel: "High", status: "Pending" },
  { id: "5", name: "Robert Wilson", initials: "RW", department: "Sales", contractType: "Full-time", aiScore: 81, attendance: 92, hrRecommendation: "Standard", riskLevel: "Medium", status: "Under Review" },
];

export const departmentPerformance = [
  { department: "Engineering", target: 90, actual: 85 },
  { department: "Operations", target: 85, actual: 72 },
  { department: "Sales", target: 88, actual: 82 },
  { department: "HR", target: 92, actual: 88 },
  { department: "Finance", target: 87, actual: 80 },
];

export const riskHeatmap = [
  { department: "Engineering", level: 15, label: "Minimal" },
  { department: "Operations", level: 85, label: "Elevated" },
  { department: "Sales", level: 40, label: "Stable" },
  { department: "Human Resources", level: 35, label: "Stable" },
  { department: "Finance", level: 65, label: "Watch" },
];

export const approvalTrend = [
  { month: "Jan", approvals: 12, rejections: 2 },
  { month: "Feb", approvals: 15, rejections: 1 },
  { month: "Mar", approvals: 18, rejections: 3 },
  { month: "Apr", approvals: 14, rejections: 2 },
  { month: "May", approvals: 20, rejections: 1 },
  { month: "Jun", approvals: 22, rejections: 2 },
];

export const approvalHistory: ApprovalRecord[] = [
  { id: "1", employee: "Anna Lee", hrRecommendation: "Confirm", finalDecision: "Confirmed", date: "2024-05-20", comment: "Strong performance across all metrics.", approvedBy: "A. Henderson" },
  { id: "2", employee: "Tom Baker", hrRecommendation: "Extend", finalDecision: "Extended", date: "2024-05-18", comment: "Needs 3 more months for assessment.", approvedBy: "A. Henderson" },
  { id: "3", employee: "Lisa Wang", hrRecommendation: "Confirm", finalDecision: "Confirmed", date: "2024-05-15", comment: "Exceeded expectations.", approvedBy: "A. Henderson" },
  { id: "4", employee: "James Kirk", hrRecommendation: "Terminate", finalDecision: "Terminated", date: "2024-05-10", comment: "Consistent underperformance.", approvedBy: "A. Henderson" },
];

export const siteAuditLogs: SiteAuditEntry[] = [
  { id: "1", timestamp: "2024-06-10 14:32:00", actor: "A. Henderson", action: "Final Decision", entity: "Anna Lee", details: "Confirmed employment" },
  { id: "2", timestamp: "2024-06-10 11:15:00", actor: "HR System", action: "Recommendation Submitted", entity: "Tom Baker", details: "Extend probation recommended" },
  { id: "3", timestamp: "2024-06-09 16:45:00", actor: "A. Henderson", action: "Override Decision", entity: "James Kirk", details: "Overrode HR recommendation from Extend to Terminate" },
  { id: "4", timestamp: "2024-06-09 09:00:00", actor: "System", action: "Alert Generated", entity: "Operations Dept", details: "2 cases reached risk threshold 3" },
  { id: "5", timestamp: "2024-06-08 13:20:00", actor: "A. Henderson", action: "Sent Back to HR", entity: "Lisa Wang", details: "Requested additional documentation" },
];

export const siteInsights = {
  stabilityIndex: 87,
  skillGaps: ["Cloud Architecture", "Data Engineering", "Compliance"],
  highTurnover: ["Operations", "Logistics"],
  aiInsights: [
    { title: "Workforce Stability Improving", description: "Overall retention has improved by 12% this quarter due to better onboarding processes.", severity: "positive" as const },
    { title: "Operations Department Risk", description: "Operations shows elevated risk with 2 cases at threshold. Recommend immediate intervention.", severity: "critical" as const },
    { title: "Skill Gap in Cloud Architecture", description: "34% of engineering roles require cloud skills but only 18% of current team is certified.", severity: "warning" as const },
  ],
};

export const employeeReviewData = {
  name: "Alex Johnson",
  empId: "EMP-4029",
  department: "Site Operations",
  role: "Senior Technician",
  status: "Probationary",
  daysRemaining: 15,
  hrRecommendation: "Confirm",
  aiScore: 88,
  skills: { technical: 92, punctuality: 85, growth: 78, completion: 95 },
  performanceTrend: [
    { month: "Month 1", score: 55 },
    { month: "Month 2", score: 68 },
    { month: "Month 3", score: 78 },
    { month: "Current", score: 88 },
  ],
  attendanceConsistency: 98.4,
  aiDecision: "Confirm",
  aiReasons: [
    "High task completion rate (95%) consistently maintained over the 3-month probationary period.",
    "Stable attendance pattern with no unexcused absences and high punctuality reliability.",
    "Strong manager feedback sentiment score (4.8/5.0) specifically highlighting technical adaptability.",
  ],
  workflow: [
    { step: "Direct Manager Review", actor: "Sarah Miller", status: "Recommended: Confirm", date: "2 days ago", completed: true },
    { step: "HR Compliance Check", actor: "James Wilson", status: "Status: Validated", date: "1 day ago", completed: true },
    { step: "Executive Final Decision", actor: "", status: "Awaiting your authorization", date: "", completed: false },
  ],
};
