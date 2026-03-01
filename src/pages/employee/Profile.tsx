import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Shield, Building, Wifi, Camera, Mail, Phone, MapPin, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("Profile Overview");
  const [phone, setPhone] = useState("+1 (555) 902-4822");
  const [address, setAddress] = useState("742 Evergreen Terrace,\nSpringfield, OR 97403,\nUnited States");
  const [emergencyName, setEmergencyName] = useState("Elena Rivera");
  const [emergencyPhone, setEmergencyPhone] = useState("+1 (555) 902-4823");
  const [emergencyRel, setEmergencyRel] = useState("Spouse");

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="relative">
            <div className="h-28 w-28 rounded-xl bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <button className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{user?.name || "Alex Rivera"}</h1>
            <p className="text-primary font-medium">Senior Product Designer</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> Product Design Department</span>
              <span className="flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> Reports to Sarah Chen (Design Director)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Download Resume</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Request Time Off</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Profile Overview">Profile Overview</TabsTrigger>
          <TabsTrigger value="Documents">Documents</TabsTrigger>
          <TabsTrigger value="Payroll & Benefits">Payroll & Benefits</TabsTrigger>
          <TabsTrigger value="Performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="Profile Overview" className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Employment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Employment Details</CardTitle>
                <p className="text-xs text-muted-foreground uppercase font-semibold">READ ONLY</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "CONTRACT TYPE", value: "Full-time Permanent" },
                  { label: "START DATE", value: "January 15, 2022" },
                  { label: "END DATE", value: "Indefinite" },
                  { label: "EMPLOYEE ID", value: "REG-99420-ALX" },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-[10px] uppercase font-semibold text-primary tracking-wider">{field.label}</p>
                    <p className={`text-sm mt-1 ${field.value === "Indefinite" ? "italic text-muted-foreground" : "text-foreground"}`}>{field.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Contact Information</CardTitle>
                <Button variant="link" className="text-primary text-sm">✏️ Edit Details</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Personal Phone</label>
                    <div className="flex items-center gap-2 mt-1 border rounded-md px-3 py-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input className="border-0 p-0 h-auto" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Work Email</label>
                    <div className="flex items-center gap-2 mt-1 border rounded-md px-3 py-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{user?.email || "alex.rivera@regnify.io"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Residential Address</label>
                  <div className="flex items-start gap-2 mt-1 border rounded-md px-3 py-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <Textarea className="border-0 p-0 min-h-0 resize-none" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">❋ Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Name</label>
                      <Input className="mt-1" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Relationship</label>
                      <Select value={emergencyRel} onValueChange={setEmergencyRel}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spouse">Spouse</SelectItem>
                          <SelectItem value="Parent">Parent</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground font-medium">Phone Number</label>
                      <Input className="mt-1" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Completion */}
          <Card className="mt-6">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Info className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Profile Completion</p>
                <p className="text-xs text-muted-foreground">Your profile is 85% complete. Adding your professional certifications will help the team identify growth opportunities.</p>
              </div>
              <Button variant="outline" size="sm">Update Now</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Documents"><p className="text-muted-foreground p-8 text-center">Documents section coming soon.</p></TabsContent>
        <TabsContent value="Payroll & Benefits"><p className="text-muted-foreground p-8 text-center">Payroll & Benefits section coming soon.</p></TabsContent>
        <TabsContent value="Performance"><p className="text-muted-foreground p-8 text-center">Performance section coming soon.</p></TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
