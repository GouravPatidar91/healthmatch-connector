import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "@/services/notificationService";
import { Megaphone, Send, Sparkles, Users, Search, Loader2 } from "lucide-react";

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

const personalize = (text: string, p: ProfileRow) =>
  text
    .split("{first_name}").join(p.first_name?.trim() || "there")
    .split("{last_name}").join(p.last_name?.trim() || "");

export const MarketingCampaigns = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [search, setSearch] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) {
        toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
      } else {
        setProfiles((data || []) as ProfileRow[]);
      }
      setLoadingProfiles(false);
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      `${p.first_name ?? ""} ${p.last_name ?? ""} ${p.phone ?? ""}`.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const recipients = sendToAll ? profiles : profiles.filter((p) => selected.has(p.id));

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (recipients.length === 0) {
      toast({ title: "No recipients", description: "Select at least one user.", variant: "destructive" });
      return;
    }

    setSending(true);
    setProgress({ done: 0, total: recipients.length });
    let success = 0;
    let failed = 0;

    for (const p of recipients) {
      try {
        await notificationService.createNotification({
          user_id: p.id,
          type: "marketing",
          title: personalize(title, p),
          message: personalize(message, p),
          notification_category: "marketing",
          priority: "normal",
          metadata: { campaign: true, sent_at: new Date().toISOString() },
        });
        success++;
      } catch {
        failed++;
      }
      setProgress((s) => ({ ...s, done: s.done + 1 }));
    }

    setSending(false);
    toast({
      title: "Campaign sent",
      description: `Delivered to ${success} user${success !== 1 ? "s" : ""}${failed ? `, ${failed} failed` : ""}.`,
    });
    setTitle("");
    setMessage("");
    setSelected(new Set());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Composer */}
      <Card className="lg:col-span-3 border-primary/10 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Push Notification Campaign</CardTitle>
              <CardDescription>
                Compose and broadcast a personalized push notification.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm flex gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Use <code className="px-1 py-0.5 rounded bg-background text-foreground">{"{first_name}"}</code> or{" "}
              <code className="px-1 py-0.5 rounded bg-background text-foreground">{"{last_name}"}</code> in your
              title or message — each notification is personalized per user automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-title">Title</Label>
            <Input
              id="campaign-title"
              placeholder="Hey {first_name}, we have something for you 💊"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <div className="text-xs text-muted-foreground text-right">{title.length}/100</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-message">Message</Label>
            <Textarea
              id="campaign-message"
              placeholder="Order medicines today and get free delivery, {first_name}!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">{message.length}/500</div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Live Preview</div>
            <div className="rounded-lg bg-background border p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {personalize(title || "Your title goes here", profiles[0] ?? { id: "", first_name: "Alex", last_name: "Doe", phone: null })}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {personalize(message || "Your message goes here…", profiles[0] ?? { id: "", first_name: "Alex", last_name: "Doe", phone: null })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim() || recipients.length === 0}
            size="lg"
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending {progress.done}/{progress.total}…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {recipients.length} user{recipients.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card className="lg:col-span-2 border-primary/10 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Audience</CardTitle>
              <CardDescription>{profiles.length} total users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <div className="font-medium text-sm">Send to all users</div>
              <div className="text-xs text-muted-foreground">Broadcast to every registered user</div>
            </div>
            <Switch checked={sendToAll} onCheckedChange={setSendToAll} />
          </div>

          {!sendToAll && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="secondary">{selected.size} selected</Badge>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
                  >
                    Select all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Clear
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[360px] rounded-md border">
                {loadingProfiles ? (
                  <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No users found</div>
                ) : (
                  <div className="divide-y">
                    {filtered.map((p) => {
                      const checked = selected.has(p.id);
                      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed user";
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{name}</div>
                            {p.phone && (
                              <div className="text-xs text-muted-foreground truncate">{p.phone}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCampaigns;
