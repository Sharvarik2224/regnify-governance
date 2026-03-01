import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, Video, Phone, Info, Plus, Smile, FileText, Download } from "lucide-react";
import { conversations, chatMessages } from "@/data/employeeMockData";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Communication = () => {
  const [activeConvo, setActiveConvo] = useState(conversations[0]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("All");

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-lg border overflow-hidden">
      {/* Left Panel */}
      <div className="w-72 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Messages</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button>
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="All" className="flex-1 text-xs">All</TabsTrigger>
              <TabsTrigger value="Unread" className="flex-1 text-xs">Unread</TabsTrigger>
              <TabsTrigger value="Direct" className="flex-1 text-xs">Direct</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors ${activeConvo.id === c.id ? "bg-accent" : ""}`}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                {c.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
              </div>
              {c.unread && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b px-6 py-3 bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
              {activeConvo.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{activeConvo.name}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                {activeConvo.online && "● ACTIVE NOW · "}{activeConvo.role.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">TODAY</span>
          </div>
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"} gap-2`}>
              {!msg.isMine && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-auto">
                  {msg.sender.split(" ").map(n => n[0]).join("")}
                </div>
              )}
              <div className="max-w-md">
                <div className={`rounded-xl px-4 py-2.5 ${msg.isMine ? "bg-primary text-primary-foreground" : "bg-card border"}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.attachment && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border bg-card p-3">
                    <div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center"><FileText className="h-4 w-4 text-destructive" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{msg.attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{msg.attachment.size}</p>
                    </div>
                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${msg.isMine ? "text-right" : ""} text-muted-foreground`}>
                  {msg.time} {msg.isMine && "✓✓"}
                </p>
              </div>
              {msg.isMine && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 mt-auto">ME</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t bg-card p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Smile className="h-4 w-4" /></Button>
            <Input
              placeholder="Write a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && setMessage("")}
            />
            <Button size="icon" className="rounded-full"><Send className="h-4 w-4" /></Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 px-2"><span className="text-primary">Enter</span> to send · <span className="text-primary">Shift + Enter</span> for new line</p>
        </div>
      </div>
    </div>
  );
};

export default Communication;
