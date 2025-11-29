import { Store, Home, Package } from 'lucide-react';

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border shadow-lg rounded-lg p-3 text-xs z-[1000]">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,36%)] border border-white shadow-sm" />
          <Store className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground">Pharmacy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(221,83%,53%)] border border-white shadow-sm" />
          <Home className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground">Delivery Address</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[hsl(25,95%,53%)] border border-white shadow-sm" />
          <Package className="w-3 h-3 text-muted-foreground" />
          <span className="font-medium text-foreground">Delivery Partner</span>
        </div>
      </div>
    </div>
  );
}
