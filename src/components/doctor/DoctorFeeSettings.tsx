import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doctorWalletService } from '@/services/doctorWalletService';
import { IndianRupee, Save, Loader2 } from 'lucide-react';

const DoctorFeeSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fee, setFee] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadFee = async () => {
      const currentFee = await doctorWalletService.getConsultationFee(user.id);
      setFee(currentFee.toString());
      setLoading(false);
    };
    loadFee();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const feeValue = parseFloat(fee);
    if (isNaN(feeValue) || feeValue < 0) {
      toast({ title: 'Invalid fee', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const success = await doctorWalletService.updateConsultationFee(user.id, feeValue);
    setSaving(false);

    if (success) {
      toast({ title: 'Fee Updated', description: `Consultation fee set to ₹${feeValue}` });
    } else {
      toast({ title: 'Error', description: 'Failed to update consultation fee', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            Consultation Fee
          </CardTitle>
          <CardDescription>
            Set your consultation fee. This will be shown to patients when they book appointments with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fee">Fee Amount (₹)</Label>
            <div className="flex gap-3 items-center max-w-sm">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  step="50"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="pl-9"
                  placeholder="500"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Patients will see this fee when booking appointments</li>
              <li>• They can pay online during booking or at your clinic</li>
              <li>• Online payments are credited to your wallet instantly</li>
              <li>• For clinic payments, you can collect cash or generate a QR code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorFeeSettings;
