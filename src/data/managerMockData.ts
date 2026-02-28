export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  department: string;
  probationEnd: string;
  probationEndWarning: boolean;
  tasksCompleted: number;
  tasksTotal: number;
  taskPct: number;
  attendance: number;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  status: "Active" | "Review Pending" | "Completed";
}

export interface ManagerTask {
  id: string;
  title: string;
  project: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  deadline: string;
  status: "Pending Review" | "In Progress" | "Completed" | "Revision Requested";
  score: number | null;
  priority: "Low" | "Medium" | "High";
}

export interface ManagerApproval {
  id: string;
  employeeName: string;
  employeeInitials: string;
  type: "Task" | "Evaluation";
  daysRemaining: number;
  status: "URGENT" | "PENDING" | "IN PROGRESS" | "NEW";
}

export interface GovernanceAlert {
  id: string;
  severity: "CRITICAL - RED" | "WARNING - AMBER" | "RESOLVED";
  title: string;
  description: string;
  timestamp: string;
}

export const teamMembers: TeamMember[] = [
  { id: "1", name: "Sarah Jenkins", initials: "SJ", email: "sarah.j@regnify.io", role: "Senior UI Designer", department: "Engineering", probationEnd: "Oct 24, 2024", probationEndWarning: false, tasksCompleted: 12, tasksTotal: 12, taskPct: 100, attendance: 98, riskScore: 0.02, riskLevel: "Low", status: "Active" },
  { id: "2", name: "Michael Chen", initials: "MC", email: "m.chen@regnify.io", role: "System Architect", department: "Engineering", probationEnd: "Sep 12, 2024", probationEndWarning: true, tasksCompleted: 8, tasksTotal: 15, taskPct: 53, attendance: 88, riskScore: 4.82, riskLevel: "Medium", status: "Review Pending" },
  { id: "3", name: "Elena Rodriguez", initials: "ER", email: "e.rodriguez@regnify.io", role: "QA Lead", department: "Quality", probationEnd: "Dec 05, 2024", probationEndWarning: false, tasksCompleted: 21, tasksTotal: 22, taskPct: 95, attendance: 97, riskScore: 0.15, riskLevel: "Low", status: "Active" },
  { id: "4", name: "David Kim", initials: "DK", email: "david.k@regnify.io", role: "DevOps Engineer", department: "Operations", probationEnd: "Oct 02, 2024", probationEndWarning: true, tasksCompleted: 4, tasksTotal: 18, taskPct: 22, attendance: 75, riskScore: 8.92, riskLevel: "High", status: "Review Pending" },
  { id: "5", name: "Alex Rivera", initials: "AR", email: "alex.r@regnify.io", role: "Frontend Developer", department: "Engineering", probationEnd: "Nov 15, 2024", probationEndWarning: false, tasksCompleted: 10, tasksTotal: 14, taskPct: 71, attendance: 92, riskScore: 2.1, riskLevel: "Low", status: "Active" },
  { id: "6", name: "Casey Chen", initials: "CC", email: "casey.c@regnify.io", role: "Data Analyst", department: "Finance", probationEnd: "Oct 08, 2024", probationEndWarning: true, tasksCompleted: 5, tasksTotal: 12, taskPct: 42, attendance: 65, riskScore: 7.5, riskLevel: "High", status: "Review Pending" },
];

