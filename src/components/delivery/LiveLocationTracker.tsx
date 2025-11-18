import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, Clock } from 'lucide-react';
import { deliveryPartnerLocationService } from '@/services/deliveryPartnerLocationService';
import { useToast } from '@/hooks/use-toast';

interface LiveLocationTrackerProps {
  partnerId: string;
  orderId: string;
  isActive: boolean;
}

export function LiveLocationTracker({ partnerId, orderId, isActive }: LiveLocationTrackerProps) {
  const [tracking, setTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isActive && !tracking) {
      startTracking();
    }
    return () => {
      if (tracking) {
        stopTracking();
      }
    };
  }, [isActive]);

  const startTracking = async () => {
    setError('');
    const result = await deliveryPartnerLocationService.startLocationTracking(partnerId);
    
    if (result.success) {
      setTracking(true);
      setLastUpdate(new Date().toLocaleTimeString());
      toast({
        title: "Location Tracking Started",
        description: "Your location is now being shared with the customer",
      });
    } else {
      setError(result.error || 'Failed to start tracking');
      toast({
        title: "Tracking Error",
        description: result.error || 'Failed to start tracking',
        variant: "destructive",
      });
    }
  };

  const stopTracking = () => {
    deliveryPartnerLocationService.stopLocationTracking();
    setTracking(false);
    toast({
      title: "Location Tracking Stopped",
      description: "Your location is no longer being shared",
    });
  };

  const handleToggleTracking = async () => {
    if (tracking) {
      stopTracking();
    } else {
      await startTracking();
    }
  };

  // Update last update time periodically
  useEffect(() => {
    if (tracking) {
      const interval = setInterval(() => {
        setLastUpdate(new Date().toLocaleTimeString());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tracking]);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${tracking ? 'bg-primary/20' : 'bg-muted'}`}>
              <Navigation className={`h-5 w-5 ${tracking ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold">Live Location</h3>
              <p className="text-sm text-muted-foreground">Track your delivery route</p>
            </div>
          </div>
          <Badge variant={tracking ? "default" : "secondary"}>
            {tracking ? "Active" : "Inactive"}
          </Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {tracking && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last update: {lastUpdate}</span>
            </div>
            {accuracy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Accuracy: ±{accuracy.toFixed(0)}m</span>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleToggleTracking}
          variant={tracking ? "destructive" : "default"}
          className="w-full"
          disabled={!isActive}
        >
          {tracking ? (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Stop Tracking
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" />
              Start Tracking
            </>
          )}
        </Button>

        {!isActive && (
          <p className="text-xs text-center text-muted-foreground">
            Location tracking is only available during active deliveries
          </p>
        )}

        <div className="p-3 bg-background/50 rounded-lg space-y-1">
          <p className="text-xs font-medium">How it works:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Your location updates every 10 seconds</li>
            <li>• Customers see your real-time position</li>
            <li>• Tracking stops automatically when delivered</li>
            <li>• Location data is only shared during delivery</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
