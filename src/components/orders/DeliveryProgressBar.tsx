import { Check, Package, CheckCircle, Truck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeliveryProgressBarProps {
  currentStatus: string;
  variant?: 'full' | 'mini';
}

const deliveryStages = [
  { key: 'placed', label: 'Placed', icon: Package, statuses: ['placed'] },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, statuses: ['confirmed', 'preparing'] },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, statuses: ['ready_for_pickup', 'out_for_delivery'] },
  { key: 'delivered', label: 'Delivered', icon: MapPin, statuses: ['delivered'] },
];

export function DeliveryProgressBar({ currentStatus, variant = 'full' }: DeliveryProgressBarProps) {
  const getCurrentStageIndex = () => {
    return deliveryStages.findIndex(stage => 
      stage.statuses.includes(currentStatus)
    );
  };

  const currentStageIndex = getCurrentStageIndex();
  const isCancelled = currentStatus === 'cancelled';

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-1 py-2">
        {deliveryStages.map((stage, index) => {
          const isCompleted = index < currentStageIndex || currentStatus === 'delivered';
          const isCurrent = index === currentStageIndex;
          
          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  isCompleted ? "bg-primary" : 
                  isCurrent ? "bg-primary/50" : 
                  "bg-muted"
                )}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted -z-10">
          <div
            className="h-full bg-primary transition-all duration-700 ease-in-out"
            style={{ 
              width: isCancelled ? '0%' : `${(currentStageIndex / (deliveryStages.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Stage Indicators */}
        {deliveryStages.map((stage, index) => {
          const Icon = stage.icon;
          const isCompleted = index < currentStageIndex || currentStatus === 'delivered';
          const isCurrent = index === currentStageIndex && !isCancelled;
          
          return (
            <div key={stage.key} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground scale-110",
                  isCurrent && "bg-primary/10 border-primary text-primary animate-pulse",
                  !isCompleted && !isCurrent && "bg-background border-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium text-center transition-colors",
                  (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 text-center text-sm text-destructive font-medium">
          Order Cancelled
        </div>
      )}
    </div>
  );
}