export const managerTasks: ManagerTask[] = [
  { id: "t1", title: "Q3 Financial Audit Compliance", project: "Annual Reporting", employeeId: "1", employeeName: "Jane Doe", employeeInitials: "JD", deadline: "Oct 24, 2023", status: "Pending Review", score: null, priority: "High" },
  { id: "t2", title: "API Integration for Payment Gateway", project: "Platform Overhaul", employeeId: "2", employeeName: "Mark Smith", employeeInitials: "MS", deadline: "Oct 20, 2023", status: "In Progress", score: null, priority: "Medium" },
  { id: "t3", title: "User Retention Strategy Document", project: "Growth Marketing", employeeId: "3", employeeName: "Sarah Chen", employeeInitials: "SC", deadline: "Oct 18, 2023", status: "Completed", score: 98, priority: "Low" },
  { id: "t4", title: "Customer Support Training Module", project: "Operations Escalation", employeeId: "4", employeeName: "Liam Wilson", employeeInitials: "LW", deadline: "Oct 15, 2023", status: "Revision Requested", score: 65, priority: "High" },
  { id: "t5", title: "Security Vulnerability Assessment", project: "Infrastructure", employeeId: "5", employeeName: "Alex Rivera", employeeInitials: "AR", deadline: "Nov 01, 2023", status: "In Progress", score: null, priority: "High" },
  { id: "t6", title: "Onboarding Flow Redesign", project: "UX Initiative", employeeId: "6", employeeName: "Casey Chen", employeeInitials: "CC", deadline: "Nov 10, 2023", status: "Pending Review", score: null, priority: "Medium" },
];

export const managerApprovals: ManagerApproval[] = [
  { id: "a1", employeeName: "Alex Rivera", employeeInitials: "AR", type: "Task", daysRemaining: 3, status: "URGENT" },
  { id: "a2", employeeName: "Sarah Chen", employeeInitials: "SC", type: "Evaluation", daysRemaining: 5, status: "PENDING" },
  { id: "a3", employeeName: "Jordan Smith", employeeInitials: "JS", type: "Task", daysRemaining: 8, status: "IN PROGRESS" },
  { id: "a4", employeeName: "Mavis Beacon", employeeInitials: "MB", type: "Evaluation", daysRemaining: 12, status: "NEW" },
];

export const governanceAlerts: GovernanceAlert[] = [
  { id: "g1", severity: "CRITICAL - RED", title: "AI Conflict Flag: Algorithmic Bias detected", description: "High risk discrepancy found in automated evaluation module. The algorithm shows statistically significant deviation from equal opportunity thresholds in Department 2A (Tech Services).", timestamp: "24 MINUTES AGO" },
  { id: "g2", severity: "WARNING - AMBER", title: "Performance Drop: Department 4B", description: "Productivity metrics fell 18% below the regulatory threshold for the third consecutive week. This triggers a mandatory governance review of operational protocols.", timestamp: "2 HOURS AGO" },
  { id: "g3", severity: "CRITICAL - RED", title: "Missed Deadlines: Quarterly Compliance Filing", description: "The regulatory filing for Q3 Transparency Disclosure has not been submitted. Immediate action required to avoid statutory penalties and audit failure.", timestamp: "4 HOURS AGO" },
  { id: "g4", severity: "WARNING - AMBER", title: "Anomalous Low Attendance: Remote Cluster B", description: "Daily check-in data shows a 35% drop in connectivity for the Remote Cluster B. Potential infrastructure failure or systemic disengagement detected.", timestamp: "6 HOURS AGO" },
  { id: "g5", severity: "RESOLVED", title: "Data Export Audit Completed", description: "System detected data export review completed. All entries verified against compliance framework.", timestamp: "1 DAY AGO" },
];

export const dashboardAlerts = [
  { severity: "HIGH SEVERITY" as const, title: "Performance Decline", description: "Casey Chen's task completion dropped 15% below threshold in the last 48 hours.", timestamp: "10M AGO" },
  { severity: "MEDIUM" as const, title: "Low Attendance", description: "Jordan Smith recorded consecutive late arrivals (3 days). Impacting SLA readiness.", timestamp: "2H AGO" },
  { severity: "ADVISORY" as const, title: "Evaluation Window", description: "Mid-probation review for Alex Rivera is now open for manager input.", timestamp: "4H AGO" },
  { severity: "CONFLICT" as const, title: "Task Dependency Issue", description: "Cross-departmental task conflict flagged between Engineering and Finance modules.", timestamp: "6H AGO" },
];
