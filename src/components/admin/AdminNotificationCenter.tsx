import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Sparkles, RefreshCw, History, Users, Megaphone, Loader2, Clock, Sun, Coffee, Play } from 'lucide-react';
import { format } from 'date-fns';

interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_ai_generated: boolean;
  status: string;
  recipients_count: number;
  sent_at: string | null;
  created_at: string;
}

const NOTIFICATION_TYPES = [
  { value: 'marketing', label: 'Marketing', emoji: '✨' },
  { value: 'health_tip', label: 'Health Tip', emoji: '💊' },
  { value: 'announcement', label: 'Announcement', emoji: '📢' },
  { value: 'seasonal', label: 'Seasonal Alert', emoji: '🌡️' },
];

const AI_TONES = [
  { value: 'friendly', label: 'Friendly & Engaging' },
  { value: 'professional', label: 'Professional' },
  { value: 'urgent', label: 'Urgent & Important' },
  { value: 'casual', label: 'Casual & Fun' },
];

// Morning health topics - rotate by day of week
const MORNING_TOPICS = [
  "starting the week with positive health mindset",
  "monday morning hydration tips",
  "healthy breakfast ideas",
  "midweek stress relief tips",
  "morning stretching routine",
  "weekend health planning",
  "saturday morning wellness rituals",
];

// Noon marketing topics with varying tones
const NOON_MARKETING = [
  { topic: "AI health check feature", tone: "casual" },
  { topic: "booking doctor appointments", tone: "friendly" },
  { topic: "fast medicine delivery", tone: "urgent" },
  { topic: "digital health records", tone: "professional" },
  { topic: "medicine discounts", tone: "casual" },
  { topic: "emergency SOS features", tone: "urgent" },
  { topic: "specialist doctors", tone: "friendly" },
];

