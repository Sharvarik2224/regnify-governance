import { useEffect, useState } from "react";
import { AlertTriangle, Clock, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

type HrRequestRecord = {
  id: string;
  subject: string;
  message: string;
  employee_name: string;
  employee_email: string;
  created_at: string | null;
  attachments: Array<{
    name: string;
    mime_type: string;
    size: number;
    download_url: string;
  }>;
  feedback_notes: Array<{
    note: string;
    hr_name: string;
    hr_email: string;
    created_at: string | null;
  }>;
};

const categories = [
  {
    title: "High Risk Employees",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/5 border-destructive/20",
    items: [
      { title: "Sarah Parker - Critical Risk (Score: 92)", desc: "5 days remaining. Manager recommends immediate action. AI flags attendance pattern anomaly." },
      { title: "Alice Johnson - High Risk (Score: 78)", desc: "15 days remaining. Governance conflict detected between AI and manager assessment." },
    ],
  },
  {
    title: "Attendance Violations",
    icon: Clock,
    color: "text-warning",
    bgColor: "bg-warning/5 border-warning/20",
    items: [
      { title: "Michael Chen - Below 85% Threshold", desc: "Attendance dropped to 82% over last 30 days. System activity inconsistent." },
    ],
  },
  {
    title: "Expiring Probation",
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/5 border-info/20",
    items: [
      { title: "Sarah Parker - 5 days remaining", desc: "Critical risk employee with unresolved governance checks." },
      { title: "Daniel Zhao - 12 days remaining", desc: "Low risk. All governance checks passed. Awaiting final site head approval." },
    ],
  },
];

const GovernanceAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbackInput, setFeedbackInput] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [hrRequests, setHrRequests] = useState<HrRequestRecord[]>([]);
  const [isLoadingHrRequests, setIsLoadingHrRequests] = useState(true);

  useEffect(() => {
    const fetchHrRequests = async () => {
      setIsLoadingHrRequests(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/hr-requests`);
        if (!response.ok) {
          throw new Error(`Unable to fetch HR requests. Status ${response.status}`);
        }
        const payload = await response.json();
        const requests = Array.isArray(payload?.requests) ? payload.requests : [];
        setHrRequests(requests);
        setSelectedRequestId((previous) => {
          if (previous && requests.some((request: HrRequestRecord) => request.id === previous)) {
            return previous;
          }
          return requests[0]?.id || "";
        });
      } catch {
        setHrRequests([]);
      } finally {
        setIsLoadingHrRequests(false);
      }
    };

    fetchHrRequests();
  }, []);

  const handleAddFeedback = async () => {
    const trimmedNote = feedbackInput.trim();
    if (!trimmedNote || !selectedRequestId) {
      return;
    }

    try {
      setIsSavingFeedback(true);
      const response = await fetch(`${API_BASE_URL}/api/hr-requests/${selectedRequestId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: trimmedNote,
          hr_name: user?.name || "",
          hr_email: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to save feedback. Status ${response.status}`);
      }

      const refreshedResponse = await fetch(`${API_BASE_URL}/api/hr-requests`);
      if (!refreshedResponse.ok) {
        throw new Error(`Unable to refresh HR requests. Status ${refreshedResponse.status}`);
      }

      const refreshedPayload = await refreshedResponse.json().catch(() => null);
      const requests = Array.isArray(refreshedPayload?.requests) ? refreshedPayload.requests : [];
      setHrRequests(requests);
      setFeedbackInput("");

      toast({
        title: "Feedback saved",
        description: "HR feedback has been added to employee communication.",
      });
    } catch (error) {
      toast({
        title: "Unable to save feedback",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const totalFeedbackNotes = hrRequests.reduce(
    (sum, request) => sum + (Array.isArray(request.feedback_notes) ? request.feedback_notes.length : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Governance Alerts</h1>
        <p className="text-sm text-muted-foreground">Critical governance notifications requiring immediate HR attention.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-lg border border-border bg-card">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <cat.icon className={`h-5 w-5 ${cat.color}`} />
              <h2 className="font-semibold text-foreground">{cat.title}</h2>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{cat.items.length}</span>
            </div>
            <div className="p-5 space-y-3">
              {cat.items.map((item, i) => (
                <div key={i} className={`rounded-lg border p-4 ${cat.bgColor}`}>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-border bg-card">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Leave Applications, Manager Reports & HR Feedback</h2>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{hrRequests.length + totalFeedbackNotes}</span>
          </div>

          <div className="p-5 space-y-3">
            {isLoadingHrRequests ? (
              <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground">Loading employee requests...</p>
              </div>
            ) : hrRequests.length === 0 ? (
              <div className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground">No employee HR requests yet.</p>
              </div>
            ) : (
              hrRequests.map((request) => (
                <div key={request.id} className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                  <h3 className="text-sm font-semibold text-foreground">{request.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{request.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">From: {request.employee_name || "Employee"} ({request.employee_email || "N/A"})</p>
                  {request.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {request.attachments.map((file, index) => (
                        <p key={`${request.id}-${index}`} className="text-[11px] text-muted-foreground">
                          Attachment: <a className="text-primary underline" href={file.download_url} target="_blank" rel="noreferrer">{file.name}</a>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="rounded-lg border p-4 bg-primary/5 border-primary/20 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Add HR Feedback Note</h3>
              <div>
                <Label htmlFor="hr_feedback_request">Request</Label>
                <Select value={selectedRequestId} onValueChange={setSelectedRequestId} disabled={hrRequests.length === 0}>
                  <SelectTrigger id="hr_feedback_request" className="mt-1">
                    <SelectValue placeholder="Select employee request" />
                  </SelectTrigger>
                  <SelectContent>
                    {hrRequests.map((request) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.subject} - {request.employee_name || request.employee_email || "Employee"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Write an HR feedback note for an employee..."
                value={feedbackInput}
                onChange={(event) => setFeedbackInput(event.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={handleAddFeedback} disabled={!selectedRequestId || isSavingFeedback}>
                {isSavingFeedback ? "Saving..." : "Save Feedback Note"}
              </Button>
            </div>

            {hrRequests.flatMap((request) =>
              (Array.isArray(request.feedback_notes) ? request.feedback_notes : []).map((note, index) => (
                <div key={`${request.id}-${index}`} className="rounded-lg border p-4 bg-primary/5 border-primary/20">
                  <h3 className="text-sm font-semibold text-foreground">HR Feedback Note</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note.note}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    For: {request.employee_name || request.employee_email || "Employee"}
                    {note.created_at ? ` • ${new Date(note.created_at).toLocaleString()}` : ""}
                  </p>
                </div>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceAlerts;
