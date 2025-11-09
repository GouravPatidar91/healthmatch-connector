import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bike, Phone, Star } from 'lucide-react';
import { orderManagementService, DeliveryPartner } from '@/services/orderManagementService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeliveryPartnerSelectorProps {
  orderId: string;
  orderStatus: string;
  vendorLocation?: { latitude: number; longitude: number };
  onPartnerAssigned: () => void;
}

export const DeliveryPartnerSelector: React.FC<DeliveryPartnerSelectorProps> = ({
  orderId,
  orderStatus,
  vendorLocation,
  onPartnerAssigned
}) => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveryPartners();
  }, [vendorLocation]);

  const loadDeliveryPartners = async () => {
    try {
      setLoading(true);
      const data = await orderManagementService.getAvailableDeliveryPartners(vendorLocation);
      setPartners(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load delivery partners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPartner = async (partnerId: string) => {
    setAssigning(partnerId);
    try {
      const result = await orderManagementService.assignDeliveryPartner(orderId, partnerId);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Delivery partner assigned successfully',
        });
        onPartnerAssigned();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to assign delivery partner',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign delivery partner',
        variant: 'destructive',
      });
    } finally {
      setAssigning(null);
    }
  };

  const canAssignPartner = orderStatus === 'ready_for_pickup';

  if (!canAssignPartner) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bike className="h-5 w-5" />
          Assign Delivery Partner
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : partners.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No delivery partners available at the moment
          </p>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="p-4 border rounded-lg space-y-2 hover:border-primary transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{partner.name}</p>
                      {partner.rating > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {partner.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {partner.phone}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {partner.vehicle_type} - {partner.vehicle_number}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAssignPartner(partner.id)}
                    disabled={assigning !== null}
                    size="sm"
                  >
                    {assigning === partner.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Assigning...
                      </>
                    ) : (
                      'Assign'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
