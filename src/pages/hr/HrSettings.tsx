import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Upload, RefreshCw, ShieldCheck, ShieldX, KeyRound, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SignatureRecord = {
  id?: string;
  hr_id?: string;
  file_url: string;
  file_hash: string;
  uploaded_at: string;
  status: "active" | "revoked";
};

type ProfileSettings = {
  hrName: string;
  designation: string;
  department: string;
  officialEmail: string;
  contactNumber: string;
  employeeId: string;
  timezone: string;
  organizationName: string;
  generateOfferLetters: boolean;
  siteHeadApprovalRequired: boolean;
  workflowUpdateChannel: "whatsapp" | "gmail";
};

type PasswordSettings = {
  newPassword: string;
  confirmPassword: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 

const HrSettings = () => {
  const { user } = useAuth();
  const hrId = useMemo(() => user?.email || "hr-admin@regnify.local", [user?.email]);

  const [profile, setProfile] = useState<ProfileSettings>({
    hrName: user?.name || "",
    designation: "HR Admin",
    department: "Human Resources",
    officialEmail: user?.email || "",
    contactNumber: "",
    employeeId: "",
    timezone: "Asia/Kolkata",
    organizationName: "Global Corp",
    generateOfferLetters: true,
    siteHeadApprovalRequired: false,
    workflowUpdateChannel: "gmail",
  });

  const [signature, setSignature] = useState<SignatureRecord | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [certificateFileName, setCertificateFileName] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [profilePhotoFileName, setProfilePhotoFileName] = useState<string>("");
  const [organizationLogoFileName, setOrganizationLogoFileName] = useState<string>("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [organizationLogoFile, setOrganizationLogoFile] = useState<File | null>(null);
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isRevokingSignature, setIsRevokingSignature] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingDigitalCertificate, setIsSavingDigitalCertificate] = useState(false);
  const [isGeneratingDigitalCertificate, setIsGeneratingDigitalCertificate] = useState(false);
  const [isDownloadingDigitalCertificate, setIsDownloadingDigitalCertificate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [certificateMessage, setCertificateMessage] = useState<string>("");
  const [certificateError, setCertificateError] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSettings, setPasswordSettings] = useState<PasswordSettings>({
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [workflowManualOfferLetterFileName, setWorkflowManualOfferLetterFileName] = useState<string>("");
  const [workflowManualOfferLetterFile, setWorkflowManualOfferLetterFile] = useState<File | null>(null);
  const [isSavingWorkflowSettings, setIsSavingWorkflowSettings] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState<string>("");
  const [workflowError, setWorkflowError] = useState<string>("");

  const fetchHrData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr-data/${encodeURIComponent(hrId)}`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => null);
      const hrData = payload?.hrData;
      if (!hrData) {
        return;
      }

      setProfile((previous) => ({
        ...previous,
        hrName: hrData.hr_name ?? previous.hrName,
        designation: hrData.designation ?? previous.designation,
        department: hrData.department ?? previous.department,
        officialEmail: hrData.official_email ?? previous.officialEmail,
        contactNumber: hrData.contact_number ?? previous.contactNumber,
        employeeId: hrData.employee_id ?? previous.employeeId,
        timezone: hrData.timezone ?? previous.timezone,
        organizationName: hrData.organization_name ?? previous.organizationName,
        generateOfferLetters: typeof hrData.generate_offer_letters_enabled === "boolean"
          ? hrData.generate_offer_letters_enabled
          : previous.generateOfferLetters,
        siteHeadApprovalRequired: typeof hrData.site_head_approval_required === "boolean"
          ? hrData.site_head_approval_required
          : previous.siteHeadApprovalRequired,
        workflowUpdateChannel: hrData.workflow_update_channel === "whatsapp" || hrData.workflow_update_channel === "gmail"
          ? hrData.workflow_update_channel
          : previous.workflowUpdateChannel,
      }));

      setTwoFactorEnabled(Boolean(hrData.two_factor_enabled));
      setProfilePhotoFileName(hrData.profile_photo_name || "");
      setOrganizationLogoFileName(hrData.organization_logo_name || "");
    } catch {
      // no-op for initial load
    }
  }, [hrId]);

  const saveWorkflowSettings = useCallback(
    async (
      nextWorkflow?: Partial<Pick<ProfileSettings, "generateOfferLetters" | "siteHeadApprovalRequired" | "workflowUpdateChannel">>,
      uploadManualTemplate = false,
    ) => {
      const workflowPayload = {
        generateOfferLetters: nextWorkflow?.generateOfferLetters ?? profile.generateOfferLetters,
        siteHeadApprovalRequired: nextWorkflow?.siteHeadApprovalRequired ?? profile.siteHeadApprovalRequired,
        workflowUpdateChannel: nextWorkflow?.workflowUpdateChannel ?? profile.workflowUpdateChannel,
      };

      setIsSavingWorkflowSettings(true);
      setWorkflowError("");
      setWorkflowMessage("");

      try {
        const workflowResponse = await fetch(`${API_BASE_URL}/api/hr-data/workflow-settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hr_id: hrId,
            generate_offer_letters_enabled: workflowPayload.generateOfferLetters,
            site_head_approval_required: workflowPayload.siteHeadApprovalRequired,
            workflow_update_channel: workflowPayload.workflowUpdateChannel,
          }),
        });

        const workflowResult = await workflowResponse.json().catch(() => null);
        if (!workflowResponse.ok) {
          throw new Error(workflowResult?.error || `Unable to save workflow settings (${workflowResponse.status})`);
        }

        if (!workflowPayload.generateOfferLetters && uploadManualTemplate && workflowManualOfferLetterFile) {
          if (workflowManualOfferLetterFile.type !== "application/pdf") {
            throw new Error("Only PDF files are allowed for manual offer letter upload.");
          }

          const manualFileBase64 = await readAsDataUrl(workflowManualOfferLetterFile);
          const manualUploadResponse = await fetch(`${API_BASE_URL}/api/hr-data/workflow-manual-offer-letter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hr_id: hrId,
              file_name: workflowManualOfferLetterFile.name,
              mime_type: workflowManualOfferLetterFile.type,
              file_base64: manualFileBase64,
            }),
          });

          const manualUploadPayload = await manualUploadResponse.json().catch(() => null);
          if (!manualUploadResponse.ok) {
            throw new Error(manualUploadPayload?.error || `Unable to upload manual offer letter (${manualUploadResponse.status})`);
          }

          setWorkflowManualOfferLetterFileName(workflowManualOfferLetterFile.name);
          setWorkflowManualOfferLetterFile(null);
          setWorkflowMessage("Workflow settings saved and manual offer letter template stored.");
          return;
        }

        setWorkflowMessage("Workflow settings saved successfully.");
      } catch (error) {
        setWorkflowError(error instanceof Error ? error.message : "Unable to save workflow settings.");
      } finally {
        setIsSavingWorkflowSettings(false);
      }
    },
    [hrId, profile.generateOfferLetters, profile.siteHeadApprovalRequired, profile.workflowUpdateChannel, workflowManualOfferLetterFile],
  );

  const handleWorkflowToggleChange = useCallback(
    (
      field: "generateOfferLetters" | "siteHeadApprovalRequired",
      checked: boolean,
    ) => {
      const nextWorkflow = {
        generateOfferLetters: field === "generateOfferLetters" ? checked : profile.generateOfferLetters,
        siteHeadApprovalRequired: field === "siteHeadApprovalRequired" ? checked : profile.siteHeadApprovalRequired,
        workflowUpdateChannel: profile.workflowUpdateChannel,
      };

      setProfile((prev) => ({ ...prev, [field]: checked }));
      void saveWorkflowSettings(nextWorkflow, false);
    },
    [profile.generateOfferLetters, profile.siteHeadApprovalRequired, profile.workflowUpdateChannel, saveWorkflowSettings],
  );

  const handleWorkflowChannelChange = useCallback(
    (value: "whatsapp" | "gmail") => {
      const nextWorkflow = {
        generateOfferLetters: profile.generateOfferLetters,
        siteHeadApprovalRequired: profile.siteHeadApprovalRequired,
        workflowUpdateChannel: value,
      };

      setProfile((prev) => ({ ...prev, workflowUpdateChannel: value }));
      void saveWorkflowSettings(nextWorkflow, false);
    },
    [profile.generateOfferLetters, profile.siteHeadApprovalRequired, saveWorkflowSettings],
  );

  const initializeSettings = useCallback(async () => {
    await fetchHrData();

    try {
      const response = await fetch(`${API_BASE_URL}/api/digital-certificates/${encodeURIComponent(hrId)}`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => null);
      const digitalCertificate = payload?.digitalCertificate;
      if (!digitalCertificate) {
        return;
      }

      setCertificateFileName(digitalCertificate.file_name || "");
    } catch {
      // no-op for initial load
    }
  }, [fetchHrData, hrId]);

  useEffect(() => {
    void initializeSettings();
  }, [initializeSettings]);

  const fetchSignature = useCallback(async () => {
    setIsLoadingSignature(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/signatures/${encodeURIComponent(hrId)}`);
      if (response.status === 404) {
        setSignature(null);
        setSignaturePreview("");
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Unable to fetch signature (${response.status})`);
      }

      const payload = await response.json();
      const nextSignature = payload?.signature ?? null;
      setSignature(nextSignature);
      setSignaturePreview(nextSignature?.file_url || "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to fetch signature settings.");
    } finally {
      setIsLoadingSignature(false);
    }
  }, [hrId]);

  const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const allowedMimeTypes = ["image/png", "image/jpeg"];
    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setErrorMessage("Only PNG or JPG/JPEG signatures are allowed.");
      return;
    }

    setIsUploadingSignature(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const fileDataUrl = await readAsDataUrl(selectedFile);
      const response = await fetch(`${API_BASE_URL}/api/signatures/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hr_id: hrId,
          file_name: selectedFile.name,
          mime_type: selectedFile.type,
          file_base64: fileDataUrl,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Signature upload failed (${response.status})`);
      }

      setSignature(payload.signature);
      setSignaturePreview(payload.signature?.file_url || fileDataUrl);
      setStatusMessage("Signature uploaded and activated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload signature.");
    } finally {
      setIsUploadingSignature(false);
      event.target.value = "";
    }
  };

  const handleSaveDigitalCertificate = async () => {
    setIsSavingDigitalCertificate(true);
    setCertificateError("");
    setCertificateMessage("");

    try {
      if (certificateFile && !certificateFile.name.toLowerCase().endsWith(".p12")) {
        throw new Error("Only .p12 digital certificate files are allowed.");
      }

      const certificateBase64 = certificateFile ? await readAsDataUrl(certificateFile) : null;

      const response = await fetch(`${API_BASE_URL}/api/digital-certificates/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hr_id: hrId,
          digital_signing_enabled: true,
          file_name: certificateFile?.name || null,
          mime_type: certificateFile?.type || "application/x-pkcs12",
          file_base64: certificateBase64,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to save digital certificate settings (${response.status})`);
      }

      const savedCertificate = payload?.digitalCertificate;
      if (savedCertificate?.file_name) {
        setCertificateFileName(savedCertificate.file_name);
      }

      setCertificateFile(null);
      setCertificateMessage("Digital certificate settings saved successfully.");
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : "Unable to save digital certificate settings.");
    } finally {
      setIsSavingDigitalCertificate(false);
    }
  };

  const handleGenerateDigitalCertificate = async () => {
    setIsGeneratingDigitalCertificate(true);
    setCertificateError("");
    setCertificateMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.hrName || "HR",
          email: profile.officialEmail || hrId,
          company: profile.organizationName || "Regnify",
        }),
      });

      if (!response.ok) {
        throw new Error(`Certificate generation trigger failed (${response.status})`);
      }

      setCertificateMessage("Digital certificate generation request sent successfully.");
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : "Unable to trigger digital certificate generation.");
    } finally {
      setIsGeneratingDigitalCertificate(false);
    }
  };

  const handleDownloadDigitalCertificate = async () => {
    setIsDownloadingDigitalCertificate(true);
    setCertificateError("");
    setCertificateMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-certificate/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.hrName || "HR",
          email: profile.officialEmail || hrId,
          company: profile.organizationName || "Regnify",
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error || `Certificate download failed (${response.status})`);
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Received empty certificate file from server.");
      }

      const contentDisposition = response.headers.get("content-disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
      const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1].replace(/\"/g, "")) : "certificate.p12";

      const fileUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = fileUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(fileUrl);

      setCertificateFileName(fileName);
      setCertificateMessage("Digital certificate downloaded successfully.");
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : "Unable to download digital certificate.");
    } finally {
      setIsDownloadingDigitalCertificate(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const profilePhotoBase64 = profilePhotoFile ? await readAsDataUrl(profilePhotoFile) : null;
      const organizationLogoBase64 = organizationLogoFile ? await readAsDataUrl(organizationLogoFile) : null;

      const response = await fetch(`${API_BASE_URL}/api/hr-data/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hr_id: hrId,
          hr_name: profile.hrName,
          designation: profile.designation,
          department: profile.department,
          official_email: profile.officialEmail,
          contact_number: profile.contactNumber,
          employee_id: profile.employeeId,
          timezone: profile.timezone,
          organization_name: profile.organizationName,
          role: "HR Admin",
          two_factor_enabled: twoFactorEnabled,
          generate_offer_letters_enabled: profile.generateOfferLetters,
          site_head_approval_required: profile.siteHeadApprovalRequired,
          workflow_update_channel: profile.workflowUpdateChannel,
          profile_photo_name: profilePhotoFile?.name || profilePhotoFileName || null,
          profile_photo_mime: profilePhotoFile?.type || null,
          profile_photo_base64: profilePhotoBase64,
          organization_logo_name: organizationLogoFile?.name || organizationLogoFileName || null,
          organization_logo_mime: organizationLogoFile?.type || null,
          organization_logo_base64: organizationLogoBase64,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to save profile (${response.status})`);
      }

      if (profilePhotoFile?.name) {
        setProfilePhotoFileName(profilePhotoFile.name);
      }
      if (organizationLogoFile?.name) {
        setOrganizationLogoFileName(organizationLogoFile.name);
      }

      setProfilePhotoFile(null);
      setOrganizationLogoFile(null);
      setProfileMessage("Profile saved successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setIsSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      if (!passwordSettings.newPassword) {
        throw new Error("New password is required.");
      }

      if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      const response = await fetch(`${API_BASE_URL}/api/hr-data/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hr_id: hrId,
          new_password: passwordSettings.newPassword,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to update password (${response.status})`);
      }

      setPasswordSettings({ newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRevokeSignature = async () => {
    if (!signature) {
      return;
    }

    setIsRevokingSignature(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/signatures/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hr_id: hrId }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Signature revoke failed (${response.status})`);
      }

      setSignature(payload.signature ?? null);
      setStatusMessage("Signature revoked successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to revoke signature.");
    } finally {
      setIsRevokingSignature(false);
    }
  };

  const formattedUploadedAt = signature?.uploaded_at
    ? new Date(signature.uploaded_at).toLocaleString()
    : "Not available";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Settings</h1>
        <p className="text-sm text-muted-foreground">Compliance-first configuration for identity, signatures, security, and workflow controls.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Profile & Identity</h2>
          <Button size="sm" onClick={handleSaveProfile} disabled={isSavingProfile}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="hrName">HR Name</Label>
            <Input id="hrName" className="mt-1" value={profile.hrName} onChange={(event) => setProfile((prev) => ({ ...prev, hrName: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" className="mt-1" value={profile.designation} onChange={(event) => setProfile((prev) => ({ ...prev, designation: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input id="department" className="mt-1" value={profile.department} onChange={(event) => setProfile((prev) => ({ ...prev, department: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="officialEmail">Official Email</Label>
            <Input id="officialEmail" type="email" className="mt-1" value={profile.officialEmail} onChange={(event) => setProfile((prev) => ({ ...prev, officialEmail: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" className="mt-1" value={profile.contactNumber} onChange={(event) => setProfile((prev) => ({ ...prev, contactNumber: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" className="mt-1" value={profile.employeeId} onChange={(event) => setProfile((prev) => ({ ...prev, employeeId: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" className="mt-1" value={profile.timezone} onChange={(event) => setProfile((prev) => ({ ...prev, timezone: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="organizationName">Organization Name</Label>
            <Input id="organizationName" className="mt-1" value={profile.organizationName} onChange={(event) => setProfile((prev) => ({ ...prev, organizationName: event.target.value }))} />
          </div>
          <div>
            <Label htmlFor="profilePhoto">Profile Photo</Label>
            <Input
              id="profilePhoto"
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setProfilePhotoFile(selectedFile);
                if (selectedFile) {
                  setProfilePhotoFileName(selectedFile.name);
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">{profilePhotoFileName || "No file chosen"}</p>
          </div>
          <div>
            <Label htmlFor="organizationLogo">Organization Logo</Label>
            <Input
              id="organizationLogo"
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setOrganizationLogoFile(selectedFile);
                if (selectedFile) {
                  setOrganizationLogoFileName(selectedFile.name);
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">{organizationLogoFileName || "No file chosen"}</p>
          </div>
        </div>
        {profileMessage ? <p className="mt-3 text-sm text-success">{profileMessage}</p> : null}
        {profileError ? <p className="mt-3 text-sm text-destructive">{profileError}</p> : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Signature & Authorization</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchSignature} disabled={isLoadingSignature}>
              <RefreshCw className="mr-2 h-4 w-4" />Refresh
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRevokeSignature} disabled={!signature || isRevokingSignature}>
              <ShieldX className="mr-2 h-4 w-4" />Revoke Signature
            </Button>
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">Signature data is loaded on demand. Click Refresh to check existing signature status.</p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="signatureFile">Upload Signature (PNG/JPG/JPEG)</Label>
              <Input id="signatureFile" type="file" accept="image/png,image/jpeg,.jpg,.jpeg" className="mt-1" onChange={handleSignatureUpload} disabled={isUploadingSignature} />
              <p className="mt-1 text-xs text-muted-foreground">Transparent PNG preferred. Re-uploading replaces active signature.</p>
            </div>

            <div>
              <Label htmlFor="certificateFile">Upload Digital Certificate (.p12)</Label>
              <Input
                id="certificateFile"
                type="file"
                accept=".p12"
                className="mt-1"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setCertificateFile(selectedFile);
                  if (selectedFile) {
                    setCertificateFileName(selectedFile.name);
                  }
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">Optional for certificate-based signing workflows.</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handleGenerateDigitalCertificate} disabled={isGeneratingDigitalCertificate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {isGeneratingDigitalCertificate ? "Generating..." : "Generate Digital Certificate"}
              </Button>
              <Button size="sm" onClick={handleSaveDigitalCertificate} disabled={isSavingDigitalCertificate}>
                <Save className="mr-2 h-4 w-4" />
                {isSavingDigitalCertificate ? "Saving..." : "Save Digital Certificate"}
              </Button>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={handleDownloadDigitalCertificate} disabled={isDownloadingDigitalCertificate}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloadingDigitalCertificate ? "Downloading..." : "Download Certificate"}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium text-foreground">Signature Preview</p>
            <div className="mt-3 flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
              {signaturePreview ? (
                <img src={signaturePreview} alt="Signature preview" className="max-h-20 object-contain" />
              ) : (
                <p className="text-xs text-muted-foreground">No signature available</p>
              )}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Signature Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${signature?.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                  {signature?.status === "active" ? <ShieldCheck className="h-3 w-3" /> : <ShieldX className="h-3 w-3" />}
                  {(signature?.status || "revoked").toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Signature Created At</span>
                <span className="text-foreground">{formattedUploadedAt}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Signature Hash (read-only)</span>
                <p className="mt-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs break-all">{signature?.file_hash || "Not available"}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Certificate File</span>
                <span className="text-foreground">{certificateFileName || "Not uploaded"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Signed by:</span>
          <span className="font-medium text-foreground">{hrId}</span>
        </div>

        {statusMessage ? <p className="mt-2 text-sm text-success">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-2 text-sm text-destructive">{errorMessage}</p> : null}
        {certificateMessage ? <p className="mt-2 text-sm text-success">{certificateMessage}</p> : null}
        {certificateError ? <p className="mt-2 text-sm text-destructive">{certificateError}</p> : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
          <Button size="sm" onClick={handleSavePassword} disabled={isSavingPassword}>
            <KeyRound className="mr-2 h-4 w-4" />
            {isSavingPassword ? "Saving..." : "Save Password"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">2FA</p>
              <p className="text-xs text-muted-foreground">Enable or disable multi-factor authentication.</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>

          <div className="rounded-md border border-border p-3">
            <Label className="text-sm">Role Management</Label>
            <Input className="mt-2" value="HR Admin" readOnly />
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              className="mt-1"
              value={passwordSettings.newPassword}
              onChange={(event) => setPasswordSettings((prev) => ({ ...prev, newPassword: event.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="mt-1"
              value={passwordSettings.confirmPassword}
              onChange={(event) => setPasswordSettings((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            />
          </div>
        </div>
        {passwordMessage ? <p className="mt-3 text-sm text-success">{passwordMessage}</p> : null}
        {passwordError ? <p className="mt-3 text-sm text-destructive">{passwordError}</p> : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Workflow Settings</h2>
          <Button size="sm" onClick={() => void saveWorkflowSettings(undefined, true)} disabled={isSavingWorkflowSettings}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingWorkflowSettings ? "Saving..." : "Save Workflow Settings"}
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto Generate Offer Letters</p>
              <p className="text-xs text-muted-foreground">Generate offer letters automatically through workflow execution. Saved with Profile settings.</p>
            </div>
            <Switch
              checked={profile.generateOfferLetters}
              onCheckedChange={(checked) => handleWorkflowToggleChange("generateOfferLetters", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Site Head Approval Required</p>
              <p className="text-xs text-muted-foreground">Require Site Head approval before finalizing offer letters.</p>
            </div>
            <Switch
              checked={profile.siteHeadApprovalRequired}
              onCheckedChange={(checked) => handleWorkflowToggleChange("siteHeadApprovalRequired", checked)}
            />
          </div>

          {profile.siteHeadApprovalRequired ? (
            <div className="rounded-md border border-border p-3">
              <Label>Workflow Update Channel</Label>
              <Select
                value={profile.workflowUpdateChannel}
                onValueChange={(value: "whatsapp" | "gmail") => handleWorkflowChannelChange(value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">Workflow notifications will be sent using the selected channel.</p>
            </div>
          ) : null}

          {!profile.generateOfferLetters ? (
            <div className="rounded-md border border-border p-3">
              <Label htmlFor="workflowManualOfferLetter">Manual Offer Letter Upload (PDF)</Label>
              <Input
                id="workflowManualOfferLetter"
                type="file"
                accept="application/pdf"
                className="mt-2"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setWorkflowManualOfferLetterFile(selectedFile);
                  if (selectedFile) {
                    setWorkflowManualOfferLetterFileName(selectedFile.name);
                  }
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">{workflowManualOfferLetterFileName || "No file selected"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Click Save Workflow Settings to store this PDF in document_audit.</p>
            </div>
          ) : null}
        </div>
        {workflowMessage ? <p className="mt-3 text-sm text-success">{workflowMessage}</p> : null}
        {workflowError ? <p className="mt-3 text-sm text-destructive">{workflowError}</p> : null}
      </div>
    </div>
  );
};

export default HrSettings;
