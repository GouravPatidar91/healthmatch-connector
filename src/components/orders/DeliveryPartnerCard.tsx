import { Phone, MessageCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating?: number;
}

interface DeliveryPartnerCardProps {
  partner: DeliveryPartner;
  orderId: string;
}

export function DeliveryPartnerCard({ partner }: DeliveryPartnerCardProps) {
  const handleCall = () => {
    window.location.href = `tel:${partner.phone}`;
  };

  const handleHelp = () => {
    // Open help/support
    window.location.href = `/help`;
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bike':
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'bicycle':
        return '🚲';
      default:
        return '🛵';
    }
  };

  return (
    <div className="fixed bottom-[calc(35vh+20px)] left-4 right-4 z-[500] animate-scale-in">
      <div className="bg-background/95 backdrop-blur-lg rounded-xl shadow-lg border border-border/50 p-4">
        <div className="flex items-center gap-4 mb-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {partner.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{partner.name}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {partner.rating && partner.rating > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="font-medium">{partner.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                </>
              )}
              <span>
                {getVehicleIcon(partner.vehicle_type)} {partner.vehicle_number}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCall}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            onClick={handleHelp}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}
