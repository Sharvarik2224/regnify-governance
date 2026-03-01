import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Upload, RefreshCw, ShieldCheck, ShieldX, KeyRound } from "lucide-react";
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
};

type DocumentSettings = {
  watermark: boolean;
  autoEmail: boolean;
  digitalStampPosition: "left" | "center" | "right";
};

type PasswordSettings = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  });

  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>({
    watermark: true,
    autoEmail: true,
    digitalStampPosition: "left",
  });

  const [signature, setSignature] = useState<SignatureRecord | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [certificateFileName, setCertificateFileName] = useState<string>("");
  const [offerLetterTemplateFileName, setOfferLetterTemplateFileName] = useState<string>("");
  const [offerLetterTemplateFile, setOfferLetterTemplateFile] = useState<File | null>(null);
  const [profilePhotoFileName, setProfilePhotoFileName] = useState<string>("");
  const [organizationLogoFileName, setOrganizationLogoFileName] = useState<string>("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [organizationLogoFile, setOrganizationLogoFile] = useState<File | null>(null);
  const [digitalSigningEnabled, setDigitalSigningEnabled] = useState(false);
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [isRevokingSignature, setIsRevokingSignature] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingDocumentSettings, setIsSavingDocumentSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [profileMessage, setProfileMessage] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [passwordMessage, setPasswordMessage] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [documentMessage, setDocumentMessage] = useState<string>("");
  const [documentError, setDocumentError] = useState<string>("");
  const [passwordSettings, setPasswordSettings] = useState<PasswordSettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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
      }));

      setTwoFactorEnabled(Boolean(hrData.two_factor_enabled));
      setProfilePhotoFileName(hrData.profile_photo_name || "");
      setOrganizationLogoFileName(hrData.organization_logo_name || "");
    } catch {
      // no-op for initial load
    }
  }, [hrId]);

  const fetchDocumentSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hr-data/document-settings/${encodeURIComponent(hrId)}`);
      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => null);
      const settings = payload?.documentSettings;
      if (!settings) {
        return;
      }

      setDocumentSettings((previous) => ({
        ...previous,
        watermark: typeof settings.watermark === "boolean" ? settings.watermark : previous.watermark,
        autoEmail: typeof settings.auto_email === "boolean" ? settings.auto_email : previous.autoEmail,
        digitalStampPosition: settings.digital_stamp_position || previous.digitalStampPosition,
      }));

      if (settings.template_name) {
        setOfferLetterTemplateFileName(settings.template_name);
      }
    } catch {
      // no-op for initial load
    }
  }, [hrId]);

  useEffect(() => {
    fetchHrData();
    fetchDocumentSettings();
  }, [fetchDocumentSettings, fetchHrData]);

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
          current_password: passwordSettings.currentPassword,
          new_password: passwordSettings.newPassword,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to update password (${response.status})`);
      }

      setPasswordSettings({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveDocumentSettings = async () => {
    setIsSavingDocumentSettings(true);
    setDocumentError("");
    setDocumentMessage("");

    try {
      if (offerLetterTemplateFile && offerLetterTemplateFile.type !== "application/pdf") {
        throw new Error("Only PDF templates are allowed.");
      }

      const templateBase64 = offerLetterTemplateFile ? await readAsDataUrl(offerLetterTemplateFile) : null;

      const response = await fetch(`${API_BASE_URL}/api/hr-data/document-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hr_id: hrId,
          watermark: documentSettings.watermark,
          auto_email: documentSettings.autoEmail,
          digital_stamp_position: documentSettings.digitalStampPosition,
          template_name: offerLetterTemplateFile?.name || offerLetterTemplateFileName || null,
          template_mime: offerLetterTemplateFile?.type || null,
          template_base64: templateBase64,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to save document settings (${response.status})`);
      }

      if (offerLetterTemplateFile?.name) {
        setOfferLetterTemplateFileName(offerLetterTemplateFile.name);
      }

      setOfferLetterTemplateFile(null);
      setDocumentMessage("Document settings saved successfully.");
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to save document settings.");
    } finally {
      setIsSavingDocumentSettings(false);
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
        <p className="text-sm text-muted-foreground">Compliance-first configuration for identity, signatures, security, documents, and workflow controls.</p>
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
                onChange={(event) => setCertificateFileName(event.target.files?.[0]?.name || "")}
              />
              <p className="mt-1 text-xs text-muted-foreground">Optional for certificate-based signing workflows.</p>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Enable Digital Signing</p>
                <p className="text-xs text-muted-foreground">Use certificate workflow for signed documents.</p>
              </div>
              <Switch checked={digitalSigningEnabled} onCheckedChange={setDigitalSigningEnabled} />
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
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              className="mt-1"
              value={passwordSettings.currentPassword}
              onChange={(event) => setPasswordSettings((prev) => ({ ...prev, currentPassword: event.target.value }))}
            />
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
          <h2 className="text-lg font-semibold text-foreground">Document Settings</h2>
          <Button size="sm" onClick={handleSaveDocumentSettings} disabled={isSavingDocumentSettings}>
            <Save className="mr-2 h-4 w-4" />
            {isSavingDocumentSettings ? "Saving..." : "Save Document Settings"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="offerLetterTemplate">Offer Letter Template (PDF)</Label>
            <Input
              id="offerLetterTemplate"
              type="file"
              accept="application/pdf"
              className="mt-1"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;
                setOfferLetterTemplateFile(selectedFile);
                if (selectedFile) {
                  setOfferLetterTemplateFileName(selectedFile.name);
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">{offerLetterTemplateFileName || "No template selected"}</p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Watermark Option</p>
              <p className="text-xs text-muted-foreground">Embed watermark on generated PDFs.</p>
            </div>
            <Switch
              checked={documentSettings.watermark}
              onCheckedChange={(checked) => setDocumentSettings((prev) => ({ ...prev, watermark: checked }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Email Toggle</p>
              <p className="text-xs text-muted-foreground">Send document emails automatically after generation.</p>
            </div>
            <Switch
              checked={documentSettings.autoEmail}
              onCheckedChange={(checked) => setDocumentSettings((prev) => ({ ...prev, autoEmail: checked }))}
            />
          </div>

          <div>
            <Label>Digital Stamp Position</Label>
            <Select
              value={documentSettings.digitalStampPosition}
              onValueChange={(value: "left" | "center" | "right") => setDocumentSettings((prev) => ({ ...prev, digitalStampPosition: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {documentMessage ? <p className="mt-3 text-sm text-success">{documentMessage}</p> : null}
        {documentError ? <p className="mt-3 text-sm text-destructive">{documentError}</p> : null}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Workflow Settings</h2>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Auto Generate Offer Letters</p>
              <p className="text-xs text-muted-foreground">Generate offer letters automatically through workflow execution. Saved with Profile settings.</p>
            </div>
            <Switch
              checked={profile.generateOfferLetters}
              onCheckedChange={(checked) => setProfile((prev) => ({ ...prev, generateOfferLetters: checked }))}
            />
        </div>
      </div>
    </div>
  );
};

export default HrSettings;
