import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Send, Upload, Building2, UserRound, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const GENERATE_HR_AI_ENDPOINT = `${API_BASE_URL}/api/hr-ai-generate-request`;
const CREATE_HR_REQUEST_ENDPOINT = `${API_BASE_URL}/api/hr-requests`;

type EmployeeTask = {
  id: string;
  title: string;
  status: string;
  managerFeedback: {
    criteria?: string;
    reviewed_at?: string;
  } | null;
};

type HrFeedbackNote = {
  note: string;
  hr_name: string;
  hr_email: string;
  created_at: string | null;
};

type HrRequestRecord = {
  id: string;
  subject: string;
  message: string;
  employee_name: string;
  employee_email: string;
  created_at: string | null;
  feedback_notes: HrFeedbackNote[];
};

const SUBMIT_TASK_ENDPOINT = (taskId: string) => `${API_BASE_URL}/api/tasks/${taskId}/submit`;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });

const normalizeStatus = (value: string) => {
  const status = String(value || "").toLowerCase();
  if (status === "completed" || status === "complete") return "Completed";
  if (status === "in progress") return "In Progress";
  return "Pending";
};

const extractAiMessageText = (payload: any) => {
  const candidates = [
    payload?.data?.output,
    payload?.data?.message,
    payload?.data?.text,
    payload?.output,
    payload?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
};

const Communication = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [activeTab, setActiveTab] = useState("manager");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [managerComment, setManagerComment] = useState("");
  const [taskImage, setTaskImage] = useState<File | null>(null);
  const [deployedLink, setDeployedLink] = useState("");
  const [isSubmittingManagerUpdate, setIsSubmittingManagerUpdate] = useState(false);

  const [hrSubject, setHrSubject] = useState("");
  const [hrMessage, setHrMessage] = useState("");
  const [hrFiles, setHrFiles] = useState<File[]>([]);
  const [hrRequests, setHrRequests] = useState<HrRequestRecord[]>([]);
  const [isLoadingHrRequests, setIsLoadingHrRequests] = useState(false);
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generatedAiMessage, setGeneratedAiMessage] = useState("");

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (!user?.email) {
        setTasks([]);
        return;
      }

      setIsLoadingTasks(true);
      try {
        const query = new URLSearchParams({ assignedToEmail: user.email });
        const response = await fetch(`${API_BASE_URL}/api/tasks?${query.toString()}`);

        if (!response.ok) {
          throw new Error(`Unable to load tasks. Status ${response.status}`);
        }

        const payload = await response.json();
        const apiTasks = Array.isArray(payload?.tasks) ? payload.tasks : [];

        const normalizedTasks: EmployeeTask[] = apiTasks.map((task: any) => ({
          id: String(task.id),
          title: String(task.title || "Untitled Task"),
          status: normalizeStatus(task.managerStatus || task.status || "Pending"),
          managerFeedback: task.managerFeedback || null,
        }));

        setTasks(normalizedTasks);
        if (normalizedTasks.length > 0) {
          setSelectedTaskId(normalizedTasks[0].id);
        }
      } catch (error) {
        toast({
          title: "Unable to load tasks",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchMyTasks();
  }, [user?.email, toast]);

  useEffect(() => {
    const fetchHrRequests = async () => {
      if (!user?.email) {
        setHrRequests([]);
        return;
      }

      setIsLoadingHrRequests(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/hr-requests`);
        if (!response.ok) {
          throw new Error(`Unable to load HR requests. Status ${response.status}`);
        }

        const payload = await response.json();
        const allRequests = Array.isArray(payload?.requests) ? payload.requests : [];

        const employeeRequests: HrRequestRecord[] = allRequests
          .filter((request: any) => String(request?.employee_email || "").toLowerCase() === user.email.toLowerCase())
          .map((request: any) => ({
            id: String(request?.id || ""),
            subject: String(request?.subject || "Untitled Request"),
            message: String(request?.message || ""),
            employee_name: String(request?.employee_name || ""),
            employee_email: String(request?.employee_email || ""),
            created_at: request?.created_at || null,
            feedback_notes: Array.isArray(request?.feedback_notes)
              ? request.feedback_notes
                  .map((note: any) => ({
                    note: String(note?.note || "").trim(),
                    hr_name: String(note?.hr_name || "").trim(),
                    hr_email: String(note?.hr_email || "").trim(),
                    created_at: note?.created_at || null,
                  }))
                  .filter((note: HrFeedbackNote) => Boolean(note.note))
              : [],
          }))
          .filter((request) => Boolean(request.id));

        setHrRequests(employeeRequests);
      } catch (error) {
        setHrRequests([]);
        toast({
          title: "Unable to load HR communication",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHrRequests(false);
      }
    };

    fetchHrRequests();
  }, [user?.email, toast]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  );

  const managerFeedbackItems = useMemo(
    () => tasks.filter((task) => Boolean(task.managerFeedback?.criteria)),
    [tasks],
  );

  const handleManagerSubmit = async () => {
    if (!selectedTaskId) {
      toast({
        title: "Select a task",
        description: "Choose a task before submitting an update.",
        variant: "destructive",
      });
      return;
    }

    if (!managerComment.trim() && !deployedLink.trim() && !taskImage) {
      toast({
        title: "Submission details required",
        description: "Add comment, deployed link, or task image before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingManagerUpdate(true);

      const imageBase64 = taskImage ? await toBase64(taskImage) : "";

      const response = await fetch(SUBMIT_TASK_ENDPOINT(selectedTaskId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: managerComment,
          deployed_link: deployedLink,
          image_base64: imageBase64,
          image_name: taskImage?.name || "",
          image_mime_type: taskImage?.type || "",
          submitted_by_email: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to submit update. Status ${response.status}`);
      }

      toast({
        title: "Update submitted",
        description: "Task is submitted for manager review.",
      });

      setTasks((previous) =>
        previous.map((task) =>
          task.id === selectedTaskId
            ? {
                ...task,
                status: "In Progress",
              }
            : task,
        ),
      );

      setManagerComment("");
      setTaskImage(null);
      setDeployedLink("");
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingManagerUpdate(false);
    }
  };

  const handleHrSubmit = async () => {
    if (!hrSubject.trim() || !hrMessage.trim()) {
      toast({
        title: "Incomplete request",
        description: "Please add both subject and message for HR.",
        variant: "destructive",
      });
      return;
    }

    try {
      const attachments = await Promise.all(
        hrFiles.map(async (file) => ({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          base64: await toBase64(file),
        })),
      );

      const response = await fetch(CREATE_HR_REQUEST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: hrSubject,
          message: hrMessage,
          employee_name: user?.name || "",
          employee_email: user?.email || "",
          attachments,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to send request. Status ${response.status}`);
      }

      toast({
        title: "Message sent to HR",
        description: "Your request and attachment were submitted successfully.",
      });

      setHrSubject("");
      setHrMessage("");
      setHrFiles([]);

      const refreshedResponse = await fetch(`${API_BASE_URL}/api/hr-requests`);
      if (refreshedResponse.ok) {
        const refreshedPayload = await refreshedResponse.json().catch(() => null);
        const allRequests = Array.isArray(refreshedPayload?.requests) ? refreshedPayload.requests : [];
        const employeeRequests: HrRequestRecord[] = allRequests
          .filter((request: any) => String(request?.employee_email || "").toLowerCase() === String(user?.email || "").toLowerCase())
          .map((request: any) => ({
            id: String(request?.id || ""),
            subject: String(request?.subject || "Untitled Request"),
            message: String(request?.message || ""),
            employee_name: String(request?.employee_name || ""),
            employee_email: String(request?.employee_email || ""),
            created_at: request?.created_at || null,
            feedback_notes: Array.isArray(request?.feedback_notes)
              ? request.feedback_notes
                  .map((note: any) => ({
                    note: String(note?.note || "").trim(),
                    hr_name: String(note?.hr_name || "").trim(),
                    hr_email: String(note?.hr_email || "").trim(),
                    created_at: note?.created_at || null,
                  }))
                  .filter((note: HrFeedbackNote) => Boolean(note.note))
              : [],
          }))
          .filter((request) => Boolean(request.id));

        setHrRequests(employeeRequests);
      }
    } catch (error) {
      toast({
        title: "Failed to send to HR",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingWithAi(true);

      const response = await fetch(GENERATE_HR_AI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: hrSubject,
          message: hrMessage,
          employee_name: user?.name || "",
          employee_email: user?.email || "",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to trigger AI generation. Status ${response.status}`);
      }

      const payload = await response.json().catch(() => null);
      const generatedMessage = extractAiMessageText(payload);

      if (generatedMessage) {
        setGeneratedAiMessage(generatedMessage);
        setIsAiModalOpen(true);
      }

      toast({
        title: "AI workflow triggered",
        description: generatedMessage ? "Generated content appended to message." : "Workflow completed but no message text was returned.",
      });
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWithAi(false);
    }
  };

  const handleUseGeneratedMessage = () => {
    if (!generatedAiMessage.trim()) {
      return;
    }

    setHrMessage((previous) => (previous.trim() ? `${previous}\n\n${generatedAiMessage.trim()}` : generatedAiMessage.trim()));
    setIsAiModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communication</h1>
        <p className="text-sm text-muted-foreground">Choose where you want to communicate and submit your update.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="hr" className="gap-2"><Building2 className="h-4 w-4" />Communication with HR</TabsTrigger>
          <TabsTrigger value="manager" className="gap-2"><UserRound className="h-4 w-4" />Communication with Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="hr" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Raise Request to HR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hr_subject">Subject</Label>
                  <Input
                    id="hr_subject"
                    className="mt-1"
                    placeholder="Salary slip request / Leave clarification / Policy question"
                    value={hrSubject}
                    onChange={(event) => setHrSubject(event.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="hr_message">Message</Label>
                  <Textarea
                    id="hr_message"
                    rows={5}
                    className="mt-1"
                    placeholder="Write your message to HR..."
                    value={hrMessage}
                    onChange={(event) => setHrMessage(event.target.value)}
                  />
                  <Button type="button" variant="ghost" size="sm" className="mt-2 px-0 text-primary" onClick={handleGenerateWithAi} disabled={isGeneratingWithAi}>
                    {isGeneratingWithAi ? "Generating..." : "OR (generate with AI)"}
                  </Button>
                </div>

                <div>
                  <Label htmlFor="hr_files">Attachments</Label>
                  <Input
                    id="hr_files"
                    type="file"
                    className="mt-1"
                    multiple
                    onChange={(event) => setHrFiles(Array.from(event.target.files || []))}
                  />
                  {hrFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">Attached: {hrFiles.map((file) => file.name).join(", ")}</p>
                  )}
                </div>

                <Button onClick={handleHrSubmit} className="w-full">
                  <Send className="mr-2 h-4 w-4" />Send to HR
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Communication with HR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingHrRequests ? (
                  <p className="text-sm text-muted-foreground">Loading your requests...</p>
                ) : hrRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No HR requests yet.</p>
                ) : (
                  hrRequests.map((request) => (
                    <div key={request.id} className="rounded-md border border-border p-3 space-y-2">
                      <p className="text-sm font-semibold text-foreground">{request.subject}</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{request.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {request.created_at ? `Sent: ${new Date(request.created_at).toLocaleString()}` : "Sent"}
                      </p>

                      {request.feedback_notes.length > 0 && (
                        <div className="pt-2 border-t border-border space-y-2">
                          {request.feedback_notes.map((note, index) => (
                            <div key={`${request.id}-feedback-${index}`} className="rounded-md bg-muted/40 p-2">
                              <p className="text-xs font-medium text-foreground">HR Feedback</p>
                              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{note.note}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {(note.hr_name || note.hr_email) ? `From: ${note.hr_name || note.hr_email}` : "From: HR"}
                                {note.created_at ? ` • ${new Date(note.created_at).toLocaleString()}` : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manager" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" />Post Update</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Task</Label>
                  <Select
                    value={selectedTaskId}
                    onValueChange={(value) => {
                      setSelectedTaskId(value);
                    }}
                    disabled={isLoadingTasks || tasks.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={isLoadingTasks ? "Loading tasks..." : "Select task"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTask && (
                    <p className="text-xs text-muted-foreground mt-2">Current Task Status: {selectedTask.status}</p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">Submitting update will mark task for manager review.</p>

                <div>
                  <Label htmlFor="manager_comment">Add Comment</Label>
                  <Textarea
                    id="manager_comment"
                    className="mt-1"
                    rows={4}
                    placeholder="Describe what you've accomplished..."
                    value={managerComment}
                    onChange={(event) => setManagerComment(event.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="task_image">Upload Task Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mt-1">
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Upload image proof of completed task</p>
                    <Input
                      id="task_image"
                      type="file"
                      className="mt-3"
                      accept="image/*"
                      onChange={(event) => setTaskImage((event.target.files || [])[0] || null)}
                    />
                  </div>
                  {taskImage && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />{taskImage.name}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="deployed_link">Deployed Link</Label>
                  <Input
                    id="deployed_link"
                    className="mt-1"
                    placeholder="https://your-deployed-app.com"
                    value={deployedLink}
                    onChange={(event) => setDeployedLink(event.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleManagerSubmit} disabled={isSubmittingManagerUpdate}>
                  <Send className="mr-2 h-4 w-4" />{isSubmittingManagerUpdate ? "Submitting..." : "Submit Task Update"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feedback from Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {managerFeedbackItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No feedback received yet.</p>
                ) : (
                  managerFeedbackItems.map((task) => (
                    <div key={task.id} className="rounded-md border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{task.managerFeedback?.criteria}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {task.managerFeedback?.reviewed_at ? `Reviewed: ${new Date(task.managerFeedback.reviewed_at).toLocaleString()}` : "Reviewed"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Generated Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Review and edit the generated draft before inserting it into your HR message.</p>
            <Textarea
              rows={12}
              value={generatedAiMessage}
              onChange={(event) => setGeneratedAiMessage(event.target.value)}
              placeholder="Generated content will appear here..."
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAiModalOpen(false)} className="w-full">Close</Button>
              <Button onClick={handleUseGeneratedMessage} className="w-full">Use In Message</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Communication;
