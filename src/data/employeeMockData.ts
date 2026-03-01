export interface EmployeeTask {
  id: string;
  title: string;
  assignedBy: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  progress: number;
  description: string;
  comments: { author: string; role: string; text: string; date: string; attachment?: string }[];
}

export interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMine: boolean;
  attachment?: { name: string; size: string };
}

export interface HRUpdate {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "Personal" | "Announcement" | "Benefits";
  important: boolean;
  action?: { label: string };
  image?: boolean;
}

export interface AttendanceRecord {
  date: string;
  clockIn: string;
  clockOut: string;
  duration: string;
  status: "On Time" | "Late";
}

export const employeeTasks: EmployeeTask[] = [
  {
    id: "REG-4029",
    title: "Finalize Quarterly Audit Report",
    assignedBy: "Sarah Jenkins",
    deadline: "Oct 25, 2023",
    priority: "High",
    status: "In Progress",
    progress: 75,
    description: "Comprehensive review of all financial transactions for Q3 2023. Ensure all receipts are digitized and categorized according to the new compliance standards updated in August.\n\nKey areas to focus on:\n- Internal department travel expenses\n- Software subscription renewals and procurement approvals\n- Contractual service fees and vendor invoicing reconciliations\n\nThe final report needs to be exported in PDF and uploaded to the Finance shared drive before the deadline for board review.",
    comments: [
      { author: "You", role: "Employee", text: "Updated progress to 65%. Completed the reconciliation for department travel expenses.", date: "2 hours ago", attachment: "travel_expenses_recon.xlsx" },
      { author: "Sarah Jenkins", role: "Manager", text: "Great work on the software subscriptions section. Please make sure to double-check the procurement IDs for the AWS renewals.", date: "Yesterday, 4:15 PM" },
      { author: "System", role: "System", text: "Task created and assigned to you.", date: "Oct 18, 2023" },
    ],
  },
  {
    id: "REG-4030",
    title: "API Documentation Revamp",
    assignedBy: "Sarah Jenkins",
    deadline: "Oct 24, 2023",
    priority: "High",
    status: "In Progress",
    progress: 65,
    description: "Update all API documentation to reflect the latest v3 endpoints.",
    comments: [],
  },
  {
    id: "REG-4031",
    title: "Database Migration",
    assignedBy: "Mike Ross",
    deadline: "Oct 28, 2023",
    priority: "Medium",
    status: "Pending",
    progress: 0,
    description: "Migrate legacy database tables to the new schema.",
    comments: [],
  },
  {
    id: "REG-4032",
    title: "UI Component Library",
    assignedBy: "Sarah Jenkins",
    deadline: "Nov 05, 2023",
    priority: "Low",
    status: "In Progress",
    progress: 45,
    description: "Build a shared UI component library for the design system.",
    comments: [],
  },
  {
    id: "REG-4033",
    title: "Security Audit",
    assignedBy: "David Chen",
    deadline: "Nov 12, 2023",
    priority: "High",
    status: "Completed",
    progress: 100,
    description: "Complete security audit for all production services.",
    comments: [],
  },
];

export const conversations: Conversation[] = [
  { id: "1", name: "Sarah Jenkins", role: "Engineering Manager", lastMessage: "Let's discuss the quarterly...", time: "10:24 AM", unread: false, online: true },
  { id: "2", name: "HR Admin", role: "Human Resources", lastMessage: "Your benefits package has been...", time: "9:15 AM", unread: true, online: false },
  { id: "3", name: "Michael Chen", role: "Senior Developer", lastMessage: "The server logs show no errors from...", time: "Yesterday", unread: false, online: false },
  { id: "4", name: "Internal Comms", role: "Announcements", lastMessage: "Reminder: All-hands meeting is startin...", time: "Yesterday", unread: false, online: false },
];

export const chatMessages: ChatMessage[] = [
  { id: "1", sender: "Sarah Jenkins", text: "Hi Alex, hope you're having a good morning. I've just reviewed the mockups for the new HR dashboard.", time: "10:18 AM", isMine: false },
  { id: "2", sender: "Sarah Jenkins", text: "They look great! Just a few minor tweaks needed on the communication tab we're building. Can we jump on a brief call to discuss the quarterly goals related to this?", time: "10:18 AM", isMine: false },
  { id: "3", sender: "Me", text: "Absolutely, Sarah. I'm free after 2:00 PM today. Does that work for you?", time: "10:24 AM", isMine: true },
  { id: "4", sender: "Sarah Jenkins", text: "Here's the document I was mentioning.", time: "10:25 AM", isMine: false, attachment: { name: "Quarterly_Goals_V2.pdf", size: "2.4 MB" } },
];

export const hrUpdates: HRUpdate[] = [
  { id: "1", title: "Contract Decision: Permanent Conversion Recommended", description: "Congratulations! Following your Q3 review, the leadership team has recommended your transition from fixed-term to a permanent contract status. This reflects your significant contributions to the Regnify growth project.", date: "Today, 10:45 AM", category: "Personal", important: true, action: { label: "Review & Accept" }, image: true },
  { id: "2", title: "Performance Review Scheduled", description: "Your annual performance discussion with Sarah Jenkins has been set for next Tuesday. Please ensure your self-assessment is submitted via the portal by Friday EOD.", date: "Nov 14, 2023", category: "Personal", important: true, action: { label: "View Self-Assessment" } },
  { id: "3", title: "New Remote Work Policy Updates", description: "We've updated our guidelines regarding workstation stipends and core collaboration hours. Please review the documentation to understand how this affects your current setup.", date: "Nov 12, 2023", category: "Announcement", important: false, action: { label: "Download PDF" } },
  { id: "4", title: "Health Insurance Open Enrollment", description: "The annual window for health insurance modifications is open. All employees must confirm their plan selections by November 30th.", date: "Nov 10, 2023", category: "Benefits", important: false, action: { label: "Open Portal" } },
];

export const attendanceRecords: AttendanceRecord[] = [
  { date: "June 10, 2024", clockIn: "08:55 AM", clockOut: "06:05 PM", duration: "9h 10m", status: "On Time" },
  { date: "June 09, 2024", clockIn: "09:15 AM", clockOut: "06:00 PM", duration: "8h 45m", status: "Late" },
  { date: "June 08, 2024", clockIn: "08:45 AM", clockOut: "06:15 PM", duration: "9h 30m", status: "On Time" },
];

export const performanceData = {
  overallScore: 92,
  monthlyTrend: [
    { month: "Jan", score: 72 },
    { month: "Feb", score: 68 },
    { month: "Mar", score: 75 },
    { month: "Apr", score: 80 },
    { month: "May", score: 88 },
    { month: "Jun", score: 92 },
  ],
  taskCompletion: [
    { category: "Development Tasks", rate: 94 },
    { category: "Code Reviews", rate: 88 },
    { category: "Documentation", rate: 76 },
  ],
  skillRadar: [
    { skill: "Technical", score: 92 },
    { skill: "Punctuality", score: 85 },
    { skill: "Growth", score: 78 },
    { skill: "Completion", score: 95 },
  ],
  managerFeedback: {
    manager: "Sarah Thompson",
    role: "Engineering Manager",
    summary: "Alex has shown exceptional growth in technical architecture this quarter. His ability to mentor junior developers while maintaining high code quality is a significant asset to the team. I'm looking forward to seeing him lead the next major feature release.",
    tags: ["Team Player", "Architecture Expert", "Goal-oriented"],
  },
  aiInsight: "Your performance improved 10% this month due to consistent task completion and high collaboration scores.",
};