export const AdminNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Manual notification state
  const [manualTitle, setManualTitle] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [notificationType, setNotificationType] = useState('marketing');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);
  
  // AI notification state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('friendly');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  
  // History state
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastNotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // Scheduled notifications state
  const [triggeringMorning, setTriggeringMorning] = useState(false);
  const [triggeringNoon, setTriggeringNoon] = useState(false);
  // Fetch broadcast history
  useEffect(() => {
    fetchBroadcastHistory();
  }, []);

  const fetchBroadcastHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('admin_broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBroadcastHistory(data || []);
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendManualNotification = async () => {
    if (!manualTitle.trim() || !manualMessage.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both title and message.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Use edge function that has service role access to bypass RLS
      const response = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title: manualTitle,
          message: manualMessage,
          type: notificationType,
          targetAudience: targetAudience,
          isAiGenerated: false,
          createdBy: user?.id,
        },
      });

      if (response.error) throw response.error;

      const { recipientsCount } = response.data;

      toast({
        title: '🎉 Notification Sent!',
        description: `Successfully sent to ${recipientsCount} users.`,
      });

      // Reset form
      setManualTitle('');
      setManualMessage('');
      fetchBroadcastHistory();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleGenerateAINotification = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please enter a topic or prompt for the AI.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-marketing-notification', {
        body: {
          topic: aiPrompt,
          tone: aiTone,
          includeBranding: includeBranding,
        },
      });

      if (response.error) throw response.error;

      const { title, message } = response.data;
      setGeneratedTitle(title);
      setGeneratedMessage(message);

      toast({
        title: '✨ Generated!',
        description: 'AI has created your notification. Review and send!',
      });
    } catch (error) {
      console.error('Error generating notification:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendGeneratedNotification = async () => {
    if (!generatedTitle || !generatedMessage) return;

    setSending(true);
    try {
      // Use edge function that has service role access to bypass RLS
      const response = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title: generatedTitle,
          message: generatedMessage,
          type: 'marketing',
          targetAudience: 'all',
          isAiGenerated: true,
          aiPrompt: aiPrompt,
          createdBy: user?.id,
        },
      });

      if (response.error) throw response.error;

      const { recipientsCount } = response.data;

      toast({
        title: '🚀 Sent Successfully!',
        description: `AI notification sent to ${recipientsCount} users.`,
      });

      // Reset
      setAiPrompt('');
      setGeneratedTitle('');
      setGeneratedMessage('');
      fetchBroadcastHistory();
    } catch (error) {
      console.error('Error sending AI notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleTriggerScheduledBroadcast = async (scheduleType: 'morning_health' | 'noon_marketing') => {
    const isMorning = scheduleType === 'morning_health';
    if (isMorning) {
      setTriggeringMorning(true);
    } else {
      setTriggeringNoon(true);
    }

    try {
      const response = await supabase.functions.invoke('scheduled-broadcast', {
        body: { scheduleType },
      });

      if (response.error) throw response.error;

      const { recipientsCount, title } = response.data;

      toast({
        title: isMorning ? '🌅 Morning Notification Sent!' : '☀️ Noon Notification Sent!',
        description: `"${title}" sent to ${recipientsCount} users.`,
      });

      fetchBroadcastHistory();
    } catch (error) {
      console.error('Error triggering scheduled broadcast:', error);
      toast({
        title: 'Error',
        description: `Failed to trigger ${isMorning ? 'morning' : 'noon'} broadcast.`,
        variant: 'destructive',
      });
    } finally {
      if (isMorning) {
        setTriggeringMorning(false);
      } else {
        setTriggeringNoon(false);
      }
    }
  };

  const dayOfWeek = new Date().getDay();
  const todayMorningTopic = MORNING_TOPICS[dayOfWeek];
  const todayNoonConfig = NOON_MARKETING[dayOfWeek];

  return (
    <div className="space-y-6">
      {/* Scheduled Notifications Section */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Automated Daily Notifications
          </CardTitle>
          <CardDescription>
            AI-powered notifications sent automatically at 6 AM and 12 PM IST daily
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Morning Health Tip */}
            <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <Sun className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Morning Health Tips</h4>
                  <p className="text-xs text-gray-500">6:00 AM IST Daily</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Today's Topic:</p>
                <p className="text-sm text-gray-700">{todayMorningTopic}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Tone: Friendly
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-300 hover:bg-amber-100"
                onClick={() => handleTriggerScheduledBroadcast('morning_health')}
                disabled={triggeringMorning}
              >
                {triggeringMorning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test Send Now
              </Button>
            </div>

            {/* Noon Marketing */}
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <Coffee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Noon Marketing</h4>
                  <p className="text-xs text-gray-500">12:00 PM IST Daily</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Today's Topic:</p>
                <p className="text-sm text-gray-700">{todayNoonConfig.topic}</p>
                <Badge variant="outline" className="mt-2 text-xs capitalize">
                  Tone: {todayNoonConfig.tone}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-blue-300 hover:bg-blue-100"
                onClick={() => handleTriggerScheduledBroadcast('noon_marketing')}
                disabled={triggeringNoon}
              >
                {triggeringNoon ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Test Send Now
              </Button>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">
              ⏰ To enable automatic scheduling, set up pg_cron jobs in Supabase SQL Editor
            </p>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Manual Create
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generator
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Manual Notification Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-500" />
                Create Notification
              </CardTitle>
              <CardDescription>
                Craft and send a notification to your users manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active_users">Active Users (30 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title (max 50 characters)</Label>
                <Input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value.slice(0, 50))}
                  placeholder="🎉 Exciting Health Update!"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400">{manualTitle.length}/50</p>
              </div>

              <div className="space-y-2">
                <Label>Message (max 150 characters)</Label>
                <Textarea
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value.slice(0, 150))}
                  placeholder="Stay healthy with our latest tips and features..."
                  maxLength={150}
                  rows={3}
                />
                <p className="text-xs text-gray-400">{manualMessage.length}/150</p>
              </div>

              {/* Preview */}
              {(manualTitle || manualMessage) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-2">Preview:</p>
                  <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <p className="font-semibold text-gray-900">{manualTitle || 'Title...'}</p>
                    <p className="text-sm text-gray-600 mt-1">{manualMessage || 'Message...'}</p>
                    <p className="text-xs text-gray-400 mt-2">Your health partner, Curezy 💙</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendManualNotification}
                disabled={sending || !manualTitle || !manualMessage}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generator Tab */}
        <TabsContent value="ai">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Notification Generator
              </CardTitle>
              <CardDescription>
                Let AI create engaging, on-brand notifications for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Topic / Prompt</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Write about monsoon health tips, staying hydrated, or seasonal wellness..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_TONES.map((tone) => (
                        <SelectItem key={tone.value} value={tone.value}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Include Curezy Branding</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={includeBranding}
                      onChange={(e) => setIncludeBranding(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Yes, add Curezy touch</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateAINotification}
                disabled={generating || !aiPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>

              {/* Generated Preview */}
              {(generatedTitle || generatedMessage) && (
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-purple-600">✨ AI Generated</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateAINotification}
                      disabled={generating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{generatedTitle}</p>
                    <p className="text-sm text-gray-600 mt-2">{generatedMessage}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setManualTitle(generatedTitle);
                        setManualMessage(generatedMessage);
                      }}
                    >
                      ✏️ Edit First
                    </Button>
                    <Button
                      onClick={handleSendGeneratedNotification}
                      disabled={sending}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-500" />
                Broadcast History
              </CardTitle>
              <CardDescription>
                View all previously sent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                </div>
              ) : broadcastHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Megaphone className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications sent yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcastHistory.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {broadcast.is_ai_generated && (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                            <span className="font-medium">{broadcast.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {broadcast.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{broadcast.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {broadcast.recipients_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={broadcast.status === 'sent' ? 'default' : 'secondary'}
                            className={broadcast.status === 'sent' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {broadcast.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {broadcast.sent_at
                            ? format(new Date(broadcast.sent_at), 'MMM d, h:mm a')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationCenter;
