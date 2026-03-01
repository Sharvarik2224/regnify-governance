import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { hrUpdates } from "@/data/employeeMockData";
import { Sparkles, Calendar, Bell } from "lucide-react";

const HRUpdates = () => {
  const [tab, setTab] = useState("All Updates");

  const filtered = tab === "All Updates" ? hrUpdates : hrUpdates.filter(u => {
    if (tab === "Announcements") return u.category === "Announcement";
    if (tab === "Personal") return u.category === "Personal" || u.category === "Benefits";
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Updates</h1>
        <p className="text-muted-foreground text-sm">Stay up to date with the latest policy changes and personalized career notifications.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="All Updates">All Updates</TabsTrigger>
          <TabsTrigger value="Announcements">Announcements</TabsTrigger>
          <TabsTrigger value="Personal">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6 space-y-4">
          {filtered.map((update, i) => (
            <Card key={update.id} className={i === 0 && update.important ? "overflow-hidden" : ""}>
              {i === 0 && update.important && update.image && (
                <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground gap-1"><Sparkles className="h-3 w-3" /> PRIORITY DECISION</Badge>
                  </div>
                  <div className="text-6xl opacity-20">🎉</div>
                </div>
              )}
              <CardContent className={`${i === 0 && update.important && update.image ? "pt-4" : "pt-6"} pb-6`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {update.important && <Badge className="bg-destructive/10 text-destructive border-0 text-[10px]">IMPORTANT</Badge>}
                      <Badge variant="outline" className="text-[10px]">{update.category.toUpperCase()}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{update.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{update.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{update.date}</span>
                </div>
                {update.action && (
                  <div className="flex items-center justify-between mt-4">
                    {update.important && (
                      <Badge className="bg-primary/10 text-primary border-0 gap-1"><Sparkles className="h-3 w-3" /> ACTION REQUIRED</Badge>
                    )}
                    <Button variant={update.important ? "default" : "outline"} size="sm" className="ml-auto">{update.action.label}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRUpdates;
